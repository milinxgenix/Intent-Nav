/**
 * IntentNav-SCFR: Invariant Closure Engine
 * Evaluates mandatory functional invariants and hard gates.
 * Invariant Rule: Non-passing candidates can NEVER become eligible for ranking.
 */

import {
  InvariantClosureResult,
  InvariantEvaluationStatus,
  PredicateEvaluationRecord,
} from '../../types/invariant';
import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { InvariantPredicates } from './predicates';

export interface CandidateEvaluationContext {
  candidateId: string;
  candidateLabel: string;
  observedActionType: string;
  observedTargetEntity: string;
  observedRole: string;
  observedState?: Record<string, unknown>;
  ancestors?: string[];
  containerSemantics?: string[];
  isDecoyFlag?: boolean;
}

export class InvariantClosureEngine {
  /**
   * Evaluates all positive and negative predicates against a candidate
   */
  public static evaluateCandidate(
    targetFingerprint: FunctionalCapabilityFingerprint,
    candidate: CandidateEvaluationContext
  ): InvariantClosureResult {
    const passedPredicates: PredicateEvaluationRecord[] = [];
    const failedPredicates: PredicateEvaluationRecord[] = [];

    // 1. Positive Predicate: Target Entity Match
    const targetMatch = InvariantPredicates.matchTargetEntity({
      targetEntity: targetFingerprint.targetEntity,
      observedTargetEntity: candidate.observedTargetEntity,
      observedLabel: candidate.candidateLabel,
      observedRole: candidate.observedRole,
    });
    if (targetMatch.passed) {
      passedPredicates.push(targetMatch);
    } else {
      failedPredicates.push(targetMatch);
    }

    // 2. Positive Predicate: Action Type Match
    const actionMatch = InvariantPredicates.matchActionType({
      requiredAction: targetFingerprint.actionType,
      observedAction: candidate.observedActionType as any,
    });
    if (actionMatch.passed) {
      passedPredicates.push(actionMatch);
    } else {
      failedPredicates.push(actionMatch);
    }

    // 3. Positive Predicate: Pre-State Verification
    if (targetFingerprint.mandatoryPreStatePredicates.length > 0 && candidate.observedState) {
      for (const pred of targetFingerprint.mandatoryPreStatePredicates) {
        let passed = false;
        try {
          passed = pred.evaluate(candidate.observedState);
        } catch {
          passed = false;
        }
        const record: PredicateEvaluationRecord = {
          predicateId: pred.id,
          predicateName: pred.name,
          isNegativePredicate: false,
          passed,
          explanation: passed
            ? `Pre-state predicate '${pred.name}' satisfied`
            : `Pre-state predicate '${pred.name}' failed: ${pred.description}`,
          observedValue: candidate.observedState,
        };
        if (passed) {
          passedPredicates.push(record);
        } else {
          failedPredicates.push(record);
        }
      }
    }

    // 4. Negative Predicate: Forbidden Target Entities
    const forbiddenTargets = ['ALL_NOTIFICATIONS', 'DELETE_ACCOUNT', 'SYSTEM_ROOT', 'GLOBAL_SETTINGS'];
    // If target fingerprint is specific to MARKETING, ALL_NOTIFICATIONS is forbidden
    if (targetFingerprint.targetEntity === 'MARKETING_NOTIFICATIONS') {
      forbiddenTargets.push('ALL_NOTIFICATIONS', 'ACCOUNT_NOTIFICATIONS', 'SECURITY_ALERTS');
    }
    const forbiddenTargetCheck = InvariantPredicates.rejectForbiddenTarget(
      candidate.observedTargetEntity,
      forbiddenTargets
    );
    if (forbiddenTargetCheck.passed) {
      passedPredicates.push(forbiddenTargetCheck);
    } else {
      failedPredicates.push(forbiddenTargetCheck);
    }

    // 5. Negative Predicate: Forbidden Destructive Actions for non-destructive goals
    if (targetFingerprint.actionType !== 'DELETE') {
      const forbiddenActions = ['DELETE', 'ERASE', 'PURGE', 'NUKE'];
      if (targetFingerprint.actionType !== 'DEACTIVATE_ACCOUNT') {
        forbiddenActions.push('DEACTIVATE_ACCOUNT');
      }
      const forbiddenActionCheck = InvariantPredicates.rejectForbiddenAction(
        candidate.observedActionType,
        forbiddenActions
      );
      if (forbiddenActionCheck.passed) {
        passedPredicates.push(forbiddenActionCheck);
      } else {
        failedPredicates.push(forbiddenActionCheck);
      }
    }

    // Determine status
    let status: InvariantEvaluationStatus = 'PASS';
    let isEligibleForRanking = true;
    let rejectionReason: string | undefined;

    const hasContradiction = failedPredicates.some((p) => p.isNegativePredicate);
    if (hasContradiction) {
      status = 'CONTRADICTED';
      isEligibleForRanking = false;
      rejectionReason = failedPredicates
        .filter((p) => p.isNegativePredicate)
        .map((p) => p.explanation)
        .join('; ');
    } else if (failedPredicates.length > 0) {
      status = 'FAIL';
      isEligibleForRanking = false;
      rejectionReason = failedPredicates.map((p) => p.explanation).join('; ');
    }

    return {
      candidateId: candidate.candidateId,
      status,
      isEligibleForRanking, // MUST be false if status !== 'PASS'
      passedPredicates,
      failedPredicates,
      rejectionReason,
      evaluatedTimestamp: Date.now(),
    };
  }
}

