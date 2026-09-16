/**
 * IntentNav-SCFR: Causal Transition Verification & Validation Types
 *
 * Strict Witness Correlation:
 * - Activation event strictly precedes witness observation
 * - Observed within bounded verification window
 * - >=2 independent witness classes required where possible
 * - Unrelated or pre-existing mutations rejected as non-causal
 */

import { FunctionalCapabilityFingerprint, BindingHandle } from './capability';
import { RouteVersion } from './state';
import { TypedDriftVector } from './drift';
import { InvariantClosureResult } from './invariant';
import { CandidateRebindScore } from './ranking';
import { ExecutionAuthorizationDecision } from './authorization';

export type WitnessClass =
  | 'DOM_MUTATION'
  | 'ACCESSIBILITY_STATE_MUTATION'
  | 'HISTORY_STATE_MUTATION'
  | 'CLIENT_ROUTE_MUTATION'
  | 'APPLICATION_STATE_MUTATION'
  | 'ASYNC_ACKNOWLEDGEMENT';

export interface ActivationEventRecord {
  eventId: string;
  sequenceNumber: number;
  timestamp: number;
  targetCandidateId: string;
  eventType: 'click' | 'keydown' | 'change' | 'submit';
  targetSelector?: string;
  bindingHandle?: BindingHandle;
  initiatingCapabilityId: string;
}

// Alias for first-class ActivationEvent entity
export type ActivationEvent = ActivationEventRecord;

export interface TransitionWitness {
  witnessId: string;
  witnessClass: WitnessClass;
  sequenceNumber: number;
  timestamp: number;
  observedDelta: Record<string, unknown>;
  correlatedActivationEventId: string | null;
  temporalDeltaMs: number; // witness.timestamp - activationEvent.timestamp
  isCausallyCorrelated: boolean;
  correlationExplanation: string;
}

export interface TransitionSignature {
  preStateFingerprint: string;
  activationEventExpected: {
    eventType: 'click' | 'keydown' | 'change' | 'submit';
  };
  expectedStateDelta: Record<string, unknown>;
  verificationWindowMs: number; // e.g. 1500ms
  postStateFingerprint: string;
}

export type CausalVerificationStatus =
  | 'VERIFIED'
  | 'FAILED_UNRELATED_MUTATION'
  | 'FAILED_PRE_EXISTING_STATE'
  | 'FAILED_WRONG_STATE_DELTA'
  | 'FAILED_MISSING_WITNESSES'
  | 'FAILED_INSUFFICIENT_WITNESS_CLASSES'
  | 'FAILED_WINDOW_TIMEOUT';

export interface CausalVerificationResult {
  signature: TransitionSignature;
  activationEvent: ActivationEventRecord;
  observedWitnesses: TransitionWitness[];
  verifiedWitnessClasses: WitnessClass[];
  status: CausalVerificationStatus;
  causallyVerified: boolean; // MUST be true only if temporal ordering + delta match + >=2 classes (or required min)
  durationMs: number;
  explanation: string;
}

/**
 * TransitionVerificationToken
 * Cryptographic / opaque token proving that causal transition verification passed.
 * Required by RouteManager to promote PROVISIONAL -> ACTIVE_VALIDATED.
 */
export interface TransitionVerificationToken {
  tokenId: string;
  routeId: string;
  capabilityId: string;
  activationEventId: string;
  verifiedWitnessClasses: WitnessClass[];
  issuedTimestamp: number;
  verifiedStatus: 'VERIFIED';
  signatureHash: string;
}

/**
 * ValidationRecord (Phase 21)
 * Complete trace of evaluation for candidate, transition, and authorization.
 */
export interface ValidationRecord {
  recordId: string;
  timestamp: number;
  candidateIdentity: string;
  candidateFingerprint: Partial<FunctionalCapabilityFingerprint>;
  capabilityId: string;
  interfaceStateId: string;
  typedDriftVector: TypedDriftVector | null;
  invariantResults: InvariantClosureResult | null;
  contradictionResults: Record<string, unknown>;
  rankingComponents: CandidateRebindScore | null;
  routeVersion: RouteVersion | null;
  activationEvent: ActivationEventRecord | null;
  transitionSignature: TransitionSignature | null;
  transitionWitnesses: TransitionWitness[];
  causalVerificationResult: CausalVerificationResult | null;
  promotionState: string;
  riskDecision: string;
  authorizationDecision: ExecutionAuthorizationDecision | null;
  finalOutcome: 'EXECUTED' | 'QUARANTINED' | 'DEMOTED' | 'ABSTAINED' | 'CONFIRMATION_PENDING' | 'FAILED';
}
