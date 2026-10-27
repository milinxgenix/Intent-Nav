/**
 * IntentNav-SCFR: Comparison Baselines Registry & Evaluation Oracle
 *
 * Phase 3, Step 12 Implementation:
 * Documents precisely what each baseline implements, what it does not implement,
 * its architectural category, scope of target resolution, and known limitations.
 *
 * Implements a shared, consistent evaluation oracle across all systems to guarantee
 * fairness, reproducibility, and prevent artificial asymmetry.
 */

export type BaselineSystemId = 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export interface BaselineDescriptor {
  id: BaselineSystemId;
  systemName: string;
  shortName: string;
  architectureCategory: string;
  targetResolutionScope: 'DOM_ELEMENT' | 'PAGE_URL';
  implementedCapabilities: string[];
  unimplementedCapabilities: string[];
  knownLimitations: string[];
  oracleMode: 'EXACT_ELEMENT_MATCH' | 'PAGE_URL_MATCH';
  fairnessConstraints: string[];
}

export const BASELINE_REGISTRY: Record<BaselineSystemId, BaselineDescriptor> = {
  B1: {
    id: 'B1',
    systemName: 'Baseline 1: Fixed Selector Replay',
    shortName: 'Fixed Selector Replay',
    architectureCategory: 'Conventional RPA / Recorded Selector Replay',
    targetResolutionScope: 'DOM_ELEMENT',
    implementedCapabilities: [
      'Replay of pre-recorded hardcoded CSS ID selectors (#btn-...)',
      'Exact ID equality matching against DOM candidate binding handles',
    ],
    unimplementedCapabilities: [
      'Natural language intent understanding',
      'Semantic similarity matching',
      'Structural invariant closure',
      'Drift adaptation to renamed, scrambled, or dynamic framework IDs',
      'Execution authorization gating (always authorizes upon match)',
      'Causal transition verification',
    ],
    knownLimitations: [
      'Completely breaks when DOM element IDs change (Mock Sites B, C, D)',
      'Zero drift recovery capability across framework redesigns',
      'Lacks safety invariant gating or user confirmation for high-risk actions',
    ],
    oracleMode: 'EXACT_ELEMENT_MATCH',
    fairnessConstraints: [
      'Evaluates the exact same DOM candidates as other element-level systems',
      'Uses identical mock site fixtures and initial conditions',
      'Evaluated against same ground-truth target ID oracle',
    ],
  },
  B2: {
    id: 'B2',
    systemName: 'Baseline 2: Keyword String Matching',
    shortName: 'Keyword String Matching',
    architectureCategory: 'Lexical Heuristic Search',
    targetResolutionScope: 'DOM_ELEMENT',
    implementedCapabilities: [
      'Tokenization of query into words (> 3 characters)',
      'Substring matching against visible candidate text labels',
      'Ranking by token count overlap',
      'Top-1 and Top-3 candidate extraction',
    ],
    unimplementedCapabilities: [
      'Synonym or paraphrase comprehension (fails on linguistic variations)',
      'Grammatical polarity / negation detection',
      'Structural container or role invariant closure',
      'Adversarial decoy discrimination (highly vulnerable to keyword stuffing)',
      'Causal transition verification',
      'Independent execution authorization (authorizes without safety check)',
    ],
    knownLimitations: [
      'Regularly selects high-keyword-overlap adversarial decoys (Mock Site D)',
      'Fails on synonyms (e.g. "night mode" for "dark mode")',
      'Executes destructive high-risk operations without user confirmation',
    ],
    oracleMode: 'EXACT_ELEMENT_MATCH',
    fairnessConstraints: [
      'Receives identical candidate labels extracted from live DOM',
      'Uses same intent query strings without preprocessing advantage',
      'Evaluated against same ground-truth target ID oracle',
    ],
  },
  B3: {
    id: 'B3',
    systemName: 'Baseline 3: Semantic-Only Matching',
    shortName: 'Semantic-Only Matching',
    architectureCategory: 'Vector / Token-Set Semantic Similarity',
    targetResolutionScope: 'DOM_ELEMENT',
    implementedCapabilities: [
      'Jaccard token-set similarity computation between query and candidate labels',
      'Threshold filtering (similarity > 0.15)',
      'Ranking by continuous semantic similarity score',
      'Top-1 and Top-3 candidate extraction',
    ],
    unimplementedCapabilities: [
      'Hard invariant gating prior to ranking',
      'Action-type verification (confuses opposite operations like delete vs modify)',
      'Target-entity compatibility verification',
      'Causal transition verification via multi-class witnesses',
      'Independent execution authorization',
    ],
    knownLimitations: [
      'Highly susceptible to adversarial semantic decoys with high linguistic overlap',
      'Lacks causal post-state validation: cannot detect whether action achieved intent',
      'Authorizes high-risk operations based solely on semantic confidence',
    ],
    oracleMode: 'EXACT_ELEMENT_MATCH',
    fairnessConstraints: [
      'Evaluates identical live DOM candidate labels',
      'Uses same intent query strings',
      'Evaluated against same ground-truth target ID oracle',
    ],
  },
  B4: {
    id: 'B4',
    systemName: 'Baseline 4: Intent-to-Page Navigation',
    shortName: 'Intent-to-Page Navigation',
    architectureCategory: 'URL Routing Rulebase',
    targetResolutionScope: 'PAGE_URL',
    implementedCapabilities: [
      'Regex pattern matching on user intent query',
      'Mapping intent to high-level page route (e.g., /settings/notifications, /settings/privacy)',
    ],
    unimplementedCapabilities: [
      'DOM element resolution (cannot select in-page buttons, toggles, or links)',
      'In-page action execution (cannot click, toggle, or mutate state)',
      'Handling in-page modal dialogs, tab panels, or dynamic drawers',
      'Causal transition verification',
      'Drift recovery within page DOM',
    ],
    knownLimitations: [
      'Evaluated on route URL match rather than element execution',
      'Provides 0% decoy rejection and 0% causal verification because it does not resolve or activate DOM elements',
      'Cannot execute fine-grained user intents',
    ],
    oracleMode: 'PAGE_URL_MATCH',
    fairnessConstraints: [
      'Receives identical user intent queries',
      'Page-route ground truth evaluated on intent capability domain',
      'Separate scope documented honestly; does not fabricate element execution',
    ],
  },
  B5: {
    id: 'B5',
    systemName: 'IntentNav-SCFR (Invention Prototype)',
    shortName: 'IntentNav-SCFR',
    architectureCategory: 'Adaptive Invariant-Bounded Functional Capability Architecture',
    targetResolutionScope: 'DOM_ELEMENT',
    implementedCapabilities: [
      'Functional Capability Identity via v2 Fingerprints',
      'Mandatory Invariant Closure prior to ranking',
      'Negative evidence suppression for contradictory candidates',
      'Structural invariant re-binding across volatile/scrambled IDs',
      'Independent risk-gated execution authorization (strictly 0 unauthorized high-risk executions)',
      'Live activation dispatch and causal transition verification via multi-class witnesses',
    ],
    unimplementedCapabilities: [
      'Arbitrary heuristic guesswork without invariant satisfaction',
    ],
    knownLimitations: [
      'Requires authoritative capability catalog registration',
      'Abstains when invariant closure cannot be satisfied',
    ],
    oracleMode: 'EXACT_ELEMENT_MATCH',
    fairnessConstraints: [
      'Evaluates live DOM candidates generated by CandidateGenerator from current page',
      'No oracle or ground-truth element IDs injected into runtime engine',
      'Zero extra retries or recovery opportunities not available in ordinary execution',
    ],
  },
};

