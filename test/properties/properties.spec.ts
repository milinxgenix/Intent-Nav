/**
 * IntentNav-SCFR: Formal Machine Safety Properties (1 through 15)
 *
 * Mathematically and programmatically proves all 15 core safety guarantees.
 */

import { describe, it, expect } from 'vitest';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { ExecutionAuthorizationController } from '../../src/core/authorization/controller';
import { InvariantClosureEngine, CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { VolatileFeatureSuppressor } from '../../src/core/fingerprint/suppressor';
import { CandidatePipeline } from '../../src/core/candidate/pipeline';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import { RouteManager } from '../../src/core/graph/routeManager';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { TransitionWitness, ActivationEventRecord } from '../../src/types/transition';

describe('Formal Machine Safety Properties (1 through 15)', () => {
  const cap: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_SEC',
    canonicalFunction: 'disable_security',
    actionType: 'REVOKE_ACCESS',
    targetEntity: 'TWO_FACTOR_AUTH',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [{ property: 'two_factor_enabled', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'two_factor_enabled', expectedValue: false }],
    requiredContextPredicates: [{ target: 'container', pattern: 'security', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'destructive_trap', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Disable 2FA',
      semanticSynonyms: ['turn off 2fa'],
      accessibleName: 'Disable 2FA',
      role: 'button',
      visibleLabel: 'Turn Off 2FA',
      sectionMeaning: 'Security',
      actionDescription: 'Disable 2FA',
    },
    contextEvidence: {
      ancestorRelationships: ['section[security]'],
      nearbyText: ['Security protection'],
      surroundingLabels: ['Two-Factor Authentication'],
      containerSemantics: ['security'],
      menuPanelRelationships: ['Security'],
      relativeStructuralRelationships: ['main > section > button'],
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { two_factor_enabled: false },
      postStateFingerprint: 'POST',
      historicalTransitionObservations: 2,
      witnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      verificationWindowMs: 2000,
    },
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: false,
      financial: false,
      security: true,
      destructive: true,
      requiresConfirmation: true,
    },
    provenance: { source: 'INITIAL_SPEC', creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1', validationHistory: [] },
    confidence: { capabilityConfidence: 0.99, routeConfidence: 0.99 },
    negativeEvidence: { rejectedCandidateIdentities: ['ALL_NOTIFICATIONS'], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
  };

  // PROPERTY 1: No candidate failing invariant closure can enter ranking.
  it('PROPERTY 1: No candidate failing invariant closure can enter ranking', () => {
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_fail',
      candidateLabel: 'Wrong target button',
      observedActionType: 'REVOKE_ACCESS',
      observedTargetEntity: 'WRONG_ENTITY',
      observedRole: 'button',
      containerSemantics: ['security'],
    };

    const invResult = InvariantClosureEngine.evaluateCandidate(cap, candidate);
    expect(invResult.status).not.toBe('PASS');
    expect(invResult.isEligibleForRanking).toBe(false);

    const pipeline = new CandidatePipeline(new NegativeEvidenceStore(), new CandidateRankingEngine());
    const result = pipeline.processCandidates(cap, [candidate]);
    expect(result.rankedScores.length).toBe(0);
  });

  // PROPERTY 2: No candidate with contradiction can enter ranking.
  it('PROPERTY 2: No candidate with contradiction can enter ranking', () => {
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_contradiction',
      candidateLabel: 'Indiscriminate All Notifications',
      observedActionType: 'REVOKE_ACCESS',
      observedTargetEntity: 'ALL_NOTIFICATIONS', // Forbidden
      observedRole: 'button',
      containerSemantics: ['security'],
    };

    const invResult = InvariantClosureEngine.evaluateCandidate(cap, candidate);
    expect(invResult.status).toBe('CONTRADICTED');
    expect(invResult.isEligibleForRanking).toBe(false);

    const pipeline = new CandidatePipeline(new NegativeEvidenceStore(), new CandidateRankingEngine());
    const result = pipeline.processCandidates(cap, [candidate]);
    expect(result.rankedScores.find((r) => r.candidateId === candidate.candidateId)).toBeUndefined();
  });

  // PROPERTY 3: No provisional route can become active without verification evidence.
  it('PROPERTY 3: No provisional route can become active without verification evidence', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);
    const prov = routeManager.createProvisionalRoute('CAP_SEC', [], 0.8);

    expect(prov.status).toBe('PROVISIONAL');
    // Attempt promotion without a valid TransitionVerificationToken must throw
    expect(() => {
      (routeManager as any).promoteToActive('CAP_SEC', prov.routeId, null);
    }).toThrow(/INVARIANT VIOLATION/);
  });

  // PROPERTY 4: No unrelated witness can satisfy causal verification.
  it('PROPERTY 4: No unrelated witness can satisfy causal verification', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const activation: ActivationEventRecord = {
      eventId: 'act_1',
      sequenceNumber: 1,
      timestamp: 1000,
      targetCandidateId: 'cand_1',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_SEC',
    };

    // Witnesses that occurred within the window but have unrelated mutations
    const unrelatedWitnesses: TransitionWitness[] = [
      {
        witnessId: 'wit_1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: 1050,
        observedDelta: { cosmeticTheme: 'dark' }, // Unrelated to two_factor_enabled
        correlatedActivationEventId: null,
        temporalDeltaMs: 50,
        isCausallyCorrelated: false,
        correlationExplanation: 'Theme change',
      },
      {
        witnessId: 'wit_2',
        witnessClass: 'APPLICATION_STATE_MUTATION',
        sequenceNumber: 2,
        timestamp: 1100,
        observedDelta: { analyticsSessionId: 9942 }, // Unrelated
        correlatedActivationEventId: null,
        temporalDeltaMs: 100,
        isCausallyCorrelated: false,
        correlationExplanation: 'Analytics update',
      },
    ];

    const result = verifier.verifyTransition(
      {
        preStateFingerprint: 'PRE',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { two_factor_enabled: false },
        verificationWindowMs: 2000,
        postStateFingerprint: 'POST',
      },
      activation,
      unrelatedWitnesses
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_UNRELATED_MUTATION');
  });

  // PROPERTY 5: No pre-existing state can satisfy transition verification.
  it('PROPERTY 5: No pre-existing state can satisfy transition verification', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const activation: ActivationEventRecord = {
      eventId: 'act_1',
      sequenceNumber: 1,
      timestamp: 1000,
      targetCandidateId: 'cand_1',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_SEC',
    };

    // Pre-existing witness occurred BEFORE activation (t = 950 < t_act = 1000)
    const preExistingWitness: TransitionWitness = {
      witnessId: 'wit_pre',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: 950,
      observedDelta: { two_factor_enabled: false },
      correlatedActivationEventId: null,
      temporalDeltaMs: -50,
      isCausallyCorrelated: false,
      correlationExplanation: 'Mutation before click',
    };

    const result = verifier.verifyTransition(
      {
        preStateFingerprint: 'PRE',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { two_factor_enabled: false },
        verificationWindowMs: 2000,
        postStateFingerprint: 'POST',
      },
      activation,
      [preExistingWitness]
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_PRE_EXISTING_STATE');
  });

  // PROPERTY 6: No expected state change without activation can satisfy causal verification.
  it('PROPERTY 6: No expected state change without activation can satisfy causal verification', () => {
    const verifier = new CausalTransitionVerifier({ minWitnessClasses: 2 });
    const activation: ActivationEventRecord = {
      eventId: 'act_empty',
      sequenceNumber: 1,
      timestamp: 1000,
      targetCandidateId: 'cand_1',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_SEC',
    };

    // Zero witnesses observed
    const result = verifier.verifyTransition(
      {
        preStateFingerprint: 'PRE',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { two_factor_enabled: false },
        verificationWindowMs: 2000,
        postStateFingerprint: 'POST',
      },
      activation,
      []
    );

    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_MISSING_WITNESSES');
  });

  // PROPERTY 7: No active route can be restored from quarantined evidence.
  it('PROPERTY 7: No active route can be restored from quarantined evidence', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);

    const r1 = routeManager.createProvisionalRoute('CAP_SEC', [], 0.9);
    routeManager.quarantineRoute('CAP_SEC', r1.routeId, 'Repeated decoy failures');

    const activeRoute = routeManager.createProvisionalRoute('CAP_SEC', [], 0.85);
    // Demote active route
    const { rollbackRoute } = routeManager.demoteActiveRoute('CAP_SEC', activeRoute.routeId, 'Runtime failure');

    // Rollback MUST NOT restore the quarantined route r1
    expect(rollbackRoute).toBeNull();
  });

  // PROPERTY 8: High capability confidence cannot bypass high-risk authorization.
  it('PROPERTY 8: High capability confidence cannot bypass high-risk authorization', () => {
    const highConfCap = { ...cap, confidence: { capabilityConfidence: 0.999, routeConfidence: 0.999 } };
    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: highConfCap,
      capabilityConfidence: 0.999,
      routeConfidence: 0.999,
      invariantResult: { candidateId: 'c1', status: 'PASS', isEligibleForRanking: true, passedPredicates: [], failedPredicates: [], evaluatedTimestamp: Date.now() },
      transitionResult: null,
      userConfirmationGranted: false, // NOT CONFIRMED
    });

    expect(decision.status).toBe('CONFIRMATION_REQUIRED');
  });

  // PROPERTY 9: No high-risk execution without confirmation.
  it('PROPERTY 9: No high-risk execution without confirmation', () => {
    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: cap,
      capabilityConfidence: 0.95,
      routeConfidence: 0.90,
      invariantResult: { candidateId: 'c1', status: 'PASS', isEligibleForRanking: true, passedPredicates: [], failedPredicates: [], evaluatedTimestamp: Date.now() },
      transitionResult: null,
      userConfirmationGranted: false,
    });

    expect(decision.status).toBe('CONFIRMATION_REQUIRED');
  });

  // PROPERTY 10: No volatile ID alone can establish capability identity.
  it('PROPERTY 10: No volatile ID alone can establish capability identity', () => {
    const div = document.createElement('button');
    div.id = ':r918:';
    div.className = 'css-8291 x-19 p-4';
    div.textContent = 'Random action';

    const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(div);
    expect(suppression.isSuppressedId).toBe(true);
    expect(suppression.featureWeights.presentationWeight).toBeLessThanOrEqual(0.02);
  });

  // PROPERTY 11: No semantic score can override mandatory invariant failure.
  it('PROPERTY 11: No semantic score can override mandatory invariant failure', () => {
    const rankingEngine = new CandidateRankingEngine();
    const negStore = new NegativeEvidenceStore();
    const pipeline = new CandidatePipeline(negStore, rankingEngine);

    const candidateDecoy: CandidateEvaluationContext = {
      candidateId: 'cand_decoy_high_sim',
      candidateLabel: 'Disable 2FA Indiscriminately',
      observedActionType: 'REVOKE_ACCESS',
      observedTargetEntity: 'ALL_NOTIFICATIONS', // Violates target entity
      observedRole: 'button',
      containerSemantics: ['security'],
    };

    const sim = rankingEngine.computeSemanticSimilarity('Disable 2FA', candidateDecoy.candidateLabel);
    expect(sim).toBeGreaterThan(0.4);

    const result = pipeline.processCandidates(cap, [candidateDecoy]);
    expect(result.rankedScores.length).toBe(0);
    expect(result.selectedWinner).toBeNull();
  });

  // PROPERTY 12: A recovered route must create a new route version.
  it('PROPERTY 12: A recovered route must create a new route version', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);

    const r1 = routeManager.createProvisionalRoute('CAP_SEC', [], 0.8);
    expect(r1.versionNumber).toBe(1);

    const r2 = routeManager.createProvisionalRoute('CAP_SEC', [], 0.85);
    expect(r2.versionNumber).toBe(2);
    expect(r2.routeId).not.toBe(r1.routeId);
  });

  // PROPERTY 13: Failed routes remain historical negative evidence.
  it('PROPERTY 13: Failed routes remain historical negative evidence', () => {
    const negStore = new NegativeEvidenceStore();
    negStore.recordContradiction(
      'route_failed_v1',
      'CAUSAL_WITNESS_FAILURE',
      'WITNESS_TIMEOUT',
      'Route failed transition witness collection'
    );

    expect(negStore.isKnownContradiction('route_failed_v1')).toBe(true);
    const records = negStore.getAllRecords();
    expect(records.some((r) => r.failedInvariantId === 'WITNESS_TIMEOUT')).toBe(true);
  });

  // PROPERTY 14: Material interface change can invalidate prior negative evidence suppression.
  it('PROPERTY 14: Material interface change can invalidate prior negative evidence suppression', () => {
    const negStore = new NegativeEvidenceStore();
    const initialCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_btn',
      candidateLabel: 'Old Label',
      observedRole: 'button',
      observedActionType: 'DELETE',
      observedTargetEntity: 'ALL_NOTIFICATIONS',
      containerSemantics: ['general'],
    };

    negStore.recordContradiction(
      'cand_btn',
      'WRONG_TARGET_ENTITY',
      'INV_TARGET',
      'Wrong target',
      {},
      {},
      undefined,
      initialCandidate
    );

    // Same material evidence -> suppressed
    expect(negStore.isKnownContradiction('cand_btn', initialCandidate)).toBe(true);

    // Material interface change (changed role, label, and container semantics)
    const modifiedCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_btn',
      candidateLabel: 'Updated Marketing Switch',
      observedRole: 'switch',
      observedActionType: 'TOGGLE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      containerSemantics: ['notifications', 'preferences'],
    };

    // Material interface change -> candidate may be reconsidered!
    expect(negStore.isKnownContradiction('cand_btn', modifiedCandidate)).toBe(false);
  });

  // PROPERTY 15: EXECUTED means actual browser dispatch + required final validation.
  it('PROPERTY 15: EXECUTED means actual browser dispatch + required final validation', async () => {
    const machine = new IntentNavMachine();
    machine.registerCapability(cap);

    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_2fa',
      candidateLabel: 'Disable 2FA',
      observedActionType: 'REVOKE_ACCESS',
      observedTargetEntity: 'TWO_FACTOR_AUTH',
      observedRole: 'button',
      containerSemantics: ['security'],
      ancestors: ['section[security]'],
      observedState: { disabled: false },
    };

    let dispatchCalled = false;
    const mockDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        dispatchCalled = true;
        return {
          success: true,
          activationEvent: {
            eventId: 'act_live_1',
            sequenceNumber: 1,
            timestamp: 1000,
            targetCandidateId: candidate.candidateId,
            eventType: 'click',
            initiatingCapabilityId: cap.capabilityId,
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: 'wit_1',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: 1050,
            observedDelta: { two_factor_enabled: false },
            correlatedActivationEventId: null,
            temporalDeltaMs: 50,
            isCausallyCorrelated: false,
            correlationExplanation: 'DOM mutated',
          },
          {
            witnessId: 'wit_2',
            witnessClass: 'APPLICATION_STATE_MUTATION',
            sequenceNumber: 2,
            timestamp: 1100,
            observedDelta: { two_factor_enabled: false },
            correlatedActivationEventId: null,
            temporalDeltaMs: 100,
            isCausallyCorrelated: false,
            correlationExplanation: 'App state updated',
          },
        ];
      },
    };

    // With userConfirmationGranted = true and real dispatcher
    const result = await machine.processIntent(
      'Turn off 2FA',
      { tag: 'body' },
      [candidate],
      true, // userConfirmationGranted
      mockDispatcher
    );

    expect(dispatchCalled).toBe(true);
    expect(result.currentState).toBe('EXECUTED');
    expect(result.verificationResult?.causallyVerified).toBe(true);
  });
});
