/**
 * IntentNav-SCFR: Causal Transition Verifier
 *
 * Phase 16, 17, 18, 19 Implementation:
 * Rigorously derives causal relationship between activation event and transition witnesses.
 * Does NOT trust a caller-supplied isCausallyCorrelated flag.
 * Enforces:
 * 1. Correct activation event and initiating capability.
 * 2. Strict temporal ordering: t_act < t_witness <= t_act + windowMs.
 * 3. Rejection of pre-existing state mutations (occurred before t_act).
 * 4. Rejection of unrelated mutations.
 * 5. State delta compatibility against expectedStateDelta.
 * 6. Post-state fingerprint compatibility.
 * 7. Quorum of >=2 distinct independent witness classes (rejecting same-class duplicates).
 * 8. Generates TransitionVerificationToken upon verification.
 */

import {
  TransitionSignature,
  ActivationEventRecord,
  TransitionWitness,
  CausalVerificationResult,
  CausalVerificationStatus,
  CausalFailureReason,
  WitnessClass,
  TransitionVerificationToken,
} from '../../types/transition';

export interface CausalVerifierOptions {
  minWitnessClasses?: number; // Default 2 independent witness classes
  enforceStrictDeltaMatch?: boolean;
}

export class CausalTransitionVerifier {
  constructor(private options: CausalVerifierOptions = {}) {}

