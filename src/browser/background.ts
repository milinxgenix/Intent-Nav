/**
 * IntentNav-SCFR: Background Service Worker (Manifest V3)
 * Orchestrates the closed-loop navigation engine and maintains state across tabs
 */

import { IntentNavMachine, ExecutionDispatcher } from '../core/stateMachine/machine';
import { ExtensionMessage } from '../types/messages';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../core/capability/catalog';

const machine = new IntentNavMachine();

AUTHORITATIVE_CAPABILITY_CATALOG.forEach((cap) => machine.registerCapability(cap));
machine.init().catch(console.error);

// Real browser Execution Dispatcher communicating with Content Script
class BrowserExecutionDispatcher implements ExecutionDispatcher {
  constructor(private tabId: number) {}

  async dispatchActivation(
    activationEventId: string,
    candidate: any,
    capabilityId: string
  ): Promise<{ success: boolean; activationEvent?: any; reason?: string }> {
    try {
      const actTimestamp = Date.now();
      const resp = await chrome.tabs.sendMessage(this.tabId, {
        type: 'DISPATCH_ACTIVATION_EVENT',
        payload: {
          activationEventId,
          activationTimestamp: actTimestamp,
          bindingHandle: candidate.bindingHandle,
          capabilityId,
        },
        timestamp: actTimestamp,
        messageId: `act_${actTimestamp}`,
      });
      if (resp && resp.success) {
        return {
          success: true,
          activationEvent: resp.activationEvent,
        };
      }
      return { success: false, reason: resp?.reason || 'Browser dispatch rejected by content script' };
    } catch (err: any) {
      return { success: false, reason: err.message || 'Tab communication error during dispatch' };
    }
  }

  async collectWitnesses(): Promise<any[]> {
    try {
      // Allow DOM mutations and async events to settle and be captured by InterfaceObserver
      await new Promise((resolve) => setTimeout(resolve, 150));
      const resp = await chrome.tabs.sendMessage(this.tabId, {
        type: 'COLLECT_WITNESSES',
        payload: {},
        timestamp: Date.now(),
        messageId: `wit_${Date.now()}`,
      });
      return resp?.witnesses || [];
    } catch {
      return [];
    }
  }

  async observePostState(): Promise<any> {
    try {
      const resp = await chrome.tabs.sendMessage(this.tabId, {
        type: 'OBSERVE_POST_STATE',
        payload: {},
        timestamp: Date.now(),
        messageId: `post_${Date.now()}`,
      });
      if (resp && resp.stateNode) {
        return resp.stateNode;
      }
      throw new Error('Tab did not return valid post-state stateNode');
    } catch (err: any) {
      throw new Error(`Tab communication error during post-state observation: ${err.message}`);
    }
  }
}

/**
 * Directly processes a functional navigation intent by querying the active web tab,
 * delegating observation and dispatch to contentScript via chrome.tabs, and running
 * the complete IntentNav state machine.
 */
export async function processIntentDirect(
  goal: string,
  options: {
    userConfirmationGranted?: boolean;
    tabId?: number;
    corruptPromotionToken?: boolean;
    executeQuarantinedRoute?: boolean;
    targetRouteId?: string;
  } = {}
): Promise<{ success: boolean; context: any; auditLog?: any }> {
  let tabId = options.tabId;
  if (!tabId && typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const tabs = await chrome.tabs.query({ active: true });
      const targetTab =
        tabs.find(
          (t) =>
            t.url &&
            (t.url.startsWith('http://localhost') || t.url.startsWith('http://127.0.0.1'))
        ) || tabs[0];
      tabId = targetTab?.id;
    } catch {}
  }

  let observedFeatures = {
    tag: 'body',
    observedActionType: 'VIEW',
    observedTargetEntity: 'UNKNOWN',
  };
  let availableCandidates: any[] = [];
  let dispatcher: ExecutionDispatcher | undefined;

  if (tabId && typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const obsResp = await chrome.tabs.sendMessage(tabId, {
        type: 'OBSERVE_INTERFACE_REQUEST',
        payload: {},
        timestamp: Date.now(),
        messageId: `msg_${Date.now()}`,
      });
      if (obsResp) {
        availableCandidates = obsResp.candidates || [];
        if (obsResp.stateNode) {
          observedFeatures.tag = obsResp.stateNode.activeTabs?.[0] || 'body';
        }
      }
      dispatcher = new BrowserExecutionDispatcher(tabId);
    } catch (err: any) {
      console.warn('[Background] Tab observation communication failed:', err?.message);
    }
  }

  const resultContext = await machine.processIntent(
    goal,
    observedFeatures,
    availableCandidates,
    options.userConfirmationGranted ?? false,
    dispatcher,
    options
  );

  return {
    success: resultContext.currentState === 'EXECUTED',
    context: resultContext,
    auditLog: machine.auditLogger.exportLog(),
  };
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).processIntentDirect = processIntentDirect;
  (globalThis as any).intentNavMachine = machine;
}

// Handle extension messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'PROCESS_INTENT': {
          const payload = message.payload as {
            goal: string;
            userConfirmationGranted?: boolean;
            tabId?: number;
          };
          const res = await processIntentDirect(payload.goal, {
            userConfirmationGranted: payload.userConfirmationGranted,
            tabId: payload.tabId,
          });
          sendResponse(res);
          break;
        }

        case 'EXPORT_AUDIT_LOG': {
          const logExport = machine.auditLogger.exportLog();
          sendResponse({ success: true, logExport });
          break;
        }

        case 'GET_SYSTEM_STATE': {
          sendResponse({
            state: machine.state,
            context: machine.context,
            capabilities: machine.getRegisteredCapabilities(),
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

