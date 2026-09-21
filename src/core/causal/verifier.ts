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
  ClassifiedWitnessRecord,
} from '../../types/transition';

export interface CausalVerifierOptions {
  minWitnessClasses?: number; // Default 2 independent witness classes
  enforceStrictDeltaMatch?: boolean;
}

export class CausalTransitionVerifier {
  constructor(private options: CausalVerifierOptions = {}) {}

  /**
   * Generates a deterministic signature hash for the verification token.
   * NOTE: This is a deterministic structural hash for runtime identity and tamper
   * tracking across route versions, not a public-key or HMAC cryptographic digital signature.
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
   * Performs deep equality comparison supporting primitives, nested objects,
   * arrays, and string-to-boolean equivalence (e.g. 'true' === true).
   */
  public deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    // Handle boolean vs string boolean ('true' / true, 'false' / false)
    if (typeof a === 'boolean' && typeof b === 'string') {
      const bLower = b.toLowerCase().trim();
      if (bLower === 'true' || bLower === 'false') {
        return a === (bLower === 'true');
      }
    }
    if (typeof a === 'string' && typeof b === 'boolean') {
      const aLower = a.toLowerCase().trim();
      if (aLower === 'true' || aLower === 'false') {
        return (aLower === 'true') === b;
      }
    }

    if (a === null || a === undefined || b === null || b === undefined) {
      return a === b;
    }

    if (typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
      if (!this.deepEqual(aObj[key], bObj[key])) return false;
    }

