/**
 * IntentNav-SCFR: Causal Transition Verifier
 * Verifies causal relationship between activation event and transition witnesses
 */

import {
  TransitionSignature,
  ActivationEventRecord,
  TransitionWitness,
  CausalVerificationResult,
  CausalVerificationStatus,
} from '../../types/transition';

export interface CausalVerifierOptions {
  minWitnessClasses?: number; // Default 2 independent witness classes
  enforceStrictDeltaMatch?: boolean;
}

export class CausalTransitionVerifier {
  constructor(private options: CausalVerifierOptions = {}) {}

  /**
   * Verifies the causal transition according to the formal witness protocol
   */
  public verifyTransition(
    signature: TransitionSignature,
    activationEvent: ActivationEventRecord,
    witnesses: TransitionWitness[]
  ): CausalVerificationResult {
    const minClasses = this.options.minWitnessClasses ?? 2;
    const windowMs = signature.verificationWindowMs || 2000;
    const startTime = activationEvent.timestamp;

    // Filter witnesses that occurred AFTER the activation event and within verification window
    const validCausalWitnesses: TransitionWitness[] = [];
    const preExistingWitnesses: TransitionWitness[] = [];
    const timedOutWitnesses: TransitionWitness[] = [];

    for (const w of witnesses) {
      if (w.timestamp < startTime) {
        preExistingWitnesses.push(w);
      } else if (w.timestamp - startTime > windowMs) {
        timedOutWitnesses.push(w);
      } else if (w.isCausallyCorrelated && w.correlatedActivationEventId === activationEvent.eventId) {
        validCausalWitnesses.push(w);
      }
    }

    // 1. Check for Pre-Existing State anomaly
    if (preExistingWitnesses.length > 0 && validCausalWitnesses.length === 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_PRE_EXISTING_STATE',
        causallyVerified: false,
        durationMs: 0,
        explanation: `Transition rejected: Observed state mutation occurred before activation event (${preExistingWitnesses[0]!.timestamp} < ${startTime})`,
      };
    }

    // 2. Check for missing witnesses / timeout
    if (validCausalWitnesses.length === 0) {
      const status: CausalVerificationStatus = timedOutWitnesses.length > 0
        ? 'FAILED_WINDOW_TIMEOUT'
        : 'FAILED_MISSING_WITNESSES';
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        verifiedWitnessClasses: [],
        status,
        causallyVerified: false,
        durationMs: windowMs,
        explanation: `Transition rejected: No causally correlated witnesses observed within ${windowMs}ms window`,
      };
    }

    // 3. Verify Expected State Delta match
    let deltaMatched = true;
    for (const [key, expectedVal] of Object.entries(signature.expectedStateDelta)) {
      const keyFound = validCausalWitnesses.some(
        (w) => w.observedDelta[key] === expectedVal
      );
      if (!keyFound) {
        deltaMatched = false;
        break;
      }
    }

    if (!deltaMatched && Object.keys(signature.expectedStateDelta).length > 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: validCausalWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_WRONG_STATE_DELTA',
        causallyVerified: false,
        durationMs: validCausalWitnesses[validCausalWitnesses.length - 1]!.timestamp - startTime,
        explanation: 'Transition rejected: Witnesses observed, but expected state delta was NOT satisfied',
      };
    }

    // 4. Verify Independent Witness Classes Quorum
    const observedClasses = Array.from(
      new Set(validCausalWitnesses.map((w) => w.witnessClass))
    );

    if (observedClasses.length < minClasses) {
      return {
        signature,
        activationEvent,
        observedWitnesses: validCausalWitnesses,
        verifiedWitnessClasses: observedClasses,
        status: 'FAILED_INSUFFICIENT_WITNESS_CLASSES',
        causallyVerified: false,
        durationMs: validCausalWitnesses[validCausalWitnesses.length - 1]!.timestamp - startTime,
        explanation: `Transition rejected: Observed only ${observedClasses.length} witness class (${observedClasses.join(', ')}), minimum required is ${minClasses}`,
      };
    }

    const durationMs = validCausalWitnesses[validCausalWitnesses.length - 1]!.timestamp - startTime;

    return {
      signature,
      activationEvent,
      observedWitnesses: validCausalWitnesses,
      verifiedWitnessClasses: observedClasses,
      status: 'VERIFIED',
      causallyVerified: true,
      durationMs,
      explanation: `CAUSALLY VERIFIED: Correlated ${validCausalWitnesses.length} witnesses across ${observedClasses.length} independent classes (${observedClasses.join(', ')}) in ${durationMs}ms`,
    };
  }
}

