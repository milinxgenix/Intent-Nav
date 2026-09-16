/**
 * IntentNav-SCFR: Critical Ordering Constraint Tests
 * ARCHITECTURAL RULE:
 * Invariant Closure & Contradiction Filtering MUST occur BEFORE Ranking.
 * High semantic similarity can NEVER compensate for a failed mandatory functional invariant.
 */

import { describe, it, expect, vi } from 'vitest';
import { CandidatePipeline } from '../../src/core/candidate/pipeline';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('Critical Ordering Constraint', () => {
  const targetFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [],
    expectedPostState: [],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing emails',
      semanticSynonyms: ['turn off promotional emails', 'stop marketing notifications'],
      accessibleName: 'Marketing email notifications switch',
      role: 'switch',
      visibleLabel: 'Marketing',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable marketing emails',
    },
    contextEvidence: {
      ancestorRelationships: [],
      nearbyText: [],
      surroundingLabels: [],
      containerSemantics: ['notifications'],
      menuPanelRelationships: [],
      relativeStructuralRelationships: [],
    },
    transitionEvidence: {} as any,
    riskMetadata: {
      riskClass: 'REVERSIBLE',
      reversible: true,
      financial: false,
      security: false,
      destructive: false,
      requiresConfirmation: false,
    },
    provenance: {} as any,
    confidence: { capabilityConfidence: 0.9, routeConfidence: 0.9 },
    negativeEvidence: {} as any,
  };

  it('proves that a semantically HIGHER-scoring candidate with wrong target is rejected BEFORE ranking', () => {
    const negStore = new NegativeEvidenceStore();
    const rankingEngine = new CandidateRankingEngine();
    const rankSpy = vi.spyOn(rankingEngine, 'rankCandidates');

    const pipeline = new CandidatePipeline(negStore, rankingEngine);

    // Candidate 1: High semantic similarity to "Disable marketing emails", but target is ALL_NOTIFICATIONS
    const decoyCandidate = {
      candidateId: 'decoy_all_notif',
      candidateLabel: 'Disable marketing and all account notifications completely',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'ALL_NOTIFICATIONS', // WRONG TARGET!
      observedRole: 'switch',
      containerSemantics: ['notifications'],
    };

    // Candidate 2: Genuine candidate with exact functional match
    const genuineCandidate = {
      candidateId: 'genuine_marketing',
      candidateLabel: 'Promotional Mail',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS', // CORRECT TARGET!
      observedRole: 'switch',
      containerSemantics: ['notifications'],
    };

    const result = pipeline.processCandidates(targetFingerprint, [decoyCandidate, genuineCandidate]);

    // 1. Decoy must be rejected before ranking
    expect(result.rejectedCandidates.some((r) => r.candidate.candidateId === 'decoy_all_notif')).toBe(true);

    // 2. Ranking engine MUST NOT have received the decoy candidate!
    expect(rankSpy).toHaveBeenCalled();
    const candidatesPassedToRanking = rankSpy.mock.calls[0]![1];
    expect(candidatesPassedToRanking.map((c) => c.candidateId)).not.toContain('decoy_all_notif');
    expect(candidatesPassedToRanking.map((c) => c.candidateId)).toContain('genuine_marketing');

    // 3. Genuine candidate wins despite lower initial token overlap
    expect(result.selectedWinner?.candidateId).toBe('genuine_marketing');
  });

  it('demonstrates that negative evidence permanently suppresses known decoys', () => {
    const negStore = new NegativeEvidenceStore();
    const rankingEngine = new CandidateRankingEngine();
    const pipeline = new CandidatePipeline(negStore, rankingEngine);

    // Pre-record decoy in negative evidence store
    negStore.recordContradiction(
      'known_trap_button',
      'KNOWN_DECOY_PATTERN',
      'HARD_GATE_FAILURE',
      'Previously verified adversarial decoy'
    );

    const candidates = [
      {
        candidateId: 'known_trap_button',
        candidateLabel: 'Disable marketing emails (Special)',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      },
    ];

    const result = pipeline.processCandidates(targetFingerprint, candidates);

    expect(result.eligibleCandidates.length).toBe(0);
    expect(result.selectedWinner).toBeNull();
    expect(result.rejectedCandidates[0]?.rejectionReason).toContain('Pre-existing negative evidence');
  });
});