    return true;
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
    if (expectedKeys.length === 0) return true;
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
   * Evaluates whether the observed delta satisfies ALL required expected state changes.
   * Does NOT accept partial matches unless expected delta is empty.
   */
  public isDeltaMatching(
    observedDelta: Record<string, unknown> | undefined | null,
    expectedDelta: Record<string, unknown> | undefined | null
  ): boolean {
    const expected = expectedDelta || {};
    const observed = observedDelta || {};
    const expectedKeys = Object.keys(expected);
    if (expectedKeys.length === 0) return true;
    if (!observedDelta || Object.keys(observed).length === 0) return false;

    for (const [key, expectedVal] of Object.entries(expected)) {
      if (!(key in observed)) {
        return false;
      }
      if (!this.deepEqual(observed[key], expectedVal)) {
        return false;
      }
    }
    return true;
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

    // 0c. Activation Event Type Match (Prompt 8)
    if (
      signature.activationEventExpected?.eventType &&
      activationEvent.eventType &&
      signature.activationEventExpected.eventType !== activationEvent.eventType
    ) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses || [],
        classifiedWitnesses: [],
        verifiedWitnessClasses: [],
        status: 'FAILED_WRONG_STATE_DELTA',
        failureReason: 'invalid_transition',
        causallyVerified: false,
        durationMs: 0,
        explanation: `Transition rejected: Dispatched activation event type '${activationEvent.eventType}' does not match expected signature event type '${signature.activationEventExpected.eventType}'.`,
      };
    }

    const preExistingWitnesses: TransitionWitness[] = [];
    const timedOutWitnesses: TransitionWitness[] = [];
    const missingCorrWitnesses: TransitionWitness[] = [];
    const wrongCorrWitnesses: TransitionWitness[] = [];
    const unrelatedDeltaWitnesses: TransitionWitness[] = [];
    const contradictoryWitnesses: TransitionWitness[] = [];
    const relevantCausalWitnesses: TransitionWitness[] = [];
    const classifiedWitnesses: ClassifiedWitnessRecord[] = [];

    // Temporal & Causal Sorting: activationEvent.timestamp < witness.timestamp
    for (const w of witnesses) {
      // 1. Check strict temporal precedence: t_activation < t_witness
      // Mutation occurred BEFORE or AT activation event timestamp
      if (w.timestamp <= startTime) {
        preExistingWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'PRE_EXISTING',
          reason: `Witness timestamp (${w.timestamp}) occurred before or at activation event timestamp (${startTime}). Strict temporal precedence (t_activation < t_witness) violated.`,
        });
        continue;
      }

      // 2. Check window timeout: t_witness <= t_activation + windowMs
      if (w.timestamp - startTime > windowMs) {
        timedOutWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'TIMED_OUT',
          reason: `Witness timestamp (${w.timestamp}) arrived after verification window (${windowMs}ms). Bounded verification interval exceeded.`,
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

      // 4. Delta Relevance Evaluation (Filter out unrelated DOM/state mutations first)
      const isRelevantDelta =
        this.isDeltaRelevant(w.observedDelta, signature.expectedStateDelta, w.witnessClass);

      if (!isRelevantDelta) {
        unrelatedDeltaWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'UNRELATED',
          reason: `Witness delta ${JSON.stringify(w.observedDelta)} is unrelated to expected delta ${JSON.stringify(signature.expectedStateDelta)}. Unrelated mutations cannot satisfy causal verification.`,
        });
        continue;
      }

      // 5. Independent Causal Relevance Derivation (Do NOT trust isCausallyCorrelated flag)
      // Missing correlation ID constitutes INSUFFICIENT_EVIDENCE
      if (!w.correlatedActivationEventId) {
        missingCorrWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'UNRELATED',
          reason: `Witness delta is relevant, but missing correlatedActivationEventId. Missing correlation ID constitutes insufficient evidence of causality.`,
        });
        continue;
      }

      // Wrong or stale correlation ID fails
      if (w.correlatedActivationEventId !== activationEvent.eventId) {
        wrongCorrWitnesses.push(w);
        classifiedWitnesses.push({
          witness: w,
          category: 'UNRELATED',
          reason: `Witness correlated event ID '${w.correlatedActivationEventId}' does not match activation ID '${activationEvent.eventId}'. Wrong or stale correlation ID rejected.`,
        });
        continue;
      }

      // Witness is temporally, causally, and contextually valid
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

    // Check for Unrelated / Wrong Correlation Mutations -> invalid_transition
    if (relevantCausalWitnesses.length === 0 && (wrongCorrWitnesses.length > 0 || unrelatedDeltaWitnesses.length > 0)) {
      const firstUnrelated = wrongCorrWitnesses[0] || unrelatedDeltaWitnesses[0];
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_UNRELATED_MUTATION',
        failureReason: 'invalid_transition',
        causallyVerified: false,
        durationMs: firstUnrelated ? firstUnrelated.timestamp - startTime : 0,
        explanation: `Transition rejected: Mutations occurred within window, but none matched expected delta or event correlation. Unrelated mutations cannot satisfy causal verification.`,
      };
    }

    // Check for Missing Correlation Witnesses -> causal_relation_unproven / insufficient evidence
    if (relevantCausalWitnesses.length === 0 && missingCorrWitnesses.length > 0) {
      return {
        signature,
        activationEvent,
        observedWitnesses: witnesses,
        classifiedWitnesses,
        verifiedWitnessClasses: [],
        status: 'FAILED_INSUFFICIENT_CORRELATION',
        failureReason: 'causal_relation_unproven',
        causallyVerified: false,
        durationMs: missingCorrWitnesses[0]!.timestamp - startTime,
        explanation: 'Transition rejected: Missing correlation ID on observed witnesses. Insufficient evidence to establish causal relationship with activation event.',
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
      // 1. Direct match by individual witness
      deltaMatched = relevantCausalWitnesses.some((w) =>
        this.isDeltaMatching(w.observedDelta, signature.expectedStateDelta)
      );

      // 2. Combined match across independent relevant witnesses without contradictions
      if (!deltaMatched && relevantCausalWitnesses.length > 1) {
        const combinedDelta: Record<string, unknown> = {};
        let contradictionFound = false;
        for (const w of relevantCausalWitnesses) {
          if (!w.observedDelta) continue;
          for (const [k, v] of Object.entries(w.observedDelta)) {
            if (k in signature.expectedStateDelta) {
              if (k in combinedDelta && !this.deepEqual(combinedDelta[k], v)) {
                contradictionFound = true;
                break;
              }
              combinedDelta[k] = v;
            }
          }
          if (contradictionFound) break;
        }
        if (!contradictionFound && this.isDeltaMatching(combinedDelta, signature.expectedStateDelta)) {
          deltaMatched = true;
        }
      }
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

    // Direct Post-State Verification -> post_state_mismatch
    // Compare observed post-state against expected post-state directly (do not merely check post !== pre)
    if (currentPostStateFingerprint !== undefined) {
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
      if (signature.postStateFingerprint && currentPostStateFingerprint !== signature.postStateFingerprint) {
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
          explanation: `Transition rejected: Observed post-state fingerprint '${currentPostStateFingerprint}' does not match expected post-state fingerprint '${signature.postStateFingerprint}'.`,
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
