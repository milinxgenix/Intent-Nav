/**
 * IntentNav-SCFR: Invariant Closure Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { InvariantClosureEngine } from '../../src/core/invariant/engine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('InvariantClosureEngine', () => {
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
      semanticSynonyms: ['turn off promotional emails'],
      accessibleName: 'Marketing email toggle',
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

  it('passes candidate satisfying all positive and negative invariants', () => {
    const candidate = {
      candidateId: 'cand_genuine',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
    };

    const result = InvariantClosureEngine.evaluateCandidate(targetFingerprint, candidate);

    expect(result.status).toBe('PASS');
    expect(result.isEligibleForRanking).toBe(true);
    expect(result.failedPredicates.length).toBe(0);
  });

  it('fails candidate with wrong target entity', () => {
    const candidate = {
      candidateId: 'cand_wrong_target',
      candidateLabel: 'Account Status Settings',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'ACCOUNT_STATUS',
      observedRole: 'button',
    };

    const result = InvariantClosureEngine.evaluateCandidate(targetFingerprint, candidate);

    expect(result.status).toBe('FAIL');
    expect(result.isEligibleForRanking).toBe(false);
    expect(result.rejectionReason).toContain('Target mismatch');
  });

  it('declares CONTRADICTION when candidate triggers negative forbidden target predicate', () => {
    const candidate = {
      candidateId: 'cand_forbidden_target',
      candidateLabel: 'Disable All Account Notifications',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'ALL_NOTIFICATIONS', // Forbidden!
      observedRole: 'button',
    };

    const result = InvariantClosureEngine.evaluateCandidate(targetFingerprint, candidate);

    expect(result.status).toBe('CONTRADICTED');
    expect(result.isEligibleForRanking).toBe(false);
    expect(result.rejectionReason).toContain('CONTRADICTION');
  });

  it('declares CONTRADICTION when candidate performs destructive action on reversible goal', () => {
    const candidate = {
      candidateId: 'cand_destructive_action',
      candidateLabel: 'Delete Marketing Communication History',
      observedActionType: 'DELETE', // Destructive!
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'button',
    };

    const result = InvariantClosureEngine.evaluateCandidate(targetFingerprint, candidate);

    expect(result.status).toBe('CONTRADICTED');
    expect(result.isEligibleForRanking).toBe(false);
  });
});
