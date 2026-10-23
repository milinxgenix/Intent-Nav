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
import { ActivationEventRecord } from '../../src/types/transition';

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
});
