/**
 * IntentNav-SCFR: Invariant Closure Engine
 *
 * Evaluates all 10 formal invariant classes.
 * Hard Invariant Precedence Rule:
 * No candidate can enter ranking unless status === 'PASS' AND isEligibleForRanking === true.
 * If required evidence is missing, returns INSUFFICIENT_EVIDENCE (never silent PASS).
 * Evaluates the fingerprint's authoritative forbidden predicates rather than hardcoded heuristics.
 */

import {
  InvariantClosureResult,
  InvariantEvaluationStatus,
  PredicateEvaluationRecord,
} from '../../types/invariant';
import { FunctionalCapabilityFingerprint, BindingHandle } from '../../types/capability';
import { InvariantPredicates } from './predicates';

export interface CandidateEvaluationContext {
  candidateId: string;
  candidateLabel: string;
  observedActionType: string;
  observedTargetEntity: string;
  observedRole: string;
  role?: string;
  tagName?: string;
  accessibleName?: string;
  domStructuralPath?: string;
  observedState?: Record<string, unknown>;
  ancestors?: string[];
  containerSemantics?: string[];
  nearbyText?: string[];
  isDecoyFlag?: boolean;
  bindingHandle?: BindingHandle;
  candidateFingerprintHash?: string;
}

export class InvariantClosureEngine {
  /**
   * Evaluates all 10 invariant classes against an observed candidate
   */
  public static evaluateCandidate(
    targetFingerprint: FunctionalCapabilityFingerprint,
    candidate: CandidateEvaluationContext
  ): InvariantClosureResult {
    const passedPredicates: PredicateEvaluationRecord[] = [];
    const failedPredicates: PredicateEvaluationRecord[] = [];
    let hasInsufficientEvidence = false;
    let insufficientReason = '';

    const ancestors = candidate.ancestors || [];
    const containerSemantics = candidate.containerSemantics || [];
    const nearbyText = candidate.nearbyText || [];
    const observedState = candidate.observedState || {};

    // 1. Action Type Compatibility
    const actionMatch = InvariantPredicates.matchActionType({
      requiredAction: targetFingerprint.actionType,
      observedAction: candidate.observedActionType as any,
    });
    if (actionMatch.passed) passedPredicates.push(actionMatch);
    else failedPredicates.push(actionMatch);

    // 2. Target Entity Match
    const targetMatch = InvariantPredicates.matchTargetEntity({
      targetEntity: targetFingerprint.targetEntity,
      observedTargetEntity: candidate.observedTargetEntity,
      observedLabel: candidate.candidateLabel,
      observedRole: candidate.observedRole,
    });
    if (targetMatch.passed) passedPredicates.push(targetMatch);
    else failedPredicates.push(targetMatch);

    // 3. Mandatory Pre-State Predicates
    if (targetFingerprint.mandatoryPreStatePredicates.length > 0) {
      if (!candidate.observedState || Object.keys(candidate.observedState).length === 0) {
        hasInsufficientEvidence = true;
        insufficientReason = 'Candidate observedState is missing for mandatory pre-state verification';
      } else {
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
          if (passed) passedPredicates.push(record);
          else failedPredicates.push(record);
        }
      }
    }

    // 4. Allowed State Delta Compatibility
    const deltaCheck = InvariantPredicates.matchAllowedStateDelta(
      targetFingerprint.allowedStateDelta || [],
      observedState
    );
    if (deltaCheck.passed) passedPredicates.push(deltaCheck);
    else failedPredicates.push(deltaCheck);

    // 5. Expected Post-State Compatibility
    const postStateCheck = InvariantPredicates.matchExpectedPostState(
      targetFingerprint.expectedPostState || [],
      candidate.observedRole,
      candidate.observedActionType
    );
    if (postStateCheck.passed) passedPredicates.push(postStateCheck);
    else failedPredicates.push(postStateCheck);

    // 6. Required Context Predicates
    const reqContextCheck = InvariantPredicates.matchRequiredContext(
      targetFingerprint.requiredContextPredicates || [],
      ancestors,
      containerSemantics,
      nearbyText
    );
    if (reqContextCheck.passed) passedPredicates.push(reqContextCheck);
    else failedPredicates.push(reqContextCheck);

