/**
 * IntentNav-SCFR: Background Service Worker (Manifest V3)
 * Orchestrates the closed-loop navigation engine and maintains state across tabs
 * Uses real ExecutionDispatcher for actual content-script browser activation and witness collection.
 */

import { IntentNavMachine, ExecutionDispatcher } from '../core/stateMachine/machine';
import { ExtensionMessage } from '../types/messages';
import { FunctionalCapabilityFingerprint } from '../types/capability';
import { PersistentCapabilityStore } from '../core/storage/persistentStore';
import { AuditLogger } from '../core/audit/logger';

const store = new PersistentCapabilityStore();
const auditLogger = new AuditLogger();
const machine = new IntentNavMachine(auditLogger, store);

// Pre-register canonical capabilities with complete authoritative invariant predicates
const DEFAULT_CAPABILITIES: FunctionalCapabilityFingerprint[] = [
  {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'TOGGLE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [
      {
        id: 'pred_marketing_interactive',
        name: 'Control Interactive',
        description: 'Control must not be disabled and ready for toggle',
        evaluate: (ctx) => ctx['disabled'] !== true,
      },
    ],
    allowedStateDelta: [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'marketing_emails_enabled', expectedValue: false }],
    requiredContextPredicates: [{ target: 'container', pattern: 'notification', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'all notification', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing emails',
      semanticSynonyms: [
        'turn off promotional emails',
        'stop marketing messages',
        'opt out of marketing notifications',
        'unsubscribe from marketing',
        'stop promotional bulletins',
        'turn off marketing notifications',
      ],
      accessibleName: 'Marketing email notifications toggle',
      role: 'switch',
      visibleLabel: 'Marketing Communications',
      sectionMeaning: 'Notifications > Preferences',
      actionDescription: 'Disable promotional and marketing email communication',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Notifications]', 'main[Settings]'],
      nearbyText: ['Receive promotional offers and discounts', 'Promotional bulletins'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications', 'settings', 'bulletins', 'preferences'],
      menuPanelRelationships: ['Notifications'],
      relativeStructuralRelationships: ['main > section:nth-of-type(2) > div > button'],
      urlSemantics: '/settings/notifications',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_STATE_MARKETING_ENABLED',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_emails_enabled: false },
      postStateFingerprint: 'POST_STATE_MARKETING_DISABLED',
      historicalTransitionObservations: 12,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      verificationWindowMs: 2000,
    },
    riskMetadata: {
      riskClass: 'REVERSIBLE',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: Date.now(),
      validationTimestamp: Date.now(),
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.95,
      routeConfidence: 0.90,
    },
    negativeEvidence: {
      rejectedCandidateIdentities: ['ALL_NOTIFICATIONS'],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  },
  {
    capabilityId: 'CAP_EXPORT_DATA',
    canonicalFunction: 'export_personal_data',
    actionType: 'EXPORT_DATA',
    targetEntity: 'PERSONAL_DATA_EXPORT',
    mandatoryPreStatePredicates: [
      {
        id: 'pred_export_interactive',
        name: 'Export Enabled',
        description: 'Export button must be interactive',
        evaluate: (ctx) => ctx['disabled'] !== true,
      },
    ],
    allowedStateDelta: [{ property: 'export_download_initiated', expectedChange: 'ADDED' }],
    expectedPostState: [{ property: 'export_download_initiated', expectedValue: true }],
    requiredContextPredicates: [{ target: 'container', pattern: 'privacy', required: true }],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Export personal data',
      semanticSynonyms: [
        'download personal information',
        'export my data',
        'download everything you have about me',
        'request data archive',
        'download personal information',
        'export my data archive',
      ],
      accessibleName: 'Export personal data button',
      role: 'button',
      visibleLabel: 'Download Your Data',
      sectionMeaning: 'Privacy & Data Protection',
      actionDescription: 'Export personal data archive',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Privacy]', 'main[Settings]'],
      nearbyText: ['Download archive of all personal information and activity'],
      surroundingLabels: ['Personal Data Archive'],
      containerSemantics: ['privacy', 'settings', 'data-hub', 'data rights'],
      menuPanelRelationships: ['Privacy'],
      relativeStructuralRelationships: ['main > section:nth-of-type(1) > div > button'],
      urlSemantics: '/settings/privacy',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_STATE_EXPORT_IDLE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { export_download_initiated: true },
      postStateFingerprint: 'POST_STATE_EXPORT_INITIATED',
      historicalTransitionObservations: 8,
      witnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2000,
    },
    riskMetadata: {
      riskClass: 'SENSITIVE',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: Date.now(),
      validationTimestamp: Date.now(),
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.92,
      routeConfidence: 0.88,
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  },
  {
    capabilityId: 'CAP_DISABLE_2FA',
    canonicalFunction: 'disable_two_factor_auth',
    actionType: 'REVOKE_ACCESS',
    targetEntity: 'TWO_FACTOR_AUTH',
    mandatoryPreStatePredicates: [
      {
        id: 'pred_2fa_interactive',
        name: '2FA Button Enabled',
        description: '2FA control must not be disabled',
        evaluate: (ctx) => ctx['disabled'] !== true,
      },
    ],
    allowedStateDelta: [{ property: 'two_factor_enabled', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'two_factor_enabled', expectedValue: false }],
    requiredContextPredicates: [{ target: 'container', pattern: 'security', required: true }],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable two-factor authentication',
      semanticSynonyms: [
        'turn off 2fa',
        'remove two factor authentication',
        'disable mfa',
        'turn off multi-factor auth',
        'remove 2fa security',
      ],
      accessibleName: 'Disable two-factor authentication button',
      role: 'button',
      visibleLabel: 'Turn Off 2FA',
      sectionMeaning: 'Security > Two-Factor Authentication',
      actionDescription: 'Disable multi-factor security protection',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Security]', 'main[Settings]'],
      nearbyText: ['Two-factor authentication adds an extra layer of security'],
      surroundingLabels: ['Two-Factor Authentication'],
      containerSemantics: ['security', 'settings', 'security-hub', 'authentication'],
      menuPanelRelationships: ['Security'],
      relativeStructuralRelationships: ['main > section:nth-of-type(3) > div > button'],
      urlSemantics: '/settings/security',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_STATE_2FA_ACTIVE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { two_factor_enabled: false },
      postStateFingerprint: 'POST_STATE_2FA_DISABLED',
      historicalTransitionObservations: 4,
      witnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2500,
    },
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: false,
      financial: false,
      security: true,
      destructive: true,
      requiresConfirmation: true, // MANDATORY USER CONFIRMATION
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: Date.now(),
      validationTimestamp: Date.now(),
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.96,
      routeConfidence: 0.92,
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  },
];