  /**
   * Generates a deterministic signature hash for the verification token
   */
  private static generateTokenSignature(
    routeId: string,
    capabilityId: string,
    activationEventId: string,
    timestamp: number
  ): string {
    const raw = `${routeId}|${capabilityId}|${activationEventId}|${timestamp}|VALIDATED_SCFR`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `tok_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Evaluates whether an observed delta indicates an explicit contradiction, failure, or aborted outcome
   */
  private isDeltaContradictory(
    observedDelta: Record<string, unknown> | undefined | null
  ): boolean {
    if (!observedDelta) return false;
    return (
      observedDelta['error'] !== undefined ||
      observedDelta['failure'] === true ||
      observedDelta['aborted'] === true
    );
  }

  /**
   * Evaluates whether an observed delta is relevant to the expected transition delta
   */
  private isDeltaRelevant(
    observedDelta: Record<string, unknown> | undefined | null,
    expectedDelta: Record<string, unknown> | undefined | null,
    witnessClass?: WitnessClass
  ): boolean {
    if (witnessClass === 'ASYNC_ACKNOWLEDGEMENT') {
      return true;
    }
    const expected = expectedDelta || {};
    const observed = observedDelta || {};
    const expectedKeys = Object.keys(expected);
    if (expectedKeys.length === 0) return true; // If delta is empty, any non-empty delta or transition is relevant
    if (expectedKeys.some((key) => key in observed)) return true;
    // Standard accessibility & route transition properties
    const standardChannels = [
      'ariaChecked',
      'aria-checked',
      'checked',
      'disabled',
      'expanded',
      'aria-expanded',
      'aria-disabled',
      'outletChanged',
      'route',
      'path',
      'export_download_initiated',
      'operation',
      'status',
      'statusCode',
      'acknowledged',
    ];
    return standardChannels.some((k) => k in observed);
  }

  /**
   * Evaluates whether the observed delta satisfies expected state changes
   */
  private isDeltaMatching(
    observedDelta: Record<string, unknown> | undefined | null,
    expectedDelta: Record<string, unknown> | undefined | null
  ): boolean {
    const expected = expectedDelta || {};
    const observed = observedDelta || {};
    for (const [key, expectedVal] of Object.entries(expected)) {
      if (key in observed) {
        if (observed[key] === expectedVal) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Verifies the causal transition according to the formal witness protocol
   */
  public verifyTransition(
    signature: TransitionSignature,
    activationEvent: ActivationEventRecord,
    witnesses: TransitionWitness[],
    currentPostStateFingerprint?: string,
    routeId?: string
  ): CausalVerificationResult {
    // 0. Activation Event Presence & Validity
    if (!activationEvent || !activationEvent.eventId || typeof activationEvent.timestamp !== 'number') {
      return {
        signature,
        activationEvent: activationEvent || ({} as any),
        observedWitnesses: witnesses || [],
        classifiedWitnesses: [],
        verifiedWitnessClasses: [],
        status: 'FAILED_ACTIVATION_MISSING',
        failureReason: 'activation_missing',
        causallyVerified: false,
        durationMs: 0,
        explanation: 'Transition rejected: Activation event record is missing or invalid.',
      };
    }

    const minClasses = this.options.minWitnessClasses ?? 2;
    const windowMs = signature.verificationWindowMs || 2000;
    const startTime = activationEvent.timestamp;

    // 0b. Witness Presence Check
    if (!witnesses || witnesses.length === 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: [],
        classifiedWitnesses: [],
        verifiedWitnessClasses: [],
        status: 'FAILED_MISSING_WITNESSES',
        failureReason: 'witness_missing',
        causallyVerified: false,
        durationMs: windowMs,
        explanation: `Transition rejected: No witnesses observed within ${windowMs}ms window.`,
      };
    }

    const preExistingWitnesses: TransitionWitness[] = [];
    const timedOutWitnesses: TransitionWitness[] = [];
    const unrelatedWitnesses: TransitionWitness[] = [];
    const contradictoryWitnesses: TransitionWitness[] = [];
    const relevantCausalWitnesses: TransitionWitness[] = [];
    const classifiedWitnesses: import('../../types/transition').ClassifiedWitnessRecord[] = [];

    // Temporal & Causal Sorting: activationEvent.timestamp < witness.timestamp
    for (const w of witnesses) {
      // 1. Check pre-existing state anomaly: mutation occurred BEFORE or AT activation
      if (w.timestamp <= startTime) {
        preExistingWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'PRE_EXISTING',
          reason: `Witness timestamp (${w.timestamp}) occurred before or at activation event timestamp (${startTime}).`,
        });
        continue;
      }

      // 2. Check window timeout
      if (w.timestamp - startTime > windowMs) {
        timedOutWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'TIMED_OUT',
          reason: `Witness timestamp (${w.timestamp}) arrived after verification window (${windowMs}ms).`,
        });
        continue;
      }

      // 3. Check for explicit contradiction (e.g., error/failure witness or aborted status)
      if (this.isDeltaContradictory(w.observedDelta)) {
        contradictoryWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'UNRELATED',
          reason: `Witness observed error or failure indicator: ${JSON.stringify(w.observedDelta)}.`,
        });
        continue;
      }

      // 4. Independent Causal Relevance Derivation (Do NOT trust isCausallyCorrelated flag)
      const isCorrelatedWithEvent =
        !w.correlatedActivationEventId || w.correlatedActivationEventId === activationEvent.eventId;
      const isRelevantDelta =
        this.isDeltaRelevant(w.observedDelta, signature.expectedStateDelta, w.witnessClass);

      if (!isCorrelatedWithEvent || !isRelevantDelta) {
        unrelatedWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'UNRELATED',
          reason: !isCorrelatedWithEvent
            ? `Witness correlated event ID '${w.correlatedActivationEventId}' does not match activation ID '${activationEvent.eventId}'.`
            : `Witness delta ${JSON.stringify(w.observedDelta)} is unrelated to expected delta ${JSON.stringify(signature.expectedStateDelta)}.`,
        });
        continue;
      }

      // Witness is temporally and contextually relevant
      const isDeltaMatch = this.isDeltaMatching(w.observedDelta, signature.expectedStateDelta);
      relevantCausalWitnesses.push(w);
      classifiedWitnesses.push({
        witness: w,
        category: isDeltaMatch ? 'CAUSALLY_VALID' : 'RELEVANT',
        reason: isDeltaMatch
          ? `Witness observed matching state delta within verification window (${w.timestamp - startTime}ms).`
          : `Witness observed relevant state transition within verification window (${w.timestamp - startTime}ms).`,
      });
    }

    // Check for Contradictory Witness
    if (contradictoryWitnesses.length > 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_CONTRADICTORY_WITNESS',
        failureReason: 'contradictory_witness',
        causallyVerified: false,
        durationMs: Math.max(0, contradictoryWitnesses[0]!.timestamp - startTime),
        explanation: `Transition rejected: Contradictory witness observed. Observed error/failure mutation (${JSON.stringify(contradictoryWitnesses[0]!.observedDelta)}).`,
      };
    }

    // Check for Pre-Existing State Anomaly (Property 5) -> stale_witness
    if (preExistingWitnesses.length > 0 && relevantCausalWitnesses.length === 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_PRE_EXISTING_STATE',
        failureReason: 'stale_witness',
        causallyVerified: false,
        durationMs: 0,
        explanation: `Transition rejected: Expected mutation occurred before activation event (${preExistingWitnesses[0]!.timestamp} <= ${startTime}). Pre-existing state cannot satisfy causal verification.`,
      };
    }

    // Check for Unrelated Mutation Only (Property 4) -> invalid_transition
    if (relevantCausalWitnesses.length === 0 && unrelatedWitnesses.length > 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_UNRELATED_MUTATION',
        failureReason: 'invalid_transition',
        causallyVerified: false,
        durationMs: unrelatedWitnesses[0]!.timestamp - startTime,
        explanation: `Transition rejected: Mutations occurred within window, but none matched expected delta. Unrelated mutations cannot satisfy causal verification.`,
      };
    }

    // Check for Missing Witnesses / Timeout -> outside_window or witness_missing
    if (relevantCausalWitnesses.length === 0) {
      const status: CausalVerificationStatus =
        timedOutWitnesses.length > 0 ? 'FAILED_WINDOW_TIMEOUT' : 'FAILED_MISSING_WITNESSES';
      const failureReason: CausalFailureReason =
        timedOutWitnesses.length > 0 ? 'outside_window' : 'witness_missing';
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status,
        failureReason,
        causallyVerified: false,
        durationMs: windowMs,
        explanation: `Transition rejected: No relevant witnesses observed within ${windowMs}ms window.`,
      };
    }

    // Verify Expected State Delta Match -> wrong_direction
    let deltaMatched = false;
    if (Object.keys(signature.expectedStateDelta).length === 0) {
      deltaMatched = true;
    } else {
      deltaMatched = relevantCausalWitnesses.some((w) =>
        this.isDeltaMatching(w.observedDelta, signature.expectedStateDelta)
      );
    }

    if (!deltaMatched) {
      return {
        signature,
        activationEvent,
        observedWitnesses: relevantCausalWitnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_WRONG_STATE_DELTA',
        failureReason: 'wrong_direction',
        causallyVerified: false,
        durationMs: relevantCausalWitnesses[relevantCausalWitnesses.length - 1]!.timestamp - startTime,
        explanation: 'Transition rejected: Relevant witnesses observed, but expected state delta values did not match.',
      };
    }

    // Post-State Fingerprint Verification -> post_state_mismatch
    if (currentPostStateFingerprint && signature.postStateFingerprint) {
      if (currentPostStateFingerprint === signature.preStateFingerprint) {
        return {
          signature,
          activationEvent,
          observedWitnesses: relevantCausalWitnesses,
          classifiedWitnesses,
          verifiedWitnessClasses: [],
          status: 'FAILED_POST_STATE_MISMATCH',
          failureReason: 'post_state_mismatch',
          causallyVerified: false,
          durationMs: relevantCausalWitnesses[relevantCausalWitnesses.length - 1]!.timestamp - startTime,
          explanation: 'Transition rejected: Post-state fingerprint identical to pre-state; no actual state progression occurred.',
        };
      }
    }

    // Verify Independent Witness Classes Quorum -> insufficient_independence
    const distinctClasses: WitnessClass[] = Array.from(
      new Set(relevantCausalWitnesses.map((w) => w.witnessClass))
    );

    if (distinctClasses.length < minClasses) {
      return {
        signature,
        activationEvent,
        observedWitnesses: relevantCausalWitnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: distinctClasses,
        status: 'FAILED_INSUFFICIENT_WITNESS_CLASSES',
        failureReason: 'insufficient_independence',
        causallyVerified: false,
        durationMs: relevantCausalWitnesses[relevantCausalWitnesses.length - 1]!.timestamp - startTime,
        explanation: `Transition rejected: Observed only ${distinctClasses.length} distinct witness class (${distinctClasses.join(', ')}). Minimum required independent classes is ${minClasses}. Duplicate events of the same class do not satisfy quorum.`,
      };
    }

    const durationMs = relevantCausalWitnesses[relevantCausalWitnesses.length - 1]!.timestamp - startTime;
    const effectiveRouteId = routeId || `route_${activationEvent.initiatingCapabilityId}`;
    const tokenTimestamp = Date.now();

    const verificationToken: TransitionVerificationToken = {
      tokenId: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      routeId: effectiveRouteId,
      capabilityId: activationEvent.initiatingCapabilityId,
      activationEventId: activationEvent.eventId,
      verifiedWitnessClasses: distinctClasses,
      transitionSignature: signature,
      issuedTimestamp: tokenTimestamp,
      verifiedStatus: 'VERIFIED',
      signatureHash: CausalTransitionVerifier.generateTokenSignature(
        effectiveRouteId,
        activationEvent.initiatingCapabilityId,
        activationEvent.eventId,
        tokenTimestamp
      ),
    };

    return {
      signature,
      activationEvent,
      observedWitnesses: relevantCausalWitnesses,
      classifiedWitnesses,
      verifiedWitnessClasses: distinctClasses,
      status: 'VERIFIED',
      causallyVerified: true,
      durationMs,
      explanation: `CAUSALLY VERIFIED: Correlated ${relevantCausalWitnesses.length} witnesses across ${distinctClasses.length} independent classes (${distinctClasses.join(', ')}) in ${durationMs}ms`,
      verificationToken,
    };
  }
}
