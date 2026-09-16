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
import { TransitionSignature, ActivationEventRecord } from '../../src/types/transition';

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
    const collector = new WitnessCollector();

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
});

