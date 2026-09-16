/**
 * IntentNav-SCFR: Positive and Negative Predicates for Invariant Closure
 */

import {
  PredicateEvaluationRecord,
  TargetMatchPredicateContext,
  ActionMatchPredicateContext,
  PreStatePredicateContext,
} from '../../types/invariant';

export class InvariantPredicates {
  /**
   * Positive Predicate: Target entity must match canonical target
   */
  public static matchTargetEntity(context: TargetMatchPredicateContext): PredicateEvaluationRecord {
    const passed = context.observedTargetEntity === context.targetEntity;
    return {
      predicateId: 'POS_PRED_TARGET_ENTITY',
      predicateName: 'Target Entity Match',
      isNegativePredicate: false,
      passed,
      explanation: passed
        ? `Target entity matched: ${context.targetEntity}`
        : `Target mismatch! Expected '${context.targetEntity}', but observed candidate targets '${context.observedTargetEntity}'`,
      observedValue: context.observedTargetEntity,
      expectedValue: context.targetEntity,
    };
  }

  /**
   * Positive Predicate: Action type must be functionally compatible
   */
  public static matchActionType(context: ActionMatchPredicateContext): PredicateEvaluationRecord {
    // Check compatibility (e.g. MODIFY_PREFERENCE and TOGGLE are compatible)
    const compatible =
      context.observedAction === context.requiredAction ||
      (context.requiredAction === 'MODIFY_PREFERENCE' && context.observedAction === 'TOGGLE') ||
      (context.requiredAction === 'TOGGLE' && context.observedAction === 'MODIFY_PREFERENCE');

    return {
      predicateId: 'POS_PRED_ACTION_TYPE',
      predicateName: 'Action Type Compatibility',
      isNegativePredicate: false,
      passed: compatible,
      explanation: compatible
        ? `Action type '${context.observedAction}' is compatible with '${context.requiredAction}'`
        : `Action mismatch! Expected '${context.requiredAction}', got '${context.observedAction}'`,
      observedValue: context.observedAction,
      expectedValue: context.requiredAction,
    };
  }

  /**
   * Positive Predicate: Pre-state must satisfy mandatory conditions (e.g. control is interactive)
   */
  public static matchPreState(context: PreStatePredicateContext): PredicateEvaluationRecord {
    let passed = true;
    const reasons: string[] = [];

    for (const [key, expected] of Object.entries(context.requiredState)) {
      const observed = context.observedState[key];
      if (observed !== expected) {
        passed = false;
        reasons.push(`State '${key}': expected '${expected}', found '${observed}'`);
      }
    }

    return {
      predicateId: 'POS_PRED_PRE_STATE',
      predicateName: 'Mandatory Pre-State Verification',
      isNegativePredicate: false,
      passed,
      explanation: passed
        ? 'All mandatory pre-state predicates satisfied'
        : `Pre-state mismatch: ${reasons.join('; ')}`,
      observedValue: context.observedState,
      expectedValue: context.requiredState,
    };
  }

  /**
   * Negative Predicate: Rejects candidate if targeting forbidden/destructive entity
   */
  public static rejectForbiddenTarget(
    observedTarget: string,
    forbiddenTargets: string[]
  ): PredicateEvaluationRecord {
    const isForbidden = forbiddenTargets.some(
      (ft) => ft.toLowerCase() === observedTarget.toLowerCase()
    );

    return {
      predicateId: 'NEG_PRED_FORBIDDEN_TARGET',
      predicateName: 'Forbidden Target Rejection',
      isNegativePredicate: true,
      passed: !isForbidden, // passes if NOT forbidden
      explanation: isForbidden
        ? `CONTRADICTION: Candidate targets forbidden entity '${observedTarget}'`
        : `Target '${observedTarget}' is not in forbidden list`,
      observedValue: observedTarget,
      expectedValue: `NOT in [${forbiddenTargets.join(', ')}]`,
    };
  }

  /**
   * Negative Predicate: Rejects candidate if action is destructive when goal is reversible
   */
  public static rejectForbiddenAction(
    observedAction: string,
    forbiddenActions: string[]
  ): PredicateEvaluationRecord {
    const isForbidden = forbiddenActions.some(
      (fa) => fa.toLowerCase() === observedAction.toLowerCase()
    );

    return {
      predicateId: 'NEG_PRED_FORBIDDEN_ACTION',
      predicateName: 'Forbidden Action Rejection',
      isNegativePredicate: true,
      passed: !isForbidden,
      explanation: isForbidden
        ? `CONTRADICTION: Action '${observedAction}' is forbidden for this operation`
        : `Action '${observedAction}' is permitted`,
      observedValue: observedAction,
      expectedValue: `NOT in [${forbiddenActions.join(', ')}]`,
    };
  }
}

