/**
 * IntentNav-SCFR: Step 6 Complete Negative Evidence Tests
 *
 * Requirements:
 * - Failed verification and rejected candidates produce structured negative evidence.
 * - Negative evidence identifies: failed invariant/condition, affected candidate/capability/route,
 *   sequence/activation IDs, failure classification, quarantine status, and required material change.
 * - Persist negative evidence across lifecycle.
 * - Unchanged candidate is suppressed from repeated selection.
 * - Material evidence change allows reevaluation (no permanent false suppression).
 * - Fabricated success cannot erase an unresolved failure record.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { PersistentCapabilityStore } from '../../src/core/storage/persistentStore';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';

describe('Step 6 — Complete Negative Evidence', () => {
  let negativeStore: NegativeEvidenceStore;
  let persistentStore: PersistentCapabilityStore;

  const mockCandidateA: CandidateEvaluationContext = {
    candidateId: 'cand_decoy_btn',
    candidateLabel: 'Download Fast Installer',
    observedRole: 'button',
    observedActionType: 'EXECUTE',
    observedTargetEntity: 'MALWARE_INSTALLER',
    domStructuralPath: 'div.promo > a.installer-btn',
    containerSemantics: ['promo', 'sponsored'],
  };

  beforeEach(async () => {
    persistentStore = new PersistentCapabilityStore();
    await persistentStore.init();
    await persistentStore.clear();

    negativeStore = new NegativeEvidenceStore(persistentStore);
    await negativeStore.init();
  });

  it('records complete structured negative evidence for a rejected candidate', () => {
    const entry = negativeStore.recordContradiction(
      mockCandidateA.candidateId,
      'KNOWN_DECOY_PATTERN',
      'INV_TARGET_ENTITY_MATCH',
      'Target entity MALWARE_INSTALLER violates intended capability target',
      { violationSeverity: 'CRITICAL', detectedDecoyScore: 0.98 },
      { capabilityId: 'CAP_DOWNLOAD_REPORT' },
      'route_v1_download',
      mockCandidateA,
      {
        failedCondition: 'INV_TARGET_ENTITY_MATCH',
        affectedCapabilityId: 'CAP_DOWNLOAD_REPORT',
        affectedRouteId: 'route_v1_download',
        affectedCandidateId: mockCandidateA.candidateId,
        sequenceNumber: 1,
        activationEventId: 'act_decoy_attempt',
        witnessIds: ['wit_decoy_flag'],
        failureClassification: 'KNOWN_DECOY_PATTERN',
        quarantined: true,
        canReconsider: false,
        requiredMaterialEvidenceChange: 'Requires changed observedTargetEntity or modified containerSemantics',
      }
    );

    expect(entry.id).toMatch(/^neg_/);
    expect(entry.failedCondition).toBe('INV_TARGET_ENTITY_MATCH');
    expect(entry.affectedCapabilityId).toBe('CAP_DOWNLOAD_REPORT');
    expect(entry.affectedCandidateId).toBe(mockCandidateA.candidateId);
    expect(entry.quarantined).toBe(true);
    expect(entry.canReconsider).toBe(false);
    expect(entry.requiredMaterialEvidenceChange).toContain('Requires changed observedTargetEntity');
    expect(entry.interfaceEvidenceHash).toBeDefined();
    expect(entry.candidateFingerprintHash).toBeDefined();
  });

  it('records structured negative evidence specifically for causal transition failure', () => {
    const entry = negativeStore.recordCausalFailure({
      capabilityId: 'CAP_DISABLE_MARKETING',
      routeId: 'route_CAP_DISABLE_MARKETING',
      candidateIdentifier: 'cand_marketing_switch',
      verificationStatus: 'FAILED_POST_STATE_MISMATCH',
      failureReason: 'post_state_mismatch',
      explanation: 'Observed post-state failed to reflect disabled marketing notifications',
      activationEventId: 'act_009',
      sequenceNumber: 3,
      witnessIds: ['wit_1', 'wit_2'],
      observedWitnessClasses: ['DOM_MUTATION'],
      observedPostStateFingerprint: 'postfp_sha256_mismatched_000',
      candidateContext: {
        candidateId: 'cand_marketing_switch',
        candidateLabel: 'Marketing Notifications',
        observedRole: 'switch',
        observedActionType: 'TOGGLE',
        observedTargetEntity: 'NOTIFICATIONS',
        containerSemantics: ['notifications', 'preferences'],
      },
    });

    expect(entry.contradictionType).toBe('CAUSAL_WITNESS_FAILURE');
    expect(entry.failedCondition).toBe('FAILED_POST_STATE_MISMATCH');
    expect(entry.affectedCapabilityId).toBe('CAP_DISABLE_MARKETING');
    expect(entry.quarantined).toBe(true);
    expect(entry.canReconsider).toBe(false);
    expect(entry.requiredMaterialEvidenceChange).toContain('Requires valid observed interface post-state progression');
    expect(entry.evidenceDetails['status']).toBe('FAILED_POST_STATE_MISMATCH');
  });

  it('suppresses identical unchanged candidate from repeated selection', () => {
    negativeStore.recordContradiction(
      mockCandidateA.candidateId,
      'KNOWN_DECOY_PATTERN',
      'HARD_GATE_FAILURE',
      'Known decoy element',
      {},
      { capabilityId: 'CAP_DOWNLOAD_REPORT' },
      'route_001',
      mockCandidateA
    );

    // Identical candidate context submitted again
    const isSuppressed = negativeStore.isKnownContradiction(
      mockCandidateA.candidateId,
      mockCandidateA,
      'CAP_DOWNLOAD_REPORT'
    );

    expect(isSuppressed).toBe(true);

    const check = negativeStore.canCandidateBeReconsidered(
      mockCandidateA.candidateId,
      mockCandidateA,
      'CAP_DOWNLOAD_REPORT'
    );

    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Suppressed by identical material evidence');
  });

  it('permits reconsideration when candidate exhibits material interface change (no permanent suppression)', () => {
    negativeStore.recordContradiction(
      mockCandidateA.candidateId,
      'KNOWN_DECOY_PATTERN',
      'HARD_GATE_FAILURE',
      'Known decoy element',
      {},
      { capabilityId: 'CAP_DOWNLOAD_REPORT' },
      'route_001',
      mockCandidateA
    );

    // Material interface change: target entity changed to genuine EXPORT_CSV, container changed to legitimate account settings
    const modifiedCandidate: CandidateEvaluationContext = {
      ...mockCandidateA,
      observedTargetEntity: 'EXPORT_CSV', // Material change!
      containerSemantics: ['account', 'legitimate_settings'], // Material change!
      observedActionType: 'DOWNLOAD',
    };

    const isSuppressed = negativeStore.isKnownContradiction(
      mockCandidateA.candidateId,
      modifiedCandidate,
      'CAP_DOWNLOAD_REPORT'
    );

    // Because material features changed, it is NOT suppressed
    expect(isSuppressed).toBe(false);

    const check = negativeStore.canCandidateBeReconsidered(
      mockCandidateA.candidateId,
      modifiedCandidate,
      'CAP_DOWNLOAD_REPORT'
    );

    expect(check.allowed).toBe(true);
    expect(check.reason).toContain('Reconsideration permitted: Material interface change observed');
  });

  it('persists negative evidence across store re-instantiations', async () => {
    negativeStore.recordContradiction(
      'cand_persist_test',
      'FORBIDDEN_ACTION',
      'INV_FORBIDDEN_DELETION',
      'Account deletion forbidden without confirmation',
      {},
      { capabilityId: 'CAP_DELETE_ACCOUNT' },
      'route_del_01',
      {
        candidateId: 'cand_persist_test',
        candidateLabel: 'Delete All Data',
        observedRole: 'button',
        observedActionType: 'DELETE',
        observedTargetEntity: 'ALL_DATA',
        containerSemantics: ['danger_zone'],
      }
    );

    // Verify written to underlying persistent store
    const stored = await persistentStore.getNegativeEvidence('CAP_DELETE_ACCOUNT');
    expect(stored.length).toBeGreaterThanOrEqual(1);
    expect(stored[0]!.capabilityId).toBe('CAP_DELETE_ACCOUNT');

    // Create a new NegativeEvidenceStore attached to same persistent store
    const freshNegativeStore = new NegativeEvidenceStore(persistentStore);
    await freshNegativeStore.init();

    // Must be known in fresh store
    const records = freshNegativeStore.getAllRecords();
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records.some((r) => r.affectedCapabilityId === 'CAP_DELETE_ACCOUNT')).toBe(true);
  });
});
