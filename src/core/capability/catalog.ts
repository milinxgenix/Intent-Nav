/**
 * IntentNav-SCFR: Benchmark Test Fixture Catalog & Generic Capability Factory
 *
 * Defines the canonical test fixture specifications for the 9 evaluation and benchmark
 * capabilities (Sites A–D).
 *
 * ARCHITECTURAL SEPARATION:
 * - Generic Pipeline: Operates on arbitrary FunctionalCapabilityFingerprint entities
 *   (action, target, preconditions, allowed delta, expected post-state, context, forbidden predicates, risk).
 * - Test Catalog: The 9 capabilities below serve as a controlled evaluation ontology for
 *   regression testing and empirical benchmarking. Production pipelines consume capability
 *   registrations dynamically rather than assuming a closed website vocabulary.
 */

import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { createDeclarativePredicate } from '../invariant/predicates';
import { FingerprintConstructor } from '../fingerprint/constructor';

export const AUTHORITATIVE_CAPABILITY_CATALOG: FunctionalCapabilityFingerprint[] = [
  // 1. CAP_DISABLE_MARKETING
  {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_notifications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_MARKETING_ENABLED',
        name: 'Marketing notifications enabled',
        description: 'Marketing notifications must be enabled prior to disabling',
        source: 'PRE_STATE',
        property: 'marketing_notifications_enabled',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    ],
    allowedStateDelta: [
      { property: 'marketing_notifications_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
    ],
    expectedPostState: [
      { property: 'marketing_notifications_enabled', expectedValue: false },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'marketing', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'delete_account', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Disable Marketing Notifications',
      semanticSynonyms: [
        'turn off promotional emails',
        'stop marketing notifications',
        'unsubscribe marketing',
        'opt out commercial emails',
        'stop promotional emails',
        'turn off marketing messages',
        'stop advertising notifications',
        'mute promotional offers',
        'disable marketing notifications now',
        'switch off commercial bulletins',
        'block marketing communication alerts',
      ],
      accessibleName: 'Disable marketing notifications',
      role: 'switch',
      visibleLabel: 'Promotional Notifications',
      sectionMeaning: 'Notifications > Marketing Preferences',
      actionDescription: 'Toggle marketing notifications from enabled to disabled',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Marketing Preferences]', 'form#notifications'],
      nearbyText: ['Receive promotional emails about special offers and deals'],
      surroundingLabels: ['Promotional Notifications'],
      containerSemantics: ['notifications', 'marketing'],
      menuPanelRelationships: ['Notifications'],
      relativeStructuralRelationships: ['form > div > label > input[type=checkbox]'],
      urlSemantics: '/settings/notifications',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_MARKETING_ON',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_notifications_enabled: false },
      postStateFingerprint: 'STATE_POST_MARKETING_OFF',
      historicalTransitionObservations: 12,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2500,
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
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.98,
      routeConfidence: 0.95,
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

  // 2. CAP_EXPORT_DATA
  {
    capabilityId: 'CAP_EXPORT_DATA',
    canonicalFunction: 'export_personal_data',
    actionType: 'EXPORT_DATA',
    targetEntity: 'PERSONAL_DATA_EXPORT',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_EXPORT_READY',
        name: 'Ready for personal data export',
        description: 'Export not already initiated',
        source: 'PRE_STATE',
        property: 'export_download_initiated',
        operator: 'EQUALS',
        expectedValue: false,
      }),
    ],
    allowedStateDelta: [
      { property: 'export_download_initiated', expectedChange: 'DISABLED_TO_ENABLED' },
    ],
    expectedPostState: [
      { property: 'export_download_initiated', expectedValue: true },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'privacy', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'DEACTIVATE', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Export personal data',
      semanticSynonyms: [
        'download personal information',
        'export my data',
        'download everything you have about me',
        'request data archive',
        'download gdpr personal data archive',
        'get a copy of all my account data',
        'request my personal records download',
        'save all my data locally',
        'export full history and profile information',
        'give me my personal data archive',
        'download my user records export',
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
      relativeStructuralRelationships: ['div > section > button'],
      urlSemantics: '/settings/privacy',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_EXPORT_READY',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { export_download_initiated: true },
      postStateFingerprint: 'STATE_POST_EXPORT_INITIATED',
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
      requiresConfirmation: true,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
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

  // 3. CAP_DISABLE_2FA
  {
    capabilityId: 'CAP_DISABLE_2FA',
    canonicalFunction: 'disable_two_factor_auth',
    actionType: 'TOGGLE',
    targetEntity: 'TWO_FACTOR_AUTH',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_2FA_ENABLED',
        name: 'Two-factor auth enabled',
        description: '2FA must be enabled to turn it off',
        source: 'PRE_STATE',
        property: 'two_factor_enabled',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    ],
    allowedStateDelta: [
      { property: 'two_factor_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
    ],
    expectedPostState: [
      { property: 'two_factor_enabled', expectedValue: false },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'security|authentication|mfa|2fa', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'billing', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Disable Two-Factor Authentication',
      semanticSynonyms: [
        'turn off 2FA',
        'remove multi-factor authentication',
        'stop asking for 2FA codes',
        'deactivate two-factor auth shield',
        'disable mfa security protection',
        'turn off two-step verification',
        'remove 2fa authenticator app link',
        'revoke two-factor authentication requirement',
        'disable 2fa security key',
      ],
      accessibleName: 'Disable two-factor authentication',
      role: 'button',
      visibleLabel: 'Disable 2FA',
      sectionMeaning: 'Security > Two-Factor Authentication',
      actionDescription: 'Disable multi-factor authentication security shield',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Security]', 'form#mfa-settings'],
      nearbyText: ['Two-Factor Authentication is currently active'],
      surroundingLabels: ['Disable 2FA'],
      containerSemantics: ['security', 'authentication'],
      menuPanelRelationships: ['Security'],
      relativeStructuralRelationships: ['section > div > button'],
      urlSemantics: '/settings/security',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_2FA_ON',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { two_factor_enabled: false },
      postStateFingerprint: 'STATE_POST_2FA_OFF',
      historicalTransitionObservations: 5,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2500,
    },
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: true,
      financial: false,
      security: true,
      destructive: false,
      requiresConfirmation: true,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.94,
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

  // 4. CAP_DEACTIVATE_ACCOUNT
  {
    capabilityId: 'CAP_DEACTIVATE_ACCOUNT',
    canonicalFunction: 'deactivate_user_account',
    actionType: 'DEACTIVATE_ACCOUNT',
    targetEntity: 'ACCOUNT_STATUS',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_ACCOUNT_ACTIVE',
        name: 'Account is currently active',
        description: 'Account must be active before it can be deactivated',
        source: 'PRE_STATE',
        property: 'account_active',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    ],
    allowedStateDelta: [
      { property: 'account_active', expectedChange: 'ENABLED_TO_DISABLED' },
    ],
    expectedPostState: [
      { property: 'account_active', expectedValue: false },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'account', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'theme', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Deactivate Account',
      semanticSynonyms: [
        'pause my account membership',
        'deactivate my profile temporarily',
        'temporarily suspend account',
        'put my subscription on hold',
        'take a hiatus from this platform',
        'hibernate my user account',
        'disable my account membership',
        'close or pause user account',
        'take a break from this account',
      ],
      accessibleName: 'Deactivate account button',
      role: 'button',
      visibleLabel: 'Deactivate Account',
      sectionMeaning: 'Account > Danger Zone',
      actionDescription: 'Temporarily deactivate user account membership',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Account Management]', 'div.danger-zone'],
      nearbyText: ['Deactivating will pause your account temporarily'],
      surroundingLabels: ['Deactivate Account'],
      containerSemantics: ['account', 'danger-zone'],
      menuPanelRelationships: ['Account'],
      relativeStructuralRelationships: ['div > section > button.danger'],
      urlSemantics: '/settings/account',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_ACCOUNT_ACTIVE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { account_active: false },
      postStateFingerprint: 'STATE_POST_ACCOUNT_DEACTIVATED',
      historicalTransitionObservations: 3,
      witnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 3000,
    },
    riskMetadata: {
      riskClass: 'DESTRUCTIVE',
      reversible: true,
      financial: false,
      security: false,
      destructive: true,
      requiresConfirmation: true,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.92,
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

  // 5. CAP_TOGGLE_TRACKING
  {
    capabilityId: 'CAP_TOGGLE_TRACKING',
    canonicalFunction: 'toggle_analytics_tracking',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'PRIVACY_SETTINGS',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_TRACKING_ON',
        name: 'Analytics tracking is enabled',
        description: 'Analytics tracking must be active to toggle it off',
        source: 'PRE_STATE',
        property: 'analytics_tracking_enabled',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    ],
    allowedStateDelta: [
      { property: 'analytics_tracking_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
    ],
    expectedPostState: [
      { property: 'analytics_tracking_enabled', expectedValue: false },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'privacy|telemetry|analytics|tracking', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'billing', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Disable Analytics Tracking',
      semanticSynonyms: [
        'turn off analytical tracking cookies',
        'disable telemetry and tracking',
        'opt out of behavioral analytics',
        'block analytics tracking',
        'stop sharing analytical usage data',
        'adjust tracking preferences',
        'turn off usage data collection',
        'change privacy data collection permissions',
        'disable user analytics telemetry',
      ],
      accessibleName: 'Toggle analytics tracking',
      role: 'switch',
      visibleLabel: 'Analytics & Tracking',
      sectionMeaning: 'Privacy > Tracking & Cookies',
      actionDescription: 'Toggle user behavioral analytics telemetry',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Privacy & Telemetry]', 'form#privacy'],
      nearbyText: ['Allow analytical usage telemetry to improve performance'],
      surroundingLabels: ['Analytics & Tracking'],
      containerSemantics: ['privacy', 'analytics'],
      menuPanelRelationships: ['Privacy'],
      relativeStructuralRelationships: ['form > div > label > input[type=checkbox]'],
      urlSemantics: '/settings/privacy',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_TRACKING_ON',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { analytics_tracking_enabled: false },
      postStateFingerprint: 'STATE_POST_TRACKING_OFF',
      historicalTransitionObservations: 10,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2500,
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
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.96,
      routeConfidence: 0.91,
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

  // 6. CAP_REVOKE_SESSIONS
  {
    capabilityId: 'CAP_REVOKE_SESSIONS',
    canonicalFunction: 'revoke_other_sessions',
    actionType: 'REVOKE_ACCESS',
    targetEntity: 'SECURITY_SETTINGS',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_SESSIONS_EXIST',
        name: 'Multiple active sessions exist',
        description: 'Must have more than 1 active session to revoke remote sessions',
        source: 'PRE_STATE',
        property: 'active_session_count',
        operator: 'GREATER_THAN',
        expectedValue: 1,
      }),
    ],
    allowedStateDelta: [
      { property: 'active_session_count', expectedChange: 'MODIFIED' },
    ],
    expectedPostState: [
      { property: 'active_session_count', expectedValue: 1 },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'security|session|device', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'marketing', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Revoke Active Sessions',
      semanticSynonyms: [
        'log out of all active devices',
        'revoke active login sessions',
        'disconnect other browsers and phones',
        'sign out of all other sessions',
        'terminate remote session tokens',
        'force logout across all devices',
        'invalidate other login credentials',
        'kill all background active logins',
        'clear my recognized devices list',
        'sign out everywhere immediately',
      ],
      accessibleName: 'Revoke other active sessions button',
      role: 'button',
      visibleLabel: 'Log Out All Devices',
      sectionMeaning: 'Security > Active Sessions',
      actionDescription: 'Sign out and invalidate session tokens across other devices',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Security]', 'div.session-list'],
      nearbyText: ['You are currently logged in on multiple devices'],
      surroundingLabels: ['Log Out All Devices'],
      containerSemantics: ['security', 'sessions'],
      menuPanelRelationships: ['Security'],
      relativeStructuralRelationships: ['section > div > button'],
      urlSemantics: '/settings/security',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_SESSIONS_EXIST',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { active_session_count: 1 },
      postStateFingerprint: 'STATE_POST_SESSIONS_REVOKED',
      historicalTransitionObservations: 6,
      witnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION', 'ASYNC_ACKNOWLEDGEMENT'],
      verificationWindowMs: 3000,
    },
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: true,
      financial: false,
      security: true,
      destructive: false,
      requiresConfirmation: true,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.95,
      routeConfidence: 0.89,
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

  // 7. CAP_TOGGLE_DARK_MODE
  {
    capabilityId: 'CAP_TOGGLE_DARK_MODE',
    canonicalFunction: 'toggle_dark_theme',
    actionType: 'TOGGLE',
    targetEntity: 'UI_THEME',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_THEME_NOT_DARK',
        name: 'Dark mode currently off',
        description: 'Dark mode must be off to toggle on',
        source: 'PRE_STATE',
        property: 'dark_mode_enabled',
        operator: 'EQUALS',
        expectedValue: false,
      }),
    ],
    allowedStateDelta: [
      { property: 'dark_mode_enabled', expectedChange: 'DISABLED_TO_ENABLED' },
    ],
    expectedPostState: [
      { property: 'dark_mode_enabled', expectedValue: true },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'appearance|theme|display', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'security', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Enable Dark Mode',
      semanticSynonyms: [
        'enable dark theme mode',
        'switch interface to dark mode',
        'turn on night mode appearance',
        'change theme palette to dark',
        'toggle dark display styling',
        'activate dark background contrast',
        'i want dark mode for my eyes',
        'switch from light to dark theme',
        'set appearance preferences to dark',
        'enable night reading color scheme',
      ],
      accessibleName: 'Toggle dark mode theme',
      role: 'switch',
      visibleLabel: 'Dark Theme',
      sectionMeaning: 'Appearance > Display Theme',
      actionDescription: 'Switch user interface color contrast to dark mode',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Appearance]', 'form#theme'],
      nearbyText: ['Switch between light and dark display theme'],
      surroundingLabels: ['Dark Theme'],
      containerSemantics: ['appearance', 'display'],
      menuPanelRelationships: ['Appearance'],
      relativeStructuralRelationships: ['form > div > label > input[type=checkbox]'],
      urlSemantics: '/settings/appearance',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_LIGHT_THEME',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { dark_mode_enabled: true },
      postStateFingerprint: 'STATE_POST_DARK_THEME',
      historicalTransitionObservations: 20,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 1500,
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
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.99,
      routeConfidence: 0.97,
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

  // 8. CAP_DOWNLOAD_INVOICE
  {
    capabilityId: 'CAP_DOWNLOAD_INVOICE',
    canonicalFunction: 'download_recent_invoice',
    actionType: 'DOWNLOAD',
    targetEntity: 'BILLING_PREFERENCES',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_INVOICE_AVAILABLE',
        name: 'Recent invoice is available for download',
        description: 'Must have an invoice generated to download',
        source: 'PRE_STATE',
        property: 'invoice_available',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    ],
    allowedStateDelta: [
      { property: 'invoice_download_triggered', expectedChange: 'DISABLED_TO_ENABLED' },
    ],
    expectedPostState: [
      { property: 'invoice_download_triggered', expectedValue: true },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'billing', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'delete_account', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Download Latest Invoice',
      semanticSynonyms: [
        'download my latest billing receipt',
        'get copy of recent payment invoice',
        'download subscription PDF receipt',
        'save latest charge statement',
        'export monthly billing invoice',
        'retrieve payment tax receipt',
        'download account billing statement',
        'get receipt for last transaction',
        'view and download recent invoice',
        'export payment billing records',
      ],
      accessibleName: 'Download invoice receipt',
      role: 'button',
      visibleLabel: 'Download Invoice',
      sectionMeaning: 'Billing > Invoice History',
      actionDescription: 'Download latest billing statement PDF receipt',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Billing & Payments]', 'table#invoices'],
      nearbyText: ['Invoice #2026-08 - $49.00 Paid on Sep 1, 2026'],
      surroundingLabels: ['Download Invoice'],
      containerSemantics: ['billing', 'payments'],
      menuPanelRelationships: ['Billing'],
      relativeStructuralRelationships: ['table > tr > td > button'],
      urlSemantics: '/settings/billing',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_INVOICE_READY',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { invoice_download_triggered: true },
      postStateFingerprint: 'STATE_POST_INVOICE_DOWNLOADED',
      historicalTransitionObservations: 7,
      witnessClasses: ['DOM_MUTATION', 'ASYNC_ACKNOWLEDGEMENT'],
      verificationWindowMs: 3000,
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
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
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

  // 9. CAP_VIEW_AUDIT_LOGS
  {
    capabilityId: 'CAP_VIEW_AUDIT_LOGS',
    canonicalFunction: 'view_security_audit_logs',
    actionType: 'VIEW',
    targetEntity: 'SECURITY_SETTINGS',
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: 'PRE_AUDIT_LOGS_AVAILABLE',
        name: 'Audit logs available',
        description: 'Audit records must exist to view activity trail',
        source: 'PRE_STATE',
        property: 'audit_logs_available',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    ],
    allowedStateDelta: [
      { property: 'audit_logs_visible', expectedChange: 'DISABLED_TO_ENABLED' },
    ],
    expectedPostState: [
      { property: 'audit_logs_visible', expectedValue: true },
    ],
    requiredContextPredicates: [{ target: 'container', pattern: 'security', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'marketing', required: false }],
    semanticEvidence: {
      canonicalLabel: 'View Security Audit Logs',
      semanticSynonyms: [
        'view account security audit log',
        'check login history and activity trail',
        'inspect recent authentication events',
        'show security access records',
        'display account audit trail',
        'review past sign-in timestamps',
        'open activity log and security history',
        'view suspicious sign-in alerts history',
        'show security audit event ledger',
        'examine account access logs',
      ],
      accessibleName: 'View security audit logs button',
      role: 'button',
      visibleLabel: 'View Activity History',
      sectionMeaning: 'Security > Activity & Audit',
      actionDescription: 'Open authentication history and security audit trail ledger',
    },
    contextEvidence: {
      ancestorRelationships: ['section[Security]', 'div.audit-section'],
      nearbyText: ['Recent account activity and device sign-in audit history'],
      surroundingLabels: ['View Activity History'],
      containerSemantics: ['security', 'audit'],
      menuPanelRelationships: ['Security'],
      relativeStructuralRelationships: ['section > div > button'],
      urlSemantics: '/settings/security',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_AUDIT_LOGS_CLOSED',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { audit_logs_visible: true },
      postStateFingerprint: 'STATE_POST_AUDIT_LOGS_OPEN',
      historicalTransitionObservations: 9,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2000,
    },
    riskMetadata: {
      riskClass: 'READ_ONLY',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: 1726000000000,
      validationTimestamp: 1726000000000,
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: {
      capabilityConfidence: 0.97,
      routeConfidence: 0.94,
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

// Deterministically populate stable functional fingerprint hashes for all authoritative capabilities
for (const cap of AUTHORITATIVE_CAPABILITY_CATALOG) {
  if (!cap.fingerprintHash) {
    cap.fingerprintHash = FingerprintConstructor.computeFingerprintHash({
      canonicalFunction: cap.canonicalFunction,
      actionType: cap.actionType,
      targetEntity: cap.targetEntity,
      role: cap.semanticEvidence?.role || 'button',
      riskClass: cap.riskMetadata?.riskClass,
      mandatoryPreStatePredicates: cap.mandatoryPreStatePredicates,
      allowedStateDelta: cap.allowedStateDelta,
      expectedPostState: cap.expectedPostState,
      requiredContextPredicates: cap.requiredContextPredicates,
      forbiddenContextPredicates: cap.forbiddenContextPredicates,
    });
  }
}

export function getAuthoritativeCapability(capabilityId: string): FunctionalCapabilityFingerprint | undefined {
  return AUTHORITATIVE_CAPABILITY_CATALOG.find((c) => c.capabilityId === capabilityId);
}

export function getAllAuthoritativeCapabilities(): FunctionalCapabilityFingerprint[] {
  return [...AUTHORITATIVE_CAPABILITY_CATALOG];
}

/**
 * Creates and finger-hashes a generic FunctionalCapabilityFingerprint outside the benchmark catalog.
 * Conforms strictly to the generic capability schema.
 */
export function createFunctionalCapability(
  spec: Partial<FunctionalCapabilityFingerprint> & {
    capabilityId: string;
    canonicalFunction: string;
    actionType: import('../../types/capability').ActionType;
    targetEntity: import('../../types/capability').TargetEntity;
  }
): FunctionalCapabilityFingerprint {
  const cap: FunctionalCapabilityFingerprint = {
    capabilityId: spec.capabilityId,
    canonicalFunction: spec.canonicalFunction,
    actionType: spec.actionType,
    targetEntity: spec.targetEntity,
    mandatoryPreStatePredicates: spec.mandatoryPreStatePredicates || [],
    allowedStateDelta: spec.allowedStateDelta || [],
    expectedPostState: spec.expectedPostState || [],
    requiredContextPredicates: spec.requiredContextPredicates || [],
    forbiddenContextPredicates: spec.forbiddenContextPredicates || [],
    semanticEvidence: spec.semanticEvidence || {
      canonicalLabel: spec.canonicalFunction,
      semanticSynonyms: [],
      accessibleName: spec.canonicalFunction,
      role: 'button',
      visibleLabel: spec.canonicalFunction,
      sectionMeaning: 'General',
      actionDescription: spec.canonicalFunction,
    },
    contextEvidence: spec.contextEvidence || {
      ancestorRelationships: [],
      nearbyText: [],
      surroundingLabels: [],
      containerSemantics: [],
      menuPanelRelationships: [],
      relativeStructuralRelationships: [],
    },
    transitionEvidence: spec.transitionEvidence || {
      preStateFingerprint: 'STATE_PRE_GENERIC',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: {},
      postStateFingerprint: 'STATE_POST_GENERIC',
      historicalTransitionObservations: 1,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      verificationWindowMs: 2500,
    },
    riskMetadata: spec.riskMetadata || {
      riskClass: 'REVERSIBLE',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: spec.provenance || {
      source: 'INITIAL_SPEC',
      creationTimestamp: Date.now(),
      validationTimestamp: Date.now(),
      routeVersion: 'v1.0.0',
      validationHistory: [],
    },
    confidence: spec.confidence || {
      capabilityConfidence: 0.95,
      routeConfidence: 0.90,
    },
    negativeEvidence: spec.negativeEvidence || {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  };

  if (!cap.fingerprintHash) {
    cap.fingerprintHash = FingerprintConstructor.computeFingerprintHash({
      canonicalFunction: cap.canonicalFunction,
      actionType: cap.actionType,
      targetEntity: cap.targetEntity,
      role: cap.semanticEvidence?.role || 'button',
      riskClass: cap.riskMetadata?.riskClass,
      mandatoryPreStatePredicates: cap.mandatoryPreStatePredicates,
      allowedStateDelta: cap.allowedStateDelta,
      expectedPostState: cap.expectedPostState,
      requiredContextPredicates: cap.requiredContextPredicates,
      forbiddenContextPredicates: cap.forbiddenContextPredicates,
    });
  }

  return cap;
}

