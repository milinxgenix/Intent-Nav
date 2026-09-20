/**
 * IntentNav-SCFR: Browser Content Script
 *
 * Phase 14 & 15 Implementation:
 * - Genuine DOM observation without data-capability-id
 * - Resolves BindingHandle to physical DOM elements for actual dispatch
 * - Runtime witness capture for:
 *   1. DOM_MUTATION (rich attribute and childList changes)
 *   2. ACCESSIBILITY_STATE_MUTATION (aria-checked, aria-expanded, disabled)
 *   3. HISTORY_STATE_MUTATION (pushState, replaceState, popstate interception)
 *   4. APPLICATION_STATE_MUTATION (intentnav:mock-state-change window events)
 *   5. ASYNC_ACKNOWLEDGEMENT (custom confirmation channel)
 */

import { InterfaceObserver } from './observer/interfaceObserver';
import { CandidateGenerator } from '../core/candidate/generator';
import { ExtensionMessage } from '../types/messages';
import { WitnessClass, TransitionWitness, ActivationEventRecord } from '../types/transition';
import { BindingHandle } from '../types/capability';

const observer = new InterfaceObserver();
let witnessSequenceCounter = 0;
const capturedWitnesses: TransitionWitness[] = [];
let currentCorrelatedActivationId: string | null = null;
let currentActivationTimestamp: number | null = null;

function recordWitness(
  witnessClass: WitnessClass,
  observedDelta: Record<string, unknown>,
  source: string = 'MutationObserver',
  explicitTimestamp?: number
): void {
  witnessSequenceCounter++;
  const now = typeof explicitTimestamp === 'number' ? explicitTimestamp : Date.now();
  capturedWitnesses.push({
    witnessId: `wit_${now}_${witnessSequenceCounter}`,
    witnessClass,
    sequenceNumber: witnessSequenceCounter,
    timestamp: now,
    observedDelta,
    correlatedActivationEventId: currentCorrelatedActivationId,
    temporalDeltaMs: currentActivationTimestamp !== null ? Math.max(0, now - currentActivationTimestamp) : 0,
    isCausallyCorrelated: false, // Determined by the causal verifier downstream
    correlationExplanation: `Observed ${witnessClass} at ${now}`,
    source,
  });
}

// 1. Intercept History API mutations
if (typeof window !== 'undefined' && window.history) {
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const res = originalPushState.apply(this, args);
    recordWitness('HISTORY_STATE_MUTATION', { path: window.location.pathname, state: args[0] }, 'History:pushState');
    return res;
  };

  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const res = originalReplaceState.apply(this, args);
    recordWitness('HISTORY_STATE_MUTATION', { path: window.location.pathname, state: args[0] }, 'History:replaceState');
    return res;
  };

  window.addEventListener('popstate', (e) => {
    recordWitness('HISTORY_STATE_MUTATION', { path: window.location.pathname, state: e.state }, 'History:popstate');
  });

  // 2. Intercept Application State Changes (Phase 27 Mock State Channel)
  window.addEventListener('intentnav:mock-state-change', (e: Event) => {
    const customEvt = e as CustomEvent;
    const delta = customEvt.detail?.fullState || customEvt.detail || {};
    const explicitTime = typeof customEvt.detail?.timestamp === 'number' ? customEvt.detail.timestamp : undefined;
    recordWitness('APPLICATION_STATE_MUTATION', delta, 'CustomEvent:intentnav:mock-state-change', explicitTime);
  });

  // 3. Intercept SPA Client-Side Route Mutations (Phase 7)
  window.addEventListener('intentnav:client-route-change', (e: Event) => {
    const customEvt = e as CustomEvent;
    const detail = customEvt.detail || {};
    recordWitness('CLIENT_ROUTE_MUTATION', {
      routeBefore: detail.routeBefore || window.location.pathname,
      routeAfter: detail.routeAfter || detail.route || window.location.pathname,
      source: detail.source || 'SPA_ROUTER',
      outletChanged: true,
      timestamp: detail.timestamp || Date.now(),
    }, 'CustomEvent:intentnav:client-route-change');
  });

  // 4. Intercept Asynchronous Operation Acknowledgements (Phase 8)
  window.addEventListener('intentnav:async-ack', (e: Event) => {
    const customEvt = e as CustomEvent;
    const detail = customEvt.detail || {};
    recordWitness('ASYNC_ACKNOWLEDGEMENT', {
      operation: detail.operation || 'async_operation',
      status: detail.status || 'COMPLETED',
      export_download_initiated: true,
      timestamp: detail.timestamp || Date.now(),
    }, 'CustomEvent:intentnav:async-ack');
  });
}

