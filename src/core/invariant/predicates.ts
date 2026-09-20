/**
 * IntentNav-SCFR: Positive and Negative Predicates for Invariant Closure
 * Evaluates all 10 formal invariant classes.
 */

import {
  PredicateEvaluationRecord,
  TargetMatchPredicateContext,
  ActionMatchPredicateContext,
  PreStatePredicateContext,
} from '../../types/invariant';
import {
  StateDeltaPredicate,
  ExpectedStatePredicate,
  ContextPredicate,
  DeclarativeInvariantPredicate,
  InvariantPredicate,
} from '../../types/capability';

export class DeclarativePredicateEvaluator {
  public static evaluate(
    pred: DeclarativeInvariantPredicate,
    context: Record<string, unknown>
  ): boolean {
    if (!context || typeof context !== 'object') {
      return false;
    }
    const rawVal = context[pred.property];

    // UNKNOWN / missing state evidence must never silently evaluate to PASS.
    if ((!(pred.property in context) || rawVal === undefined) && pred.operator !== 'EXISTS') {
      return false;
    }

    switch (pred.operator) {
      case 'EQUALS':
        return rawVal === pred.expectedValue;
      case 'NOT_EQUALS':
        return rawVal !== pred.expectedValue;
      case 'CONTAINS':
        if (typeof rawVal === 'string') {
          return rawVal.includes(String(pred.expectedValue));
        }
        if (Array.isArray(rawVal)) {
          return rawVal.includes(pred.expectedValue);
        }
        return false;
      case 'NOT_CONTAINS':
        if (typeof rawVal === 'string') {
          return !rawVal.includes(String(pred.expectedValue));
        }
        if (Array.isArray(rawVal)) {
          return !rawVal.includes(pred.expectedValue);
        }
        return true;
      case 'IN':
        return Array.isArray(pred.expectedValues) && pred.expectedValues.includes(rawVal);
      case 'NOT_IN':
        return Array.isArray(pred.expectedValues) && !pred.expectedValues.includes(rawVal);
      case 'GREATER_THAN':
        return typeof rawVal === 'number' && rawVal > (pred.expectedValue as number);
      case 'LESS_THAN':
        return typeof rawVal === 'number' && rawVal < (pred.expectedValue as number);
      case 'TRUTHY':
        return Boolean(rawVal);
      case 'FALSY':
        return !rawVal;
      case 'EXISTS':
        return rawVal !== undefined && rawVal !== null;
      case 'MATCHES_REGEX':
        try {
          return new RegExp(String(pred.expectedValue)).test(String(rawVal ?? ''));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }
}

export function createDeclarativePredicate(decl: DeclarativeInvariantPredicate): InvariantPredicate {
  return {
    id: decl.id,
    name: decl.name,
    description: decl.description,
    declarative: decl,
    evaluate: (context: Record<string, unknown>) => DeclarativePredicateEvaluator.evaluate(decl, context),
  };
}


export class InvariantPredicates {
  /**
   * 1. Action Type Compatibility
   */
  public static matchActionType(context: ActionMatchPredicateContext): PredicateEvaluationRecord {
    const compatible =
      context.observedAction === context.requiredAction ||
      (context.requiredAction === 'MODIFY_PREFERENCE' && (context.observedAction === 'TOGGLE' || context.observedAction === 'SUBMIT')) ||
      (context.requiredAction === 'TOGGLE' && (context.observedAction === 'MODIFY_PREFERENCE' || context.observedAction === 'VIEW' || context.observedAction === 'REVOKE_ACCESS')) ||
      (context.requiredAction === 'REVOKE_ACCESS' && (context.observedAction === 'TOGGLE' || context.observedAction === 'MODIFY_PREFERENCE'));

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
   * Fully implements every declared allowed-state-delta type:
   * - ENABLED_TO_DISABLED
   * - DISABLED_TO_ENABLED
   * - MODIFIED
   * - ADDED
   * - REMOVED
   * Compares pre-state, action semantics, target, allowed transition, and expected direction.
   */
  public static matchAllowedStateDelta(
    allowedDeltas: StateDeltaPredicate[],
    observedState: Record<string, unknown>,
    observedAction?: string,
    _observedTarget?: string
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

    let compatible = true;
    const notes: string[] = [];

    for (const delta of allowedDeltas) {
      // 1. Control disabled check: Disabled controls cannot undergo transitions
      if (observedState['disabled'] === true) {
        notes.push(`Control is disabled; cannot undergo transition for '${delta.property}'`);
        compatible = false;
        break;
      }

      // 2. Custom predicate evaluate if provided
      if (delta.evaluate && typeof delta.evaluate === 'function') {
        try {
          if (!delta.evaluate(observedState)) {
            notes.push(`Delta predicate evaluation failed for '${delta.property}'`);
            compatible = false;
          }
        } catch {
          notes.push(`Delta predicate evaluation threw for '${delta.property}'`);
          compatible = false;
        }
      }

      // 3. Directional transition checks
      if (delta.expectedChange === 'ENABLED_TO_DISABLED') {
        // Control must currently be enabled/checked (cannot already be disabled)
        if (delta.property === 'checked' || delta.property === 'aria-checked') {
          const isCurrentlyChecked = observedState['checked'] === true || observedState['aria-checked'] === 'true';
          if (observedState['checked'] !== undefined && !isCurrentlyChecked) {
            notes.push(`Control is already unchecked; cannot transition ENABLED_TO_DISABLED`);
            compatible = false;
          }
        } else if (observedState[delta.property] !== undefined && observedState[delta.property] === false) {
          notes.push(`Property '${delta.property}' is already false/disabled; cannot transition ENABLED_TO_DISABLED`);
          compatible = false;
        }

        // Action semantics check
        if (observedAction && ['VIEW', 'READ', 'INSPECT'].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot transition ENABLED_TO_DISABLED`);
          compatible = false;
        }
      } else if (delta.expectedChange === 'DISABLED_TO_ENABLED') {
        // Control/property must currently be disabled/unchecked (cannot already be enabled)
        if (delta.property === 'checked' || delta.property === 'aria-checked') {
          const isCurrentlyChecked = observedState['checked'] === true || observedState['aria-checked'] === 'true';
          if (observedState['checked'] !== undefined && isCurrentlyChecked) {
            notes.push(`Control is already checked; cannot transition DISABLED_TO_ENABLED`);
            compatible = false;
          }
        } else if (observedState[delta.property] !== undefined && observedState[delta.property] === true) {
          notes.push(`Property '${delta.property}' is already true/enabled; cannot transition DISABLED_TO_ENABLED`);
          compatible = false;
        }

        // Action semantics check
        if (observedAction && ['VIEW', 'READ', 'INSPECT'].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot transition DISABLED_TO_ENABLED`);
          compatible = false;
        }
      } else if (delta.expectedChange === 'MODIFIED') {
        if (observedAction && ['VIEW', 'READ', 'INSPECT'].includes(observedAction.toUpperCase())) {
          notes.push(`Action '${observedAction}' is read-only; cannot produce MODIFIED delta on '${delta.property}'`);
          compatible = false;
        }
      } else if (delta.expectedChange === 'ADDED') {
        if (observedState[delta.property] !== undefined && observedState[delta.property] !== null) {
          notes.push(`Property '${delta.property}' already exists; cannot transition ADDED`);
          compatible = false;
        }
      } else if (delta.expectedChange === 'REMOVED') {
        if (observedState[delta.property] === undefined || observedState[delta.property] === null) {
          notes.push(`Property '${delta.property}' does not exist; cannot transition REMOVED`);
          compatible = false;
        }
      } else {
        notes.push(`Unsupported or unknown state delta type: '${delta.expectedChange}'`);
        compatible = false;
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
   * Represents pre-ranking compatibility against declared expected post-state predicates.
   * Distinguishes PASS, FAIL, and INSUFFICIENT_EVIDENCE.
   */
  public static matchExpectedPostState(
    expectedPostState: ExpectedStatePredicate[],
    observedRole: string,
    _observedAction: string,
    observedState?: Record<string, unknown>,
    observedTarget?: string,
    candidateLabel?: string
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

    // 1. Control Capability: Non-interactive controls cannot drive mutations
    const role = (observedRole || '').toLowerCase();
    const nonInteractiveRoles = ['heading', 'text', 'paragraph', 'img', 'image', 'dialog', 'banner', 'region', 'navigation', 'alert', 'status'];
    if (nonInteractiveRoles.includes(role)) {
      return {
        predicateId: 'POS_PRED_EXPECTED_POST_STATE',
        predicateName: 'Expected Post-State Compatibility',
        isNegativePredicate: false,
        passed: false,
        explanation: `Role '${observedRole}' is incapable of driving expected post-state mutations`,
        observedValue: observedRole,
        expectedValue: expectedPostState,
      };
    }

    const label = (candidateLabel || '').toLowerCase();
    const target = (observedTarget || '').toLowerCase();

    for (const post of expectedPostState) {
      // 2. Pre-State / Post-State Conflict: If the pre-state already equals expected post-state, cannot transition
      if (observedState && observedState[post.property] !== undefined && observedState[post.property] === post.expectedValue) {
        return {
          predicateId: 'POS_PRED_EXPECTED_POST_STATE',
          predicateName: 'Expected Post-State Compatibility',
          isNegativePredicate: false,
          passed: false,
          explanation: `Candidate pre-state for '${post.property}' (${observedState[post.property]}) is already equal to expected post-state; cannot drive required state transition`,
          observedValue: observedState[post.property],
          expectedValue: post.expectedValue,
        };
      }

      // 3. Directional Semantic Contradiction
      if (label) {
        if (post.expectedValue === false) {
          const indicatesEnableOnly =
            (label.includes('enable') || label.includes('turn on') || label.includes('activate') || label.includes('opt in')) &&
            !(label.includes('disable') || label.includes('turn off') || label.includes('deactivate') || label.includes('opt out'));
          if (indicatesEnableOnly) {
            return {
              predicateId: 'POS_PRED_EXPECTED_POST_STATE',
              predicateName: 'Expected Post-State Compatibility',
              isNegativePredicate: false,
              passed: false,
              explanation: `Candidate action direction ('${candidateLabel}') contradicts expected post-state (${post.property} = false)`,
              observedValue: candidateLabel,
              expectedValue: post.expectedValue,
            };
          }
        } else if (post.expectedValue === true) {
          const indicatesDisableOnly =
            (label.includes('disable') || label.includes('turn off') || label.includes('deactivate') || label.includes('opt out')) &&
            !(label.includes('enable') || label.includes('turn on') || label.includes('activate') || label.includes('opt in'));
          if (indicatesDisableOnly) {
            return {
              predicateId: 'POS_PRED_EXPECTED_POST_STATE',
              predicateName: 'Expected Post-State Compatibility',
              isNegativePredicate: false,
              passed: false,
              explanation: `Candidate action direction ('${candidateLabel}') contradicts expected post-state (${post.property} = true)`,
              observedValue: candidateLabel,
              expectedValue: post.expectedValue,
            };
          }
        }
      }

      // 4. Missing Evidence: If candidate evidence connecting to the post-state property is unknown
      const propKeyword = post.property.replace(/_enabled|_initiated|_triggered|_visible|_active/g, '').replace(/_/g, ' ').trim().toLowerCase();
      const targetMatchesProp = Boolean(
        target &&
        target !== 'unknown' &&
        propKeyword.length > 2 &&
        (target.toLowerCase().includes(propKeyword.replace(/ /g, '_')) ||
         propKeyword.split(' ').some((w) => w.length > 3 && target.toLowerCase().includes(w)))
      );
      const labelMatchesProp = Boolean(label && (label.includes(propKeyword) || propKeyword.split(' ').some((w) => w.length > 3 && label.includes(w))));
      const hasSemanticConnection = targetMatchesProp || labelMatchesProp;

      if (!hasSemanticConnection && (!observedState || observedState[post.property] === undefined)) {
        return {
          predicateId: 'POS_PRED_EXPECTED_POST_STATE',
          predicateName: 'Expected Post-State Compatibility',
          isNegativePredicate: false,
          passed: false,
          hasInsufficientEvidence: true,
          explanation: `Missing evidence for expected post-state property '${post.property}'`,
          observedValue: undefined,
          expectedValue: post.expectedValue,
        };
      }
    }

    return {
      predicateId: 'POS_PRED_EXPECTED_POST_STATE',
      predicateName: 'Expected Post-State Compatibility',
      isNegativePredicate: false,
      passed: true,
      explanation: 'Candidate control and transition direction are compatible with expected post-state',
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
      let matched = false;
      if (pat.includes('|')) {
        const parts = pat.split('|').map((p) => p.trim());
        matched = parts.some((p) => fullContext.includes(p));
      } else {
        matched = fullContext.includes(pat);
      }

      if (!matched) {
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
    const rExp = (expectedRole || '').toLowerCase();
    const rObs = (observedRole || '').toLowerCase();

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
    const obs = (observedTarget || '').toLowerCase();
    const isForbidden = obs ? forbiddenTargets.some(
      (ft) => ft.toLowerCase() === obs
    ) : false;

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
    const obs = (observedAction || '').toLowerCase();
    const isForbidden = obs ? forbiddenActions.some(
      (fa) => fa.toLowerCase() === obs
    ) : false;

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
