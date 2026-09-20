/**
 * IntentNav-SCFR: Controlled Failure Injection Framework
 * Injects synthetic failure modes to scientifically verify safety and error handling
 */

import { TransitionWitness } from '../src/types/transition';
import { CandidateEvaluationContext } from '../src/core/invariant/engine';

export type InjectionFailureType =
  | 'NONE'
  | 'WRONG_DOM_MUTATION'
  | 'MISSING_WITNESS'
  | 'DELAYED_WITNESS'
  | 'CONTRADICTORY_WITNESS'
  | 'WRONG_TARGET'
  | 'WRONG_ACTION'
  | 'ADVERSARIAL_DECOY'
  | 'UNEXPECTED_POST_STATE'
  | 'UNAUTHORIZED_HIGH_RISK';

export class FailureInjector {
  /**
   * Modifies witnesses according to injected failure type
   */
  public static injectTransitionFailure(
    failureType: InjectionFailureType,
    validWitnesses: TransitionWitness[]
  ): TransitionWitness[] {
    switch (failureType) {
      case 'MISSING_WITNESS':
        return []; // Zero witnesses

      case 'WRONG_DOM_MUTATION':
        return validWitnesses.map((w) => ({
          ...w,
          observedDelta: { wrongProperty: true },
        }));

      case 'DELAYED_WITNESS':
        return validWitnesses.map((w) => ({
          ...w,
          timestamp: w.timestamp + 5000, // Beyond verification window
          temporalDeltaMs: w.temporalDeltaMs + 5000,
        }));

      case 'CONTRADICTORY_WITNESS':
        return [validWitnesses[0]!]; // Insufficient classes (< 2)

      default:
        return validWitnesses;
    }
  }

  /**
   * Injects adversarial or distorted candidates
   */
  public static injectCandidateFailure(
    failureType: InjectionFailureType,
    candidates: CandidateEvaluationContext[]
  ): CandidateEvaluationContext[] {
    if (failureType === 'ADVERSARIAL_DECOY') {
      return [
        {
          candidateId: 'injected_decoy_trap',
          candidateLabel: 'Disable Marketing & All Account Notifications Completely',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'ALL_NOTIFICATIONS', // Trap
          observedRole: 'switch',
        },
        ...candidates,
      ];
    }

    if (failureType === 'WRONG_TARGET') {
      return candidates.map((c) => ({
        ...c,
        observedTargetEntity: 'WRONG_ENTITY',
      }));
    }

    if (failureType === 'WRONG_ACTION') {
      return candidates.map((c) => ({
        ...c,
        observedActionType: 'DELETE',
      }));
    }

    return candidates;
  }
}