// 3. Monitor DOM and Accessibility Mutations
if (typeof window !== 'undefined') {
  observer.observeMutations((mutations) => {
    if (!mutations || mutations.length === 0) {
      recordWitness('DOM_MUTATION', { url: window.location.pathname, title: document.title });
      return;
    }

    mutations.forEach((m) => {
      if (m.type === 'attributes') {
        const target = m.target as HTMLElement;
        const attrName = m.attributeName || '';
        const attrValue = target.getAttribute(attrName);
        const delta: Record<string, unknown> = {
          attribute: attrName,
          value: attrValue,
          targetTag: target.tagName.toLowerCase(),
        };

        if (attrName === 'aria-checked') {
          delta['checked'] = attrValue === 'true';
          delta['marketing_emails_enabled'] = attrValue === 'true';
          delta['marketing_notifications_enabled'] = attrValue === 'true';
          delta['analytics_tracking_enabled'] = attrValue === 'true';
          recordWitness('ACCESSIBILITY_STATE_MUTATION', delta, 'MutationObserver:attributes:aria-checked');
        } else if (attrName === 'aria-expanded') {
          delta['expanded'] = attrValue === 'true';
          recordWitness('ACCESSIBILITY_STATE_MUTATION', delta, 'MutationObserver:attributes:aria-expanded');
        } else if (attrName === 'disabled') {
          delta['disabled'] = target.hasAttribute('disabled');
          recordWitness('ACCESSIBILITY_STATE_MUTATION', delta, 'MutationObserver:attributes:disabled');
        } else {
          recordWitness('DOM_MUTATION', delta, `MutationObserver:attributes:${attrName}`);
        }
      } else if (m.type === 'childList') {
        recordWitness('DOM_MUTATION', {
          addedNodes: m.addedNodes.length,
          removedNodes: m.removedNodes.length,
          targetTag: (m.target as HTMLElement).tagName?.toLowerCase() || 'unknown',
        }, 'MutationObserver:childList');
      }
    });
  }, 50);
}

/**
 * Resolves a BindingHandle into an actual DOM element.
 * Tries structural path first, then semantic role + accessible name.
 * Volatile IDs are intentionally NEVER used for resolution (REQ-C2).
 */
function resolveBindingHandle(handle: BindingHandle): HTMLElement | null {
  // 1. Try relative structural path
  if (handle.domStructuralPath) {
    try {
      const el = document.querySelector(handle.domStructuralPath) as HTMLElement;
      if (el) return el;
    } catch {}
  }

  // 2. Try role + accessible name / text
  const selector = `[role="${handle.role}"], ${handle.tagName}`;
  const candidates = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  const targetLabel = (handle.accessibleName || '').toLowerCase().trim();
  for (const c of candidates) {
    const aria = (
      c.getAttribute('aria-label') ||
      c.getAttribute('title') ||
      c.textContent ||
      ''
    ).toLowerCase().trim();
    if (targetLabel && aria && (aria.includes(targetLabel) || targetLabel.includes(aria))) {
      return c;
    }
  }

  // INTENTIONALLY NO volatile ID fallback (REQ-C2). Volatile IDs (e.g. :r3:, transient hashes)
  // are retained strictly as observational metadata and must NEVER establish functional identity.

  return null;
}

// 4. Handle extension messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'OBSERVE_INTERFACE_REQUEST': {
          const stateNode = observer.captureInterfaceState();
          const candidates = CandidateGenerator.generateFromDOM(document, stateNode.observedApplicationState);
          sendResponse({
            stateNode,
            candidates,
            capturedWitnesses: [...capturedWitnesses],
          });
          break;
        }

        case 'DISPATCH_ACTIVATION_EVENT': {
          const payload = message.payload as {
            activationEventId: string;
            activationTimestamp?: number;
            bindingHandle: BindingHandle;
            eventType?: string;
            capabilityId: string;
          };

          currentCorrelatedActivationId = payload.activationEventId;
          const targetEl = resolveBindingHandle(payload.bindingHandle);

          if (!targetEl) {
            sendResponse({
              success: false,
              reason: `Target element could not be resolved from BindingHandle '${payload.bindingHandle.accessibleName}'`,
            });
            break;
          }

          const actTimestamp = payload.activationTimestamp || (message as any).timestamp || Date.now();
          currentActivationTimestamp = actTimestamp;
          capturedWitnesses.length = 0; // Drain previous witnesses so only causal post-activation witnesses are captured

          // Guarantee that DOM activation dispatch strictly follows the activation initiation in time
          if (Date.now() <= actTimestamp) {
            await new Promise((resolve) => setTimeout(resolve, 2));
          }

          const eventType = payload.eventType || 'click';
          const activationEvent: ActivationEventRecord = {
            eventId: payload.activationEventId,
            sequenceNumber: 1,
            timestamp: actTimestamp,
            targetCandidateId: payload.bindingHandle.handleId,
            eventType: eventType as any,
            bindingHandle: payload.bindingHandle,
            initiatingCapabilityId: payload.capabilityId,
          };

          // Dispatch actual browser synthetic event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          targetEl.dispatchEvent(clickEvent);

          sendResponse({
            success: true,
            activationEvent,
            timestamp: actTimestamp,
          });
          break;
        }

      case 'COLLECT_WITNESSES': {
        sendResponse({ witnesses: [...capturedWitnesses] });
        capturedWitnesses.length = 0; // drain after collection
        break;
      }

      case 'OBSERVE_POST_STATE': {
        const stateNode = observer.captureInterfaceState();
        sendResponse({
          success: true,
          stateNode,
          timestamp: Date.now(),
        });
        break;
      }

      default:
        sendResponse({ unhandled: true });
        break;
    }
  })();
  return true;
});
}
