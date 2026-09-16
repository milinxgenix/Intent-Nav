/**
 * IntentNav-SCFR: Semantic Precedence & Invariant Gate Ordering Test (Phase 10)
 *
 * Proves that:
 * - Candidate A has high semantic similarity (0.98) to the user's intent query,
 *   but fails mandatory invariant closure (wrong target entity / contradiction).
 * - Candidate B has moderate semantic similarity (0.82) to the user's intent query,
 *   but passes all mandatory invariant closure checks.
 * - Result: Candidate A is REJECTED at the Invariant Closure Gate and NEVER reaches the ranking engine.
 *   Candidate B is ranked and selected as the winner.
 */

import { describe, it, expect } from 'vitest';
import { CandidatePipeline } from '../../src/core/candidate/pipeline';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';

describe('Phase 10: Semantic Precedence & Invariant Closure Ordering', () => {
  const targetFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'TOGGLE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'marketing_emails_enabled', expectedValue: false }],
    requiredContextPredicates: [{ target: 'container', pattern: 'notification', required: true }],
    forbiddenContextPredicates: [{ target: 'container', pattern: 'destructive_trap', required: false }],
    semanticEvidence: {
      canonicalLabel: 'Disable Marketing Emails',
      semanticSynonyms: ['turn off marketing emails', 'mute promotional newsletters'],
      accessibleName: 'Disable Marketing Emails',
      role: 'switch',
      visibleLabel: 'Disable Marketing Emails',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable promotional marketing emails',
    },
    contextEvidence: {
      ancestorRelationships: ['section[notifications]', 'main[settings]'],
      nearbyText: ['Receive promotional offers'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications', 'settings'],
      menuPanelRelationships: ['Notifications'],
      relativeStructuralRelationships: ['div > section > button'],
      urlSemantics: '/settings/notifications',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_1',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_emails_enabled: false },
      postStateFingerprint: 'POST_1',
      historicalTransitionObservations: 10,
      witnessClasses: ['DOM_MUTATION'],
      verificationWindowMs: 1500,
    },
    riskMetadata: {
      riskClass: 'REVERSIBLE',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: { source: 'INITIAL_SPEC', creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1.0.0', validationHistory: [] },
    confidence: { capabilityConfidence: 0.95, routeConfidence: 0.90 },
    negativeEvidence: { rejectedCandidateIdentities: ['ALL_NOTIFICATIONS'], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
  };

  it('rejects candidate A (sim 0.98, wrong target) before ranking; allows candidate B (sim 0.82, correct target)', () => {
    const negStore = new NegativeEvidenceStore();
    const rankingEngine = new CandidateRankingEngine();
    const pipeline = new CandidatePipeline(negStore, rankingEngine);

    // Candidate A: Perfect semantic overlap (sim 1.0) with "Disable Marketing Emails", but targets ALL_NOTIFICATIONS
    const candidateA: CandidateEvaluationContext = {
      candidateId: 'cand_decoy_high_sim',
      candidateLabel: 'Disable Marketing Emails',
      observedActionType: 'TOGGLE',
      observedTargetEntity: 'ALL_NOTIFICATIONS', // WRONG TARGET!
      observedRole: 'switch',
      containerSemantics: ['notifications'],
      ancestors: ['section[notifications]'],
      observedState: { checked: true },
    };

    // Candidate B: Lower semantic overlap, but targets MARKETING_NOTIFICATIONS
    const candidateB: CandidateEvaluationContext = {
      candidateId: 'cand_genuine',
      candidateLabel: 'Turn Off Marketing Emails',
      observedActionType: 'TOGGLE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS', // CORRECT TARGET!
      observedRole: 'switch',
      containerSemantics: ['notifications'],
      ancestors: ['section[notifications]'],
      observedState: { checked: true },
    };

    const simA = rankingEngine.computeSemanticSimilarity('Disable Marketing Emails', candidateA.candidateLabel);
    const simB = rankingEngine.computeSemanticSimilarity('Disable Marketing Emails', candidateB.candidateLabel);

    // Candidate A has higher semantic similarity than Candidate B
    expect(simA).toBeGreaterThanOrEqual(0.95);
    expect(simA).toBeGreaterThan(simB);

    // Process through CandidatePipeline
    const result = pipeline.processCandidates(targetFingerprint, [candidateA, candidateB]);

    // Candidate A must be rejected at Invariant Closure / Contradiction filter
    expect(result.invariantResults[candidateA.candidateId]?.status).toBe('CONTRADICTED');
    expect(result.invariantResults[candidateA.candidateId]?.isEligibleForRanking).toBe(false);

    // Candidate B must PASS Invariant Closure
    expect(result.invariantResults[candidateB.candidateId]?.status).toBe('PASS');
    expect(result.invariantResults[candidateB.candidateId]?.isEligibleForRanking).toBe(true);

    // Candidate A must NEVER appear in rankedScores
    const rankedIds = result.rankedScores.map((r) => r.candidateId);
    expect(rankedIds).not.toContain(candidateA.candidateId);
    expect(rankedIds).toContain(candidateB.candidateId);

    // Winner must be Candidate B
    expect(result.selectedWinner?.candidateId).toBe(candidateB.candidateId);
  });
});
