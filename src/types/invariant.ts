/**
 * IntentNav-SCFR: Invariant Closure and Hard Gate Types
 * Strict Ordering: Candidates -> Invariant Closure -> Contradiction Rejection -> Ranking
 */

import { ActionType, TargetEntity } from './capability';

export type InvariantEvaluationStatus =
  | 'PASS'
  | 'FAIL'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE';

export interface PredicateEvaluationRecord {
  predicateId: string;
  predicateName: string;
  isNegativePredicate: boolean;
  passed: boolean;
  explanation: string;
  observedValue?: unknown;
  expectedValue?: unknown;
  hasInsufficientEvidence?: boolean;
}

export interface InvariantClosureResult {
  candidateId: string;
  status: InvariantEvaluationStatus;
  isEligibleForRanking: boolean; // MUST be false if status !== 'PASS'
  passedPredicates: PredicateEvaluationRecord[];
  failedPredicates: PredicateEvaluationRecord[];
  rejectionReason?: string;
  evaluatedTimestamp: number;
}

export interface TargetMatchPredicateContext {
  targetEntity: TargetEntity;
  observedTargetEntity: TargetEntity;
  observedLabel: string;
  observedRole: string;
}

export interface ActionMatchPredicateContext {
  requiredAction: ActionType;
  observedAction: ActionType;
}

export interface PreStatePredicateContext {
  observedState: Record<string, unknown>;
  requiredState: Record<string, unknown>;
}

export interface PostStatePredicateContext {
  expectedState: Record<string, unknown>;
  observedDelta: Record<string, unknown>;
}

