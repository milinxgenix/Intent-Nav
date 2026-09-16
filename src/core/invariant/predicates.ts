/**
 * IntentNav-SCFR: Positive and Negative Predicates for Invariant Closure
 * Evaluates all 10 formal invariant classes.
 */

import {
  PredicateEvaluationRecord,
  TargetMatchPredicateContext,
  ActionMatchPredicateContext,
  PreStatePredicateContext,
  PostStatePredicateContext,
} from '../../types/invariant';
import { StateDeltaPredicate, ExpectedStatePredicate, ContextPredicate } from '../../types/capability';

export class InvariantPredicates {
  /**
   * 1. Action Type Compatibility
   */
  public static matchActionType(context: ActionMatchPredicateContext): PredicateEvaluationRecord {
    const compatible =
      context.observedAction === context.requiredAction ||
      (context.requiredAction === 'MODIFY_PREFERENCE' && (context.observedAction === 'TOGGLE' || context.observedAction === 'SUBMIT')) ||
      (context.requiredAction === 'TOGGLE' && (context.observedAction === 'MODIFY_PREFERENCE' || context.observedAction === 'VIEW'));

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
   * 2. Target Entity Match
   */
  public static matchTargetEntity(context: TargetMatchPredicateContext): PredicateEvaluationRecord {
    const observedTarget = (context.observedTargetEntity || '').trim().toLowerCase();
    const target = (context.targetEntity || '').trim().toLowerCase();

    let passed = false;
    if (observedTarget && observedTarget !== 'unknown') {
      passed = observedTarget === target;
    } else {
      const label = (context.observedLabel || '').toLowerCase();
      passed =
        (target === 'marketing_notifications' && label.includes('marketing')) ||
        (target === 'two_factor_auth' && (label.includes('2fa') || label.includes('multi-factor') || label.includes('mfa'))) ||
        (target === 'personal_data_export' && (label.includes('export') || label.includes('download')));
    }

    return {
      predicateId: 'POS_PRED_TARGET_ENTITY',
      predicateName: 'Target Entity Match',
      isNegativePredicate: false,
      passed,
      explanation: passed
        ? `Target entity matched: ${context.targetEntity}`
        : `Target mismatch! Expected '${context.targetEntity}', but observed candidate targets '${context.observedTargetEntity || 'unknown'}'`,
      observedValue: context.observedTargetEntity,
      expectedValue: context.targetEntity,
    };
  }

  /**
   * 3. Mandatory Pre-State Verification
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
   * 4. Allowed State Delta Compatibility
   */
  public static matchAllowedStateDelta(
    allowedDeltas: StateDeltaPredicate[],
    observedState: Record<string, unknown>
  ): PredicateEvaluationRecord {
    if (allowedDeltas.length === 0) {
      return {
        predicateId: 'POS_PRED_STATE_DELTA',
        predicateName: 'Allowed State Delta Compatibility',
        isNegativePredicate: false,
        passed: true,
        explanation: 'No state delta constraints declared; conditionally compatible',
      };
    }

    // Check that observed control is capable of undergoing the expected transition
    // E.g. If expected change is ENABLED_TO_DISABLED, control must currently be checked/enabled
    let compatible = true;
    const notes: string[] = [];

    for (const delta of allowedDeltas) {
      if (delta.expectedChange === 'ENABLED_TO_DISABLED') {
        const isCurrentlyChecked = observedState['checked'] === true || observedState['aria-checked'] === 'true';
        if (observedState['checked'] !== undefined && !isCurrentlyChecked) {
          // If it is already disabled, toggle might be opposite
          notes.push(`Control is already unchecked; cannot transition ENABLED_TO_DISABLED`);
          compatible = false;
        }
      }
    }

    return {
      predicateId: 'POS_PRED_STATE_DELTA',
      predicateName: 'Allowed State Delta Compatibility',
      isNegativePredicate: false,
      passed: compatible,
      explanation: compatible
        ? 'Allowed state delta compatible with current control state'
        : `State delta incompatible: ${notes.join('; ')}`,
      observedValue: observedState,
      expectedValue: allowedDeltas,
    };
  }

  /**
   * 5. Expected Post-State Compatibility
   */
  public static matchExpectedPostState(
    expectedPostState: ExpectedStatePredicate[],
    observedRole: string,
    observedAction: string
  ): PredicateEvaluationRecord {
    if (expectedPostState.length === 0) {
      return {
        predicateId: 'POS_PRED_EXPECTED_POST_STATE',
        predicateName: 'Expected Post-State Compatibility',
        isNegativePredicate: false,
        passed: true,
        explanation: 'No explicit post-state predicates required',
      };
    }

    // Verify control type can achieve expected post-state
    const isInteractive = ['button', 'switch', 'link', 'input', 'select', 'a'].includes(observedRole.toLowerCase());
    return {
      predicateId: 'POS_PRED_EXPECTED_POST_STATE',
      predicateName: 'Expected Post-State Compatibility',
      isNegativePredicate: false,
      passed: isInteractive,
      explanation: isInteractive
        ? 'Candidate control is capable of driving expected post-state mutations'
        : `Role '${observedRole}' is incapable of driving expected post-state mutations`,
      observedValue: observedRole,
      expectedValue: expectedPostState,
    };
  }

  /**
   * 6. Required Context Predicates
   */
  public static matchRequiredContext(
    requiredContext: ContextPredicate[],
    ancestors: string[],
    containerSemantics: string[],
    nearbyText: string[]
  ): PredicateEvaluationRecord {
    if (requiredContext.length === 0) {
      return {
        predicateId: 'POS_PRED_REQUIRED_CONTEXT',
        predicateName: 'Required Context Verification',
        isNegativePredicate: false,
        passed: true,
        explanation: 'No required context predicates defined',
      };
    }

    const fullContext = [...ancestors, ...containerSemantics, ...nearbyText].join(' ').toLowerCase();
    let passed = true;
    const missing: string[] = [];

    for (const ctx of requiredContext) {
      const pat = ctx.pattern.toLowerCase();
      if (!fullContext.includes(pat)) {
        if (ctx.required) {
          passed = false;
          missing.push(ctx.pattern);
        }
      }
    }

    return {
      predicateId: 'POS_PRED_REQUIRED_CONTEXT',
      predicateName: 'Required Context Verification',
      isNegativePredicate: false,
      passed,
      explanation: passed
        ? 'All required context predicates satisfied'
        : `Missing required context patterns: ${missing.join(', ')}`,
      observedValue: fullContext.slice(0, 100),
      expectedValue: requiredContext.map((c) => c.pattern),
    };
  }

  /**
   * 7. Forbidden Context Predicates (Negative Predicate)
   */
  public static rejectForbiddenContext(
    forbiddenContext: ContextPredicate[],
    ancestors: string[],
    containerSemantics: string[],
    candidateLabel: string
  ): PredicateEvaluationRecord {
    if (forbiddenContext.length === 0) {
      return {
        predicateId: 'NEG_PRED_FORBIDDEN_CONTEXT',
        predicateName: 'Forbidden Context Rejection',
        isNegativePredicate: true,
        passed: true,
        explanation: 'No forbidden context predicates defined',
      };
    }

    const fullContext = [...ancestors, ...containerSemantics, candidateLabel].join(' ').toLowerCase();
    let foundForbidden: string | null = null;

    for (const ctx of forbiddenContext) {
      if (fullContext.includes(ctx.pattern.toLowerCase())) {
        foundForbidden = ctx.pattern;
        break;
      }
    }

    return {
      predicateId: 'NEG_PRED_FORBIDDEN_CONTEXT',
      predicateName: 'Forbidden Context Rejection',
      isNegativePredicate: true,
      passed: foundForbidden === null,
      explanation: foundForbidden
        ? `CONTRADICTION: Candidate matches forbidden context pattern '${foundForbidden}'`
        : 'No forbidden context patterns matched',
      observedValue: fullContext.slice(0, 100),
      expectedValue: 'No forbidden matches',
    };
  }

  /**
   * 8. Role / Control Compatibility
   */
  public static matchRoleCompatibility(
    expectedRole: string,
    observedRole: string
  ): PredicateEvaluationRecord {
    const rExp = expectedRole.toLowerCase();
    const rObs = observedRole.toLowerCase();

    const compatible =
      rExp === rObs ||
      (rExp === 'switch' && (rObs === 'button' || rObs === 'checkbox' || rObs === 'input')) ||
      (rExp === 'button' && (rObs === 'switch' || rObs === 'link' || rObs === 'a'));

    return {
      predicateId: 'POS_PRED_ROLE_COMPATIBILITY',
      predicateName: 'Control Role Compatibility',
      isNegativePredicate: false,
      passed: compatible,
      explanation: compatible
        ? `Observed role '${observedRole}' is compatible with expected '${expectedRole}'`
        : `Role mismatch: expected '${expectedRole}', observed '${observedRole}'`,
      observedValue: observedRole,
      expectedValue: expectedRole,
    };
  }

  /**
   * 9. Transition Compatibility
   */
  public static matchTransitionCompatibility(
    observedState: Record<string, unknown>
  ): PredicateEvaluationRecord {
    const disabled = observedState['disabled'] === true;
    return {
      predicateId: 'POS_PRED_TRANSITION_COMPATIBILITY',
      predicateName: 'Transition Compatibility (Interactive State)',
      isNegativePredicate: false,
      passed: !disabled,
      explanation: !disabled
        ? 'Control is interactive and enabled for transition activation'
        : 'Control is disabled; cannot drive transition',
      observedValue: { disabled },
    };
  }

  /**
   * 10. Forbidden Target / Negative Evidence Rejection
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
      passed: !isForbidden,
      explanation: isForbidden
        ? `CONTRADICTION: Candidate targets forbidden entity '${observedTarget}'`
        : `Target '${observedTarget}' is not in forbidden list`,
      observedValue: observedTarget,
      expectedValue: 'Allowed target entities',
    };
  }

  /**
   * Rejection of forbidden actions (e.g. destructive action when preference modification expected)
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
        ? `CONTRADICTION: Candidate performs forbidden destructive action '${observedAction}'`
        : `Action '${observedAction}' is not forbidden`,
      observedValue: observedAction,
      expectedValue: 'Non-forbidden actions',
    };
  }
}
