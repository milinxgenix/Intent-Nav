/**
 * IntentNav-SCFR: Evidence-Driven Ranking Verification Tests (Prompt 5A)
 *
 * Covers:
 * TEST A — No transition evidence: Candidate with no transition evidence receives 0.0 (not 0.90)
 * TEST B — No validation history: Candidate with no history receives 0.0 (not 0.85)
 * TEST C — No context evidence: Candidate with no context receives 0.0 (not 0.75/0.80)
 * TEST D — Real context evidence: Adding matching context increases contextFit and rank
 * TEST E — Real validation history: Genuinely persisted validation records increase validationHistory
 * TEST F — Real transition evidence: Actual pre-activation feasible state increases transitionFit
 * TEST G — Invariant gate: Invariant-failing candidate never reaches CandidateRankingEngine
 * TEST H — Determinism: Identical evidence produces deterministic ranking and tie-breaking
 * TEST I — Missing evidence: Missing evidence produces INSUFFICIENT_EVIDENCE and is never treated as positive
 */

import { describe, it, expect, vi } from 'vitest';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { CandidatePipeline } from '../../src/core/candidate/pipeline';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { InvariantClosureEngine, CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('Prompt 5A: Evidence-Driven Candidate Ranking Verification', () => {
  const baseTargetFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [
      {
        id: 'PRE_CHECKED',
        name: 'Marketing notifications enabled',
        description: 'Marketing notifications must be enabled',
        evaluate: (ctx) => ctx['marketing_notifications_enabled'] === true,
      },
    ],
    allowedStateDelta: [
      {
        property: 'marketing_notifications_enabled',
        expectedChange: 'ENABLED_TO_DISABLED',
      },
    ],
    expectedPostState: [
      {
        property: 'marketing_notifications_enabled',
        expectedValue: false,
      },
    ],
    requiredContextPredicates: [
      {
        target: 'container',
        pattern: 'marketing',
        required: true,
      },
    ],
    forbiddenContextPredicates: [
      {
        target: 'container',
        pattern: 'danger-zone',
        required: false,
      },
    ],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing emails',
      semanticSynonyms: ['turn off marketing emails', 'mute marketing notifications'],
      accessibleName: 'Marketing email notifications switch',
      role: 'switch',
      visibleLabel: 'Marketing',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable marketing emails',
    },
    contextEvidence: {
      ancestorRelationships: ['section[marketing]', 'main[settings]'],
      nearbyText: ['promotional offers'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['marketing', 'notifications'],
      menuPanelRelationships: ['notifications'],
      relativeStructuralRelationships: ['main > section:nth-of-type(1) > button:nth-of-type(1)'],
      urlSemantics: '/settings/marketing',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_MARKETING_ON',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_notifications_enabled: false },
      postStateFingerprint: 'STATE_POST_MARKETING_OFF',
      historicalTransitionObservations: 10,
      witnessClasses: ['APPLICATION_STATE_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      verificationWindowMs: 2000,
    },
    riskMetadata: {
      riskClass: 'REVERSIBLE',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: {
      source: 'INITIAL_SPEC',
      creationTimestamp: Date.now(),
      validationTimestamp: Date.now(),
      routeVersion: 'v1.0.0',
      validationHistory: [], // Zero initial validation history
    },
    confidence: { capabilityConfidence: 0.95, routeConfidence: 0.90 },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  };

  // ==========================================================================
  // TEST A: NO TRANSITION EVIDENCE
  // ==========================================================================
  it('TEST A — candidate with no available transition evidence receives 0.0 (not synthetic 0.90)', () => {
    const rankingEngine = new CandidateRankingEngine();
    const candidateNoState: CandidateEvaluationContext = {
      candidateId: 'cand_no_trans',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      observedState: undefined, // Missing transition state evidence!
    };

    const scores = rankingEngine.rankCandidates(baseTargetFingerprint, [candidateNoState]);
    expect(scores.length).toBe(1);
    expect(scores[0]!.scoreBreakdown.transitionFit).toBe(0.0);
  });

  // ==========================================================================
  // TEST B: NO VALIDATION HISTORY
  // ==========================================================================
  it('TEST B — candidate with no validation history receives 0.0 (not synthetic 0.85)', () => {
    const rankingEngine = new CandidateRankingEngine();
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_unvalidated',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      observedState: { marketing_notifications_enabled: true },
    };

    // Fingerprint has empty validationHistory: []
    const scores = rankingEngine.rankCandidates(baseTargetFingerprint, [candidate]);
    expect(scores.length).toBe(1);
    expect(scores[0]!.scoreBreakdown.validationHistory).toBe(0.0);
  });

  // ==========================================================================
  // TEST C: NO CONTEXT EVIDENCE
  // ==========================================================================
  it('TEST C — candidate with no container/context evidence receives 0.0 (not synthetic 0.75/0.80)', () => {
    const rankingEngine = new CandidateRankingEngine();
    const candidateNoContext: CandidateEvaluationContext = {
      candidateId: 'cand_no_context',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: undefined,
      ancestors: undefined,
      nearbyText: undefined,
      observedState: { marketing_notifications_enabled: true },
    };

    const scores = rankingEngine.rankCandidates(baseTargetFingerprint, [candidateNoContext]);
    expect(scores.length).toBe(1);
    expect(scores[0]!.scoreBreakdown.contextFit).toBe(0.0);
  });

  // ==========================================================================
  // TEST D: REAL CONTEXT EVIDENCE
  // ==========================================================================
  it('TEST D — adding actual matching context changes contextFit and ranking', () => {
    const rankingEngine = new CandidateRankingEngine();

    const candidateWithoutContext: CandidateEvaluationContext = {
      candidateId: 'cand_plain',
      candidateLabel: 'Disable marketing',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: [],
      ancestors: [],
      observedState: { marketing_notifications_enabled: true },
    };

    const candidateWithContext: CandidateEvaluationContext = {
      candidateId: 'cand_contextual',
      candidateLabel: 'Disable marketing',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: ['marketing', 'notifications'],
      ancestors: ['section[marketing]', 'main[settings]'],
      nearbyText: ['promotional offers'],
      observedState: { marketing_notifications_enabled: true },
    };

    const scores = rankingEngine.rankCandidates(baseTargetFingerprint, [
      candidateWithoutContext,
      candidateWithContext,
    ]);

    expect(scores[0]!.candidateId).toBe('cand_contextual');
    expect(scores[0]!.scoreBreakdown.contextFit).toBeGreaterThan(0.0);
    expect(scores[1]!.candidateId).toBe('cand_plain');
    expect(scores[1]!.scoreBreakdown.contextFit).toBe(0.0);
  });

  // ==========================================================================
  // TEST E: REAL VALIDATION HISTORY
  // ==========================================================================
  it('TEST E — genuinely persisted validation record influences validationHistory score', () => {
    const rankingEngine = new CandidateRankingEngine();

    const validatedFingerprint: FunctionalCapabilityFingerprint = {
      ...baseTargetFingerprint,
      provenance: {
        ...baseTargetFingerprint.provenance,
        validationHistory: [
          { timestamp: Date.now() - 1000, routeVersion: 'v1.0.0', success: true, witnessCount: 2 },
          { timestamp: Date.now() - 500, routeVersion: 'v1.0.0', success: true, witnessCount: 2 },
        ],
      },
    };

    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_test',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      observedState: { marketing_notifications_enabled: true },
    };

    const scores = rankingEngine.rankCandidates(validatedFingerprint, [candidate]);
    expect(scores.length).toBe(1);
    expect(scores[0]!.scoreBreakdown.validationHistory).toBe(1.0);
  });

  // ==========================================================================
  // TEST F: REAL TRANSITION EVIDENCE (PRE-ACTIVATION FEASIBILITY)
  // ==========================================================================
  it('TEST F — actual available transition-compatible evidence changes transitionFit', () => {
    const rankingEngine = new CandidateRankingEngine();

    // Feasible candidate: marketing notifications currently enabled, can transition to disabled
    const feasibleCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_feasible',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      observedState: { marketing_notifications_enabled: true, disabled: false },
    };

    // Incompatible candidate: marketing notifications already disabled, cannot transition enabled->disabled
    const incompatibleCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_incompatible',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      observedState: { marketing_notifications_enabled: false, disabled: false },
    };

    const scores = rankingEngine.rankCandidates(baseTargetFingerprint, [
      incompatibleCandidate,
      feasibleCandidate,
    ]);

    expect(scores[0]!.candidateId).toBe('cand_feasible');
    expect(scores[0]!.scoreBreakdown.transitionFit).toBeGreaterThan(
      scores[1]!.scoreBreakdown.transitionFit
    );
  });

  // ==========================================================================
  // TEST G: INVARIANT GATE
  // ==========================================================================
  it('TEST G — invariant-failing candidate never reaches CandidateRankingEngine', () => {
    const negStore = new NegativeEvidenceStore();
    const rankingEngine = new CandidateRankingEngine();
    const rankSpy = vi.spyOn(rankingEngine, 'rankCandidates');
    const pipeline = new CandidatePipeline(negStore, rankingEngine);

    // Violates role invariant: role is 'textbox' instead of 'switch'
    const invalidCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_invalid_role',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'textbox',
      containerSemantics: ['marketing'],
      ancestors: ['section[marketing]'],
      observedState: { marketing_notifications_enabled: true },
    };

    const validCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_valid',
      candidateLabel: 'Turn off marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: ['marketing'],
      ancestors: ['section[marketing]'],
      observedState: { marketing_notifications_enabled: true },
    };

    const result = pipeline.processCandidates(baseTargetFingerprint, [
      invalidCandidate,
      validCandidate,
    ]);

    // Invalid candidate rejected before ranking
    expect(result.rejectedCandidates.some((r) => r.candidate.candidateId === 'cand_invalid_role')).toBe(true);

    // Ranking engine never received invalid candidate
    expect(rankSpy).toHaveBeenCalled();
    const candidatesPassed = rankSpy.mock.calls[0]![1];
    expect(candidatesPassed.map((c) => c.candidateId)).not.toContain('cand_invalid_role');
    expect(candidatesPassed.map((c) => c.candidateId)).toContain('cand_valid');
  });

  // ==========================================================================
  // TEST H: DETERMINISM
  // ==========================================================================
  it('TEST H — identical evidence produces deterministic ranking across multiple runs', () => {
    const rankingEngine = new CandidateRankingEngine();

    const candidateAlpha: CandidateEvaluationContext = {
      candidateId: 'cand_alpha',
      candidateLabel: 'Disable marketing communications',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: ['marketing', 'notifications'],
      observedState: { marketing_notifications_enabled: true },
    };

    const candidateBeta: CandidateEvaluationContext = {
      candidateId: 'cand_beta',
      candidateLabel: 'Turn off promotional offers',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: ['marketing'],
      observedState: { marketing_notifications_enabled: true },
    };

    const runs: string[][] = [];
    for (let i = 0; i < 5; i++) {
      const input = i % 2 === 0 ? [candidateAlpha, candidateBeta] : [candidateBeta, candidateAlpha];
      const ranked = rankingEngine.rankCandidates(baseTargetFingerprint, input);
      runs.push(ranked.map((r) => r.candidateId));
    }

    for (let i = 1; i < runs.length; i++) {
      expect(runs[i]).toEqual(runs[0]);
    }
  });

  // ==========================================================================
  // TEST I: MISSING EVIDENCE
  // ==========================================================================
  it('TEST I — missing evidence must never silently become PASS or positive evidence', () => {
    const candidateWithoutState: CandidateEvaluationContext = {
      candidateId: 'cand_missing_state',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      containerSemantics: ['marketing'],
      observedState: undefined,
    };

    const closureResult = InvariantClosureEngine.evaluateCandidate(
      baseTargetFingerprint,
      candidateWithoutState
    );

    // Missing state evidence yields INSUFFICIENT_EVIDENCE, not PASS
    expect(closureResult.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(closureResult.isEligibleForRanking).toBe(false);

    // Pipeline intercepts and blocks it from reaching ranking engine
    const negStore = new NegativeEvidenceStore();
    const rankingEngine = new CandidateRankingEngine();
    const rankSpy = vi.spyOn(rankingEngine, 'rankCandidates');
    const pipeline = new CandidatePipeline(negStore, rankingEngine);

    const pipelineResult = pipeline.processCandidates(baseTargetFingerprint, [candidateWithoutState]);
    expect(pipelineResult.eligibleCandidates.length).toBe(0);
    expect(pipelineResult.rankedScores.length).toBe(0);
    expect(rankSpy).toHaveBeenCalledWith(baseTargetFingerprint, []);
  });
});
