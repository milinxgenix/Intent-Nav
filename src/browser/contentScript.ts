/**
 * IntentNav-SCFR: Browser Content Script
 * Bridges DOM observations, activation event dispatch, and witness capture to extension background
 */

import { InterfaceObserver } from './observer/interfaceObserver';
import { CandidateGenerator } from '../core/candidate/generator';
import { ExtensionMessage } from '../types/messages';
import { WitnessClass } from '../types/transition';

const observer = new InterfaceObserver();

// Monitor runtime mutations as transition witnesses
const capturedWitnesses: Array<{ witnessClass: WitnessClass; delta: Record<string, unknown>; timestamp: number }> = [];

if (typeof window !== 'undefined') {
  observer.observeMutations(() => {
    capturedWitnesses.push({
      witnessClass: 'DOM_MUTATION',
      delta: { url: window.location.pathname, title: document.title },
      timestamp: Date.now(),
    });
  }, 100);

  // Monitor history / route changes
  window.addEventListener('popstate', () => {
    capturedWitnesses.push({
      witnessClass: 'HISTORY_STATE_MUTATION',
      delta: { path: window.location.pathname },
      timestamp: Date.now(),
    });
  });
}

// Handle extension messages
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
        const payload = message.payload as { candidateId: string; selector?: string };
        let targetEl: HTMLElement | null = null;

        if (payload.selector) {
          targetEl = document.querySelector(payload.selector);
        }
        if (!targetEl) {
          targetEl = document.querySelector(`[data-capability-id="${payload.candidateId}"]`);
        }
        if (!targetEl) {
          targetEl = document.getElementById(payload.candidateId);
        }

        if (targetEl) {
          targetEl.click();
          sendResponse({ success: true, timestamp: Date.now() });
        } else {
          sendResponse({ success: false, reason: 'Target element not found in DOM' });
        }
        break;
      }

      case 'COLLECT_WITNESSES': {
        sendResponse({ witnesses: [...capturedWitnesses] });
        capturedWitnesses.length = 0; // drain
        break;
      }

      default:
        sendResponse({ unhandled: true });
        break;
    }
    return true; // Keep message channel open for async response
  });
}
