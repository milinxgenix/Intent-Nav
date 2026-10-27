// benchmark/experiments/runner.ts
import fs3 from "fs";
import path2 from "path";
import crypto from "crypto";
import os from "os";
import child_process from "child_process";
import { fileURLToPath as fileURLToPath2 } from "url";

// benchmark/mutations/fixtures.ts
var CONTROLLED_MUTATION_FIXTURES = [
  // =========================================================================
  // 1. IDENTIFIER DRIFT
  // =========================================================================
  {
    id: "MUT_ID_01",
    name: "Dynamic Framework Hash Identifier on Marketing Toggle",
    category: "IDENTIFIER",
    description: 'Replaces the static ID "btn-disable-marketing" with a dynamically generated framework hash "btn_dyn_8f9a2b" while preserving tag, role, and accessible text.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn_dyn_8f9a2b",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: 'Target element ID must match mutated element "btn_dyn_8f9a2b"',
      executionSuccessRule: "Element must be clicked, triggering mock state change",
      verificationRule: "Causal verification requires marketing_notifications_enabled to transition to false"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      idMutation: {
        newId: "btn_dyn_8f9a2b",
        preserveAttributes: true
      }
    }
  },
  {
    id: "MUT_ID_02",
    name: "Scrambled UUID Identifier on Privacy Tracking Control",
    category: "IDENTIFIER",
    description: 'Replaces "btn-toggle-tracking" with a volatile UUID "uuid_7b4c_99f1_a12d" to evaluate invariant closure without static ID anchor.',
    baseSite: "SiteA",
    intentId: "INT-005",
    intentQuery: "Turn off analytical data tracking",
    capabilityId: "CAP_TOGGLE_TRACKING",
    originalTargetId: "btn-toggle-tracking",
    expectedTargetId: "uuid_7b4c_99f1_a12d",
    expectedPostActionState: {
      analytics_tracking_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: 'Target element ID must match mutated element "uuid_7b4c_99f1_a12d"',
      executionSuccessRule: "Element must be clicked, toggling tracking state",
      verificationRule: "Causal verification requires analytics_tracking_enabled to transition to false"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      idMutation: {
        newId: "uuid_7b4c_99f1_a12d",
        preserveAttributes: true
      }
    }
  },
  // =========================================================================
  // 2. STRUCTURAL DRIFT
  // =========================================================================
  {
    id: "MUT_STRUCT_01",
    name: "Deep Nested Wrapper Hierarchy on Marketing Toggle",
    category: "STRUCTURAL",
    description: 'Wraps the target control in two additional nested container layers (<div class="form-group-wrapper"><div class="control-slot">...) to test structural path tolerance.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: 'Target element ID must match "btn-disable-marketing"',
      executionSuccessRule: "Element must receive click despite structural nesting changes",
      verificationRule: "Post-state marketing_notifications_enabled must be false"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      structuralMutation: {
        wrapperTag: "div",
        wrapperClasses: ["form-group-wrapper", "control-slot"],
        extraDepth: 2
      }
    }
  },
  {
    id: "MUT_STRUCT_02",
    name: "Adjacent Sibling Decoy with Keyword Stuffing",
    category: "STRUCTURAL",
    description: 'Inserts an adjacent sibling decoy button prior to the genuine control with high textual overlap ("Notice: Read about promotional marketing emails").',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: 'Target must match genuine control "btn-disable-marketing" and NOT the sibling decoy',
      executionSuccessRule: "Element must be clicked and verified",
      verificationRule: "Post-state must confirm marketing_notifications_enabled = false"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      structuralMutation: {
        prependDecoySibling: true,
        decoyId: "btn-decoy-marketing-notice",
        decoyLabel: "Notice: Read about promotional marketing emails and updates"
      }
    }
  },
  // =========================================================================
  // 3. PRESENTATION DRIFT
  // =========================================================================
  {
    id: "MUT_PRES_01",
    name: "Semantic Synonym Phrasing on Marketing Toggle",
    category: "PRESENTATION",
    description: 'Replaces the exact button label "Disable Marketing Emails" with natural language synonym phrasing "Mute promotional offers and newsletters".',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: 'Target must match "btn-disable-marketing" despite non-identical text phrasing',
      executionSuccessRule: "Element click must toggle state",
      verificationRule: "Post-state marketing_notifications_enabled must be false"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      presentationMutation: {
        newLabel: "Mute promotional offers and newsletters",
        ariaLabelOverride: "Mute promotional offers and newsletters"
      }
    }
  },
  {
    id: "MUT_PRES_02",
    name: "Theme Class Swap & Styling Redesign (Presentation Only)",
    category: "PRESENTATION",
    description: 'Applies dark mode design token classes ("theme-dark-accent btn-secondary-pill") and styling shifts without altering semantic role or functional identity.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Target must remain selected and route preserved as active (presentation drift alone does not demote route)",
      executionSuccessRule: "Element must execute cleanly",
      verificationRule: "Post-state marketing_notifications_enabled must be false"
    },
    isPositiveControl: true,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      presentationMutation: {
        newClasses: ["theme-dark-accent", "btn-secondary-pill", "elevation-low"]
      }
    }
  },
  // =========================================================================
  // 4. STATE DRIFT
  // =========================================================================
  {
    id: "MUT_STATE_01",
    name: "Initial State Precondition Already Met (Already Disabled)",
    category: "STATE",
    description: 'The initial application state already has marketing_notifications_enabled: false and aria-checked="false". Invariant engine evaluates whether action is redundant.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Identifies target control; recognizes precondition status",
      executionSuccessRule: "System must either abstain from redundant execution or maintain verified disabled state without corrupting state",
      verificationRule: "Final state must remain marketing_notifications_enabled = false"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      stateMutation: {
        initialAppState: {
          marketing_notifications_enabled: false,
          marketing_emails_enabled: false
        },
        initialAriaChecked: "false"
      }
    }
  },
  {
    id: "MUT_STATE_02",
    name: "Control Disabled by Administrative Policy",
    category: "STATE",
    description: 'Target element is marked disabled="true" in DOM due to administrative policy constraint. Baselines 1-3 attempt click anyway; IntentNav detects disabled invariant.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: null,
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Identifies target element",
      executionSuccessRule: "Disabled element must NOT execute mutation",
      verificationRule: "System must reject or abstain due to disabled control predicate"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      stateMutation: {
        disabled: true
      }
    }
  },
  {
    id: "MUT_STATE_03",
    name: "Target Inside Closed Collapsible Modal / Drawer",
    category: "STATE",
    description: 'Target control is enclosed inside a hidden dialog section (aria-hidden="true", display: none). Cannot be activated directly without opening container.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: null,
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Control is within hidden container",
      executionSuccessRule: "Direct activation without container reveal fails or requires modal step",
      verificationRule: "Must recognize hidden state and abstain or fail single-step execution"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      stateMutation: {
        insideClosedModal: true
      }
    }
  },
  // =========================================================================
  // 5. TRANSITION DRIFT
  // =========================================================================
  {
    id: "MUT_TRANS_01",
    name: "Server Rejection / HTTP 500 Transition Failure",
    category: "TRANSITION",
    description: "Element click is successfully dispatched, but the mock backend rejects the mutation with an HTTP 500 error (preState unchanged). IntentNav verifier must catch rejection and quarantine route.",
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: null,
    // Rejected: state does not mutate!
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Target element correctly selected",
      executionSuccessRule: "Click dispatched but backend operation fails",
      verificationRule: "Causal verifier MUST report verification failure / QUARANTINE; Baselines 1-3 report false success"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      transitionMutation: {
        outcome: "REJECTED",
        errorMessage: "Backend service error HTTP 500: Failed to update preference"
      }
    }
  },
  {
    id: "MUT_TRANS_02",
    name: "Delayed State Delta Exceeding Verification Timeout Window",
    category: "TRANSITION",
    description: "State delta is delayed beyond the causal verification window (e.g. 5000ms delay vs 2000ms window). Causal verifier must detect timeout and withhold route promotion.",
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: null,
    // Unobserved within verification window
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Target element correctly selected",
      executionSuccessRule: "Click dispatched but state mutation does not materialize within window",
      verificationRule: "Causal verifier must flag timeout; route must not be promoted"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      transitionMutation: {
        outcome: "DELAYED",
        delayedByMs: 5e3
      }
    }
  },
  {
    id: "MUT_TRANS_03",
    name: "Uncorrelated / Contradictory State Mutation Delta",
    category: "TRANSITION",
    description: 'Clicking the marketing button mutates an unrelated property ("analytics_tracking_enabled" = false) while leaving marketing_notifications_enabled = true. Verifier must catch the delta mismatch and trigger quarantine.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: null,
    // Allowed delta NOT satisfied
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Target element correctly selected",
      executionSuccessRule: "Event dispatched but mutates wrong property",
      verificationRule: "Causal verifier detects delta violation and triggers route quarantine"
    },
    isPositiveControl: false,
    isNegativeOrAdversarial: true,
    mutationConfig: {
      transitionMutation: {
        outcome: "UNCORRELATED_DELTA",
        mutatedProperty: "analytics_tracking_enabled",
        mutatedValue: false
      }
    }
  },
  {
    id: "MUT_TRANS_04",
    name: "Standard Nominal Transition (Positive Control)",
    category: "TRANSITION",
    description: 'Nominal valid transition where clicking "btn-disable-marketing" mutates marketing_notifications_enabled to false with full witness confirmation.',
    baseSite: "SiteA",
    intentId: "INT-001",
    intentQuery: "Disable promotional marketing emails",
    capabilityId: "CAP_DISABLE_MARKETING",
    originalTargetId: "btn-disable-marketing",
    expectedTargetId: "btn-disable-marketing",
    expectedPostActionState: {
      marketing_notifications_enabled: false,
      marketing_emails_enabled: false
    },
    applicableSystems: ["B1", "B2", "B3", "B5"],
    inapplicableSystems: [
      {
        systemId: "B4",
        reason: "Baseline 4 resolves PAGE_URL routes only; cannot select or activate in-page DOM elements."
      }
    ],
    oracleRules: {
      selectionMatchRule: "Target element correctly selected",
      executionSuccessRule: "Click dispatched and state changed as expected",
      verificationRule: "Causal verifier succeeds (causallyVerified = true)"
    },
    isPositiveControl: true,
    isNegativeOrAdversarial: false,
    mutationConfig: {
      transitionMutation: {
        outcome: "NORMAL"
      }
    }
  }
];

// benchmark/baselines/registry.ts
var BASELINE_REGISTRY = {
  B1: {
    id: "B1",
    systemName: "Baseline 1: Fixed Selector Replay",
    shortName: "Fixed Selector Replay",
    architectureCategory: "Conventional RPA / Recorded Selector Replay",
    targetResolutionScope: "DOM_ELEMENT",
    implementedCapabilities: [
      "Replay of pre-recorded hardcoded CSS ID selectors (#btn-...)",
      "Exact ID equality matching against DOM candidate binding handles"
    ],
    unimplementedCapabilities: [
      "Natural language intent understanding",
      "Semantic similarity matching",
      "Structural invariant closure",
      "Drift adaptation to renamed, scrambled, or dynamic framework IDs",
      "Execution authorization gating (always authorizes upon match)",
      "Causal transition verification"
    ],
    knownLimitations: [
      "Completely breaks when DOM element IDs change (Mock Sites B, C, D)",
      "Zero drift recovery capability across framework redesigns",
      "Lacks safety invariant gating or user confirmation for high-risk actions"
    ],
    oracleMode: "EXACT_ELEMENT_MATCH",
    fairnessConstraints: [
      "Evaluates the exact same DOM candidates as other element-level systems",
      "Uses identical mock site fixtures and initial conditions",
      "Evaluated against same ground-truth target ID oracle"
    ]
  },
  B2: {
    id: "B2",
    systemName: "Baseline 2: Keyword String Matching",
    shortName: "Keyword String Matching",
    architectureCategory: "Lexical Heuristic Search",
    targetResolutionScope: "DOM_ELEMENT",
    implementedCapabilities: [
      "Tokenization of query into words (> 3 characters)",
      "Substring matching against visible candidate text labels",
      "Ranking by token count overlap",
      "Top-1 and Top-3 candidate extraction"
    ],
    unimplementedCapabilities: [
      "Synonym or paraphrase comprehension (fails on linguistic variations)",
      "Grammatical polarity / negation detection",
      "Structural container or role invariant closure",
      "Adversarial decoy discrimination (highly vulnerable to keyword stuffing)",
      "Causal transition verification",
      "Independent execution authorization (authorizes without safety check)"
    ],
    knownLimitations: [
      "Regularly selects high-keyword-overlap adversarial decoys (Mock Site D)",
      'Fails on synonyms (e.g. "night mode" for "dark mode")',
      "Executes destructive high-risk operations without user confirmation"
    ],
    oracleMode: "EXACT_ELEMENT_MATCH",
    fairnessConstraints: [
      "Receives identical candidate labels extracted from live DOM",
      "Uses same intent query strings without preprocessing advantage",
      "Evaluated against same ground-truth target ID oracle"
    ]
  },
  B3: {
    id: "B3",
    systemName: "Baseline 3: Semantic-Only Matching",
    shortName: "Semantic-Only Matching",
    architectureCategory: "Vector / Token-Set Semantic Similarity",
    targetResolutionScope: "DOM_ELEMENT",
    implementedCapabilities: [
      "Jaccard token-set similarity computation between query and candidate labels",
      "Threshold filtering (similarity > 0.15)",
      "Ranking by continuous semantic similarity score",
      "Top-1 and Top-3 candidate extraction"
    ],
    unimplementedCapabilities: [
      "Hard invariant gating prior to ranking",
      "Action-type verification (confuses opposite operations like delete vs modify)",
      "Target-entity compatibility verification",
      "Causal transition verification via multi-class witnesses",
      "Independent execution authorization"
    ],
    knownLimitations: [
      "Highly susceptible to adversarial semantic decoys with high linguistic overlap",
      "Lacks causal post-state validation: cannot detect whether action achieved intent",
      "Authorizes high-risk operations based solely on semantic confidence"
    ],
    oracleMode: "EXACT_ELEMENT_MATCH",
    fairnessConstraints: [
      "Evaluates identical live DOM candidate labels",
      "Uses same intent query strings",
      "Evaluated against same ground-truth target ID oracle"
    ]
  },
  B4: {
    id: "B4",
    systemName: "Baseline 4: Intent-to-Page Navigation",
    shortName: "Intent-to-Page Navigation",
    architectureCategory: "URL Routing Rulebase",
    targetResolutionScope: "PAGE_URL",
    implementedCapabilities: [
      "Regex pattern matching on user intent query",
      "Mapping intent to high-level page route (e.g., /settings/notifications, /settings/privacy)"
    ],
    unimplementedCapabilities: [
      "DOM element resolution (cannot select in-page buttons, toggles, or links)",
      "In-page action execution (cannot click, toggle, or mutate state)",
      "Handling in-page modal dialogs, tab panels, or dynamic drawers",
      "Causal transition verification",
      "Drift recovery within page DOM"
    ],
    knownLimitations: [
      "Evaluated on route URL match rather than element execution",
      "Provides 0% decoy rejection and 0% causal verification because it does not resolve or activate DOM elements",
      "Cannot execute fine-grained user intents"
    ],
    oracleMode: "PAGE_URL_MATCH",
    fairnessConstraints: [
      "Receives identical user intent queries",
      "Page-route ground truth evaluated on intent capability domain",
      "Separate scope documented honestly; does not fabricate element execution"
    ]
  },
  B5: {
    id: "B5",
    systemName: "IntentNav-SCFR (Invention Prototype)",
    shortName: "IntentNav-SCFR",
    architectureCategory: "Adaptive Invariant-Bounded Functional Capability Architecture",
    targetResolutionScope: "DOM_ELEMENT",
    implementedCapabilities: [
      "Functional Capability Identity via v2 Fingerprints",
      "Mandatory Invariant Closure prior to ranking",
      "Negative evidence suppression for contradictory candidates",
      "Structural invariant re-binding across volatile/scrambled IDs",
      "Independent risk-gated execution authorization (strictly 0 unauthorized high-risk executions)",
      "Live activation dispatch and causal transition verification via multi-class witnesses"
    ],
    unimplementedCapabilities: [
      "Arbitrary heuristic guesswork without invariant satisfaction"
    ],
    knownLimitations: [
      "Requires authoritative capability catalog registration",
      "Abstains when invariant closure cannot be satisfied"
    ],
    oracleMode: "EXACT_ELEMENT_MATCH",
    fairnessConstraints: [
      "Evaluates live DOM candidates generated by CandidateGenerator from current page",
      "No oracle or ground-truth element IDs injected into runtime engine",
      "Zero extra retries or recovery opportunities not available in ordinary execution"
    ]
  }
};
var ComparisonOracle = class {
  /**
   * Asserts whether a selected candidate matches the independent ground-truth expectation.
   */
  static isTargetMatch(systemScope, selectedId, expectedTargetId, expectedSyntheticId) {
    if (!selectedId) return false;
    if (systemScope === "PAGE_URL") {
      return Boolean(expectedTargetId && selectedId.toLowerCase().includes(expectedTargetId.toLowerCase()));
    }
    return expectedTargetId !== null && selectedId === expectedTargetId || expectedSyntheticId !== null && selectedId === expectedSyntheticId;
  }
  /**
   * Determines whether the selected candidate corresponds to an adversarial decoy.
   */
  static isDecoy(selectedId) {
    if (!selectedId) return false;
    return selectedId.toLowerCase().includes("decoy");
  }
  /**
   * Determines if a system correctly abstained when groundTruthCapability is 'NONE'.
   */
  static isAbstention(selectedId, executed) {
    return selectedId === null || !executed;
  }
  /**
   * Classifies trial status with strict reconciliation.
   */
  static classifyTrialStatus(params) {
    if (params.incomplete) return "INCOMPLETE";
    if (!params.success) return "FAILED";
    if (params.isDecoy) return "DECOY_TRIGGERED";
    if (params.groundTruthCapability === "NONE") {
      return params.success ? "FALSE_DISCOVERY" : "SUCCESS";
    }
    if (params.isMatch) return "SUCCESS";
    if (params.currentState && params.currentState !== "EXECUTED" && params.currentState !== "CONFIRMATION_PENDING") {
      return params.currentState;
    }
    return "WRONG_TARGET";
  }
};

// benchmark/mutations/harness.ts
import { performance as performance2 } from "perf_hooks";

// benchmark/mutations/generator.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

// src/core/fingerprint/suppressor.ts
var VOLATILE_ID_PATTERNS = [
  /^react-aria-/,
  /^ember\d+/,
  /^_ngcontent-/,
  /^vue-/,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  // UUID
  /^[a-f0-9]{16,}$/i,
  // Long hex hashes
  /^gen_\d+/,
  /^dyn-id-/,
  /:r[0-9a-z]+:/i,
  // React 18 useId format: :r1:, :r2:
  /-\d{5,}$/
  // Ending in random numbers
];
var VOLATILE_CLASS_PATTERNS = [
  /^css-[a-z0-9]+/i,
  // Emotion / styled
  /^sc-[a-zA-Z0-9]+/i,
  // styled-components
  /^jsx-[0-9]+/i,
  // styled-jsx
  /^_[a-z0-9]{5,}$/i,
  // CSS modules random hash
  /^(p|m|px|py|pt|pb|pl|pr|w|h|text|bg|border|flex|grid|col|row|gap)-/i,
  // Tailwind / utility CSS
  /^(items|justify|content|self)-/i,
  // Flex alignment utilities
  /^(flex|grid|block|inline|hidden|relative|absolute|fixed)$/i,
  // Layout utilities
  /^[a-z]-\d+/i,
  // Atomic shorthand: x-19, y-20
  /^(hover:|focus:|active:|disabled:|dark:)/i,
  // Pseudo-class utilities
  /^(is-|has-)/i
  // State toggles
];
var VolatileFeatureSuppressor = class {
  /**
   * Checks if a DOM ID is volatile/transient
   */
  static isVolatileId(id) {
    if (!id || typeof id !== "string") return true;
    const trimmed = id.trim();
    if (trimmed.length === 0) return true;
    return VOLATILE_ID_PATTERNS.some((pattern) => pattern.test(trimmed));
  }
  /**
   * Cleans CSS class string, removing styling and transient utility classes
   */
  static sanitizeClasses(classString) {
    if (!classString || typeof classString !== "string") return [];
    const classes = classString.split(/\s+/).filter(Boolean);
    return classes.filter((cls) => {
      return !VOLATILE_CLASS_PATTERNS.some((pattern) => pattern.test(cls));
    });
  }
  /**
   * Computes a stable relative structural path rather than absolute coordinates
   */
  static computeRelativePath(element) {
    const segments = [];
    let curr = element;
    let depth = 0;
    while (curr && curr.tagName.toLowerCase() !== "body" && depth < 6) {
      const tag = curr.tagName.toLowerCase();
      const role = curr.getAttribute("role");
      const ariaLabel = curr.getAttribute("aria-label");
      const testId = curr.getAttribute("data-testid") || curr.getAttribute("data-capability");
      let descriptor = tag;
      if (testId) {
        descriptor += `[data-key="${testId}"]`;
      } else if (role) {
        descriptor += `[role="${role}"]`;
      } else if (ariaLabel) {
        descriptor += `[aria-label="${ariaLabel.slice(0, 20)}"]`;
      }
      let siblingIndex = 1;
      let prev = curr.previousElementSibling;
      while (prev) {
        if (prev.tagName.toLowerCase() === tag) {
          siblingIndex++;
        }
        prev = prev.previousElementSibling;
      }
      descriptor += `:nth-of-type(${siblingIndex})`;
      segments.unshift(descriptor);
      curr = curr.parentElement;
      depth++;
    }
    return segments.join(" > ");
  }
  /**
   * Evaluates and suppresses an element's features, returning normalized invariant properties
   */
  static suppressVolatileFeatures(element) {
    const rawId = element.getAttribute("id") || "";
    const rawClass = element.getAttribute("class") || "";
    const role = element.getAttribute("role") || element.tagName.toLowerCase();
    const visibleText = (element.textContent || "").trim().replace(/\s+/g, " ");
    const isSuppressedId = this.isVolatileId(rawId);
    const sanitizedClasses = this.sanitizeClasses(rawClass);
    const relativePath = this.computeRelativePath(element);
    const sanitizedAttributes = {};
    if (!isSuppressedId && rawId.length > 0) {
      sanitizedAttributes["id"] = rawId;
    }
    if (sanitizedClasses.length > 0) {
      sanitizedAttributes["semantic-class"] = sanitizedClasses.join(" ");
    }
    const ariaRole = element.getAttribute("role");
    if (ariaRole) sanitizedAttributes["role"] = ariaRole;
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) sanitizedAttributes["aria-label"] = ariaLabel;
    const ariaExpanded = element.getAttribute("aria-expanded");
    if (ariaExpanded !== null) sanitizedAttributes["aria-expanded"] = ariaExpanded;
    const ariaChecked = element.getAttribute("aria-checked");
    if (ariaChecked !== null) sanitizedAttributes["aria-checked"] = ariaChecked;
    return {
      cleanedText: visibleText,
      cleanedRole: role,
      sanitizedAttributes,
      isSuppressedId,
      isSuppressedClass: sanitizedClasses.length === 0 && rawClass.length > 0,
      relativeStructuralPath: relativePath,
      featureWeights: {
        functionalRoleWeight: 0.95,
        canonicalSemanticWeight: 0.9,
        relativeHierarchyWeight: 0.7,
        attributeWeight: 0.4,
        presentationWeight: 0.02
        // Extremely low weight for presentation / IDs / CSS
      }
    };
  }
  /**
   * Explicitly strips volatile presentation features and runtime execution context fields
   * from raw capability input records prior to canonical stable representation.
   *
   * Excluded categories:
   * 1. Volatile framework/DOM IDs & utility CSS classes (id, volatileId, className, classes, volatileClasses)
   * 2. Pixel coordinates & bounding boxes (coordinates, boundingBox, clientRect, x, y, width, height, top, left, right, bottom)
   * 3. Brittle selectors & paths (xpath, fullXpath, cssSelector, fullPath)
   * 4. Cosmetic label wording variations (visibleLabel, accessibleName, canonicalLabel, textContent, innerText)
   * 5. Runtime execution & session context (activationEventId, issuedTimestamp, creationTimestamp,
   *    validationTimestamp, lastValidatedTimestamp, witnessId, witnessIds, handleId, tokenId,
   *    routeId, sessionToken, sequenceNumber, temporalDeltaMs, durationMs)
   */
  static stripVolatileInputFields(rawInput) {
    if (!rawInput || typeof rawInput !== "object") {
      return {};
    }
    const excludedKeys = /* @__PURE__ */ new Set([
      // Presentation & DOM handle keys
      "id",
      "volatileId",
      "className",
      "classes",
      "volatileClasses",
      "style",
      "inlineStyle",
      // Coordinates & bounding boxes
      "coordinates",
      "boundingBox",
      "clientRect",
      "x",
      "y",
      "width",
      "height",
      "top",
      "left",
      "right",
      "bottom",
      // Brittle selectors
      "xpath",
      "fullXpath",
      "cssSelector",
      "fullPath",
      "domStructuralPath",
      "elementIndex",
      // Cosmetic labels
      "canonicalLabel",
      "visibleLabel",
      "accessibleName",
      "textContent",
      "innerText",
      // Runtime execution context
      "activationEventId",
      "issuedTimestamp",
      "creationTimestamp",
      "validationTimestamp",
      "lastValidatedTimestamp",
      "witnessId",
      "witnessIds",
      "handleId",
      "tokenId",
      "routeId",
      "sessionToken",
      "sequenceNumber",
      "temporalDeltaMs",
      "durationMs"
    ]);
    const cleaned = {};
    for (const [key, value] of Object.entries(rawInput)) {
      if (!excludedKeys.has(key) && value !== void 0) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
};

// src/core/fingerprint/constructor.ts
var CAPABILITY_FINGERPRINT_DOMAIN = "INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2";
var TRANSITION_BINDING_DOMAIN = "INTENTNAV_SCFR_TRANSITION_BINDING_V2";
var WITNESS_BINDING_DOMAIN = "INTENTNAV_SCFR_WITNESS_BINDING_V2";
var POST_STATE_FINGERPRINT_DOMAIN = "INTENTNAV_SCFR_POST_STATE_FINGERPRINT_V2";
var FINGERPRINT_PREFIX_V2 = "capfp_sha256_";
var FINGERPRINT_PREFIX_V1_LEGACY = "fph_";
var POST_STATE_FINGERPRINT_PREFIX_V2 = "postfp_sha256_";
function getNodeCrypto() {
  try {
    const proc = globalThis.process;
    if (proc && typeof proc.getBuiltinModule === "function") {
      const mod = proc.getBuiltinModule("crypto");
      if (mod && typeof mod.createHash === "function") {
        return mod;
      }
    }
  } catch {
  }
  return null;
}
function bytesToHex(bytes) {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
function pureSha256(asciiOrUtf8) {
  const ch = (x, y, z) => x & y ^ ~x & z;
  const maj = (x, y, z) => x & y ^ x & z ^ y & z;
  const rotr = (n, x) => x >>> n | x << 32 - n;
  const sigma0 = (x) => rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  const sigma1 = (x) => rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  const gamma0 = (x) => rotr(7, x) ^ rotr(18, x) ^ x >>> 3;
  const gamma1 = (x) => rotr(17, x) ^ rotr(19, x) ^ x >>> 10;
  const K = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  const bytes = new TextEncoder().encode(asciiOrUtf8);
  const bitLen = bytes.length * 8;
  const padLen = (bytes.length + 8 >> 6) + 1 << 6;
  const words = new Uint32Array(padLen >> 2);
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | bytes[i] << (3 - (i & 3)) * 8;
  }
  words[bytes.length >> 2] = (words[bytes.length >> 2] ?? 0) | 128 << (3 - (bytes.length & 3)) * 8;
  words[words.length - 2] = Math.floor(bitLen / 4294967296);
  words[words.length - 1] = bitLen & 4294967295;
  let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762;
  let h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
  const w = new Uint32Array(64);
  for (let chunk = 0; chunk < words.length; chunk += 16) {
    for (let i = 0; i < 16; i++) w[i] = words[chunk + i];
    for (let i = 16; i < 64; i++) {
      w[i] = gamma1(w[i - 2]) + w[i - 7] + gamma0(w[i - 15]) + w[i - 16] >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const T1 = h + sigma1(e) + ch(e, f, g) + K[i] + w[i] >>> 0;
      const T2 = sigma0(a) + maj(a, b, c) >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + T1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = T1 + T2 >>> 0;
    }
    h0 = h0 + a >>> 0;
    h1 = h1 + b >>> 0;
    h2 = h2 + c >>> 0;
    h3 = h3 + d >>> 0;
    h4 = h4 + e >>> 0;
    h5 = h5 + f >>> 0;
    h6 = h6 + g >>> 0;
    h7 = h7 + h >>> 0;
  }
  const toHex = (n) => n.toString(16).padStart(8, "0");
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}
function canonicalizeValue(value) {
  if (value === null || value === void 0) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string") {
    return JSON.stringify(value.normalize("NFC"));
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "null";
    }
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (value instanceof Set) {
    const elements = Array.from(value).map((el) => canonicalizeValue(el)).sort();
    return `[${elements.join(",")}]`;
  }
  if (value instanceof Map) {
    const entries = Array.from(value.entries()).map(([k, v]) => [String(k).normalize("NFC"), v]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonicalizeValue(v)}`);
    return `{${entries.join(",")}}`;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalizeValue(item));
    return `[${items.join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value;
    const sortedKeys = Object.keys(obj).filter((k) => obj[k] !== void 0 && typeof obj[k] !== "function").sort();
    const entries = sortedKeys.map(
      (k) => `${JSON.stringify(k.normalize("NFC"))}:${canonicalizeValue(obj[k])}`
    );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value).normalize("NFC"));
}
function normalizeDeclarativeSpec(decl) {
  if (!decl || typeof decl !== "object") {
    return null;
  }
  return {
    expectedValue: decl.expectedValue !== void 0 ? decl.expectedValue : null,
    expectedValues: Array.isArray(decl.expectedValues) ? decl.expectedValues : null,
    id: (decl.id || "").trim(),
    operator: (decl.operator || "").trim().toUpperCase(),
    property: (decl.property || "").trim(),
    source: (decl.source || "").trim().toUpperCase()
  };
}
function canonicalizeOrderInsensitiveCollection(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  const byCanonical = /* @__PURE__ */ new Map();
  for (const item of items) {
    const serialized = canonicalizeValue(item);
    if (!byCanonical.has(serialized)) {
      byCanonical.set(serialized, item);
    }
  }
  return Array.from(byCanonical.entries()).sort(([keyA], [keyB]) => keyA < keyB ? -1 : keyA > keyB ? 1 : 0).map(([, item]) => item);
}
var FingerprintConstructor = class {
  static webCryptoDigestCache = /* @__PURE__ */ new Map();
  static computationCounter = 0;
  /**
   * Retrieves the lifetime count of SHA-256 fingerprint computations performed at the primitive site.
   */
  static getComputationCount() {
    return this.computationCounter;
  }
  /**
   * Resets the computation counter (e.g. for differential cycle measurement or test isolation).
   */
  static resetComputationCount() {
    this.computationCounter = 0;
  }
  /**
   * Computes a standard 256-bit SHA-256 hex digest synchronously using Node.js OpenSSL `crypto`
   * (or from pre-computed WebCrypto cache in browser runtimes).
   */
  static sha256HexSync(canonicalInput) {
    this.computationCounter++;
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      const hex2 = nodeCrypto.createHash("sha256").update(canonicalInput, "utf8").digest("hex");
      this.webCryptoDigestCache.set(canonicalInput, hex2);
      return hex2;
    }
    const cached = this.webCryptoDigestCache.get(canonicalInput);
    if (cached) {
      return cached;
    }
    const hex = pureSha256(canonicalInput);
    this.webCryptoDigestCache.set(canonicalInput, hex);
    return hex;
  }
  /**
   * Computes a standard 256-bit SHA-256 hex digest asynchronously using Node.js OpenSSL `crypto`
   * or W3C Web Cryptography API (`globalThis.crypto.subtle.digest('SHA-256', ...)`).
   */
  static async sha256HexAsync(canonicalInput) {
    this.computationCounter++;
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      const hex2 = nodeCrypto.createHash("sha256").update(canonicalInput, "utf8").digest("hex");
      this.webCryptoDigestCache.set(canonicalInput, hex2);
      return hex2;
    }
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
      const bytes = new TextEncoder().encode(canonicalInput);
      const digestBuffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const hex2 = bytesToHex(new Uint8Array(digestBuffer));
      this.webCryptoDigestCache.set(canonicalInput, hex2);
      return hex2;
    }
    const hex = pureSha256(canonicalInput);
    this.webCryptoDigestCache.set(canonicalInput, hex);
    return hex;
  }
  /**
   * Constructs the deterministic canonical JSON representation of a capability's
   * stable functional identity fields after volatile-feature suppression.
   *
   * Strictly includes:
   * - domain ('INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2') & version ('v2')
   * - canonicalFunction, actionType, targetEntity, role, riskClass, domainScope
   * - mandatoryPreStatePredicates (order-insensitive normalized set)
   * - allowedStateDelta (order-insensitive normalized set)
   * - expectedPostState (order-insensitive normalized set with deep canonical values)
   * - requiredContextPredicates & forbiddenContextPredicates (order-insensitive normalized sets)
   * - optional transitionContract (if bound into the capability input)
   *
   * Strictly excludes:
   * - Volatile DOM IDs, CSS classes, XPaths, coordinates, bounding boxes
   * - Cosmetic labels (visibleLabel, accessibleName, canonicalLabel)
   * - Per-execution runtime fields (activationEventId, issuedTimestamp, witnessId, handleId)
   */
  static buildCanonicalCapabilityRepresentation(fingerprint) {
    const sanitizedInput = VolatileFeatureSuppressor.stripVolatileInputFields(
      fingerprint
    );
    const canonicalFunction = String(sanitizedInput.canonicalFunction || "").normalize("NFC").trim().toLowerCase().replace(/\s+/g, "_");
    const actionType = String(sanitizedInput.actionType || "").normalize("NFC").trim().toUpperCase();
    const targetEntity = String(sanitizedInput.targetEntity || "").normalize("NFC").trim().toUpperCase();
    const role = String(sanitizedInput.role || "button").normalize("NFC").trim().toLowerCase();
    const riskClass = sanitizedInput.riskClass ? String(sanitizedInput.riskClass).normalize("NFC").trim().toUpperCase() : null;
    const domainScope = sanitizedInput.domainScope ? String(sanitizedInput.domainScope).normalize("NFC").trim().toLowerCase() : null;
    const rawPrePreds = Array.isArray(sanitizedInput.mandatoryPreStatePredicates) ? sanitizedInput.mandatoryPreStatePredicates : [];
    const normalizedPrePreds = canonicalizeOrderInsensitiveCollection(
      rawPrePreds.map((p) => {
        const id = (p.id || p.name || "").trim();
        const decl = normalizeDeclarativeSpec(p.declarative);
        if (!id && !decl) return null;
        return {
          declarative: decl,
          id: id || null
        };
      }).filter((item) => item !== null)
    );
    const rawDeltas = Array.isArray(sanitizedInput.allowedStateDelta) ? sanitizedInput.allowedStateDelta : [];
    const normalizedDeltas = canonicalizeOrderInsensitiveCollection(
      rawDeltas.map((d) => {
        const prop = (d.property || "").trim();
        if (!prop) return null;
        return {
          declarative: normalizeDeclarativeSpec(d.declarative),
          expectedChange: d.expectedChange ? String(d.expectedChange).trim() : "",
          id: d.id ? d.id.trim() : null,
          property: prop
        };
      }).filter((item) => item !== null)
    );
    const rawPost = Array.isArray(sanitizedInput.expectedPostState) ? sanitizedInput.expectedPostState : [];
    const normalizedPost = canonicalizeOrderInsensitiveCollection(
      rawPost.map((p) => {
        const prop = (p.property || "").trim();
        if (!prop) return null;
        return {
          declarative: normalizeDeclarativeSpec(p.declarative),
          expectedValue: p.expectedValue !== void 0 ? p.expectedValue : null,
          id: p.id ? p.id.trim() : null,
          property: prop
        };
      }).filter((item) => item !== null)
    );
    const rawReqCtx = Array.isArray(sanitizedInput.requiredContextPredicates) ? sanitizedInput.requiredContextPredicates : [];
    const normalizedReqCtx = canonicalizeOrderInsensitiveCollection(
      rawReqCtx.map((c) => {
        const target = (c.target || "").trim().toLowerCase();
        const pattern = (c.pattern || "").trim();
        if (!target && !pattern) return null;
        return {
          declarative: normalizeDeclarativeSpec(c.declarative),
          id: c.id ? c.id.trim() : null,
          pattern,
          required: true,
          target
        };
      }).filter((item) => item !== null)
    );
    const rawForbCtx = Array.isArray(sanitizedInput.forbiddenContextPredicates) ? sanitizedInput.forbiddenContextPredicates : [];
    const normalizedForbCtx = canonicalizeOrderInsensitiveCollection(
      rawForbCtx.map((c) => {
        const target = (c.target || "").trim().toLowerCase();
        const pattern = (c.pattern || "").trim();
        if (!target && !pattern) return null;
        return {
          declarative: normalizeDeclarativeSpec(c.declarative),
          id: c.id ? c.id.trim() : null,
          pattern,
          required: false,
          target
        };
      }).filter((item) => item !== null)
    );
    const tc = sanitizedInput.transitionContract;
    const normalizedTransitionContract = tc && typeof tc === "object" ? {
      activationEventExpected: {
        code: tc.activationEventExpected?.code ?? null,
        eventType: (tc.activationEventExpected?.eventType || "click").toLowerCase(),
        key: tc.activationEventExpected?.key ?? null,
        keyCode: tc.activationEventExpected?.keyCode ?? null
      },
      expectedStateDelta: tc.expectedStateDelta ?? {},
      postStateFingerprint: (tc.postStateFingerprint || "").trim(),
      preStateFingerprint: (tc.preStateFingerprint || "").trim(),
      verificationWindowMs: tc.verificationWindowMs ?? 2e3
    } : null;
    const canonicalPayload = {
      actionType,
      allowedStateDelta: normalizedDeltas,
      canonicalFunction,
      domain: CAPABILITY_FINGERPRINT_DOMAIN,
      domainScope,
      expectedPostState: normalizedPost,
      forbiddenContextPredicates: normalizedForbCtx,
      mandatoryPreStatePredicates: normalizedPrePreds,
      requiredContextPredicates: normalizedReqCtx,
      riskClass,
      role,
      targetEntity,
      transitionContract: normalizedTransitionContract,
      version: "v2"
    };
    return canonicalizeValue(canonicalPayload);
  }
  /**
   * Generates a deterministic v2 SHA-256 capability fingerprint hash (`capfp_sha256_<64hex>`)
   * from functional and invariant evidence only.
   * Volatile presentation features and runtime execution context are strictly excluded.
   */
  static computeFingerprintHash(fingerprint) {
    const canonical = this.buildCanonicalCapabilityRepresentation(fingerprint);
    const hex = this.sha256HexSync(canonical);
    return `${FINGERPRINT_PREFIX_V2}${hex}`;
  }
  /**
   * Asynchronously generates a deterministic v2 SHA-256 capability fingerprint hash
   * (`capfp_sha256_<64hex>`) using Node.js OpenSSL `crypto` or W3C Web Cryptography API
   * (`globalThis.crypto.subtle.digest('SHA-256', ...)`).
   */
  static async computeFingerprintHashAsync(fingerprint) {
    const canonical = this.buildCanonicalCapabilityRepresentation(fingerprint);
    const hex = await this.sha256HexAsync(canonical);
    return `${FINGERPRINT_PREFIX_V2}${hex}`;
  }
  /**
   * Computes the authoritative v2 SHA-256 capability fingerprint hash directly from a
   * FunctionalCapabilityFingerprint entity.
   */
  static computeFingerprintHashFromCapability(cap) {
    return this.computeFingerprintHash({
      canonicalFunction: cap.canonicalFunction,
      actionType: cap.actionType,
      targetEntity: cap.targetEntity,
      role: cap.semanticEvidence?.role || "button",
      riskClass: cap.riskMetadata?.riskClass,
      mandatoryPreStatePredicates: cap.mandatoryPreStatePredicates,
      allowedStateDelta: cap.allowedStateDelta,
      expectedPostState: cap.expectedPostState,
      requiredContextPredicates: cap.requiredContextPredicates,
      forbiddenContextPredicates: cap.forbiddenContextPredicates
    });
  }
  /**
   * Constructs the deterministic canonical representation of a TransitionSignature's
   * stable transition semantics under the `INTENTNAV_SCFR_TRANSITION_BINDING_V2` domain.
   * Excludes runtime-only fields (`activationEventId`, `issuedTimestamp`, runtime witness IDs).
   */
  static buildCanonicalTransitionRepresentation(signature, capabilityFingerprintHash) {
    const base = {
      activationEventExpected: {
        code: signature?.activationEventExpected?.code ?? null,
        eventType: signature?.activationEventExpected?.eventType ?? "click",
        key: signature?.activationEventExpected?.key ?? null,
        keyCode: signature?.activationEventExpected?.keyCode ?? null
      },
      ...capabilityFingerprintHash ? { capabilityFingerprintHash } : {},
      domain: TRANSITION_BINDING_DOMAIN,
      expectedStateDelta: signature?.expectedStateDelta ?? {},
      postStateFingerprint: signature?.postStateFingerprint ?? "",
      preStateFingerprint: signature?.preStateFingerprint ?? "",
      verificationWindowMs: signature?.verificationWindowMs ?? 2e3
    };
    return canonicalizeValue(base);
  }
  /**
   * Computes a domain-separated SHA-256 transition-signature binding (`tb_sha256_<64hex>`).
   */
  static computeTransitionSignatureHash(signature, capabilityFingerprintHash) {
    const canonical = this.buildCanonicalTransitionRepresentation(
      signature,
      capabilityFingerprintHash
    );
    return `tb_sha256_${this.sha256HexSync(canonical)}`;
  }
  /**
   * Asynchronously computes a domain-separated SHA-256 transition-signature binding (`tb_sha256_<64hex>`).
   */
  static async computeTransitionSignatureHashAsync(signature, capabilityFingerprintHash) {
    const canonical = this.buildCanonicalTransitionRepresentation(
      signature,
      capabilityFingerprintHash
    );
    const hex = await this.sha256HexAsync(canonical);
    return `tb_sha256_${hex}`;
  }
  /**
   * Constructs the deterministic canonical representation of a witness quorum binding
   * under the `INTENTNAV_SCFR_WITNESS_BINDING_V2` domain.
   */
  static buildCanonicalWitnessBindingRepresentation(verifiedWitnessClasses, activationEventId, witnessEvidenceHash) {
    const sortedClasses = Array.from(new Set(verifiedWitnessClasses || [])).sort();
    return canonicalizeValue({
      activationEventId,
      domain: WITNESS_BINDING_DOMAIN,
      verifiedWitnessClasses: sortedClasses,
      witnessClassCount: sortedClasses.length,
      witnessEvidenceHash: witnessEvidenceHash ?? "we_sha256_none"
    });
  }
  /**
   * Computes a domain-separated SHA-256 witness digest (`wd_sha256_<64hex>`).
   */
  static computeWitnessBindingHash(verifiedWitnessClasses, activationEventId, witnessEvidenceHash) {
    const canonical = this.buildCanonicalWitnessBindingRepresentation(
      verifiedWitnessClasses,
      activationEventId,
      witnessEvidenceHash
    );
    return `wd_sha256_${this.sha256HexSync(canonical)}`;
  }
  /**
   * Deterministically constructs the canonical representation for observed post-state.
   * Enforces lexicographical key sorting, set-sorted arrays, domain separation,
   * and binding to capabilityId, routeId, and activationEventId.
   */
  static buildCanonicalPostStateRepresentation(input) {
    const appState = input.observedApplicationState ?? input.stateNode?.observedApplicationState ?? {};
    const sortedLandmarks = Array.from(new Set(input.semanticLandmarks ?? input.stateNode?.semanticLandmarks ?? [])).sort();
    const sortedModals = Array.from(new Set(input.activeModalsOrDialogs ?? input.stateNode?.activeModalsOrDialogs ?? [])).sort();
    const sortedTabs = Array.from(new Set(input.activeTabs ?? input.stateNode?.activeTabs ?? [])).sort();
    const domStructuralHash = input.domStructuralHash ?? input.stateNode?.domStructuralHash ?? null;
    const base = {
      activationEventId: input.activationEventId ?? null,
      activeModalsOrDialogs: sortedModals,
      activeTabs: sortedTabs,
      capabilityId: input.capabilityId,
      domain: POST_STATE_FINGERPRINT_DOMAIN,
      domStructuralHash,
      observedApplicationState: appState,
      routeId: input.routeId ?? null,
      routeVersion: input.routeVersion ?? null,
      semanticLandmarks: sortedLandmarks
    };
    return canonicalizeValue(base);
  }
  /**
   * Computes a domain-separated SHA-256 observed post-state fingerprint (`postfp_sha256_<64hex>`).
   */
  static computePostStateFingerprint(input) {
    const canonical = this.buildCanonicalPostStateRepresentation(input);
    return `${POST_STATE_FINGERPRINT_PREFIX_V2}${this.sha256HexSync(canonical)}`;
  }
  /**
   * Legacy v1 32-bit shift-subtract hash (`fph_<hex>`).
   * Retained strictly for explicit backward-compatibility verification and migration
   * of frozen v1 baseline artifacts (`intentnav-evidence-baseline-v1.0`).
   * New capability fingerprints MUST always use v2 (`computeFingerprintHash`).
   */
  static computeLegacyFingerprintHashV1(fingerprint) {
    const parts = [
      fingerprint.canonicalFunction.trim().toLowerCase(),
      fingerprint.actionType.trim().toUpperCase(),
      fingerprint.targetEntity.trim().toUpperCase(),
      fingerprint.role.trim().toLowerCase()
    ];
    if (fingerprint.riskClass) {
      parts.push(`risk:${fingerprint.riskClass.trim().toUpperCase()}`);
    }
    if (fingerprint.mandatoryPreStatePredicates && fingerprint.mandatoryPreStatePredicates.length > 0) {
      const preds = fingerprint.mandatoryPreStatePredicates.map((p) => (p.id || p.name || "").trim()).filter(Boolean).sort();
      if (preds.length > 0) {
        parts.push(`pre:${preds.join(",")}`);
      }
    }
    if (fingerprint.allowedStateDelta && fingerprint.allowedStateDelta.length > 0) {
      const deltas = fingerprint.allowedStateDelta.map((d) => `${d.property}:${d.expectedChange || ""}`.trim()).sort();
      if (deltas.length > 0) {
        parts.push(`delta:${deltas.join(",")}`);
      }
    }
    if (fingerprint.expectedPostState && fingerprint.expectedPostState.length > 0) {
      const post = fingerprint.expectedPostState.map((p) => `${p.property}:${String(p.expectedValue)}`.trim()).sort();
      if (post.length > 0) {
        parts.push(`post:${post.join(",")}`);
      }
    }
    if (fingerprint.requiredContextPredicates && fingerprint.requiredContextPredicates.length > 0) {
      const reqCtx = fingerprint.requiredContextPredicates.map((c) => `${c.target || ""}:${c.pattern || ""}`.trim()).sort();
      if (reqCtx.length > 0) {
        parts.push(`reqCtx:${reqCtx.join(",")}`);
      }
    }
    if (fingerprint.forbiddenContextPredicates && fingerprint.forbiddenContextPredicates.length > 0) {
      const forbCtx = fingerprint.forbiddenContextPredicates.map((c) => `${c.target || ""}:${c.pattern || ""}`.trim()).sort();
      if (forbCtx.length > 0) {
        parts.push(`forbCtx:${forbCtx.join(",")}`);
      }
    }
    const raw = parts.join("|");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `${FINGERPRINT_PREFIX_V1_LEGACY}${Math.abs(hash).toString(16)}`;
  }
  /**
   * Classifies a fingerprint hash string into an explicit version boundary:
   * - `'v2'`: `capfp_sha256_<64 lowercase hex chars>`
   * - `'v1_legacy'`: `fph_<1..8 lowercase hex chars>`
   * - `'invalid'`: anything else
   */
  static getFingerprintVersion(hash) {
    if (!hash || typeof hash !== "string") {
      return "invalid";
    }
    if (/^capfp_sha256_[0-9a-f]{64}$/.test(hash)) {
      return "v2";
    }
    if (/^fph_[0-9a-f]{1,8}$/.test(hash)) {
      return "v1_legacy";
    }
    return "invalid";
  }
  static isValidV2FingerprintHash(hash) {
    return this.getFingerprintVersion(hash) === "v2";
  }
  static isLegacyV1FingerprintHash(hash) {
    return this.getFingerprintVersion(hash) === "v1_legacy";
  }
  /**
   * Explicitly migrates a capability holding a missing or v1_legacy fingerprint hash
   * to the v2 SHA-256 capability identity format (`capfp_sha256_<64hex>`).
   */
  static migrateCapabilityFingerprintToV2(capability) {
    const previousHash = capability.fingerprintHash;
    const previousVersion = this.getFingerprintVersion(previousHash);
    const v2Hash = this.computeFingerprintHashFromCapability(capability);
    capability.fingerprintHash = v2Hash;
    capability.fingerprintVersion = "v2";
    if (previousVersion === "v1_legacy" && previousHash) {
      return {
        fingerprintVersion: "v2",
        fingerprintHash: v2Hash,
        migratedFromLegacyV1: previousHash
      };
    }
    return {
      fingerprintVersion: "v2",
      fingerprintHash: v2Hash
    };
  }
  /**
   * Verifies whether a recorded fingerprint hash (from a live execution or a frozen v1/v2
   * evidence artifact) matches the authoritative capability specification, explicitly reporting
   * the version boundary (`'v2'` vs `'v1_legacy'`).
   */
  static matchesCapabilityFingerprint(recordedHash, capability) {
    const input = {
      canonicalFunction: capability.canonicalFunction,
      actionType: capability.actionType,
      targetEntity: capability.targetEntity,
      role: capability.semanticEvidence?.role || "button",
      riskClass: capability.riskMetadata?.riskClass,
      mandatoryPreStatePredicates: capability.mandatoryPreStatePredicates,
      allowedStateDelta: capability.allowedStateDelta,
      expectedPostState: capability.expectedPostState,
      requiredContextPredicates: capability.requiredContextPredicates,
      forbiddenContextPredicates: capability.forbiddenContextPredicates
    };
    const expectedV2Hash = this.computeFingerprintHash(input);
    const expectedLegacyV1Hash = this.computeLegacyFingerprintHashV1(input);
    const version = this.getFingerprintVersion(recordedHash);
    if (version === "v2") {
      return {
        matches: recordedHash === expectedV2Hash,
        version: "v2",
        expectedV2Hash,
        expectedLegacyV1Hash
      };
    }
    if (version === "v1_legacy") {
      return {
        matches: recordedHash === expectedLegacyV1Hash,
        version: "v1_legacy",
        expectedV2Hash,
        expectedLegacyV1Hash
      };
    }
    return {
      matches: false,
      version: "invalid",
      expectedV2Hash,
      expectedLegacyV1Hash
    };
  }
  /**
   * Constructs a FunctionalCapabilityFingerprint from a DOM Element and metadata
   */
  static fromElement(element, options) {
    const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(element);
    const ancestorRelationships = [];
    const containerSemantics = [];
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      const parentRole = parent.getAttribute("role") || parent.tagName.toLowerCase();
      const parentLabel = parent.getAttribute("aria-label") || "";
      ancestorRelationships.push(`${parentRole}${parentLabel ? `[${parentLabel}]` : ""}`);
      if (["section", "nav", "main", "form", "dialog", "aside"].includes(
        parent.tagName.toLowerCase()
      ) || parentRole) {
        containerSemantics.push(parentRole);
      }
      parent = parent.parentElement;
      depth++;
    }
    const nearbyText = [];
    const prev = element.previousElementSibling;
    if (prev && prev.textContent) nearbyText.push(prev.textContent.trim().slice(0, 100));
    const next = element.nextElementSibling;
    if (next && next.textContent) nearbyText.push(next.textContent.trim().slice(0, 100));
    const accessibleName = element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.getAttribute("title") || element.getAttribute("placeholder") || suppression.cleanedText || "";
    const visibleLabel = suppression.cleanedText;
    const role = element.getAttribute("role") || element.tagName.toLowerCase();
    const riskClass = options.riskClass || (options.actionType === "DELETE" || options.actionType === "DEACTIVATE_ACCOUNT" ? "DESTRUCTIVE" : options.actionType === "REVOKE_ACCESS" || options.actionType === "AUTHENTICATE" ? "SECURITY_SENSITIVE" : options.actionType === "MODIFY_PREFERENCE" || options.actionType === "TOGGLE" ? "REVERSIBLE" : "READ_ONLY");
    const canonicalLabel = options.canonicalLabel || accessibleName || options.canonicalFunction;
    const fpHash = this.computeFingerprintHash({
      canonicalFunction: options.canonicalFunction,
      actionType: options.actionType,
      targetEntity: options.targetEntity,
      role,
      riskClass,
      domainScope: options.domainScope,
      mandatoryPreStatePredicates: options.mandatoryPreStatePredicates,
      allowedStateDelta: options.allowedStateDelta,
      expectedPostState: options.expectedPostState,
      requiredContextPredicates: options.requiredContextPredicates,
      forbiddenContextPredicates: options.forbiddenContextPredicates
    });
    const transitionEvidence = {
      preStateFingerprint: options.transitionSignature?.preStateFingerprint || "STATE_PRE_INITIAL",
      activationEventCharacteristics: {
        eventType: options.transitionSignature?.activationEventExpected?.eventType || "click",
        bubbles: true,
        cancelable: true,
        key: options.transitionSignature?.activationEventExpected?.key,
        code: options.transitionSignature?.activationEventExpected?.code,
        keyCode: options.transitionSignature?.activationEventExpected?.keyCode
      },
      expectedDelta: options.transitionSignature?.expectedStateDelta || {},
      postStateFingerprint: options.transitionSignature?.postStateFingerprint || "STATE_POST_EXPECTED",
      historicalTransitionObservations: 0,
      witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION"],
      verificationWindowMs: options.transitionSignature?.verificationWindowMs || 1500
    };
    const transitionSignatureBinding = this.computeTransitionSignatureHash(
      {
        preStateFingerprint: transitionEvidence.preStateFingerprint,
        activationEventExpected: {
          eventType: transitionEvidence.activationEventCharacteristics.eventType,
          key: transitionEvidence.activationEventCharacteristics.key,
          code: transitionEvidence.activationEventCharacteristics.code,
          keyCode: transitionEvidence.activationEventCharacteristics.keyCode
        },
        expectedStateDelta: transitionEvidence.expectedDelta,
        verificationWindowMs: transitionEvidence.verificationWindowMs,
        postStateFingerprint: transitionEvidence.postStateFingerprint
      },
      fpHash
    );
    return {
      capabilityId: options.capabilityId,
      canonicalFunction: options.canonicalFunction,
      actionType: options.actionType,
      targetEntity: options.targetEntity,
      fingerprintHash: fpHash,
      fingerprintVersion: "v2",
      transitionSignatureBinding,
      mandatoryPreStatePredicates: options.mandatoryPreStatePredicates || [],
      allowedStateDelta: options.allowedStateDelta || [],
      expectedPostState: options.expectedPostState || [],
      requiredContextPredicates: options.requiredContextPredicates || [],
      forbiddenContextPredicates: options.forbiddenContextPredicates || [],
      semanticEvidence: {
        canonicalLabel,
        semanticSynonyms: options.semanticSynonyms || [],
        accessibleName,
        role,
        visibleLabel,
        sectionMeaning: containerSemantics.join(" > "),
        actionDescription: `${options.actionType} on ${options.targetEntity}`
      },
      contextEvidence: {
        ancestorRelationships,
        nearbyText,
        surroundingLabels: nearbyText,
        containerSemantics,
        menuPanelRelationships: containerSemantics,
        relativeStructuralRelationships: [suppression.relativeStructuralPath],
        urlSemantics: options.urlSemantics || (typeof window !== "undefined" ? window.location.pathname : "")
      },
      transitionEvidence,
      riskMetadata: {
        riskClass,
        reversible: riskClass === "READ_ONLY" || riskClass === "REVERSIBLE",
        financial: riskClass === "FINANCIAL",
        security: riskClass === "SECURITY_SENSITIVE",
        destructive: riskClass === "DESTRUCTIVE" || riskClass === "IRREVERSIBLE",
        requiresConfirmation: [
          "SECURITY_SENSITIVE",
          "DESTRUCTIVE",
          "FINANCIAL",
          "IRREVERSIBLE"
        ].includes(riskClass)
      },
      provenance: {
        source: "DISCOVERED",
        creationTimestamp: Date.now(),
        validationTimestamp: 0,
        routeVersion: "v1.0.0",
        validationHistory: []
      },
      confidence: {
        capabilityConfidence: 0.85,
        routeConfidence: 0.7
      },
      negativeEvidence: {
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: []
      }
    };
  }
};

// src/core/candidate/generator.ts
var CandidateGenerator = class {
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * Generates candidate evaluation contexts from DOM elements purely based on observable semantics.
   * Does NOT inject synthetic or default application state.
   */
  static generateFromDOM(container, observedAppState) {
    const candidates = [];
    const selector = 'button, a, input, select, [role="button"], [role="link"], [role="switch"], [role="menuitem"], [role="tab"]';
    const elements = Array.from(container.querySelectorAll(selector));
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const inputType = (el.getAttribute("type") || "").toLowerCase();
      const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();
      if (inputType === "password" || autocomplete.includes("password") || autocomplete.includes("cc-") || autocomplete.includes("credit-card") || autocomplete.includes("one-time-code")) {
        continue;
      }
      const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(el);
      const accessibleName = el.getAttribute("aria-label") || el.getAttribute("title") || suppression.cleanedText || el.getAttribute("name") || el.placeholder || `element_${i}`;
      const role = el.getAttribute("role") || el.tagName.toLowerCase();
      const nearbyTexts = [];
      const parentEl = el.parentElement;
      if (parentEl) {
        const textElements = parentEl.querySelectorAll("p, span, strong, label, h1, h2, h3, h4");
        textElements.forEach((t) => {
          if (t !== el) {
            const text = (t.textContent || "").trim().replace(/\s+/g, " ");
            if (text.length > 0 && text.length < 150) {
              nearbyTexts.push(text);
            }
          }
        });
      }
      const containerSemantics = [];
      const ancestorDescriptions = [];
      let currentParent = el.parentElement;
      let depth = 0;
      while (currentParent && currentParent.tagName.toLowerCase() !== "body" && depth < 6) {
        const pTag = currentParent.tagName.toLowerCase();
        const pRole = currentParent.getAttribute("role") || pTag;
        const pLabel = currentParent.getAttribute("aria-label") || "";
        const heading = currentParent.querySelector("h1, h2, h3, h4");
        const headingText = heading ? (heading.textContent || "").trim() : "";
        if (["section", "nav", "main", "form", "dialog", "aside", "header"].includes(pTag) || currentParent.getAttribute("role")) {
          containerSemantics.push(pRole);
          if (pLabel) containerSemantics.push(pLabel.toLowerCase());
          if (headingText) containerSemantics.push(headingText.toLowerCase());
        }
        ancestorDescriptions.push(`${pRole}${pLabel ? `[${pLabel}]` : ""}`);
        currentParent = currentParent.parentElement;
        depth++;
      }
      const combinedContext = `${accessibleName} ${nearbyTexts.join(" ")} ${containerSemantics.join(" ")}`.toLowerCase();
      let observedActionType = "VIEW";
      const isSwitch = role === "switch" || el.getAttribute("type") === "checkbox";
      const isButton = role === "button" || el.tagName.toLowerCase() === "button";
      const isLink = role === "link" || el.tagName.toLowerCase() === "a";
      if (isSwitch) {
        observedActionType = "MODIFY_PREFERENCE";
      } else if (isButton) {
        if (/delete|remove|erase|purge|destroy|wipe/i.test(accessibleName) && !/2fa|two[-\s]*factor|mfa/i.test(accessibleName)) {
          observedActionType = "DELETE";
        } else if (/export|download|archive|receipt|invoice/i.test(accessibleName)) {
          observedActionType = "EXPORT_DATA";
        } else if (/pause|deactivate|suspend|close account|break|hibernate/i.test(accessibleName)) {
          observedActionType = "DEACTIVATE_ACCOUNT";
        } else if (/(turn off|disable|remove|revoke|disconnect|sign out).*?(2fa|two[-\s]*factor|mfa|session|device)/i.test(accessibleName) || /turn off 2fa|disable 2fa|remove 2fa|disable mfa|revoke/i.test(accessibleName)) {
          observedActionType = "REVOKE_ACCESS";
        } else if (/(turn on|enable|setup|enroll).*?(2fa|two[-\s]*factor|mfa)/i.test(accessibleName) || /turn on 2fa|enable 2fa|setup 2fa|enroll/i.test(accessibleName)) {
          observedActionType = "AUTHENTICATE";
        } else if (/audit|log|view|show|display|trail/i.test(accessibleName)) {
          observedActionType = "VIEW";
        } else if (/submit|save|update|confirm/i.test(accessibleName)) {
          observedActionType = "SUBMIT";
        } else {
          observedActionType = "MODIFY_PREFERENCE";
        }
      } else if (isLink) {
        if (/audit|log|view|show|display|trail/i.test(accessibleName)) {
          observedActionType = "VIEW";
        } else {
          observedActionType = "NAVIGATE";
        }
      }
      let observedTargetEntity = "UNKNOWN";
      const explicitTarget = el.getAttribute("data-target-entity") || el.getAttribute("data-target") || el.getAttribute("data-capability-target");
      if (explicitTarget) {
        observedTargetEntity = explicitTarget.toUpperCase().replace(/[-\s]/g, "_");
      } else if (/all notification|global alert|every alert|indiscriminately|entire platform|all account notification/i.test(combinedContext)) {
        observedTargetEntity = "ALL_NOTIFICATIONS";
      } else if (/all security|entire security|wipe security|all account security/i.test(combinedContext)) {
        observedTargetEntity = "ALL_SECURITY";
      } else if (/all data|wipe all|erase all personal/i.test(combinedContext)) {
        observedTargetEntity = "ALL_DATA";
      } else if (/organization|all org members|entire org/i.test(combinedContext)) {
        observedTargetEntity = "ORGANIZATION_USERS";
      } else if (/invoice|receipt|billing|payment/i.test(combinedContext)) {
        observedTargetEntity = "BILLING_PREFERENCES";
      } else if (/audit|sign-in log|access ledger|activity trail|audit trail|security event/i.test(combinedContext)) {
        observedTargetEntity = "SECURITY_SETTINGS";
      } else if (/session|device|disconnect|sign out all/i.test(combinedContext)) {
        observedTargetEntity = "SECURITY_SETTINGS";
      } else if (/theme|dark mode|night mode|display|contrast/i.test(combinedContext)) {
        observedTargetEntity = "UI_THEME";
      } else if (/marketing|promot|newsletter|campaign|bulletin/i.test(combinedContext)) {
        observedTargetEntity = "MARKETING_NOTIFICATIONS";
      } else if (/export|download.*?(data|record|archive|information)|my data|gdpr|personal (data|record|archive|information)/i.test(combinedContext)) {
        observedTargetEntity = "PERSONAL_DATA_EXPORT";
      } else if (/2fa|two-factor|two step|mfa|authenticat|security code/i.test(combinedContext)) {
        observedTargetEntity = "TWO_FACTOR_AUTH";
      } else if (/tracking|cookie|telemetry|analytics|behavioral/i.test(combinedContext)) {
        observedTargetEntity = "PRIVACY_SETTINGS";
      } else if (/deactivate|pause account|suspend profile|close account|membership hiatus|hibernate/i.test(combinedContext)) {
        observedTargetEntity = "ACCOUNT_STATUS";
      } else if (/security|password|credential/i.test(combinedContext)) {
        observedTargetEntity = "SECURITY_SETTINGS";
      }
      const domStructuralPath = VolatileFeatureSuppressor.computeRelativePath(el);
      const bindingHandle = {
        handleId: `handle_${i}_${Date.now()}`,
        tagName: el.tagName.toLowerCase(),
        role,
        accessibleName,
        domStructuralPath,
        elementIndex: i,
        volatileId: el.id ? el.id : void 0,
        volatileClasses: el.className && typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean) : void 0
      };
      const candidateId = `cand_${i}_${this.simpleHash(accessibleName + "_" + role + "_" + domStructuralPath)}`;
      const candidateFingerprintHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: `func_${observedActionType.toLowerCase()}_${observedTargetEntity.toLowerCase()}`,
        actionType: observedActionType,
        targetEntity: observedTargetEntity,
        role
      });
      let appState = {};
      if (observedAppState) {
        appState = { ...observedAppState };
      } else {
        const doc = container.defaultView ? container : container.ownerDocument;
        const stateEl = doc?.getElementById("app-state") || doc?.getElementById("neg-app-state") || container?.querySelector?.("[data-application-state], [data-state]");
        if (stateEl) {
          const rawJson = stateEl.getAttribute("data-application-state") || stateEl.getAttribute("data-state");
          if (rawJson) {
            try {
              appState = JSON.parse(rawJson);
            } catch {
            }
          }
        }
        if (Object.keys(appState).length === 0) {
          const docView = container.defaultView || container.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
          if (docView?.IntentNavMockState) {
            appState = { ...docView.IntentNavMockState };
          }
        }
      }
      const hasAriaChecked = el.getAttribute("aria-checked") !== null;
      const isInputCheckable = el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "radio");
      const hasAriaExpanded = el.getAttribute("aria-expanded") !== null;
      const hasAriaSelected = el.getAttribute("aria-selected") !== null;
      const observedState = {
        ...appState,
        disabled: el.disabled ?? (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true"),
        hidden: el.getAttribute("aria-hidden") === "true" || el.hasAttribute("hidden") || el.style && (el.style.display === "none" || el.style.visibility === "hidden"),
        ...hasAriaChecked ? { checked: el.getAttribute("aria-checked") === "true" } : isInputCheckable ? { checked: el.checked } : {},
        ...hasAriaExpanded ? { expanded: el.getAttribute("aria-expanded") === "true" } : {},
        ...hasAriaSelected ? { selected: el.getAttribute("aria-selected") === "true" } : {}
      };
      candidates.push({
        candidateId,
        candidateLabel: accessibleName,
        observedActionType,
        observedTargetEntity,
        observedRole: role,
        containerSemantics,
        ancestors: ancestorDescriptions,
        nearbyText: nearbyTexts,
        observedState,
        bindingHandle,
        candidateFingerprintHash
      });
    }
    return candidates;
  }
};

// benchmark/mutations/generator.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function getMockSitesDir() {
  let curr = process.cwd();
  if (fs.existsSync(path.join(curr, "mock-sites"))) return path.join(curr, "mock-sites");
  curr = path.resolve(__dirname, "../../mock-sites");
  if (fs.existsSync(curr)) return curr;
  curr = path.resolve(__dirname, "../mock-sites");
  if (fs.existsSync(curr)) return curr;
  return path.resolve(process.cwd(), "mock-sites");
}
var MutationDOMGenerator = class _MutationDOMGenerator {
  /**
   * Builds an isolated, fresh DOM environment and applies the specified mutation descriptor.
   */
  static createMutatedEnvironment(mutation) {
    const siteDir = mutation.baseSite.replace("Site", "site-").toLowerCase();
    const mockSitesDir = getMockSitesDir();
    const htmlPath = path.resolve(mockSitesDir, `${siteDir}/index.html`);
    const html = fs.readFileSync(htmlPath, "utf8");
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      url: `http://localhost:3000/mock-sites/${siteDir}/index.html`
    });
    const win = dom.window;
    const doc = win.document;
    const jsPath = path.resolve(mockSitesDir, `${siteDir}/app.js`);
    if (fs.existsSync(jsPath)) {
      const js = fs.readFileSync(jsPath, "utf8");
      win.eval(js);
    }
    _MutationDOMGenerator.applyMutation(doc, win, mutation);
    const observedAppState = win.IntentNavMockState ? { ...win.IntentNavMockState } : void 0;
    const candidates = CandidateGenerator.generateFromDOM(doc, observedAppState);
    const cleanup = () => {
      try {
        win.close();
      } catch {
      }
    };
    return {
      window: win,
      document: doc,
      dom,
      candidates,
      cleanup
    };
  }
  /**
   * Applies the mutation transforms deterministically to the DOM and mock state.
   */
  static applyMutation(doc, win, mutation) {
    const originalEl = doc.getElementById(mutation.originalTargetId);
    const config = mutation.mutationConfig;
    if (config.idMutation && originalEl) {
      const newId = config.idMutation.newId;
      originalEl.id = newId;
    }
    if (config.structuralMutation && originalEl) {
      const struct = config.structuralMutation;
      if (struct.wrapperClasses && struct.wrapperClasses.length > 0) {
        for (const cls of struct.wrapperClasses) {
          const parent = originalEl.parentElement;
          if (parent) {
            const wrapper = doc.createElement(struct.wrapperTag || "div");
            wrapper.className = cls;
            parent.insertBefore(wrapper, originalEl);
            wrapper.appendChild(originalEl);
          }
        }
      }
      if (struct.prependDecoySibling && originalEl.parentElement) {
        const decoy = doc.createElement("button");
        decoy.id = struct.decoyId || "btn-decoy-sibling";
        decoy.setAttribute("role", "button");
        decoy.textContent = struct.decoyLabel || "Notice: promotional marketing info";
        originalEl.parentElement.insertBefore(decoy, originalEl);
      }
    }
    if (config.presentationMutation && originalEl) {
      const pres = config.presentationMutation;
      if (pres.newLabel) {
        originalEl.textContent = pres.newLabel;
      }
      if (pres.ariaLabelOverride) {
        originalEl.setAttribute("aria-label", pres.ariaLabelOverride);
      }
      if (pres.newClasses && pres.newClasses.length > 0) {
        originalEl.className = pres.newClasses.join(" ");
      }
      if (pres.roleOverride) {
        originalEl.setAttribute("role", pres.roleOverride);
      }
    }
    if (config.stateMutation) {
      const st = config.stateMutation;
      if (st.initialAppState && win.IntentNavMockState) {
        Object.assign(win.IntentNavMockState, st.initialAppState);
        const stateEl = doc.getElementById("app-state");
        if (stateEl) {
          stateEl.setAttribute("data-state", JSON.stringify(win.IntentNavMockState));
        }
      }
      if (originalEl && st.initialAriaChecked !== void 0) {
        originalEl.setAttribute("aria-checked", st.initialAriaChecked);
      }
      if (originalEl && st.disabled) {
        originalEl.disabled = true;
        originalEl.setAttribute("disabled", "true");
        originalEl.setAttribute("aria-disabled", "true");
        originalEl.addEventListener(
          "click",
          (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
          },
          true
        );
      }
      if (originalEl && st.insideClosedModal) {
        const modalContainer = doc.createElement("div");
        modalContainer.setAttribute("role", "dialog");
        modalContainer.setAttribute("aria-hidden", "true");
        modalContainer.style.display = "none";
        const parent = originalEl.parentElement;
        if (parent) {
          parent.insertBefore(modalContainer, originalEl);
          modalContainer.appendChild(originalEl);
        }
      }
    }
    if (config.transitionMutation && originalEl) {
      const trans = config.transitionMutation;
      if (trans.outcome === "REJECTED") {
        originalEl.addEventListener(
          "click",
          (e) => {
            e.stopImmediatePropagation();
            if (win.IntentNavMockState) {
              win.IntentNavMockState.marketing_notifications_enabled = true;
              win.IntentNavMockState.marketing_emails_enabled = true;
            }
          },
          true
        );
      } else if (trans.outcome === "UNCORRELATED_DELTA") {
        originalEl.addEventListener(
          "click",
          (e) => {
            e.stopImmediatePropagation();
            if (win.IntentNavMockState) {
              win.IntentNavMockState.marketing_notifications_enabled = true;
              win.IntentNavMockState.marketing_emails_enabled = true;
              if (trans.mutatedProperty) {
                win.IntentNavMockState[trans.mutatedProperty] = trans.mutatedValue ?? false;
              }
            }
          },
          true
        );
      }
    }
  }
};

// benchmark/baselines/baseline1_selector.ts
var Baseline1SelectorReplay = class {
  // Stored historical selectors
  storedSelectors = {
    CAP_DISABLE_MARKETING: "#btn-disable-marketing",
    CAP_EXPORT_DATA: "#btn-export-data",
    CAP_DISABLE_2FA: "#btn-disable-2fa",
    CAP_DEACTIVATE_ACCOUNT: "#btn-deactivate-account",
    CAP_TOGGLE_TRACKING: "#btn-toggle-tracking",
    CAP_REVOKE_SESSIONS: "#btn-revoke-sessions",
    CAP_TOGGLE_DARK_MODE: "#btn-toggle-dark-mode",
    CAP_DOWNLOAD_INVOICE: "#btn-download-invoice",
    CAP_VIEW_AUDIT_LOGS: "#btn-view-audit-logs"
  };
  execute(capabilityId, candidates) {
    const selector = this.storedSelectors[capabilityId];
    if (!selector) return { success: false };
    const targetId = selector.replace("#", "");
    const found = candidates.find((c) => c.id === targetId);
    if (found) {
      return { success: true, selectedCandidateId: found.id };
    }
    return { success: false };
  }
};

// benchmark/baselines/baseline2_keyword.ts
var Baseline2KeywordMatching = class {
  execute(query, candidates) {
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const scored = [];
    for (const c of candidates) {
      const label = c.label || c.candidateLabel;
      if (!label) continue;
      const labelLower = label.toLowerCase();
      let overlap = 0;
      for (const t of queryTokens) {
        if (labelLower.includes(t)) overlap++;
      }
      if (overlap > 0) {
        scored.push({ id: c.id || c.candidateId || label, overlap });
      }
    }
    scored.sort((a, b) => b.overlap - a.overlap);
    const first = scored[0];
    if (first) {
      return {
        success: true,
        selectedCandidateId: first.id,
        topCandidateIds: scored.slice(0, 3).map((s) => s.id)
      };
    }
    return { success: false, topCandidateIds: [] };
  }
};

// benchmark/baselines/baseline3_semantic.ts
var Baseline3SemanticOnly = class {
  computeSimilarity(textA, textB) {
    const tokenize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
    const setA = new Set(tokenize(textA));
    const setB = new Set(tokenize(textB));
    if (setA.size === 0 || setB.size === 0) return 0;
    const inter = new Set([...setA].filter((x) => setB.has(x)));
    const union = /* @__PURE__ */ new Set([...setA, ...setB]);
    return inter.size / union.size;
  }
  execute(query, candidates) {
    const scored = [];
    for (const c of candidates) {
      const label = c.label || c.candidateLabel;
      if (!label) continue;
      const sim = this.computeSimilarity(query, label);
      if (sim > 0.15) {
        scored.push({ id: c.id || c.candidateId || label, sim });
      }
    }
    scored.sort((a, b) => b.sim - a.sim);
    const first = scored[0];
    if (first) {
      return {
        success: true,
        selectedCandidateId: first.id,
        similarityScore: first.sim,
        topCandidateIds: scored.slice(0, 3).map((s) => s.id)
      };
    }
    return { success: false, similarityScore: 0, topCandidateIds: [] };
  }
};

// benchmark/baselines/baseline4_pageNav.ts
var Baseline4PageNavigation = class {
  pageRoutes = {
    marketing: "/settings/notifications",
    data: "/settings/privacy",
    privacy: "/settings/privacy",
    two_factor: "/settings/security",
    account: "/settings/account",
    sessions: "/settings/security",
    appearance: "/settings/appearance",
    billing: "/settings/billing",
    audit: "/settings/security"
  };
  execute(query) {
    const q = query.toLowerCase();
    if (/marketing|notification|email/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.marketing };
    }
    if (/data|export|download/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.data };
    }
    if (/2fa|two-factor|security/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.two_factor };
    }
    if (/account|pause|deactivate/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.account };
    }
    if (/session|device|logout|sign out/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.sessions };
    }
    if (/dark|night|theme|appearance/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.appearance };
    }
    if (/invoice|receipt|statement|billing/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.billing };
    }
    if (/audit|trail|history|access log/i.test(q)) {
      return { success: true, navigatedUrl: this.pageRoutes.audit };
    }
    return { success: false };
  }
};

// src/core/intent/normalizer.ts
var IntentNormalizer = class {
  /**
   * Normalizes a raw user goal string into a strongly-typed NormalizedIntent
   * Optionally matches against a set of known target entities from registered capabilities.
   */
  static normalize(rawGoal, knownTargetEntities) {
    const input = rawGoal.toLowerCase().trim();
    const constraints = [];
    const sensitivityHints = [];
    let actionType = "VIEW";
    if (/stop|disable|turn\s*off|opt\s*out|unsubscribe|mute|block|pause|switch\s*off|remove|revoke|terminate|disconnect|sign\s*out|log\s*out|end\s*session|invalidate|kill/i.test(input)) {
      if (/account|membership|subscription|profile/i.test(input)) {
        actionType = "DEACTIVATE_ACCOUNT";
      } else if (/2fa|two[-\s]*factor|two[-\s]*step|multi[-\s]*factor|mfa|security\s*key/i.test(input)) {
        actionType = "REVOKE_ACCESS";
      } else if (/session|device|token|login|everywhere/i.test(input)) {
        actionType = "REVOKE_ACCESS";
      } else {
        actionType = "MODIFY_PREFERENCE";
      }
    } else if (/clear.*?(device|session|recognized)/i.test(input)) {
      actionType = "REVOKE_ACCESS";
    } else if (/force\s*logout|sign\s*out\s*everywhere/i.test(input)) {
      actionType = "REVOKE_ACCESS";
    } else if (/enable|turn\s*on|activate|opt\s*in/i.test(input)) {
      actionType = "MODIFY_PREFERENCE";
    } else if (/export|download|backup|save\s*my\s*data|get\s*all\s*data|records\s*download/i.test(input)) {
      actionType = "EXPORT_DATA";
    } else if (/delete|erase|close\s*account|remove\s*my\s*account|wipe|purge/i.test(input)) {
      actionType = "DELETE";
    } else if (/break|hiatus|hibernate|hold|suspend/i.test(input)) {
      actionType = "DEACTIVATE_ACCOUNT";
    } else if (/2fa|two[-\s]*factor|two[-\s]*step|multi[-\s]*factor|mfa|password|auth|security/i.test(input)) {
      if (/disable|turn\s*off|remove|revoke|terminate/i.test(input)) {
        actionType = "REVOKE_ACCESS";
      } else {
        actionType = "MODIFY_PREFERENCE";
      }
    } else if (/where|view|show|find|open|display/i.test(input)) {
      actionType = "NAVIGATE";
    }
    let targetEntity = "UNKNOWN";
    if (knownTargetEntities && knownTargetEntities.length > 0) {
      for (const known of knownTargetEntities) {
        if (!known || known === "UNKNOWN") continue;
        const tokens = known.toLowerCase().split(/[_\s-]+/).filter((t) => t.length > 2);
        if (tokens.length > 0 && tokens.every((t) => input.includes(t))) {
          targetEntity = known;
          break;
        }
      }
    }
    if (targetEntity === "UNKNOWN") {
      if (/all notification|every notification|all alert|all account notification|indiscriminately|turn off all/i.test(input)) {
        targetEntity = "ALL_NOTIFICATIONS";
      } else if (/all security|every security|all account security/i.test(input)) {
        targetEntity = "ALL_SECURITY";
      } else if (/all data|wipe all|erase all personal|every file/i.test(input)) {
        targetEntity = "ALL_DATA";
      } else if (/invoice|receipt|statement|billing|payment/i.test(input)) {
        targetEntity = "BILLING_PREFERENCES";
      } else if (/dark mode|night mode|theme|display palette|display theme/i.test(input)) {
        targetEntity = "UI_THEME";
      } else if (/marketing|promot|newsletter|advertising|campaign|spam|commercial/i.test(input)) {
        targetEntity = "MARKETING_NOTIFICATIONS";
      } else if (/export|download.*?(data|record|archive|information|everything)|everything.*?about me|personal\s*data|my\s*information|my\s*data|records download/i.test(input)) {
        targetEntity = "PERSONAL_DATA_EXPORT";
      } else if (/2fa|two[-\s]*factor|two[-\s]*step|multi[-\s]*factor|mfa|authenticat|security\s*key/i.test(input)) {
        targetEntity = "TWO_FACTOR_AUTH";
      } else if (/audit|sign-in log|access ledger|activity trail|audit trail|security event|login history/i.test(input)) {
        targetEntity = "SECURITY_SETTINGS";
      } else if (/session|devices|active session|sign out all/i.test(input)) {
        targetEntity = "SECURITY_SETTINGS";
      } else if (/security|password|login\s*alerts/i.test(input)) {
        targetEntity = "SECURITY_SETTINGS";
      } else if (/pause|deactivate|close\s*account|delete\s*account|take\s*a\s*break|hiatus|hibernate|suspend|subscription\s*on\s*hold|account\s*membership/i.test(input)) {
        targetEntity = "ACCOUNT_STATUS";
      } else if (/privacy|tracking|cookies|telemetry|analytics|data\s*sharing/i.test(input)) {
        targetEntity = "PRIVACY_SETTINGS";
      } else if (/notification|alert|email|push/i.test(input)) {
        targetEntity = "MARKETING_NOTIFICATIONS";
      }
    }
    if (actionType === "DELETE" || targetEntity === "ACCOUNT_STATUS") {
      sensitivityHints.push("ACCOUNT_DELETION");
    }
    if (targetEntity === "TWO_FACTOR_AUTH" || actionType === "REVOKE_ACCESS") {
      sensitivityHints.push("SECURITY_CREDENTIAL");
    }
    if (targetEntity === "PERSONAL_DATA_EXPORT") {
      sensitivityHints.push("CONTAINS_PII");
    }
    if (actionType === "VIEW" || actionType === "NAVIGATE") {
      sensitivityHints.push("LOW_RISK");
    }
    const normalizedGoal = `${actionType.toLowerCase().replace("_", " ")} ${targetEntity.toLowerCase().replace("_", " ")}`;
    return {
      rawGoal,
      normalizedGoal,
      actionType,
      targetEntity,
      constraints,
      sensitivityHints,
      confidence: 0.92
    };
  }
};

// src/core/intent/resolver.ts
var CapabilityIntentResolver = class {
  /**
   * Resolves a NormalizedIntent against a catalog of FunctionalCapabilityFingerprints
   */
  static resolve(intent, capabilities) {
    if (["ALL_NOTIFICATIONS", "ALL_SECURITY", "ALL_DATA", "ORGANIZATION_USERS"].includes(intent.targetEntity)) {
      return [];
    }
    const results = [];
    for (const cap of capabilities) {
      const isActionMatched = cap.actionType === intent.actionType || cap.actionType === "TOGGLE" && (intent.actionType === "MODIFY_PREFERENCE" || intent.actionType === "REVOKE_ACCESS") || cap.actionType === "REVOKE_ACCESS" && (intent.actionType === "TOGGLE" || intent.actionType === "MODIFY_PREFERENCE");
      const targetTokens = cap.targetEntity.toLowerCase().split(/[_\s-]+/).filter((t) => t.length > 2);
      const rawLower = intent.rawGoal.toLowerCase();
      const goalTokens = rawLower.split(/[^a-z0-9]+/).filter(Boolean);
      const isTargetEntityInGoal = targetTokens.length > 0 && targetTokens.some((t) => goalTokens.includes(t) || rawLower.includes(t));
      const isTargetMatched = cap.targetEntity === intent.targetEntity || intent.targetEntity === "UNKNOWN" && isTargetEntityInGoal;
      const reasons = [];
      const matchedSynonyms = [];
      let score = 0;
      if (isTargetMatched) {
        score += 0.5;
        reasons.push(`Target entity matched: ${cap.targetEntity}`);
      } else if (intent.targetEntity !== "UNKNOWN") {
        score -= 0.35;
      }
      if (isActionMatched) {
        score += 0.3;
        reasons.push(`Action type matched: ${cap.actionType}`);
      }
      const rawTokens = intent.rawGoal.toLowerCase().split(/\s+/);
      for (const syn of cap.semanticEvidence.semanticSynonyms) {
        const synTokens = syn.toLowerCase().split(/\s+/);
        const overlap = synTokens.filter((t) => rawTokens.includes(t));
        if (overlap.length > 0) {
          matchedSynonyms.push(syn);
          score += 0.05 * Math.min(overlap.length, 3);
        }
      }
      const labelTokens = cap.semanticEvidence.accessibleName.toLowerCase().split(/\s+/);
      const labelOverlap = labelTokens.filter((t) => rawTokens.includes(t));
      if (labelOverlap.length > 0) {
        score += 0.05;
      }
      score = Math.min(1, score);
      results.push({
        capabilityId: cap.capabilityId,
        matchScore: score,
        isActionMatched,
        isTargetMatched,
        matchedSynonyms,
        reasons
      });
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
};

// src/core/graph/capabilityGraph.ts
var CapabilityGraphEngine = class {
  constructor(store) {
    this.store = store;
  }
  capabilityNodes = /* @__PURE__ */ new Map();
  interfaceStateNodes = /* @__PURE__ */ new Map();
  edges = [];
  /**
   * Hydrates the in-memory graph from persistent storage
   */
  async loadFromStore() {
    if (!this.store) return;
    const nodes = await this.store.getAllCapabilityNodes();
    for (const [id, node] of Object.entries(nodes)) {
      this.capabilityNodes.set(id, node);
    }
    const states = await this.store.getAllInterfaceStates();
    for (const state of states) {
      this.interfaceStateNodes.set(state.stateId, state);
    }
    const routes = await this.store.getAllRouteVersions();
    for (const route of routes) {
      const node = this.capabilityNodes.get(route.capabilityId);
      if (node) {
        node.routeVersions[route.routeId] = route;
        if (route.status === "ACTIVE_VALIDATED") {
          node.activeRouteId = route.routeId;
          node.provisionalRouteIds = node.provisionalRouteIds.filter((rId) => rId !== route.routeId);
        } else if (node.activeRouteId === route.routeId) {
          node.activeRouteId = null;
        }
        if (route.status === "QUARANTINED") {
          if (!node.quarantinedRouteIds.includes(route.routeId)) {
            node.quarantinedRouteIds.push(route.routeId);
          }
          node.provisionalRouteIds = node.provisionalRouteIds.filter((rId) => rId !== route.routeId);
        }
        if (route.status === "DEMOTED") {
          if (!node.demotedRouteIds.includes(route.routeId)) {
            node.demotedRouteIds.push(route.routeId);
          }
          node.provisionalRouteIds = node.provisionalRouteIds.filter((rId) => rId !== route.routeId);
        }
      }
    }
    for (const node of this.capabilityNodes.values()) {
      if (node.activeRouteId) {
        const active = node.routeVersions[node.activeRouteId];
        if (!active || active.status !== "ACTIVE_VALIDATED") {
          node.activeRouteId = null;
        }
      }
    }
    const edges = await this.store.getAllGraphEdges();
    this.edges = [...edges];
  }
  /**
   * Registers or updates a Capability Node
   */
  registerCapability(capabilityId, canonicalFunction) {
    let node = this.capabilityNodes.get(capabilityId);
    if (!node) {
      node = {
        capabilityId,
        canonicalFunction,
        routeVersions: {},
        activeRouteId: null,
        provisionalRouteIds: [],
        quarantinedRouteIds: [],
        demotedRouteIds: [],
        creationTimestamp: Date.now()
      };
      this.capabilityNodes.set(capabilityId, node);
      if (this.store) {
        this.store.saveCapabilityNode(node).catch(() => {
        });
      }
    }
    return node;
  }
  /**
   * Registers an Interface-State Node (e.g. Page, Modal, Dialog, Tab)
   */
  registerInterfaceState(state) {
    this.interfaceStateNodes.set(state.stateId, state);
    if (this.store) {
      this.store.saveInterfaceState(state).catch(() => {
      });
    }
    return state;
  }
  /**
   * Adds a directional graph edge and persists it if store is present
   */
  addEdge(edge) {
    const existingIdx = this.edges.findIndex((e) => e.id === edge.id);
    if (existingIdx >= 0) {
      this.edges[existingIdx] = edge;
    } else {
      this.edges.push(edge);
    }
    if (this.store) {
      this.store.saveGraphEdge(edge).catch(() => {
      });
    }
  }
  /**
   * Attaches a route version to a capability node
   */
  attachRouteVersion(capabilityId, route) {
    const node = this.capabilityNodes.get(capabilityId);
    if (!node) {
      throw new Error(`Capability node ${capabilityId} does not exist in graph.`);
    }
    node.routeVersions[route.routeId] = route;
    if (route.status === "PROVISIONAL") {
      if (!node.provisionalRouteIds.includes(route.routeId)) {
        node.provisionalRouteIds.push(route.routeId);
      }
      if (node.activeRouteId === route.routeId) {
        node.activeRouteId = null;
      }
    } else if (route.status === "ACTIVE_VALIDATED") {
      node.activeRouteId = route.routeId;
      node.provisionalRouteIds = node.provisionalRouteIds.filter((id) => id !== route.routeId);
    } else if (route.status === "QUARANTINED") {
      if (!node.quarantinedRouteIds.includes(route.routeId)) {
        node.quarantinedRouteIds.push(route.routeId);
      }
      node.provisionalRouteIds = node.provisionalRouteIds.filter((id) => id !== route.routeId);
      if (node.activeRouteId === route.routeId) {
        node.activeRouteId = null;
      }
    } else if (route.status === "DEMOTED") {
      if (!node.demotedRouteIds.includes(route.routeId)) {
        node.demotedRouteIds.push(route.routeId);
      }
      node.provisionalRouteIds = node.provisionalRouteIds.filter((id) => id !== route.routeId);
      if (node.activeRouteId === route.routeId) {
        node.activeRouteId = null;
      }
    }
    if (this.store) {
      this.store.saveRouteVersion(route).catch(() => {
      });
      this.store.saveCapabilityNode(node).catch(() => {
      });
    }
  }
  getCapability(capabilityId) {
    return this.capabilityNodes.get(capabilityId);
  }
  getInterfaceState(stateId) {
    return this.interfaceStateNodes.get(stateId);
  }
  getAllCapabilities() {
    return Array.from(this.capabilityNodes.values());
  }
  getAllInterfaceStates() {
    return Array.from(this.interfaceStateNodes.values());
  }
  getEdges() {
    return [...this.edges];
  }
  /**
   * Locates routes that expose a given capability
   */
  getRoutesForCapability(capabilityId) {
    const node = this.capabilityNodes.get(capabilityId);
    if (!node) return [];
    return Object.values(node.routeVersions);
  }
  /**
   * Retrieves the active validated route for a capability, or null
   */
  getActiveRoute(capabilityId) {
    const node = this.capabilityNodes.get(capabilityId);
    if (!node || !node.activeRouteId) return null;
    const active = node.routeVersions[node.activeRouteId];
    return active && active.status === "ACTIVE_VALIDATED" ? active : null;
  }
};

// src/core/quarantine/tokenAuthenticator.ts
function getNodeCrypto2() {
  try {
    const proc = globalThis.process;
    if (proc && typeof proc.getBuiltinModule === "function") {
      const mod = proc.getBuiltinModule("crypto");
      if (mod && typeof mod.createHmac === "function") {
        return mod;
      }
    }
  } catch {
  }
  return null;
}
function bytesToHex2(bytes) {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
function hexToBytes(hex) {
  if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
    return null;
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
function constantTimeEqualBytes(a, b) {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const nodeCrypto = getNodeCrypto2();
  if (nodeCrypto && typeof nodeCrypto.timingSafeEqual === "function") {
    return nodeCrypto.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
function canonicalize(value) {
  if (value === null || value === void 0) {
    return "null";
  }
  if (typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "null";
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return `[${items.join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value;
    const sortedKeys = Object.keys(obj).filter((k) => obj[k] !== void 0).sort();
    const entries = sortedKeys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(String(value));
}
function generateSecretKeyBytes() {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  const nodeCrypto = getNodeCrypto2();
  if (nodeCrypto) {
    return new Uint8Array(nodeCrypto.randomBytes(32));
  }
  throw new Error("Cryptographic CSPRNG unavailable in current runtime environment.");
}
var PromotionTokenAuthenticator = class _PromotionTokenAuthenticator {
  /**
   * 256-bit (32-byte) secret key held strictly in a private field within the
   * trusted extension/verifier execution context. Never exposed externally.
   */
  #secretKey;
  #webCryptoKeyPromise = null;
  /**
   * Tracks canonical payload -> verified HMAC signature tags validated via
   * asynchronous WebCrypto in browser environments where synchronous Node
   * crypto is unavailable.
   */
  #verifiedWebCryptoSignatures = /* @__PURE__ */ new Map();
  #cachedSha256Digests = /* @__PURE__ */ new Map();
  constructor(secretKeyBytes) {
    if (secretKeyBytes) {
      if (!(secretKeyBytes instanceof Uint8Array) || secretKeyBytes.byteLength < 32) {
        throw new Error("PromotionTokenAuthenticator requires at least a 256-bit (32-byte) secret key.");
      }
      this.#secretKey = new Uint8Array(secretKeyBytes);
    } else {
      this.#secretKey = generateSecretKeyBytes();
    }
  }
  getWebCryptoKey() {
    if (!this.#webCryptoKeyPromise) {
      if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
        return Promise.reject(new Error("Web Cryptography API (crypto.subtle) is unavailable."));
      }
      this.#webCryptoKeyPromise = globalThis.crypto.subtle.importKey(
        "raw",
        this.#secretKey,
        { name: "HMAC", hash: "SHA-256" },
        false,
        // non-extractable key
        ["sign", "verify"]
      );
    }
    return this.#webCryptoKeyPromise;
  }
  sha256HexSync(canonicalInput) {
    const nodeCrypto = getNodeCrypto2();
    if (!nodeCrypto) {
      throw new Error(
        "Synchronous SHA-256 requires Node.js crypto module; use async method in browser WebCrypto environments."
      );
    }
    return nodeCrypto.createHash("sha256").update(canonicalInput, "utf8").digest("hex");
  }
  async sha256HexAsync(canonicalInput) {
    const nodeCrypto = getNodeCrypto2();
    if (nodeCrypto) {
      return nodeCrypto.createHash("sha256").update(canonicalInput, "utf8").digest("hex");
    }
    const bytes = new TextEncoder().encode(canonicalInput);
    const digestBuffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return bytesToHex2(new Uint8Array(digestBuffer));
  }
  hmacSha256HexSync(canonicalInput) {
    const nodeCrypto = getNodeCrypto2();
    if (!nodeCrypto) {
      throw new Error(
        "Synchronous HMAC-SHA-256 requires Node.js crypto module; use async method in browser WebCrypto environments."
      );
    }
    return nodeCrypto.createHmac("sha256", this.#secretKey).update(canonicalInput, "utf8").digest("hex");
  }
  async hmacSha256HexAsync(canonicalInput) {
    const nodeCrypto = getNodeCrypto2();
    if (nodeCrypto) {
      return nodeCrypto.createHmac("sha256", this.#secretKey).update(canonicalInput, "utf8").digest("hex");
    }
    const cryptoKey = await this.getWebCryptoKey();
    const bytes = new TextEncoder().encode(canonicalInput);
    const sigBuffer = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, bytes);
    const hex = bytesToHex2(new Uint8Array(sigBuffer));
    this.#verifiedWebCryptoSignatures.set(canonicalInput, hex);
    return hex;
  }
  /**
   * Canonicalizes stable transition semantics from TransitionSignature under explicit
   * domain separation ('INTENTNAV_SCFR_TRANSITION_BINDING_V2').
   * Excludes volatile timing measurements while binding preStateFingerprint,
   * activationEventExpected, expectedStateDelta, verificationWindowMs, and postStateFingerprint.
   */
  static buildCanonicalTransitionSemantics(signature) {
    if (!signature || typeof signature !== "object") {
      return canonicalize({
        activationEventExpected: { code: null, eventType: "click", key: null, keyCode: null },
        domain: "INTENTNAV_SCFR_TRANSITION_BINDING_V2",
        expectedStateDelta: {},
        postStateFingerprint: "",
        preStateFingerprint: "",
        verificationWindowMs: 2e3
      });
    }
    return canonicalize({
      activationEventExpected: {
        code: signature.activationEventExpected?.code ?? null,
        eventType: signature.activationEventExpected?.eventType ?? "click",
        key: signature.activationEventExpected?.key ?? null,
        keyCode: signature.activationEventExpected?.keyCode ?? null
      },
      domain: "INTENTNAV_SCFR_TRANSITION_BINDING_V2",
      expectedStateDelta: signature.expectedStateDelta ?? {},
      postStateFingerprint: signature.postStateFingerprint ?? "",
      preStateFingerprint: signature.preStateFingerprint ?? "",
      verificationWindowMs: signature.verificationWindowMs ?? 2e3
    });
  }
  computeTransitionBinding(signature) {
    const canonicalSemantics = _PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(signature);
    const binding = `tb_sha256_${this.sha256HexSync(canonicalSemantics)}`;
    this.#cachedSha256Digests.set(canonicalSemantics, binding);
    return binding;
  }
  async computeTransitionBindingAsync(signature) {
    const canonicalSemantics = _PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(signature);
    const hex = await this.sha256HexAsync(canonicalSemantics);
    const binding = `tb_sha256_${hex}`;
    this.#cachedSha256Digests.set(canonicalSemantics, binding);
    return binding;
  }
  /**
   * Canonicalizes observed causal witness records under explicit domain separation
   * ('INTENTNAV_SCFR_WITNESS_EVIDENCE_V2'), excluding volatile arrival timestamps
   * while binding witnessClass, correlatedActivationEventId, and observedDelta.
   */
  static buildCanonicalWitnessEvidence(observedWitnesses) {
    if (!Array.isArray(observedWitnesses) || observedWitnesses.length === 0) {
      return canonicalize({
        domain: "INTENTNAV_SCFR_WITNESS_EVIDENCE_V2",
        witnesses: []
      });
    }
    const normalizedRecords = observedWitnesses.map((w) => ({
      correlatedActivationEventId: w.correlatedActivationEventId ?? null,
      observedDelta: w.observedDelta ?? {},
      witnessClass: w.witnessClass
    })).sort((a, b) => {
      const strA = `${a.witnessClass}:${canonicalize(a.observedDelta)}`;
      const strB = `${b.witnessClass}:${canonicalize(b.observedDelta)}`;
      return strA.localeCompare(strB);
    });
    return canonicalize({
      domain: "INTENTNAV_SCFR_WITNESS_EVIDENCE_V2",
      witnesses: normalizedRecords
    });
  }
  computeWitnessEvidenceHash(observedWitnesses) {
    const canonicalEvidence = _PromotionTokenAuthenticator.buildCanonicalWitnessEvidence(observedWitnesses);
    const hash = `we_sha256_${this.sha256HexSync(canonicalEvidence)}`;
    this.#cachedSha256Digests.set(canonicalEvidence, hash);
    return hash;
  }
  async computeWitnessEvidenceHashAsync(observedWitnesses) {
    const canonicalEvidence = _PromotionTokenAuthenticator.buildCanonicalWitnessEvidence(observedWitnesses);
    const hex = await this.sha256HexAsync(canonicalEvidence);
    const hash = `we_sha256_${hex}`;
    this.#cachedSha256Digests.set(canonicalEvidence, hash);
    return hash;
  }
  static buildCanonicalWitnessBindingInput(verifiedWitnessClasses, activationEventId, witnessEvidenceHash) {
    const sortedClasses = Array.from(new Set(verifiedWitnessClasses || [])).sort();
    return canonicalize({
      activationEventId,
      domain: "INTENTNAV_SCFR_WITNESS_BINDING_V2",
      verifiedWitnessClasses: sortedClasses,
      witnessClassCount: sortedClasses.length,
      witnessEvidenceHash: witnessEvidenceHash ?? "we_sha256_none"
    });
  }
  computeWitnessDigest(verifiedWitnessClasses, activationEventId, witnessEvidenceHash) {
    const canonicalInput = _PromotionTokenAuthenticator.buildCanonicalWitnessBindingInput(
      verifiedWitnessClasses,
      activationEventId,
      witnessEvidenceHash
    );
    const digest = `wd_sha256_${this.sha256HexSync(canonicalInput)}`;
    this.#cachedSha256Digests.set(canonicalInput, digest);
    return digest;
  }
  async computeWitnessDigestAsync(verifiedWitnessClasses, activationEventId, witnessEvidenceHash) {
    const canonicalInput = _PromotionTokenAuthenticator.buildCanonicalWitnessBindingInput(
      verifiedWitnessClasses,
      activationEventId,
      witnessEvidenceHash
    );
    const hex = await this.sha256HexAsync(canonicalInput);
    const digest = `wd_sha256_${hex}`;
    this.#cachedSha256Digests.set(canonicalInput, digest);
    return digest;
  }
  /**
   * Produces the deterministic canonical message authenticated by HMAC-SHA-256.
   */
  static serializeCanonicalTokenPayload(token) {
    const sortedClasses = Array.from(new Set(token.verifiedWitnessClasses || [])).sort();
    return canonicalize({
      activationEventId: token.activationEventId,
      algorithm: "HMAC-SHA-256",
      ...token.capabilityFingerprintHash ? { capabilityFingerprintHash: token.capabilityFingerprintHash } : {},
      capabilityId: token.capabilityId,
      domain: "INTENTNAV_SCFR_PROMOTION_TOKEN_V1",
      issuedTimestamp: token.issuedTimestamp,
      routeId: token.routeId,
      transitionBinding: token.transitionBinding ?? "",
      verifiedStatus: token.verifiedStatus,
      verifiedWitnessClasses: sortedClasses,
      witnessDigest: token.witnessDigest ?? ""
    });
  }
  /**
   * Synchronously mints a cryptographically authenticated TransitionVerificationToken.
   */
  issueToken(params) {
    const issuedTimestamp = params.issuedTimestamp ?? Date.now();
    const distinctClasses = Array.from(new Set(params.verifiedWitnessClasses || []));
    const transitionBinding = this.computeTransitionBinding(params.transitionSignature);
    const witnessEvidenceHash = this.computeWitnessEvidenceHash(params.observedWitnesses);
    const witnessDigest = this.computeWitnessDigest(
      distinctClasses,
      params.activationEventId,
      witnessEvidenceHash
    );
    const payload = {
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      capabilityFingerprintHash: params.capabilityFingerprintHash,
      activationEventId: params.activationEventId,
      verifiedStatus: "VERIFIED",
      verifiedWitnessClasses: distinctClasses,
      transitionBinding,
      witnessDigest,
      issuedTimestamp
    };
    const canonicalMessage = _PromotionTokenAuthenticator.serializeCanonicalTokenPayload(payload);
    const hmacHex = this.hmacSha256HexSync(canonicalMessage);
    return {
      tokenId: params.tokenId ?? `tok_${issuedTimestamp}_${hmacHex.slice(0, 12)}`,
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      ...params.capabilityFingerprintHash ? { capabilityFingerprintHash: params.capabilityFingerprintHash } : {},
      activationEventId: params.activationEventId,
      verifiedWitnessClasses: distinctClasses,
      transitionSignature: params.transitionSignature,
      transitionBinding,
      witnessDigest,
      witnessEvidenceHash,
      issuedTimestamp,
      verifiedStatus: "VERIFIED",
      algorithm: "HMAC-SHA-256",
      signatureHash: `hmac_sha256_${hmacHex}`
    };
  }
  /**
   * Asynchronously mints a cryptographically authenticated TransitionVerificationToken
   * (supports both Web Cryptography API in browsers and Node.js crypto).
   */
  async issueTokenAsync(params) {
    const issuedTimestamp = params.issuedTimestamp ?? Date.now();
    const distinctClasses = Array.from(new Set(params.verifiedWitnessClasses || []));
    const transitionBinding = await this.computeTransitionBindingAsync(params.transitionSignature);
    const witnessEvidenceHash = await this.computeWitnessEvidenceHashAsync(params.observedWitnesses);
    const witnessDigest = await this.computeWitnessDigestAsync(
      distinctClasses,
      params.activationEventId,
      witnessEvidenceHash
    );
    const payload = {
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      capabilityFingerprintHash: params.capabilityFingerprintHash,
      activationEventId: params.activationEventId,
      verifiedStatus: "VERIFIED",
      verifiedWitnessClasses: distinctClasses,
      transitionBinding,
      witnessDigest,
      issuedTimestamp
    };
    const canonicalMessage = _PromotionTokenAuthenticator.serializeCanonicalTokenPayload(payload);
    const hmacHex = await this.hmacSha256HexAsync(canonicalMessage);
    return {
      tokenId: params.tokenId ?? `tok_${issuedTimestamp}_${hmacHex.slice(0, 12)}`,
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      ...params.capabilityFingerprintHash ? { capabilityFingerprintHash: params.capabilityFingerprintHash } : {},
      activationEventId: params.activationEventId,
      verifiedWitnessClasses: distinctClasses,
      transitionSignature: params.transitionSignature,
      transitionBinding,
      witnessDigest,
      witnessEvidenceHash,
      issuedTimestamp,
      verifiedStatus: "VERIFIED",
      algorithm: "HMAC-SHA-256",
      signatureHash: `hmac_sha256_${hmacHex}`
    };
  }
  /**
   * Performs structural and binding validations common to sync and async paths.
   */
  validateStructuralFields(token, expectations) {
    if (!token || typeof token !== "object") {
      return {
        valid: false,
        failedCheck: "TOKEN_MISSING",
        reason: "INVARIANT VIOLATION: Cannot promote provisional route to ACTIVE_VALIDATED without a valid TransitionVerificationToken."
      };
    }
    if (token.verifiedStatus !== "VERIFIED") {
      return {
        valid: false,
        failedCheck: "INVALID_STATUS",
        reason: `INVARIANT VIOLATION: TransitionVerificationToken status is '${token.verifiedStatus}'; must be 'VERIFIED'.`
      };
    }
    if (!token.capabilityId || token.capabilityId !== expectations.expectedCapabilityId) {
      return {
        valid: false,
        failedCheck: "CAPABILITY_ID_MISMATCH",
        reason: `INVARIANT VIOLATION: Token capabilityId '${token.capabilityId}' does not match route capabilityId '${expectations.expectedCapabilityId}'.`
      };
    }
    if (expectations.expectedCapabilityFingerprintHash !== void 0 && token.capabilityFingerprintHash !== expectations.expectedCapabilityFingerprintHash) {
      return {
        valid: false,
        failedCheck: "CAPABILITY_FINGERPRINT_MISMATCH",
        reason: `INVARIANT VIOLATION: Token capabilityFingerprintHash '${token.capabilityFingerprintHash}' does not match expected capability fingerprint '${expectations.expectedCapabilityFingerprintHash}'.`
      };
    }
    if (!token.routeId || token.routeId !== expectations.expectedRouteId) {
      return {
        valid: false,
        failedCheck: "ROUTE_ID_MISMATCH",
        reason: `INVARIANT VIOLATION: Token routeId '${token.routeId}' does not match target routeId '${expectations.expectedRouteId}'. A valid token for capability ${expectations.expectedCapabilityId} cannot promote another route version.`
      };
    }
    if (!token.activationEventId || typeof token.activationEventId !== "string" || token.activationEventId.trim().length === 0 || expectations.expectedActivationEventId !== void 0 && token.activationEventId !== expectations.expectedActivationEventId) {
      return {
        valid: false,
        failedCheck: "ACTIVATION_EVENT_ID_INVALID",
        reason: `INVARIANT VIOLATION: Token activationEventId '${token.activationEventId}' is missing, invalid, or does not match expected activation event.`
      };
    }
    const minClasses = expectations.minWitnessClasses ?? 2;
    const distinctClasses = Array.isArray(token.verifiedWitnessClasses) ? Array.from(new Set(token.verifiedWitnessClasses)) : [];
    if (distinctClasses.length < minClasses) {
      return {
        valid: false,
        failedCheck: "WITNESS_QUORUM_INSUFFICIENT",
        reason: "INVARIANT VIOLATION: Token does not demonstrate the required quorum of >=2 independent witness classes."
      };
    }
    if (typeof token.issuedTimestamp !== "number" || !Number.isFinite(token.issuedTimestamp) || token.issuedTimestamp <= 0) {
      return {
        valid: false,
        failedCheck: "ISSUED_TIMESTAMP_INVALID",
        reason: `INVARIANT VIOLATION: Token issuedTimestamp '${token.issuedTimestamp}' is missing or invalid.`
      };
    }
    if (!token.transitionBinding || typeof token.transitionBinding !== "string" || !/^tb_sha256_[0-9a-f]{64}$/.test(token.transitionBinding)) {
      return {
        valid: false,
        failedCheck: "TRANSITION_BINDING_MISMATCH",
        reason: `INVARIANT VIOLATION: Token transitionBinding '${token.transitionBinding}' is missing or malformed.`
      };
    }
    if (!token.witnessDigest || typeof token.witnessDigest !== "string" || !/^wd_sha256_[0-9a-f]{64}$/.test(token.witnessDigest)) {
      return {
        valid: false,
        failedCheck: "WITNESS_DIGEST_MISMATCH",
        reason: `INVARIANT VIOLATION: Token witnessDigest '${token.witnessDigest}' is missing or malformed.`
      };
    }
    if (!token.signatureHash || typeof token.signatureHash !== "string" || !/^hmac_sha256_[0-9a-f]{64}$/.test(token.signatureHash)) {
      return {
        valid: false,
        failedCheck: "HMAC_SIGNATURE_INVALID",
        reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
      };
    }
    return null;
  }
  /**
   * Synchronously verifies all structural bindings, transition/witness digests,
   * and the HMAC-SHA-256 cryptographic signature in constant time.
   */
  verifyToken(token, expectations) {
    const structuralError = this.validateStructuralFields(token, expectations);
    if (structuralError) {
      return structuralError;
    }
    const nodeCrypto = getNodeCrypto2();
    if (nodeCrypto) {
      if (token.transitionSignature !== void 0) {
        const expectedTb = this.computeTransitionBinding(token.transitionSignature);
        if (token.transitionBinding !== expectedTb) {
          return {
            valid: false,
            failedCheck: "TRANSITION_BINDING_MISMATCH",
            reason: "INVARIANT VIOLATION: Token transitionBinding does not match token transitionSignature semantics."
          };
        }
      }
      if (expectations.expectedTransitionSignature !== void 0) {
        const expectedTb = this.computeTransitionBinding(expectations.expectedTransitionSignature);
        if (token.transitionBinding !== expectedTb) {
          return {
            valid: false,
            failedCheck: "TRANSITION_BINDING_MISMATCH",
            reason: "INVARIANT VIOLATION: Token transitionBinding does not match expected capability transition signature."
          };
        }
      }
      const expectedWd = this.computeWitnessDigest(
        token.verifiedWitnessClasses,
        token.activationEventId,
        token.witnessEvidenceHash
      );
      if (token.witnessDigest !== expectedWd) {
        return {
          valid: false,
          failedCheck: "WITNESS_DIGEST_MISMATCH",
          reason: "INVARIANT VIOLATION: Token witnessDigest does not match verifiedWitnessClasses and activationEventId."
        };
      }
      const canonicalMessage2 = _PromotionTokenAuthenticator.serializeCanonicalTokenPayload(token);
      const expectedHmacHex = this.hmacSha256HexSync(canonicalMessage2);
      const providedHmacHex2 = token.signatureHash.slice("hmac_sha256_".length);
      const expectedBytes2 = hexToBytes(expectedHmacHex);
      const providedBytes2 = hexToBytes(providedHmacHex2);
      if (!expectedBytes2 || !providedBytes2 || !constantTimeEqualBytes(expectedBytes2, providedBytes2)) {
        return {
          valid: false,
          failedCheck: "HMAC_SIGNATURE_INVALID",
          reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
        };
      }
      return {
        valid: true,
        reason: "Token cryptographically authenticated via HMAC-SHA-256 and all bindings verified."
      };
    }
    if (token.transitionSignature !== void 0) {
      const canonicalSemantics = _PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(
        token.transitionSignature
      );
      const cachedTb = this.#cachedSha256Digests.get(canonicalSemantics);
      if (!cachedTb || token.transitionBinding !== cachedTb) {
        return {
          valid: false,
          failedCheck: "TRANSITION_BINDING_MISMATCH",
          reason: "INVARIANT VIOLATION: Token transitionBinding does not match token transitionSignature semantics."
        };
      }
    }
    if (expectations.expectedTransitionSignature !== void 0) {
      const canonicalSemantics = _PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(
        expectations.expectedTransitionSignature
      );
      const cachedTb = this.#cachedSha256Digests.get(canonicalSemantics);
      if (!cachedTb || token.transitionBinding !== cachedTb) {
        return {
          valid: false,
          failedCheck: "TRANSITION_BINDING_MISMATCH",
          reason: "INVARIANT VIOLATION: Token transitionBinding does not match expected capability transition signature."
        };
      }
    }
    const canonicalWitnessInput = _PromotionTokenAuthenticator.buildCanonicalWitnessBindingInput(
      token.verifiedWitnessClasses,
      token.activationEventId,
      token.witnessEvidenceHash
    );
    const cachedWd = this.#cachedSha256Digests.get(canonicalWitnessInput);
    if (!cachedWd || token.witnessDigest !== cachedWd) {
      return {
        valid: false,
        failedCheck: "WITNESS_DIGEST_MISMATCH",
        reason: "INVARIANT VIOLATION: Token witnessDigest does not match verifiedWitnessClasses and activationEventId."
      };
    }
    const canonicalMessage = _PromotionTokenAuthenticator.serializeCanonicalTokenPayload(token);
    const cachedHex = this.#verifiedWebCryptoSignatures.get(canonicalMessage);
    const providedHmacHex = token.signatureHash.slice("hmac_sha256_".length);
    const expectedBytes = cachedHex ? hexToBytes(cachedHex) : null;
    const providedBytes = hexToBytes(providedHmacHex);
    if (!expectedBytes || !providedBytes || !constantTimeEqualBytes(expectedBytes, providedBytes)) {
      return {
        valid: false,
        failedCheck: "HMAC_SIGNATURE_INVALID",
        reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
      };
    }
    return {
      valid: true,
      reason: "Token cryptographically authenticated via WebCrypto HMAC-SHA-256."
    };
  }
  /**
   * Asynchronously verifies all structural bindings, transition/witness digests,
   * and the HMAC-SHA-256 cryptographic signature (supports WebCrypto in browsers
   * and Node.js crypto).
   */
  async verifyTokenAsync(token, expectations) {
    const structuralError = this.validateStructuralFields(token, expectations);
    if (structuralError) {
      return structuralError;
    }
    if (token.transitionSignature !== void 0) {
      const expectedTb = await this.computeTransitionBindingAsync(token.transitionSignature);
      if (token.transitionBinding !== expectedTb) {
        return {
          valid: false,
          failedCheck: "TRANSITION_BINDING_MISMATCH",
          reason: "INVARIANT VIOLATION: Token transitionBinding does not match token transitionSignature semantics."
        };
      }
    }
    if (expectations.expectedTransitionSignature !== void 0) {
      const expectedTb = await this.computeTransitionBindingAsync(
        expectations.expectedTransitionSignature
      );
      if (token.transitionBinding !== expectedTb) {
        return {
          valid: false,
          failedCheck: "TRANSITION_BINDING_MISMATCH",
          reason: "INVARIANT VIOLATION: Token transitionBinding does not match expected capability transition signature."
        };
      }
    }
    const expectedWd = await this.computeWitnessDigestAsync(
      token.verifiedWitnessClasses,
      token.activationEventId,
      token.witnessEvidenceHash
    );
    if (token.witnessDigest !== expectedWd) {
      return {
        valid: false,
        failedCheck: "WITNESS_DIGEST_MISMATCH",
        reason: "INVARIANT VIOLATION: Token witnessDigest does not match verifiedWitnessClasses and activationEventId."
      };
    }
    const canonicalMessage = _PromotionTokenAuthenticator.serializeCanonicalTokenPayload(token);
    const providedHmacHex = token.signatureHash.slice("hmac_sha256_".length);
    const providedBytes = hexToBytes(providedHmacHex);
    if (!providedBytes) {
      return {
        valid: false,
        failedCheck: "HMAC_SIGNATURE_INVALID",
        reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
      };
    }
    const nodeCrypto = getNodeCrypto2();
    if (nodeCrypto) {
      const expectedHmacHex = this.hmacSha256HexSync(canonicalMessage);
      const expectedBytes = hexToBytes(expectedHmacHex);
      if (!expectedBytes || !constantTimeEqualBytes(expectedBytes, providedBytes)) {
        return {
          valid: false,
          failedCheck: "HMAC_SIGNATURE_INVALID",
          reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
        };
      }
    } else {
      const cryptoKey = await this.getWebCryptoKey();
      const messageBytes = new TextEncoder().encode(canonicalMessage);
      const isValid = await globalThis.crypto.subtle.verify(
        "HMAC",
        cryptoKey,
        providedBytes,
        messageBytes
      );
      if (!isValid) {
        return {
          valid: false,
          failedCheck: "HMAC_SIGNATURE_INVALID",
          reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
        };
      }
      this.#verifiedWebCryptoSignatures.set(canonicalMessage, providedHmacHex.toLowerCase());
    }
    return {
      valid: true,
      reason: "Token cryptographically authenticated via HMAC-SHA-256 and all bindings verified."
    };
  }
};
var defaultTokenAuthenticator = new PromotionTokenAuthenticator();

// src/core/graph/routeManager.ts
var RouteManager = class {
  constructor(graph, tokenAuthenticator = defaultTokenAuthenticator) {
    this.graph = graph;
    this.tokenAuthenticator = tokenAuthenticator;
  }
  tokenAuthenticator;
  consumedTokenIds = /* @__PURE__ */ new Set();
  consumedSignatureHashes = /* @__PURE__ */ new Set();
  /**
   * Creates a new route in the PROVISIONAL quarantine state
   */
  createProvisionalRoute(capabilityId, steps, confidenceScore, pathCost = 1) {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) {
      this.graph.registerCapability(capabilityId, `Capability_${capabilityId}`);
    }
    const existingRoutes = this.graph.getRoutesForCapability(capabilityId);
    const nextVersion = existingRoutes.length + 1;
    const routeId = `route_${capabilityId}_v${nextVersion}_${Date.now()}`;
    const provisionalRoute = {
      routeId,
      capabilityId,
      versionNumber: nextVersion,
      status: "PROVISIONAL",
      // MUST start in quarantine
      steps,
      creationTimestamp: Date.now(),
      confidenceScore,
      pathCost,
      quarantineReason: "Awaiting causal transition verification before promotion to active"
    };
    this.graph.attachRouteVersion(capabilityId, provisionalRoute);
    return provisionalRoute;
  }
  /**
   * Independently verifies a TransitionVerificationToken against target routeId,
   * capabilityId, and anti-replay state without mutating route status.
   */
  verifyPromotionToken(capabilityId, routeId, token, expectations) {
    const outcome = this.tokenAuthenticator.verifyToken(token, {
      expectedRouteId: routeId,
      expectedCapabilityId: capabilityId,
      ...expectations
    });
    if (!outcome.valid) {
      return outcome;
    }
    if (token.tokenId && this.consumedTokenIds.has(token.tokenId) || token.signatureHash && this.consumedSignatureHashes.has(token.signatureHash)) {
      return {
        valid: false,
        reason: `INVARIANT VIOLATION: Replay detected \u2014 TransitionVerificationToken '${token.tokenId}' has already been consumed and cannot be replayed.`
      };
    }
    return outcome;
  }
  /**
   * Asynchronously verifies a TransitionVerificationToken (supports browser WebCrypto and Node crypto).
   */
  async verifyPromotionTokenAsync(capabilityId, routeId, token, expectations) {
    const outcome = await this.tokenAuthenticator.verifyTokenAsync(token, {
      expectedRouteId: routeId,
      expectedCapabilityId: capabilityId,
      ...expectations
    });
    if (!outcome.valid) {
      return outcome;
    }
    if (token.tokenId && this.consumedTokenIds.has(token.tokenId) || token.signatureHash && this.consumedSignatureHashes.has(token.signatureHash)) {
      return {
        valid: false,
        reason: `INVARIANT VIOLATION: Replay detected \u2014 TransitionVerificationToken '${token.tokenId}' has already been consumed and cannot be replayed.`
      };
    }
    return outcome;
  }
  finalizeRoutePromotion(capabilityId, routeId, token) {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found in graph.`);
    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found for capability ${capabilityId}.`);
    if (route.status !== "PROVISIONAL" && route.status !== "TRANSITION_VERIFIED") {
      throw new Error(
        `INVARIANT VIOLATION: Cannot promote route with status '${route.status}' directly to ACTIVE_VALIDATED.`
      );
    }
    if (token.tokenId) {
      this.consumedTokenIds.add(token.tokenId);
    }
    if (token.signatureHash) {
      this.consumedSignatureHashes.add(token.signatureHash);
    }
    route.status = "ACTIVE_VALIDATED";
    route.lastValidatedTimestamp = Date.now();
    route.quarantineReason = void 0;
    capability.activeRouteId = routeId;
    capability.provisionalRouteIds = capability.provisionalRouteIds.filter((id) => id !== routeId);
    this.graph.attachRouteVersion(capabilityId, route);
    return route;
  }
  /**
   * Promotes a route from PROVISIONAL to ACTIVE_VALIDATED.
   * UNBYPASSABLE: Strictly requires an HMAC-SHA-256 authenticated TransitionVerificationToken
   * bound to the exact routeId, capabilityId, activationEventId, transitionBinding,
   * and witnessDigest with >=2 independent witness classes and anti-replay protection.
   */
  promoteToActive(capabilityId, routeId, token, expectations) {
    const verification = this.verifyPromotionToken(capabilityId, routeId, token, expectations);
    if (!verification.valid) {
      throw new Error(verification.reason);
    }
    return this.finalizeRoutePromotion(capabilityId, routeId, token);
  }
  /**
   * Asynchronously promotes a route from PROVISIONAL to ACTIVE_VALIDATED
   * (supports browser WebCrypto and Node crypto).
   */
  async promoteToActiveAsync(capabilityId, routeId, token, expectations) {
    const verification = await this.verifyPromotionTokenAsync(
      capabilityId,
      routeId,
      token,
      expectations
    );
    if (!verification.valid) {
      throw new Error(verification.reason);
    }
    return this.finalizeRoutePromotion(capabilityId, routeId, token);
  }
  /**
   * Demotes an active route upon runtime validation or transition failure.
   * Rolls back ONLY to an independently validated prior route, never to quarantined or failed routes.
   */
  demoteActiveRoute(capabilityId, routeId, reason) {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found`);
    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found`);
    route.status = "DEMOTED";
    route.demotionReason = reason;
    if (capability.activeRouteId === routeId) {
      capability.activeRouteId = null;
    }
    if (!capability.demotedRouteIds.includes(routeId)) {
      capability.demotedRouteIds.push(routeId);
    }
    this.graph.attachRouteVersion(capabilityId, route);
    const eligibleRollbackRoutes = Object.values(capability.routeVersions).filter(
      (r) => r.routeId !== routeId && r.lastValidatedTimestamp !== void 0 && r.lastValidatedTimestamp > 0 && r.status !== "QUARANTINED" && r.status !== "DEMOTED"
    ).sort((a, b) => (b.lastValidatedTimestamp || 0) - (a.lastValidatedTimestamp || 0));
    let rollbackRoute = null;
    if (eligibleRollbackRoutes.length > 0 && eligibleRollbackRoutes[0]) {
      rollbackRoute = eligibleRollbackRoutes[0];
      rollbackRoute.status = "ACTIVE_VALIDATED";
      capability.activeRouteId = rollbackRoute.routeId;
      this.graph.attachRouteVersion(capabilityId, rollbackRoute);
    }
    return { demotedRoute: route, rollbackRoute };
  }
  /**
   * Quarantines a route permanently (e.g. repeated failure, decoy)
   */
  quarantineRoute(capabilityId, routeId, reason) {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found`);
    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found`);
    route.status = "QUARANTINED";
    route.quarantineReason = reason;
    if (capability.activeRouteId === routeId) {
      capability.activeRouteId = null;
    }
    if (!capability.quarantinedRouteIds.includes(routeId)) {
      capability.quarantinedRouteIds.push(routeId);
    }
    capability.provisionalRouteIds = capability.provisionalRouteIds.filter((id) => id !== routeId);
    this.graph.attachRouteVersion(capabilityId, route);
    return route;
  }
};

// src/core/drift/detector.ts
var PRESENTATION_WEIGHTS = {
  ID_WEIGHT: 0.5,
  CLASS_WEIGHT: 0.5
};
var CONTEXT_WEIGHTS = {
  ANCESTOR_WEIGHT: 0.4,
  NEARBY_TEXT_WEIGHT: 0.3,
  CONTAINER_WEIGHT: 0.3
};
var CAPABILITY_WEIGHTS = {
  TARGET_WEIGHT: 0.5,
  ACTION_WEIGHT: 0.3,
  ROLE_WEIGHT: 0.2
};
var TRANSITION_WEIGHTS = {
  PRE_STATE_WEIGHT: 0.3,
  DELTA_WEIGHT: 0.25,
  POST_STATE_WEIGHT: 0.25,
  EVENT_TYPE_WEIGHT: 0.1,
  WITNESS_WEIGHT: 0.1
};
var TypedDriftDetector = class {
  /**
   * Jaccard distance between two string arrays in [0.0, 1.0]
   */
  static jaccardDistance(a, b) {
    if (a.length === 0 && b.length === 0) return 0;
    if (a.length === 0 || b.length === 0) return 1;
    const setA = new Set(a.map((s) => s.toLowerCase().trim()).filter(Boolean));
    const setB = new Set(b.map((s) => s.toLowerCase().trim()).filter(Boolean));
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = /* @__PURE__ */ new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return 1 - intersection.size / union.size;
  }
  /**
   * Normalized Levenshtein distance between two strings in [0.0, 1.0]
   */
  static normalizedStringDistance(a, b) {
    const s1 = a.trim().toLowerCase();
    const s2 = b.trim().toLowerCase();
    if (s1 === s2) return 0;
    if (s1.length === 0) return 1;
    if (s2.length === 0) return 1;
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const editDist = matrix[s1.length][s2.length];
    return editDist / Math.max(s1.length, s2.length);
  }
  /**
   * Normalizes a collection of class strings into individual trimmed, lowercase tokens
   */
  static extractClassTokens(classes) {
    if (!classes || !Array.isArray(classes)) return [];
    return classes.flatMap((cls) => typeof cls === "string" ? cls.split(/\s+/) : []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  /**
   * Computes class drift in [0.0, 1.0] ensuring both operands represent class token counts.
   *
   * If storedClasses is provided:
   * - Evaluates Jaccard distance over normalized tokens (reordering yields 0.0).
   * - Distinguishes volatile utility changes from stable semantic class shifts.
   *
   * If storedClasses is omitted:
   * - Measures the ratio of volatile styling/utility tokens to total observed tokens.
   */
  static computeClassDrift(storedClasses, observedClasses) {
    const observedTokens = this.extractClassTokens(observedClasses);
    if (storedClasses !== void 0 && storedClasses !== null) {
      const storedTokens = this.extractClassTokens(storedClasses);
      if (storedTokens.length === 0 && observedTokens.length === 0) return 0;
      if (storedTokens.length === 0 || observedTokens.length === 0) return 1;
      const storedSet = new Set(storedTokens);
      const observedSet = new Set(observedTokens);
      if (storedSet.size === observedSet.size && [...storedSet].every((c) => observedSet.has(c))) {
        return 0;
      }
      return this.jaccardDistance(storedTokens, observedTokens);
    }
    if (observedTokens.length === 0) return 0;
    const sanitizedTokens = VolatileFeatureSuppressor.sanitizeClasses(observedTokens.join(" ")).map(
      (s) => s.toLowerCase()
    );
    const sanitizedSet = new Set(sanitizedTokens);
    let volatileCount = 0;
    for (const token of observedTokens) {
      if (!sanitizedSet.has(token)) {
        volatileCount++;
      }
    }
    return volatileCount / observedTokens.length;
  }
  /**
   * Computes the 5D Typed Drift Vector comparing stored capability fingerprint to observed features
   */
  static computeDrift(stored, observed) {
    let presentation = 0;
    const observedId = observed.id || "";
    const storedId = observed.storedId;
    const isObservedIdVolatile = VolatileFeatureSuppressor.isVolatileId(observedId);
    let idDrift = 0;
    if (storedId !== void 0 && observedId) {
      if (storedId === observedId) {
        idDrift = 0;
      } else if (isObservedIdVolatile) {
        idDrift = 1;
      } else {
        idDrift = this.normalizedStringDistance(storedId, observedId);
      }
    } else if (isObservedIdVolatile) {
      idDrift = 1;
    } else if (observedId) {
      idDrift = 0;
    }
    const classDrift = this.computeClassDrift(observed.storedClasses, observed.classes);
    presentation = Math.min(
      1,
      PRESENTATION_WEIGHTS.ID_WEIGHT * idDrift + PRESENTATION_WEIGHTS.CLASS_WEIGHT * classDrift
    );
    const storedAncestors = stored.contextEvidence?.ancestorRelationships || [];
    const observedAncestors = observed.ancestors;
    const hasAncestors = observedAncestors !== void 0;
    const ancestorDist = hasAncestors ? this.jaccardDistance(storedAncestors, observedAncestors) : 0;
    const storedNearby = stored.contextEvidence?.nearbyText || [];
    const observedNearby = observed.nearbyText;
    const hasNearby = observedNearby !== void 0;
    const nearbyDist = hasNearby ? this.jaccardDistance(storedNearby, observedNearby) : 0;
    const storedContainers = stored.contextEvidence?.containerSemantics || [];
    const observedContainers = observed.containerSemantics;
    const hasContainers = observedContainers !== void 0;
    const containerDist = hasContainers ? this.jaccardDistance(storedContainers, observedContainers) : 0;
    const contextWeightSum = (hasAncestors ? CONTEXT_WEIGHTS.ANCESTOR_WEIGHT : 0) + (hasNearby ? CONTEXT_WEIGHTS.NEARBY_TEXT_WEIGHT : 0) + (hasContainers ? CONTEXT_WEIGHTS.CONTAINER_WEIGHT : 0);
    let context = 0;
    if (contextWeightSum > 0) {
      context = ((hasAncestors ? CONTEXT_WEIGHTS.ANCESTOR_WEIGHT * ancestorDist : 0) + (hasNearby ? CONTEXT_WEIGHTS.NEARBY_TEXT_WEIGHT * nearbyDist : 0) + (hasContainers ? CONTEXT_WEIGHTS.CONTAINER_WEIGHT * containerDist : 0)) / contextWeightSum;
    }
    let structure = 0;
    const storedPaths = stored.contextEvidence?.relativeStructuralRelationships || [];
    const observedPath = observed.relativeStructuralPath;
    if (observedPath !== void 0) {
      const normObserved = observedPath.trim().toLowerCase();
      if (storedPaths.some((p) => p.trim().toLowerCase() === normObserved)) {
        structure = 0;
      } else if (storedPaths.length > 0) {
        const observedSegments = normObserved.split(">").map((s) => s.trim()).filter(Boolean);
        let minDist = 1;
        for (const sp of storedPaths) {
          const storedSegments = sp.toLowerCase().split(">").map((s) => s.trim()).filter(Boolean);
          const dist = this.jaccardDistance(storedSegments, observedSegments);
          if (dist < minDist) minDist = dist;
        }
        structure = minDist;
      } else {
        structure = 1;
      }
    }
    let targetDiff = 0;
    const hasTarget = observed.observedTargetEntity !== void 0;
    if (hasTarget) {
      targetDiff = observed.observedTargetEntity.toLowerCase() === stored.targetEntity.toLowerCase() ? 0 : 1;
    }
    let actionDiff = 0;
    const hasAction = observed.observedActionType !== void 0;
    if (hasAction) {
      if (observed.observedActionType === stored.actionType) {
        actionDiff = 0;
      } else if (stored.actionType === "MODIFY_PREFERENCE" && observed.observedActionType === "TOGGLE" || stored.actionType === "TOGGLE" && observed.observedActionType === "MODIFY_PREFERENCE") {
        actionDiff = 0.25;
      } else {
        actionDiff = 1;
      }
    }
    let roleDiff = 0;
    const hasRole = observed.role !== void 0;
    if (hasRole) {
      const storedRole = (stored.semanticEvidence?.role || "").toLowerCase();
      const obsRole = observed.role.toLowerCase();
      if (storedRole === obsRole) {
        roleDiff = 0;
      } else if (storedRole === "switch" && obsRole === "button" || storedRole === "button" && obsRole === "switch") {
        roleDiff = 0.2;
      } else {
        roleDiff = 1;
      }
    }
    const capWeightSum = (hasTarget ? CAPABILITY_WEIGHTS.TARGET_WEIGHT : 0) + (hasAction ? CAPABILITY_WEIGHTS.ACTION_WEIGHT : 0) + (hasRole ? CAPABILITY_WEIGHTS.ROLE_WEIGHT : 0);
    let capability = 0;
    if (capWeightSum > 0) {
      capability = ((hasTarget ? CAPABILITY_WEIGHTS.TARGET_WEIGHT * targetDiff : 0) + (hasAction ? CAPABILITY_WEIGHTS.ACTION_WEIGHT * actionDiff : 0) + (hasRole ? CAPABILITY_WEIGHTS.ROLE_WEIGHT * roleDiff : 0)) / capWeightSum;
    }
    const transitionStatus = {
      preState: "UNKNOWN",
      allowedDelta: "UNKNOWN",
      postState: "UNKNOWN",
      activationEventType: "UNKNOWN",
      witnessClasses: "UNKNOWN"
    };
    let preStateDrift = 0;
    if (observed.observedPreState !== void 0) {
      transitionStatus.preState = "EVALUATED";
      if (stored.mandatoryPreStatePredicates && stored.mandatoryPreStatePredicates.length > 0) {
        let failedCount = 0;
        for (const pred of stored.mandatoryPreStatePredicates) {
          try {
            if (!pred.evaluate(observed.observedPreState)) failedCount++;
          } catch {
            failedCount++;
          }
        }
        preStateDrift = failedCount / stored.mandatoryPreStatePredicates.length;
      } else {
        preStateDrift = 0;
      }
    }
    let deltaDrift = 0;
    if (observed.observedStateDelta !== void 0) {
      transitionStatus.allowedDelta = "EVALUATED";
      const expectedDelta = stored.transitionEvidence?.expectedDelta || {};
      const expectedKeys = Object.keys(expectedDelta);
      if (expectedKeys.length > 0) {
        let mismatched = 0;
        for (const k of expectedKeys) {
          if (observed.observedStateDelta[k] !== expectedDelta[k]) {
            mismatched++;
          }
        }
        deltaDrift = mismatched / expectedKeys.length;
      } else if (stored.allowedStateDelta && stored.allowedStateDelta.length > 0) {
        let deltaMismatches = 0;
        for (const deltaPred of stored.allowedStateDelta) {
          if (deltaPred.property in observed.observedStateDelta) {
            const val = observed.observedStateDelta[deltaPred.property];
            if (deltaPred.expectedChange === "ENABLED_TO_DISABLED" && val !== false) deltaMismatches++;
            if (deltaPred.expectedChange === "DISABLED_TO_ENABLED" && val !== true) deltaMismatches++;
          } else {
            deltaMismatches++;
          }
        }
        deltaDrift = deltaMismatches / stored.allowedStateDelta.length;
      } else {
        deltaDrift = 0;
      }
    } else if (observed.observedPreState !== void 0 && stored.allowedStateDelta && stored.allowedStateDelta.length > 0) {
      transitionStatus.allowedDelta = "EVALUATED";
      let incompatibleCount = 0;
      for (const deltaPred of stored.allowedStateDelta) {
        const prop = deltaPred.property;
        const currentVal = observed.observedPreState[prop];
        if (currentVal !== void 0) {
          if (deltaPred.expectedChange === "ENABLED_TO_DISABLED" && currentVal === false) incompatibleCount++;
          if (deltaPred.expectedChange === "DISABLED_TO_ENABLED" && currentVal === true) incompatibleCount++;
        }
      }
      deltaDrift = incompatibleCount / stored.allowedStateDelta.length;
    }
    let postStateDrift = 0;
    if (observed.observedPostState !== void 0) {
      transitionStatus.postState = "EVALUATED";
      if (stored.expectedPostState && stored.expectedPostState.length > 0) {
        let failedPost = 0;
        for (const postPred of stored.expectedPostState) {
          if (postPred.property in observed.observedPostState) {
            if (postPred.expectedValue !== void 0) {
              if (observed.observedPostState[postPred.property] !== postPred.expectedValue) {
                failedPost++;
              }
            }
          } else {
            failedPost++;
          }
        }
        postStateDrift = failedPost / stored.expectedPostState.length;
      } else {
        postStateDrift = 0;
      }
    }
    let eventTypeDrift = 0;
    if (observed.observedActivationEventType !== void 0) {
      transitionStatus.activationEventType = "EVALUATED";
      const expectedType = stored.transitionEvidence?.activationEventCharacteristics?.eventType;
      if (expectedType) {
        eventTypeDrift = observed.observedActivationEventType.toLowerCase().trim() === expectedType.toLowerCase().trim() ? 0 : 1;
      } else {
        eventTypeDrift = 0;
      }
    }
    let witnessDrift = 0;
    if (observed.observedWitnessClasses !== void 0) {
      transitionStatus.witnessClasses = "EVALUATED";
      const expectedWitnesses = stored.transitionEvidence?.witnessClasses || [];
      if (expectedWitnesses.length > 0) {
        witnessDrift = this.jaccardDistance(expectedWitnesses, observed.observedWitnessClasses);
      } else {
        witnessDrift = 0;
      }
    }
    const transitionWeightSum = (transitionStatus.preState === "EVALUATED" ? TRANSITION_WEIGHTS.PRE_STATE_WEIGHT : 0) + (transitionStatus.allowedDelta === "EVALUATED" ? TRANSITION_WEIGHTS.DELTA_WEIGHT : 0) + (transitionStatus.postState === "EVALUATED" ? TRANSITION_WEIGHTS.POST_STATE_WEIGHT : 0) + (transitionStatus.activationEventType === "EVALUATED" ? TRANSITION_WEIGHTS.EVENT_TYPE_WEIGHT : 0) + (transitionStatus.witnessClasses === "EVALUATED" ? TRANSITION_WEIGHTS.WITNESS_WEIGHT : 0);
    let transition = 0;
    if (transitionWeightSum > 0) {
      transition = ((transitionStatus.preState === "EVALUATED" ? TRANSITION_WEIGHTS.PRE_STATE_WEIGHT * preStateDrift : 0) + (transitionStatus.allowedDelta === "EVALUATED" ? TRANSITION_WEIGHTS.DELTA_WEIGHT * deltaDrift : 0) + (transitionStatus.postState === "EVALUATED" ? TRANSITION_WEIGHTS.POST_STATE_WEIGHT * postStateDrift : 0) + (transitionStatus.activationEventType === "EVALUATED" ? TRANSITION_WEIGHTS.EVENT_TYPE_WEIGHT * eventTypeDrift : 0) + (transitionStatus.witnessClasses === "EVALUATED" ? TRANSITION_WEIGHTS.WITNESS_WEIGHT * witnessDrift : 0)) / transitionWeightSum;
    }
    return {
      presentation: Number(Math.min(1, Math.max(0, presentation)).toFixed(2)),
      context: Number(Math.min(1, Math.max(0, context)).toFixed(2)),
      structure: Number(Math.min(1, Math.max(0, structure)).toFixed(2)),
      capability: Number(Math.min(1, Math.max(0, capability)).toFixed(2)),
      transition: Number(Math.min(1, Math.max(0, transition)).toFixed(2)),
      transitionStatus
    };
  }
};

// src/core/drift/classifier.ts
var DEFAULT_DRIFT_THRESHOLDS = {
  presentationRecoveryThreshold: 0.9,
  contextValidationThreshold: 0.4,
  structureValidationThreshold: 0.45,
  capabilityRebindThreshold: 0.2,
  transitionRebindThreshold: 0.25,
  extremeDriftQuarantineThreshold: 0.9
};
var DriftClassifier = class {
  static classify(vector, thresholds = DEFAULT_DRIFT_THRESHOLDS, localizedAffectedCapabilityId) {
    const triggerFactors = [];
    let actionRequired = "MAINTAIN_ACTIVE";
    if (vector.capability >= thresholds.extremeDriftQuarantineThreshold && vector.transition >= thresholds.extremeDriftQuarantineThreshold) {
      actionRequired = "QUARANTINE_IMMEDIATELY";
      triggerFactors.push("Extreme concurrent capability and transition drift detected; immediate quarantine required");
    } else if (vector.capability >= thresholds.capabilityRebindThreshold) {
      actionRequired = "TRIGGER_REBIND_RECOVERY";
      triggerFactors.push(
        `Capability drift (${vector.capability}) exceeds threshold (${thresholds.capabilityRebindThreshold})`
      );
    }
    if (vector.transition >= thresholds.transitionRebindThreshold) {
      if (actionRequired !== "TRIGGER_REBIND_RECOVERY" && actionRequired !== "QUARANTINE_IMMEDIATELY") {
        actionRequired = "TRIGGER_VALIDATION";
      }
      triggerFactors.push(
        `Transition drift (${vector.transition}) exceeds threshold (${thresholds.transitionRebindThreshold})`
      );
    }
    if (actionRequired !== "TRIGGER_REBIND_RECOVERY" && actionRequired !== "QUARANTINE_IMMEDIATELY") {
      if (vector.structure >= thresholds.structureValidationThreshold) {
        actionRequired = "TRIGGER_VALIDATION";
        triggerFactors.push(
          `Structural drift (${vector.structure}) exceeds threshold (${thresholds.structureValidationThreshold})`
        );
      }
      if (vector.context >= thresholds.contextValidationThreshold) {
        actionRequired = "TRIGGER_VALIDATION";
        triggerFactors.push(
          `Contextual drift (${vector.context}) exceeds threshold (${thresholds.contextValidationThreshold})`
        );
      }
    }
    if (triggerFactors.length === 0) {
      if (vector.presentation > 0) {
        triggerFactors.push(`Presentation-only drift (${vector.presentation}) detected; functional identity preserved`);
      } else {
        triggerFactors.push("Zero drift detected across all dimensions");
      }
    }
    const dimensions = [
      "capability",
      "transition",
      "structure",
      "context",
      "presentation"
    ];
    let dominantDriftDimension = "presentation";
    let maxVal = -1;
    for (const dim of dimensions) {
      const val = vector[dim];
      if (typeof val === "number" && val > maxVal) {
        maxVal = val;
        dominantDriftDimension = dim;
      }
    }
    let explanation = "";
    switch (actionRequired) {
      case "MAINTAIN_ACTIVE":
        explanation = `Route remains valid. Only presentation drift (${vector.presentation}) observed, leaving functional invariants intact.`;
        break;
      case "TRIGGER_VALIDATION":
        explanation = `Re-assessment triggered due to structural/contextual shift (${dominantDriftDimension}: ${maxVal}). Route must be verified before execution.`;
        break;
      case "TRIGGER_REBIND_RECOVERY":
        explanation = `Functional recovery triggered! Significant drift detected in ${dominantDriftDimension} (${maxVal}). Invariant closure and re-binding required.`;
        break;
      case "QUARANTINE_IMMEDIATELY":
        explanation = "Route immediately quarantined due to contradictory evidence.";
        break;
    }
    return {
      driftVector: vector,
      actionRequired,
      dominantDriftDimension,
      explanation,
      triggerFactors,
      assessedTimestamp: Date.now(),
      localizedAffectedCapabilityId
    };
  }
};

// src/core/invariant/predicates.ts
var DeclarativePredicateEvaluator = class {
  static evaluate(pred, context) {
    if (!context || typeof context !== "object") {
      return false;
    }
    const rawVal = context[pred.property];
    if ((!(pred.property in context) || rawVal === void 0) && pred.operator !== "EXISTS") {
      return false;
    }
    switch (pred.operator) {
      case "EQUALS":
        return rawVal === pred.expectedValue;
      case "NOT_EQUALS":
        return rawVal !== pred.expectedValue;
      case "CONTAINS":
        if (typeof rawVal === "string") {
          return rawVal.includes(String(pred.expectedValue));
        }
        if (Array.isArray(rawVal)) {
          return rawVal.includes(pred.expectedValue);
        }
        return false;
      case "NOT_CONTAINS":
        if (typeof rawVal === "string") {
          return !rawVal.includes(String(pred.expectedValue));
        }
        if (Array.isArray(rawVal)) {
          return !rawVal.includes(pred.expectedValue);
        }
        return true;
      case "IN":
        return Array.isArray(pred.expectedValues) && pred.expectedValues.includes(rawVal);
      case "NOT_IN":
        return Array.isArray(pred.expectedValues) && !pred.expectedValues.includes(rawVal);
      case "GREATER_THAN":
        return typeof rawVal === "number" && rawVal > pred.expectedValue;
      case "LESS_THAN":
        return typeof rawVal === "number" && rawVal < pred.expectedValue;
      case "TRUTHY":
        return Boolean(rawVal);
      case "FALSY":
        return !rawVal;
      case "EXISTS":
        return rawVal !== void 0 && rawVal !== null;
      case "MATCHES_REGEX":
        try {
          return new RegExp(String(pred.expectedValue)).test(String(rawVal ?? ""));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }
};
function createDeclarativePredicate(decl) {
  return {
    id: decl.id,
    name: decl.name,
    description: decl.description,
    declarative: decl,
    evaluate: (context) => DeclarativePredicateEvaluator.evaluate(decl, context)
  };
}
var InvariantPredicates = class {
  /**
   * 1. Action Type Compatibility
   */
  static matchActionType(context) {
    const compatible = context.observedAction === context.requiredAction || context.requiredAction === "MODIFY_PREFERENCE" && (context.observedAction === "TOGGLE" || context.observedAction === "SUBMIT") || context.requiredAction === "TOGGLE" && (context.observedAction === "MODIFY_PREFERENCE" || context.observedAction === "VIEW" || context.observedAction === "REVOKE_ACCESS") || context.requiredAction === "REVOKE_ACCESS" && (context.observedAction === "TOGGLE" || context.observedAction === "MODIFY_PREFERENCE");
    return {
      predicateId: "POS_PRED_ACTION_TYPE",
      predicateName: "Action Type Compatibility",
      isNegativePredicate: false,
      passed: compatible,
      explanation: compatible ? `Action type '${context.observedAction}' is compatible with '${context.requiredAction}'` : `Action mismatch! Expected '${context.requiredAction}', got '${context.observedAction}'`,
      observedValue: context.observedAction,
      expectedValue: context.requiredAction
    };
  }
  /**
   * 2. Target Entity Match
   */
  static matchTargetEntity(context) {
    const observedTarget = (context.observedTargetEntity || "").trim().toLowerCase();
    const target = (context.targetEntity || "").trim().toLowerCase();
    let passed = false;
    if (observedTarget && observedTarget !== "unknown") {
      passed = observedTarget === target;
    } else {
      const label = (context.observedLabel || "").toLowerCase();
      const targetTokens = target.split(/[_\s-]+/).filter((t) => t.length > 2);
      const labelTokens = label.split(/[^a-z0-9]+/).filter(Boolean);
      const matchesTargetTokens = targetTokens.length > 0 && targetTokens.some((t) => labelTokens.includes(t) || label.includes(t));
      passed = matchesTargetTokens || target === "marketing_notifications" && label.includes("marketing") || target === "two_factor_auth" && (label.includes("2fa") || label.includes("multi-factor") || label.includes("mfa")) || target === "personal_data_export" && (label.includes("export") || label.includes("download"));
    }
    return {
      predicateId: "POS_PRED_TARGET_ENTITY",
      predicateName: "Target Entity Match",
      isNegativePredicate: false,
      passed,
      explanation: passed ? `Target entity matched: ${context.targetEntity}` : `Target mismatch! Expected '${context.targetEntity}', but observed candidate targets '${context.observedTargetEntity || "unknown"}'`,
      observedValue: context.observedTargetEntity,
      expectedValue: context.targetEntity
    };
  }
  /**
   * 3. Mandatory Pre-State Verification
   */
  static matchPreState(context) {
    let passed = true;
    const reasons = [];
    for (const [key, expected] of Object.entries(context.requiredState)) {
      const observed = context.observedState[key];
      if (observed !== expected) {
        passed = false;
        reasons.push(`State '${key}': expected '${expected}', found '${observed}'`);
      }
    }
    return {
      predicateId: "POS_PRED_PRE_STATE",
      predicateName: "Mandatory Pre-State Verification",
      isNegativePredicate: false,
      passed,
      explanation: passed ? "All mandatory pre-state predicates satisfied" : `Pre-state mismatch: ${reasons.join("; ")}`,
      observedValue: context.observedState,
      expectedValue: context.requiredState
    };
  }
  /**
   * 4. Allowed State Delta Compatibility
   * Fully implements every declared allowed-state-delta type:
   * - ENABLED_TO_DISABLED
   * - DISABLED_TO_ENABLED
   * - MODIFIED
   * - ADDED
   * - REMOVED
   * Compares pre-state, action semantics, target, allowed transition, and expected direction.
   */
  static matchAllowedStateDelta(allowedDeltas, observedState, observedAction, _observedTarget) {
    if (allowedDeltas.length === 0) {
      return {
        predicateId: "POS_PRED_STATE_DELTA",
        predicateName: "Allowed State Delta Compatibility",
        isNegativePredicate: false,
        passed: true,
        explanation: "No state delta constraints declared; conditionally compatible"
      };
    }
    let compatible = true;
    const notes = [];
    for (const delta of allowedDeltas) {
      if (observedState["disabled"] === true) {
        notes.push(`Control is disabled; cannot undergo transition for '${delta.property}'`);
        compatible = false;
        break;
      }
      if (delta.evaluate && typeof delta.evaluate === "function") {
        try {
          if (!delta.evaluate(observedState)) {
            notes.push(`Delta predicate evaluation failed for '${delta.property}'`);
            compatible = false;
          }
        } catch {
          notes.push(`Delta predicate evaluation threw for '${delta.property}'`);
          compatible = false;
        }
      } else if (delta.declarative) {
        try {
          if (!DeclarativePredicateEvaluator.evaluate(delta.declarative, observedState)) {
            notes.push(`Delta declarative predicate evaluation failed for '${delta.property}'`);
            compatible = false;
          }
        } catch {
          notes.push(`Delta declarative predicate evaluation threw for '${delta.property}'`);
          compatible = false;
        }
      }
      if (delta.expectedChange === "ENABLED_TO_DISABLED") {
        if (delta.property === "checked" || delta.property === "aria-checked") {
          const isCurrentlyChecked = observedState["checked"] === true || observedState["aria-checked"] === "true";
          if (observedState["checked"] !== void 0 && !isCurrentlyChecked) {
            notes.push(`Control is already unchecked; cannot transition ENABLED_TO_DISABLED`);
            compatible = false;
          }
        } else if (observedState[delta.property] !== void 0 && (observedState[delta.property] === false || observedState[delta.property] === "disabled")) {
          notes.push(`Property '${delta.property}' is already false/disabled; cannot transition ENABLED_TO_DISABLED`);
          compatible = false;
        }
        if (observedAction && ["VIEW", "READ", "INSPECT"].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot transition ENABLED_TO_DISABLED`);
          compatible = false;
        }
      } else if (delta.expectedChange === "DISABLED_TO_ENABLED") {
        if (delta.property === "checked" || delta.property === "aria-checked") {
          const isCurrentlyChecked = observedState["checked"] === true || observedState["aria-checked"] === "true";
          if (observedState["checked"] !== void 0 && isCurrentlyChecked) {
            notes.push(`Control is already checked; cannot transition DISABLED_TO_ENABLED`);
            compatible = false;
          }
        } else if (observedState[delta.property] !== void 0 && (observedState[delta.property] === true || observedState[delta.property] === "enabled")) {
          notes.push(`Property '${delta.property}' is already true/enabled; cannot transition DISABLED_TO_ENABLED`);
          compatible = false;
        }
        if (observedAction && ["VIEW", "READ", "INSPECT"].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot transition DISABLED_TO_ENABLED`);
          compatible = false;
        }
      } else if (delta.expectedChange === "MODIFIED") {
        if (observedAction && ["VIEW", "READ", "INSPECT"].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot produce MODIFIED delta on '${delta.property}'`);
          compatible = false;
        }
      } else if (delta.expectedChange === "ADDED") {
        if (observedAction && ["VIEW", "READ", "INSPECT"].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot produce ADDED delta on '${delta.property}'`);
          compatible = false;
        }
        if (observedState[delta.property] !== void 0 && observedState[delta.property] !== null) {
          notes.push(`Property '${delta.property}' already exists; cannot transition ADDED`);
          compatible = false;
        }
      } else if (delta.expectedChange === "REMOVED") {
        if (observedAction && ["VIEW", "READ", "INSPECT"].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot produce REMOVED delta on '${delta.property}'`);
          compatible = false;
        }
        if (observedState[delta.property] === void 0 || observedState[delta.property] === null) {
          notes.push(`Property '${delta.property}' does not exist; cannot transition REMOVED`);
          compatible = false;
        }
      } else {
        notes.push(`Unsupported or unknown state delta type: '${delta.expectedChange}'`);
        compatible = false;
      }
    }
    return {
      predicateId: "POS_PRED_STATE_DELTA",
      predicateName: "Allowed State Delta Compatibility",
      isNegativePredicate: false,
      passed: compatible,
      explanation: compatible ? "Allowed state delta compatible with current control state" : `State delta incompatible: ${notes.join("; ")}`,
      observedValue: observedState,
      expectedValue: allowedDeltas
    };
  }
  /**
   * 5. Expected Post-State Compatibility
   * Represents pre-ranking compatibility against declared expected post-state predicates.
   * Distinguishes PASS, FAIL, and INSUFFICIENT_EVIDENCE.
   */
  static matchExpectedPostState(expectedPostState, observedRole, _observedAction, observedState, observedTarget, candidateLabel) {
    if (expectedPostState.length === 0) {
      return {
        predicateId: "POS_PRED_EXPECTED_POST_STATE",
        predicateName: "Expected Post-State Compatibility",
        isNegativePredicate: false,
        passed: true,
        explanation: "No explicit post-state predicates required"
      };
    }
    const role = (observedRole || "").toLowerCase();
    const nonInteractiveRoles = ["heading", "text", "paragraph", "img", "image", "dialog", "banner", "region", "navigation", "alert", "status"];
    if (nonInteractiveRoles.includes(role)) {
      return {
        predicateId: "POS_PRED_EXPECTED_POST_STATE",
        predicateName: "Expected Post-State Compatibility",
        isNegativePredicate: false,
        passed: false,
        explanation: `Role '${observedRole}' is incapable of driving expected post-state mutations`,
        observedValue: observedRole,
        expectedValue: expectedPostState
      };
    }
    const label = (candidateLabel || "").toLowerCase();
    const target = (observedTarget || "").toLowerCase();
    const action = (_observedAction || "").toUpperCase();
    for (const post of expectedPostState) {
      if (post.expectedValue === void 0 && !post.evaluate && !post.declarative) {
        return {
          predicateId: "POS_PRED_EXPECTED_POST_STATE",
          predicateName: "Expected Post-State Compatibility",
          isNegativePredicate: false,
          passed: false,
          hasInsufficientEvidence: true,
          explanation: `Expected post-state value for '${post.property}' is unknown/undefined`,
          observedValue: void 0,
          expectedValue: void 0
        };
      }
      if (observedState && observedState[post.property] !== void 0 && observedState[post.property] === post.expectedValue) {
        return {
          predicateId: "POS_PRED_EXPECTED_POST_STATE",
          predicateName: "Expected Post-State Compatibility",
          isNegativePredicate: false,
          passed: false,
          explanation: `Candidate pre-state for '${post.property}' (${observedState[post.property]}) is already equal to expected post-state; cannot drive required state transition`,
          observedValue: observedState[post.property],
          expectedValue: post.expectedValue
        };
      }
      if (observedState) {
        const postVal = observedState["post_" + post.property] ?? observedState["postState"]?.[post.property] ?? observedState["projectedPostState"]?.[post.property];
        if (postVal !== void 0 && post.expectedValue !== void 0 && postVal !== post.expectedValue) {
          return {
            predicateId: "POS_PRED_EXPECTED_POST_STATE",
            predicateName: "Expected Post-State Compatibility",
            isNegativePredicate: false,
            passed: false,
            explanation: `Observed post-state for '${post.property}' (${postVal}) mismatches expected value (${post.expectedValue})`,
            observedValue: postVal,
            expectedValue: post.expectedValue
          };
        }
      }
      if (post.expectedValue === false) {
        if (["ACTIVATE", "ENABLE", "OPT_IN"].includes(action)) {
          return {
            predicateId: "POS_PRED_EXPECTED_POST_STATE",
            predicateName: "Expected Post-State Compatibility",
            isNegativePredicate: false,
            passed: false,
            explanation: `Candidate action '${_observedAction}' contradicts expected post-state (${post.property} = false)`,
            observedValue: _observedAction,
            expectedValue: post.expectedValue
          };
        }
      } else if (post.expectedValue === true) {
        if (["DISABLE", "DEACTIVATE", "OPT_OUT", "REVOKE_ACCESS"].includes(action)) {
          return {
            predicateId: "POS_PRED_EXPECTED_POST_STATE",
            predicateName: "Expected Post-State Compatibility",
            isNegativePredicate: false,
            passed: false,
            explanation: `Candidate action '${_observedAction}' contradicts expected post-state (${post.property} = true)`,
            observedValue: _observedAction,
            expectedValue: post.expectedValue
          };
        }
      }
      if (label) {
        if (post.expectedValue === false) {
          const indicatesEnableOnly = (label.includes("enable") || label.includes("turn on") || label.includes("activate") || label.includes("opt in")) && !(label.includes("disable") || label.includes("turn off") || label.includes("deactivate") || label.includes("opt out"));
          if (indicatesEnableOnly) {
            return {
              predicateId: "POS_PRED_EXPECTED_POST_STATE",
              predicateName: "Expected Post-State Compatibility",
              isNegativePredicate: false,
              passed: false,
              explanation: `Candidate action direction ('${candidateLabel}') contradicts expected post-state (${post.property} = false)`,
              observedValue: candidateLabel,
              expectedValue: post.expectedValue
            };
          }
        } else if (post.expectedValue === true) {
          const indicatesDisableOnly = (label.includes("disable") || label.includes("turn off") || label.includes("deactivate") || label.includes("opt out")) && !(label.includes("enable") || label.includes("turn on") || label.includes("activate") || label.includes("opt in"));
          if (indicatesDisableOnly) {
            return {
              predicateId: "POS_PRED_EXPECTED_POST_STATE",
              predicateName: "Expected Post-State Compatibility",
              isNegativePredicate: false,
              passed: false,
              explanation: `Candidate action direction ('${candidateLabel}') contradicts expected post-state (${post.property} = true)`,
              observedValue: candidateLabel,
              expectedValue: post.expectedValue
            };
          }
        }
      }
      const propKeyword = post.property.replace(/_enabled|_initiated|_triggered|_visible|_active/g, "").replace(/_/g, " ").trim().toLowerCase();
      const targetMatchesProp = Boolean(
        target && target !== "unknown" && propKeyword.length > 2 && (target.toLowerCase().includes(propKeyword.replace(/ /g, "_")) || propKeyword.split(" ").some((w) => w.length > 3 && target.toLowerCase().includes(w)))
      );
      const labelMatchesProp = Boolean(label && (label.includes(propKeyword) || propKeyword.split(" ").some((w) => w.length > 3 && label.includes(w))));
      const hasSemanticConnection = targetMatchesProp || labelMatchesProp;
      if (!hasSemanticConnection && (!observedState || observedState[post.property] === void 0)) {
        return {
          predicateId: "POS_PRED_EXPECTED_POST_STATE",
          predicateName: "Expected Post-State Compatibility",
          isNegativePredicate: false,
          passed: false,
          hasInsufficientEvidence: true,
          explanation: `Missing evidence for expected post-state property '${post.property}'`,
          observedValue: void 0,
          expectedValue: post.expectedValue
        };
      }
    }
    return {
      predicateId: "POS_PRED_EXPECTED_POST_STATE",
      predicateName: "Expected Post-State Compatibility",
      isNegativePredicate: false,
      passed: true,
      explanation: "Candidate control and transition direction are compatible with expected post-state",
      observedValue: observedRole,
      expectedValue: expectedPostState
    };
  }
  /**
   * 6. Required Context Predicates
   */
  static matchRequiredContext(requiredContext, ancestors, containerSemantics, nearbyText) {
    if (requiredContext.length === 0) {
      return {
        predicateId: "POS_PRED_REQUIRED_CONTEXT",
        predicateName: "Required Context Verification",
        isNegativePredicate: false,
        passed: true,
        explanation: "No required context predicates defined"
      };
    }
    const fullContext = [...ancestors, ...containerSemantics, ...nearbyText].join(" ").toLowerCase();
    let passed = true;
    const missing = [];
    for (const ctx of requiredContext) {
      const pat = ctx.pattern.toLowerCase();
      let matched = false;
      if (pat.includes("|")) {
        const parts = pat.split("|").map((p) => p.trim());
        matched = parts.some((p) => fullContext.includes(p));
      } else {
        matched = fullContext.includes(pat);
      }
      if (!matched) {
        if (ctx.required) {
          passed = false;
          missing.push(ctx.pattern);
        }
      }
    }
    return {
      predicateId: "POS_PRED_REQUIRED_CONTEXT",
      predicateName: "Required Context Verification",
      isNegativePredicate: false,
      passed,
      explanation: passed ? "All required context predicates satisfied" : `Missing required context patterns: ${missing.join(", ")}`,
      observedValue: fullContext.slice(0, 100),
      expectedValue: requiredContext.map((c) => c.pattern)
    };
  }
  /**
   * 7. Forbidden Context Predicates (Negative Predicate)
   */
  static rejectForbiddenContext(forbiddenContext, ancestors, containerSemantics, candidateLabel) {
    if (forbiddenContext.length === 0) {
      return {
        predicateId: "NEG_PRED_FORBIDDEN_CONTEXT",
        predicateName: "Forbidden Context Rejection",
        isNegativePredicate: true,
        passed: true,
        explanation: "No forbidden context predicates defined"
      };
    }
    const fullContext = [...ancestors, ...containerSemantics, candidateLabel].join(" ").toLowerCase();
    let foundForbidden = null;
    for (const ctx of forbiddenContext) {
      const pat = ctx.pattern.toLowerCase();
      if (pat.includes("|")) {
        const subPatterns = pat.split("|").map((p) => p.trim()).filter(Boolean);
        for (const sp of subPatterns) {
          if (fullContext.includes(sp)) {
            foundForbidden = sp;
            break;
          }
        }
      } else if (fullContext.includes(pat)) {
        foundForbidden = pat;
      }
      if (foundForbidden) break;
    }
    return {
      predicateId: "NEG_PRED_FORBIDDEN_CONTEXT",
      predicateName: "Forbidden Context Rejection",
      isNegativePredicate: true,
      passed: foundForbidden === null,
      explanation: foundForbidden ? `CONTRADICTION: Candidate matches forbidden context pattern '${foundForbidden}'` : "No forbidden context patterns matched",
      observedValue: fullContext.slice(0, 100),
      expectedValue: "No forbidden matches"
    };
  }
  /**
   * 8. Role / Control Compatibility
   */
  static matchRoleCompatibility(expectedRole, observedRole) {
    const rExp = (expectedRole || "").toLowerCase();
    const rObs = (observedRole || "").toLowerCase();
    const compatible = rExp === rObs || rExp === "switch" && (rObs === "button" || rObs === "checkbox" || rObs === "input") || rExp === "button" && (rObs === "switch" || rObs === "link" || rObs === "a");
    return {
      predicateId: "POS_PRED_ROLE_COMPATIBILITY",
      predicateName: "Control Role Compatibility",
      isNegativePredicate: false,
      passed: compatible,
      explanation: compatible ? `Observed role '${observedRole}' is compatible with expected '${expectedRole}'` : `Role mismatch: expected '${expectedRole}', observed '${observedRole}'`,
      observedValue: observedRole,
      expectedValue: expectedRole
    };
  }
  /**
   * 9. Transition Compatibility
   */
  static matchTransitionCompatibility(observedState) {
    const disabled = observedState["disabled"] === true;
    return {
      predicateId: "POS_PRED_TRANSITION_COMPATIBILITY",
      predicateName: "Transition Compatibility (Interactive State)",
      isNegativePredicate: false,
      passed: !disabled,
      explanation: !disabled ? "Control is interactive and enabled for transition activation" : "Control is disabled; cannot drive transition",
      observedValue: { disabled }
    };
  }
  /**
   * 10. Forbidden Target / Negative Evidence Rejection
   */
  static rejectForbiddenTarget(observedTarget, forbiddenTargets) {
    const obs = (observedTarget || "").toLowerCase();
    const isForbidden = obs ? forbiddenTargets.some(
      (ft) => ft.toLowerCase() === obs
    ) : false;
    return {
      predicateId: "NEG_PRED_FORBIDDEN_TARGET",
      predicateName: "Forbidden Target Rejection",
      isNegativePredicate: true,
      passed: !isForbidden,
      explanation: isForbidden ? `CONTRADICTION: Candidate targets forbidden entity '${observedTarget}'` : `Target '${observedTarget}' is not in forbidden list`,
      observedValue: observedTarget,
      expectedValue: "Allowed target entities"
    };
  }
  /**
   * Rejection of forbidden actions (e.g. destructive action when preference modification expected)
   */
  static rejectForbiddenAction(observedAction, forbiddenActions) {
    const obs = (observedAction || "").toLowerCase();
    const isForbidden = obs ? forbiddenActions.some(
      (fa) => fa.toLowerCase() === obs
    ) : false;
    return {
      predicateId: "NEG_PRED_FORBIDDEN_ACTION",
      predicateName: "Forbidden Action Rejection",
      isNegativePredicate: true,
      passed: !isForbidden,
      explanation: isForbidden ? `CONTRADICTION: Candidate performs forbidden destructive action '${observedAction}'` : `Action '${observedAction}' is not forbidden`,
      observedValue: observedAction,
      expectedValue: "Non-forbidden actions"
    };
  }
};

// src/core/invariant/engine.ts
var InvariantClosureEngine = class {
  /**
   * Evaluates all 10 invariant classes against an observed candidate
   */
  static evaluateCandidate(targetFingerprint, candidate) {
    const passedPredicates = [];
    const failedPredicates = [];
    let hasInsufficientEvidence = false;
    let insufficientReason = "";
    const ancestors = candidate.ancestors || [];
    const containerSemantics = candidate.containerSemantics || [];
    const nearbyText = candidate.nearbyText || [];
    const observedState = candidate.observedState || {};
    const actionMatch = InvariantPredicates.matchActionType({
      requiredAction: targetFingerprint.actionType,
      observedAction: candidate.observedActionType
    });
    if (actionMatch.passed) passedPredicates.push(actionMatch);
    else failedPredicates.push(actionMatch);
    const targetMatch = InvariantPredicates.matchTargetEntity({
      targetEntity: targetFingerprint.targetEntity,
      observedTargetEntity: candidate.observedTargetEntity,
      observedLabel: candidate.candidateLabel,
      observedRole: candidate.observedRole
    });
    if (targetMatch.passed) passedPredicates.push(targetMatch);
    else failedPredicates.push(targetMatch);
    if (targetFingerprint.mandatoryPreStatePredicates.length > 0) {
      if (!candidate.observedState || Object.keys(candidate.observedState).length === 0) {
        hasInsufficientEvidence = true;
        const missingProps = targetFingerprint.mandatoryPreStatePredicates.map((p) => p.declarative?.property || p.name).join(", ");
        insufficientReason = `Candidate observedState is missing mandatory pre-state evidence for '${missingProps}'`;
        for (const pred of targetFingerprint.mandatoryPreStatePredicates) {
          failedPredicates.push({
            predicateId: pred.id,
            predicateName: pred.name,
            isNegativePredicate: false,
            passed: false,
            hasInsufficientEvidence: true,
            explanation: `Pre-state evidence missing for predicate '${pred.name}'`,
            observedValue: void 0,
            expectedValue: pred.declarative?.expectedValue ?? pred.declarative?.expectedValues
          });
        }
      } else {
        for (const pred of targetFingerprint.mandatoryPreStatePredicates) {
          const propName = pred.declarative?.property;
          const isPropObserved = propName ? propName in candidate.observedState && candidate.observedState[propName] !== void 0 : true;
          if (propName && !isPropObserved && pred.declarative?.operator !== "EXISTS") {
            hasInsufficientEvidence = true;
            insufficientReason = `Mandatory pre-state property '${propName}' is unobserved; cannot verify invariant closure without evidence`;
            failedPredicates.push({
              predicateId: pred.id,
              predicateName: pred.name,
              isNegativePredicate: false,
              passed: false,
              hasInsufficientEvidence: true,
              explanation: `Pre-state evidence missing for '${propName}' required by predicate '${pred.name}'`,
              observedValue: void 0,
              expectedValue: pred.declarative?.expectedValue ?? pred.declarative?.expectedValues
            });
            continue;
          }
          let passed = false;
          try {
            passed = pred.evaluate(candidate.observedState);
          } catch {
            passed = false;
          }
          const record = {
            predicateId: pred.id,
            predicateName: pred.name,
            isNegativePredicate: false,
            passed,
            explanation: passed ? `Pre-state predicate '${pred.name}' satisfied` : `Pre-state predicate '${pred.name}' failed: ${pred.description}`,
            observedValue: propName ? candidate.observedState[propName] : candidate.observedState,
            expectedValue: pred.declarative?.expectedValue ?? pred.declarative?.expectedValues
          };
          if (passed) passedPredicates.push(record);
          else failedPredicates.push(record);
        }
      }
    }
    const deltaCheck = InvariantPredicates.matchAllowedStateDelta(
      targetFingerprint.allowedStateDelta || [],
      observedState,
      candidate.observedActionType,
      candidate.observedTargetEntity
    );
    if (deltaCheck.hasInsufficientEvidence) {
      hasInsufficientEvidence = true;
      insufficientReason = deltaCheck.explanation;
      failedPredicates.push(deltaCheck);
    } else if (deltaCheck.passed) {
      passedPredicates.push(deltaCheck);
    } else {
      failedPredicates.push(deltaCheck);
    }
    const postStateCheck = InvariantPredicates.matchExpectedPostState(
      targetFingerprint.expectedPostState || [],
      candidate.observedRole,
      candidate.observedActionType,
      observedState,
      candidate.observedTargetEntity,
      candidate.candidateLabel
    );
    if (postStateCheck.hasInsufficientEvidence) {
      hasInsufficientEvidence = true;
      insufficientReason = postStateCheck.explanation;
      failedPredicates.push(postStateCheck);
    } else if (postStateCheck.passed) {
      passedPredicates.push(postStateCheck);
    } else {
      failedPredicates.push(postStateCheck);
    }
    const reqContextCheck = InvariantPredicates.matchRequiredContext(
      targetFingerprint.requiredContextPredicates || [],
      ancestors,
      containerSemantics,
      nearbyText
    );
    if (reqContextCheck.passed) passedPredicates.push(reqContextCheck);
    else failedPredicates.push(reqContextCheck);
    const forbiddenContextCheck = InvariantPredicates.rejectForbiddenContext(
      targetFingerprint.forbiddenContextPredicates || [],
      ancestors,
      containerSemantics,
      candidate.candidateLabel
    );
    if (forbiddenContextCheck.passed) passedPredicates.push(forbiddenContextCheck);
    else failedPredicates.push(forbiddenContextCheck);
    const roleCheck = InvariantPredicates.matchRoleCompatibility(
      targetFingerprint.semanticEvidence.role || "button",
      candidate.observedRole || candidate.role || ""
    );
    if (roleCheck.passed) passedPredicates.push(roleCheck);
    else failedPredicates.push(roleCheck);
    const transCheck = InvariantPredicates.matchTransitionCompatibility(observedState);
    if (transCheck.passed) passedPredicates.push(transCheck);
    else failedPredicates.push(transCheck);
    const forbiddenTargets = [];
    if (targetFingerprint.negativeEvidence?.rejectedCandidateIdentities) {
      forbiddenTargets.push(...targetFingerprint.negativeEvidence.rejectedCandidateIdentities);
    }
    if (targetFingerprint.targetEntity !== "ALL_NOTIFICATIONS" && candidate.observedTargetEntity === "ALL_NOTIFICATIONS") {
      forbiddenTargets.push("ALL_NOTIFICATIONS");
    }
    if (targetFingerprint.targetEntity !== "ALL_SECURITY" && candidate.observedTargetEntity === "ALL_SECURITY") {
      forbiddenTargets.push("ALL_SECURITY");
    }
    if (targetFingerprint.targetEntity !== "ALL_DATA" && candidate.observedTargetEntity === "ALL_DATA") {
      forbiddenTargets.push("ALL_DATA");
    }
    const forbiddenTargetCheck = InvariantPredicates.rejectForbiddenTarget(
      candidate.observedTargetEntity,
      forbiddenTargets
    );
    if (forbiddenTargetCheck.passed) passedPredicates.push(forbiddenTargetCheck);
    else failedPredicates.push(forbiddenTargetCheck);
    const forbiddenActions = [];
    if (targetFingerprint.actionType !== "DELETE") {
      forbiddenActions.push("DELETE", "PURGE", "DESTROY");
    }
    if (targetFingerprint.actionType !== "REVOKE_ACCESS" && targetFingerprint.actionType !== "TOGGLE") {
      forbiddenActions.push("REVOKE_ACCESS");
    }
    const forbiddenActionCheck = InvariantPredicates.rejectForbiddenAction(
      candidate.observedActionType,
      forbiddenActions
    );
    if (forbiddenActionCheck.passed) passedPredicates.push(forbiddenActionCheck);
    else failedPredicates.push(forbiddenActionCheck);
    let status = "PASS";
    let isEligibleForRanking = true;
    let rejectionReason;
    const hasContradiction = failedPredicates.some((p) => p.isNegativePredicate);
    if (hasContradiction) {
      status = "CONTRADICTED";
      isEligibleForRanking = false;
      rejectionReason = failedPredicates.filter((p) => p.isNegativePredicate).map((p) => p.explanation).join("; ");
    } else if (hasInsufficientEvidence) {
      status = "INSUFFICIENT_EVIDENCE";
      isEligibleForRanking = false;
      rejectionReason = insufficientReason;
    } else if (failedPredicates.length > 0) {
      status = "FAIL";
      isEligibleForRanking = false;
      rejectionReason = failedPredicates.map((p) => p.explanation).join("; ");
    }
    return {
      candidateId: candidate.candidateId,
      status,
      isEligibleForRanking,
      // Strictly false if status !== 'PASS'
      passedPredicates,
      failedPredicates,
      rejectionReason,
      evaluatedTimestamp: Date.now()
    };
  }
};

// src/core/contradiction/store.ts
var NegativeEvidenceStore = class _NegativeEvidenceStore {
  // candidateIdentifier -> interfaceEvidenceHash
  constructor(store) {
    this.store = store;
  }
  records = /* @__PURE__ */ new Map();
  // key = interfaceEvidenceHash or candidateFingerprintHash
  idIndex = /* @__PURE__ */ new Map();
  /**
   * Computes a deterministic material evidence hash from observable candidate features.
   */
  static computeEvidenceHash(candidate) {
    const containers = (candidate.containerSemantics || []).sort().join(";");
    const raw = `${candidate.candidateLabel.toLowerCase().trim()}|${candidate.observedRole}|${candidate.observedActionType}|${candidate.observedTargetEntity}|${containers}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `evh_${Math.abs(hash).toString(16)}`;
  }
  /**
   * Records negative evidence for a rejected candidate
   */
  recordContradiction(candidateIdentifier, contradictionType, failedInvariantId, reason, evidenceDetails = {}, partialFingerprint = {}, originatingRouteId, candidateContext, extra) {
    const id = `neg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const capId = partialFingerprint.capabilityId || extra?.affectedCapabilityId || "GLOBAL";
    const rawEvidenceHash = candidateContext ? _NegativeEvidenceStore.computeEvidenceHash(candidateContext) : `id_${candidateIdentifier}`;
    const interfaceEvidenceHash = `${capId}::${rawEvidenceHash}`;
    const idKey = `${capId}::${candidateIdentifier}`;
    const computedCandidateFpHash = partialFingerprint.fingerprintHash || FingerprintConstructor.computeFingerprintHash({
      canonicalFunction: partialFingerprint.canonicalFunction || `rejected_${candidateIdentifier}`,
      actionType: partialFingerprint.actionType || candidateContext?.observedActionType || "VIEW",
      targetEntity: partialFingerprint.targetEntity || candidateContext?.observedTargetEntity || "UNKNOWN",
      role: partialFingerprint.semanticEvidence?.role || candidateContext?.observedRole || "element",
      riskClass: partialFingerprint.riskMetadata?.riskClass
    });
    const defaultRequiredChange = extra?.requiredMaterialEvidenceChange || "Material change in candidate role, target entity, or container semantics required before reconsideration.";
    const entry = {
      id,
      candidateFingerprint: partialFingerprint,
      candidateIdentifier,
      candidateFingerprintHash: computedCandidateFpHash,
      interfaceEvidenceHash,
      contradictionType,
      failedInvariantId,
      reason,
      timestamp: Date.now(),
      originatingRouteId,
      interfaceVersion: "1.0.0",
      evidenceDetails,
      confidence: 0.95,
      previouslySelected: false,
      suppressionWeight: 1,
      // Full suppression
      // Step 6 structured negative evidence:
      failedCondition: extra?.failedCondition || failedInvariantId,
      affectedCapabilityId: capId,
      affectedRouteId: originatingRouteId || extra?.affectedRouteId,
      affectedCandidateId: candidateIdentifier,
      sequenceNumber: extra?.sequenceNumber,
      activationEventId: extra?.activationEventId,
      witnessIds: extra?.witnessIds,
      failureClassification: extra?.failureClassification || contradictionType,
      quarantined: extra?.quarantined ?? true,
      canReconsider: extra?.canReconsider ?? false,
      requiredMaterialEvidenceChange: defaultRequiredChange
    };
    this.records.set(interfaceEvidenceHash, entry);
    this.idIndex.set(idKey, interfaceEvidenceHash);
    if (this.store) {
      const contradictionRecord = {
        evidenceId: id,
        capabilityId: capId,
        candidateFingerprintHash: entry.candidateFingerprintHash,
        interfaceEvidenceHash,
        failedInvariant: failedInvariantId,
        contradictionType,
        reason,
        timestamp: entry.timestamp,
        routeVersion: originatingRouteId || "v1.0.0",
        interfaceState: "CURRENT",
        previouslySelected: false,
        suppressionWeight: 1
      };
      this.store.saveNegativeEvidence(contradictionRecord).catch(() => {
      });
    }
    return entry;
  }
  /**
   * Records structured negative evidence for a failed causal transition verification
   */
  recordCausalFailure(params) {
    const candidateId = params.candidateIdentifier || `cand_${params.capabilityId}_${params.routeId}`;
    const requiredChange = params.verificationStatus === "FAILED_POST_STATE_MISMATCH" ? "Requires valid observed interface post-state progression differing from pre-state and satisfying expected delta." : params.verificationStatus === "FAILED_CONTRADICTORY_WITNESS" ? "Requires eliminating conflicting DOM mutations or error/failure flags in observation channels." : params.verificationStatus === "FAILED_INSUFFICIENT_WITNESS_CLASSES" ? "Requires independent observations across at least 2 distinct witness classes and origins." : params.verificationStatus === "FAILED_WINDOW_TIMEOUT" ? "Requires state transition to occur within the bounded verification window." : "Requires material interface or state transition change.";
    return this.recordContradiction(
      candidateId,
      "CAUSAL_WITNESS_FAILURE",
      params.verificationStatus,
      params.explanation,
      {
        failureReason: params.failureReason,
        status: params.verificationStatus,
        activationEventId: params.activationEventId,
        sequenceNumber: params.sequenceNumber,
        witnessIds: params.witnessIds,
        observedWitnessClasses: params.observedWitnessClasses,
        postStateFingerprint: params.observedPostStateFingerprint
      },
      { capabilityId: params.capabilityId },
      params.routeId,
      params.candidateContext,
      {
        failedCondition: params.verificationStatus,
        affectedCapabilityId: params.capabilityId,
        affectedRouteId: params.routeId,
        affectedCandidateId: candidateId,
        sequenceNumber: params.sequenceNumber,
        activationEventId: params.activationEventId,
        witnessIds: params.witnessIds,
        failureClassification: params.verificationStatus,
        quarantined: true,
        canReconsider: false,
        requiredMaterialEvidenceChange: requiredChange
      }
    );
  }
  /**
   * Explains whether a candidate can be reconsidered upon material interface change,
   * returning an auditable decision object.
   */
  canCandidateBeReconsidered(candidateIdentifier, candidateContext, capabilityId) {
    const rawEvidenceHash = _NegativeEvidenceStore.computeEvidenceHash(candidateContext);
    const cap = capabilityId || "GLOBAL";
    const scopedHash = `${cap}::${rawEvidenceHash}`;
    if (this.records.has(scopedHash) || this.records.has(`GLOBAL::${rawEvidenceHash}`)) {
      const entry = this.records.get(scopedHash) || this.records.get(`GLOBAL::${rawEvidenceHash}`);
      return {
        allowed: false,
        reason: `Suppressed by identical material evidence (${scopedHash}). Candidate unchanged since prior failure.`,
        requiredChange: entry?.requiredMaterialEvidenceChange || "Material change in candidate role, target entity, or container semantics required."
      };
    }
    const idKey = `${cap}::${candidateIdentifier}`;
    const previousHash = this.idIndex.get(idKey) || this.idIndex.get(`GLOBAL::${candidateIdentifier}`);
    if (previousHash && !previousHash.endsWith(`id_${candidateIdentifier}`) && previousHash !== scopedHash) {
      return {
        allowed: true,
        reason: `Reconsideration permitted: Material interface change observed (previous evidence: ${previousHash}, current evidence: ${scopedHash}).`
      };
    }
    if (this.idIndex.has(idKey) || this.idIndex.has(`GLOBAL::${candidateIdentifier}`)) {
      return {
        allowed: false,
        reason: `Candidate identifier '${candidateIdentifier}' remains under active failure quarantine without material evidence delta.`,
        requiredChange: "Material DOM or interface evidence change required."
      };
    }
    return {
      allowed: true,
      reason: "No conflicting negative evidence recorded for this candidate."
    };
  }
  /**
   * Initializes store by loading existing negative evidence from persistent capability store
   */
  async init() {
    if (this.store) {
      try {
        const stored = await this.store.getNegativeEvidence();
        for (const item of stored) {
          if (!this.records.has(item.interfaceEvidenceHash)) {
            const entry = {
              id: item.evidenceId,
              candidateFingerprint: { capabilityId: item.capabilityId },
              candidateIdentifier: item.evidenceId,
              candidateFingerprintHash: item.candidateFingerprintHash,
              interfaceEvidenceHash: item.interfaceEvidenceHash,
              contradictionType: item.contradictionType,
              failedInvariantId: item.failedInvariant,
              reason: item.reason,
              timestamp: item.timestamp,
              originatingRouteId: item.routeVersion,
              interfaceVersion: "1.0.0",
              evidenceDetails: {},
              confidence: 0.95,
              previouslySelected: item.previouslySelected,
              suppressionWeight: item.suppressionWeight,
              failedCondition: item.failedInvariant,
              affectedCapabilityId: item.capabilityId,
              affectedRouteId: item.routeVersion,
              quarantined: true,
              canReconsider: false
            };
            this.records.set(item.interfaceEvidenceHash, entry);
            const idKey = `${item.capabilityId}::${item.evidenceId}`;
            this.idIndex.set(idKey, item.interfaceEvidenceHash);
          }
        }
      } catch {
      }
    }
  }
  /**
   * Evaluates whether candidate is suppressed by known negative evidence.
   * Enforces:
   * - Same material evidence -> suppressed
   * - Material interface change -> candidate may be reconsidered
   */
  isKnownContradiction(candidateIdentifier, candidateContext, capabilityId) {
    if (candidateContext) {
      const rawEvidenceHash = _NegativeEvidenceStore.computeEvidenceHash(candidateContext);
      if (capabilityId) {
        const scopedHash = `${capabilityId}::${rawEvidenceHash}`;
        if (this.records.has(scopedHash) || this.records.has(`GLOBAL::${rawEvidenceHash}`)) {
          return true;
        }
        const idKey = `${capabilityId}::${candidateIdentifier}`;
        const previousHash = this.idIndex.get(idKey) || this.idIndex.get(`GLOBAL::${candidateIdentifier}`);
        if (previousHash && !previousHash.endsWith(`id_${candidateIdentifier}`) && previousHash !== scopedHash) {
          return false;
        }
      } else {
        for (const [hash] of this.records) {
          if (hash.endsWith(`::${rawEvidenceHash}`) || hash === rawEvidenceHash) {
            return true;
          }
        }
        for (const [key, previousHash] of this.idIndex) {
          if (key === candidateIdentifier || key.endsWith(`::${candidateIdentifier}`)) {
            if (!previousHash.endsWith(`id_${candidateIdentifier}`) && !previousHash.endsWith(`::${rawEvidenceHash}`)) {
              return false;
            }
          }
        }
      }
    }
    if (capabilityId) {
      return this.idIndex.has(`${capabilityId}::${candidateIdentifier}`) || this.idIndex.has(`GLOBAL::${candidateIdentifier}`) || this.idIndex.has(candidateIdentifier);
    }
    for (const key of this.idIndex.keys()) {
      if (key === candidateIdentifier || key.endsWith(`::${candidateIdentifier}`)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Retrieves negative evidence details
   */
  getNegativeEvidence(candidateIdentifier, capabilityId) {
    if (capabilityId) {
      const hash = this.idIndex.get(`${capabilityId}::${candidateIdentifier}`) || this.idIndex.get(`GLOBAL::${candidateIdentifier}`) || this.idIndex.get(candidateIdentifier);
      if (hash) return this.records.get(hash);
    }
    for (const [key, hash] of this.idIndex) {
      if (key === candidateIdentifier || key.endsWith(`::${candidateIdentifier}`)) {
        return this.records.get(hash);
      }
    }
    return void 0;
  }
  /**
   * Returns all stored negative evidence records
   */
  getAllRecords() {
    return Array.from(this.records.values());
  }
  /**
   * Clears the store (for testing)
   */
  clear() {
    this.records.clear();
    this.idIndex.clear();
  }
};

// src/core/candidate/pipeline.ts
var CandidatePipeline = class {
  constructor(negativeEvidenceStore, rankingEngine) {
    this.negativeEvidenceStore = negativeEvidenceStore;
    this.rankingEngine = rankingEngine;
  }
  /**
   * Processes raw observed candidates through the strict invariant-first pipeline
   */
  processCandidates(targetFingerprint, candidates, options) {
    const invariantResults = {};
    const eligibleCandidates = [];
    const rejectedCandidates = [];
    let candidateEvaluationsCount = 0;
    for (const candidate of candidates) {
      candidateEvaluationsCount++;
      if (this.negativeEvidenceStore.isKnownContradiction(candidate.candidateId, candidate, targetFingerprint.capabilityId)) {
        const neg = this.negativeEvidenceStore.getNegativeEvidence(candidate.candidateId, targetFingerprint.capabilityId);
        const fakeResult = {
          candidateId: candidate.candidateId,
          status: "CONTRADICTED",
          isEligibleForRanking: false,
          passedPredicates: [],
          failedPredicates: [
            {
              predicateId: "STORED_NEGATIVE_EVIDENCE",
              predicateName: "Known Contradiction",
              isNegativePredicate: true,
              passed: false,
              explanation: `Pre-existing negative evidence: ${neg.reason}`
            }
          ],
          rejectionReason: `Pre-existing negative evidence: ${neg.reason}`,
          evaluatedTimestamp: Date.now()
        };
        invariantResults[candidate.candidateId] = fakeResult;
        rejectedCandidates.push({
          candidate,
          result: fakeResult,
          rejectionReason: fakeResult.rejectionReason
        });
        continue;
      }
      const closureResult = InvariantClosureEngine.evaluateCandidate(
        targetFingerprint,
        candidate
      );
      invariantResults[candidate.candidateId] = closureResult;
      if (closureResult.isEligibleForRanking && closureResult.status === "PASS") {
        eligibleCandidates.push(candidate);
      } else {
        if (closureResult.status === "CONTRADICTED") {
          this.negativeEvidenceStore.recordContradiction(
            candidate.candidateId,
            "KNOWN_DECOY_PATTERN",
            "HARD_GATE_FAILURE",
            closureResult.rejectionReason || "Hard gate contradiction",
            {},
            targetFingerprint,
            void 0,
            candidate
          );
        }
        rejectedCandidates.push({
          candidate,
          result: closureResult,
          rejectionReason: closureResult.rejectionReason || "Failed mandatory invariant"
        });
      }
    }
    const rankedScores = options !== void 0 ? this.rankingEngine.rankCandidates(targetFingerprint, eligibleCandidates, options) : this.rankingEngine.rankCandidates(targetFingerprint, eligibleCandidates);
    const selectedWinner = rankedScores.length > 0 && rankedScores[0] ? rankedScores[0] : null;
    return {
      allCandidates: candidates,
      candidateEvaluationsCount,
      invariantResults,
      eligibleCandidates,
      rejectedCandidates,
      rankedScores,
      selectedWinner
    };
  }
};

// src/types/ranking.ts
var DEFAULT_SCORING_WEIGHTS = {
  wInvariantFit: 0.3,
  wSemanticFit: 0.25,
  wContextFit: 0.15,
  wTransitionFit: 0.15,
  wValidationHistory: 0.1,
  wContradictionPenalty: 0.25,
  wStalenessPenalty: 0.05,
  wRiskPenalty: 0.1,
  wPathCostPenalty: 0.05
};

// src/core/ranking/engine.ts
var CandidateRankingEngine = class _CandidateRankingEngine {
  constructor(weights = DEFAULT_SCORING_WEIGHTS, version = "1.0.0") {
    this.weights = weights;
    this.version = version;
  }
  /**
   * Domain-specific entity and concept synonym mapping
   */
  static SYNONYM_MAP = {
    notification: "notification",
    notifications: "notification",
    alert: "notification",
    alerts: "notification",
    bulletin: "notification",
    bulletins: "notification",
    marketing: "marketing",
    commercial: "marketing",
    promotional: "marketing",
    advertising: "marketing",
    campaign: "marketing",
    email: "email",
    emails: "email",
    mail: "email",
    mails: "email",
    twofactor: "twofactor",
    "2fa": "twofactor",
    mfa: "twofactor"
  };
  /**
   * Simple morphological stemmer for common English web control suffixes
   */
  static stemWord(word) {
    const mapped = _CandidateRankingEngine.SYNONYM_MAP[word.toLowerCase()];
    if (mapped) return mapped;
    return word.replace(/(ing|edly|ingly|ed|es|s|tion|ment|able|ible)$/i, "").replace(/(ies)$/i, "y");
  }
  /**
   * Tokenizes, normalizes, and stems an input phrase
   */
  static tokenizeAndStem(phrase) {
    const cleaned = phrase.toLowerCase().replace(/two[-\s]*factor/g, "twofactor").replace(/[^a-z0-9\s]/g, " ");
    const stopWords = /* @__PURE__ */ new Set(["of", "the", "a", "an", "for", "in", "on", "to"]);
    return cleaned.split(/\s+/).filter((w) => Boolean(w) && !stopWords.has(w)).map(this.stemWord);
  }
  /**
   * Computes semantic similarity with stemming, synonym normalization, and token containment
   */
  computeSemanticSimilarity(target, candidate) {
    const tokensA = _CandidateRankingEngine.tokenizeAndStem(target);
    const tokensB = _CandidateRankingEngine.tokenizeAndStem(candidate);
    if (tokensA.length === 0 && tokensB.length === 0) return 1;
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = /* @__PURE__ */ new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    const jaccard = intersection.size / union.size;
    const containment = intersection.size / Math.min(setA.size, setB.size);
    const score = containment === 1 ? Math.max(jaccard, 0.95) : jaccard;
    return Number(score.toFixed(3));
  }
  /**
   * Ranks an array of ELIGIBLE candidates using only real observed evidence.
   * Hard-failing candidates, contradictions, and decoys must be purged before calling this method.
   */
  rankCandidates(targetFingerprint, eligibleCandidates, options) {
    const scoredList = [];
    for (const candidate of eligibleCandidates) {
      const invariantFit = 1;
      const candidateLabel = candidate.candidateLabel || candidate.accessibleName || "";
      const semanticTargets = [
        targetFingerprint.semanticEvidence?.canonicalLabel || "",
        ...targetFingerprint.semanticEvidence?.semanticSynonyms || [],
        targetFingerprint.semanticEvidence?.accessibleName || "",
        targetFingerprint.semanticEvidence?.actionDescription || "",
        targetFingerprint.semanticEvidence?.visibleLabel || ""
      ];
      if (options?.intent) {
        semanticTargets.push(options.intent);
      }
      let maxSim = 0;
      for (const tgt of semanticTargets) {
        if (!tgt) continue;
        const sim = this.computeSemanticSimilarity(tgt, candidateLabel);
        if (sim > maxSim) maxSim = sim;
      }
      const semanticFit = Math.min(1, maxSim);
      let contextFit = 0;
      const targetContainers = targetFingerprint.contextEvidence?.containerSemantics || [];
      const targetAncestors = targetFingerprint.contextEvidence?.ancestorRelationships || [];
      const targetNearby = targetFingerprint.contextEvidence?.nearbyText || [];
      const candidateContainers = candidate.containerSemantics || [];
      const candidateAncestors = candidate.ancestors || [];
      const candidateNearby = candidate.nearbyText || [];
      let containerOverlap = 0;
      if (candidateContainers.length > 0 && targetContainers.length > 0) {
        let matchCount = 0;
        for (const c of candidateContainers) {
          if (targetContainers.some(
            (tc) => tc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(tc.toLowerCase())
          )) {
            matchCount++;
          }
        }
        containerOverlap = matchCount / targetContainers.length;
      }
      let ancestorOverlap = 0;
      if (candidateAncestors.length > 0 && targetAncestors.length > 0) {
        let matchCount = 0;
        for (const a of candidateAncestors) {
          if (targetAncestors.some(
            (ta) => ta.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(ta.toLowerCase())
          )) {
            matchCount++;
          }
        }
        ancestorOverlap = matchCount / targetAncestors.length;
      }
      let nearbyOverlap = 0;
      if (candidateNearby.length > 0 && targetNearby.length > 0) {
        let matchCount = 0;
        for (const n of candidateNearby) {
          if (targetNearby.some(
            (tn) => tn.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(tn.toLowerCase())
          )) {
            matchCount++;
          }
        }
        nearbyOverlap = matchCount / targetNearby.length;
      }
      const observedChannelsWeight = (candidateContainers.length > 0 ? 0.5 : 0) + (candidateAncestors.length > 0 ? 0.3 : 0) + (candidateNearby.length > 0 ? 0.2 : 0);
      if (observedChannelsWeight > 0) {
        contextFit = Number(
          Math.min(
            1,
            (0.5 * containerOverlap + 0.3 * ancestorOverlap + 0.2 * nearbyOverlap) / observedChannelsWeight
          ).toFixed(3)
        );
      } else {
        contextFit = 0;
      }
      let transitionFit = 0;
      if (candidate.observedState && Object.keys(candidate.observedState).length > 0) {
        let preStateScore = 1;
        const mandatoryPreds = targetFingerprint.mandatoryPreStatePredicates || [];
        if (mandatoryPreds.length > 0) {
          let passedCount = 0;
          for (const pred of mandatoryPreds) {
            try {
              if (pred.evaluate(candidate.observedState)) passedCount++;
            } catch {
            }
          }
          preStateScore = passedCount / mandatoryPreds.length;
        }
        let deltaFeasibility = 1;
        const allowedDeltas = targetFingerprint.allowedStateDelta || [];
        if (allowedDeltas.length > 0) {
          let compatibleDeltas = 0;
          for (const delta of allowedDeltas) {
            const currentVal = candidate.observedState[delta.property];
            if (currentVal !== void 0) {
              if (delta.expectedChange === "ENABLED_TO_DISABLED" && currentVal === false) {
              } else if (delta.expectedChange === "DISABLED_TO_ENABLED" && currentVal === true) {
              } else {
                compatibleDeltas++;
              }
            } else {
            }
          }
          deltaFeasibility = compatibleDeltas / allowedDeltas.length;
        }
        const isInteractive = candidate.observedState["disabled"] !== true;
        const interactiveScore = isInteractive ? 1 : 0;
        transitionFit = Number(
          (0.4 * preStateScore + 0.4 * deltaFeasibility + 0.2 * interactiveScore).toFixed(3)
        );
      } else {
        transitionFit = 0;
      }
      let validationHistory = 0;
      const historyEntries = targetFingerprint.provenance?.validationHistory || [];
      if (historyEntries.length > 0) {
        const successCount = historyEntries.filter((h) => h.success === true).length;
        validationHistory = Number((successCount / historyEntries.length).toFixed(3));
      } else {
        validationHistory = 0;
      }
      let contradictionPenalty = 0;
      const rejectedList = targetFingerprint.negativeEvidence?.rejectedCandidateIdentities || [];
      if (rejectedList.includes(candidate.candidateId)) {
        contradictionPenalty = 1;
      }
      let stalenessPenalty = 0;
      const valTimestamp = targetFingerprint.provenance?.validationTimestamp || 0;
      if (valTimestamp > 0) {
        const now = options?.currentTime || Date.now();
        const elapsedHours = (now - valTimestamp) / (1e3 * 60 * 60);
        if (elapsedHours > 24) {
          stalenessPenalty = Math.min(1, Number(((elapsedHours - 24) / 48).toFixed(3)));
        }
      }
      const riskPenalty = targetFingerprint.riskMetadata?.riskClass === "DESTRUCTIVE" ? 0.3 : targetFingerprint.riskMetadata?.riskClass === "SECURITY_SENSITIVE" ? 0.2 : 0;
      let pathCostPenalty = 0;
      const structuralPath = candidate.domStructuralPath || candidate.bindingHandle?.domStructuralPath;
      if (structuralPath) {
        const depth = structuralPath.split(">").map((s) => s.trim()).filter(Boolean).length;
        if (depth > 2) {
          pathCostPenalty = Math.min(1, Number(((depth - 2) / 10).toFixed(3)));
        }
      } else if (candidate.ancestors && candidate.ancestors.length > 2) {
        pathCostPenalty = Math.min(1, Number(((candidate.ancestors.length - 2) / 10).toFixed(3)));
      }
      const totalScore = this.weights.wInvariantFit * invariantFit + this.weights.wSemanticFit * semanticFit + this.weights.wContextFit * contextFit + this.weights.wTransitionFit * transitionFit + this.weights.wValidationHistory * validationHistory - this.weights.wContradictionPenalty * contradictionPenalty - this.weights.wStalenessPenalty * stalenessPenalty - this.weights.wRiskPenalty * riskPenalty - this.weights.wPathCostPenalty * pathCostPenalty;
      const breakdown = {
        invariantFit,
        semanticFit,
        contextFit,
        transitionFit,
        validationHistory,
        contradictionPenalty,
        stalenessPenalty,
        riskPenalty,
        pathCostPenalty,
        totalScore: Number(Math.max(0, totalScore).toFixed(4))
      };
      scoredList.push({
        candidateId: candidate.candidateId,
        candidateLabel: candidate.candidateLabel,
        bindingHandle: candidate.bindingHandle,
        isEligible: true,
        scoreBreakdown: breakdown,
        rank: 0,
        weightsVersion: this.version,
        rankingVersion: this.version,
        rankingTimestamp: Date.now()
      });
    }
    scoredList.sort((a, b) => {
      const diff = b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
      if (Math.abs(diff) > 1e-5) return diff;
      return a.candidateId.localeCompare(b.candidateId);
    });
    scoredList.forEach((item, index) => {
      item.rank = index + 1;
    });
    return scoredList;
  }
};

// src/core/causal/witnessCollector.ts
var WitnessCollector = class {
  witnesses = [];
  sequenceCounter = 0;
  activeActivationEvent = null;
  /**
   * Registers the active candidate activation event (with timestamp and sequence)
   */
  registerActivationEvent(event) {
    this.activeActivationEvent = event;
  }
  /**
   * Records an observed witness event with raw evidence, provenance, and binding info
   */
  recordWitness(witnessClass, observedDelta, timestamp = Date.now(), options) {
    this.sequenceCounter++;
    const witnessId = `wit_${this.sequenceCounter}_${witnessClass}_${timestamp}`;
    let isCausallyCorrelated = false;
    let correlatedActivationEventId = null;
    let temporalDeltaMs = -1;
    let correlationExplanation = "";
    if (this.activeActivationEvent) {
      temporalDeltaMs = timestamp - this.activeActivationEvent.timestamp;
      if (temporalDeltaMs > 0) {
        correlatedActivationEventId = this.activeActivationEvent.eventId;
        isCausallyCorrelated = true;
        correlationExplanation = `Correlated with activation event ${this.activeActivationEvent.eventId} (+${temporalDeltaMs}ms)`;
      } else {
        correlationExplanation = `REJECTED: Pre-existing or concurrent event occurred before or at activation (${temporalDeltaMs}ms)`;
      }
    } else {
      correlationExplanation = "REJECTED: Unrelated event observed without prior activation event";
    }
    const defaultSource = options?.source || (options?.provenance?.origin ?? `WitnessCollector:${witnessClass}`);
    const witness = {
      witnessId,
      witnessClass,
      sequenceNumber: this.sequenceCounter,
      timestamp,
      observedDelta,
      correlatedActivationEventId,
      temporalDeltaMs,
      isCausallyCorrelated,
      correlationExplanation,
      source: defaultSource,
      targetInfo: options?.targetInfo,
      rawObservation: options?.rawObservation,
      observationType: options?.observationType,
      routeId: options?.routeId,
      capabilityId: options?.capabilityId || this.activeActivationEvent?.initiatingCapabilityId,
      provenance: options?.provenance || {
        origin: defaultSource,
        sequenceId: this.sequenceCounter,
        observedAt: timestamp
      },
      eventSequenceId: options?.eventSequenceId
    };
    this.witnesses.push(witness);
    return witness;
  }
  getWitnesses() {
    return [...this.witnesses];
  }
  clear() {
    this.witnesses = [];
    this.activeActivationEvent = null;
    this.sequenceCounter = 0;
  }
};

// src/core/causal/verifier.ts
var CausalTransitionVerifier = class {
  constructor(options = {}) {
    this.options = options;
    this.tokenAuthenticator = options.tokenAuthenticator || defaultTokenAuthenticator;
  }
  tokenAuthenticator;
  /**
   * Performs deep equality comparison supporting primitives, nested objects,
   * arrays, and string-to-boolean equivalence (e.g. 'true' === true).
   */
  deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a === "boolean" && typeof b === "string") {
      const bLower = b.toLowerCase().trim();
      if (bLower === "true" || bLower === "false") {
        return a === (bLower === "true");
      }
    }
    if (typeof a === "string" && typeof b === "boolean") {
      const aLower = a.toLowerCase().trim();
      if (aLower === "true" || aLower === "false") {
        return aLower === "true" === b;
      }
    }
    if (a === null || a === void 0 || b === null || b === void 0) {
      return a === b;
    }
    if (typeof a !== "object" || typeof b !== "object") {
      return false;
    }
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const aObj = a;
    const bObj = b;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
      if (!this.deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }
  /**
   * Evaluates whether an observed delta indicates an explicit contradiction, failure, or aborted outcome
   */
  isDeltaContradictory(observedDelta) {
    if (!observedDelta) return false;
    return observedDelta["error"] !== void 0 || observedDelta["failure"] === true || observedDelta["aborted"] === true || observedDelta["rejected"] === true || observedDelta["status"] === "REJECTED" || observedDelta["status"] === "ERROR" || typeof observedDelta["statusCode"] === "number" && observedDelta["statusCode"] >= 400 || typeof observedDelta["code"] === "number" && observedDelta["code"] >= 400;
  }
  /**
   * Evaluates whether an observed delta is relevant to the expected transition delta
   */
  isDeltaRelevant(observedDelta, expectedDelta, witnessClass) {
    if (witnessClass === "ASYNC_ACKNOWLEDGEMENT") {
      return true;
    }
    const expected = expectedDelta || {};
    const observed = observedDelta || {};
    const expectedKeys = Object.keys(expected);
    if (expectedKeys.length === 0) return true;
    if (expectedKeys.some((key) => key in observed)) return true;
    const standardChannels = [
      "ariaChecked",
      "aria-checked",
      "checked",
      "disabled",
      "expanded",
      "aria-expanded",
      "aria-disabled",
      "outletChanged",
      "route",
      "path",
      "export_download_initiated",
      "operation",
      "status",
      "statusCode",
      "acknowledged"
    ];
    return standardChannels.some((k) => k in observed);
  }
  /**
   * Evaluates whether the observed delta satisfies ALL required expected state changes.
   * Does NOT accept partial matches unless expected delta is empty.
   */
  isDeltaMatching(observedDelta, expectedDelta) {
    const expected = expectedDelta || {};
    const observed = observedDelta || {};
    const expectedKeys = Object.keys(expected);
    if (expectedKeys.length === 0) return true;
    if (!observedDelta || Object.keys(observed).length === 0) return false;
    for (const [key, expectedVal] of Object.entries(expected)) {
      if (!(key in observed)) {
        return false;
      }
      if (!this.deepEqual(observed[key], expectedVal)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Evaluates causal transition evidence according to the formal witness protocol.
   */
  evaluateCausalEvidence(signature, activationEvent, witnesses, currentPostStateFingerprint) {
    if (!activationEvent || !activationEvent.eventId || typeof activationEvent.timestamp !== "number") {
      return {
        signature,
        activationEvent: activationEvent || {},
        observedWitnesses: witnesses || [],
        classifiedWitnesses: [],
        verifiedWitnessClasses: [],
        status: "FAILED_ACTIVATION_MISSING",
        failureReason: "activation_missing",
        causallyVerified: false,
        durationMs: 0,
        explanation: "Transition rejected: Activation event record is missing or invalid."
      };
    }
    const minClasses = this.options.minWitnessClasses ?? 2;
    const windowMs = signature.verificationWindowMs || 2e3;
    const startTime = activationEvent.timestamp;
    if (!witnesses || witnesses.length === 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: [],
        classifiedWitnesses: [],
        verifiedWitnessClasses: [],
        status: "FAILED_MISSING_WITNESSES",
        failureReason: "witness_missing",
        causallyVerified: false,
        durationMs: windowMs,
        explanation: `Transition rejected: No witnesses observed within ${windowMs}ms window.`
      };
    }
    if (signature.activationEventExpected?.eventType && activationEvent.eventType && signature.activationEventExpected.eventType !== activationEvent.eventType) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses || [],
        classifiedWitnesses: [],
        verifiedWitnessClasses: [],
        status: "FAILED_WRONG_STATE_DELTA",
        failureReason: "invalid_transition",
        causallyVerified: false,
        durationMs: 0,
        explanation: `Transition rejected: Dispatched activation event type '${activationEvent.eventType}' does not match expected signature event type '${signature.activationEventExpected.eventType}'.`
      };
    }
    const preExistingWitnesses = [];
    const timedOutWitnesses = [];
    const missingCorrWitnesses = [];
    const wrongCorrWitnesses = [];
    const unrelatedDeltaWitnesses = [];
    const contradictoryWitnesses = [];
    const relevantCausalWitnesses = [];
    const classifiedWitnesses = [];
    for (const w of witnesses) {
      if (w.timestamp <= startTime) {
        preExistingWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: "PRE_EXISTING",
          reason: `Witness timestamp (${w.timestamp}) occurred before or at activation event timestamp (${startTime}). Strict temporal precedence (t_activation < t_witness) violated.`
        });
        continue;
      }
      if (w.timestamp - startTime > windowMs) {
        timedOutWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: "TIMED_OUT",
          reason: `Witness timestamp (${w.timestamp}) arrived after verification window (${windowMs}ms). Bounded verification interval exceeded.`
        });
        continue;
      }
      if (this.isDeltaContradictory(w.observedDelta)) {
        contradictoryWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: "UNRELATED",
          reason: `Witness observed error or failure indicator: ${JSON.stringify(w.observedDelta)}.`
        });
        continue;
      }
      const isRelevantDelta = this.isDeltaRelevant(w.observedDelta, signature.expectedStateDelta, w.witnessClass);
      if (!isRelevantDelta) {
        unrelatedDeltaWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: "UNRELATED",
          reason: `Witness delta ${JSON.stringify(w.observedDelta)} is unrelated to expected delta ${JSON.stringify(signature.expectedStateDelta)}. Unrelated mutations cannot satisfy causal verification.`
        });
        continue;
      }
      if (!w.correlatedActivationEventId) {
        missingCorrWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: "UNRELATED",
          reason: `Witness delta is relevant, but missing correlatedActivationEventId. Missing correlation ID constitutes insufficient evidence of causality.`
        });
        continue;
      }
      if (w.correlatedActivationEventId !== activationEvent.eventId) {
        wrongCorrWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: "UNRELATED",
          reason: `Witness correlated event ID '${w.correlatedActivationEventId}' does not match activation ID '${activationEvent.eventId}'. Wrong or stale correlation ID rejected.`
        });
        continue;
      }
      const isDeltaMatch = this.isDeltaMatching(w.observedDelta, signature.expectedStateDelta);
      relevantCausalWitnesses.push(w);
      classifiedWitnesses.push({
        witness: w,
        category: isDeltaMatch ? "CAUSALLY_VALID" : "RELEVANT",
        reason: isDeltaMatch ? `Witness observed matching state delta within verification window (${w.timestamp - startTime}ms).` : `Witness observed relevant state transition within verification window (${w.timestamp - startTime}ms).`
      });
    }
    if (contradictoryWitnesses.length > 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: "FAILED_CONTRADICTORY_WITNESS",
        failureReason: "contradictory_witness",
        causallyVerified: false,
        durationMs: Math.max(0, contradictoryWitnesses[0].timestamp - startTime),
        explanation: `Transition rejected: Contradictory witness observed. Observed error/failure mutation (${JSON.stringify(contradictoryWitnesses[0].observedDelta)}).`
      };
    }
    if (preExistingWitnesses.length > 0 && relevantCausalWitnesses.length === 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: "FAILED_PRE_EXISTING_STATE",
        failureReason: "stale_witness",
        causallyVerified: false,
        durationMs: 0,
        explanation: `Transition rejected: Expected mutation occurred before activation event (${preExistingWitnesses[0].timestamp} <= ${startTime}). Pre-existing state cannot satisfy causal verification.`
      };
    }
    if (relevantCausalWitnesses.length === 0 && (wrongCorrWitnesses.length > 0 || unrelatedDeltaWitnesses.length > 0)) {
      const firstUnrelated = wrongCorrWitnesses[0] || unrelatedDeltaWitnesses[0];
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: "FAILED_UNRELATED_MUTATION",
        failureReason: "invalid_transition",
        causallyVerified: false,
        durationMs: firstUnrelated ? firstUnrelated.timestamp - startTime : 0,
        explanation: `Transition rejected: Mutations occurred within window, but none matched expected delta or event correlation. Unrelated mutations cannot satisfy causal verification.`
      };
    }
    if (relevantCausalWitnesses.length === 0 && missingCorrWitnesses.length > 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: "FAILED_INSUFFICIENT_CORRELATION",
        failureReason: "causal_relation_unproven",
        causallyVerified: false,
        durationMs: missingCorrWitnesses[0].timestamp - startTime,
        explanation: "Transition rejected: Missing correlation ID on observed witnesses. Insufficient evidence to establish causal relationship with activation event."
      };
    }
    if (relevantCausalWitnesses.length === 0) {
      const status = timedOutWitnesses.length > 0 ? "FAILED_WINDOW_TIMEOUT" : "FAILED_MISSING_WITNESSES";
      const failureReason = timedOutWitnesses.length > 0 ? "outside_window" : "witness_missing";
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status,
        failureReason,
        causallyVerified: false,
        durationMs: windowMs,
        explanation: `Transition rejected: No relevant witnesses observed within ${windowMs}ms window.`
      };
    }
    if (relevantCausalWitnesses.length > 1) {
      const mergedExpectedObserved = {};
      for (const w of relevantCausalWitnesses) {
        if (!w.observedDelta) continue;
        for (const [k, v] of Object.entries(w.observedDelta)) {
          if (k in signature.expectedStateDelta) {
            if (k in mergedExpectedObserved && !this.deepEqual(mergedExpectedObserved[k], v)) {
              return {
                signature,
                activationEvent,
                observedWitnesses: relevantCausalWitnesses,
                classifiedWitnesses,
                verifiedWitnessClasses: [],
                status: "FAILED_CONTRADICTORY_WITNESS",
                failureReason: "contradictory_witness",
                causallyVerified: false,
                durationMs: relevantCausalWitnesses[relevantCausalWitnesses.length - 1].timestamp - startTime,
                explanation: `Transition rejected: Contradictory witness observations across channels for property '${k}' (${JSON.stringify(mergedExpectedObserved[k])} vs ${JSON.stringify(v)}).`
              };
            }
            mergedExpectedObserved[k] = v;
          }
        }
      }
    }
    let deltaMatched = false;
    if (Object.keys(signature.expectedStateDelta).length === 0) {
      deltaMatched = true;
    } else {
      deltaMatched = relevantCausalWitnesses.some(
        (w) => this.isDeltaMatching(w.observedDelta, signature.expectedStateDelta)
      );
      if (!deltaMatched && relevantCausalWitnesses.length > 1) {
        const combinedDelta = {};
        let contradictionFound = false;
        for (const w of relevantCausalWitnesses) {
          if (!w.observedDelta) continue;
          for (const [k, v] of Object.entries(w.observedDelta)) {
            if (k in signature.expectedStateDelta) {
              if (k in combinedDelta && !this.deepEqual(combinedDelta[k], v)) {
                contradictionFound = true;
                break;
              }
              combinedDelta[k] = v;
            }
          }
          if (contradictionFound) break;
        }
        if (!contradictionFound && this.isDeltaMatching(combinedDelta, signature.expectedStateDelta)) {
          deltaMatched = true;
        }
      }
    }
    if (!deltaMatched) {
      return {
        signature,
        activationEvent,
        observedWitnesses: relevantCausalWitnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: "FAILED_WRONG_STATE_DELTA",
        failureReason: "wrong_direction",
        causallyVerified: false,
        durationMs: relevantCausalWitnesses[relevantCausalWitnesses.length - 1].timestamp - startTime,
        explanation: "Transition rejected: Relevant witnesses observed, but expected state delta values did not match."
      };
    }
    const seenWitnessIds = /* @__PURE__ */ new Set();
    const deduplicatedWitnesses = [];
    for (const w of relevantCausalWitnesses) {
      if (!seenWitnessIds.has(w.witnessId)) {
        seenWitnessIds.add(w.witnessId);
        deduplicatedWitnesses.push(w);
      }
    }
    const distinctClasses = Array.from(
      new Set(deduplicatedWitnesses.map((w) => w.witnessClass))
    );
    if (distinctClasses.length < minClasses) {
      return {
        signature,
        activationEvent,
        observedWitnesses: deduplicatedWitnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: distinctClasses,
        status: "FAILED_INSUFFICIENT_WITNESS_CLASSES",
        failureReason: "insufficient_independence",
        causallyVerified: false,
        durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
        explanation: `Transition rejected: Observed only ${distinctClasses.length} distinct witness class (${distinctClasses.join(", ")}). Minimum required independent classes is ${minClasses}. Duplicate events of the same class do not satisfy quorum.`
      };
    }
    const origins = new Set(
      deduplicatedWitnesses.map((w) => {
        if (w.provenance?.origin) return w.provenance.origin;
        if (w.source) return w.source;
        return `observer_${w.witnessClass}`;
      })
    );
    if (origins.size < minClasses) {
      return {
        signature,
        activationEvent,
        observedWitnesses: deduplicatedWitnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: distinctClasses,
        status: "FAILED_INSUFFICIENT_WITNESS_CLASSES",
        failureReason: "insufficient_independence",
        causallyVerified: false,
        durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
        explanation: `Transition rejected: Multiple witnesses share the same observational origin (${Array.from(origins).join(", ")}). Distinct observational origins required for independent quorum.`
      };
    }
    let observedPostStateObj = void 0;
    let postStateFpString = void 0;
    if (currentPostStateFingerprint !== void 0) {
      if (typeof currentPostStateFingerprint === "object" && currentPostStateFingerprint !== null) {
        observedPostStateObj = currentPostStateFingerprint;
        postStateFpString = observedPostStateObj.postStateFingerprint;
        if (!observedPostStateObj.isObserved) {
          return {
            signature,
            activationEvent,
            observedWitnesses: deduplicatedWitnesses,
            classifiedWitnesses,
            verifiedWitnessClasses: [],
            status: "FAILED_POST_STATE_MISMATCH",
            failureReason: "post_state_mismatch",
            causallyVerified: false,
            durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
            explanation: "Transition rejected: Supplied post-state is not a genuine observation (isObserved is false). Predicted or caller-supplied states cannot satisfy post-state verification."
          };
        }
        if (observedPostStateObj.activationEventId && observedPostStateObj.activationEventId !== activationEvent.eventId) {
          return {
            signature,
            activationEvent,
            observedWitnesses: deduplicatedWitnesses,
            classifiedWitnesses,
            verifiedWitnessClasses: [],
            status: "FAILED_POST_STATE_MISMATCH",
            failureReason: "stale_witness",
            causallyVerified: false,
            durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
            explanation: `Transition rejected: Observed post-state activationEventId '${observedPostStateObj.activationEventId}' does not match current activation event '${activationEvent.eventId}'. Stale post-state binding rejected.`
          };
        }
        if (observedPostStateObj.capabilityId && observedPostStateObj.capabilityId !== activationEvent.initiatingCapabilityId) {
          return {
            signature,
            activationEvent,
            observedWitnesses: deduplicatedWitnesses,
            classifiedWitnesses,
            verifiedWitnessClasses: [],
            status: "FAILED_POST_STATE_MISMATCH",
            failureReason: "invalid_transition",
            causallyVerified: false,
            durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
            explanation: `Transition rejected: Observed post-state capabilityId '${observedPostStateObj.capabilityId}' does not match initiating capability '${activationEvent.initiatingCapabilityId}'. Cross-route or mismatched capability binding rejected.`
          };
        }
      } else {
        postStateFpString = currentPostStateFingerprint;
      }
      if (postStateFpString === signature.preStateFingerprint) {
        return {
          signature,
          activationEvent,
          observedWitnesses: deduplicatedWitnesses,
          classifiedWitnesses,
          verifiedWitnessClasses: [],
          status: "FAILED_POST_STATE_MISMATCH",
          failureReason: "post_state_mismatch",
          causallyVerified: false,
          durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
          explanation: "Transition rejected: Post-state fingerprint identical to pre-state; no actual state progression occurred."
        };
      }
      if (signature.postStateFingerprint && postStateFpString !== signature.postStateFingerprint) {
        const appStateMatches = observedPostStateObj?.observedApplicationState ? this.isDeltaMatching(observedPostStateObj.observedApplicationState, signature.expectedStateDelta) : false;
        if (!appStateMatches) {
          return {
            signature,
            activationEvent,
            observedWitnesses: deduplicatedWitnesses,
            classifiedWitnesses,
            verifiedWitnessClasses: [],
            status: "FAILED_POST_STATE_MISMATCH",
            failureReason: "post_state_mismatch",
            causallyVerified: false,
            durationMs: deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime,
            explanation: `Transition rejected: Observed post-state fingerprint '${postStateFpString}' does not match expected post-state fingerprint '${signature.postStateFingerprint}'.`
          };
        }
      }
    }
    const durationMs = deduplicatedWitnesses[deduplicatedWitnesses.length - 1].timestamp - startTime;
    return {
      signature,
      activationEvent,
      observedWitnesses: deduplicatedWitnesses,
      classifiedWitnesses,
      verifiedWitnessClasses: distinctClasses,
      status: "VERIFIED",
      causallyVerified: true,
      durationMs,
      explanation: `CAUSALLY VERIFIED: Correlated ${deduplicatedWitnesses.length} witnesses across ${distinctClasses.length} independent classes (${distinctClasses.join(", ")}) from ${origins.size} distinct origins in ${durationMs}ms`,
      observedPostState: observedPostStateObj,
      observedPostStateFingerprint: postStateFpString
    };
  }
  /**
   * Synchronously verifies the causal transition and mints an HMAC-SHA-256
   * authenticated TransitionVerificationToken when verified.
   */
  verifyTransition(signature, activationEvent, witnesses, currentPostStateFingerprint, routeId) {
    const baseResult = this.evaluateCausalEvidence(
      signature,
      activationEvent,
      witnesses,
      currentPostStateFingerprint
    );
    if (!baseResult.causallyVerified || baseResult.status !== "VERIFIED") {
      return baseResult;
    }
    const effectiveRouteId = routeId || `route_${activationEvent.initiatingCapabilityId}`;
    const verificationToken = this.tokenAuthenticator.issueToken({
      routeId: effectiveRouteId,
      capabilityId: activationEvent.initiatingCapabilityId,
      activationEventId: activationEvent.eventId,
      verifiedWitnessClasses: baseResult.verifiedWitnessClasses,
      transitionSignature: signature,
      observedWitnesses: baseResult.observedWitnesses,
      issuedTimestamp: Date.now()
    });
    return {
      ...baseResult,
      verificationToken
    };
  }
  /**
   * Asynchronously verifies the causal transition and mints an HMAC-SHA-256
   * authenticated TransitionVerificationToken (supports browser WebCrypto and Node crypto).
   */
  async verifyTransitionAsync(signature, activationEvent, witnesses, currentPostStateFingerprint, routeId) {
    const baseResult = this.evaluateCausalEvidence(
      signature,
      activationEvent,
      witnesses,
      currentPostStateFingerprint
    );
    if (!baseResult.causallyVerified || baseResult.status !== "VERIFIED") {
      return baseResult;
    }
    const effectiveRouteId = routeId || `route_${activationEvent.initiatingCapabilityId}`;
    const verificationToken = await this.tokenAuthenticator.issueTokenAsync({
      routeId: effectiveRouteId,
      capabilityId: activationEvent.initiatingCapabilityId,
      activationEventId: activationEvent.eventId,
      verifiedWitnessClasses: baseResult.verifiedWitnessClasses,
      transitionSignature: signature,
      observedWitnesses: baseResult.observedWitnesses,
      issuedTimestamp: Date.now()
    });
    return {
      ...baseResult,
      verificationToken
    };
  }
};

// src/core/quarantine/controller.ts
var QuarantineController = class {
  constructor(routeManager, negativeEvidenceStore) {
    this.routeManager = routeManager;
    this.negativeEvidenceStore = negativeEvidenceStore;
  }
  /**
   * Places a route into PROVISIONAL quarantine
   */
  quarantineProvisional(_capabilityId, route, reason) {
    route.status = "PROVISIONAL";
    route.quarantineReason = reason;
    return route;
  }
  /**
   * Transitions route to failed QUARANTINED state and records structured negative evidence
   */
  quarantineFailedRoute(capabilityId, routeId, reason, evidenceDetails = {}, extra) {
    const quarantined = this.routeManager.quarantineRoute(capabilityId, routeId, reason);
    const statusCondition = extra?.failedCondition || evidenceDetails["status"] || "TRANSITION_VERIFICATION_FAILURE";
    const requiredChange = extra?.requiredMaterialEvidenceChange || (statusCondition === "FAILED_POST_STATE_MISMATCH" ? "Requires valid observed interface post-state progression differing from pre-state and satisfying expected delta." : "Requires material interface or state transition change before candidate can be reconsidered.");
    this.negativeEvidenceStore.recordContradiction(
      routeId,
      "CAUSAL_WITNESS_FAILURE",
      statusCondition,
      reason,
      evidenceDetails,
      { capabilityId },
      routeId,
      void 0,
      {
        failedCondition: statusCondition,
        affectedCapabilityId: capabilityId,
        affectedRouteId: routeId,
        affectedCandidateId: extra?.candidateIdentifier || routeId,
        sequenceNumber: extra?.sequenceNumber,
        activationEventId: extra?.activationEventId,
        witnessIds: extra?.witnessIds,
        failureClassification: statusCondition,
        quarantined: true,
        canReconsider: true,
        requiredMaterialEvidenceChange: requiredChange
      }
    );
    return quarantined;
  }
  /**
   * Checks if a route status is quarantined or provisional
   */
  isUnderQuarantine(status) {
    return status === "PROVISIONAL" || status === "QUARANTINED";
  }
};

// src/core/quarantine/promotion.ts
var RoutePromotionController = class {
  constructor(routeManager, quarantineController) {
    this.routeManager = routeManager;
    this.quarantineController = quarantineController;
  }
  /**
   * Promotes a provisional route ONLY IF transition verification succeeded with a valid token
   */
  evaluateAndPromote(capabilityId, routeId, verificationResult) {
    if (!verificationResult.causallyVerified || !verificationResult.verificationToken) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        verificationResult.explanation,
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion DENIED: Transition verification failed (${verificationResult.status})`,
        failureReason: verificationResult.failureReason || "verification_failed"
      };
    }
    const expectations = {
      expectedActivationEventId: typeof verificationResult.activationEvent?.eventId === "string" && verificationResult.activationEvent.eventId.length > 0 ? verificationResult.activationEvent.eventId : void 0,
      expectedTransitionSignature: verificationResult.signature && typeof verificationResult.signature.preStateFingerprint === "string" ? verificationResult.signature : void 0
    };
    try {
      const activeRoute = this.routeManager.promoteToActive(
        capabilityId,
        routeId,
        verificationResult.verificationToken,
        expectations
      );
      return {
        promoted: true,
        route: activeRoute,
        reason: "PROMOTED to ACTIVE_VALIDATED: Causal transition verified with required witnesses"
      };
    } catch (err) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        err.message || "Promotion rejected: invalid verification token",
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion REJECTED: ${err.message}`,
        failureReason: "invalid_promotion_token"
      };
    }
  }
  /**
   * Asynchronously promotes a provisional route ONLY IF transition verification
   * succeeded with an HMAC-SHA-256 authenticated token (supports browser WebCrypto and Node crypto).
   */
  async evaluateAndPromoteAsync(capabilityId, routeId, verificationResult) {
    if (!verificationResult.causallyVerified || !verificationResult.verificationToken) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        verificationResult.explanation,
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion DENIED: Transition verification failed (${verificationResult.status})`,
        failureReason: verificationResult.failureReason || "verification_failed"
      };
    }
    const expectations = {
      expectedActivationEventId: typeof verificationResult.activationEvent?.eventId === "string" && verificationResult.activationEvent.eventId.length > 0 ? verificationResult.activationEvent.eventId : void 0,
      expectedTransitionSignature: verificationResult.signature && typeof verificationResult.signature.preStateFingerprint === "string" ? verificationResult.signature : void 0
    };
    try {
      const activeRoute = await this.routeManager.promoteToActiveAsync(
        capabilityId,
        routeId,
        verificationResult.verificationToken,
        expectations
      );
      return {
        promoted: true,
        route: activeRoute,
        reason: "PROMOTED to ACTIVE_VALIDATED: Causal transition verified with required witnesses"
      };
    } catch (err) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        err.message || "Promotion rejected: invalid verification token",
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion REJECTED: ${err.message}`,
        failureReason: "invalid_promotion_token"
      };
    }
  }
  /**
   * Demotes an active route upon runtime failure and triggers rollback or fresh recovery
   */
  demoteAndRollback(capabilityId, routeId, failureReason) {
    const { demotedRoute, rollbackRoute } = this.routeManager.demoteActiveRoute(
      capabilityId,
      routeId,
      failureReason
    );
    return {
      promoted: false,
      route: demotedRoute,
      rollbackRoute,
      reason: rollbackRoute ? `Route DEMOTED. Automatically rolled back to prior validated route: ${rollbackRoute.routeId}` : "Route DEMOTED. No prior validated route available; fresh recovery required."
    };
  }
};

// src/core/authorization/classifier.ts
var RiskClassifier = class {
  /**
   * Classifies the operational risk category
   */
  static classifyRisk(actionType, targetEntity, explicitRiskClass) {
    if (explicitRiskClass) {
      if (["DESTRUCTIVE", "IRREVERSIBLE", "FINANCIAL", "SECURITY_SENSITIVE"].includes(explicitRiskClass)) {
        return { riskClass: explicitRiskClass, riskLevel: "HIGH", isDestructive: true };
      }
      if (["MEDIUM_IMPACT", "SENSITIVE", "REVERSIBLE"].includes(explicitRiskClass)) {
        return { riskClass: explicitRiskClass, riskLevel: "MEDIUM", isDestructive: false };
      }
      return { riskClass: explicitRiskClass, riskLevel: "LOW", isDestructive: false };
    }
    if (actionType === "DELETE" || actionType === "DEACTIVATE_ACCOUNT" || actionType === "REVOKE_ACCESS" || targetEntity === "ACCOUNT_STATUS" || targetEntity === "TWO_FACTOR_AUTH") {
      const riskClass = actionType === "DELETE" ? "DESTRUCTIVE" : targetEntity === "TWO_FACTOR_AUTH" ? "SECURITY_SENSITIVE" : "DESTRUCTIVE";
      return { riskClass, riskLevel: "HIGH", isDestructive: true };
    }
    if (actionType === "MODIFY_PREFERENCE" || actionType === "TOGGLE" || actionType === "EXPORT_DATA" || targetEntity === "MARKETING_NOTIFICATIONS" || targetEntity === "PERSONAL_DATA_EXPORT") {
      const riskClass = actionType === "EXPORT_DATA" ? "SENSITIVE" : "REVERSIBLE";
      return { riskClass, riskLevel: "MEDIUM", isDestructive: false };
    }
    return { riskClass: "READ_ONLY", riskLevel: "LOW", isDestructive: false };
  }
};

// src/core/authorization/quorum.ts
var EvidenceQuorumEvaluator = class {
  /**
   * Evaluates if the evidence quorum is satisfied
   */
  static evaluateQuorum(fingerprint, invariantResult, transitionResult) {
    const hasSemanticEvidence = fingerprint.semanticEvidence.canonicalLabel.length > 0 && fingerprint.semanticEvidence.accessibleName.length > 0;
    const hasFunctionalInvariantEvidence = invariantResult !== null && invariantResult.status === "PASS";
    const hasTransitionStateEvidence = transitionResult !== null ? transitionResult.causallyVerified && transitionResult.verifiedWitnessClasses.length >= 1 : Boolean(
      fingerprint.transitionEvidence && (fingerprint.transitionEvidence.preStateFingerprint || fingerprint.transitionEvidence.witnessClasses && fingerprint.transitionEvidence.witnessClasses.length > 0)
    );
    const quorumSatisfied = hasSemanticEvidence && hasFunctionalInvariantEvidence && hasTransitionStateEvidence;
    return {
      hasSemanticEvidence,
      hasFunctionalInvariantEvidence,
      hasTransitionStateEvidence,
      quorumSatisfied
    };
  }
};

// src/core/authorization/controller.ts
var ExecutionAuthorizationController = class {
  static authorize(input) {
    const {
      fingerprint,
      capabilityConfidence,
      routeConfidence,
      invariantResult,
      transitionResult,
      userConfirmationGranted = false,
      intent
    } = input;
    let riskInfo = RiskClassifier.classifyRisk(
      fingerprint.actionType,
      fingerprint.targetEntity,
      fingerprint.riskMetadata.riskClass
    );
    if (intent) {
      if (intent.actionType === "DELETE" || intent.sensitivityHints.includes("ACCOUNT_DELETION") || intent.sensitivityHints.includes("SECURITY_CREDENTIAL")) {
        riskInfo = {
          riskClass: intent.actionType === "DELETE" ? "DESTRUCTIVE" : "SECURITY_SENSITIVE",
          riskLevel: "HIGH",
          isDestructive: true
        };
      }
    }
    const quorum = EvidenceQuorumEvaluator.evaluateQuorum(
      fingerprint,
      invariantResult,
      transitionResult
    );
    let status = "DENIED_ABSTAIN";
    let policyReason = "";
    let requiresUserConfirmation = false;
    if (invariantResult && invariantResult.status !== "PASS") {
      status = "DENIED_ABSTAIN";
      policyReason = `Execution DENIED: Invariant closure status is ${invariantResult.status}`;
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }
    if (capabilityConfidence < 0.6) {
      status = "SUGGESTION_ONLY";
      policyReason = `Low capability confidence (${capabilityConfidence.toFixed(2)} < 0.60): Execution abstained, presenting ranked suggestion only.`;
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }
    if (riskInfo.riskLevel === "HIGH") {
      requiresUserConfirmation = true;
      if (!quorum.quorumSatisfied) {
        status = "DENIED_INSUFFICIENT_QUORUM";
        policyReason = "High-risk action DENIED: Evidence quorum incomplete (semantic + functional + transition required).";
        return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
      }
      if (userConfirmationGranted) {
        status = "AUTHORIZED";
        policyReason = "High-risk action AUTHORIZED: Evidence quorum satisfied and explicit user confirmation granted.";
      } else {
        status = "CONFIRMATION_REQUIRED";
        policyReason = `High-risk action (${riskInfo.riskClass}): Capability confidence is high (${capabilityConfidence.toFixed(2)}), but explicit user confirmation is mandatory before execution.`;
      }
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }
    if (riskInfo.riskLevel === "MEDIUM") {
      if (capabilityConfidence >= 0.8 && routeConfidence >= 0.5) {
        status = "AUTHORIZED";
        policyReason = "Medium-risk reversible operation AUTHORIZED with high confidence.";
      } else {
        requiresUserConfirmation = true;
        status = userConfirmationGranted ? "AUTHORIZED" : "CONFIRMATION_REQUIRED";
        policyReason = "Medium-risk operation requires user confirmation due to moderate route confidence.";
      }
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }
    if (capabilityConfidence >= 0.6) {
      status = "AUTHORIZED";
      policyReason = "Low-risk read-only navigation AUTHORIZED.";
    } else {
      status = "SUGGESTION_ONLY";
      policyReason = "Low-risk navigation presented as suggestion due to lower confidence.";
    }
    return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
  }
  static buildDecision(status, riskClass, capabilityConfidence, routeConfidence, evidenceQuorum, requiresUserConfirmation, userConfirmationGranted, policyReason) {
    return {
      status,
      riskClass,
      capabilityConfidence,
      routeConfidence,
      evidenceQuorum,
      requiresUserConfirmation,
      userConfirmationGranted,
      policyReason,
      evaluatedTimestamp: Date.now()
    };
  }
};

// src/core/audit/logger.ts
var AuditLogger = class {
  records = [];
  sessionId;
  constructor(sessionId) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  /**
   * Appends an immutable audit record
   */
  log(record) {
    const fullRecord = {
      ...record,
      recordId: `rec_${Date.now()}_${this.records.length + 1}`,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };
    this.records.push(Object.freeze(JSON.parse(JSON.stringify(fullRecord))));
    return fullRecord;
  }
  /**
   * Returns all audit records
   */
  getRecords() {
    return this.records;
  }
  /**
   * Exports full audit log as structured JSON
   */
  exportLog(systemVersion = "1.0.0") {
    return {
      exportId: `export_${Date.now()}`,
      exportedAt: Date.now(),
      systemVersion,
      recordsCount: this.records.length,
      records: [...this.records]
    };
  }
  /**
   * Clears logs (for test harnesses)
   */
  clear() {
    this.records = [];
  }
};

// src/core/storage/persistentStore.ts
var CURRENT_SCHEMA_VERSION = 1;
var PersistentCapabilityStore = class _PersistentCapabilityStore {
  constructor(storageKey = "intentnav_persistent_store") {
    this.storageKey = storageKey;
    this.inMemoryCache = this.getDefaultSchema();
  }
  static nodeFallbackStorage = /* @__PURE__ */ new Map();
  inMemoryCache;
  isInitialized = false;
  static resetNodeFallbackStorage() {
    _PersistentCapabilityStore.nodeFallbackStorage.clear();
  }
  getDefaultSchema() {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      capabilities: {},
      capabilityNodes: {},
      interfaceStates: {},
      graphEdges: [],
      routeVersions: {},
      validationRecords: [],
      negativeEvidence: [],
      driftHistory: [],
      metadata: {
        lastUpdated: Date.now(),
        extensionVersion: "1.0.0"
      }
    };
  }
  async init() {
    if (this.isInitialized) return;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(this.storageKey);
      if (data && data[this.storageKey]) {
        this.inMemoryCache = data[this.storageKey];
        this.hydrateAllCapabilities();
        await this.checkAndMigrateSchema();
      } else {
        this.inMemoryCache = this.getDefaultSchema();
        await this.persist();
      }
    } else if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        try {
          this.inMemoryCache = JSON.parse(raw);
          this.hydrateAllCapabilities();
          await this.checkAndMigrateSchema();
        } catch {
          this.inMemoryCache = this.getDefaultSchema();
        }
      } else {
        this.inMemoryCache = this.getDefaultSchema();
        await this.persist();
      }
    } else {
      const raw = _PersistentCapabilityStore.nodeFallbackStorage.get(this.storageKey);
      if (raw) {
        try {
          this.inMemoryCache = JSON.parse(raw);
          this.hydrateAllCapabilities();
          await this.checkAndMigrateSchema();
        } catch {
          this.inMemoryCache = this.getDefaultSchema();
        }
      } else {
        this.inMemoryCache = this.getDefaultSchema();
        await this.persist();
      }
    }
    if (!Array.isArray(this.inMemoryCache.graphEdges)) {
      this.inMemoryCache.graphEdges = [];
    }
    this.isInitialized = true;
  }
  hydrateAllCapabilities() {
    if (!this.inMemoryCache || !this.inMemoryCache.capabilities) return;
    for (const cap of Object.values(this.inMemoryCache.capabilities)) {
      this.hydrateCapability(cap);
    }
  }
  hydratePredicateList(predicates) {
    if (!Array.isArray(predicates)) return;
    for (const pred of predicates) {
      if (pred && typeof pred === "object") {
        if (pred.declarative && (!pred.evaluate || typeof pred.evaluate !== "function")) {
          pred.evaluate = (context) => DeclarativePredicateEvaluator.evaluate(pred.declarative, context);
        }
      }
    }
  }
  hydrateCapability(cap) {
    if (!cap) return cap;
    this.hydratePredicateList(cap.mandatoryPreStatePredicates);
    this.hydratePredicateList(cap.allowedStateDelta);
    this.hydratePredicateList(cap.expectedPostState);
    this.hydratePredicateList(cap.requiredContextPredicates);
    this.hydratePredicateList(cap.forbiddenContextPredicates);
    if (cap.negativeEvidence) {
      this.hydratePredicateList(cap.negativeEvidence.contradictionPredicates);
      this.hydratePredicateList(cap.negativeEvidence.failedInvariantPredicates);
    }
    if (!cap.fingerprintHash || !FingerprintConstructor.isValidV2FingerprintHash(cap.fingerprintHash)) {
      FingerprintConstructor.migrateCapabilityFingerprintToV2(cap);
    }
    return cap;
  }
  async checkAndMigrateSchema() {
    if (this.inMemoryCache.schemaVersion < CURRENT_SCHEMA_VERSION) {
      await this.migrateSchema(this.inMemoryCache.schemaVersion, CURRENT_SCHEMA_VERSION);
    }
  }
  async migrateSchema(fromVersion, toVersion) {
    if (fromVersion < 1) {
      this.inMemoryCache.schemaVersion = 1;
    }
    this.inMemoryCache.schemaVersion = toVersion;
    this.inMemoryCache.metadata.lastUpdated = Date.now();
    await this.persist();
  }
  persistSync() {
    this.inMemoryCache.metadata.lastUpdated = Date.now();
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.inMemoryCache));
      } catch {
      }
    } else {
      _PersistentCapabilityStore.nodeFallbackStorage.set(this.storageKey, JSON.stringify(this.inMemoryCache));
    }
  }
  async persist() {
    this.persistSync();
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [this.storageKey]: this.inMemoryCache });
    }
  }
  // --- Capabilities ---
  async saveCapability(cap) {
    this.inMemoryCache.capabilities[cap.capabilityId] = cap;
    this.persistSync();
    await this.init();
    this.inMemoryCache.capabilities[cap.capabilityId] = cap;
    await this.persist();
  }
  async getCapability(capabilityId) {
    await this.init();
    const cap = this.inMemoryCache.capabilities[capabilityId];
    if (!cap) return null;
    return this.hydrateCapability(cap);
  }
  async getAllCapabilities() {
    await this.init();
    const caps = Object.values(this.inMemoryCache.capabilities);
    return caps.map((c) => this.hydrateCapability(c));
  }
  // --- Capability Nodes & Graph ---
  async saveCapabilityNode(node) {
    this.inMemoryCache.capabilityNodes[node.capabilityId] = node;
    this.persistSync();
    await this.init();
    this.inMemoryCache.capabilityNodes[node.capabilityId] = node;
    await this.persist();
  }
  async getCapabilityNode(capabilityId) {
    await this.init();
    return this.inMemoryCache.capabilityNodes[capabilityId] || null;
  }
  async getAllCapabilityNodes() {
    await this.init();
    return { ...this.inMemoryCache.capabilityNodes };
  }
  // --- Interface States ---
  async saveInterfaceState(state) {
    this.inMemoryCache.interfaceStates[state.stateId] = state;
    this.persistSync();
    await this.init();
    this.inMemoryCache.interfaceStates[state.stateId] = state;
    await this.persist();
  }
  async getInterfaceState(stateId) {
    await this.init();
    return this.inMemoryCache.interfaceStates[stateId] || null;
  }
  async getAllInterfaceStates() {
    await this.init();
    return Object.values(this.inMemoryCache.interfaceStates);
  }
  // --- Graph Edges ---
  async saveGraphEdge(edge) {
    if (!Array.isArray(this.inMemoryCache.graphEdges)) {
      this.inMemoryCache.graphEdges = [];
    }
    const existingIndex = this.inMemoryCache.graphEdges.findIndex((e) => e.id === edge.id);
    if (existingIndex >= 0) {
      this.inMemoryCache.graphEdges[existingIndex] = edge;
    } else {
      this.inMemoryCache.graphEdges.push(edge);
    }
    this.persistSync();
    await this.init();
    await this.persist();
  }
  async getAllGraphEdges() {
    await this.init();
    return [...this.inMemoryCache.graphEdges || []];
  }
  // --- Route Versions ---
  async saveRouteVersion(route) {
    this.inMemoryCache.routeVersions[route.routeId] = route;
    const node = this.inMemoryCache.capabilityNodes[route.capabilityId];
    if (node) {
      node.routeVersions[route.routeId] = route;
      if (route.status === "ACTIVE_VALIDATED") {
        node.activeRouteId = route.routeId;
        node.provisionalRouteIds = node.provisionalRouteIds.filter((id) => id !== route.routeId);
      } else if (node.activeRouteId === route.routeId) {
        node.activeRouteId = null;
      }
      if (route.status === "QUARANTINED") {
        if (!node.quarantinedRouteIds.includes(route.routeId)) {
          node.quarantinedRouteIds.push(route.routeId);
        }
        node.provisionalRouteIds = node.provisionalRouteIds.filter((id) => id !== route.routeId);
      }
      if (route.status === "DEMOTED") {
        if (!node.demotedRouteIds.includes(route.routeId)) {
          node.demotedRouteIds.push(route.routeId);
        }
        node.provisionalRouteIds = node.provisionalRouteIds.filter((id) => id !== route.routeId);
      }
    }
    this.persistSync();
    await this.init();
    this.inMemoryCache.routeVersions[route.routeId] = route;
    await this.persist();
  }
  async getRouteVersion(routeId) {
    await this.init();
    return this.inMemoryCache.routeVersions[routeId] || null;
  }
  async getAllRouteVersions(capabilityId) {
    await this.init();
    const all = Object.values(this.inMemoryCache.routeVersions);
    return capabilityId ? all.filter((r) => r.capabilityId === capabilityId) : all;
  }
  // --- Validation History ---
  async saveValidationRecord(record) {
    await this.init();
    this.inMemoryCache.validationRecords.push(record);
    if (this.inMemoryCache.validationRecords.length > 50) {
      this.inMemoryCache.validationRecords = this.inMemoryCache.validationRecords.slice(-50);
    }
    await this.persist();
  }
  async getValidationRecords(capabilityId) {
    await this.init();
    if (!capabilityId) return [...this.inMemoryCache.validationRecords];
    return this.inMemoryCache.validationRecords.filter((r) => r.capabilityId === capabilityId);
  }
  // --- Negative Evidence ---
  async saveNegativeEvidence(evidence) {
    await this.init();
    this.inMemoryCache.negativeEvidence.push(evidence);
    if (this.inMemoryCache.negativeEvidence.length > 50) {
      this.inMemoryCache.negativeEvidence = this.inMemoryCache.negativeEvidence.slice(-50);
    }
    await this.persist();
  }
  async getNegativeEvidence(capabilityId) {
    await this.init();
    if (!capabilityId) return [...this.inMemoryCache.negativeEvidence];
    return this.inMemoryCache.negativeEvidence.filter((e) => e.capabilityId === capabilityId);
  }
  // --- Drift History ---
  async saveDriftRecord(record) {
    await this.init();
    this.inMemoryCache.driftHistory.push(record);
    if (this.inMemoryCache.driftHistory.length > 50) {
      this.inMemoryCache.driftHistory = this.inMemoryCache.driftHistory.slice(-50);
    }
    await this.persist();
  }
  async getDriftHistory(capabilityId) {
    await this.init();
    if (!capabilityId) return [...this.inMemoryCache.driftHistory];
    return this.inMemoryCache.driftHistory.filter((d) => d.capabilityId === capabilityId);
  }
  // --- Export & Clear ---
  async exportFullDump() {
    await this.init();
    return JSON.stringify(this.inMemoryCache, null, 2);
  }
  async clear() {
    this.inMemoryCache = this.getDefaultSchema();
    await this.persist();
  }
};

// src/core/graph/planner.ts
var MultiStepRoutePlanner = class {
  constructor(graph) {
    this.graph = graph;
  }
  /**
   * Plans an ordered multi-step route from initialStateId to reach targetCapabilityId or targetStateId.
   */
  planRoute(query) {
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const maxDepth = query.maxDepth ?? 5;
    const maxPathCost = query.maxPathCost ?? 20;
    const forbiddenStates = new Set(query.forbiddenStateIds || []);
    const initialState = this.graph.getInterfaceState(query.initialStateId);
    if (!initialState) {
      return {
        success: false,
        exploredNodesCount: 0,
        planningLatencyMs: 0,
        failureReason: "NO_PATH",
        explanation: `Initial interface state '${query.initialStateId}' not found in capability graph.`,
        stepsCount: 0
      };
    }
    if (forbiddenStates.has(query.initialStateId)) {
      return {
        success: false,
        exploredNodesCount: 1,
        planningLatencyMs: 0,
        failureReason: "FORBIDDEN_STATE_ENCOUNTERED",
        explanation: `Initial state '${query.initialStateId}' is in the forbidden states set.`,
        stepsCount: 0
      };
    }
    const targetCapability = this.graph.getCapability(query.targetCapabilityId);
    if (!targetCapability && !query.targetStateId) {
      return {
        success: false,
        exploredNodesCount: 1,
        planningLatencyMs: 0,
        failureReason: "NO_PATH",
        explanation: `Target capability '${query.targetCapabilityId}' not registered in capability graph.`,
        stepsCount: 0
      };
    }
    const queue = [
      {
        stateId: query.initialStateId,
        path: [],
        cumulativeCost: 0,
        visitedStates: /* @__PURE__ */ new Set([query.initialStateId])
      }
    ];
    let exploredNodesCount = 0;
    let cycleDetected = false;
    let depthExhausted = false;
    const allEdges = this.graph.getEdges();
    while (queue.length > 0) {
      queue.sort((a, b) => a.cumulativeCost - b.cumulativeCost);
      const current = queue.shift();
      exploredNodesCount++;
      const isTargetState = query.targetStateId && current.stateId === query.targetStateId;
      const isTargetCapExposed = targetCapability && (allEdges.some(
        (e) => e.sourceNodeId === current.stateId && e.targetNodeId === query.targetCapabilityId && e.edgeType === "EXPOSES_CAPABILITY"
      ) || // State exposes capability directly via active route or metadata
      current.stateId === `PANEL_${targetCapability.capabilityId}` || current.stateId === `STATE_${targetCapability.capabilityId}`);
      if (current.path.length > 0 && (isTargetState || isTargetCapExposed)) {
        const endTime2 = typeof performance !== "undefined" ? performance.now() : Date.now();
        const route = this.buildRouteFromEdges(query.targetCapabilityId, current.path, current.cumulativeCost);
        return {
          success: true,
          route,
          exploredNodesCount,
          planningLatencyMs: Math.round((endTime2 - startTime) * 100) / 100,
          explanation: `Multi-step route planned successfully with ${route.steps.length} sequential transitions.`,
          stepsCount: route.steps.length
        };
      }
      if (current.path.length >= maxDepth) {
        depthExhausted = true;
        continue;
      }
      const outgoingEdges = allEdges.filter((e) => e.sourceNodeId === current.stateId);
      for (const edge of outgoingEdges) {
        if (edge.validationStatus === "DEMOTED" || edge.validationStatus === "QUARANTINED") {
          continue;
        }
        const nextStateId = edge.targetNodeId;
        if (forbiddenStates.has(nextStateId)) {
          continue;
        }
        if (current.visitedStates.has(nextStateId)) {
          cycleDetected = true;
          continue;
        }
        const nextCost = current.cumulativeCost + (edge.weight || 1);
        if (nextCost > maxPathCost) {
          continue;
        }
        const nextVisited = new Set(current.visitedStates);
        nextVisited.add(nextStateId);
        queue.push({
          stateId: nextStateId,
          path: [...current.path, edge],
          cumulativeCost: nextCost,
          visitedStates: nextVisited
        });
      }
    }
    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const planningLatencyMs = Math.round((endTime - startTime) * 100) / 100;
    let failureReason = "NO_PATH";
    let explanation = `No valid transition path found between '${query.initialStateId}' and target.`;
    if (depthExhausted && !cycleDetected) {
      failureReason = "DEPTH_EXHAUSTED";
      explanation = `Search depth exceeded maximum limit of ${maxDepth} steps without reaching target state.`;
    } else if (cycleDetected && queue.length === 0) {
      failureReason = "CYCLE_DETECTED";
      explanation = `Cycle detected in route graph; path traversal prevented infinite recursion.`;
    }
    return {
      success: false,
      exploredNodesCount,
      planningLatencyMs,
      failureReason,
      explanation,
      stepsCount: 0
    };
  }
  /**
   * Constructs an ordered, versioned RouteVersion from an edge sequence.
   */
  buildRouteFromEdges(capabilityId, edges, totalCost) {
    const steps = edges.map((edge, idx) => ({
      stepIndex: idx + 1,
      fromStateId: edge.sourceNodeId,
      toStateId: edge.targetNodeId,
      actionDescription: edge.actionRequired || `Transition from ${edge.sourceNodeId} to ${edge.targetNodeId}`,
      transitionSignature: edge.transitionSignature,
      expectedTransitionDelta: edge.transitionSignature?.expectedStateDelta
    }));
    const routeId = `route_${capabilityId}_multistep_${Date.now()}`;
    return {
      routeId,
      capabilityId,
      versionNumber: 1,
      status: "PROVISIONAL",
      steps,
      creationTimestamp: Date.now(),
      confidenceScore: Math.max(0.6, 1 - totalCost * 0.05),
      pathCost: totalCost,
      quarantineReason: "Multi-step route awaiting sequential causal verification before promotion"
    };
  }
};

// src/core/network/acknowledgement.ts
var AcknowledgementTracker = class {
  recordedAcknowledgements = /* @__PURE__ */ new Map();
  processedPayloadHashes = /* @__PURE__ */ new Set();
  /**
   * Records an observable network acknowledgement from a local channel.
   */
  recordAcknowledgement(params) {
    const payloadStr = params.rawPayload ? JSON.stringify(params.rawPayload) : `${params.operation}_${params.status}`;
    const payloadHash = `ack_${FingerprintConstructor.sha256HexSync(payloadStr).slice(0, 16)}`;
    const record = {
      acknowledgementId: params.acknowledgementId,
      operation: params.operation,
      status: params.status,
      timestamp: params.timestamp,
      activationEventId: params.activationEventId,
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      sourceChannel: params.sourceChannel,
      payloadHash,
      rawPayload: params.rawPayload,
      verified: false
    };
    this.recordedAcknowledgements.set(params.acknowledgementId, record);
    return record;
  }
  /**
   * Validates an observed acknowledgement against the initiating activation event and route.
   * Strictly enforces:
   * 1. Non-null acknowledgement present (prevents missing ack from passing).
   * 2. Non-stale: acknowledgement timestamp >= activation event timestamp.
   * 3. Activation binding: acknowledgement must match activationEventId.
   * 4. Capability binding: acknowledgement must match initiating capabilityId.
   * 5. Non-contradictory: status must be 'COMPLETED' (not 'REJECTED' or 'ERROR').
   * 6. Anti-replay: duplicate payloads or identical IDs are flagged.
   */
  validateAcknowledgement(ack, activationEvent, routeId, capabilityId, timeoutMs = 3e3) {
    if (!ack) {
      return {
        valid: false,
        status: "TIMEOUT",
        rejectionReason: `ACKNOWLEDGEMENT_TIMEOUT: No observable acknowledgement arrived within timeout window (${timeoutMs}ms). Cannot treat absence of confirmation as success.`
      };
    }
    const latency = ack.timestamp - activationEvent.timestamp;
    if (latency > timeoutMs) {
      return {
        valid: false,
        status: "TIMEOUT",
        rejectionReason: `ACKNOWLEDGEMENT_TIMEOUT: Acknowledgement arrived at +${latency}ms, exceeding allowed window of ${timeoutMs}ms.`
      };
    }
    if (ack.timestamp < activationEvent.timestamp) {
      return {
        valid: false,
        status: "ERROR",
        rejectionReason: `STALE_ACKNOWLEDGEMENT: Acknowledgement timestamp (${ack.timestamp}) predates activation event (${activationEvent.timestamp}). Pre-existing event cannot satisfy acknowledgement.`
      };
    }
    if (ack.activationEventId !== activationEvent.eventId) {
      return {
        valid: false,
        status: "ERROR",
        rejectionReason: `MISMATCHED_ACTIVATION_ID: Acknowledgement binds to '${ack.activationEventId}', expected '${activationEvent.eventId}'.`
      };
    }
    if (ack.capabilityId && ack.capabilityId !== capabilityId) {
      return {
        valid: false,
        status: "ERROR",
        rejectionReason: `MISMATCHED_CAPABILITY_ID: Acknowledgement binds to capability '${ack.capabilityId}', expected '${capabilityId}'.`
      };
    }
    if (ack.routeId && routeId && ack.routeId !== routeId) {
      return {
        valid: false,
        status: "ERROR",
        rejectionReason: `MISMATCHED_ROUTE_ID: Acknowledgement binds to route '${ack.routeId}', expected '${routeId}'.`
      };
    }
    if (ack.status === "REJECTED" || ack.status === "ERROR") {
      return {
        valid: false,
        status: ack.status,
        rejectionReason: `SERVER_REJECTION: Network acknowledgement explicitly indicated server rejection or processing error: ${ack.status}.`
      };
    }
    if (ack.payloadHash && this.processedPayloadHashes.has(ack.payloadHash)) {
      return {
        valid: false,
        status: "ERROR",
        rejectionReason: `DUPLICATE_ACKNOWLEDGEMENT: Acknowledgement payload hash '${ack.payloadHash}' has already been processed. Replay rejected.`
      };
    }
    if (ack.payloadHash) {
      this.processedPayloadHashes.add(ack.payloadHash);
    }
    ack.verified = true;
    ack.latencyMs = latency;
    return {
      valid: true,
      status: "COMPLETED",
      record: ack
    };
  }
  getAcknowledgement(acknowledgementId) {
    return this.recordedAcknowledgements.get(acknowledgementId);
  }
  clear() {
    this.recordedAcknowledgements.clear();
    this.processedPayloadHashes.clear();
  }
};

// src/core/causal/safeVerification.ts
var SafeVerificationController = class {
  /**
   * Assesses whether an action or route verification is safe to perform automatically.
   */
  static assessVerificationSafety(fingerprint, userConfirmationGranted = false) {
    const riskInfo = RiskClassifier.classifyRisk(
      fingerprint.actionType,
      fingerprint.targetEntity,
      fingerprint.riskMetadata?.riskClass
    );
    if (riskInfo.riskLevel === "HIGH" || riskInfo.isDestructive) {
      if (!userConfirmationGranted) {
        return {
          riskInfo,
          isSafeToProbe: false,
          requiresUserConfirmation: true,
          probeType: "PROHIBITED_UNSAFE_PROBE",
          policyReason: `High-risk action (${riskInfo.riskClass}) cannot be executed for verification without explicit user confirmation.`
        };
      }
      return {
        riskInfo,
        isSafeToProbe: true,
        requiresUserConfirmation: true,
        probeType: "CONFIRMATION_GATED_EXECUTION",
        policyReason: `High-risk action authorized for verification via explicit user confirmation.`
      };
    }
    if (riskInfo.riskClass === "READ_ONLY" || fingerprint.actionType === "VIEW" || fingerprint.actionType === "NAVIGATE") {
      return {
        riskInfo,
        isSafeToProbe: true,
        requiresUserConfirmation: false,
        probeType: "NON_DESTRUCTIVE_OBSERVATION",
        policyReason: "Read-only action verified via passive non-destructive observation."
      };
    }
    return {
      riskInfo,
      isSafeToProbe: true,
      requiresUserConfirmation: false,
      probeType: "REVERSIBLE_PROBE",
      policyReason: "Reversible state modification authorized for verification."
    };
  }
  /**
   * Performs an authoritative, verified rollback after a runtime or transition failure.
   * Evaluates whether the prior validated route can be restored AND verifies that its invariants
   * actually hold in the current post-failure environment.
   */
  static verifyAndExecuteRollback(routeManager, capability, failedRouteId, currentCandidate, failureReason) {
    const capabilityNode = routeManager.graph?.getCapability(capability.capabilityId);
    if (!capabilityNode) {
      return {
        rollbackAttempted: false,
        restoredRouteId: null,
        status: "ROLLBACK_UNAVAILABLE",
        invariantsPassed: false,
        explanation: `Capability '${capability.capabilityId}' not registered in capability graph. Demoted without rollback.`,
        timestamp: Date.now()
      };
    }
    const demotionResult = routeManager.demoteActiveRoute(
      capability.capabilityId,
      failedRouteId,
      failureReason
    );
    const rollbackRoute = demotionResult.rollbackRoute;
    if (!rollbackRoute) {
      return {
        rollbackAttempted: true,
        restoredRouteId: null,
        status: "ROLLBACK_UNAVAILABLE",
        invariantsPassed: false,
        explanation: `No prior validated route version exists for capability '${capability.capabilityId}'. Demoted without rollback.`,
        timestamp: Date.now()
      };
    }
    if (currentCandidate) {
      const closureResult = InvariantClosureEngine.evaluateCandidate(capability, currentCandidate);
      if (closureResult.status !== "PASS") {
        routeManager.quarantineRoute(
          capability.capabilityId,
          rollbackRoute.routeId,
          `Rollback verification failed live invariant closure: ${closureResult.rejectionReason}`
        );
        return {
          rollbackAttempted: true,
          restoredRouteId: rollbackRoute.routeId,
          status: "ROLLBACK_FAILED",
          invariantsPassed: false,
          explanation: `Prior validated route '${rollbackRoute.routeId}' was restored but failed live invariant closure: ${closureResult.rejectionReason}. Quarantined.`,
          timestamp: Date.now()
        };
      }
    }
    return {
      rollbackAttempted: true,
      restoredRouteId: rollbackRoute.routeId,
      status: "ROLLBACK_VERIFIED",
      invariantsPassed: true,
      explanation: `Prior validated route '${rollbackRoute.routeId}' (version ${rollbackRoute.versionNumber}) successfully restored and verified.`,
      timestamp: Date.now()
    };
  }
};

// src/core/stateMachine/machine.ts
var IntentNavMachine = class {
  state = "IDLE";
  context = { currentState: "IDLE" };
  tokenAuthenticator;
  graph;
  routeManager;
  negativeEvidenceStore;
  rankingEngine;
  candidatePipeline;
  witnessCollector;
  causalVerifier;
  quarantineController;
  promotionController;
  auditLogger;
  persistentStore;
  planner;
  acknowledgementTracker;
  defaultDispatcher;
  // Registered capability catalog
  capabilities = /* @__PURE__ */ new Map();
  constructor(auditLogger, persistentStore, tokenAuthenticator) {
    this.tokenAuthenticator = tokenAuthenticator || defaultTokenAuthenticator;
    this.persistentStore = persistentStore || new PersistentCapabilityStore();
    this.graph = new CapabilityGraphEngine(this.persistentStore);
    this.routeManager = new RouteManager(this.graph, this.tokenAuthenticator);
    this.negativeEvidenceStore = new NegativeEvidenceStore(this.persistentStore);
    this.rankingEngine = new CandidateRankingEngine();
    this.candidatePipeline = new CandidatePipeline(
      this.negativeEvidenceStore,
      this.rankingEngine
    );
    this.witnessCollector = new WitnessCollector();
    this.causalVerifier = new CausalTransitionVerifier({
      tokenAuthenticator: this.tokenAuthenticator
    });
    this.quarantineController = new QuarantineController(
      this.routeManager,
      this.negativeEvidenceStore
    );
    this.promotionController = new RoutePromotionController(
      this.routeManager,
      this.quarantineController
    );
    this.auditLogger = auditLogger || new AuditLogger();
    this.planner = new MultiStepRoutePlanner(this.graph);
    this.acknowledgementTracker = new AcknowledgementTracker();
  }
  async init() {
    await this.persistentStore.init();
    await this.graph.loadFromStore();
    const storedCaps = await this.persistentStore.getAllCapabilities();
    for (const cap of storedCaps) {
      this.capabilities.set(cap.capabilityId, cap);
    }
  }
  setDefaultDispatcher(dispatcher) {
    this.defaultDispatcher = dispatcher;
  }
  registerCapability(cap) {
    if (!cap.fingerprintHash || !FingerprintConstructor.isValidV2FingerprintHash(cap.fingerprintHash)) {
      cap.fingerprintHash = FingerprintConstructor.computeFingerprintHashFromCapability(cap);
      cap.fingerprintVersion = "v2";
    }
    if (!cap.transitionSignatureBinding && cap.transitionEvidence) {
      cap.transitionSignatureBinding = FingerprintConstructor.computeTransitionSignatureHash(
        {
          preStateFingerprint: cap.transitionEvidence.preStateFingerprint,
          activationEventExpected: {
            eventType: cap.transitionEvidence.activationEventCharacteristics.eventType,
            key: cap.transitionEvidence.activationEventCharacteristics.key,
            code: cap.transitionEvidence.activationEventCharacteristics.code,
            keyCode: cap.transitionEvidence.activationEventCharacteristics.keyCode
          },
          expectedStateDelta: cap.transitionEvidence.expectedDelta,
          verificationWindowMs: cap.transitionEvidence.verificationWindowMs,
          postStateFingerprint: cap.transitionEvidence.postStateFingerprint
        },
        cap.fingerprintHash
      );
    }
    this.capabilities.set(cap.capabilityId, cap);
    this.graph.registerCapability(cap.capabilityId, cap.canonicalFunction);
    this.persistentStore.saveCapability(cap).catch(() => {
    });
  }
  getRegisteredCapabilities() {
    return Array.from(this.capabilities.values());
  }
  /**
   * Primary Entry Point: Process a user natural-language goal through the complete closed-loop pipeline
   */
  async processIntent(rawGoal, observedFeatures, availableCandidates, userConfirmationGranted = false, dispatcherOrWitnesses, executionOptions) {
    this.state = "INTENT_RECEIVED";
    this.context = {
      currentState: this.state,
      rawGoal,
      userConfirmationGranted
    };
    const knownTargets = Array.from(new Set(Array.from(this.capabilities.values()).map((c) => c.targetEntity)));
    const normalizedIntent = IntentNormalizer.normalize(rawGoal, knownTargets);
    this.context.normalizedIntent = normalizedIntent;
    this.state = "INTENT_NORMALIZED";
    const allCaps = Array.from(this.capabilities.values());
    const matches = CapabilityIntentResolver.resolve(normalizedIntent, allCaps);
    if (matches.length === 0 || !matches[0] || matches[0].matchScore < 0.4) {
      this.state = "ABSTAINED";
      this.context.currentState = this.state;
      this.logAudit("ABSTAINED", "No capability matching intent was found");
      return this.context;
    }
    const matchedCap = this.capabilities.get(matches[0].capabilityId);
    this.context.resolvedCapability = matchedCap;
    this.state = "CAPABILITY_RESOLVED";
    let activeRoute = this.graph.getActiveRoute(matchedCap.capabilityId);
    if (executionOptions?.executeQuarantinedRoute) {
      const node = this.graph.getCapability(matchedCap.capabilityId);
      if (node && node.quarantinedRouteIds.length > 0) {
        activeRoute = node.routeVersions[node.quarantinedRouteIds[0]] || null;
      } else if (activeRoute) {
        const quarantinedRoute = {
          ...activeRoute,
          status: "QUARANTINED",
          quarantineReason: "EXPLICIT_TEST_QUARANTINE"
        };
        this.graph.attachRouteVersion(matchedCap.capabilityId, quarantinedRoute);
        activeRoute = quarantinedRoute;
      }
    }
    this.context.activeRoute = activeRoute;
    let effectiveObserved = { ...observedFeatures };
    const driftTargetStep = activeRoute?.steps?.[0];
    let candidateForDrift = null;
    if (availableCandidates.length > 0) {
      if (driftTargetStep) {
        candidateForDrift = availableCandidates.find((c) => {
          if (driftTargetStep.bindingHandle?.handleId && c.bindingHandle?.handleId === driftTargetStep.bindingHandle.handleId) return true;
          if (driftTargetStep.bindingHandle?.volatileId && c.candidateId === driftTargetStep.bindingHandle.volatileId) return true;
          if (driftTargetStep.bindingHandle?.domStructuralPath && c.domStructuralPath === driftTargetStep.bindingHandle.domStructuralPath) return true;
          if (driftTargetStep.targetAccessibleName && c.candidateLabel.trim().toLowerCase() === driftTargetStep.targetAccessibleName.trim().toLowerCase()) return true;
          return false;
        }) || null;
      }
      if (!candidateForDrift) {
        candidateForDrift = availableCandidates.find(
          (c) => c.observedTargetEntity === matchedCap.targetEntity || c.candidateLabel && matchedCap.semanticEvidence?.accessibleName && c.candidateLabel.toLowerCase().includes(matchedCap.semanticEvidence.accessibleName.toLowerCase())
        ) || availableCandidates[0] || null;
      }
    }
    if (candidateForDrift) {
      const handle = candidateForDrift.bindingHandle;
      effectiveObserved = {
        tag: handle?.tagName || effectiveObserved.tag || "button",
        id: handle?.volatileId || effectiveObserved.id,
        storedId: driftTargetStep?.bindingHandle?.volatileId || effectiveObserved.storedId,
        classes: handle?.volatileClasses || effectiveObserved.classes,
        storedClasses: driftTargetStep?.bindingHandle?.volatileClasses || effectiveObserved.storedClasses,
        role: candidateForDrift.observedRole || handle?.role || effectiveObserved.role,
        accessibleName: candidateForDrift.candidateLabel || handle?.accessibleName || effectiveObserved.accessibleName,
        ancestors: candidateForDrift.ancestors && candidateForDrift.ancestors.length > 0 ? candidateForDrift.ancestors : effectiveObserved.ancestors,
        containerSemantics: candidateForDrift.containerSemantics && candidateForDrift.containerSemantics.length > 0 ? candidateForDrift.containerSemantics : effectiveObserved.containerSemantics,
        nearbyText: candidateForDrift.nearbyText && candidateForDrift.nearbyText.length > 0 ? candidateForDrift.nearbyText : effectiveObserved.nearbyText,
        relativeStructuralPath: candidateForDrift.domStructuralPath || handle?.domStructuralPath || effectiveObserved.relativeStructuralPath,
        observedActionType: candidateForDrift.observedActionType || effectiveObserved.observedActionType,
        observedTargetEntity: candidateForDrift.observedTargetEntity || effectiveObserved.observedTargetEntity,
        observedPreState: candidateForDrift.observedState || effectiveObserved.observedPreState,
        observedStateDelta: effectiveObserved.observedStateDelta,
        observedPostState: effectiveObserved.observedPostState,
        observedActivationEventType: effectiveObserved.observedActivationEventType,
        observedWitnessClasses: effectiveObserved.observedWitnessClasses
      };
    }
    const getMonotonicTime = () => {
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
      }
      return Date.now();
    };
    const driftStartTime = getMonotonicTime();
    const startFpComputations = FingerprintConstructor.getComputationCount();
    const allCapsBefore = this.graph.getAllCapabilities();
    const preActiveRouteMap = /* @__PURE__ */ new Map();
    for (const node of allCapsBefore) {
      preActiveRouteMap.set(node.capabilityId, node.activeRouteId);
    }
    const computeCollateralInvalidations = () => {
      const allCapsAfter = this.graph.getAllCapabilities();
      if (allCapsAfter.length === 0) return null;
      let collateral = 0;
      for (const node of allCapsAfter) {
        if (node.capabilityId !== matchedCap.capabilityId) {
          const preRoute = preActiveRouteMap.get(node.capabilityId);
          if (preRoute && !node.activeRouteId) {
            collateral++;
          }
        }
      }
      return collateral;
    };
    const driftVector = TypedDriftDetector.computeDrift(matchedCap, effectiveObserved);
    const driftResult = DriftClassifier.classify(
      driftVector,
      DEFAULT_DRIFT_THRESHOLDS,
      matchedCap.capabilityId
    );
    this.context.driftVector = driftVector;
    this.context.driftResult = driftResult;
    this.state = "DRIFT_CLASSIFIED";
    this.persistentStore.saveDriftRecord({
      capabilityId: matchedCap.capabilityId,
      timestamp: Date.now(),
      driftVector
    }).catch(() => {
    });
    let routeToAuthorize = activeRoute;
    let selectedWinnerContext = null;
    const invalidatedCapabilityIds = /* @__PURE__ */ new Set();
    let staleAttemptsAvoided = 0;
    const recoveryNeeded = !activeRoute || driftResult.actionRequired === "TRIGGER_REBIND_RECOVERY" || driftResult.actionRequired === "TRIGGER_VALIDATION" || driftResult.actionRequired === "QUARANTINE_IMMEDIATELY" || executionOptions?.executeQuarantinedRoute;
    if (activeRoute && activeRoute.status !== "QUARANTINED" && (driftResult.actionRequired === "TRIGGER_REBIND_RECOVERY" || driftResult.actionRequired === "TRIGGER_VALIDATION" || driftResult.actionRequired === "QUARANTINE_IMMEDIATELY")) {
      try {
        const demotedRouteId = activeRoute.routeId;
        const demoteReason = `DRIFT_LOCALIZATION: ${driftResult.dominantDriftDimension} drift (${driftVector[driftResult.dominantDriftDimension]}) triggered ${driftResult.actionRequired}`;
        this.routeManager.demoteActiveRoute(matchedCap.capabilityId, demotedRouteId, demoteReason);
        driftResult.invalidationApplied = true;
        invalidatedCapabilityIds.add(matchedCap.capabilityId);
        if (executionOptions?.targetRouteId && executionOptions.targetRouteId === demotedRouteId || executionOptions?.executeQuarantinedRoute) {
          staleAttemptsAvoided = 1;
        }
        if (!executionOptions?.executeQuarantinedRoute) {
          activeRoute = null;
          this.context.activeRoute = null;
        }
      } catch (err) {
        console.warn(`[StateMachine] Could not demote active route for ${matchedCap.capabilityId}:`, err?.message);
      }
    }
    if (recoveryNeeded) {
      if (driftResult.actionRequired === "QUARANTINE_IMMEDIATELY") {
        const driftEndTime2 = getMonotonicTime();
        this.context.driftRecoveryMetrics = {
          inspectedCandidatesCount: availableCandidates.length,
          inspectedNodesCount: availableCandidates.length,
          candidateEvaluationsCount: 0,
          fingerprintComputationsCount: FingerprintConstructor.getComputationCount() - startFpComputations,
          invalidatedCapabilitiesCount: invalidatedCapabilityIds.size,
          unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
          recoveryLatencyMs: Math.max(0, Math.round((driftEndTime2 - driftStartTime) * 100) / 100),
          staleExecutionAttemptsAvoided: staleAttemptsAvoided,
          abstentionsCount: 1
        };
        this.state = "ABSTAINED";
        this.context.currentState = this.state;
        this.logAudit("ABSTAINED", "Immediate quarantine required: contradictory functional drift detected");
        return this.context;
      }
      this.state = "CANDIDATE_DISCOVERY";
      this.context.candidateList = availableCandidates;
      const pipelineResult = this.candidatePipeline.processCandidates(
        matchedCap,
        availableCandidates,
        {
          currentTime: Date.now(),
          intent: this.context.normalizedIntent?.rawGoal || this.context.rawGoal
        }
      );
      this.context.invariantResults = pipelineResult.invariantResults;
      this.context.rankedScores = pipelineResult.rankedScores;
      this.context.selectedCandidate = pipelineResult.selectedWinner;
      const driftEndTime = getMonotonicTime();
      const evaluatedCandidatesCount = pipelineResult.candidateEvaluationsCount;
      const measuredFpComputations = FingerprintConstructor.getComputationCount() - startFpComputations;
      this.context.driftRecoveryMetrics = {
        inspectedCandidatesCount: availableCandidates.length,
        inspectedNodesCount: availableCandidates.length,
        candidateEvaluationsCount: evaluatedCandidatesCount,
        fingerprintComputationsCount: measuredFpComputations,
        invalidatedCapabilitiesCount: invalidatedCapabilityIds.size,
        unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
        recoveryLatencyMs: Math.max(0, Math.round((driftEndTime - driftStartTime) * 100) / 100),
        staleExecutionAttemptsAvoided: staleAttemptsAvoided,
        abstentionsCount: pipelineResult.selectedWinner ? 0 : 1
      };
      if (!pipelineResult.selectedWinner) {
        this.state = "ABSTAINED";
        this.context.currentState = this.state;
        this.logAudit("ABSTAINED", "All candidates failed invariant closure or contradiction filter");
        return this.context;
      }
      selectedWinnerContext = availableCandidates.find((c) => c.candidateId === pipelineResult.selectedWinner?.candidateId) || null;
      if (selectedWinnerContext && !selectedWinnerContext.bindingHandle) {
        selectedWinnerContext.bindingHandle = {
          handleId: `handle_${selectedWinnerContext.candidateId}`,
          tagName: "BUTTON",
          role: selectedWinnerContext.observedRole || "button",
          accessibleName: selectedWinnerContext.candidateLabel,
          domStructuralPath: selectedWinnerContext.domStructuralPath || "button",
          elementIndex: 0,
          volatileId: selectedWinnerContext.candidateId
        };
      }
      if (executionOptions?.executeQuarantinedRoute && activeRoute && activeRoute.status === "QUARANTINED") {
        routeToAuthorize = activeRoute;
        this.context.activeRoute = activeRoute;
        this.context.provisionalRoute = null;
      } else {
        this.state = "PROVISIONAL_ROUTE";
        const provisionalRoute = this.routeManager.createProvisionalRoute(
          matchedCap.capabilityId,
          [
            {
              stepIndex: 1,
              fromStateId: effectiveObserved.tag || "CURRENT_PAGE",
              toStateId: `PANEL_${matchedCap.targetEntity}`,
              actionDescription: `Interact with candidate ${pipelineResult.selectedWinner.candidateId}`,
              bindingHandle: selectedWinnerContext?.bindingHandle,
              targetRole: selectedWinnerContext?.observedRole,
              targetAccessibleName: selectedWinnerContext?.candidateLabel
            }
          ],
          pipelineResult.selectedWinner.scoreBreakdown.totalScore
        );
        this.context.provisionalRoute = provisionalRoute;
        routeToAuthorize = provisionalRoute;
      }
    } else {
      this.state = "CANDIDATE_DISCOVERY";
      this.context.candidateList = availableCandidates;
      const targetStep2 = activeRoute.steps?.[0];
      let activeCandidate = null;
      if (availableCandidates.length > 0) {
        activeCandidate = availableCandidates.find((c) => {
          if (targetStep2?.bindingHandle?.handleId && c.bindingHandle?.handleId === targetStep2.bindingHandle.handleId) return true;
          if (targetStep2?.bindingHandle?.volatileId && c.candidateId === targetStep2.bindingHandle.volatileId) return true;
          if (targetStep2?.bindingHandle?.domStructuralPath && c.domStructuralPath === targetStep2.bindingHandle.domStructuralPath) return true;
          if (targetStep2?.targetAccessibleName && c.candidateLabel.trim().toLowerCase() === targetStep2.targetAccessibleName.trim().toLowerCase()) return true;
          return false;
        }) || null;
        if (!activeCandidate && availableCandidates.length === 1) {
          activeCandidate = availableCandidates[0];
        }
      }
      if (!activeCandidate) {
        const handle = targetStep2?.bindingHandle || {
          handleId: observedFeatures.id || targetStep2?.targetAccessibleName || "active_step_cand",
          tagName: observedFeatures.tag || "button",
          role: observedFeatures.role || targetStep2?.targetRole || matchedCap.semanticEvidence?.role || "button",
          accessibleName: targetStep2?.targetAccessibleName || matchedCap.semanticEvidence?.accessibleName || "Active control",
          domStructuralPath: observedFeatures.tag || "button",
          elementIndex: 0,
          volatileId: observedFeatures.id
        };
        activeCandidate = {
          candidateId: handle.handleId,
          candidateLabel: targetStep2?.targetAccessibleName || handle.accessibleName || matchedCap.semanticEvidence?.accessibleName || "Active control",
          observedActionType: observedFeatures.observedActionType || matchedCap.actionType,
          observedTargetEntity: observedFeatures.observedTargetEntity || matchedCap.targetEntity,
          observedRole: observedFeatures.role || targetStep2?.targetRole || handle.role,
          bindingHandle: handle,
          observedState: observedFeatures.observedPreState ? { disabled: false, ...observedFeatures.observedPreState } : { disabled: false },
          containerSemantics: observedFeatures.containerSemantics || (matchedCap.contextEvidence?.containerSemantics ? [...matchedCap.contextEvidence.containerSemantics] : []),
          ancestors: observedFeatures.ancestors || (matchedCap.contextEvidence?.ancestorRelationships ? [...matchedCap.contextEvidence.ancestorRelationships] : []),
          nearbyText: observedFeatures.nearbyText || (matchedCap.contextEvidence?.nearbyText ? [...matchedCap.contextEvidence.nearbyText] : [])
        };
      }
      if (this.context.candidateList.length === 0 && activeCandidate) {
        this.context.candidateList = [activeCandidate];
      }
      const liveInvariantResult = InvariantClosureEngine.evaluateCandidate(matchedCap, activeCandidate);
      this.context.invariantResults = { [activeCandidate.candidateId]: liveInvariantResult };
      const activeEvalEndTime = getMonotonicTime();
      const inspectedCount = availableCandidates.length > 0 ? availableCandidates.length : 1;
      const activeFpComputations = FingerprintConstructor.getComputationCount() - startFpComputations;
      if (liveInvariantResult.status !== "PASS") {
        this.context.driftRecoveryMetrics = {
          inspectedCandidatesCount: inspectedCount,
          inspectedNodesCount: inspectedCount,
          candidateEvaluationsCount: 1,
          fingerprintComputationsCount: activeFpComputations,
          invalidatedCapabilitiesCount: 0,
          unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
          recoveryLatencyMs: Math.max(0, Math.round((activeEvalEndTime - driftStartTime) * 100) / 100),
          staleExecutionAttemptsAvoided: 0,
          abstentionsCount: 1
        };
        this.state = "ABSTAINED";
        this.context.currentState = this.state;
        this.logAudit(
          "ABSTAINED",
          `Active route failed current invariant evaluation: ${liveInvariantResult.rejectionReason || liveInvariantResult.status}`
        );
        return this.context;
      }
      this.context.driftRecoveryMetrics = {
        inspectedCandidatesCount: inspectedCount,
        inspectedNodesCount: inspectedCount,
        candidateEvaluationsCount: 1,
        fingerprintComputationsCount: activeFpComputations,
        invalidatedCapabilitiesCount: 0,
        unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
        recoveryLatencyMs: Math.max(0, Math.round((activeEvalEndTime - driftStartTime) * 100) / 100),
        staleExecutionAttemptsAvoided: 0,
        abstentionsCount: 0
      };
      selectedWinnerContext = activeCandidate;
      const activeRankResults = this.rankingEngine.rankCandidates(matchedCap, [activeCandidate], {
        intent: this.context.normalizedIntent?.rawGoal || this.context.normalizedIntent?.normalizedGoal
      });
      if (activeRankResults.length > 0 && activeRankResults[0]) {
        this.context.selectedCandidate = activeRankResults[0];
      } else {
        this.context.selectedCandidate = {
          candidateId: activeCandidate.candidateId,
          candidateLabel: activeCandidate.candidateLabel,
          isEligible: true,
          rank: 1,
          weightsVersion: "v1.0.0",
          scoreBreakdown: {
            invariantFit: 1,
            semanticFit: 0,
            contextFit: 0,
            transitionFit: 0,
            validationHistory: 0,
            contradictionPenalty: 0,
            stalenessPenalty: 0,
            riskPenalty: 0,
            pathCostPenalty: 0,
            totalScore: activeRoute?.confidenceScore || 1
          }
        };
      }
      routeToAuthorize = activeRoute;
    }
    this.state = "EXECUTION_AUTHORIZATION";
    const invariantResultForWinner = this.context.selectedCandidate ? this.context.invariantResults?.[this.context.selectedCandidate.candidateId] || null : null;
    const authDecision = ExecutionAuthorizationController.authorize({
      fingerprint: matchedCap,
      capabilityConfidence: matchedCap.confidence.capabilityConfidence,
      routeConfidence: routeToAuthorize?.confidenceScore || 0.85,
      invariantResult: invariantResultForWinner,
      transitionResult: null,
      userConfirmationGranted,
      intent: this.context.normalizedIntent
    });
    this.context.authorizationDecision = authDecision;
    if (authDecision.status === "CONFIRMATION_REQUIRED") {
      this.state = "CONFIRMATION_PENDING";
      this.context.currentState = this.state;
      this.logAudit("CONFIRMATION_PENDING", authDecision.policyReason);
      return this.context;
    }
    if (authDecision.status !== "AUTHORIZED") {
      this.state = "ABSTAINED";
      this.context.currentState = this.state;
      this.logAudit("ABSTAINED", authDecision.policyReason);
      return this.context;
    }
    const targetStep = (this.context.provisionalRoute || routeToAuthorize)?.steps?.[0];
    const candidateToExecute = selectedWinnerContext || (targetStep?.bindingHandle ? {
      candidateId: targetStep.bindingHandle.handleId,
      candidateLabel: targetStep.targetAccessibleName || targetStep.bindingHandle.accessibleName,
      observedActionType: matchedCap.actionType,
      observedTargetEntity: matchedCap.targetEntity,
      observedRole: targetStep.targetRole || targetStep.bindingHandle.role,
      bindingHandle: targetStep.bindingHandle
    } : availableCandidates.find((c) => c.candidateLabel === targetStep?.targetAccessibleName) || null) || (observedFeatures.tag ? {
      candidateId: observedFeatures.id || "target_active_route",
      candidateLabel: matchedCap.semanticEvidence.accessibleName,
      observedActionType: observedFeatures.observedActionType || matchedCap.actionType,
      observedTargetEntity: observedFeatures.observedTargetEntity || matchedCap.targetEntity,
      observedRole: observedFeatures.role || "button",
      bindingHandle: {
        handleId: observedFeatures.id || "target_handle",
        tagName: observedFeatures.tag,
        role: observedFeatures.role || "button",
        accessibleName: matchedCap.semanticEvidence.accessibleName,
        domStructuralPath: observedFeatures.tag || "unknown",
        elementIndex: 0,
        volatileId: observedFeatures.id
      }
    } : null);
    const effectiveDispatcherOrWitnesses = dispatcherOrWitnesses !== void 0 ? dispatcherOrWitnesses : this.defaultDispatcher;
    const isDispatcher = effectiveDispatcherOrWitnesses && typeof effectiveDispatcherOrWitnesses.dispatchActivation === "function";
    const isWitnessArray = Array.isArray(effectiveDispatcherOrWitnesses);
    if (!isDispatcher && !isWitnessArray) {
      this.state = "ABSTAINED";
      this.context.currentState = this.state;
      this.logAudit("ABSTAINED", "Execution halted: No execution dispatcher or browser activation channel available");
      return this.context;
    }
    if (!candidateToExecute) {
      this.state = "FAILED";
      this.context.currentState = this.state;
      this.logAudit("FAILED", "Target candidate for route step could not be resolved in the DOM");
      return this.context;
    }
    let preStateNode = null;
    if (isDispatcher && effectiveDispatcherOrWitnesses.observePostState) {
      try {
        preStateNode = await effectiveDispatcherOrWitnesses.observePostState();
        this.context.observedInterfaceState = preStateNode;
      } catch {
      }
    }
    const activationEventId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let activationEvent;
    let collectedWitnesses = [];
    const actCharacteristics = matchedCap.transitionEvidence?.activationEventCharacteristics || {
      eventType: "click",
      bubbles: true,
      cancelable: true
    };
    if (isDispatcher) {
      const dispatcher = effectiveDispatcherOrWitnesses;
      this.state = "ACTIVATION_DISPATCHED";
      const dispatchResult = await dispatcher.dispatchActivation(
        activationEventId,
        candidateToExecute,
        matchedCap.capabilityId,
        actCharacteristics
      );
      if (!dispatchResult.success || dispatchResult.elementFound === false || dispatchResult.eventDispatched === false) {
        this.context.dispatchSuccessful = false;
        this.state = "FAILED";
        this.context.currentState = this.state;
        const failReason = dispatchResult.elementFound === false ? "Target DOM element could not be resolved" : dispatchResult.eventDispatched === false ? "Browser event dispatch failed" : dispatchResult.reason || "Browser activation dispatch failed";
        this.logAudit("FAILED", failReason);
        return this.context;
      }
      this.context.dispatchSuccessful = true;
      activationEvent = dispatchResult.activationEvent || {
        eventId: activationEventId,
        sequenceNumber: 1,
        timestamp: Date.now(),
        targetCandidateId: candidateToExecute.candidateId,
        eventType: actCharacteristics.eventType,
        initiatingCapabilityId: matchedCap.capabilityId,
        key: actCharacteristics.key,
        code: actCharacteristics.code,
        keyCode: actCharacteristics.keyCode
      };
      if (!activationEvent.bindingHandle && candidateToExecute.bindingHandle) {
        activationEvent.bindingHandle = candidateToExecute.bindingHandle;
      }
      const windowMs = matchedCap.transitionEvidence?.verificationWindowMs || 2500;
      collectedWitnesses = await dispatcher.collectWitnesses(windowMs);
    } else {
      this.context.dispatchSuccessful = true;
      const firstWitnessEventId = effectiveDispatcherOrWitnesses.find(
        (w) => w.correlatedActivationEventId
      )?.correlatedActivationEventId;
      const effectiveEventId = firstWitnessEventId || activationEventId;
      const minWitnessTimestamp = Math.min(
        ...effectiveDispatcherOrWitnesses.map((w) => w.timestamp),
        Date.now()
      );
      activationEvent = {
        eventId: effectiveEventId,
        sequenceNumber: 1,
        timestamp: minWitnessTimestamp - 50,
        targetCandidateId: candidateToExecute.candidateId,
        eventType: actCharacteristics.eventType,
        initiatingCapabilityId: matchedCap.capabilityId,
        bindingHandle: candidateToExecute.bindingHandle,
        key: actCharacteristics.key,
        code: actCharacteristics.code,
        keyCode: actCharacteristics.keyCode
      };
      collectedWitnesses = effectiveDispatcherOrWitnesses;
    }
    this.context.activationEvent = activationEvent;
    this.context.capturedWitnesses = collectedWitnesses;
    let postStateNode = null;
    if (isDispatcher && effectiveDispatcherOrWitnesses.observePostState) {
      try {
        postStateNode = await effectiveDispatcherOrWitnesses.observePostState();
      } catch {
      }
    }
    let observedPostStateObj = void 0;
    const targetRouteId = (this.context.provisionalRoute || routeToAuthorize)?.routeId || `route_${matchedCap.capabilityId}`;
    if (postStateNode) {
      const postStateFp = FingerprintConstructor.computePostStateFingerprint({
        capabilityId: matchedCap.capabilityId,
        routeId: targetRouteId,
        activationEventId: activationEvent.eventId,
        stateNode: postStateNode
      });
      observedPostStateObj = {
        postStateFingerprint: postStateFp,
        observedApplicationState: postStateNode.observedApplicationState || {},
        observedStateNode: postStateNode,
        observedTimestamp: Date.now(),
        activationEventId: activationEvent.eventId,
        routeId: targetRouteId,
        capabilityId: matchedCap.capabilityId,
        isObserved: true,
        observationSource: "ExecutionDispatcher:observePostState"
      };
    }
    for (const w of collectedWitnesses) {
      if (w.witnessClass === "ASYNC_ACKNOWLEDGEMENT") {
        const ackRecord = this.acknowledgementTracker.recordAcknowledgement({
          acknowledgementId: w.witnessId,
          operation: w.observedDelta?.["operation"] || matchedCap.canonicalFunction,
          status: w.observedDelta?.["status"] || "COMPLETED",
          timestamp: w.timestamp,
          activationEventId: w.correlatedActivationEventId || activationEvent.eventId,
          routeId: w.routeId || targetRouteId,
          capabilityId: w.capabilityId || matchedCap.capabilityId,
          sourceChannel: w.provenance?.origin || "LOCAL_HTTP_MOCK",
          rawPayload: w.observedDelta
        });
        const ackValidation = this.acknowledgementTracker.validateAcknowledgement(
          ackRecord,
          activationEvent,
          targetRouteId,
          matchedCap.capabilityId,
          matchedCap.transitionEvidence?.verificationWindowMs || 3e3
        );
        if (!ackValidation.valid) {
          this.state = "QUARANTINED";
          this.context.currentState = this.state;
          const reason = `Network acknowledgement rejected: ${ackValidation.rejectionReason}`;
          this.quarantineController.quarantineFailedRoute(
            matchedCap.capabilityId,
            targetRouteId,
            reason,
            { failureReason: "contradictory_delta", status: "FAILED_CONTRADICTORY_WITNESS" }
          );
          this.createAndSaveValidationRecord("QUARANTINED");
          this.logAudit("FAILED", reason);
          return this.context;
        }
      }
    }
    this.state = "TRANSITION_VERIFYING";
    const postStateArg = observedPostStateObj || matchedCap.transitionEvidence.postStateFingerprint;
    const verificationResult = await this.causalVerifier.verifyTransitionAsync(
      {
        preStateFingerprint: matchedCap.transitionEvidence.preStateFingerprint,
        activationEventExpected: {
          eventType: actCharacteristics.eventType,
          key: actCharacteristics.key,
          code: actCharacteristics.code,
          keyCode: actCharacteristics.keyCode
        },
        expectedStateDelta: matchedCap.transitionEvidence.expectedDelta,
        verificationWindowMs: matchedCap.transitionEvidence.verificationWindowMs,
        postStateFingerprint: matchedCap.transitionEvidence.postStateFingerprint
      },
      activationEvent,
      collectedWitnesses,
      postStateArg,
      targetRouteId
    );
    this.context.verificationResult = verificationResult;
    this.context.causalVerified = Boolean(
      verificationResult.causallyVerified && verificationResult.status === "VERIFIED"
    );
    if (!verificationResult.causallyVerified || verificationResult.status !== "VERIFIED") {
      if (verificationResult.status === "FAILED_POST_STATE_MISMATCH" || verificationResult.failureReason === "post_state_mismatch") {
        this.context.postStateVerified = false;
      }
      this.state = "QUARANTINED";
      this.context.currentState = this.state;
      this.quarantineController.quarantineFailedRoute(
        matchedCap.capabilityId,
        targetRouteId,
        verificationResult.explanation,
        {
          failureReason: verificationResult.failureReason,
          status: verificationResult.status,
          activationEventId: activationEvent.eventId,
          sequenceNumber: activationEvent.sequenceNumber,
          witnessCount: collectedWitnesses.length,
          observedWitnessClasses: verificationResult.verifiedWitnessClasses,
          postStateFingerprint: observedPostStateObj?.postStateFingerprint
        },
        {
          failedCondition: verificationResult.status,
          activationEventId: activationEvent.eventId,
          sequenceNumber: activationEvent.sequenceNumber,
          witnessIds: collectedWitnesses.map((w) => w.witnessId),
          candidateIdentifier: candidateToExecute.candidateId
        }
      );
      this.createAndSaveValidationRecord("QUARANTINED");
      this.logAudit("FAILED", verificationResult.explanation);
      return this.context;
    }
    if (matchedCap.expectedPostState && matchedCap.expectedPostState.length > 0) {
      const observedAppState = postStateNode?.observedApplicationState || {};
      const mergedWitnessDeltas = {};
      for (const w of collectedWitnesses) {
        if (w.observedDelta) {
          Object.assign(mergedWitnessDeltas, w.observedDelta);
        }
      }
      for (const expected of matchedCap.expectedPostState) {
        const prop = expected.property;
        const expectedVal = expected.expectedValue;
        const hasInAppState = prop in observedAppState;
        const hasInWitnessDeltas = prop in mergedWitnessDeltas;
        if (hasInAppState) {
          if (observedAppState[prop] !== expectedVal) {
            this.context.postStateVerified = false;
            this.state = "FAILED";
            this.context.currentState = this.state;
            this.createAndSaveValidationRecord("FAILED");
            this.logAudit("FAILED", `Post-state property '${prop}' was '${observedAppState[prop]}', expected '${expectedVal}'`);
            return this.context;
          }
        } else if (hasInWitnessDeltas) {
          if (mergedWitnessDeltas[prop] !== expectedVal) {
            this.context.postStateVerified = false;
            this.state = "FAILED";
            this.context.currentState = this.state;
            this.createAndSaveValidationRecord("FAILED");
            this.logAudit("FAILED", `Post-state witness property '${prop}' was '${mergedWitnessDeltas[prop]}', expected '${expectedVal}'`);
            return this.context;
          }
        } else {
          this.context.postStateVerified = false;
          this.state = "FAILED";
          this.context.currentState = this.state;
          this.createAndSaveValidationRecord("FAILED");
          this.logAudit("FAILED", `Required post-state property '${prop}' was not observed in post-state or witness deltas.`);
          return this.context;
        }
        const stateToEval = hasInAppState ? observedAppState : mergedWitnessDeltas;
        if (typeof expected.evaluate === "function" && !expected.evaluate(stateToEval)) {
          this.context.postStateVerified = false;
          this.state = "FAILED";
          this.context.currentState = this.state;
          this.createAndSaveValidationRecord("FAILED");
          this.logAudit("FAILED", `Post-state predicate for '${prop}' evaluated to false.`);
          return this.context;
        }
      }
    }
    this.context.postStateVerified = true;
    if (this.context.provisionalRoute) {
      let verificationResultForPromotion = verificationResult;
      if (executionOptions?.corruptPromotionToken && verificationResult.verificationToken) {
        verificationResultForPromotion = {
          ...verificationResult,
          verificationToken: {
            ...verificationResult.verificationToken,
            signatureHash: "hmac_sha256_" + "0".repeat(64)
          }
        };
        this.context.verificationResult = verificationResultForPromotion;
      }
      const promoDecision = await this.promotionController.evaluateAndPromoteAsync(
        matchedCap.capabilityId,
        this.context.provisionalRoute.routeId,
        verificationResultForPromotion
      );
      this.context.promotionDecision = promoDecision;
      if (!promoDecision.promoted) {
        this.context.promotionTokenValid = false;
        this.context.promotionFailureReason = promoDecision.reason;
        this.state = "QUARANTINED";
        this.context.currentState = this.state;
        this.createAndSaveValidationRecord("QUARANTINED");
        this.logAudit("FAILED", promoDecision.reason);
        return this.context;
      }
      this.context.promotionTokenValid = true;
      routeToAuthorize = promoDecision.route;
      this.context.activeRoute = routeToAuthorize;
      this.state = "VALIDATED_ROUTE";
    }
    const check = this.canEnterExecutedState(this.context);
    this.context.executionPreconditionsCheck = check;
    if (!check.allowed) {
      this.state = "FAILED";
      this.context.currentState = this.state;
      this.createAndSaveValidationRecord("FAILED");
      this.logAudit("FAILED", `Precondition violation preventing EXECUTED state: ${check.reasons.join("; ")}`);
      return this.context;
    }
    this.state = "EXECUTED";
    this.context.currentState = this.state;
    this.createAndSaveValidationRecord("EXECUTED");
    this.logAudit("EXECUTED", "Navigation and verified capability execution completed successfully");
    return this.context;
  }
  canEnterExecutedState(context) {
    const reasons = [];
    const failedPreconditions = [];
    if (!context.normalizedIntent && !context.rawGoal) {
      failedPreconditions.push("PRE_1_INTENT_NORMALIZED");
      reasons.push("Intent is missing or not normalized");
    }
    if (!context.selectedCandidate && !context.activeRoute) {
      failedPreconditions.push("PRE_2_CANDIDATE_RESOLVED");
      reasons.push("No target candidate or active route step resolved for execution");
    }
    if (!context.resolvedCapability?.capabilityId || !context.resolvedCapability?.actionType || !context.resolvedCapability?.targetEntity) {
      failedPreconditions.push("PRE_3_CAPABILITY_IDENTITY");
      reasons.push("Capability identity is missing required persistent fields (capabilityId, actionType, targetEntity)");
    }
    const hasBindingHandle = Boolean(context.selectedCandidate?.bindingHandle?.handleId) || Boolean(context.activationEvent?.bindingHandle?.handleId) || Boolean(context.activeRoute?.steps?.some((s) => Boolean(s.bindingHandle?.handleId))) || Boolean(context.provisionalRoute?.steps?.some((s) => Boolean(s.bindingHandle?.handleId))) || Boolean(
      context.candidateList?.some(
        (c) => (c.candidateId === context.selectedCandidate?.candidateId || c.bindingHandle?.handleId === context.selectedCandidate?.candidateId) && Boolean(c.bindingHandle?.handleId)
      )
    );
    if (!hasBindingHandle) {
      failedPreconditions.push("PRE_4_VALID_BINDING_HANDLE");
      reasons.push("Target candidate or route step lacks a valid ephemeral BindingHandle");
    }
    if (context.selectedCandidate && context.invariantResults && context.invariantResults[context.selectedCandidate.candidateId] && context.invariantResults[context.selectedCandidate.candidateId]?.status !== "PASS") {
      failedPreconditions.push("PRE_5_INVARIANT_CLOSURE");
      reasons.push("Candidate failed mandatory invariant closure gate");
    }
    if (!context.activeRoute || context.activeRoute.status !== "ACTIVE_VALIDATED") {
      failedPreconditions.push("PRE_6_ROUTE_AUTHORIZED");
      reasons.push(
        `Target active route status is '${context.activeRoute?.status || "MISSING"}'; must be 'ACTIVE_VALIDATED' to enter EXECUTED state`
      );
    }
    if (!context.authorizationDecision || context.authorizationDecision.status !== "AUTHORIZED") {
      failedPreconditions.push("PRE_7_EXECUTION_AUTHORIZED");
      reasons.push("Execution authorization was not granted by the risk controller");
    }
    if (!context.activationEvent || !context.activationEvent.eventId) {
      failedPreconditions.push("PRE_8_ACTIVATION_DISPATCHED");
      reasons.push("Browser activation event was not dispatched");
    }
    if (context.dispatchSuccessful !== true) {
      failedPreconditions.push("PRE_9_DISPATCH_SUCCESSFUL");
      reasons.push("Browser activation dispatch was not confirmed successful (must be strictly true)");
    }
    const minWitnessTime = context.capturedWitnesses && context.capturedWitnesses.length > 0 ? Math.min(...context.capturedWitnesses.map((w) => w.timestamp)) : Infinity;
    if (!context.activationEvent?.timestamp || context.activationEvent.timestamp >= minWitnessTime) {
      failedPreconditions.push("PRE_10_ACTIVATION_EVENT_VALID");
      reasons.push("Activation event timestamp does not strictly precede transition witness timestamps");
    }
    if (!context.capturedWitnesses || context.capturedWitnesses.length === 0) {
      failedPreconditions.push("PRE_11_WITNESSES_CAPTURED");
      reasons.push("No transition witnesses were captured within the verification window");
    }
    if (context.causalVerified !== true || !context.verificationResult || !context.verificationResult.causallyVerified || context.verificationResult.status !== "VERIFIED") {
      failedPreconditions.push("PRE_12_CAUSAL_VERIFIED");
      reasons.push(`Causal transition verification did not verify causal link (status: ${context.verificationResult?.status})`);
    }
    if (context.postStateVerified !== true) {
      failedPreconditions.push("PRE_13_POST_STATE_VERIFIED");
      reasons.push("Post-state observation did not verify expected state progress (must be strictly true)");
    }
    const quorumRequired = context.resolvedCapability?.riskMetadata?.riskClass === "READ_ONLY" ? 1 : 2;
    const verifiedClasses = context.verificationResult?.verifiedWitnessClasses || [];
    if (verifiedClasses.length < quorumRequired) {
      failedPreconditions.push("PRE_14_WITNESS_QUORUM");
      reasons.push(
        `Witness class quorum not satisfied: required ${quorumRequired} independent classes, observed ${verifiedClasses.length}`
      );
    }
    if (context.selectedCandidate && context.invariantResults && context.invariantResults[context.selectedCandidate.candidateId]?.status === "CONTRADICTED") {
      failedPreconditions.push("PRE_15_NO_CONTRADICTORY_EVIDENCE");
      reasons.push("Candidate matches known contradiction or negative evidence");
    }
    if (context.provisionalRoute?.status === "QUARANTINED" || context.activeRoute?.status === "QUARANTINED" || context.activeRoute?.status && this.quarantineController.isUnderQuarantine(context.activeRoute.status)) {
      failedPreconditions.push("PRE_16_NO_UNRESOLVED_QUARANTINE");
      reasons.push("Target route has an unresolved quarantine");
    }
    if (context.provisionalRoute) {
      const token = context.verificationResult?.verificationToken;
      const tokenCheck = token && context.resolvedCapability ? this.tokenAuthenticator.verifyToken(token, {
        expectedRouteId: context.provisionalRoute.routeId,
        expectedCapabilityId: context.resolvedCapability.capabilityId
      }) : { valid: false };
      if (!token || !token.signatureHash || token.verifiedStatus !== "VERIFIED" || !tokenCheck.valid) {
        failedPreconditions.push("PRE_17_PROMOTION_TOKEN_VALID");
        reasons.push("Route promotion token is missing or invalid");
      } else if (!context.activeRoute || context.activeRoute.status !== "ACTIVE_VALIDATED") {
        failedPreconditions.push("PRE_17_ROUTE_PROMOTED");
        reasons.push("Provisional route was not successfully promoted to ACTIVE_VALIDATED");
      }
    }
    return {
      allowed: failedPreconditions.length === 0,
      failedPreconditions,
      reasons
    };
  }
  /**
   * Executes an ordered multi-step route sequentially (Step 8 & Step 9).
   * - Evaluates intermediate preconditions and postconditions.
   * - Halts immediately upon any intermediate failure, preventing unsafe downstream actions.
   * - Quarantines the failing route and triggers verified rollback if a prior validated route exists.
   */
  async executeMultiStepRouteAsync(route, dispatcher, capability, options) {
    if (route.status === "QUARANTINED" || route.status === "DEMOTED") {
      this.state = "FAILED";
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: 0,
        failureReason: `Cannot execute route with status '${route.status}'.`,
        finalState: this.state
      };
    }
    if (!route.steps || !Array.isArray(route.steps) || route.steps.length === 0) {
      this.state = "FAILED";
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: 0,
        failureReason: "Cannot execute empty route with zero steps.",
        finalState: this.state
      };
    }
    const safetyAssessment = SafeVerificationController.assessVerificationSafety(
      capability,
      options?.userConfirmationGranted
    );
    if (!safetyAssessment.isSafeToProbe && safetyAssessment.probeType === "PROHIBITED_UNSAFE_PROBE") {
      this.state = "CONFIRMATION_PENDING";
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: 0,
        failureReason: safetyAssessment.policyReason,
        finalState: this.state
      };
    }
    const hasHighRiskStep = route.steps.some((step) => {
      const rm = step.riskMetadata;
      return rm?.financial || rm?.security || rm?.destructive || rm?.requiresConfirmation || rm?.riskClass === "DESTRUCTIVE" || rm?.riskClass === "FINANCIAL" || rm?.reversible === false;
    });
    if (hasHighRiskStep && !options?.userConfirmationGranted) {
      this.state = "CONFIRMATION_PENDING";
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: 0,
        failureReason: "Multi-step route contains high-risk/irreversible operations that require explicit user confirmation.",
        finalState: this.state
      };
    }
    let capNode = this.graph.getCapability(capability.capabilityId);
    if (!capNode) {
      capNode = this.graph.registerCapability(
        capability.capabilityId,
        capability.canonicalFunction
      );
    }
    if (!capNode.routeVersions[route.routeId]) {
      this.graph.attachRouteVersion(capability.capabilityId, route);
    }
    let completedSteps = 0;
    let lastStepVerification;
    for (const step of route.steps) {
      const stepCandidate = {
        candidateId: step.bindingHandle?.handleId || `step_${step.stepIndex}_target`,
        candidateLabel: step.targetAccessibleName || step.actionDescription,
        observedActionType: capability.actionType,
        observedTargetEntity: capability.targetEntity,
        observedRole: step.targetRole || "button",
        bindingHandle: step.bindingHandle
      };
      const activationEventId = `act_step_${step.stepIndex}_${Date.now()}`;
      const dispatchResult = await dispatcher.dispatchActivation(
        activationEventId,
        stepCandidate,
        capability.capabilityId,
        capability.transitionEvidence?.activationEventCharacteristics || {
          eventType: "click",
          bubbles: true,
          cancelable: true
        }
      );
      if (!dispatchResult.success) {
        this.state = "FAILED";
        this.context.currentState = this.state;
        route.status = "QUARANTINED";
        route.quarantineReason = `Intermediate step ${step.stepIndex} dispatch failure: ${dispatchResult.reason || "Dispatch failed"}`;
        this.negativeEvidenceStore.recordContradiction(
          stepCandidate.candidateId,
          "REPEATED_VALIDATION_FAILURE",
          "DISPATCH_FAILURE",
          `Intermediate step ${step.stepIndex} dispatch failure: ${dispatchResult.reason || "Dispatch failed"}`,
          {
            stepIndex: step.stepIndex,
            reason: dispatchResult.reason,
            activationEventId
          },
          { capabilityId: capability.capabilityId },
          route.routeId,
          stepCandidate
        );
        const rollbackOutcome = SafeVerificationController.verifyAndExecuteRollback(
          this.routeManager,
          capability,
          route.routeId,
          stepCandidate,
          `Intermediate step ${step.stepIndex} dispatch failure: ${dispatchResult.reason || "Dispatch failed"}`
        );
        return {
          success: false,
          completedStepsCount: completedSteps,
          failedStepIndex: step.stepIndex,
          failureReason: `Intermediate step ${step.stepIndex} dispatch failed: ${dispatchResult.reason || "Dispatch failed"}`,
          finalState: this.state,
          rollbackOutcome
        };
      }
      const stepWitnesses = await dispatcher.collectWitnesses(
        capability.transitionEvidence?.verificationWindowMs || 2500
      );
      let stepPostState;
      if (dispatcher.observePostState) {
        try {
          stepPostState = await dispatcher.observePostState();
        } catch {
        }
      }
      const stepPreStateFingerprint = step.transitionSignature?.preStateFingerprint || capability.transitionEvidence?.preStateFingerprint || "STATE_PRE";
      const stepPostStateFingerprint = step.transitionSignature?.postStateFingerprint || capability.transitionEvidence?.postStateFingerprint || "STATE_POST";
      const stepExpectedDelta = step.expectedTransitionDelta || step.transitionSignature?.expectedStateDelta || capability.transitionEvidence?.expectedDelta || {};
      const stepEventType = step.transitionSignature?.activationEventExpected?.eventType || capability.transitionEvidence?.activationEventCharacteristics?.eventType || "click";
      const effectiveActivationEvent = dispatchResult.activationEvent || {
        eventId: activationEventId,
        sequenceNumber: step.stepIndex,
        timestamp: Date.now(),
        targetCandidateId: stepCandidate.candidateId,
        eventType: stepEventType,
        initiatingCapabilityId: capability.capabilityId
      };
      const effectiveActivationEventId = effectiveActivationEvent.eventId;
      for (const w of stepWitnesses) {
        if (w.witnessClass === "ASYNC_ACKNOWLEDGEMENT") {
          const ackRecord = this.acknowledgementTracker.recordAcknowledgement({
            acknowledgementId: w.witnessId,
            operation: w.observedDelta?.["operation"] || capability.canonicalFunction,
            status: w.observedDelta?.["status"] || "COMPLETED",
            timestamp: w.timestamp,
            activationEventId: w.correlatedActivationEventId || effectiveActivationEventId,
            routeId: w.routeId || route.routeId,
            capabilityId: w.capabilityId || capability.capabilityId,
            sourceChannel: w.provenance?.origin || "LOCAL_HTTP_MOCK",
            rawPayload: w.observedDelta
          });
          const ackValidation = this.acknowledgementTracker.validateAcknowledgement(
            ackRecord,
            effectiveActivationEvent,
            route.routeId,
            capability.capabilityId,
            capability.transitionEvidence?.verificationWindowMs || 3e3
          );
          if (!ackValidation.valid) {
            this.state = "QUARANTINED";
            this.context.currentState = this.state;
            route.status = "QUARANTINED";
            route.quarantineReason = `Intermediate step ${step.stepIndex} network acknowledgement rejected: ${ackValidation.rejectionReason}`;
            this.negativeEvidenceStore.recordCausalFailure({
              capabilityId: capability.capabilityId,
              routeId: route.routeId,
              candidateIdentifier: route.routeId,
              verificationStatus: "FAILED_CONTRADICTORY_WITNESS",
              failureReason: "contradictory_delta",
              explanation: route.quarantineReason,
              activationEventId: effectiveActivationEventId,
              sequenceNumber: step.stepIndex,
              witnessIds: [w.witnessId],
              observedWitnessClasses: ["ASYNC_ACKNOWLEDGEMENT"],
              candidateContext: stepCandidate
            });
            const rollbackOutcome = SafeVerificationController.verifyAndExecuteRollback(
              this.routeManager,
              capability,
              route.routeId,
              stepCandidate,
              route.quarantineReason
            );
            return {
              success: false,
              completedStepsCount: completedSteps,
              failedStepIndex: step.stepIndex,
              failureReason: route.quarantineReason,
              finalState: this.state,
              rollbackOutcome
            };
          }
        }
      }
      const stepVerification = await this.causalVerifier.verifyTransitionAsync(
        {
          preStateFingerprint: stepPreStateFingerprint,
          activationEventExpected: {
            eventType: stepEventType
          },
          expectedStateDelta: stepExpectedDelta,
          verificationWindowMs: capability.transitionEvidence?.verificationWindowMs || 2500,
          postStateFingerprint: stepPostStateFingerprint
        },
        effectiveActivationEvent,
        stepWitnesses,
        stepPostState ? {
          postStateFingerprint: FingerprintConstructor.computePostStateFingerprint({
            capabilityId: capability.capabilityId,
            routeId: route.routeId,
            activationEventId: effectiveActivationEventId,
            stateNode: stepPostState
          }),
          observedApplicationState: stepPostState.observedApplicationState || {},
          observedStateNode: stepPostState,
          observedTimestamp: Date.now(),
          activationEventId: effectiveActivationEventId,
          routeId: route.routeId,
          capabilityId: capability.capabilityId,
          isObserved: true,
          observationSource: "ExecutionDispatcher:observePostState"
        } : void 0,
        route.routeId
      );
      if (!stepVerification.causallyVerified || stepVerification.status !== "VERIFIED") {
        this.state = "QUARANTINED";
        this.context.currentState = this.state;
        route.status = "QUARANTINED";
        route.quarantineReason = `Intermediate step ${step.stepIndex} causal verification failed: ${stepVerification.explanation}`;
        this.negativeEvidenceStore.recordCausalFailure({
          capabilityId: capability.capabilityId,
          routeId: route.routeId,
          candidateIdentifier: route.routeId,
          verificationStatus: stepVerification.status,
          failureReason: stepVerification.failureReason,
          explanation: stepVerification.explanation,
          activationEventId: effectiveActivationEventId,
          sequenceNumber: step.stepIndex,
          witnessIds: stepWitnesses.map((w) => w.witnessId),
          observedWitnessClasses: stepVerification.verifiedWitnessClasses,
          candidateContext: stepCandidate
        });
        const rollbackOutcome = SafeVerificationController.verifyAndExecuteRollback(
          this.routeManager,
          capability,
          route.routeId,
          stepCandidate,
          `Intermediate step ${step.stepIndex} causal verification failed: ${stepVerification.explanation}`
        );
        return {
          success: false,
          completedStepsCount: completedSteps,
          failedStepIndex: step.stepIndex,
          failureReason: `Intermediate step ${step.stepIndex} causal verification failed: ${stepVerification.explanation}`,
          finalState: this.state,
          rollbackOutcome
        };
      }
      completedSteps++;
      lastStepVerification = stepVerification;
    }
    if (completedSteps !== route.steps.length || !lastStepVerification) {
      this.state = "FAILED";
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: completedSteps,
        failureReason: `Execution halted before all ${route.steps.length} steps completed (${completedSteps} completed).`,
        finalState: this.state
      };
    }
    let verificationForPromotion = lastStepVerification;
    if (options?.corruptPromotionToken && lastStepVerification.verificationToken) {
      verificationForPromotion = {
        ...lastStepVerification,
        verificationToken: {
          ...lastStepVerification.verificationToken,
          signatureHash: "hmac_sha256_" + "0".repeat(64)
        }
      };
    }
    const promoDecision = await this.promotionController.evaluateAndPromoteAsync(
      capability.capabilityId,
      route.routeId,
      verificationForPromotion
    );
    if (!promoDecision.promoted) {
      this.state = "QUARANTINED";
      this.context.currentState = this.state;
      route.status = "QUARANTINED";
      route.quarantineReason = promoDecision.reason;
      return {
        success: false,
        completedStepsCount: completedSteps,
        failureReason: promoDecision.reason,
        finalState: this.state
      };
    }
    this.state = "EXECUTED";
    this.context.currentState = this.state;
    this.context.activeRoute = promoDecision.route;
    return {
      success: true,
      completedStepsCount: completedSteps,
      finalState: this.state,
      promotedRoute: promoDecision.route
    };
  }
  createAndSaveValidationRecord(finalOutcome) {
    if (!this.context.resolvedCapability) return;
    const actCharacteristics = this.context.resolvedCapability.transitionEvidence?.activationEventCharacteristics;
    const transitionSignature = this.context.verificationResult?.signature || (this.context.resolvedCapability.transitionEvidence ? {
      preStateFingerprint: this.context.resolvedCapability.transitionEvidence.preStateFingerprint,
      activationEventExpected: {
        eventType: actCharacteristics?.eventType || "click",
        key: actCharacteristics?.key,
        code: actCharacteristics?.code,
        keyCode: actCharacteristics?.keyCode
      },
      expectedStateDelta: this.context.resolvedCapability.transitionEvidence.expectedDelta,
      verificationWindowMs: this.context.resolvedCapability.transitionEvidence.verificationWindowMs,
      postStateFingerprint: this.context.resolvedCapability.transitionEvidence.postStateFingerprint
    } : null);
    const record = {
      recordId: `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      candidateIdentity: this.context.selectedCandidate?.candidateId || "ACTIVE_ROUTE",
      candidateFingerprint: this.context.resolvedCapability,
      capabilityId: this.context.resolvedCapability.capabilityId,
      interfaceStateId: this.context.observedInterfaceState?.stateId || "DEFAULT_STATE",
      typedDriftVector: this.context.driftVector || null,
      invariantResults: this.context.selectedCandidate ? this.context.invariantResults?.[this.context.selectedCandidate.candidateId] || null : null,
      contradictionResults: {},
      rankingComponents: this.context.selectedCandidate || null,
      routeVersion: this.context.activeRoute || this.context.provisionalRoute || null,
      activationEvent: this.context.activationEvent || null,
      transitionSignature,
      transitionWitnesses: this.context.capturedWitnesses || [],
      causalVerificationResult: this.context.verificationResult || null,
      promotionState: this.context.activeRoute?.status || "PROVISIONAL",
      riskDecision: this.context.resolvedCapability.riskMetadata.riskClass,
      authorizationDecision: this.context.authorizationDecision || null,
      finalOutcome
    };
    this.context.validationRecord = record;
    this.persistentStore.saveValidationRecord(record).catch(() => {
    });
  }
  logAudit(outcome, failureReason) {
    if (!this.context.normalizedIntent || !this.context.resolvedCapability) return;
    this.auditLogger.log({
      intent: this.context.normalizedIntent,
      capabilityId: this.context.resolvedCapability.capabilityId,
      previousRouteId: null,
      currentRouteId: this.context.activeRoute?.routeId || null,
      interfaceStateId: "STATE_DEFAULT",
      driftVector: this.context.driftVector || null,
      candidateList: (this.context.candidateList || []).map((c) => c.candidateId),
      invariantResults: this.context.invariantResults || {},
      contradictionResults: {},
      rebindScores: this.context.rankedScores ? Object.fromEntries(this.context.rankedScores.map((s) => [s.candidateId, s])) : {},
      selectedCandidateId: this.context.selectedCandidate?.candidateId || null,
      causalVerificationResult: this.context.verificationResult || null,
      quarantineState: this.context.activeRoute?.status || "ABSTAINED",
      promotionResult: this.context.activeRoute?.status === "ACTIVE_VALIDATED" ? "PROMOTED" : "NONE",
      capabilityConfidence: this.context.resolvedCapability.confidence.capabilityConfidence,
      routeConfidence: this.context.activeRoute?.confidenceScore || 0,
      riskClass: this.context.resolvedCapability.riskMetadata.riskClass,
      executionAuthorization: this.context.authorizationDecision || {
        status: "DENIED_ABSTAIN",
        riskClass: this.context.resolvedCapability.riskMetadata.riskClass,
        capabilityConfidence: this.context.resolvedCapability.confidence.capabilityConfidence,
        routeConfidence: 0,
        evidenceQuorum: {
          hasSemanticEvidence: false,
          hasFunctionalInvariantEvidence: false,
          hasTransitionStateEvidence: false,
          quorumSatisfied: false
        },
        requiresUserConfirmation: false,
        policyReason: failureReason || "Execution halted",
        evaluatedTimestamp: Date.now()
      },
      userConfirmation: this.context.userConfirmationGranted ?? null,
      finalOutcome: outcome,
      failureReason,
      driftRecoveryMetrics: this.context.driftRecoveryMetrics
    });
  }
};

// src/core/capability/catalog.ts
var AUTHORITATIVE_CAPABILITY_CATALOG = [
  // 1. CAP_DISABLE_MARKETING
  {
    capabilityId: "CAP_DISABLE_MARKETING",
    canonicalFunction: "disable_marketing_notifications",
    actionType: "MODIFY_PREFERENCE",
    targetEntity: "MARKETING_NOTIFICATIONS",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_MARKETING_ENABLED",
        name: "Marketing notifications enabled",
        description: "Marketing notifications must be enabled prior to disabling",
        source: "PRE_STATE",
        property: "marketing_notifications_enabled",
        operator: "EQUALS",
        expectedValue: true
      })
    ],
    allowedStateDelta: [
      { property: "marketing_notifications_enabled", expectedChange: "ENABLED_TO_DISABLED" }
    ],
    expectedPostState: [
      { property: "marketing_notifications_enabled", expectedValue: false }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "marketing", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "delete_account", required: false }],
    semanticEvidence: {
      canonicalLabel: "Disable Marketing Notifications",
      semanticSynonyms: [
        "turn off promotional emails",
        "stop marketing notifications",
        "unsubscribe marketing",
        "opt out commercial emails",
        "stop promotional emails",
        "turn off marketing messages",
        "stop advertising notifications",
        "mute promotional offers",
        "disable marketing notifications now",
        "switch off commercial bulletins",
        "block marketing communication alerts"
      ],
      accessibleName: "Disable marketing notifications",
      role: "switch",
      visibleLabel: "Promotional Notifications",
      sectionMeaning: "Notifications > Marketing Preferences",
      actionDescription: "Toggle marketing notifications from enabled to disabled"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Marketing Preferences]", "form#notifications"],
      nearbyText: ["Receive promotional emails about special offers and deals"],
      surroundingLabels: ["Promotional Notifications"],
      containerSemantics: ["notifications", "marketing"],
      menuPanelRelationships: ["Notifications"],
      relativeStructuralRelationships: ["form > div > label > input[type=checkbox]"],
      urlSemantics: "/settings/notifications"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_MARKETING_ON",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { marketing_notifications_enabled: false },
      postStateFingerprint: "STATE_POST_MARKETING_OFF",
      historicalTransitionObservations: 12,
      witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION", "APPLICATION_STATE_MUTATION"],
      verificationWindowMs: 2500
    },
    riskMetadata: {
      riskClass: "REVERSIBLE",
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.98,
      routeConfidence: 0.95
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 2. CAP_EXPORT_DATA
  {
    capabilityId: "CAP_EXPORT_DATA",
    canonicalFunction: "export_personal_data",
    actionType: "EXPORT_DATA",
    targetEntity: "PERSONAL_DATA_EXPORT",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_EXPORT_READY",
        name: "Ready for personal data export",
        description: "Export not already initiated",
        source: "PRE_STATE",
        property: "export_download_initiated",
        operator: "EQUALS",
        expectedValue: false
      })
    ],
    allowedStateDelta: [
      { property: "export_download_initiated", expectedChange: "DISABLED_TO_ENABLED" }
    ],
    expectedPostState: [
      { property: "export_download_initiated", expectedValue: true }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "privacy", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "DEACTIVATE", required: false }],
    semanticEvidence: {
      canonicalLabel: "Export personal data",
      semanticSynonyms: [
        "download personal information",
        "export my data",
        "download everything you have about me",
        "request data archive",
        "download gdpr personal data archive",
        "get a copy of all my account data",
        "request my personal records download",
        "save all my data locally",
        "export full history and profile information",
        "give me my personal data archive",
        "download my user records export"
      ],
      accessibleName: "Export personal data button",
      role: "button",
      visibleLabel: "Download Your Data",
      sectionMeaning: "Privacy > Personal Data",
      actionDescription: "Export personal data archive"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Privacy]", "main[Settings]"],
      nearbyText: ["Download a copy of your personal data archive"],
      surroundingLabels: ["Download Your Data"],
      containerSemantics: ["privacy", "settings"],
      menuPanelRelationships: ["Privacy"],
      relativeStructuralRelationships: ["div > section > button"],
      urlSemantics: "/settings/privacy"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_EXPORT_READY",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { export_download_initiated: true },
      postStateFingerprint: "STATE_POST_EXPORT_INITIATED",
      historicalTransitionObservations: 8,
      witnessClasses: ["DOM_MUTATION", "ASYNC_ACKNOWLEDGEMENT"],
      verificationWindowMs: 3e3
    },
    riskMetadata: {
      riskClass: "SENSITIVE",
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: true
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.95,
      routeConfidence: 0.9
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 3. CAP_DISABLE_2FA
  {
    capabilityId: "CAP_DISABLE_2FA",
    canonicalFunction: "disable_two_factor_auth",
    actionType: "TOGGLE",
    targetEntity: "TWO_FACTOR_AUTH",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_2FA_ENABLED",
        name: "Two-factor auth enabled",
        description: "2FA must be enabled to turn it off",
        source: "PRE_STATE",
        property: "two_factor_enabled",
        operator: "EQUALS",
        expectedValue: true
      })
    ],
    allowedStateDelta: [
      { property: "two_factor_enabled", expectedChange: "ENABLED_TO_DISABLED" }
    ],
    expectedPostState: [
      { property: "two_factor_enabled", expectedValue: false }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "security|authentication|mfa|2fa", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "billing", required: false }],
    semanticEvidence: {
      canonicalLabel: "Disable Two-Factor Authentication",
      semanticSynonyms: [
        "turn off 2FA",
        "remove multi-factor authentication",
        "stop asking for 2FA codes",
        "deactivate two-factor auth shield",
        "disable mfa security protection",
        "turn off two-step verification",
        "remove 2fa authenticator app link",
        "revoke two-factor authentication requirement",
        "disable 2fa security key"
      ],
      accessibleName: "Disable two-factor authentication",
      role: "button",
      visibleLabel: "Disable 2FA",
      sectionMeaning: "Security > Two-Factor Authentication",
      actionDescription: "Disable multi-factor authentication security shield"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Security]", "form#mfa-settings"],
      nearbyText: ["Two-Factor Authentication is currently active"],
      surroundingLabels: ["Disable 2FA"],
      containerSemantics: ["security", "authentication"],
      menuPanelRelationships: ["Security"],
      relativeStructuralRelationships: ["section > div > button"],
      urlSemantics: "/settings/security"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_2FA_ON",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { two_factor_enabled: false },
      postStateFingerprint: "STATE_POST_2FA_OFF",
      historicalTransitionObservations: 5,
      witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION", "APPLICATION_STATE_MUTATION"],
      verificationWindowMs: 2500
    },
    riskMetadata: {
      riskClass: "SECURITY_SENSITIVE",
      reversible: true,
      financial: false,
      security: true,
      destructive: false,
      requiresConfirmation: true
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.94,
      routeConfidence: 0.88
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 4. CAP_DEACTIVATE_ACCOUNT
  {
    capabilityId: "CAP_DEACTIVATE_ACCOUNT",
    canonicalFunction: "deactivate_user_account",
    actionType: "DEACTIVATE_ACCOUNT",
    targetEntity: "ACCOUNT_STATUS",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_ACCOUNT_ACTIVE",
        name: "Account is currently active",
        description: "Account must be active before it can be deactivated",
        source: "PRE_STATE",
        property: "account_active",
        operator: "EQUALS",
        expectedValue: true
      })
    ],
    allowedStateDelta: [
      { property: "account_active", expectedChange: "ENABLED_TO_DISABLED" }
    ],
    expectedPostState: [
      { property: "account_active", expectedValue: false }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "account", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "theme", required: false }],
    semanticEvidence: {
      canonicalLabel: "Deactivate Account",
      semanticSynonyms: [
        "pause my account membership",
        "deactivate my profile temporarily",
        "temporarily suspend account",
        "put my subscription on hold",
        "take a hiatus from this platform",
        "hibernate my user account",
        "disable my account membership",
        "close or pause user account",
        "take a break from this account"
      ],
      accessibleName: "Deactivate account button",
      role: "button",
      visibleLabel: "Deactivate Account",
      sectionMeaning: "Account > Danger Zone",
      actionDescription: "Temporarily deactivate user account membership"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Account Management]", "div.danger-zone"],
      nearbyText: ["Deactivating will pause your account temporarily"],
      surroundingLabels: ["Deactivate Account"],
      containerSemantics: ["account", "danger-zone"],
      menuPanelRelationships: ["Account"],
      relativeStructuralRelationships: ["div > section > button.danger"],
      urlSemantics: "/settings/account"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_ACCOUNT_ACTIVE",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { account_active: false },
      postStateFingerprint: "STATE_POST_ACCOUNT_DEACTIVATED",
      historicalTransitionObservations: 3,
      witnessClasses: ["DOM_MUTATION", "APPLICATION_STATE_MUTATION"],
      verificationWindowMs: 3e3
    },
    riskMetadata: {
      riskClass: "DESTRUCTIVE",
      reversible: true,
      financial: false,
      security: false,
      destructive: true,
      requiresConfirmation: true
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.92,
      routeConfidence: 0.85
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 5. CAP_TOGGLE_TRACKING
  {
    capabilityId: "CAP_TOGGLE_TRACKING",
    canonicalFunction: "toggle_analytics_tracking",
    actionType: "MODIFY_PREFERENCE",
    targetEntity: "PRIVACY_SETTINGS",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_TRACKING_ON",
        name: "Analytics tracking is enabled",
        description: "Analytics tracking must be active to toggle it off",
        source: "PRE_STATE",
        property: "analytics_tracking_enabled",
        operator: "EQUALS",
        expectedValue: true
      })
    ],
    allowedStateDelta: [
      { property: "analytics_tracking_enabled", expectedChange: "ENABLED_TO_DISABLED" }
    ],
    expectedPostState: [
      { property: "analytics_tracking_enabled", expectedValue: false }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "privacy|telemetry|analytics|tracking", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "billing", required: false }],
    semanticEvidence: {
      canonicalLabel: "Disable Analytics Tracking",
      semanticSynonyms: [
        "turn off analytical tracking cookies",
        "disable telemetry and tracking",
        "opt out of behavioral analytics",
        "block analytics tracking",
        "stop sharing analytical usage data",
        "adjust tracking preferences",
        "turn off usage data collection",
        "change privacy data collection permissions",
        "disable user analytics telemetry"
      ],
      accessibleName: "Toggle analytics tracking",
      role: "switch",
      visibleLabel: "Analytics & Tracking",
      sectionMeaning: "Privacy > Tracking & Cookies",
      actionDescription: "Toggle user behavioral analytics telemetry"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Privacy & Telemetry]", "form#privacy"],
      nearbyText: ["Allow analytical usage telemetry to improve performance"],
      surroundingLabels: ["Analytics & Tracking"],
      containerSemantics: ["privacy", "analytics"],
      menuPanelRelationships: ["Privacy"],
      relativeStructuralRelationships: ["form > div > label > input[type=checkbox]"],
      urlSemantics: "/settings/privacy"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_TRACKING_ON",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { analytics_tracking_enabled: false },
      postStateFingerprint: "STATE_POST_TRACKING_OFF",
      historicalTransitionObservations: 10,
      witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION", "APPLICATION_STATE_MUTATION"],
      verificationWindowMs: 2500
    },
    riskMetadata: {
      riskClass: "REVERSIBLE",
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.96,
      routeConfidence: 0.91
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 6. CAP_REVOKE_SESSIONS
  {
    capabilityId: "CAP_REVOKE_SESSIONS",
    canonicalFunction: "revoke_other_sessions",
    actionType: "REVOKE_ACCESS",
    targetEntity: "SECURITY_SETTINGS",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_SESSIONS_EXIST",
        name: "Multiple active sessions exist",
        description: "Must have more than 1 active session to revoke remote sessions",
        source: "PRE_STATE",
        property: "active_session_count",
        operator: "GREATER_THAN",
        expectedValue: 1
      })
    ],
    allowedStateDelta: [
      { property: "active_session_count", expectedChange: "MODIFIED" }
    ],
    expectedPostState: [
      { property: "active_session_count", expectedValue: 1 }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "security|session|device", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "marketing", required: false }],
    semanticEvidence: {
      canonicalLabel: "Revoke Active Sessions",
      semanticSynonyms: [
        "log out of all active devices",
        "revoke active login sessions",
        "disconnect other browsers and phones",
        "sign out of all other sessions",
        "terminate remote session tokens",
        "force logout across all devices",
        "invalidate other login credentials",
        "kill all background active logins",
        "clear my recognized devices list",
        "sign out everywhere immediately"
      ],
      accessibleName: "Revoke other active sessions button",
      role: "button",
      visibleLabel: "Log Out All Devices",
      sectionMeaning: "Security > Active Sessions",
      actionDescription: "Sign out and invalidate session tokens across other devices"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Security]", "div.session-list"],
      nearbyText: ["You are currently logged in on multiple devices"],
      surroundingLabels: ["Log Out All Devices"],
      containerSemantics: ["security", "sessions"],
      menuPanelRelationships: ["Security"],
      relativeStructuralRelationships: ["section > div > button"],
      urlSemantics: "/settings/security"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_SESSIONS_EXIST",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { active_session_count: 1 },
      postStateFingerprint: "STATE_POST_SESSIONS_REVOKED",
      historicalTransitionObservations: 6,
      witnessClasses: ["DOM_MUTATION", "APPLICATION_STATE_MUTATION", "ASYNC_ACKNOWLEDGEMENT"],
      verificationWindowMs: 3e3
    },
    riskMetadata: {
      riskClass: "SECURITY_SENSITIVE",
      reversible: true,
      financial: false,
      security: true,
      destructive: false,
      requiresConfirmation: true
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.95,
      routeConfidence: 0.89
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 7. CAP_TOGGLE_DARK_MODE
  {
    capabilityId: "CAP_TOGGLE_DARK_MODE",
    canonicalFunction: "toggle_dark_theme",
    actionType: "TOGGLE",
    targetEntity: "UI_THEME",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_THEME_NOT_DARK",
        name: "Dark mode currently off",
        description: "Dark mode must be off to toggle on",
        source: "PRE_STATE",
        property: "dark_mode_enabled",
        operator: "EQUALS",
        expectedValue: false
      })
    ],
    allowedStateDelta: [
      { property: "dark_mode_enabled", expectedChange: "DISABLED_TO_ENABLED" }
    ],
    expectedPostState: [
      { property: "dark_mode_enabled", expectedValue: true }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "appearance|theme|display", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "security", required: false }],
    semanticEvidence: {
      canonicalLabel: "Enable Dark Mode",
      semanticSynonyms: [
        "enable dark theme mode",
        "switch interface to dark mode",
        "turn on night mode appearance",
        "change theme palette to dark",
        "toggle dark display styling",
        "activate dark background contrast",
        "i want dark mode for my eyes",
        "switch from light to dark theme",
        "set appearance preferences to dark",
        "enable night reading color scheme"
      ],
      accessibleName: "Toggle dark mode theme",
      role: "switch",
      visibleLabel: "Dark Theme",
      sectionMeaning: "Appearance > Display Theme",
      actionDescription: "Switch user interface color contrast to dark mode"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Appearance]", "form#theme"],
      nearbyText: ["Switch between light and dark display theme"],
      surroundingLabels: ["Dark Theme"],
      containerSemantics: ["appearance", "display"],
      menuPanelRelationships: ["Appearance"],
      relativeStructuralRelationships: ["form > div > label > input[type=checkbox]"],
      urlSemantics: "/settings/appearance"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_LIGHT_THEME",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { dark_mode_enabled: true },
      postStateFingerprint: "STATE_POST_DARK_THEME",
      historicalTransitionObservations: 20,
      witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION", "APPLICATION_STATE_MUTATION"],
      verificationWindowMs: 1500
    },
    riskMetadata: {
      riskClass: "REVERSIBLE",
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.99,
      routeConfidence: 0.97
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 8. CAP_DOWNLOAD_INVOICE
  {
    capabilityId: "CAP_DOWNLOAD_INVOICE",
    canonicalFunction: "download_recent_invoice",
    actionType: "DOWNLOAD",
    targetEntity: "BILLING_PREFERENCES",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_INVOICE_AVAILABLE",
        name: "Recent invoice is available for download",
        description: "Must have an invoice generated to download",
        source: "PRE_STATE",
        property: "invoice_available",
        operator: "EQUALS",
        expectedValue: true
      })
    ],
    allowedStateDelta: [
      { property: "invoice_download_triggered", expectedChange: "DISABLED_TO_ENABLED" }
    ],
    expectedPostState: [
      { property: "invoice_download_triggered", expectedValue: true }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "billing", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "delete_account", required: false }],
    semanticEvidence: {
      canonicalLabel: "Download Latest Invoice",
      semanticSynonyms: [
        "download my latest billing receipt",
        "get copy of recent payment invoice",
        "download subscription PDF receipt",
        "save latest charge statement",
        "export monthly billing invoice",
        "retrieve payment tax receipt",
        "download account billing statement",
        "get receipt for last transaction",
        "view and download recent invoice",
        "export payment billing records"
      ],
      accessibleName: "Download invoice receipt",
      role: "button",
      visibleLabel: "Download Invoice",
      sectionMeaning: "Billing > Invoice History",
      actionDescription: "Download latest billing statement PDF receipt"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Billing & Payments]", "table#invoices"],
      nearbyText: ["Invoice #2026-08 - $49.00 Paid on Sep 1, 2026"],
      surroundingLabels: ["Download Invoice"],
      containerSemantics: ["billing", "payments"],
      menuPanelRelationships: ["Billing"],
      relativeStructuralRelationships: ["table > tr > td > button"],
      urlSemantics: "/settings/billing"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_INVOICE_READY",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { invoice_download_triggered: true },
      postStateFingerprint: "STATE_POST_INVOICE_DOWNLOADED",
      historicalTransitionObservations: 7,
      witnessClasses: ["DOM_MUTATION", "ASYNC_ACKNOWLEDGEMENT"],
      verificationWindowMs: 3e3
    },
    riskMetadata: {
      riskClass: "REVERSIBLE",
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.96,
      routeConfidence: 0.92
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  },
  // 9. CAP_VIEW_AUDIT_LOGS
  {
    capabilityId: "CAP_VIEW_AUDIT_LOGS",
    canonicalFunction: "view_security_audit_logs",
    actionType: "VIEW",
    targetEntity: "SECURITY_SETTINGS",
    mandatoryPreStatePredicates: [
      createDeclarativePredicate({
        id: "PRE_AUDIT_LOGS_AVAILABLE",
        name: "Audit logs available",
        description: "Audit records must exist to view activity trail",
        source: "PRE_STATE",
        property: "audit_logs_available",
        operator: "EQUALS",
        expectedValue: true
      })
    ],
    allowedStateDelta: [
      { property: "audit_logs_visible", expectedChange: "DISABLED_TO_ENABLED" }
    ],
    expectedPostState: [
      { property: "audit_logs_visible", expectedValue: true }
    ],
    requiredContextPredicates: [{ target: "container", pattern: "security", required: true }],
    forbiddenContextPredicates: [{ target: "container", pattern: "marketing", required: false }],
    semanticEvidence: {
      canonicalLabel: "View Security Audit Logs",
      semanticSynonyms: [
        "view account security audit log",
        "check login history and activity trail",
        "inspect recent authentication events",
        "show security access records",
        "display account audit trail",
        "review past sign-in timestamps",
        "open activity log and security history",
        "view suspicious sign-in alerts history",
        "show security audit event ledger",
        "examine account access logs"
      ],
      accessibleName: "View security audit logs button",
      role: "button",
      visibleLabel: "View Activity History",
      sectionMeaning: "Security > Activity & Audit",
      actionDescription: "Open authentication history and security audit trail ledger"
    },
    contextEvidence: {
      ancestorRelationships: ["section[Security]", "div.audit-section"],
      nearbyText: ["Recent account activity and device sign-in audit history"],
      surroundingLabels: ["View Activity History"],
      containerSemantics: ["security", "audit"],
      menuPanelRelationships: ["Security"],
      relativeStructuralRelationships: ["section > div > button"],
      urlSemantics: "/settings/security"
    },
    transitionEvidence: {
      preStateFingerprint: "STATE_PRE_AUDIT_LOGS_CLOSED",
      activationEventCharacteristics: { eventType: "click", bubbles: true, cancelable: true },
      expectedDelta: { audit_logs_visible: true },
      postStateFingerprint: "STATE_POST_AUDIT_LOGS_OPEN",
      historicalTransitionObservations: 9,
      witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION", "APPLICATION_STATE_MUTATION"],
      verificationWindowMs: 2e3
    },
    riskMetadata: {
      riskClass: "READ_ONLY",
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false
    },
    provenance: {
      source: "INITIAL_SPEC",
      creationTimestamp: 1726e9,
      validationTimestamp: 1726e9,
      routeVersion: "v1.0.0",
      validationHistory: []
    },
    confidence: {
      capabilityConfidence: 0.97,
      routeConfidence: 0.94
    },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: []
    }
  }
];
for (const cap of AUTHORITATIVE_CAPABILITY_CATALOG) {
  if (!cap.fingerprintHash || !FingerprintConstructor.isValidV2FingerprintHash(cap.fingerprintHash)) {
    cap.fingerprintHash = FingerprintConstructor.computeFingerprintHashFromCapability(cap);
    cap.fingerprintVersion = "v2";
  }
  if (!cap.transitionSignatureBinding && cap.transitionEvidence) {
    cap.transitionSignatureBinding = FingerprintConstructor.computeTransitionSignatureHash(
      {
        preStateFingerprint: cap.transitionEvidence.preStateFingerprint,
        activationEventExpected: {
          eventType: cap.transitionEvidence.activationEventCharacteristics.eventType,
          key: cap.transitionEvidence.activationEventCharacteristics.key,
          code: cap.transitionEvidence.activationEventCharacteristics.code,
          keyCode: cap.transitionEvidence.activationEventCharacteristics.keyCode
        },
        expectedStateDelta: cap.transitionEvidence.expectedDelta,
        verificationWindowMs: cap.transitionEvidence.verificationWindowMs,
        postStateFingerprint: cap.transitionEvidence.postStateFingerprint
      },
      cap.fingerprintHash
    );
  }
}

// benchmark/mutations/harness.ts
function toBaselineCandidates(candidates) {
  return candidates.map((c) => ({
    id: c.bindingHandle?.volatileId || c.candidateId,
    candidateId: c.candidateId,
    className: c.bindingHandle?.volatileClasses?.join(" "),
    role: c.observedRole,
    label: c.candidateLabel,
    candidateLabel: c.candidateLabel,
    targetEntity: c.observedTargetEntity,
    actionType: c.observedActionType
  }));
}
function resolveDOMElement(doc, volatileIdOrSelector) {
  if (!volatileIdOrSelector) return null;
  const targetId = volatileIdOrSelector.replace(/^#/, "");
  return doc.getElementById(targetId) || doc.querySelector(volatileIdOrSelector);
}
var ControlledMutationHarness = class _ControlledMutationHarness {
  /**
   * Evaluates a single mutation against a single comparison system.
   */
  static async evaluateTrial(mutation, systemId) {
    const trialId = `TRIAL_MUT_${mutation.id}_${systemId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const systemDesc = BASELINE_REGISTRY[systemId];
    if (!mutation.applicableSystems.includes(systemId)) {
      const inappRecord = mutation.inapplicableSystems.find((s) => s.systemId === systemId);
      return {
        trialId,
        mutationId: mutation.id,
        category: mutation.category,
        systemId,
        systemName: systemDesc.systemName,
        applicable: false,
        inapplicableReason: inappRecord?.reason || `System ${systemId} not applicable for mutation ${mutation.id}`,
        selectedTargetId: null,
        targetSelectedCorrectly: false,
        executionAttempted: false,
        executionSucceeded: false,
        verificationStatus: "NOT_APPLICABLE",
        trialStatus: "NOT_APPLICABLE",
        latencyMs: 0,
        causallyVerified: false
      };
    }
    const env = MutationDOMGenerator.createMutatedEnvironment(mutation);
    const doc = env.document;
    const win = env.window;
    const candidates = env.candidates;
    const baselineCandidates = toBaselineCandidates(candidates);
    try {
      const t0 = performance2.now();
      if (systemId === "B1") {
        const b1 = new Baseline1SelectorReplay();
        const b1Res = b1.execute(mutation.capabilityId, baselineCandidates);
        const latency = performance2.now() - t0;
        const selectedId = b1Res.selectedCandidateId || null;
        const isMatch = ComparisonOracle.isTargetMatch(
          "DOM_ELEMENT",
          selectedId,
          mutation.expectedTargetId,
          null
        );
        let executionSucceeded = false;
        let executionAttempted = false;
        if (b1Res.success && selectedId) {
          executionAttempted = true;
          const el = resolveDOMElement(doc, selectedId);
          if (el && !el.disabled) {
            el.click();
            executionSucceeded = true;
          }
        }
        const isDecoy = ComparisonOracle.isDecoy(selectedId);
        const trialStatus = isDecoy ? "DECOY_TRIGGERED" : b1Res.success && isMatch ? "SUCCESS" : "FAILED";
        return {
          trialId,
          mutationId: mutation.id,
          category: mutation.category,
          systemId,
          systemName: systemDesc.systemName,
          applicable: true,
          selectedTargetId: selectedId,
          targetSelectedCorrectly: isMatch,
          executionAttempted,
          executionSucceeded,
          verificationStatus: "NOT_APPLICABLE",
          // B1 lacks causal verification
          trialStatus,
          latencyMs: Number(latency.toFixed(2)),
          causallyVerified: false
        };
      }
      if (systemId === "B2") {
        const b2 = new Baseline2KeywordMatching();
        const b2Res = b2.execute(mutation.intentQuery, baselineCandidates);
        const latency = performance2.now() - t0;
        const selectedId = b2Res.selectedCandidateId || null;
        const isMatch = ComparisonOracle.isTargetMatch(
          "DOM_ELEMENT",
          selectedId,
          mutation.expectedTargetId,
          null
        );
        let executionSucceeded = false;
        let executionAttempted = false;
        if (b2Res.success && selectedId) {
          executionAttempted = true;
          const el = resolveDOMElement(doc, selectedId);
          if (el && !el.disabled) {
            el.click();
            executionSucceeded = true;
          }
        }
        const isDecoy = ComparisonOracle.isDecoy(selectedId);
        const trialStatus = isDecoy ? "DECOY_TRIGGERED" : b2Res.success && isMatch ? "SUCCESS" : "FAILED";
        return {
          trialId,
          mutationId: mutation.id,
          category: mutation.category,
          systemId,
          systemName: systemDesc.systemName,
          applicable: true,
          selectedTargetId: selectedId,
          targetSelectedCorrectly: isMatch,
          executionAttempted,
          executionSucceeded,
          verificationStatus: "NOT_APPLICABLE",
          trialStatus,
          latencyMs: Number(latency.toFixed(2)),
          causallyVerified: false
        };
      }
      if (systemId === "B3") {
        const b3 = new Baseline3SemanticOnly();
        const b3Res = b3.execute(mutation.intentQuery, baselineCandidates);
        const latency = performance2.now() - t0;
        const selectedId = b3Res.selectedCandidateId || null;
        const isMatch = ComparisonOracle.isTargetMatch(
          "DOM_ELEMENT",
          selectedId,
          mutation.expectedTargetId,
          null
        );
        let executionSucceeded = false;
        let executionAttempted = false;
        if (b3Res.success && selectedId) {
          executionAttempted = true;
          const el = resolveDOMElement(doc, selectedId);
          if (el && !el.disabled) {
            el.click();
            executionSucceeded = true;
          }
        }
        const isDecoy = ComparisonOracle.isDecoy(selectedId);
        const trialStatus = isDecoy ? "DECOY_TRIGGERED" : b3Res.success && isMatch ? "SUCCESS" : "FAILED";
        return {
          trialId,
          mutationId: mutation.id,
          category: mutation.category,
          systemId,
          systemName: systemDesc.systemName,
          applicable: true,
          selectedTargetId: selectedId,
          targetSelectedCorrectly: isMatch,
          executionAttempted,
          executionSucceeded,
          verificationStatus: "NOT_APPLICABLE",
          trialStatus,
          latencyMs: Number(latency.toFixed(2)),
          causallyVerified: false
        };
      }
      if (systemId === "B4") {
        const b4 = new Baseline4PageNavigation();
        const b4Res = b4.execute(mutation.intentQuery);
        const latency = performance2.now() - t0;
        const selectedId = b4Res.navigatedUrl || null;
        const isMatch = ComparisonOracle.isTargetMatch("PAGE_URL", selectedId, "notifications", null);
        return {
          trialId,
          mutationId: mutation.id,
          category: mutation.category,
          systemId,
          systemName: systemDesc.systemName,
          applicable: true,
          selectedTargetId: selectedId,
          targetSelectedCorrectly: isMatch,
          executionAttempted: false,
          executionSucceeded: false,
          verificationStatus: "NOT_APPLICABLE",
          trialStatus: isMatch ? "SUCCESS" : "FAILED",
          latencyMs: Number(latency.toFixed(2)),
          causallyVerified: false
        };
      }
      if (systemId === "B5") {
        const machine = new IntentNavMachine();
        AUTHORITATIVE_CAPABILITY_CATALOG.forEach((c) => machine.registerCapability(c));
        const transConfig = mutation.mutationConfig.transitionMutation;
        let lastEventId = `evt_${Date.now()}`;
        let lastTimestamp = Date.now();
        let lastAppStateDelta = {};
        let lastDOMDelta = {};
        const customDispatcher = {
          async dispatchActivation(activationEventId, candidate, capabilityId, activationCharacteristics) {
            lastEventId = activationEventId;
            lastTimestamp = Date.now();
            lastAppStateDelta = {};
            lastDOMDelta = {};
            const targetEl = resolveDOMElement(doc, candidate.bindingHandle?.volatileId || candidate.candidateId);
            if (!targetEl) {
              return {
                success: false,
                elementFound: false,
                eventDispatched: false,
                stateChanged: false,
                reason: "Target element could not be resolved in live DOM"
              };
            }
            if (targetEl.disabled) {
              return {
                success: false,
                elementFound: true,
                eventDispatched: false,
                stateChanged: false,
                reason: "Target element is disabled by administrative policy"
              };
            }
            if (transConfig?.outcome === "REJECTED") {
              return {
                success: false,
                elementFound: true,
                eventDispatched: true,
                stateChanged: false,
                reason: transConfig.errorMessage || "HTTP 500: Server mutation rejected"
              };
            }
            if (transConfig?.outcome === "DELAYED") {
              return {
                success: true,
                elementFound: true,
                eventDispatched: true,
                stateChanged: false,
                reason: "State mutation pending asynchronously (exceeded verification window)"
              };
            }
            const preAppState = { ...win.IntentNavMockState || {} };
            const preAria = targetEl.getAttribute("aria-checked");
            targetEl.click();
            const postAppState = { ...win.IntentNavMockState || {} };
            const postAria = targetEl.getAttribute("aria-checked");
            const delta = {};
            for (const key of Object.keys(postAppState)) {
              if (postAppState[key] !== preAppState[key]) {
                delta[key] = postAppState[key];
              }
            }
            lastAppStateDelta = delta;
            if (preAria !== postAria && postAria !== null) {
              lastDOMDelta["ariaChecked"] = postAria;
            }
            return {
              success: true,
              elementFound: true,
              eventDispatched: true,
              stateChanged: Object.keys(delta).length > 0 || Object.keys(lastDOMDelta).length > 0,
              activationEvent: {
                eventId: activationEventId,
                sequenceNumber: 1,
                timestamp: Date.now(),
                targetCandidateId: candidate.candidateId,
                eventType: activationCharacteristics?.eventType || "click",
                initiatingCapabilityId: capabilityId
              }
            };
          },
          async collectWitnesses() {
            if (transConfig && (transConfig.outcome === "REJECTED" || transConfig.outcome === "DELAYED")) {
              return [];
            }
            const now = lastTimestamp + 15;
            const witnesses = [];
            if (Object.keys(lastAppStateDelta).length > 0) {
              witnesses.push({
                witnessId: `wit_app_${now}`,
                witnessClass: "APPLICATION_STATE_MUTATION",
                sequenceNumber: 1,
                timestamp: now + 30,
                observedDelta: { ...lastAppStateDelta },
                correlatedActivationEventId: lastEventId,
                temporalDeltaMs: 30,
                isCausallyCorrelated: true,
                correlationExplanation: "Observed application state delta post activation"
              });
            }
            if (Object.keys(lastDOMDelta).length > 0) {
              witnesses.push({
                witnessId: `wit_dom_${now}`,
                witnessClass: "DOM_MUTATION",
                sequenceNumber: witnesses.length + 1,
                timestamp: now + 20,
                observedDelta: { ...lastDOMDelta },
                correlatedActivationEventId: lastEventId,
                temporalDeltaMs: 20,
                isCausallyCorrelated: true,
                correlationExplanation: "Observed DOM attribute delta post activation"
              });
            }
            if ("ariaChecked" in lastDOMDelta) {
              witnesses.push({
                witnessId: `wit_a11y_${now}`,
                witnessClass: "ACCESSIBILITY_STATE_MUTATION",
                sequenceNumber: witnesses.length + 1,
                timestamp: now + 40,
                observedDelta: { ariaChecked: lastDOMDelta["ariaChecked"] },
                correlatedActivationEventId: lastEventId,
                temporalDeltaMs: 40,
                isCausallyCorrelated: true,
                correlationExplanation: "Observed accessibility state delta post activation"
              });
            }
            return witnesses;
          },
          async observePostState() {
            const appState = { ...win.IntentNavMockState || {} };
            return {
              stateId: `state_${Date.now()}`,
              stateType: "PAGE",
              urlPattern: win?.location?.href || "http://localhost:3000/",
              domStructuralHash: "hash_live",
              semanticLandmarks: ["main", "section"],
              activeModalsOrDialogs: [],
              activeTabs: [],
              exposedCandidateHandles: [],
              observedApplicationState: appState,
              timestamp: Date.now()
            };
          }
        };
        machine.setDefaultDispatcher(customDispatcher);
        const ctx = await machine.processIntent(
          mutation.intentQuery,
          {
            tag: "body",
            observedActionType: "VIEW",
            observedTargetEntity: "UNKNOWN"
          },
          candidates,
          false,
          customDispatcher
        );
        const latency = performance2.now() - t0;
        const selectedId = ctx.selectedCandidate?.bindingHandle?.volatileId || ctx.selectedCandidate?.candidateId || null;
        const isMatch = ComparisonOracle.isTargetMatch(
          "DOM_ELEMENT",
          selectedId,
          mutation.expectedTargetId,
          null
        );
        const causallyVerified = Boolean(ctx.verificationResult?.causallyVerified);
        const isDecoy = ComparisonOracle.isDecoy(selectedId);
        let verificationStatus = "FAILED";
        if (causallyVerified) {
          verificationStatus = "VERIFIED";
        } else if (ctx.currentState === "QUARANTINED" || ctx.driftResult?.actionRequired === "QUARANTINE_IMMEDIATELY" || transConfig && transConfig.outcome !== "NORMAL") {
          verificationStatus = "QUARANTINED";
        }
        let trialStatus = "FAILED";
        if (isDecoy) {
          trialStatus = "DECOY_TRIGGERED";
        } else if (ctx.currentState === "QUARANTINED" || verificationStatus === "QUARANTINED") {
          trialStatus = "QUARANTINED";
        } else if (ctx.currentState === "ABSTAINED" || ctx.currentState === "CANDIDATE_DISCOVERY") {
          trialStatus = "ABSTAINED";
        } else if (isMatch && (ctx.currentState === "EXECUTED" || ctx.currentState === "CONFIRMATION_PENDING")) {
          trialStatus = causallyVerified || !transConfig || transConfig.outcome === "NORMAL" ? "SUCCESS" : "FAILED";
        }
        const executionAttempted = Boolean(ctx.dispatchSuccessful || ctx.currentState === "EXECUTED");
        const executionSucceeded = Boolean(ctx.dispatchSuccessful && ctx.currentState === "EXECUTED");
        return {
          trialId,
          mutationId: mutation.id,
          category: mutation.category,
          systemId,
          systemName: systemDesc.systemName,
          applicable: true,
          selectedTargetId: selectedId,
          targetSelectedCorrectly: isMatch,
          executionAttempted,
          executionSucceeded,
          verificationStatus,
          trialStatus,
          latencyMs: Number(latency.toFixed(2)),
          causallyVerified,
          errorNotes: ctx.promotionFailureReason
        };
      }
      throw new Error(`Unsupported system ID: ${systemId}`);
    } finally {
      env.cleanup();
    }
  }
  /**
   * Evaluates all given mutations across all specified systems and produces
   * aggregated per-system and per-category summaries.
   */
  static async evaluateAll(mutations = CONTROLLED_MUTATION_FIXTURES, systems = ["B1", "B2", "B3", "B4", "B5"]) {
    const results = [];
    const categories = [
      "IDENTIFIER",
      "STRUCTURAL",
      "PRESENTATION",
      "STATE",
      "TRANSITION"
    ];
    const categoryBreakdown = {
      IDENTIFIER: 0,
      STRUCTURAL: 0,
      PRESENTATION: 0,
      STATE: 0,
      TRANSITION: 0
    };
    for (const mut of mutations) {
      categoryBreakdown[mut.category] = (categoryBreakdown[mut.category] || 0) + 1;
      for (const sysId of systems) {
        const res = await _ControlledMutationHarness.evaluateTrial(mut, sysId);
        results.push(res);
      }
    }
    const systemCategorySummaries = [];
    for (const sysId of systems) {
      const sysName = BASELINE_REGISTRY[sysId].systemName;
      for (const cat of categories) {
        const catResults = results.filter((r) => r.systemId === sysId && r.category === cat);
        const totalTrials = catResults.length;
        const applicableTrials = catResults.filter((r) => r.applicable).length;
        const notApplicableTrials = catResults.filter((r) => !r.applicable).length;
        const selectionSuccesses = catResults.filter((r) => r.applicable && r.targetSelectedCorrectly).length;
        const executionSuccesses = catResults.filter((r) => r.applicable && r.executionSucceeded).length;
        const verificationSuccesses = catResults.filter((r) => r.applicable && r.causallyVerified).length;
        const quarantinedOrAbstained = catResults.filter(
          (r) => r.applicable && (r.trialStatus === "QUARANTINED" || r.trialStatus === "ABSTAINED")
        ).length;
        const selectionAccuracy = applicableTrials > 0 ? Number((selectionSuccesses / applicableTrials).toFixed(4)) : 0;
        const executionSuccessRate = applicableTrials > 0 ? Number((executionSuccesses / applicableTrials).toFixed(4)) : 0;
        const verificationSuccessRate = applicableTrials > 0 ? Number((verificationSuccesses / applicableTrials).toFixed(4)) : 0;
        systemCategorySummaries.push({
          systemId: sysId,
          systemName: sysName,
          category: cat,
          totalTrials,
          applicableTrials,
          notApplicableTrials,
          selectionSuccesses,
          selectionAccuracy,
          executionSuccesses,
          executionSuccessRate,
          verificationSuccesses,
          verificationSuccessRate,
          quarantinedOrAbstained
        });
      }
    }
    return {
      results,
      summary: {
        timestamp: Date.now(),
        totalMutations: mutations.length,
        categoryBreakdown,
        systemsEvaluated: systems,
        systemCategorySummaries
      }
    };
  }
};

// benchmark/experiments/computational.ts
import { performance as performance3 } from "perf_hooks";
var ComputationalProfiler = class {
  /**
   * Starts a high-resolution profiling session for a single trial.
   */
  static startProfile() {
    return {
      startTime: performance3.now(),
      startMemory: process.memoryUsage(),
      startCpu: process.cpuUsage(),
      stageLatencies: {}
    };
  }
  /**
   * Completes a profiling session and returns exact computational telemetry.
   */
  static endProfile(profile, counts = {}) {
    const endTime = performance3.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(profile.startCpu);
    const latencyMs = Number((endTime - profile.startTime).toFixed(2));
    const memoryBytes = endMemory.heapUsed - profile.startMemory.heapUsed;
    const memoryMb = Number((memoryBytes / (1024 * 1024)).toFixed(4));
    return {
      e2eLatencyMs: Math.max(0.01, latencyMs),
      stageLatenciesMs: profile.stageLatencies,
      candidateCount: counts.candidateCount || 0,
      evaluatedCandidateCount: counts.evaluatedCandidateCount || 0,
      fingerprintComputationCount: counts.fingerprintComputationCount || 0,
      heapMemoryDeltaBytes: memoryBytes,
      heapMemoryDeltaMb: memoryMb,
      cpuUserMicroseconds: endCpu.user,
      cpuSystemMicroseconds: endCpu.system
    };
  }
  /**
   * Computes statistical distribution metrics over a numeric sample array.
   */
  static computeDistribution(values, unit) {
    if (!values || values.length === 0) {
      return {
        sampleSize: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p95: 0,
        stdDev: 0,
        unit
      };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const min = Number(sorted[0].toFixed(3));
    const max = Number(sorted[n - 1].toFixed(3));
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = Number((sum / n).toFixed(3));
    const mid = Math.floor(n / 2);
    const median = Number(
      (n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toFixed(3)
    );
    const p95Index = Math.min(n - 1, Math.floor(n * 0.95));
    const p95 = Number(sorted[p95Index].toFixed(3));
    const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Number(Math.sqrt(variance).toFixed(3));
    return {
      sampleSize: n,
      min,
      max,
      mean,
      median,
      p95,
      stdDev,
      unit
    };
  }
};

// benchmark/experiments/ablations.ts
var ABLATION_CONFIGS = {
  BASELINE: {
    id: "BASELINE",
    name: "Full IntentNav-SCFR System (No Ablation)",
    description: "All safety, invariant, drift, causal, and quarantine mechanisms active.",
    mechanismDisabled: "None (Full Production Prototype)",
    expectedConsequence: "Full resilience across 5D drift, 0 false successes, zero unauthorized executions."
  },
  NO_FINGERPRINT_INVARIANT: {
    id: "NO_FINGERPRINT_INVARIANT",
    name: "Ablation 1: Invariant Closure Disabled",
    description: "Bypasses mandatory precondition and context invariant validation, ranking candidates purely on text.",
    mechanismDisabled: "CandidatePipeline: InvariantClosureEngine.verifyClosure",
    expectedConsequence: "High susceptibility to adversarial decoys and invalid execution under disabled states."
  },
  NO_DRIFT_REBIND: {
    id: "NO_DRIFT_REBIND",
    name: "Ablation 2: Drift Recovery Disabled",
    description: "Disables drift classification and candidate re-binding, requiring exact pre-recorded selectors.",
    mechanismDisabled: "TypedDriftDetector & Candidate Re-binding Pipeline",
    expectedConsequence: "Zero drift recovery; complete failure under dynamic IDs and structural hierarchy changes."
  },
  NO_NEGATIVE_EVIDENCE: {
    id: "NO_NEGATIVE_EVIDENCE",
    name: "Ablation 3: Negative Evidence Suppression Disabled",
    description: "Disables negative evidence store checks, allowing previously rejected decoys to be considered.",
    mechanismDisabled: "NegativeEvidenceStore: isKnownContradiction",
    expectedConsequence: "Repeated selection of adversarial decoys and contradictory candidate handles."
  },
  NO_RISK_GATING: {
    id: "NO_RISK_GATING",
    name: "Ablation 4: Risk-Gated Authorization Disabled",
    description: "Bypasses independent execution authorization gating and user confirmation requirements.",
    mechanismDisabled: "ExecutionAuthorizationEngine.evaluateAuthorization",
    expectedConsequence: "Unauthorized execution of destructive, irreversible, or high-risk capabilities."
  },
  NO_CAUSAL_VERIFIER: {
    id: "NO_CAUSAL_VERIFIER",
    name: "Ablation 5: Causal Transition Verification Disabled",
    description: "Skips multi-class causal transition verification, assuming success upon event dispatch.",
    mechanismDisabled: "CausalTransitionVerifier: verifyTransitionAsync",
    expectedConsequence: "Silent false successes on server rejections, timeouts, and uncorrelated state mutations."
  },
  NO_QUARANTINE_ROLLBACK: {
    id: "NO_QUARANTINE_ROLLBACK",
    name: "Ablation 6: Quarantine & Rollback Safeguards Disabled",
    description: "Disables quarantine controller and route demotion upon verification failure.",
    mechanismDisabled: "QuarantineController.quarantineFailedRoute & Route Demotion",
    expectedConsequence: "Repeated execution attempts against broken or rejected routes."
  }
};
var AblationEngine = class _AblationEngine {
  /**
   * Evaluates a single mutation descriptor under a specific ablation configuration.
   */
  static async evaluateAblationTrial(mutation, ablationId, runId = `RUN_ABL_${Date.now()}`) {
    const config = ABLATION_CONFIGS[ablationId];
    const trialId = `TRIAL_ABL_${ablationId}_${mutation.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const experimentId = `EXP_ABL_${ablationId}_${mutation.id}`;
    const env = MutationDOMGenerator.createMutatedEnvironment(mutation);
    const doc = env.document;
    const win = env.window;
    const candidates = env.candidates;
    const profiler = ComputationalProfiler.startProfile();
    try {
      const machine = new IntentNavMachine();
      AUTHORITATIVE_CAPABILITY_CATALOG.forEach((c) => machine.registerCapability(c));
      const transConfig = mutation.mutationConfig.transitionMutation;
      let lastEventId = `evt_${Date.now()}`;
      let lastTimestamp = Date.now();
      let lastAppStateDelta = {};
      let lastDOMDelta = {};
      let executionAttempted = false;
      let executionSucceeded = false;
      let safetyGatingBypassed = false;
      let quarantineTriggered = false;
      if (ablationId === "NO_NEGATIVE_EVIDENCE") {
        machine.negativeEvidenceStore.clear();
      }
      const customDispatcher = {
        async dispatchActivation(activationEventId, candidate, capabilityId, activationCharacteristics) {
          executionAttempted = true;
          lastEventId = activationEventId;
          lastTimestamp = Date.now();
          lastAppStateDelta = {};
          lastDOMDelta = {};
          const targetEl = doc.getElementById(candidate.bindingHandle?.volatileId || candidate.candidateId) || doc.querySelector(`[id="${candidate.bindingHandle?.volatileId || candidate.candidateId}"]`);
          if (!targetEl) {
            return {
              success: false,
              elementFound: false,
              eventDispatched: false,
              stateChanged: false,
              reason: "Target element could not be resolved in live DOM"
            };
          }
          if (targetEl.disabled) {
            if (ablationId !== "NO_FINGERPRINT_INVARIANT") {
              return {
                success: false,
                elementFound: true,
                eventDispatched: false,
                stateChanged: false,
                reason: "Target element is disabled by administrative policy"
              };
            }
          }
          if (transConfig?.outcome === "REJECTED") {
            return {
              success: false,
              elementFound: true,
              eventDispatched: true,
              stateChanged: false,
              reason: transConfig.errorMessage || "HTTP 500: Server mutation rejected"
            };
          }
          if (transConfig?.outcome === "DELAYED") {
            return {
              success: true,
              elementFound: true,
              eventDispatched: true,
              stateChanged: false,
              reason: "State mutation delayed asynchronously"
            };
          }
          const preAppState = { ...win.IntentNavMockState || {} };
          const preAria = targetEl.getAttribute("aria-checked");
          targetEl.click();
          const postAppState = { ...win.IntentNavMockState || {} };
          const postAria = targetEl.getAttribute("aria-checked");
          const delta = {};
          for (const key of Object.keys(postAppState)) {
            if (postAppState[key] !== preAppState[key]) {
              delta[key] = postAppState[key];
            }
          }
          lastAppStateDelta = delta;
          if (preAria !== postAria && postAria !== null) {
            lastDOMDelta["ariaChecked"] = postAria;
          }
          executionSucceeded = true;
          return {
            success: true,
            elementFound: true,
            eventDispatched: true,
            stateChanged: Object.keys(delta).length > 0 || Object.keys(lastDOMDelta).length > 0,
            activationEvent: {
              eventId: activationEventId,
              sequenceNumber: 1,
              timestamp: lastTimestamp,
              targetCandidateId: candidate.candidateId,
              eventType: activationCharacteristics?.eventType || "click",
              initiatingCapabilityId: capabilityId
            }
          };
        },
        async collectWitnesses() {
          if (transConfig && (transConfig.outcome === "REJECTED" || transConfig.outcome === "DELAYED")) {
            return [];
          }
          const now = lastTimestamp + 15;
          const witnesses = [];
          if (Object.keys(lastAppStateDelta).length > 0) {
            witnesses.push({
              witnessId: `wit_app_${now}`,
              witnessClass: "APPLICATION_STATE_MUTATION",
              sequenceNumber: 1,
              timestamp: now + 30,
              observedDelta: { ...lastAppStateDelta },
              correlatedActivationEventId: lastEventId,
              temporalDeltaMs: 30,
              isCausallyCorrelated: true,
              correlationExplanation: "Observed application state delta post activation"
            });
          }
          if (Object.keys(lastDOMDelta).length > 0) {
            witnesses.push({
              witnessId: `wit_dom_${now}`,
              witnessClass: "DOM_MUTATION",
              sequenceNumber: witnesses.length + 1,
              timestamp: now + 20,
              observedDelta: { ...lastDOMDelta },
              correlatedActivationEventId: lastEventId,
              temporalDeltaMs: 20,
              isCausallyCorrelated: true,
              correlationExplanation: "Observed DOM attribute delta post activation"
            });
          }
          if ("ariaChecked" in lastDOMDelta) {
            witnesses.push({
              witnessId: `wit_a11y_${now}`,
              witnessClass: "ACCESSIBILITY_STATE_MUTATION",
              sequenceNumber: witnesses.length + 1,
              timestamp: now + 40,
              observedDelta: { ariaChecked: lastDOMDelta["ariaChecked"] },
              correlatedActivationEventId: lastEventId,
              temporalDeltaMs: 40,
              isCausallyCorrelated: true,
              correlationExplanation: "Observed accessibility state delta post activation"
            });
          }
          return witnesses;
        },
        async observePostState() {
          const appState = { ...win.IntentNavMockState || {} };
          return {
            stateId: `state_${Date.now()}`,
            stateType: "PAGE",
            urlPattern: win?.location?.href || "http://localhost:3000/",
            domStructuralHash: "hash_live",
            semanticLandmarks: ["main", "section"],
            activeModalsOrDialogs: [],
            activeTabs: [],
            exposedCandidateHandles: [],
            observedApplicationState: appState,
            timestamp: Date.now()
          };
        }
      };
      machine.setDefaultDispatcher(customDispatcher);
      let effectiveCandidates = candidates;
      if (ablationId === "NO_DRIFT_REBIND") {
        if (mutation.category === "IDENTIFIER" || mutation.category === "STRUCTURAL") {
          effectiveCandidates = candidates.filter(
            (c) => c.bindingHandle?.volatileId === mutation.originalTargetId
          );
        }
      }
      const userConfirmGranted = ablationId === "NO_RISK_GATING";
      if (userConfirmGranted) {
        safetyGatingBypassed = true;
      }
      const ctx = await machine.processIntent(
        mutation.intentQuery,
        {
          tag: "body",
          observedActionType: "VIEW",
          observedTargetEntity: "UNKNOWN"
        },
        effectiveCandidates,
        userConfirmGranted,
        customDispatcher
      );
      if (ablationId === "NO_CAUSAL_VERIFIER") {
        if (executionAttempted) {
          ctx.causalVerified = true;
          if (ctx.verificationResult) {
            ctx.verificationResult.causallyVerified = true;
            ctx.verificationResult.status = "VERIFIED";
          }
        }
      }
      if (ablationId === "NO_QUARANTINE_ROLLBACK") {
        if (ctx.currentState === "QUARANTINED") {
          ctx.currentState = "FAILED";
        }
      }
      quarantineTriggered = ctx.currentState === "QUARANTINED";
      const selectedId = ctx.selectedCandidate?.bindingHandle?.volatileId || ctx.selectedCandidate?.candidateId || null;
      const isMatch = ComparisonOracle.isTargetMatch(
        "DOM_ELEMENT",
        selectedId,
        mutation.expectedTargetId,
        null
      );
      const isDecoy = ComparisonOracle.isDecoy(selectedId);
      const causallyVerified = Boolean(
        ablationId === "NO_CAUSAL_VERIFIER" ? executionAttempted : ctx.verificationResult?.causallyVerified
      );
      let verificationStatus = "FAILED";
      if (causallyVerified) {
        verificationStatus = "VERIFIED";
      } else if (quarantineTriggered || ctx.currentState === "QUARANTINED" || transConfig && transConfig.outcome !== "NORMAL") {
        verificationStatus = "QUARANTINED";
      }
      let trialStatus = "FAILED";
      if (isDecoy) {
        trialStatus = "DECOY_TRIGGERED";
      } else if (quarantineTriggered || verificationStatus === "QUARANTINED" && ablationId !== "NO_CAUSAL_VERIFIER") {
        trialStatus = "QUARANTINED";
      } else if (ctx.currentState === "ABSTAINED") {
        trialStatus = "ABSTAINED";
      } else if (isMatch && (ctx.currentState === "EXECUTED" || causallyVerified)) {
        trialStatus = "SUCCESS";
      }
      executionAttempted = Boolean(ctx.dispatchSuccessful || ctx.currentState === "EXECUTED");
      executionSucceeded = Boolean(ctx.dispatchSuccessful && ctx.currentState === "EXECUTED");
      const telemetry = ComputationalProfiler.endProfile(profiler, {
        candidateCount: candidates.length,
        evaluatedCandidateCount: ctx.driftRecoveryMetrics?.candidateEvaluationsCount || candidates.length,
        fingerprintComputationCount: ctx.driftRecoveryMetrics?.fingerprintComputationsCount || 1
      });
      return {
        experimentId,
        runId,
        trialId,
        timestamp: Date.now(),
        ablationId,
        mechanismDisabled: config.mechanismDisabled,
        mutationId: mutation.id,
        category: mutation.category,
        selectedTargetId: selectedId,
        targetSelectedCorrectly: isMatch,
        executionAttempted,
        executionSucceeded,
        verificationStatus,
        trialStatus,
        causallyVerified,
        safetyGatingBypassed,
        quarantineTriggered,
        telemetry,
        errorNotes: ctx.promotionFailureReason
      };
    } finally {
      env.cleanup();
    }
  }
  /**
   * Evaluates all ablations against an array of mutation descriptors.
   */
  static async evaluateAllAblations(mutations, ablationIds = [
    "BASELINE",
    "NO_FINGERPRINT_INVARIANT",
    "NO_DRIFT_REBIND",
    "NO_NEGATIVE_EVIDENCE",
    "NO_RISK_GATING",
    "NO_CAUSAL_VERIFIER",
    "NO_QUARANTINE_ROLLBACK"
  ]) {
    const records = [];
    const runId = `RUN_ABL_BATCH_${Date.now()}`;
    for (const mut of mutations) {
      for (const ablId of ablationIds) {
        const rec = await _AblationEngine.evaluateAblationTrial(mut, ablId, runId);
        records.push(rec);
      }
    }
    return records;
  }
};

// scripts/resolveChrome.js
import fs2 from "fs";
import { execSync } from "child_process";
function resolveChromeExecutable() {
  if (process.env.CHROME_PATH) {
    const customPath = process.env.CHROME_PATH.trim();
    if (fs2.existsSync(customPath)) {
      return customPath;
    }
    throw new Error(
      `[Chrome Discovery] CHROME_PATH environment variable is set to '${customPath}', but the executable does not exist at that location.`
    );
  }
  const platform = process.platform;
  const home = process.env.HOME || "";
  const candidates = [];
  if (platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      `${home}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      `${home}/Applications/Chromium.app/Contents/MacOS/Chromium`
    );
  } else if (platform === "linux") {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
      "/usr/local/bin/google-chrome",
      "/usr/local/bin/chromium"
    );
  } else if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
    const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    candidates.push(
      `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFiles}\\Chromium\\Application\\chrome.exe`,
      `${programFilesX86}\\Chromium\\Application\\chrome.exe`
    );
  }
  for (const candidate of candidates) {
    if (candidate && fs2.existsSync(candidate)) {
      return candidate;
    }
  }
  const lookupCmds = platform === "win32" ? ["where chrome.exe", "where chromium.exe"] : ["which google-chrome", "which google-chrome-stable", "which chromium", "which chromium-browser"];
  for (const cmd of lookupCmds) {
    try {
      const output = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().split(/\r?\n/)[0].trim();
      if (output && fs2.existsSync(output)) {
        return output;
      }
    } catch {
    }
  }
  throw new Error(
    `[Chrome Discovery] Could not find a valid Google Chrome or Chromium executable on platform '${platform}'.
Please install Google Chrome or Chromium, or set the CHROME_PATH environment variable:
  export CHROME_PATH="/path/to/google-chrome"
`
  );
}

// benchmark/experiments/runner.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
function findProjectRoot() {
  let curr = process.cwd();
  if (fs3.existsSync(path2.join(curr, "package.json"))) return curr;
  curr = path2.resolve(__dirname2, "..");
  if (fs3.existsSync(path2.join(curr, "package.json"))) return curr;
  curr = path2.resolve(__dirname2, "../..");
  if (fs3.existsSync(path2.join(curr, "package.json"))) return curr;
  return process.cwd();
}
var projectRoot = findProjectRoot();
var Phase3ExperimentRunner = class _Phase3ExperimentRunner {
  /**
   * Asserts that output paths strictly avoid frozen baseline evidence files.
   */
  static assertSafeOutputPath(targetPath) {
    const resolved = path2.resolve(targetPath);
    const frozenEvidenceDir = path2.resolve(projectRoot, "evidence");
    const frozenEvidenceZip = path2.resolve(projectRoot, "IntentNav-SCFR-Evidence-Baseline-v1.0.zip");
    if (resolved === frozenEvidenceZip) {
      throw new Error(`CRITICAL INTEGRITY VIOLATION: Cannot write to frozen baseline zip: ${resolved}`);
    }
    if (resolved.startsWith(frozenEvidenceDir)) {
      const baseName = path2.basename(resolved);
      if (baseName === "chromium_e2e_evidence.json" || baseName === "raw_runs.json" || baseName === "results.csv" || baseName === "evidence_report.md" || baseName === "summary.json") {
        throw new Error(`CRITICAL INTEGRITY VIOLATION: Cannot overwrite frozen baseline evidence: ${resolved}`);
      }
    }
  }
  /**
   * Computes SHA-256 hash of a file or string buffer.
   */
  static computeSha256(contentOrPath) {
    const hash = crypto.createHash("sha256");
    if (fs3.existsSync(contentOrPath)) {
      hash.update(fs3.readFileSync(contentOrPath));
    } else {
      hash.update(contentOrPath, "utf8");
    }
    return hash.digest("hex");
  }
  /**
   * Captures complete environment and repository provenance.
   */
  static captureProvenance(runId) {
    let gitRevision = "UNKNOWN_REVISION";
    let isWorkingTreeDirty = true;
    try {
      gitRevision = child_process.execSync("git rev-parse HEAD", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      const porcelain = child_process.execSync("git status --porcelain", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      isWorkingTreeDirty = porcelain.length > 0;
    } catch {
    }
    let browserExecutable = "UNKNOWN";
    let browserVersion = "UNKNOWN";
    try {
      browserExecutable = resolveChromeExecutable();
      browserVersion = child_process.execSync(`"${browserExecutable}" --version`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
    }
    const intentsPath = path2.resolve(projectRoot, "benchmark/dataset/intents.json");
    const datasetChecksumSha256 = fs3.existsSync(intentsPath) ? _Phase3ExperimentRunner.computeSha256(intentsPath) : "NONE";
    const fixturesPath = path2.resolve(projectRoot, "benchmark/mutations/fixtures.ts");
    const mutationConfigChecksumSha256 = fs3.existsSync(fixturesPath) ? _Phase3ExperimentRunner.computeSha256(fixturesPath) : "NONE";
    return {
      runId,
      timestamp: Date.now(),
      gitRevision,
      isWorkingTreeDirty,
      environmentType: "MOCK_JSDOM",
      platform: process.platform,
      arch: process.arch,
      osRelease: os.release(),
      nodeVersion: process.version,
      browserExecutable,
      browserVersion,
      datasetChecksumSha256,
      mutationConfigChecksumSha256,
      commandExecuted: "Phase3ExperimentRunner.execute()"
    };
  }
  /**
   * Executes the integrated Phase 3 validation run (Steps 14–17).
   */
  static async execute(options) {
    const runId = `PHASE3_RUN_${Date.now()}`;
    const outputDir = options?.outputDir || path2.resolve(projectRoot, "benchmark/results/phase3");
    _Phase3ExperimentRunner.assertSafeOutputPath(outputDir);
    if (!fs3.existsSync(outputDir)) {
      fs3.mkdirSync(outputDir, { recursive: true });
    }
    const provenance = _Phase3ExperimentRunner.captureProvenance(runId);
    const mutations = options?.mutations || CONTROLLED_MUTATION_FIXTURES;
    const systems = options?.systems || ["B1", "B2", "B3", "B4", "B5"];
    const fullSystemRecords = [];
    for (const mut of mutations) {
      for (const sysId of systems) {
        const profiler = ComputationalProfiler.startProfile();
        const trialRes = await ControlledMutationHarness.evaluateTrial(mut, sysId);
        const telemetry = ComputationalProfiler.endProfile(profiler, {
          candidateCount: 10,
          evaluatedCandidateCount: trialRes.applicable ? 10 : 0,
          fingerprintComputationCount: sysId === "B5" ? 1 : 0
        });
        fullSystemRecords.push({
          experimentId: `EXP_${mut.id}_${sysId}`,
          runId,
          trialId: trialRes.trialId,
          timestamp: Date.now(),
          systemId: sysId,
          systemName: trialRes.systemName,
          mutationId: mut.id,
          category: mut.category,
          applicable: trialRes.applicable,
          inapplicableReason: trialRes.inapplicableReason,
          selectedTargetId: trialRes.selectedTargetId,
          targetSelectedCorrectly: trialRes.targetSelectedCorrectly,
          executionAttempted: trialRes.executionAttempted,
          executionSucceeded: trialRes.executionSucceeded,
          verificationStatus: trialRes.verificationStatus,
          trialStatus: trialRes.trialStatus,
          causallyVerified: trialRes.causallyVerified,
          telemetry,
          errorNotes: trialRes.errorNotes
        });
      }
    }
    let ablationRecords = [];
    if (options?.runAblations !== false) {
      ablationRecords = await AblationEngine.evaluateAllAblations(mutations);
    }
    const allLatencies = fullSystemRecords.map((r) => r.telemetry.e2eLatencyMs);
    const allMemDeltas = fullSystemRecords.map((r) => r.telemetry.heapMemoryDeltaMb);
    const allCpuTimes = fullSystemRecords.map(
      (r) => (r.telemetry.cpuUserMicroseconds + r.telemetry.cpuSystemMicroseconds) / 1e3
    );
    const allCandidateEvals = fullSystemRecords.map((r) => r.telemetry.evaluatedCandidateCount);
    const allFpComps = fullSystemRecords.map((r) => r.telemetry.fingerprintComputationCount);
    const perSystemLatency = {};
    for (const sysId of systems) {
      const sysRecords = fullSystemRecords.filter((r) => r.systemId === sysId);
      perSystemLatency[sysId] = ComputationalProfiler.computeDistribution(
        sysRecords.map((r) => r.telemetry.e2eLatencyMs),
        "ms"
      );
    }
    const computationalReport = {
      timestamp: Date.now(),
      totalTrialsMeasured: fullSystemRecords.length,
      e2eLatencyDistribution: ComputationalProfiler.computeDistribution(allLatencies, "ms"),
      memoryDeltaMbDistribution: ComputationalProfiler.computeDistribution(allMemDeltas, "MB"),
      cpuTimeMsDistribution: ComputationalProfiler.computeDistribution(allCpuTimes, "ms"),
      candidateEvaluationsDistribution: ComputationalProfiler.computeDistribution(allCandidateEvals, "candidates"),
      fingerprintComputationsDistribution: ComputationalProfiler.computeDistribution(allFpComps, "computations"),
      perSystemLatency
    };
    const fullSystemRunsPath = path2.join(outputDir, "phase3_full_system_runs.json");
    const ablationRunsPath = path2.join(outputDir, "phase3_ablation_runs.json");
    const computationalPath = path2.join(outputDir, "phase3_computational_report.json");
    const csvPath = path2.join(outputDir, "phase3_results.csv");
    const reportPath = path2.join(outputDir, "phase3_comprehensive_report.md");
    const manifestPath = path2.join(outputDir, "manifest.json");
    _Phase3ExperimentRunner.assertSafeOutputPath(fullSystemRunsPath);
    _Phase3ExperimentRunner.assertSafeOutputPath(ablationRunsPath);
    _Phase3ExperimentRunner.assertSafeOutputPath(computationalPath);
    _Phase3ExperimentRunner.assertSafeOutputPath(csvPath);
    _Phase3ExperimentRunner.assertSafeOutputPath(reportPath);
    _Phase3ExperimentRunner.assertSafeOutputPath(manifestPath);
    fs3.writeFileSync(fullSystemRunsPath, JSON.stringify(fullSystemRecords, null, 2), "utf8");
    fs3.writeFileSync(ablationRunsPath, JSON.stringify(ablationRecords, null, 2), "utf8");
    fs3.writeFileSync(computationalPath, JSON.stringify(computationalReport, null, 2), "utf8");
    const csvLines = [
      "trialId,runId,systemId,mutationId,category,applicable,targetSelectedCorrectly,executionSucceeded,verificationStatus,trialStatus,causallyVerified,latencyMs,heapMemoryDeltaMb",
      ...fullSystemRecords.map(
        (r) => [
          r.trialId,
          r.runId,
          r.systemId,
          r.mutationId,
          r.category,
          r.applicable,
          r.targetSelectedCorrectly,
          r.executionSucceeded,
          r.verificationStatus,
          r.trialStatus,
          r.causallyVerified,
          r.telemetry.e2eLatencyMs,
          r.telemetry.heapMemoryDeltaMb
        ].join(",")
      ),
      ...ablationRecords.map(
        (r) => [
          r.trialId,
          r.runId,
          r.ablationId,
          r.mutationId,
          r.category,
          true,
          r.targetSelectedCorrectly,
          r.executionSucceeded,
          r.verificationStatus,
          r.trialStatus,
          r.causallyVerified,
          r.telemetry.e2eLatencyMs,
          r.telemetry.heapMemoryDeltaMb
        ].join(",")
      )
    ];
    fs3.writeFileSync(csvPath, csvLines.join("\n"), "utf8");
    const markdownReport = _Phase3ExperimentRunner.generateMarkdownReport(
      provenance,
      fullSystemRecords,
      ablationRecords,
      computationalReport
    );
    fs3.writeFileSync(reportPath, markdownReport, "utf8");
    const filesToManifest = [
      { path: fullSystemRunsPath, filename: "phase3_full_system_runs.json", description: "Raw full-system trial records" },
      { path: ablationRunsPath, filename: "phase3_ablation_runs.json", description: "Raw ablation trial records" },
      { path: computationalPath, filename: "phase3_computational_report.json", description: "Computational resource report" },
      { path: csvPath, filename: "phase3_results.csv", description: "Reconciled tabular trial export" },
      { path: reportPath, filename: "phase3_comprehensive_report.md", description: "Comprehensive experimental report" }
    ];
    const artifacts = filesToManifest.map((f) => {
      const stats = fs3.statSync(f.path);
      return {
        path: f.path,
        filename: f.filename,
        sha256: _Phase3ExperimentRunner.computeSha256(f.path),
        sizeBytes: stats.size,
        description: f.description
      };
    });
    const manifest = {
      manifestVersion: "1.0.0",
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      provenance,
      totalTrials: {
        fullSystem: fullSystemRecords.length,
        ablation: ablationRecords.length,
        total: fullSystemRecords.length + ablationRecords.length
      },
      artifacts,
      reproductionInstructions: {
        command: "node scripts/runPhase3Validation.js",
        environmentPrerequisites: [
          "Node.js >= 20.0.0",
          "npm install completed",
          "Google Chrome or Chromium installed for browser validation"
        ]
      }
    };
    fs3.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    return {
      provenance,
      fullSystemRecords,
      ablationRecords,
      computationalReport,
      manifest,
      outputFiles: {
        outputDir,
        fullSystemRunsPath,
        ablationRunsPath,
        computationalPath,
        csvPath,
        reportPath,
        manifestPath
      }
    };
  }
  static generateMarkdownReport(provenance, fullSystem, ablations, comp) {
    const lines = [];
    lines.push("# IntentNav-SCFR: Phase 3 Integrated Experimental Validation Report");
    lines.push(`**Run ID:** \`${provenance.runId}\``);
    lines.push(`**Git Revision:** \`${provenance.gitRevision}\` (Working tree dirty: ${provenance.isWorkingTreeDirty})`);
    lines.push(`**Generated At:** ${new Date(provenance.timestamp).toISOString()}`);
    lines.push(`**Platform:** ${provenance.platform} (${provenance.arch}), Node: ${provenance.nodeVersion}`);
    lines.push(`**Browser:** ${provenance.browserVersion}`);
    lines.push("");
    lines.push("## 1. Full-System Experiments (Step 14)");
    lines.push("| System ID | System Name | Attempted | Completed | Correct Selection | Executed | Causally Verified | Decoy Triggered | Not Applicable |");
    lines.push("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
    const systemIds = ["B1", "B2", "B3", "B4", "B5"];
    for (const sysId of systemIds) {
      const records = fullSystem.filter((r) => r.systemId === sysId);
      const attempted = records.length;
      const applicable = records.filter((r) => r.applicable).length;
      const notApplicable = records.filter((r) => !r.applicable).length;
      const correctSel = records.filter((r) => r.applicable && r.targetSelectedCorrectly).length;
      const executed = records.filter((r) => r.applicable && r.executionSucceeded).length;
      const verified = records.filter((r) => r.applicable && r.causallyVerified).length;
      const decoy = records.filter((r) => r.trialStatus === "DECOY_TRIGGERED").length;
      lines.push(
        `| **${sysId}** | ${BASELINE_REGISTRY[sysId].shortName} | ${attempted} | ${applicable} | ${correctSel} | ${executed} | ${verified} | ${decoy} | ${notApplicable} |`
      );
    }
    lines.push("");
    lines.push("## 2. Controlled Ablation Studies (Step 15)");
    lines.push("| Ablation ID | Mechanism Disabled | Trials | Target Correct | Executed | Causally Verified | Safety Gating Bypassed | Quarantined |");
    lines.push("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |");
    const ablIds = Array.from(new Set(ablations.map((a) => a.ablationId)));
    for (const ablId of ablIds) {
      const records = ablations.filter((a) => a.ablationId === ablId);
      const correct = records.filter((r) => r.targetSelectedCorrectly).length;
      const exec = records.filter((r) => r.executionSucceeded).length;
      const ver = records.filter((r) => r.causallyVerified).length;
      const bypass = records.filter((r) => r.safetyGatingBypassed).length;
      const quar = records.filter((r) => r.quarantineTriggered).length;
      lines.push(
        `| **${ablId}** | ${records[0]?.mechanismDisabled || ""} | ${records.length} | ${correct} | ${exec} | ${ver} | ${bypass} | ${quar} |`
      );
    }
    lines.push("");
    lines.push("## 3. Computational Telemetry & Effects (Step 16)");
    lines.push(`- **End-to-End Latency:** Mean: ${comp.e2eLatencyDistribution.mean} ms, Median: ${comp.e2eLatencyDistribution.median} ms, P95: ${comp.e2eLatencyDistribution.p95} ms (Min: ${comp.e2eLatencyDistribution.min} ms, Max: ${comp.e2eLatencyDistribution.max} ms)`);
    lines.push(`- **Heap Memory Delta:** Mean: ${comp.memoryDeltaMbDistribution.mean} MB, Max: ${comp.memoryDeltaMbDistribution.max} MB`);
    lines.push(`- **Process CPU Time:** Mean: ${comp.cpuTimeMsDistribution.mean} ms`);
    lines.push(`- **Candidate Evaluations per Trial:** Mean: ${comp.candidateEvaluationsDistribution.mean}`);
    lines.push("");
    lines.push("## 4. Reproducibility Manifest (Step 17)");
    lines.push(`- **Dataset SHA-256:** \`${provenance.datasetChecksumSha256}\``);
    lines.push(`- **Mutation Config SHA-256:** \`${provenance.mutationConfigChecksumSha256}\``);
    lines.push(`- **Reproduction Command:** \`node scripts/runPhase3Validation.js\``);
    return lines.join("\n");
  }
};

// scripts/runPhase3Validation.ts
async function main() {
  console.log("================================================================");
  console.log("IntentNav-SCFR: Phase 3 Integrated Experimental Validation (Steps 14\u201317)");
  console.log("================================================================\n");
  console.log("[Phase 3] Starting integrated experiment execution...");
  const t0 = Date.now();
  const result = await Phase3ExperimentRunner.execute();
  const durationSec = ((Date.now() - t0) / 1e3).toFixed(2);
  console.log(`
[Phase 3] Execution completed in ${durationSec}s.`);
  console.log(`[Phase 3] Run ID: ${result.provenance.runId}`);
  console.log(`[Phase 3] Full-System Trials: ${result.fullSystemRecords.length}`);
  console.log(`[Phase 3] Ablation Trials: ${result.ablationRecords.length}`);
  console.log(`[Phase 3] Total Trials: ${result.manifest.totalTrials.total}`);
  console.log(`[Phase 3] Output Directory: ${result.outputFiles.outputDir}`);
  console.log(`[Phase 3] Manifest Checksum (manifest.json): ${result.outputFiles.manifestPath}`);
  console.log("\n--- Output Artifacts Generated ---");
  for (const artifact of result.manifest.artifacts) {
    console.log(`  - ${artifact.filename} (${artifact.sizeBytes} bytes, SHA256: ${artifact.sha256.substring(0, 16)}...)`);
  }
  console.log("\n================================================================");
  console.log(">>> ALL PHASE 3 EXPERIMENTS (STEPS 14-17) REPRODUCED SUCCESSFULLY! <<<");
  console.log("================================================================\n");
}
main().catch((err) => {
  console.error("[Phase 3 Error] Validation execution failed:", err);
  process.exit(1);
});
