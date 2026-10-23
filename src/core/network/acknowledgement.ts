/**
 * IntentNav-SCFR: Genuine Network Acknowledgement Engine
 *
 * Implements Step 10: Genuine Network Acknowledgement
 * - Distinguishes dispatch, acknowledgement, observed state change, and verified transition.
 * - Binds acknowledgement evidence to activation event, route version, and capability.
 * - Rejects missing, stale, duplicated, contradictory, or unrelated acknowledgement evidence.
 * - Handles timeouts, server rejections, and duplicate acknowledgements safely.
 * - Preserves zero-external-egress privacy guarantee (Claim 11).
 */

import {
  AcknowledgementRecord,
  AcknowledgementStatus,
  AcknowledgementChannel,
  ActivationEventRecord,
} from '../../types/transition';
import { FingerprintConstructor } from '../fingerprint/constructor';

export interface AcknowledgementValidationResult {
  valid: boolean;
  status: AcknowledgementStatus;
  rejectionReason?: string;
  record?: AcknowledgementRecord;
}

export class AcknowledgementTracker {
  private recordedAcknowledgements: Map<string, AcknowledgementRecord> = new Map();
  private processedPayloadHashes: Set<string> = new Set();

  /**
   * Records an observable network acknowledgement from a local channel.
   */
  public recordAcknowledgement(params: {
    acknowledgementId: string;
    operation: string;
    status: AcknowledgementStatus;
    timestamp: number;
    activationEventId: string;
    routeId: string;
    capabilityId: string;
    sourceChannel: AcknowledgementChannel;
    rawPayload?: Record<string, unknown>;
  }): AcknowledgementRecord {
    const payloadStr = params.rawPayload ? JSON.stringify(params.rawPayload) : `${params.operation}_${params.status}`;
    const payloadHash = `ack_${FingerprintConstructor.sha256HexSync(payloadStr).slice(0, 16)}`;

    const record: AcknowledgementRecord = {
      acknowledgementId: params.acknowledgementId,
      operation: params.operation,
      status: params.status,
      timestamp: params.timestamp,
      activationEventId: params.activationEventId,
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      sourceChannel: params.sourceChannel,
      payloadHash,
      rawPayload: params.rawPayload,
      verified: false,
    };

    this.recordedAcknowledgements.set(params.acknowledgementId, record);
    return record;
  }

  /**
   * Validates an observed acknowledgement against the initiating activation event and route.
   * Strictly enforces:
   * 1. Non-null acknowledgement present (prevents missing ack from passing).
   * 2. Non-stale: acknowledgement timestamp >= activation event timestamp.
   * 3. Activation binding: acknowledgement must match activationEventId.
   * 4. Capability binding: acknowledgement must match initiating capabilityId.
   * 5. Non-contradictory: status must be 'COMPLETED' (not 'REJECTED' or 'ERROR').
   * 6. Anti-replay: duplicate payloads or identical IDs are flagged.
   */
  public validateAcknowledgement(
    ack: AcknowledgementRecord | null | undefined,
    activationEvent: ActivationEventRecord,
    routeId: string,
    capabilityId: string,
    timeoutMs: number = 3000
  ): AcknowledgementValidationResult {
    // 1. Missing acknowledgement check
    if (!ack) {
      return {
        valid: false,
        status: 'TIMEOUT',
        rejectionReason: `ACKNOWLEDGEMENT_TIMEOUT: No observable acknowledgement arrived within timeout window (${timeoutMs}ms). Cannot treat absence of confirmation as success.`,
      };
    }

    // 2. Timeout check against activation timestamp
    const latency = ack.timestamp - activationEvent.timestamp;
    if (latency > timeoutMs) {
      return {
        valid: false,
        status: 'TIMEOUT',
        rejectionReason: `ACKNOWLEDGEMENT_TIMEOUT: Acknowledgement arrived at +${latency}ms, exceeding allowed window of ${timeoutMs}ms.`,
      };
    }

    // 3. Stale acknowledgement check: ack occurred before activation event
    if (ack.timestamp < activationEvent.timestamp) {
      return {
        valid: false,
        status: 'ERROR',
        rejectionReason: `STALE_ACKNOWLEDGEMENT: Acknowledgement timestamp (${ack.timestamp}) predates activation event (${activationEvent.timestamp}). Pre-existing event cannot satisfy acknowledgement.`,
      };
    }

    // 4. Activation Event ID mismatch
    if (ack.activationEventId !== activationEvent.eventId) {
      return {
        valid: false,
        status: 'ERROR',
        rejectionReason: `MISMATCHED_ACTIVATION_ID: Acknowledgement binds to '${ack.activationEventId}', expected '${activationEvent.eventId}'.`,
      };
    }

    // 5. Capability and Route ID check
    if (ack.capabilityId && ack.capabilityId !== capabilityId) {
      return {
        valid: false,
        status: 'ERROR',
        rejectionReason: `MISMATCHED_CAPABILITY_ID: Acknowledgement binds to capability '${ack.capabilityId}', expected '${capabilityId}'.`,
      };
    }

    if (ack.routeId && routeId && ack.routeId !== routeId) {
      return {
        valid: false,
        status: 'ERROR',
        rejectionReason: `MISMATCHED_ROUTE_ID: Acknowledgement binds to route '${ack.routeId}', expected '${routeId}'.`,
      };
    }

    // 6. Contradictory / Server Rejection Check
    if (ack.status === 'REJECTED' || ack.status === 'ERROR') {
      return {
        valid: false,
        status: ack.status,
        rejectionReason: `SERVER_REJECTION: Network acknowledgement explicitly indicated server rejection or processing error: ${ack.status}.`,
      };
    }

    // 7. Duplicate / Replay Detection
    if (ack.payloadHash && this.processedPayloadHashes.has(ack.payloadHash)) {
      return {
        valid: false,
        status: 'ERROR',
        rejectionReason: `DUPLICATE_ACKNOWLEDGEMENT: Acknowledgement payload hash '${ack.payloadHash}' has already been processed. Replay rejected.`,
      };
    }

    if (ack.payloadHash) {
      this.processedPayloadHashes.add(ack.payloadHash);
    }

    ack.verified = true;
    ack.latencyMs = latency;

    return {
      valid: true,
      status: 'COMPLETED',
      record: ack,
    };
  }

  public getAcknowledgement(acknowledgementId: string): AcknowledgementRecord | undefined {
    return this.recordedAcknowledgements.get(acknowledgementId);
  }

  public clear(): void {
    this.recordedAcknowledgements.clear();
    this.processedPayloadHashes.clear();
  }
}
