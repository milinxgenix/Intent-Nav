/**
 * IntentNav-SCFR: Step 4 Raw Evidence & Independent Interpretation Tests
 *
 * Requirements:
 * - Witness records preserve actual observed evidence for independent interpretation.
 * - Source, witness class, observation type, sequence, timestamp, and bindings are retained.
 * - The verifier derives interpretation from recorded evidence rather than trusting
 *   caller-supplied boolean assertions (`passed: true`, `success: true`, `verified: true`).
 * - Rejects missing, contradictory, stale, duplicated, or causally unrelated evidence.
 * - Verifies distinct observational origins, not merely duplicate records of the same event.
 * - Fails closed when required evidence cannot be safely interpreted.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import { WitnessCollector } from '../../src/core/causal/witnessCollector';
import {
  TransitionSignature,
  ActivationEventRecord,
  TransitionWitness,
} from '../../src/types/transition';

describe('Step 4 — Raw Evidence and Independent Interpretation', () => {
  let verifier: CausalTransitionVerifier;
  let collector: WitnessCollector;
  const t0 = 1720000000000;

  const validActivation: ActivationEventRecord = {
    eventId: 'act_marketing_001',
    sequenceNumber: 1,
    timestamp: t0,
    targetCandidateId: 'cand_marketing_toggle',
    eventType: 'click',
    initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
  };

  const defaultSignature: TransitionSignature = {
    preStateFingerprint: 'STATE_PRE_MARKETING_ON',
    activationEventExpected: { eventType: 'click' },
    expectedStateDelta: { marketing_notifications_enabled: false },
    verificationWindowMs: 2000,
    postStateFingerprint: 'STATE_POST_MARKETING_OFF',
  };

  beforeEach(() => {
    verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    collector = new WitnessCollector();
    collector.registerActivationEvent(validActivation);
  });

  it('preserves raw observation payload, observation type, and provenance in witness collector', () => {
    const rawObs = {
      attributeName: 'aria-checked',
      attributeOldValue: 'true',
      attributeNewValue: 'false',
      targetTag: 'input',
    };

    const witness = collector.recordWitness(
      'ACCESSIBILITY_STATE_MUTATION',
      { marketing_notifications_enabled: false },
      t0 + 50,
      {
        source: 'MutationObserver:attributes:aria-checked',
        observationType: 'DOM_ATTRIBUTE_CHANGE',
        rawObservation: rawObs,
        routeId: 'route_CAP_DISABLE_MARKETING',
        capabilityId: 'CAP_DISABLE_MARKETING',
        provenance: {
          origin: 'MutationObserver:attributes:aria-checked',
          observerId: 'obs_aria_1',
          observedAt: t0 + 50,
          sequenceId: 1,
        },
      }
    );

    expect(witness.rawObservation).toEqual(rawObs);
    expect(witness.observationType).toBe('DOM_ATTRIBUTE_CHANGE');
    expect(witness.routeId).toBe('route_CAP_DISABLE_MARKETING');
    expect(witness.capabilityId).toBe('CAP_DISABLE_MARKETING');
    expect(witness.provenance?.origin).toBe('MutationObserver:attributes:aria-checked');
    expect(witness.provenance?.observedAt).toBe(t0 + 50);
  });

  it('rejects forged caller-supplied passed/success boolean when expected state delta is missing', () => {
    // Caller attempts to satisfy transition by providing { passed: true, success: true }
    // without the actual expected delta { marketing_notifications_enabled: false }
    const forgedWitnessA: TransitionWitness = {
      witnessId: 'wit_forged_1',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 20,
      observedDelta: { passed: true, success: true, verified: true },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 20,
      isCausallyCorrelated: true, // Caller asserts true
      correlationExplanation: 'Caller claimed success',
      source: 'MockDispatcher:forged',
      rawObservation: { callerAssertion: 'success' },
    };

    const forgedWitnessB: TransitionWitness = {
      witnessId: 'wit_forged_2',
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 2,
      timestamp: t0 + 30,
      observedDelta: { passed: true, status: 'ok' },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 30,
      isCausallyCorrelated: true,
      correlationExplanation: 'Caller claimed passed',
      source: 'MockDispatcher:forged_b',
      rawObservation: { callerAssertion: 'passed' },
    };

    const result = verifier.verifyTransition(
      defaultSignature,
      validActivation,
      [forgedWitnessA, forgedWitnessB]
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_WRONG_STATE_DELTA');
    expect(result.failureReason).toBe('wrong_direction');
  });

  it('rejects duplicate witnesses or same observational origin masquerading as multi-class quorum', () => {
    // Two witnesses that claim different classes but have the exact same observational origin
    const w1: TransitionWitness = {
      witnessId: 'wit_origin_1',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 20,
      observedDelta: { marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 20,
      isCausallyCorrelated: true,
      correlationExplanation: 'Same origin event',
      source: 'SyntheticDispatcher:common_channel',
      provenance: {
        origin: 'SyntheticDispatcher:common_channel',
        sequenceId: 1,
      },
    };

    const w2: TransitionWitness = {
      witnessId: 'wit_origin_2',
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 2,
      timestamp: t0 + 25,
      observedDelta: { marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 25,
      isCausallyCorrelated: true,
      correlationExplanation: 'Same origin event manufactured as second class',
      source: 'SyntheticDispatcher:common_channel',
      provenance: {
        origin: 'SyntheticDispatcher:common_channel', // Identical origin!
        sequenceId: 1,
      },
    };

    const result = verifier.verifyTransition(
      defaultSignature,
      validActivation,
      [w1, w2]
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_INSUFFICIENT_WITNESS_CLASSES');
    expect(result.failureReason).toBe('insufficient_independence');
    expect(result.explanation).toContain('Distinct observational origins required');
  });

  it('rejects artificial duplicate witness records with identical witnessId', () => {
    const w1: TransitionWitness = {
      witnessId: 'wit_duplicate_id',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 20,
      observedDelta: { marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 20,
      isCausallyCorrelated: true,
      correlationExplanation: 'DOM mutation',
      source: 'Observer:DOM',
    };

    // Passing identical witness twice
    const result = verifier.verifyTransition(
      defaultSignature,
      validActivation,
      [w1, w1]
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_INSUFFICIENT_WITNESS_CLASSES');
    expect(result.failureReason).toBe('insufficient_independence');
  });

  it('rejects contradictory witness observations across independent channels', () => {
    const w1: TransitionWitness = {
      witnessId: 'wit_dom_valid',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 20,
      observedDelta: { marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 20,
      isCausallyCorrelated: true,
      correlationExplanation: 'DOM mutation shows disabled',
      source: 'Observer:DOM',
      provenance: { origin: 'Observer:DOM' },
    };

    const wContradictory: TransitionWitness = {
      witnessId: 'wit_aria_contradictory',
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 2,
      timestamp: t0 + 30,
      observedDelta: { marketing_notifications_enabled: true }, // Contradiction: still enabled!
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 30,
      isCausallyCorrelated: true,
      correlationExplanation: 'Aria checked shows enabled',
      source: 'Observer:Aria',
      provenance: { origin: 'Observer:Aria' },
    };

    const result = verifier.verifyTransition(
      defaultSignature,
      validActivation,
      [w1, wContradictory]
    );

    // Contradictory deltas must reject
    expect(result.causallyVerified).toBe(false);
    expect(['FAILED_WRONG_STATE_DELTA', 'FAILED_CONTRADICTORY_WITNESS']).toContain(result.status);
  });

  it('rejects witnesses with error or failure flag as contradictory', () => {
    const wError: TransitionWitness = {
      witnessId: 'wit_error_indicator',
      witnessClass: 'APPLICATION_STATE_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 15,
      observedDelta: { error: 'Network timeout during toggle', failure: true },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 15,
      isCausallyCorrelated: true,
      correlationExplanation: 'Error witness',
      source: 'App:ErrorChannel',
    };

    const result = verifier.verifyTransition(
      defaultSignature,
      validActivation,
      [wError]
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_CONTRADICTORY_WITNESS');
    expect(result.failureReason).toBe('contradictory_witness');
  });

  it('accepts genuine independent witnesses from distinct observational origins satisfying expected delta', () => {
    const w1: TransitionWitness = {
      witnessId: 'wit_real_dom',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 20,
      observedDelta: { marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 20,
      isCausallyCorrelated: true,
      correlationExplanation: 'DOM mutation verified',
      source: 'MutationObserver:attributes:checked',
      provenance: {
        origin: 'MutationObserver:attributes:checked',
        observedAt: t0 + 20,
      },
    };

    const w2: TransitionWitness = {
      witnessId: 'wit_real_aria',
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 2,
      timestamp: t0 + 35,
      observedDelta: { ariaChecked: 'false', marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 35,
      isCausallyCorrelated: true,
      correlationExplanation: 'Accessibility mutation verified',
      source: 'AccessibilityTreeObserver:role_switch',
      provenance: {
        origin: 'AccessibilityTreeObserver:role_switch',
        observedAt: t0 + 35,
      },
    };

    const result = verifier.verifyTransition(
      defaultSignature,
      validActivation,
      [w1, w2],
      'STATE_POST_MARKETING_OFF'
    );

    expect(result.causallyVerified).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.verifiedWitnessClasses).toContain('DOM_MUTATION');
    expect(result.verifiedWitnessClasses).toContain('ACCESSIBILITY_STATE_MUTATION');
    expect(result.verificationToken).toBeDefined();
  });
});