/**
 * Common Evaluation Oracle for all benchmark systems.
 * Provides unified, bias-free target matching and trial classification.
 */
export class ComparisonOracle {
  /**
   * Asserts whether a selected candidate matches the independent ground-truth expectation.
   */
  public static isTargetMatch(
    systemScope: 'DOM_ELEMENT' | 'PAGE_URL',
    selectedId: string | null,
    expectedTargetId: string | null,
    expectedSyntheticId: string | null
  ): boolean {
    if (!selectedId) return false;
    if (systemScope === 'PAGE_URL') {
      // Page navigation maps to URLs
      return Boolean(expectedTargetId && selectedId.toLowerCase().includes(expectedTargetId.toLowerCase()));
    }
    return (
      (expectedTargetId !== null && selectedId === expectedTargetId) ||
      (expectedSyntheticId !== null && selectedId === expectedSyntheticId)
    );
  }

  /**
   * Determines whether the selected candidate corresponds to an adversarial decoy.
   */
  public static isDecoy(selectedId: string | null): boolean {
    if (!selectedId) return false;
    return selectedId.toLowerCase().includes('decoy');
  }

  /**
   * Determines if a system correctly abstained when groundTruthCapability is 'NONE'.
   */
  public static isAbstention(selectedId: string | null, executed: boolean): boolean {
    return selectedId === null || !executed;
  }

  /**
   * Classifies trial status with strict reconciliation.
   */
  public static classifyTrialStatus(params: {
    systemScope: 'DOM_ELEMENT' | 'PAGE_URL';
    success: boolean;
    isMatch: boolean;
    isDecoy: boolean;
    groundTruthCapability: string;
    incomplete?: boolean;
    currentState?: string;
  }): string {
    if (params.incomplete) return 'INCOMPLETE';
    if (!params.success) return 'FAILED';
    if (params.isDecoy) return 'DECOY_TRIGGERED';
    if (params.groundTruthCapability === 'NONE') {
      return params.success ? 'FALSE_DISCOVERY' : 'SUCCESS';
    }
    if (params.isMatch) return 'SUCCESS';
    if (params.currentState && params.currentState !== 'EXECUTED' && params.currentState !== 'CONFIRMATION_PENDING') {
      return params.currentState;
    }
    return 'WRONG_TARGET';
  }
}

