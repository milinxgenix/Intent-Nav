/**
 * IntentNav-SCFR: Controlled Interface Mutation Fixtures
 * Phase 3, Step 13 Implementation
 *
 * Authoritative, reproducible catalog of mutation fixtures covering the
 * five canonical categories of interface drift:
 * 1. Identifier Drift
 * 2. Structural Drift
 * 3. Presentation Drift
 * 4. State Drift
 * 5. Transition Drift
 */

import { MutationDescriptor } from './types';

export const CONTROLLED_MUTATION_FIXTURES: MutationDescriptor[] = [
  // =========================================================================
  // 1. IDENTIFIER DRIFT
  // =========================================================================
  {
    id: 'MUT_ID_01',
    name: 'Dynamic Framework Hash Identifier on Marketing Toggle',
    category: 'IDENTIFIER',
    description:
      'Replaces the static ID "btn-disable-marketing" with a dynamically generated framework hash "btn_dyn_8f9a2b" while preserving tag, role, and accessible text.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn_dyn_8f9a2b',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element ID must match mutated element "btn_dyn_8f9a2b"',
      executionSuccessRule: 'Element must be clicked, triggering mock state change',
      verificationRule: 'Causal verification requires marketing_notifications_enabled to transition to false',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      idMutation: {
        newId: 'btn_dyn_8f9a2b',
        preserveAttributes: true,
      },
    },
  },
  {
    id: 'MUT_ID_02',
    name: 'Scrambled UUID Identifier on Privacy Tracking Control',
    category: 'IDENTIFIER',
    description:
      'Replaces "btn-toggle-tracking" with a volatile UUID "uuid_7b4c_99f1_a12d" to evaluate invariant closure without static ID anchor.',
    baseSite: 'SiteA',
    intentId: 'INT-005',
    intentQuery: 'Turn off analytical data tracking',
    capabilityId: 'CAP_TOGGLE_TRACKING',
    originalTargetId: 'btn-toggle-tracking',
    expectedTargetId: 'uuid_7b4c_99f1_a12d',
    expectedPostActionState: {
      analytics_tracking_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element ID must match mutated element "uuid_7b4c_99f1_a12d"',
      executionSuccessRule: 'Element must be clicked, toggling tracking state',
      verificationRule: 'Causal verification requires analytics_tracking_enabled to transition to false',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      idMutation: {
        newId: 'uuid_7b4c_99f1_a12d',
        preserveAttributes: true,
      },
    },
  },

  // =========================================================================
  // 2. STRUCTURAL DRIFT
  // =========================================================================
  {
    id: 'MUT_STRUCT_01',
    name: 'Deep Nested Wrapper Hierarchy on Marketing Toggle',
    category: 'STRUCTURAL',
    description:
      'Wraps the target control in two additional nested container layers (<div class="form-group-wrapper"><div class="control-slot">...) to test structural path tolerance.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element ID must match "btn-disable-marketing"',
      executionSuccessRule: 'Element must receive click despite structural nesting changes',
      verificationRule: 'Post-state marketing_notifications_enabled must be false',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      structuralMutation: {
        wrapperTag: 'div',
        wrapperClasses: ['form-group-wrapper', 'control-slot'],
        extraDepth: 2,
      },
    },
  },
  {
    id: 'MUT_STRUCT_02',
    name: 'Adjacent Sibling Decoy with Keyword Stuffing',
    category: 'STRUCTURAL',
    description:
      'Inserts an adjacent sibling decoy button prior to the genuine control with high textual overlap ("Notice: Read about promotional marketing emails").',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target must match genuine control "btn-disable-marketing" and NOT the sibling decoy',
      executionSuccessRule: 'Element must be clicked and verified',
      verificationRule: 'Post-state must confirm marketing_notifications_enabled = false',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      structuralMutation: {
        prependDecoySibling: true,
        decoyId: 'btn-decoy-marketing-notice',
        decoyLabel: 'Notice: Read about promotional marketing emails and updates',
      },
    },
  },

  // =========================================================================
  // 3. PRESENTATION DRIFT
  // =========================================================================
  {
    id: 'MUT_PRES_01',
    name: 'Semantic Synonym Phrasing on Marketing Toggle',
    category: 'PRESENTATION',
    description:
      'Replaces the exact button label "Disable Marketing Emails" with natural language synonym phrasing "Mute promotional offers and newsletters".',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target must match "btn-disable-marketing" despite non-identical text phrasing',
      executionSuccessRule: 'Element click must toggle state',
      verificationRule: 'Post-state marketing_notifications_enabled must be false',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      presentationMutation: {
        newLabel: 'Mute promotional offers and newsletters',
        ariaLabelOverride: 'Mute promotional offers and newsletters',
      },
    },
  },
  {
    id: 'MUT_PRES_02',
    name: 'Theme Class Swap & Styling Redesign (Presentation Only)',
    category: 'PRESENTATION',
    description:
      'Applies dark mode design token classes ("theme-dark-accent btn-secondary-pill") and styling shifts without altering semantic role or functional identity.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target must remain selected and route preserved as active (presentation drift alone does not demote route)',
      executionSuccessRule: 'Element must execute cleanly',
      verificationRule: 'Post-state marketing_notifications_enabled must be false',
    },
    isPositiveControl: true,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      presentationMutation: {
        newClasses: ['theme-dark-accent', 'btn-secondary-pill', 'elevation-low'],
      },
    },
  },

  // =========================================================================
  // 4. STATE DRIFT
  // =========================================================================
  {
    id: 'MUT_STATE_01',
    name: 'Initial State Precondition Already Met (Already Disabled)',
    category: 'STATE',
    description:
      'The initial application state already has marketing_notifications_enabled: false and aria-checked="false". Invariant engine evaluates whether action is redundant.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Identifies target control; recognizes precondition status',
      executionSuccessRule: 'System must either abstain from redundant execution or maintain verified disabled state without corrupting state',
      verificationRule: 'Final state must remain marketing_notifications_enabled = false',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      stateMutation: {
        initialAppState: {
          marketing_notifications_enabled: false,
          marketing_emails_enabled: false,
        },
        initialAriaChecked: 'false',
      },
    },
  },
  {
    id: 'MUT_STATE_02',
    name: 'Control Disabled by Administrative Policy',
    category: 'STATE',
    description:
      'Target element is marked disabled="true" in DOM due to administrative policy constraint. Baselines 1-3 attempt click anyway; IntentNav detects disabled invariant.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: null,
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Identifies target element',
      executionSuccessRule: 'Disabled element must NOT execute mutation',
      verificationRule: 'System must reject or abstain due to disabled control predicate',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      stateMutation: {
        disabled: true,
      },
    },
  },
  {
    id: 'MUT_STATE_03',
    name: 'Target Inside Closed Collapsible Modal / Drawer',
    category: 'STATE',
    description:
      'Target control is enclosed inside a hidden dialog section (aria-hidden="true", display: none). Cannot be activated directly without opening container.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: null,
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Control is within hidden container',
      executionSuccessRule: 'Direct activation without container reveal fails or requires modal step',
      verificationRule: 'Must recognize hidden state and abstain or fail single-step execution',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      stateMutation: {
        insideClosedModal: true,
      },
    },
  },

  // =========================================================================
  // 5. TRANSITION DRIFT
  // =========================================================================
  {
    id: 'MUT_TRANS_01',
    name: 'Server Rejection / HTTP 500 Transition Failure',
    category: 'TRANSITION',
    description:
      'Element click is successfully dispatched, but the mock backend rejects the mutation with an HTTP 500 error (preState unchanged). IntentNav verifier must catch rejection and quarantine route.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: null, // Rejected: state does not mutate!
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element correctly selected',
      executionSuccessRule: 'Click dispatched but backend operation fails',
      verificationRule: 'Causal verifier MUST report verification failure / QUARANTINE; Baselines 1-3 report false success',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      transitionMutation: {
        outcome: 'REJECTED',
        errorMessage: 'Backend service error HTTP 500: Failed to update preference',
      },
    },
  },
  {
    id: 'MUT_TRANS_02',
    name: 'Delayed State Delta Exceeding Verification Timeout Window',
    category: 'TRANSITION',
    description:
      'State delta is delayed beyond the causal verification window (e.g. 5000ms delay vs 2000ms window). Causal verifier must detect timeout and withhold route promotion.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: null, // Unobserved within verification window
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element correctly selected',
      executionSuccessRule: 'Click dispatched but state mutation does not materialize within window',
      verificationRule: 'Causal verifier must flag timeout; route must not be promoted',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      transitionMutation: {
        outcome: 'DELAYED',
        delayedByMs: 5000,
      },
    },
  },
  {
    id: 'MUT_TRANS_03',
    name: 'Uncorrelated / Contradictory State Mutation Delta',
    category: 'TRANSITION',
    description:
      'Clicking the marketing button mutates an unrelated property ("analytics_tracking_enabled" = false) while leaving marketing_notifications_enabled = true. Verifier must catch the delta mismatch and trigger quarantine.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: null, // Allowed delta NOT satisfied
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element correctly selected',
      executionSuccessRule: 'Event dispatched but mutates wrong property',
      verificationRule: 'Causal verifier detects delta violation and triggers route quarantine',
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      transitionMutation: {
        outcome: 'UNCORRELATED_DELTA',
        mutatedProperty: 'analytics_tracking_enabled',
        mutatedValue: false,
      },
    },
  },
  {
    id: 'MUT_TRANS_04',
    name: 'Standard Nominal Transition (Positive Control)',
    category: 'TRANSITION',
    description:
      'Nominal valid transition where clicking "btn-disable-marketing" mutates marketing_notifications_enabled to false with full witness confirmation.',
    baseSite: 'SiteA',
    intentId: 'INT-001',
    intentQuery: 'Disable promotional marketing emails',
    capabilityId: 'CAP_DISABLE_MARKETING',
    originalTargetId: 'btn-disable-marketing',
    expectedTargetId: 'btn-disable-marketing',
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false,
    },
    applicableSystems: ['B1', 'B2', 'B3', 'B5'],
    inapplicableSystems: [
      {
        systemId: 'B4',
        reason: 'Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements.',
      },
    ],
    oracleRules: {
      selectionMatchRule: 'Target element correctly selected',
      executionSuccessRule: 'Click dispatched and state changed as expected',
      verificationRule: 'Causal verifier succeeds (causallyVerified = true)',
    },
    isPositiveControl: true,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      transitionMutation: {
        outcome: 'NORMAL',
      },
    },
  },
];