DEFAULT_CAPABILITIES.forEach((cap) => machine.registerCapability(cap));

// Handle extension messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'PROCESS_INTENT': {
          const payload = message.payload as { goal: string; userConfirmationGranted?: boolean };

          // Query active tab for observations
          let observedFeatures = {
            tag: 'body',
            observedActionType: 'VIEW',
            observedTargetEntity: 'UNKNOWN',
          };
          let availableCandidates: any[] = [];
          let executionDispatcher: ExecutionDispatcher | undefined;

          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
              const activeTabId = tab.id;
              const obsResp = await chrome.tabs.sendMessage(activeTabId, {
                type: 'OBSERVE_INTERFACE_REQUEST',
                payload: {},
                timestamp: Date.now(),
                messageId: `msg_${Date.now()}`,
              });
              if (obsResp) {
                availableCandidates = obsResp.candidates || [];
              }

              // Phase 14 & 25: Real Content-Script Dispatcher
              executionDispatcher = {
                async dispatchActivation(activationEventId, candidate, capabilityId) {
                  const resp = await chrome.tabs.sendMessage(activeTabId, {
                    type: 'DISPATCH_ACTIVATION_EVENT',
                    payload: {
                      activationEventId,
                      bindingHandle: candidate.bindingHandle,
                      capabilityId,
                    },
                    timestamp: Date.now(),
                    messageId: `act_${Date.now()}`,
                  });
                  return resp || { success: false, reason: 'No response from tab' };
                },
                async collectWitnesses() {
                  // Allow asynchronous transition mutation events to settle
                  await new Promise((r) => setTimeout(r, 150));
                  const resp = await chrome.tabs.sendMessage(activeTabId, {
                    type: 'COLLECT_WITNESSES',
                    payload: {},
                    timestamp: Date.now(),
                    messageId: `wit_${Date.now()}`,
                  });
                  return resp?.witnesses || [];
                },
              };
            }
          } catch {
            // Tab not responsive or test environment
          }

          const resultContext = await machine.processIntent(
            payload.goal,
            observedFeatures,
            availableCandidates,
            payload.userConfirmationGranted ?? false,
            executionDispatcher
          );

          sendResponse({ success: true, context: resultContext });
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
