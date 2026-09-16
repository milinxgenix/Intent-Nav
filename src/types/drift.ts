/**
 * IntentNav-SCFR: Typed Drift Localization Types
 * Enforces 5-dimensional typed drift vector with localized explanation
 */

export interface TypedDriftVector {
  presentation: number; // 0.0 (identical) to 1.0 (completely changed: IDs, classes, styles)
  context: number;      // 0.0 to 1.0 (surrounding labels, containers, headings)
  structure: number;    // 0.0 to 1.0 (DOM hierarchy depth, sibling ordering, nesting)
  capability: number;   // 0.0 to 1.0 (functional target, control type, accessible role)
  transition: number;   // 0.0 to 1.0 (pre/post state delta mismatch, activation behavior)
}

export interface DriftThresholds {
  presentationRecoveryThreshold: number; // typically high (e.g. 0.95) - presentation alone rarely triggers rebind
  contextValidationThreshold: number;    // moderate (e.g. 0.40) - triggers validation/reassessment
  structureValidationThreshold: number;  // moderate (e.g. 0.45) - triggers validation/reassessment
  capabilityRebindThreshold: number;     // low (e.g. 0.20) - capability drift requires re-binding
  transitionRebindThreshold: number;     // low (e.g. 0.25) - transition drift requires re-binding
}

export type DriftActionRequired =
  | 'MAINTAIN_ACTIVE'               // Presentation only drift below threshold -> route remains active
  | 'TRIGGER_VALIDATION'            // Context/structure drift -> test route with transition verifier
  | 'TRIGGER_REBIND_RECOVERY'       // Capability or transition drift -> discover & rebind candidates
  | 'QUARANTINE_IMMEDIATELY';       // Contradictory drift -> immediately quarantine

export interface DriftLocalizationResult {
  driftVector: TypedDriftVector;
  actionRequired: DriftActionRequired;
  dominantDriftDimension: keyof TypedDriftVector;
  explanation: string;
  triggerFactors: string[];
  assessedTimestamp: number;
}

