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
import { RouteVersion, InterfaceStateNode } from './state';
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
  key?: string;
  code?: string;
  keyCode?: number;
}

// Alias for first-class ActivationEvent entity
export type ActivationEvent = ActivationEventRecord;

export interface WitnessProvenance {
  origin: string; // e.g. 'MutationObserver:attributes:aria-checked', 'NetworkInterceptor:response', 'HistoryAPI:popstate'
  observerId?: string;
  channel?: string;
  sourceFile?: string;
  sequenceId?: number;
  observedAt?: number;
}

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
  source?: string;
  targetInfo?: string;

  // Step 4 raw evidence enhancements:
  observationType?: string; // e.g. 'DOM_ATTRIBUTE_CHANGE', 'CHILD_LIST_MUTATION', 'ASYNC_ACK', 'APPLICATION_STATE'
  rawObservation?: Record<string, unknown>; // Unprocessed raw event data preserved for independent interpretation
  routeId?: string; // bound route ID
  capabilityId?: string; // bound capability ID
  provenance?: WitnessProvenance;
  eventSequenceId?: string;
}

export interface ObservedPostState {
  postStateFingerprint: string;
  observedApplicationState?: Record<string, unknown>;
  observedStateNode?: Partial<InterfaceStateNode> | Record<string, unknown> | null;
  observedTimestamp: number;
  activationEventId: string;
  routeId: string;
  capabilityId: string;
  isObserved: boolean; // Must be true, establishing genuine observation rather than predicted/caller-supplied
  observationSource: string; // e.g. 'ExecutionDispatcher:observePostState', 'BrowserObserver:InterfaceState'
}

export interface TransitionSignature {
  preStateFingerprint: string;
  activationEventExpected: {
    eventType: 'click' | 'keydown' | 'change' | 'submit';
    key?: string;
    code?: string;
    keyCode?: number;
  };
  expectedStateDelta: Record<string, unknown>;
  verificationWindowMs: number; // e.g. 1500ms
  postStateFingerprint: string;
}

export type CausalFailureReason =
  | 'activation_missing'
  | 'witness_missing'
  | 'outside_window'
  | 'wrong_direction'
  | 'contradictory_witness'
  | 'stale_witness'
  | 'invalid_transition'
  | 'insufficient_independence'
  | 'post_state_mismatch'
  | 'causal_relation_unproven'
  | 'insufficient_evidence';

export type CausalVerificationStatus =
  | 'VERIFIED'
  | 'FAILED_UNRELATED_MUTATION'
  | 'FAILED_PRE_EXISTING_STATE'
  | 'FAILED_WRONG_STATE_DELTA'
  | 'FAILED_MISSING_WITNESSES'
  | 'FAILED_INSUFFICIENT_WITNESS_CLASSES'
  | 'FAILED_WINDOW_TIMEOUT'
  | 'FAILED_CONTRADICTORY_WITNESS'
  | 'FAILED_POST_STATE_MISMATCH'
  | 'FAILED_ACTIVATION_MISSING'
  | 'FAILED_INSUFFICIENT_CORRELATION';

export type WitnessCausalCategory =
  | 'PRE_EXISTING'
  | 'TIMED_OUT'
  | 'UNRELATED'
  | 'RELEVANT'
  | 'CAUSALLY_VALID';

export interface ClassifiedWitnessRecord {
  witness: TransitionWitness;
  category: WitnessCausalCategory;
  reason: string;
}

export interface CausalVerificationResult {
  signature: TransitionSignature;
  activationEvent: ActivationEventRecord;
  observedWitnesses: TransitionWitness[];
  classifiedWitnesses?: ClassifiedWitnessRecord[];
  verifiedWitnessClasses: WitnessClass[];
  status: CausalVerificationStatus;
  failureReason?: CausalFailureReason;
  causallyVerified: boolean; // MUST be true only if temporal ordering + delta match + >=2 classes (or required min)
  durationMs: number;
  explanation: string;
  verificationToken?: TransitionVerificationToken;
  observedPostState?: ObservedPostState;
  observedPostStateFingerprint?: string;
}

/**
 * TransitionVerificationToken
 * Cryptographically authenticated token (HMAC-SHA-256) proving that causal transition
 * verification passed for a specific routeId, capabilityId, activationEventId,
 * transitionSignature, and independent witness quorum.
 * Required by RouteManager to promote PROVISIONAL -> ACTIVE_VALIDATED.
 */
export interface TransitionVerificationToken {
  tokenId: string;
  routeId: string;
  capabilityId: string;
  capabilityFingerprintHash?: string;
  activationEventId: string;
  verifiedWitnessClasses: WitnessClass[];
  transitionSignature?: TransitionSignature;
  transitionBinding?: string;
  witnessDigest?: string;
  witnessEvidenceHash?: string;
  issuedTimestamp: number;
  verifiedStatus: 'VERIFIED';
  algorithm?: 'HMAC-SHA-256';
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

export type AcknowledgementStatus =
  | 'COMPLETED'
  | 'REJECTED'
  | 'TIMEOUT'
  | 'ERROR'
  | 'UNAVAILABLE';

export type AcknowledgementChannel =
  | 'FETCH_RESPONSE'
  | 'XHR_RESPONSE'
  | 'WEBSOCKET_ACK'
  | 'CUSTOM_ACK_EVENT'
  | 'LOCAL_HTTP_MOCK';

export interface AcknowledgementRecord {
  acknowledgementId: string;
  operation: string;
  status: AcknowledgementStatus;
  timestamp: number;
  activationEventId: string;
  routeId: string;
  capabilityId: string;
  sourceChannel: AcknowledgementChannel;
  payloadHash?: string;
  latencyMs?: number;
  rawPayload?: Record<string, unknown>;
  verified: boolean;
  rejectionReason?: string;
}

export interface RollbackVerificationOutcome {
  rollbackAttempted: boolean;
  restoredRouteId: string | null;
  status: 'ROLLBACK_VERIFIED' | 'ROLLBACK_PARTIAL' | 'ROLLBACK_UNAVAILABLE' | 'ROLLBACK_FAILED';
  invariantsPassed: boolean;
  explanation: string;
  timestamp: number;
}