    // 7. Forbidden Context Predicates (From Fingerprint)
    const forbiddenContextCheck = InvariantPredicates.rejectForbiddenContext(
      targetFingerprint.forbiddenContextPredicates || [],
      ancestors,
      containerSemantics,
      candidate.candidateLabel
    );
    if (forbiddenContextCheck.passed) passedPredicates.push(forbiddenContextCheck);
    else failedPredicates.push(forbiddenContextCheck);

    // 8. Role / Control Compatibility
    const roleCheck = InvariantPredicates.matchRoleCompatibility(
      targetFingerprint.semanticEvidence.role || 'button',
      candidate.observedRole || candidate.role || ''
    );
    if (roleCheck.passed) passedPredicates.push(roleCheck);
    else failedPredicates.push(roleCheck);

    // 9. Transition Compatibility (interactive enabled state)
    const transCheck = InvariantPredicates.matchTransitionCompatibility(observedState);
    if (transCheck.passed) passedPredicates.push(transCheck);
    else failedPredicates.push(transCheck);

    // 10. Negative Evidence & Forbidden Targets
    const forbiddenTargets: string[] = [];
    if (targetFingerprint.negativeEvidence?.rejectedCandidateIdentities) {
      forbiddenTargets.push(...targetFingerprint.negativeEvidence.rejectedCandidateIdentities);
    }
    // Check if target entity contradicts fingerprint
    if (
      targetFingerprint.targetEntity !== 'ALL_NOTIFICATIONS' &&
      candidate.observedTargetEntity === 'ALL_NOTIFICATIONS'
    ) {
      forbiddenTargets.push('ALL_NOTIFICATIONS');
    }
    if (
      targetFingerprint.targetEntity !== 'ALL_SECURITY' &&
      candidate.observedTargetEntity === 'ALL_SECURITY'
    ) {
      forbiddenTargets.push('ALL_SECURITY');
    }
    if (
      targetFingerprint.targetEntity !== 'ALL_DATA' &&
      candidate.observedTargetEntity === 'ALL_DATA'
    ) {
      forbiddenTargets.push('ALL_DATA');
    }
    const forbiddenTargetCheck = InvariantPredicates.rejectForbiddenTarget(
      candidate.observedTargetEntity,
      forbiddenTargets
    );
    if (forbiddenTargetCheck.passed) passedPredicates.push(forbiddenTargetCheck);
    else failedPredicates.push(forbiddenTargetCheck);

    // 11. Forbidden Actions (e.g. destructive action on reversible goal)
    const forbiddenActions: string[] = [];
    if (targetFingerprint.actionType !== 'DELETE') {
      forbiddenActions.push('DELETE', 'PURGE', 'DESTROY');
    }
    if (
      targetFingerprint.actionType !== 'REVOKE_ACCESS' &&
      targetFingerprint.actionType !== 'TOGGLE'
    ) {
      forbiddenActions.push('REVOKE_ACCESS');
    }
    const forbiddenActionCheck = InvariantPredicates.rejectForbiddenAction(
      candidate.observedActionType,
      forbiddenActions
    );
    if (forbiddenActionCheck.passed) passedPredicates.push(forbiddenActionCheck);
    else failedPredicates.push(forbiddenActionCheck);

    // Determine Final Status
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
    } else if (hasInsufficientEvidence) {
      status = 'INSUFFICIENT_EVIDENCE';
      isEligibleForRanking = false;
      rejectionReason = insufficientReason;
    } else if (failedPredicates.length > 0) {
      status = 'FAIL';
      isEligibleForRanking = false;
      rejectionReason = failedPredicates.map((p) => p.explanation).join('; ');
    }

    return {
      candidateId: candidate.candidateId,
      status,
      isEligibleForRanking, // Strictly false if status !== 'PASS'
      passedPredicates,
      failedPredicates,
      rejectionReason,
      evaluatedTimestamp: Date.now(),
    };
  }
}
