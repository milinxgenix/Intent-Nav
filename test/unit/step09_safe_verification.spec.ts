/**
 * IntentNav-SCFR: Step 9 — Safe and Reversible Verification Unit Tests
 *
 * Verifies:
 * 1. Safe verification probe classification: non-destructive observation vs. reversible probe.
 * 2. High-risk / irreversible actions are strictly prohibited from automatic execution for verification.
 * 3. Verified rollback: restoring prior validated route and verifying live invariants.
 * 4. Invariant failure on restored route triggers ROLLBACK_FAILED and quarantine.
 * 5. Demotion and negative evidence recording on verification failure.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SafeVerificationController } from '../../src/core/causal/safeVerification';
import { RouteManager } from '../../src/core/graph/routeManager';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { createFunctionalCapability } from '../../src/core/capability/catalog';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { PromotionTokenAuthenticator } from '../../src/core/quarantine/tokenAuthenticator';

describe('Step 9: Safe and Reversible Verification Controller', () => {
  let graph: CapabilityGraphEngine;
  let routeManager: RouteManager;

  beforeEach(() => {
    graph = new CapabilityGraphEngine();
    routeManager = new RouteManager(graph);
  });

  it('selects non-destructive observation for read-only actions', () => {
    const viewCap = createFunctionalCapability({
      capabilityId: 'CAP_VIEW_AUDIT_LOG',
      canonicalFunction: 'view_audit_log',
      actionType: 'VIEW',
      targetEntity: 'SECURITY_SETTINGS',
      riskMetadata: {
        riskClass: 'READ_ONLY',
        reversible: true,
        financial: false,
        security: false,
        destructive: false,
        requiresConfirmation: false,
      },
    });

    const assessment = SafeVerificationController.assessVerificationSafety(viewCap, false);
    expect(assessment.isSafeToProbe).toBe(true);
    expect(assessment.probeType).toBe('NON_DESTRUCTIVE_OBSERVATION');
    expect(assessment.requiresUserConfirmation).toBe(false);
  });

  it('prohibits automatic execution of high-risk / destructive actions without user confirmation', () => {
    const deleteCap = createFunctionalCapability({
      capabilityId: 'CAP_DELETE_ACCOUNT',
      canonicalFunction: 'delete_account',
      actionType: 'DELETE',
      targetEntity: 'ACCOUNT_STATUS',
      riskMetadata: {
        riskClass: 'DESTRUCTIVE',
        reversible: false,
        financial: false,
        security: false,
        destructive: true,
        requiresConfirmation: true,
      },
    });

    const assessmentNoConfirm = SafeVerificationController.assessVerificationSafety(deleteCap, false);
    expect(assessmentNoConfirm.isSafeToProbe).toBe(false);
    expect(assessmentNoConfirm.probeType).toBe('PROHIBITED_UNSAFE_PROBE');

    const assessmentWithConfirm = SafeVerificationController.assessVerificationSafety(deleteCap, true);
    expect(assessmentWithConfirm.isSafeToProbe).toBe(true);
    expect(assessmentWithConfirm.probeType).toBe('CONFIRMATION_GATED_EXECUTION');
  });

  it('successfully restores and verifies prior validated route on rollback', async () => {
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_TOGGLE_THEME',
      canonicalFunction: 'toggle_theme',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'UI_THEME',
    });

    graph.registerCapability(testCap.capabilityId, testCap.canonicalFunction);

    // Create route v1 and promote with valid token
    const v1 = routeManager.createProvisionalRoute(testCap.capabilityId, [
      { stepIndex: 1, fromStateId: 'PAGE', toStateId: 'PAGE', actionDescription: 'Toggle v1' },
    ], 0.95);

    const authKey = new Uint8Array(32).fill(0x5a);
    const mockAuth = new PromotionTokenAuthenticator(authKey);
    const rmWithAuth = new RouteManager(graph, mockAuth);

    const tokenV1 = mockAuth.issueToken({
      tokenId: 'tok_v1',
      routeId: v1.routeId,
      capabilityId: testCap.capabilityId,
      activationEventId: 'act_v1',
      verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      issuedTimestamp: Date.now(),
    });

    rmWithAuth.promoteToActive(testCap.capabilityId, v1.routeId, tokenV1);

    // Create route v2 and promote
    const v2 = rmWithAuth.createProvisionalRoute(testCap.capabilityId, [
      { stepIndex: 1, fromStateId: 'PAGE', toStateId: 'PAGE', actionDescription: 'Toggle v2' },
    ], 0.90);

    const tokenV2 = mockAuth.issueToken({
      tokenId: 'tok_v2',
      routeId: v2.routeId,
      capabilityId: testCap.capabilityId,
      activationEventId: 'act_v2',
      verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      issuedTimestamp: Date.now(),
    });
    rmWithAuth.promoteToActive(testCap.capabilityId, v2.routeId, tokenV2);

    expect(graph.getActiveRoute(testCap.capabilityId)?.routeId).toBe(v2.routeId);

    // Candidate context representing the restored v1 state
    const validCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_theme_v1',
      candidateLabel: 'Toggle theme',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'UI_THEME',
      observedRole: 'switch',
      observedState: { ui_theme_enabled: true },
      containerSemantics: [],
    };

    // Trigger demotion of v2 and verified rollback to v1
    const rollbackOutcome = SafeVerificationController.verifyAndExecuteRollback(
      rmWithAuth,
      testCap,
      v2.routeId,
      validCandidate,
      'v2 runtime execution failure'
    );

    expect(rollbackOutcome.status).toBe('ROLLBACK_VERIFIED');
    expect(rollbackOutcome.restoredRouteId).toBe(v1.routeId);
    expect(graph.getActiveRoute(testCap.capabilityId)?.routeId).toBe(v1.routeId);
  });

  it('quarantines restored route if live invariants fail during rollback verification', () => {
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_SEC_AUTH',
      canonicalFunction: 'disable_auth',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'TWO_FACTOR_AUTH',
    });

    graph.registerCapability(testCap.capabilityId, testCap.canonicalFunction);

    const v1 = routeManager.createProvisionalRoute(testCap.capabilityId, [], 0.95);
    const authKey = new Uint8Array(32).fill(0x5a);
    const mockAuth = new PromotionTokenAuthenticator(authKey);
    const rm = new RouteManager(graph, mockAuth);

    const tokenV1 = mockAuth.issueToken({
      tokenId: 'tok_v1',
      routeId: v1.routeId,
      capabilityId: testCap.capabilityId,
      activationEventId: 'act_v1',
      verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      issuedTimestamp: Date.now(),
    });

    rm.promoteToActive(testCap.capabilityId, v1.routeId, tokenV1);

    const v2 = rm.createProvisionalRoute(testCap.capabilityId, [], 0.85);
    const tokenV2 = mockAuth.issueToken({
      tokenId: 'tok_v2',
      routeId: v2.routeId,
      capabilityId: testCap.capabilityId,
      activationEventId: 'act_v2',
      verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      issuedTimestamp: Date.now(),
    });
    rm.promoteToActive(testCap.capabilityId, v2.routeId, tokenV2);

    // Contradicted candidate where live invariant fails (e.g. forbidden context)
    const invalidCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_contradicted',
      candidateLabel: 'disable 2fa',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'ALL_DATA', // Mismatched target entity
      observedRole: 'switch',
      containerSemantics: ['delete_account'], // Contradicted container
    };

    const outcome = SafeVerificationController.verifyAndExecuteRollback(
      rm,
      testCap,
      v2.routeId,
      invalidCandidate,
      'v2 runtime failed'
    );

    expect(outcome.status).toBe('ROLLBACK_FAILED');
    expect(graph.getActiveRoute(testCap.capabilityId)).toBeNull();
  });

  it('reports ROLLBACK_UNAVAILABLE when no prior validated route version exists', () => {
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_ONE_OFF',
      canonicalFunction: 'one_off_action',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'PRIVACY_SETTINGS',
    });

    graph.registerCapability(testCap.capabilityId, testCap.canonicalFunction);
    const v1 = routeManager.createProvisionalRoute(testCap.capabilityId, [], 0.8);

    const outcome = SafeVerificationController.verifyAndExecuteRollback(
      routeManager,
      testCap,
      v1.routeId,
      null,
      'Action failed'
    );

    expect(outcome.status).toBe('ROLLBACK_UNAVAILABLE');
    expect(outcome.restoredRouteId).toBeNull();
  });

  it('never rolls back to a previously QUARANTINED or DEMOTED prior route version', () => {
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_SECURE_ROLLBACK',
      canonicalFunction: 'secure_rollback',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'SECURITY_SETTINGS',
    });

    graph.registerCapability(testCap.capabilityId, testCap.canonicalFunction);
    const authKey = new Uint8Array(32).fill(0x3c);
    const mockAuth = new PromotionTokenAuthenticator(authKey);
    const rm = new RouteManager(graph, mockAuth);

    // Create v1, promote it, but subsequently quarantine it
    const v1 = rm.createProvisionalRoute(testCap.capabilityId, [], 0.9);
    const tokenV1 = mockAuth.issueToken({
      tokenId: 'tok_v1',
      routeId: v1.routeId,
      capabilityId: testCap.capabilityId,
      activationEventId: 'act_v1',
      verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      issuedTimestamp: 1000,
    });
    rm.promoteToActive(testCap.capabilityId, v1.routeId, tokenV1);
    rm.quarantineRoute(testCap.capabilityId, v1.routeId, 'Explicit quarantine of v1');

    // Create v2 and promote it
    const v2 = rm.createProvisionalRoute(testCap.capabilityId, [], 0.85);
    const tokenV2 = mockAuth.issueToken({
      tokenId: 'tok_v2',
      routeId: v2.routeId,
      capabilityId: testCap.capabilityId,
      activationEventId: 'act_v2',
      verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      issuedTimestamp: 2000,
    });
    rm.promoteToActive(testCap.capabilityId, v2.routeId, tokenV2);

    // Demote v2 and execute rollback - should NOT restore quarantined v1!
    const outcome = SafeVerificationController.verifyAndExecuteRollback(
      rm,
      testCap,
      v2.routeId,
      null,
      'v2 failed'
    );

    expect(outcome.status).toBe('ROLLBACK_UNAVAILABLE');
    expect(outcome.restoredRouteId).toBeNull();
    expect(graph.getActiveRoute(testCap.capabilityId)).toBeNull();
  });

  it('correctly classifies REVERSIBLE_PROBE for reversible preference modifications', () => {
    const revCap = createFunctionalCapability({
      capabilityId: 'CAP_TOGGLE_SETTING',
      canonicalFunction: 'toggle_setting',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'USER_INTERFACE',
      riskMetadata: {
        riskClass: 'REVERSIBLE',
        reversible: true,
        destructive: false,
        financial: false,
        security: false,
        requiresConfirmation: false,
      },
    });

    const assessment = SafeVerificationController.assessVerificationSafety(revCap, false);
    expect(assessment.isSafeToProbe).toBe(true);
    expect(assessment.probeType).toBe('REVERSIBLE_PROBE');
    expect(assessment.requiresUserConfirmation).toBe(false);
  });
});
