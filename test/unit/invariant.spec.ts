/**
 * IntentNav-SCFR: Invariant Closure Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { InvariantClosureEngine } from '../../src/core/invariant/engine';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { createDeclarativePredicate, DeclarativePredicateEvaluator } from '../../src/core/invariant/predicates';
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

  describe('Requirement 2 Regression: Synthetic State Removal & Invariant Distinctions', () => {
    it('generates candidates from plain DOM without injecting synthetic defaultAppState', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <button id="plain-btn">Plain Action</button>
            <button id="switch-btn" role="switch" aria-checked="true">Toggle Switch</button>
          </body>
        </html>
      `);

      const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
      expect(candidates.length).toBe(2);

      const plainCand = candidates.find((c: any) => c.candidateLabel === 'Plain Action')!;
      expect(plainCand).toBeDefined();

      // Ensure NONE of the 13 synthetic defaultAppState flags are injected
      const forbiddenSyntheticKeys = [
        'marketing_notifications_enabled',
        'marketing_emails_enabled',
        'two_factor_enabled',
        'export_download_initiated',
        'account_deactivated',
        'account_active',
        'analytics_tracking_enabled',
        'active_session_count',
        'dark_mode_enabled',
        'invoice_available',
        'invoice_download_triggered',
        'audit_logs_available',
        'audit_logs_visible',
      ];

      expect(plainCand.observedState).toBeDefined();

      for (const key of forbiddenSyntheticKeys) {
        expect(plainCand.observedState![key]).toBeUndefined();
      }

      // Ensure plain button does NOT have fabricated checked or expanded booleans
      expect(plainCand.observedState!.checked).toBeUndefined();
      expect(plainCand.observedState!.expanded).toBeUndefined();

      // Switch button should accurately reflect DOM aria-checked attribute
      const switchCand = candidates.find((c: any) => c.candidateLabel === 'Toggle Switch')!;
      expect(switchCand.observedState).toBeDefined();
      expect(switchCand.observedState!.checked).toBe(true);
    });

    it('returns INSUFFICIENT_EVIDENCE when required application state is missing (not PASS or FAIL)', () => {
      const capWithMandatoryPreState: FunctionalCapabilityFingerprint = {
        ...targetFingerprint,
        capabilityId: 'CAP_WITH_PRESTATE',
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_MARKETING_ENABLED',
            name: 'Marketing notifications enabled',
            description: 'Marketing notifications must be enabled',
            source: 'PRE_STATE',
            property: 'marketing_notifications_enabled',
            operator: 'EQUALS',
            expectedValue: true,
          }),
        ],
      };

      // Candidate has DOM state (e.g. disabled: false) but lacks 'marketing_notifications_enabled' evidence
      const candidateMissingState = {
        candidateId: 'cand_missing_evidence',
        candidateLabel: 'Disable marketing emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        observedState: {
          disabled: false,
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(capWithMandatoryPreState, candidateMissingState);

      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('unobserved');
      expect(result.failedPredicates.some((p) => p.explanation.includes('Pre-state evidence missing'))).toBe(true);
    });

    it('returns FAIL when required application state is observed but contradicts the invariant', () => {
      const capWithMandatoryPreState: FunctionalCapabilityFingerprint = {
        ...targetFingerprint,
        capabilityId: 'CAP_WITH_PRESTATE',
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_MARKETING_ENABLED',
            name: 'Marketing notifications enabled',
            description: 'Marketing notifications must be enabled',
            source: 'PRE_STATE',
            property: 'marketing_notifications_enabled',
            operator: 'EQUALS',
            expectedValue: true,
          }),
        ],
      };

      // Candidate has observed 'marketing_notifications_enabled: false', contradicting the expected 'true'
      const candidateContradictingState = {
        candidateId: 'cand_contradicting_state',
        candidateLabel: 'Disable marketing emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        observedState: {
          disabled: false,
          marketing_notifications_enabled: false,
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(capWithMandatoryPreState, candidateContradictingState);

      expect(result.status).toBe('FAIL');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('failed');
    });

    it('returns PASS when required application state is observed and matches the invariant', () => {
      const capWithMandatoryPreState: FunctionalCapabilityFingerprint = {
        ...targetFingerprint,
        capabilityId: 'CAP_WITH_PRESTATE',
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_MARKETING_ENABLED',
            name: 'Marketing notifications enabled',
            description: 'Marketing notifications must be enabled',
            source: 'PRE_STATE',
            property: 'marketing_notifications_enabled',
            operator: 'EQUALS',
            expectedValue: true,
          }),
        ],
      };

      // Candidate has observed 'marketing_notifications_enabled: true', matching the expected 'true'
      const candidateSatisfyingState = {
        candidateId: 'cand_satisfying_state',
        candidateLabel: 'Disable marketing emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        observedState: {
          disabled: false,
          marketing_notifications_enabled: true,
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(capWithMandatoryPreState, candidateSatisfyingState);

      expect(result.status).toBe('PASS');
      expect(result.isEligibleForRanking).toBe(true);
      expect(result.failedPredicates.length).toBe(0);
    });

    it('ensures UNKNOWN never silently becomes PASS on negative or falsy operators', () => {
      const predNotEquals = {
        id: 'PRE_NOT_SUSPENDED',
        name: 'Account not suspended',
        description: 'Account status must not be suspended',
        source: 'PRE_STATE' as const,
        property: 'account_status',
        operator: 'NOT_EQUALS' as const,
        expectedValue: 'SUSPENDED',
      };

      const predFalsy = {
        id: 'PRE_NOT_DEACTIVATED',
        name: 'Account not deactivated',
        description: 'Account must not be deactivated',
        source: 'PRE_STATE' as const,
        property: 'account_deactivated',
        operator: 'FALSY' as const,
      };

      // When the property is missing from context, DeclarativePredicateEvaluator MUST return false
      expect(DeclarativePredicateEvaluator.evaluate(predNotEquals, {})).toBe(false);
      expect(DeclarativePredicateEvaluator.evaluate(predFalsy, {})).toBe(false);

      // And InvariantClosureEngine must reject the candidate with INSUFFICIENT_EVIDENCE
      const capWithNegativePreState: FunctionalCapabilityFingerprint = {
        ...targetFingerprint,
        mandatoryPreStatePredicates: [createDeclarativePredicate(predNotEquals)],
      };

      const candidateMissingAccountStatus = {
        candidateId: 'cand_missing_status',
        candidateLabel: 'Disable marketing emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        observedState: {
          disabled: false,
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(capWithNegativePreState, candidateMissingAccountStatus);
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
    });

    it('returns INSUFFICIENT_EVIDENCE when candidate observedState is completely empty and pre-state is required', () => {
      const capWithMandatoryPreState: FunctionalCapabilityFingerprint = {
        ...targetFingerprint,
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_CHECK',
            name: 'Any pre-state check',
            description: 'Requires pre-state',
            source: 'PRE_STATE',
            property: 'any_property',
            operator: 'EQUALS',
            expectedValue: true,
          }),
        ],
      };

      const candidateEmptyState = {
        candidateId: 'cand_empty_state',
        candidateLabel: 'Disable marketing emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        observedState: {},
      };

      const result = InvariantClosureEngine.evaluateCandidate(capWithMandatoryPreState, candidateEmptyState);
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('Candidate observedState is missing');
    });

    it('allows mock fixture state to be provided strictly to mock tests without leaking into production generation', () => {
      // 1. Mock test can supply explicit fixture state
      const mockTestFixture = {
        marketing_notifications_enabled: true,
        session_active: true,
      };

      const dom = new JSDOM('<button id="toggle-btn" role="switch" aria-checked="true">Toggle</button>');
      const candidatesWithFixture = CandidateGenerator.generateFromDOM(dom.window.document, mockTestFixture);
      expect(candidatesWithFixture.length).toBeGreaterThan(0);
      expect(candidatesWithFixture[0]!.observedState).toBeDefined();
      expect(candidatesWithFixture[0]!.observedState!['marketing_notifications_enabled']).toBe(true);

      // 2. Plain generation without mock fixture MUST NOT have synthetic properties
      const candidatesWithoutFixture = CandidateGenerator.generateFromDOM(dom.window.document);
      expect(candidatesWithoutFixture.length).toBeGreaterThan(0);
      expect(candidatesWithoutFixture[0]!.observedState!['marketing_notifications_enabled']).toBeUndefined();
      expect(candidatesWithoutFixture[0]!.observedState!['session_active']).toBeUndefined();
    });

    it('confirms production candidate generator does not import or bundle fixture defaults', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const generatorSrc = fs.readFileSync(path.resolve(__dirname, '../../src/core/candidate/generator.ts'), 'utf8');

      // Verify no defaultAppState definition exists
      expect(generatorSrc).not.toContain('defaultAppState');
      // Verify no hardcoded application state booleans are declared in production logic
      expect(generatorSrc).not.toContain('marketing_notifications_enabled: true');
      expect(generatorSrc).not.toContain('two_factor_enabled: true');
      expect(generatorSrc).not.toContain('account_active: true');
    });
  });
});

