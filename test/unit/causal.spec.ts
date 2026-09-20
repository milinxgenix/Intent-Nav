/**
 * IntentNav-SCFR: Causal Transition Verification Tests
 * Enforces:
 * - Activation event strictly precedes witness observation
 * - Observed within bounded verification window
 * - >=2 independent witness classes required
 * - Unrelated or pre-existing mutations rejected as non-causal
 */

import { describe, it, expect } from 'vitest';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import { WitnessCollector } from '../../src/core/causal/witnessCollector';
import { TransitionSignature, ActivationEventRecord, TransitionWitness } from '../../src/types/transition';

describe('CausalTransitionVerifier & WitnessCollector', () => {
  const signature: TransitionSignature = {
    preStateFingerprint: 'STATE_PRE',
    activationEventExpected: { eventType: 'click' },
    expectedStateDelta: { marketing_emails_enabled: false },
    verificationWindowMs: 1500,
    postStateFingerprint: 'STATE_POST',
  };

  it('verifies valid transition with 2 independent witness classes occurring after activation', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const collector = new WitnessCollector();

    const t0 = 1000;
    const activation: ActivationEventRecord = {
      eventId: 'act_001',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };
    collector.registerActivationEvent(activation);

    // Witness 1: DOM Mutation at t0 + 40ms
    collector.recordWitness('DOM_MUTATION', { marketing_emails_enabled: false }, t0 + 40);
    // Witness 2: A11y State Mutation at t0 + 70ms
    collector.recordWitness('ACCESSIBILITY_STATE_MUTATION', { ariaChecked: 'false' }, t0 + 70);

    const result = verifier.verifyTransition(signature, activation, collector.getWitnesses());

    expect(result.causallyVerified).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.verifiedWitnessClasses).toHaveLength(2);
    expect(result.explanation).toContain('CAUSALLY VERIFIED');
  });

  it('rejects pre-existing state mutation that occurred before activation event', () => {
    const verifier = new CausalTransitionVerifier();

    const t0 = 2000;
    const activation: ActivationEventRecord = {
      eventId: 'act_002',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };

    // Witness occurs at t0 - 50ms BEFORE activation!
    const preExistingWitness = {
      witnessId: 'wit_pre',
      witnessClass: 'DOM_MUTATION' as const,
      sequenceNumber: 1,
      timestamp: t0 - 50,
      observedDelta: { marketing_emails_enabled: false },
      correlatedActivationEventId: null,
      temporalDeltaMs: -50,
      isCausallyCorrelated: false,
      correlationExplanation: 'Pre-existing',
    };

    const result = verifier.verifyTransition(signature, activation, [preExistingWitness]);

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_PRE_EXISTING_STATE');
    expect(result.explanation).toContain('occurred before activation event');
  });

  it('rejects unrelated DOM mutations that lack activation event correlation', () => {
    const collector = new WitnessCollector();
    // Record witness WITHOUT registering activation event
    const unrelatedWitness = collector.recordWitness('DOM_MUTATION', { random: true }, 500);

    expect(unrelatedWitness.isCausallyCorrelated).toBe(false);
    expect(unrelatedWitness.correlationExplanation).toContain('REJECTED: Unrelated event observed without prior activation event');
  });

  it('rejects transition when expected state delta is wrong', () => {
    const verifier = new CausalTransitionVerifier();
    const collector = new WitnessCollector();

    const t0 = 3000;
    const activation: ActivationEventRecord = {
      eventId: 'act_003',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };
    collector.registerActivationEvent(activation);

    // Delta gives wrong value
    collector.recordWitness('DOM_MUTATION', { marketing_emails_enabled: true }, t0 + 50);
    collector.recordWitness('ACCESSIBILITY_STATE_MUTATION', { random: true }, t0 + 90);

    const result = verifier.verifyTransition(signature, activation, collector.getWitnesses());

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_WRONG_STATE_DELTA');
  });

  it('rejects transition when fewer than required independent witness classes are observed', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const collector = new WitnessCollector();

    const t0 = 4000;
    const activation: ActivationEventRecord = {
      eventId: 'act_004',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };
    collector.registerActivationEvent(activation);

    // Only 1 witness class observed (DOM_MUTATION twice)
    collector.recordWitness('DOM_MUTATION', { marketing_emails_enabled: false }, t0 + 30);
    collector.recordWitness('DOM_MUTATION', { marketing_emails_enabled: false }, t0 + 60);

    const result = verifier.verifyTransition(signature, activation, collector.getWitnesses());

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_INSUFFICIENT_WITNESS_CLASSES');
  });

  it('rejects caller-supplied isCausallyCorrelated flag when delta is unrelated', () => {
    const verifier = new CausalTransitionVerifier();
    const t0 = 5000;
    const activation: ActivationEventRecord = {
      eventId: 'act_005',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };

    // Fabricated witness that claims correlation but has completely unrelated delta
    const fakeWitness = {
      witnessId: 'wit_fake_corr',
      witnessClass: 'DOM_MUTATION' as const,
      sequenceNumber: 1,
      timestamp: t0 + 50,
      observedDelta: { completely_unrelated_field: 'unrelated_val' },
      correlatedActivationEventId: 'act_005',
      temporalDeltaMs: 50,
      isCausallyCorrelated: true, // Caller lies!
      correlationExplanation: 'Fabricated correlation claim',
    };

    const result = verifier.verifyTransition(signature, activation, [fakeWitness]);
    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_UNRELATED_MUTATION');
    expect(result.classifiedWitnesses).toHaveLength(1);
    expect(result.classifiedWitnesses![0]!.category).toBe('UNRELATED');
  });

  it('rejects mutations that occur outside the verification window', () => {
    const verifier = new CausalTransitionVerifier();
    const t0 = 6000;
    const activation: ActivationEventRecord = {
      eventId: 'act_006',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };

    // Witness arrives at t0 + 2000ms (signature window is 1500ms)
    const lateWitness = {
      witnessId: 'wit_late',
      witnessClass: 'DOM_MUTATION' as const,
      sequenceNumber: 1,
      timestamp: t0 + 2000,
      observedDelta: { marketing_emails_enabled: false },
      correlatedActivationEventId: 'act_006',
      temporalDeltaMs: 2000,
      isCausallyCorrelated: true,
      correlationExplanation: 'Arrived after window',
    };

    const result = verifier.verifyTransition(signature, activation, [lateWitness]);
    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_WINDOW_TIMEOUT');
    expect(result.classifiedWitnesses![0]!.category).toBe('TIMED_OUT');
  });

  it('classifies every candidate witness independently and populates classifiedWitnesses', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const t0 = 7000;
    const activation: ActivationEventRecord = {
      eventId: 'act_007',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_marketing',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
    };

    const witnesses = [
      {
        witnessId: 'w1_pre',
        witnessClass: 'DOM_MUTATION' as const,
        sequenceNumber: 1,
        timestamp: t0 - 20,
        observedDelta: { marketing_emails_enabled: true },
        correlatedActivationEventId: null,
        temporalDeltaMs: -20,
        isCausallyCorrelated: false,
        correlationExplanation: 'pre',
      },
      {
        witnessId: 'w2_valid_dom',
        witnessClass: 'DOM_MUTATION' as const,
        sequenceNumber: 2,
        timestamp: t0 + 30,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: 'act_007',
        temporalDeltaMs: 30,
        isCausallyCorrelated: false,
        correlationExplanation: 'valid dom',
      },
      {
        witnessId: 'w3_valid_a11y',
        witnessClass: 'ACCESSIBILITY_STATE_MUTATION' as const,
        sequenceNumber: 3,
        timestamp: t0 + 60,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: 'act_007',
        temporalDeltaMs: 60,
        isCausallyCorrelated: false,
        correlationExplanation: 'valid a11y',
      },
      {
        witnessId: 'w4_unrelated',
        witnessClass: 'CLIENT_ROUTE_MUTATION' as const,
        sequenceNumber: 4,
        timestamp: t0 + 80,
        observedDelta: { unrelated_page: '/about' },
        correlatedActivationEventId: 'act_007',
        temporalDeltaMs: 80,
        isCausallyCorrelated: false,
        correlationExplanation: 'unrelated',
      },
      {
        witnessId: 'w5_late',
        witnessClass: 'ASYNC_ACKNOWLEDGEMENT' as const,
        sequenceNumber: 5,
        timestamp: t0 + 3000,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: 'act_007',
        temporalDeltaMs: 3000,
        isCausallyCorrelated: false,
        correlationExplanation: 'late',
      },
    ];

    const result = verifier.verifyTransition(signature, activation, witnesses);
    expect(result.causallyVerified).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.classifiedWitnesses).toHaveLength(5);

    const categories = result.classifiedWitnesses!.map((cw) => cw.category);
    expect(categories).toContain('PRE_EXISTING');
    expect(categories).toContain('CAUSALLY_VALID');
    expect(categories).toContain('UNRELATED');
    expect(categories).toContain('TIMED_OUT');
  });

  describe('Standardized CausalFailureReason Taxonomy (Phase 12)', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const t0 = 10000;
    const activation: ActivationEventRecord = {
      eventId: 'act_std',
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'btn_target',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_TEST',
    };

    it('emits activation_missing when activation event is missing or invalid', () => {
      const res = verifier.verifyTransition(signature, null as any, []);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('activation_missing');
      expect(res.status).toBe('FAILED_ACTIVATION_MISSING');
    });

    it('emits witness_missing when zero witnesses are observed', () => {
      const res = verifier.verifyTransition(signature, activation, []);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('witness_missing');
      expect(res.status).toBe('FAILED_MISSING_WITNESSES');
    });

    it('emits stale_witness when mutations occurred before or at activation', () => {
      const staleWitness: TransitionWitness = {
        witnessId: 'w_stale',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 - 50,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: -50,
        isCausallyCorrelated: false,
        correlationExplanation: 'stale',
      };
      const res = verifier.verifyTransition(signature, activation, [staleWitness]);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('stale_witness');
      expect(res.status).toBe('FAILED_PRE_EXISTING_STATE');
    });

    it('emits outside_window when all relevant witnesses arrive after verification window', () => {
      const lateWitness: TransitionWitness = {
        witnessId: 'w_late',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 5000, // 5000ms > 2000ms window
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 5000,
        isCausallyCorrelated: false,
        correlationExplanation: 'outside window',
      };
      const res = verifier.verifyTransition(signature, activation, [lateWitness]);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('outside_window');
      expect(res.status).toBe('FAILED_WINDOW_TIMEOUT');
    });

    it('emits invalid_transition when observed deltas are completely unrelated to expected delta', () => {
      const unrelatedWitness: TransitionWitness = {
        witnessId: 'w_unrel',
        witnessClass: 'CLIENT_ROUTE_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 100,
        observedDelta: { unrelated_theme: 'dark' },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 100,
        isCausallyCorrelated: false,
        correlationExplanation: 'unrelated',
      };
      const res = verifier.verifyTransition(signature, activation, [unrelatedWitness]);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('invalid_transition');
      expect(res.status).toBe('FAILED_UNRELATED_MUTATION');
    });

    it('emits wrong_direction when delta values contradict expected state delta values', () => {
      const wrongWitness: TransitionWitness = {
        witnessId: 'w_wrong',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 100,
        observedDelta: { marketing_emails_enabled: true }, // expected false
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 100,
        isCausallyCorrelated: false,
        correlationExplanation: 'wrong value',
      };
      const res = verifier.verifyTransition(signature, activation, [wrongWitness]);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('wrong_direction');
      expect(res.status).toBe('FAILED_WRONG_STATE_DELTA');
    });

    it('emits contradictory_witness when witness reports explicit error or abort', () => {
      const errorWitness: TransitionWitness = {
        witnessId: 'w_err',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 50,
        observedDelta: { error: 'Transaction failed', failure: true },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 50,
        isCausallyCorrelated: false,
        correlationExplanation: 'error',
      };
      const res = verifier.verifyTransition(signature, activation, [errorWitness]);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('contradictory_witness');
      expect(res.status).toBe('FAILED_CONTRADICTORY_WITNESS');
    });

    it('emits insufficient_independence when duplicate witnesses belong to identical class', () => {
      const w1: TransitionWitness = {
        witnessId: 'w_dom1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 50,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 50,
        isCausallyCorrelated: true,
        correlationExplanation: 'dom1',
      };
      const w2: TransitionWitness = {
        witnessId: 'w_dom2',
        witnessClass: 'DOM_MUTATION', // Same class!
        sequenceNumber: 2,
        timestamp: t0 + 80,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 80,
        isCausallyCorrelated: true,
        correlationExplanation: 'dom2',
      };
      const res = verifier.verifyTransition(signature, activation, [w1, w2]);
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('insufficient_independence');
      expect(res.status).toBe('FAILED_INSUFFICIENT_WITNESS_CLASSES');
    });

    it('emits post_state_mismatch when post-state fingerprint is identical to pre-state', () => {
      const w1: TransitionWitness = {
        witnessId: 'w_dom',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 50,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 50,
        isCausallyCorrelated: true,
        correlationExplanation: 'dom',
      };
      const w2: TransitionWitness = {
        witnessId: 'w_a11y',
        witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
        sequenceNumber: 2,
        timestamp: t0 + 80,
        observedDelta: { ariaChecked: 'false' },
        correlatedActivationEventId: activation.eventId,
        temporalDeltaMs: 80,
        isCausallyCorrelated: true,
        correlationExplanation: 'a11y',
      };
      // Passing preStateFingerprint ('STATE_PRE') as current post-state to simulate no state change
      const res = verifier.verifyTransition(
        signature,
        activation,
        [w1, w2],
        'STATE_PRE'
      );
      expect(res.causallyVerified).toBe(false);
      expect(res.failureReason).toBe('post_state_mismatch');
      expect(res.status).toBe('FAILED_POST_STATE_MISMATCH');
    });
  });

  describe('Correlation ID Hardening: forged/missing/incorrect correlation IDs', () => {
    /**
     * The verifier's correlatedActivationEventId field semantics:
     *   - null/undefined: witness does not declare correlation; accepted if temporal/delta checks pass
     *   - correct eventId: accepted
     *   - incorrect non-null eventId: REJECTED (witness explicitly correlates to a different event)
     *
     * These tests verify that an incorrect non-null correlation ID alone causes the witness
     * to be rejected, and that this rejection cascades to verification failure when it reduces
     * the verified class count below quorum.
     */

    const sig: TransitionSignature = {
      preStateFingerprint: 'PRE',
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { marketing_emails_enabled: false },
      verificationWindowMs: 2000,
      postStateFingerprint: 'POST',
    };

    it('accepts witnesses with null correlation ID (observer may not know eventId)', () => {
      const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
      const t0 = 2000;
      const activation: ActivationEventRecord = {
        eventId: 'act_real_001',
        sequenceNumber: 1,
        timestamp: t0,
        targetCandidateId: 'btn_mkt',
        eventType: 'click',
        initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
      };

      const witnesses: TransitionWitness[] = [
        {
          witnessId: 'w_null_corr_1',
          witnessClass: 'DOM_MUTATION',
          sequenceNumber: 1,
          timestamp: t0 + 50,
          observedDelta: { marketing_emails_enabled: false },
          correlatedActivationEventId: null, // null = observer doesn't declare correlation
          temporalDeltaMs: 50,
          isCausallyCorrelated: false,
          correlationExplanation: 'DOM observed; correlation undeclared',
        },
        {
          witnessId: 'w_null_corr_2',
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
          sequenceNumber: 2,
          timestamp: t0 + 80,
          observedDelta: { ariaChecked: 'false' },
          correlatedActivationEventId: null, // null = observer doesn't declare correlation
          temporalDeltaMs: 80,
          isCausallyCorrelated: false,
          correlationExplanation: 'A11y observed; correlation undeclared',
        },
      ];

      const result = verifier.verifyTransition(sig, activation, witnesses);
      // null correlation IDs should NOT cause failure — temporal + delta checks decide
      expect(result.causallyVerified).toBe(true);
      expect(result.status).toBe('VERIFIED');
    });

    it('rejects witness with incorrect (non-null) correlation ID pointing to a different event', () => {
      const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
      const t0 = 3000;
      const activation: ActivationEventRecord = {
        eventId: 'act_real_002',
        sequenceNumber: 1,
        timestamp: t0,
        targetCandidateId: 'btn_mkt',
        eventType: 'click',
        initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
      };

      const witnesses: TransitionWitness[] = [
        {
          witnessId: 'w_wrong_corr_1',
          witnessClass: 'DOM_MUTATION',
          sequenceNumber: 1,
          timestamp: t0 + 50,
          observedDelta: { marketing_emails_enabled: false },
          // Explicitly correlated to a DIFFERENT event — should be rejected
          correlatedActivationEventId: 'act_OTHER_UNRELATED_999',
          temporalDeltaMs: 50,
          isCausallyCorrelated: false,
          correlationExplanation: 'forged correlation',
        },
        {
          witnessId: 'w_wrong_corr_2',
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
          sequenceNumber: 2,
          timestamp: t0 + 80,
          observedDelta: { ariaChecked: 'false' },
          // Also incorrectly correlated
          correlatedActivationEventId: 'act_OTHER_UNRELATED_999',
          temporalDeltaMs: 80,
          isCausallyCorrelated: false,
          correlationExplanation: 'forged correlation',
        },
      ];

      const result = verifier.verifyTransition(sig, activation, witnesses);
      // An explicitly incorrect non-null correlation ID means this witness was meant
      expect(result.causallyVerified).toBe(false);
      expect([
        'FAILED_UNRELATED_MUTATION',
        'FAILED_INSUFFICIENT_WITNESSES',
        'FAILED_NO_CAUSAL_WITNESSES',
        'FAILED_WRONG_STATE_DELTA',
      ]).toContain(result.status);
    });

    it('accepts witnesses with correct matching correlation ID', () => {
      const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
      const t0 = 4000;
      const activation: ActivationEventRecord = {
        eventId: 'act_real_003',
        sequenceNumber: 1,
        timestamp: t0,
        targetCandidateId: 'btn_mkt',
        eventType: 'click',
        initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
      };

      const witnesses: TransitionWitness[] = [
        {
          witnessId: 'w_correct_corr_1',
          witnessClass: 'DOM_MUTATION',
          sequenceNumber: 1,
          timestamp: t0 + 50,
          observedDelta: { marketing_emails_enabled: false },
          correlatedActivationEventId: 'act_real_003', // Correct matching ID
          temporalDeltaMs: 50,
          isCausallyCorrelated: true,
          correlationExplanation: 'correctly correlated',
        },
        {
          witnessId: 'w_correct_corr_2',
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
          sequenceNumber: 2,
          timestamp: t0 + 80,
          observedDelta: { ariaChecked: 'false' },
          correlatedActivationEventId: 'act_real_003', // Correct matching ID
          temporalDeltaMs: 80,
          isCausallyCorrelated: true,
          correlationExplanation: 'correctly correlated',
        },
      ];

      const result = verifier.verifyTransition(sig, activation, witnesses);
      expect(result.causallyVerified).toBe(true);
      expect(result.status).toBe('VERIFIED');
    });

    it('does not auto-pass when correlation ID is a forged prefix variant of real eventId', () => {
      const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
      const t0 = 5000;
      const realEventId = 'act_real_004';
      const forgedEventId = 'act_real_004_FORGED_SUFFIX'; // Same prefix, extra suffix
      const activation: ActivationEventRecord = {
        eventId: realEventId,
        sequenceNumber: 1,
        timestamp: t0,
        targetCandidateId: 'btn_mkt',
        eventType: 'click',
        initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
      };

      const witnesses: TransitionWitness[] = [
        {
          witnessId: 'w_forged_prefix_1',
          witnessClass: 'DOM_MUTATION',
          sequenceNumber: 1,
          timestamp: t0 + 50,
          observedDelta: { marketing_emails_enabled: false },
          correlatedActivationEventId: forgedEventId, // Prefix matches but it's a different string
          temporalDeltaMs: 50,
          isCausallyCorrelated: false,
          correlationExplanation: 'forged prefix variant',
        },
        {
          witnessId: 'w_forged_prefix_2',
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
          sequenceNumber: 2,
          timestamp: t0 + 80,
          observedDelta: { ariaChecked: 'false' },
          correlatedActivationEventId: forgedEventId,
          temporalDeltaMs: 80,
          isCausallyCorrelated: false,
          correlationExplanation: 'forged prefix variant',
        },
      ];

      const result = verifier.verifyTransition(sig, activation, witnesses);
      // The verifier uses strict equality (=== not startsWith), so forged prefix must be rejected
      expect(result.causallyVerified).toBe(false);
      // The forgedEventId !== realEventId, so both witnesses should be filtered out
      expect([
        'FAILED_UNRELATED_MUTATION',
        'FAILED_INSUFFICIENT_WITNESSES',
        'FAILED_NO_CAUSAL_WITNESSES',
        'FAILED_WRONG_STATE_DELTA',
      ]).toContain(result.status);
    });

    it('correlation ID alone cannot prove causality (temporal + delta both required)', () => {
      const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
      const t0 = 6000;
      const activation: ActivationEventRecord = {
        eventId: 'act_real_005',
        sequenceNumber: 1,
        timestamp: t0,
        targetCandidateId: 'btn_mkt',
        eventType: 'click',
        initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
      };

      // Correct correlation ID, but witnesses are PRE-existing (before activation)
      const witnesses: TransitionWitness[] = [
        {
          witnessId: 'w_preexist_1',
          witnessClass: 'DOM_MUTATION',
          sequenceNumber: 1,
          timestamp: t0 - 200, // BEFORE activation!
          observedDelta: { marketing_emails_enabled: false },
          correlatedActivationEventId: 'act_real_005', // Correct ID, but pre-existing
          temporalDeltaMs: -200,
          isCausallyCorrelated: false,
          correlationExplanation: 'pre-existing with correct correlation ID',
        },
        {
          witnessId: 'w_preexist_2',
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
          sequenceNumber: 2,
          timestamp: t0 - 100, // BEFORE activation!
          observedDelta: { ariaChecked: 'false' },
          correlatedActivationEventId: 'act_real_005',
          temporalDeltaMs: -100,
          isCausallyCorrelated: false,
          correlationExplanation: 'pre-existing with correct correlation ID',
        },
      ];

      const result = verifier.verifyTransition(sig, activation, witnesses);
      // Even with correct correlation IDs, pre-existing witnesses must be rejected
      // A correct correlationId is NOT sufficient to establish causality alone
      expect(result.causallyVerified).toBe(false);
      expect(['FAILED_PRE_EXISTING_STATE', 'FAILED_INSUFFICIENT_WITNESSES', 'FAILED_NO_CAUSAL_WITNESSES']).toContain(result.status);
    });
  });
});
