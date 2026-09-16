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

export interface NegativeEvidenceEntry {
  id: string;
  candidateFingerprint: Partial<FunctionalCapabilityFingerprint>;
  candidateIdentifier: string;
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
}

