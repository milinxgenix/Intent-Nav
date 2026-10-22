/**
 * IntentNav-SCFR: Contradiction and Negative Evidence Types
 */

import { FunctionalCapabilityFingerprint } from './capability';

export type ContradictionType =
  | 'WRONG_TARGET_ENTITY'
  | 'FORBIDDEN_ACTION'
  | 'INCOMPATIBLE_PRESTATE'
  | 'INCOMPATIBLE_POSTSTATE'
  | 'KNOWN_DECOY_PATTERN'
  | 'CAUSAL_WITNESS_FAILURE'
  | 'REPEATED_VALIDATION_FAILURE';

/**
 * ContradictionEvidence / NegativeEvidenceRecord (Phase 11)
 * Contains fine-grained structural and semantic evidence hashes to support
 * reconsidering candidates upon material interface changes while suppressing
 * identical material evidence.
 */
export interface ContradictionEvidence {
  evidenceId: string;
  capabilityId: string;
  candidateFingerprintHash: string;
  interfaceEvidenceHash: string;
  failedInvariant: string;
  contradictionType: ContradictionType;
  reason: string;
  timestamp: number;
  routeVersion: string;
  interfaceState: string;
  previouslySelected: boolean;
  suppressionWeight: number; // 0.0 to 1.0
}

// Alias for first-class ContradictionRecord entity
export type ContradictionRecord = ContradictionEvidence;

export interface NegativeEvidenceEntry {
  id: string;
  candidateFingerprint: Partial<FunctionalCapabilityFingerprint>;
  candidateIdentifier: string;
  candidateFingerprintHash?: string;
  interfaceEvidenceHash?: string;
  contradictionType: ContradictionType;
  failedInvariantId: string;
  reason: string;
  timestamp: number;
  originatingRouteId?: string;
  interfaceVersion: string;
  evidenceDetails: Record<string, unknown>;
  confidence: number;
  previouslySelected: boolean;
  suppressionWeight: number; // Penalty applied to future matching

  // Step 6 complete negative evidence fields:
  failedCondition?: string; // specific failed invariant name or causal status (e.g. 'FAILED_POST_STATE_MISMATCH')
  affectedCapabilityId?: string;
  affectedRouteId?: string;
  affectedCandidateId?: string;
  sequenceNumber?: number;
  activationEventId?: string;
  witnessIds?: string[];
  failureClassification?: string;
  quarantined?: boolean; // whether the candidate/route remains quarantined
  canReconsider?: boolean; // whether candidate may be reconsidered upon material interface change
  requiredMaterialEvidenceChange?: string; // explicit explanation of what evidence change is required for reconsideration
}
