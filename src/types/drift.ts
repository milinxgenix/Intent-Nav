/**
 * IntentNav-SCFR: Typed Drift Localization Types
 * Enforces 5-dimensional typed drift vector with localized explanation
 */

export interface TransitionEvidenceStatus {
  preState: 'EVALUATED' | 'UNKNOWN';
  allowedDelta: 'EVALUATED' | 'UNKNOWN';
  postState: 'EVALUATED' | 'UNKNOWN';
  activationEventType: 'EVALUATED' | 'UNKNOWN';
  witnessClasses: 'EVALUATED' | 'UNKNOWN';
}

export interface TypedDriftVector {
  presentation: number; // 0.0 (identical) to 1.0 (completely changed: IDs, classes, styles)
  context: number;      // 0.0 to 1.0 (surrounding labels, containers, headings)
  structure: number;    // 0.0 to 1.0 (DOM hierarchy depth, sibling ordering, nesting)
  capability: number;   // 0.0 to 1.0 (functional target, control type, accessible role)
  transition: number;   // 0.0 to 1.0 (pre/post state delta mismatch, activation behavior)
  transitionStatus?: TransitionEvidenceStatus;
}

export interface DriftThresholds {
  presentationRecoveryThreshold: number; // typically high (e.g. 0.90) - presentation alone rarely triggers rebind
  contextValidationThreshold: number;    // moderate (e.g. 0.40) - triggers validation/reassessment
  structureValidationThreshold: number;  // moderate (e.g. 0.45) - triggers validation/reassessment
  capabilityRebindThreshold: number;     // low (e.g. 0.20) - capability drift requires re-binding
  transitionRebindThreshold: number;     // low (e.g. 0.25) - transition drift requires re-binding
  extremeDriftQuarantineThreshold: number; // high (e.g. 0.90) - concurrent extreme drift triggers immediate quarantine
}

export type DriftActionRequired =
  | 'MAINTAIN_ACTIVE'               // Presentation only drift below threshold -> route remains active
  | 'TRIGGER_VALIDATION'            // Context/structure drift -> test route with transition verifier
  | 'TRIGGER_REBIND_RECOVERY'       // Capability or transition drift -> discover & rebind candidates
  | 'QUARANTINE_IMMEDIATELY';       // Contradictory drift -> immediately quarantine

export type DriftDimension =
  | 'presentation'
  | 'context'
  | 'structure'
  | 'capability'
  | 'transition';

export interface DriftRecoveryMetrics {
  /** Count of candidate evaluation contexts inspected during candidate discovery */
  inspectedCandidatesCount: number;
  /** Backwards-compatible legacy alias strictly mirroring inspectedCandidatesCount; does NOT represent raw DOM-tree node enumeration */
  inspectedNodesCount?: number;
  /** Direct count of candidates evaluated through invariant closure at the candidate pipeline evaluation site */
  candidateEvaluationsCount: number;
  /** Direct counter incremented at the FingerprintConstructor SHA-256 primitive computation site during the recovery cycle */
  fingerprintComputationsCount: number;
  /** Count of distinct capability IDs whose active routes were demoted/invalidated during localized invalidation */
  invalidatedCapabilitiesCount: number;
  /** Differential graph comparison counting non-target capability nodes whose active routes were demoted (null if unmeasured); makes no claim of counterfactual stability */
  unnecessarilyInvalidatedCount: number | null;
  /** Monotonic high-resolution timer (performance.now) from drift evaluation start to recovery completion */
  recoveryLatencyMs: number;
  /** Narrow operational blocked-attempt counter: increments to 1 strictly when a concrete execution attempt explicitly targeting an invalidated or unpromoted quarantined route is intercepted and prevented from executing. Does not increment merely because a route was demoted, and makes no claim of counterfactual user attempts. */
  staleExecutionAttemptsAvoided: number;
  /** Binary decision outcome per intent recovery cycle (0 = candidate selected, 1 = safe refusal/abstention). Reflects the single decision outcome of the current recovery cycle, not an aggregated historical event counter. */
  abstentionsCount: number;
}

export interface DriftLocalizationResult {
  driftVector: TypedDriftVector;
  actionRequired: DriftActionRequired;
  dominantDriftDimension: DriftDimension;
  explanation: string;
  triggerFactors: string[];
  assessedTimestamp: number;
  localizedAffectedCapabilityId?: string;
  invalidationApplied?: boolean;
}

