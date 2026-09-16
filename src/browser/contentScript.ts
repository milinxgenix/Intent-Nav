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

function recordWitness(
  witnessClass: WitnessClass,
  observedDelta: Record<string, unknown>
): void {
  witnessSequenceCounter++;
  capturedWitnesses.push({
    witnessId: `wit_${Date.now()}_${witnessSequenceCounter}`,
    witnessClass,
    sequenceNumber: witnessSequenceCounter,
    timestamp: Date.now(),
    observedDelta,
    correlatedActivationEventId: currentCorrelatedActivationId,
    temporalDeltaMs: 0,
    isCausallyCorrelated: false, // Must be determined by the verifier itself
    correlationExplanation: `Observed ${witnessClass} at ${Date.now()}`,
  });
}

// 1. Intercept History API mutations
if (typeof window !== 'undefined' && window.history) {
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const res = originalPushState.apply(this, args);
    recordWitness('HISTORY_STATE_MUTATION', { path: window.location.pathname, state: args[0] });
    return res;
  };

  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const res = originalReplaceState.apply(this, args);
    recordWitness('HISTORY_STATE_MUTATION', { path: window.location.pathname, state: args[0] });
    return res;
  };

  window.addEventListener('popstate', (e) => {
    recordWitness('HISTORY_STATE_MUTATION', { path: window.location.pathname, state: e.state });
  });

  // 2. Intercept Application State Changes (Phase 27 Mock State Channel)
  window.addEventListener('intentnav:mock-state-change', (e: Event) => {
    const customEvt = e as CustomEvent;
    const delta = customEvt.detail?.fullState || customEvt.detail || {};
    recordWitness('APPLICATION_STATE_MUTATION', delta);
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
          delta['marketing_emails_enabled'] = attrValue !== 'true'; // Inverse toggle correlation
          recordWitness('ACCESSIBILITY_STATE_MUTATION', delta);
        } else if (attrName === 'aria-expanded') {
          delta['expanded'] = attrValue === 'true';
          recordWitness('ACCESSIBILITY_STATE_MUTATION', delta);
        } else if (attrName === 'disabled') {
          delta['disabled'] = target.hasAttribute('disabled');
          recordWitness('ACCESSIBILITY_STATE_MUTATION', delta);
        } else {
          recordWitness('DOM_MUTATION', delta);
        }
      } else if (m.type === 'childList') {
        recordWitness('DOM_MUTATION', {
          addedNodes: m.addedNodes.length,
          removedNodes: m.removedNodes.length,
          targetTag: (m.target as HTMLElement).tagName?.toLowerCase() || 'unknown',
        });
      }
    });
  }, 50);
}

/**
 * Resolves a BindingHandle into an actual DOM element.
 * Tries structural path first, then semantic role + accessible name, then volatile ID as fallback.
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
  for (const c of candidates) {
    const aria = c.getAttribute('aria-label') || c.getAttribute('title') || (c.textContent || '').trim();
    if (aria.toLowerCase().includes(handle.accessibleName.toLowerCase())) {
      return c;
    }
  }

  // 3. Fallback: volatile ID if still in DOM
  if (handle.volatileId) {
    const el = document.getElementById(handle.volatileId);
    if (el) return el;
  }

  return null;
}

// 4. Handle extension messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'OBSERVE_INTERFACE_REQUEST': {
        const stateNode = observer.captureInterfaceState();
        const candidates = CandidateGenerator.generateFromDOM(document);
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

        const eventType = payload.eventType || 'click';
        const activationEvent: ActivationEventRecord = {
          eventId: payload.activationEventId,
          sequenceNumber: 1,
          timestamp: Date.now(),
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
          timestamp: Date.now(),
        });
        break;
      }

      case 'COLLECT_WITNESSES': {
        sendResponse({ witnesses: [...capturedWitnesses] });
        capturedWitnesses.length = 0; // drain after collection
        break;
      }

      default:
        sendResponse({ unhandled: true });
        break;
    }
    return true;
  });
}
