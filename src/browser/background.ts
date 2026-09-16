/**
 * IntentNav-SCFR: Background Service Worker (Manifest V3)
 * Orchestrates the closed-loop navigation engine and maintains state across tabs
 */

import { IntentNavMachine } from '../core/stateMachine/machine';
import { ExtensionMessage } from '../types/messages';
import { FunctionalCapabilityFingerprint } from '../types/capability';

const machine = new IntentNavMachine();

// Pre-register benchmark capabilities
const DEFAULT_CAPABILITIES: FunctionalCapabilityFingerprint[] = [
  {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'marketing_emails_enabled', expectedValue: false }],
    requiredContextPredicates: [{ target: 'container', pattern: 'notification', required: true }],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing emails',
      semanticSynonyms: [
        'turn off promotional emails',
        'stop marketing messages',
        'opt out of marketing notifications',
        'unsubscribe from marketing',
      ],
      accessibleName: 'Marketing email notifications toggle',
      role: 'switch',
      visibleLabel: 'Marketing Communications',
      sectionMeaning: 'Notifications > Preferences',
      actionDescription: 'Disable promotional and marketing email communication',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Notifications]', 'main[Settings]'],
      nearbyText: ['Receive promotional offers and discounts'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications', 'settings'],
      menuPanelRelationships: ['Notifications'],
      relativeStructuralRelationships: ['div > section:nth-of-type(2) > button'],
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
      rejectedCandidateIdentities: [],
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
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [],
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
      ],
      accessibleName: 'Export personal data button',
      role: 'button',
      visibleLabel: 'Download Your Data',
      sectionMeaning: 'Privacy > Personal Data',
      actionDescription: 'Export personal data archive',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Privacy]', 'main[Settings]'],
      nearbyText: ['Download a copy of your personal data archive'],
      surroundingLabels: ['Download Your Data'],
      containerSemantics: ['privacy', 'settings'],
      menuPanelRelationships: ['Privacy'],
      relativeStructuralRelationships: ['div > section:nth-of-type(3) > button'],
      urlSemantics: '/settings/privacy',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_STATE_READY',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { export_download_initiated: true },
      postStateFingerprint: 'POST_STATE_DOWNLOADED',
      historicalTransitionObservations: 8,
      witnessClasses: ['DOM_MUTATION', 'ASYNC_ACKNOWLEDGEMENT'],
      verificationWindowMs: 3000,
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
      capabilityConfidence: 0.90,
      routeConfidence: 0.85,
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
    mandatoryPreStatePredicates: [],
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
      containerSemantics: ['security', 'settings'],
      menuPanelRelationships: ['Security'],
      relativeStructuralRelationships: ['div > section:nth-of-type(4) > button'],
      urlSemantics: '/settings/security',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_STATE_2FA_ACTIVE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { two_factor_enabled: false },
      postStateFingerprint: 'POST_STATE_2FA_DISABLED',
      historicalTransitionObservations: 4,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      verificationWindowMs: 2500,
    },
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: false,
      financial: false,
      security: true,
      destructive: true,
      requiresConfirmation: true, // MANDATORY CONFIRMATION
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

          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
              const obsResp = await chrome.tabs.sendMessage(tab.id, {
                type: 'OBSERVE_INTERFACE_REQUEST',
                payload: {},
                timestamp: Date.now(),
                messageId: `msg_${Date.now()}`,
              });
              if (obsResp) {
                availableCandidates = obsResp.candidates || [];
              }
            }
          } catch {
            // Tab not responsive, fallback to registered mock candidates
          }

          const resultContext = await machine.processIntent(
            payload.goal,
            observedFeatures,
            availableCandidates,
            payload.userConfirmationGranted ?? false
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
