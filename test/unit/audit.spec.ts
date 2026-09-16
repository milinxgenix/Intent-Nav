/**
 * IntentNav-SCFR: Append-Only Audit Logger Tests
 */

import { describe, it, expect } from 'vitest';
import { AuditLogger } from '../../src/core/audit/logger';

describe('AuditLogger', () => {
  it('records immutable audit records and exports full structured JSON', () => {
    const logger = new AuditLogger('session_test_001');

    logger.log({
      intent: { rawGoal: 'Stop marketing', normalizedGoal: 'modify marketing', actionType: 'MODIFY_PREFERENCE', targetEntity: 'MARKETING_NOTIFICATIONS', constraints: [], sensitivityHints: [], confidence: 0.9 },
      capabilityId: 'CAP_DISABLE_MARKETING',
      previousRouteId: null,
      currentRouteId: 'route_1',
      interfaceStateId: 'STATE_1',
      driftVector: { presentation: 0.1, context: 0, structure: 0, capability: 0, transition: 0 },
      candidateList: ['cand_1'],
      invariantResults: {},
      contradictionResults: {},
      rebindScores: {},
      selectedCandidateId: 'cand_1',
      causalVerificationResult: null,
      quarantineState: 'ACTIVE_VALIDATED',
      promotionResult: 'PROMOTED',
      capabilityConfidence: 0.9,
      routeConfidence: 0.85,
      riskClass: 'REVERSIBLE',
      executionAuthorization: { status: 'AUTHORIZED', riskClass: 'REVERSIBLE', capabilityConfidence: 0.9, routeConfidence: 0.85, evidenceQuorum: {} as any, requiresUserConfirmation: false, policyReason: 'OK', evaluatedTimestamp: Date.now() },
      userConfirmation: null,
      finalOutcome: 'EXECUTED',
    });

    const records = logger.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0]?.recordId).toBeDefined();
    expect(records[0]?.finalOutcome).toBe('EXECUTED');

    // Immutability test: mutating logged record copy throws or fails
    expect(Object.isFrozen(records[0])).toBe(true);

    const exported = logger.exportLog('1.0.0');
    expect(exported.recordsCount).toBe(1);
    expect(exported.records[0]?.capabilityId).toBe('CAP_DISABLE_MARKETING');
    expect(exported.systemVersion).toBe('1.0.0');
  });
});
