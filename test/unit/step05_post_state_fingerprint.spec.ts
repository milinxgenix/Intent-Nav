/**
 * IntentNav-SCFR: Step 5 Observed Post-State Fingerprint Tests
 *
 * Requirements:
 * - Capture post-action state from real browser observations.
 * - Deterministic canonicalization with established domain separation rules (`INTENTNAV_SCFR_POST_STATE_FINGERPRINT_V2`).
 * - Binds observation to capability, route version, and activation event.
 * - Distinguishes actual observed state from predicted/caller-supplied state (`isObserved: true`).
 * - Rejects unchanged states (`post === pre`), stale bindings, missing observations, and tampering.
 * - Verification cannot succeed solely because a precomputed expected hash matches itself.
 */

import { describe, it, expect } from 'vitest';
import {
  FingerprintConstructor,
  POST_STATE_FINGERPRINT_DOMAIN,
  POST_STATE_FINGERPRINT_PREFIX_V2,
} from '../../src/core/fingerprint/constructor';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import {
  TransitionSignature,
  ActivationEventRecord,
  TransitionWitness,
  ObservedPostState,
} from '../../src/types/transition';
import { InterfaceStateNode } from '../../src/types/state';

describe('Step 5 — Observed Post-State Fingerprint', () => {
  const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
  const t0 = 1720000000000;

  const validActivation: ActivationEventRecord = {
    eventId: 'act_poststate_001',
    sequenceNumber: 1,
    timestamp: t0,
    targetCandidateId: 'cand_toggle',
    eventType: 'click',
    initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
  };

  const sampleStateNode: InterfaceStateNode = {
    stateId: 'st_002',
    stateType: 'PAGE',
    urlPattern: '/settings/notifications',
    domStructuralHash: 'hash_structural_abc',
    semanticLandmarks: ['section[marketing]', 'main'],
    activeModalsOrDialogs: [],
    activeTabs: ['notifications'],
    exposedCandidateHandles: [],
    observedApplicationState: { marketing_notifications_enabled: false },
    timestamp: t0 + 50,
  };

  const validWitnesses: TransitionWitness[] = [
    {
      witnessId: 'w_dom_1',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: t0 + 20,
      observedDelta: { marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 20,
      isCausallyCorrelated: true,
      correlationExplanation: 'DOM verified',
      source: 'Observer:DOM',
    },
    {
      witnessId: 'w_aria_1',
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 2,
      timestamp: t0 + 30,
      observedDelta: { ariaChecked: 'false', marketing_notifications_enabled: false },
      correlatedActivationEventId: validActivation.eventId,
      temporalDeltaMs: 30,
      isCausallyCorrelated: true,
      correlationExplanation: 'Aria verified',
      source: 'Observer:Aria',
    },
  ];

  it('computes deterministic SHA-256 post-state fingerprint with domain separation prefix', () => {
    const fp1 = FingerprintConstructor.computePostStateFingerprint({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_CAP_DISABLE_MARKETING',
      activationEventId: validActivation.eventId,
      stateNode: sampleStateNode,
    });

    // Hash must begin with postfp_sha256_ followed by 64 hex characters
    expect(fp1).toMatch(/^postfp_sha256_[0-9a-f]{64}$/);
    expect(fp1.startsWith(POST_STATE_FINGERPRINT_PREFIX_V2)).toBe(true);

    const canonical = FingerprintConstructor.buildCanonicalPostStateRepresentation({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_CAP_DISABLE_MARKETING',
      activationEventId: validActivation.eventId,
      stateNode: sampleStateNode,
    });

    expect(canonical).toContain(POST_STATE_FINGERPRINT_DOMAIN);
    expect(canonical).toContain('CAP_DISABLE_MARKETING');
    expect(canonical).toContain(validActivation.eventId);
  });

  it('ensures canonicalization determinism across key insertion order and array sorting', () => {
    // Input A with keys in order: marketing_notifications_enabled, analytics
    const stateA = {
      ...sampleStateNode,
      semanticLandmarks: ['section[marketing]', 'main', 'header'],
      observedApplicationState: {
        marketing_notifications_enabled: false,
        analytics: true,
      },
    };

    // Input B with reversed keys and un-sorted arrays
    const stateB = {
      ...sampleStateNode,
      semanticLandmarks: ['header', 'main', 'section[marketing]'],
      observedApplicationState: {
        analytics: true,
        marketing_notifications_enabled: false,
      },
    };

    const fpA = FingerprintConstructor.computePostStateFingerprint({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_001',
      activationEventId: 'act_001',
      stateNode: stateA,
    });

    const fpB = FingerprintConstructor.computePostStateFingerprint({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_001',
      activationEventId: 'act_001',
      stateNode: stateB,
    });

    expect(fpA).toBe(fpB);
  });

  it('changes fingerprint when application state is altered or tampered with', () => {
    const fpOriginal = FingerprintConstructor.computePostStateFingerprint({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_001',
      activationEventId: 'act_001',
      observedApplicationState: { marketing_notifications_enabled: false },
    });

    const fpTampered = FingerprintConstructor.computePostStateFingerprint({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_001',
      activationEventId: 'act_001',
      observedApplicationState: { marketing_notifications_enabled: true },
    });

    expect(fpOriginal).not.toBe(fpTampered);
  });

  it('rejects post-state verification when observed post-state is identical to pre-state (no actual progression)', () => {
    const preFp = 'postfp_sha256_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const unchangedObservedState: ObservedPostState = {
      postStateFingerprint: preFp, // Identical to preState!
      observedApplicationState: { marketing_notifications_enabled: true },
      observedTimestamp: t0 + 40,
      activationEventId: validActivation.eventId,
      routeId: 'route_001',
      capabilityId: 'CAP_DISABLE_MARKETING',
      isObserved: true,
      observationSource: 'ExecutionDispatcher:observePostState',
    };

    const signature: TransitionSignature = {
      preStateFingerprint: preFp,
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { marketing_notifications_enabled: false },
      verificationWindowMs: 2000,
      postStateFingerprint: 'postfp_sha256_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    };

    const result = verifier.verifyTransition(
      signature,
      validActivation,
      validWitnesses,
      unchangedObservedState
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_POST_STATE_MISMATCH');
    expect(result.failureReason).toBe('post_state_mismatch');
    expect(result.explanation).toContain('Post-state fingerprint identical to pre-state');
  });

  it('rejects predicted or caller-supplied post-state where isObserved is false', () => {
    const simulatedState: ObservedPostState = {
      postStateFingerprint: 'postfp_sha256_simulated_post_state_00000000000000000000000000000000',
      observedApplicationState: { marketing_notifications_enabled: false },
      observedTimestamp: t0 + 40,
      activationEventId: validActivation.eventId,
      routeId: 'route_001',
      capabilityId: 'CAP_DISABLE_MARKETING',
      isObserved: false, // NOT a genuine observation!
      observationSource: 'SimulatedPredictor:test',
    };

    const signature: TransitionSignature = {
      preStateFingerprint: 'STATE_PRE_ON',
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { marketing_notifications_enabled: false },
      verificationWindowMs: 2000,
      postStateFingerprint: simulatedState.postStateFingerprint,
    };

    const result = verifier.verifyTransition(
      signature,
      validActivation,
      validWitnesses,
      simulatedState
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_POST_STATE_MISMATCH');
    expect(result.explanation).toContain('Supplied post-state is not a genuine observation');
  });

  it('rejects stale activationEventId binding in observed post-state', () => {
    const staleObservedState: ObservedPostState = {
      postStateFingerprint: 'postfp_sha256_stale_111111111111111111111111111111111111111111111111',
      observedApplicationState: { marketing_notifications_enabled: false },
      observedTimestamp: t0 + 40,
      activationEventId: 'act_prior_old_event', // Mismatched activation event!
      routeId: 'route_001',
      capabilityId: 'CAP_DISABLE_MARKETING',
      isObserved: true,
      observationSource: 'ExecutionDispatcher:observePostState',
    };

    const signature: TransitionSignature = {
      preStateFingerprint: 'STATE_PRE_ON',
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { marketing_notifications_enabled: false },
      verificationWindowMs: 2000,
      postStateFingerprint: staleObservedState.postStateFingerprint,
    };

    const result = verifier.verifyTransition(
      signature,
      validActivation,
      validWitnesses,
      staleObservedState
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_POST_STATE_MISMATCH');
    expect(result.failureReason).toBe('stale_witness');
    expect(result.explanation).toContain('Stale post-state binding rejected');
  });

  it('accepts valid observed post-state matching expected transition delta and emits verification token with post-state', () => {
    const observedPostFp = FingerprintConstructor.computePostStateFingerprint({
      capabilityId: validActivation.initiatingCapabilityId,
      routeId: 'route_001',
      activationEventId: validActivation.eventId,
      observedApplicationState: { marketing_notifications_enabled: false },
    });

    const observedPostState: ObservedPostState = {
      postStateFingerprint: observedPostFp,
      observedApplicationState: { marketing_notifications_enabled: false },
      observedTimestamp: t0 + 40,
      activationEventId: validActivation.eventId,
      routeId: 'route_001',
      capabilityId: validActivation.initiatingCapabilityId,
      isObserved: true,
      observationSource: 'ExecutionDispatcher:observePostState',
    };

    const signature: TransitionSignature = {
      preStateFingerprint: 'STATE_PRE_MARKETING_ON',
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { marketing_notifications_enabled: false },
      verificationWindowMs: 2000,
      postStateFingerprint: observedPostFp,
    };

    const result = verifier.verifyTransition(
      signature,
      validActivation,
      validWitnesses,
      observedPostState
    );

    expect(result.causallyVerified).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.observedPostState).toBeDefined();
    expect(result.observedPostStateFingerprint).toBe(observedPostFp);
    expect(result.verificationToken).toBeDefined();
  });
});
