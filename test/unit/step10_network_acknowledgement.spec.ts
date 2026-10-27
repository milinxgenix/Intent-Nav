/**
 * IntentNav-SCFR: Step 10 — Genuine Network Acknowledgement Unit Tests
 *
 * Verifies:
 * 1. Recording and validating genuine network acknowledgements.
 * 2. Missing acknowledgement timeout (fails closed; never treated as success).
 * 3. Stale acknowledgement rejection (predating activation event timestamp).
 * 4. Mismatched activation ID or capability ID rejection.
 * 5. Server rejection / processing error acknowledgement rejection.
 * 6. Duplicate / replay acknowledgement rejection.
 * 7. Operational separation: dispatch != ack != state change != verified transition.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AcknowledgementTracker } from '../../src/core/network/acknowledgement';
import { ActivationEventRecord, TransitionWitness } from '../../src/types/transition';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { createFunctionalCapability } from '../../src/core/capability/catalog';

describe('Step 10: Genuine Network Acknowledgement Engine', () => {
  let tracker: AcknowledgementTracker;
  let activationEvent: ActivationEventRecord;

  beforeEach(() => {
    tracker = new AcknowledgementTracker();
    activationEvent = {
      eventId: 'act_1001',
      sequenceNumber: 1,
      timestamp: 10000,
      targetCandidateId: 'cand_download_button',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_EXPORT_DATA',
    };
  });

  it('successfully validates a genuine network acknowledgement bound to the activation event', () => {
    const ack = tracker.recordAcknowledgement({
      acknowledgementId: 'ack_2001',
      operation: 'export_data',
      status: 'COMPLETED',
      timestamp: 10250, // 250ms after activation
      activationEventId: 'act_1001',
      routeId: 'route_export_v1',
      capabilityId: 'CAP_EXPORT_DATA',
      sourceChannel: 'LOCAL_HTTP_MOCK',
      rawPayload: { download_ready: true, file_size_bytes: 4096 },
    });

    const validation = tracker.validateAcknowledgement(
      ack,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA',
      3000
    );

    expect(validation.valid).toBe(true);
    expect(validation.status).toBe('COMPLETED');
    expect(validation.record?.verified).toBe(true);
    expect(validation.record?.latencyMs).toBe(250);
  });

  it('fails closed on missing acknowledgement timeout, never treating absence as success', () => {
    const validation = tracker.validateAcknowledgement(
      null,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA',
      2500
    );

    expect(validation.valid).toBe(false);
    expect(validation.status).toBe('TIMEOUT');
    expect(validation.rejectionReason).toContain('ACKNOWLEDGEMENT_TIMEOUT');
    expect(validation.rejectionReason).toContain('Cannot treat absence of confirmation as success');
  });

  it('rejects stale acknowledgements that predate the activation event timestamp', () => {
    const staleAck = tracker.recordAcknowledgement({
      acknowledgementId: 'ack_stale',
      operation: 'export_data',
      status: 'COMPLETED',
      timestamp: 9500, // 500ms BEFORE activation
      activationEventId: 'act_1001',
      routeId: 'route_export_v1',
      capabilityId: 'CAP_EXPORT_DATA',
      sourceChannel: 'CUSTOM_ACK_EVENT',
    });

    const validation = tracker.validateAcknowledgement(
      staleAck,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA'
    );

    expect(validation.valid).toBe(false);
    expect(validation.rejectionReason).toContain('STALE_ACKNOWLEDGEMENT');
  });

  it('rejects acknowledgements with mismatched activationEventId or capabilityId', () => {
    const mismatchedAck = tracker.recordAcknowledgement({
      acknowledgementId: 'ack_mismatch',
      operation: 'export_data',
      status: 'COMPLETED',
      timestamp: 10100,
      activationEventId: 'act_OTHER_EVENT', // Mismatched ID
      routeId: 'route_export_v1',
      capabilityId: 'CAP_EXPORT_DATA',
      sourceChannel: 'LOCAL_HTTP_MOCK',
    });

    const validation = tracker.validateAcknowledgement(
      mismatchedAck,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA'
    );

    expect(validation.valid).toBe(false);
    expect(validation.rejectionReason).toContain('MISMATCHED_ACTIVATION_ID');
  });

  it('rejects acknowledgements indicating server rejection or processing error', () => {
    const rejectedAck = tracker.recordAcknowledgement({
      acknowledgementId: 'ack_rejected',
      operation: 'export_data',
      status: 'REJECTED',
      timestamp: 10200,
      activationEventId: 'act_1001',
      routeId: 'route_export_v1',
      capabilityId: 'CAP_EXPORT_DATA',
      sourceChannel: 'FETCH_RESPONSE',
      rawPayload: { error: 'Rate limit exceeded', code: 429 },
    });

    const validation = tracker.validateAcknowledgement(
      rejectedAck,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA'
    );

    expect(validation.valid).toBe(false);
    expect(validation.rejectionReason).toContain('SERVER_REJECTION');
  });

  it('rejects duplicate or replayed acknowledgements', () => {
    const ack1 = tracker.recordAcknowledgement({
      acknowledgementId: 'ack_first',
      operation: 'export_data',
      status: 'COMPLETED',
      timestamp: 10100,
      activationEventId: 'act_1001',
      routeId: 'route_export_v1',
      capabilityId: 'CAP_EXPORT_DATA',
      sourceChannel: 'LOCAL_HTTP_MOCK',
      rawPayload: { token: 'unique_transaction_token_123' },
    });

    const v1 = tracker.validateAcknowledgement(
      ack1,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA'
    );
    expect(v1.valid).toBe(true);

    // Same payload presented as a second acknowledgement
    const duplicateAck = tracker.recordAcknowledgement({
      acknowledgementId: 'ack_replay',
      operation: 'export_data',
      status: 'COMPLETED',
      timestamp: 10200,
      activationEventId: 'act_1001',
      routeId: 'route_export_v1',
      capabilityId: 'CAP_EXPORT_DATA',
      sourceChannel: 'LOCAL_HTTP_MOCK',
      rawPayload: { token: 'unique_transaction_token_123' },
    });

    const v2 = tracker.validateAcknowledgement(
      duplicateAck,
      activationEvent,
      'route_export_v1',
      'CAP_EXPORT_DATA'
    );
    expect(v2.valid).toBe(false);
    expect(v2.rejectionReason).toContain('DUPLICATE_ACKNOWLEDGEMENT');
  });

  it('demonstrates operational separation: network acknowledgement alone cannot prove state change or satisfy causal verification', async () => {
    const verifier = new CausalTransitionVerifier();
    const actEvent: ActivationEventRecord = {
      eventId: 'act_ack_only',
      sequenceNumber: 1,
      timestamp: 10000,
      targetCandidateId: 'cand_export',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_EXPORT_DATA',
    };

    // Only ASYNC_ACKNOWLEDGEMENT witness provided (no independent DOM/app state change witness)
    const ackWitnesses: TransitionWitness[] = [
      {
        witnessId: 'wit_ack_1',
        witnessClass: 'ASYNC_ACKNOWLEDGEMENT',
        source: 'NetworkInterceptor:response',
        timestamp: 10150,
        correlatedActivationEventId: 'act_ack_only',
        observedDelta: { status: 'COMPLETED', operation: 'export_data', download_ready: true },
      } as any,
    ];

    // 1. Verification fails due to insufficient independent witness classes (quorum >= 2)
    const result1 = await verifier.verifyTransitionAsync(
      {
        preStateFingerprint: 'STATE_PRE_DOWNLOAD',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { download_ready: true },
        verificationWindowMs: 2500,
        postStateFingerprint: 'STATE_POST_DOWNLOAD',
      },
      actEvent,
      ackWitnesses
    );

    expect(result1.causallyVerified).toBe(false);
    expect(result1.status).toBe('FAILED_INSUFFICIENT_WITNESS_CLASSES');

    // 2. Even if a 2nd witness exists, if post-state is unchanged from pre-state, verification fails
    const secondWitnesses: TransitionWitness[] = [
      ...ackWitnesses,
      {
        witnessId: 'wit_dom_1',
        witnessClass: 'DOM_MUTATION',
        source: 'MutationObserver',
        timestamp: 10200,
        correlatedActivationEventId: 'act_ack_only',
        observedDelta: { download_ready: true },
      } as any,
    ];

    const result2 = await verifier.verifyTransitionAsync(
      {
        preStateFingerprint: 'STATE_PRE_DOWNLOAD',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { download_ready: true },
        verificationWindowMs: 2500,
        postStateFingerprint: 'STATE_PRE_DOWNLOAD', // UNCHANGED post-state!
      },
      actEvent,
      secondWitnesses,
      'STATE_PRE_DOWNLOAD' // Post-state fingerprint identical to pre-state
    );

    expect(result2.causallyVerified).toBe(false);
    expect(result2.status).toBe('FAILED_POST_STATE_MISMATCH');
    expect(result2.explanation).toContain('Post-state fingerprint identical to pre-state');
  });

  it('state machine halts execution and quarantines route when network acknowledgement indicates server rejection', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_EXPORT_DATA',
      canonicalFunction: 'export_data',
      actionType: 'NAVIGATE',
      targetEntity: 'USER_DATA',
    });

    const route = {
      routeId: 'route_server_reject_test',
      capabilityId: 'CAP_EXPORT_DATA',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_DOWNLOAD',
          actionDescription: 'Export Data',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 1.0,
    };

    let eventId = 'act_reject_01';
    const rejectingDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        return {
          success: true,
          activationEvent: {
            eventId,
            sequenceNumber: 1,
            timestamp: Date.now(),
            targetCandidateId: 'cand_export',
            eventType: 'click',
            initiatingCapabilityId: 'CAP_EXPORT_DATA',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: 'wit_server_rej',
            witnessClass: 'ASYNC_ACKNOWLEDGEMENT',
            source: 'NetworkInterceptor:fetch',
            timestamp: Date.now() + 50,
            correlatedActivationEventId: eventId,
            observedDelta: {
              status: 'REJECTED',
              statusCode: 429,
              error: 'Rate limit exceeded',
            },
          },
        ] as any;
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      route,
      rejectingDispatcher,
      testCap
    );

    expect(outcome.success).toBe(false);
    expect(outcome.finalState).toBe('QUARANTINED');
    expect(outcome.failureReason).toContain('SERVER_REJECTION');
    expect(['QUARANTINED', 'DEMOTED']).toContain(route.status);
  });

  it('state machine detects and halts execution on duplicate/replayed network acknowledgement across sequential steps', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_EXPORT_DATA',
      canonicalFunction: 'export_data',
      actionType: 'NAVIGATE',
      targetEntity: 'USER_DATA',
    });

    const twoStepRoute = {
      routeId: 'route_dup_ack_test',
      capabilityId: 'CAP_EXPORT_DATA',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_A',
          toStateId: 'STATE_B',
          actionDescription: 'Step 1',
        },
        {
          stepIndex: 2,
          fromStateId: 'STATE_B',
          toStateId: 'STATE_C',
          actionDescription: 'Step 2',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 2.0,
    };

    let currentEventId = '';
    const replayingDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        currentEventId = `act_dup_${Date.now()}_${Math.random()}`;
        return {
          success: true,
          activationEvent: {
            eventId: currentEventId,
            sequenceNumber: 1,
            timestamp: Date.now(),
            targetCandidateId: 'cand_export',
            eventType: 'click',
            initiatingCapabilityId: 'CAP_EXPORT_DATA',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: `wit_ack_${Math.random()}`,
            witnessClass: 'ASYNC_ACKNOWLEDGEMENT',
            source: 'NetworkInterceptor:response',
            timestamp: Date.now() + 20,
            correlatedActivationEventId: currentEventId,
            // Exactly identical raw payload repeated across both steps
            observedDelta: { transaction_token: 'STATIC_NONCE_TOKEN_123', status: 'COMPLETED' },
          },
          {
            witnessId: `wit_dom_${Math.random()}`,
            witnessClass: 'DOM_MUTATION',
            source: 'MutationObserver',
            timestamp: Date.now() + 30,
            correlatedActivationEventId: currentEventId,
            observedDelta: { step_done: true },
          },
        ] as any;
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      twoStepRoute,
      replayingDispatcher,
      testCap
    );

    // Step 1 consumed the payload hash. Step 2 replaying the same payload hash must be flagged and rejected!
    expect(outcome.success).toBe(false);
    expect(outcome.completedStepsCount).toBe(1); // Step 1 succeeded
    expect(outcome.failedStepIndex).toBe(2);     // Step 2 failed on replay!
    expect(outcome.failureReason).toContain('DUPLICATE_ACKNOWLEDGEMENT');
    expect(outcome.finalState).toBe('QUARANTINED');
  });
});
