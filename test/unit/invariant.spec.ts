/**
 * IntentNav-SCFR: Invariant Closure Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import { InvariantClosureEngine, CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { createDeclarativePredicate, DeclarativePredicateEvaluator } from '../../src/core/invariant/predicates';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { RouteVersion } from '../../src/types/state';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../../src/core/capability/catalog';
import { CandidatePipeline } from '../../src/core/candidate/pipeline';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';

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
      const generatorSrc = fs.readFileSync(path.resolve(__dirname, '../../src/core/candidate/generator.ts'), 'utf8');

      // Verify no defaultAppState definition exists
      expect(generatorSrc).not.toContain('defaultAppState');
      // Verify no hardcoded application state booleans are declared in production logic
      expect(generatorSrc).not.toContain('marketing_notifications_enabled: true');
      expect(generatorSrc).not.toContain('two_factor_enabled: true');
      expect(generatorSrc).not.toContain('account_active: true');
    });
  });

  describe('Prompt 3 Invariant Closure Hard Gating & Active Route Revalidation (Tests A - J & KO)', () => {
    // Base capability for testing
    const baseCap: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_TOGGLE_TEST',
      canonicalFunction: 'toggle_feature_setting',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'FEATURE_SETTING',
      mandatoryPreStatePredicates: [],
      allowedStateDelta: [],
      expectedPostState: [],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Toggle feature',
        semanticSynonyms: ['switch feature'],
        accessibleName: 'Feature Toggle',
        role: 'switch',
        visibleLabel: 'Feature Toggle',
        sectionMeaning: 'Settings',
        actionDescription: 'Toggles the feature on or off',
      },
      contextEvidence: {
        ancestorRelationships: [],
        nearbyText: [],
        surroundingLabels: [],
        containerSemantics: ['settings'],
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
      confidence: { capabilityConfidence: 0.95, routeConfidence: 0.95 },
      negativeEvidence: {} as any,
    };

    // TEST A: Mandatory pre-state predicate fails -> candidate rejected
    it('TEST A: Mandatory pre-state predicate fails -> candidate rejected (FAIL, not eligible for ranking)', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_REQ_ACTIVE',
            name: 'Requires Active Account',
            description: 'Account must be active',
            source: 'PRE_STATE',
            property: 'account_active',
            operator: 'EQUALS',
            expectedValue: true,
          }),
        ],
      };

      const candidate: CandidateEvaluationContext = {
        candidateId: 'cand_a',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          account_active: false, // Fails mandatory pre-state!
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(cap, candidate);
      expect(result.status).toBe('FAIL');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.failedPredicates.some((p) => p.predicateId === 'PRE_REQ_ACTIVE')).toBe(true);
      expect(result.rejectionReason).toContain('failed: Account must be active');
    });

    // TEST B: Forbidden predicate violated -> candidate rejected
    it('TEST B: Forbidden predicate violated -> candidate rejected (CONTRADICTED, not eligible for ranking)', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        forbiddenContextPredicates: [
          {
            target: 'container',
            pattern: 'SYSTEM_WIPE',
            required: true,
            id: 'FORBIDDEN_DESTRUCTIVE',
            name: 'Forbidden Destructive Container',
            description: 'Must not occur in SYSTEM_WIPE container',
          },
        ],
      };

      const candidate: CandidateEvaluationContext = {
        candidateId: 'cand_b',
        candidateLabel: 'System Wipe',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'button',
        containerSemantics: ['SYSTEM_WIPE'], // Violates forbidden predicate!
      };

      const result = InvariantClosureEngine.evaluateCandidate(cap, candidate);
      expect(result.status).toBe('CONTRADICTED');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('CONTRADICTION');
    });

    // TEST C: Required application state is unknown -> INSUFFICIENT_EVIDENCE and no ranking
    it('TEST C: Required application state is unknown -> INSUFFICIENT_EVIDENCE and no ranking', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_MANDATORY_EVIDENCE',
            name: 'Requires specific app state',
            description: 'App state must be explicitly observed',
            source: 'PRE_STATE',
            property: 'verified_billing_status',
            operator: 'EQUALS',
            expectedValue: 'ACTIVE',
          }),
        ],
      };

      const candidate: CandidateEvaluationContext = {
        candidateId: 'cand_c',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          other_unrelated_prop: 'val', // Missing verified_billing_status
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(cap, candidate);
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('verified_billing_status');
    });

    // TEST D: DISABLED_TO_ENABLED transition -> correct delta evaluation
    it('TEST D: DISABLED_TO_ENABLED transition -> correct delta evaluation (passes when disabled, rejects when already enabled)', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        allowedStateDelta: [
          {
            property: 'feature_enabled',
            expectedChange: 'DISABLED_TO_ENABLED',
          },
        ],
      };

      // Case 1: Candidate is currently disabled -> valid DISABLED_TO_ENABLED
      const candidateDisabled: CandidateEvaluationContext = {
        candidateId: 'cand_d1',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          feature_enabled: false,
          disabled: false,
        },
      };
      const resultValid = InvariantClosureEngine.evaluateCandidate(cap, candidateDisabled);
      expect(resultValid.status).toBe('PASS');
      expect(resultValid.isEligibleForRanking).toBe(true);

      // Case 2: Candidate is already enabled -> cannot execute DISABLED_TO_ENABLED
      const candidateAlreadyEnabled: CandidateEvaluationContext = {
        candidateId: 'cand_d2',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          feature_enabled: true, // Already enabled!
          disabled: false,
        },
      };
      const resultInvalid = InvariantClosureEngine.evaluateCandidate(cap, candidateAlreadyEnabled);
      expect(resultInvalid.status).toBe('FAIL');
      expect(resultInvalid.isEligibleForRanking).toBe(false);
      expect(resultInvalid.rejectionReason).toContain('already true/enabled');
    });

    // TEST E: ENABLED_TO_DISABLED transition -> correct delta evaluation
    it('TEST E: ENABLED_TO_DISABLED transition -> correct delta evaluation (passes when enabled, rejects when already disabled)', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        allowedStateDelta: [
          {
            property: 'feature_enabled',
            expectedChange: 'ENABLED_TO_DISABLED',
          },
        ],
      };

      // Case 1: Candidate is currently enabled -> valid ENABLED_TO_DISABLED
      const candidateEnabled: CandidateEvaluationContext = {
        candidateId: 'cand_e1',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          feature_enabled: true,
          disabled: false,
        },
      };
      const resultValid = InvariantClosureEngine.evaluateCandidate(cap, candidateEnabled);
      expect(resultValid.status).toBe('PASS');
      expect(resultValid.isEligibleForRanking).toBe(true);

      // Case 2: Candidate is already disabled -> cannot execute ENABLED_TO_DISABLED
      const candidateAlreadyDisabled: CandidateEvaluationContext = {
        candidateId: 'cand_e2',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          feature_enabled: false, // Already disabled!
          disabled: false,
        },
      };
      const resultInvalid = InvariantClosureEngine.evaluateCandidate(cap, candidateAlreadyDisabled);
      expect(resultInvalid.status).toBe('FAIL');
      expect(resultInvalid.isEligibleForRanking).toBe(false);
      expect(resultInvalid.rejectionReason).toContain('already false/disabled');
    });

    // TEST F: Expected post-state is incompatible -> candidate rejected before ranking
    it('TEST F: Expected post-state is incompatible -> candidate rejected before ranking', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        expectedPostState: [
          {
            property: 'feature_enabled',
            expectedValue: false,
          },
        ],
      };

      // Case 1: Interface is already in the expected post-state (contradiction: action would re-toggle or is redundant)
      const candidateAlreadyInPostState: CandidateEvaluationContext = {
        candidateId: 'cand_f1',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          feature_enabled: false, // Already false!
          disabled: false,
        },
      };
      const resultPostConflict = InvariantClosureEngine.evaluateCandidate(cap, candidateAlreadyInPostState);
      expect(resultPostConflict.status).toBe('FAIL');
      expect(resultPostConflict.isEligibleForRanking).toBe(false);
      expect(resultPostConflict.rejectionReason).toContain('already equal to expected post-state');

      // Case 2: Candidate action direction contradicts expected post-state
      const candidateOppositeAction: CandidateEvaluationContext = {
        candidateId: 'cand_f2',
        candidateLabel: 'Enable Feature',
        observedActionType: 'ENABLE', // Trying to enable when expected post-state is false!
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'button',
        observedState: {
          feature_enabled: true,
        },
      };
      const resultActionConflict = InvariantClosureEngine.evaluateCandidate(cap, candidateOppositeAction);
      expect(resultActionConflict.status).toBe('FAIL');
      expect(resultActionConflict.isEligibleForRanking).toBe(false);
      expect(resultActionConflict.rejectionReason).toContain('contradicts expected post-state');
    });

    // TEST G: Expected post-state evidence is unknown -> INSUFFICIENT_EVIDENCE
    it('TEST G: Expected post-state evidence is unknown -> INSUFFICIENT_EVIDENCE, not PASS', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        expectedPostState: [
          {
            property: 'unobservable_backend_flag',
            expectedValue: true,
          },
        ],
      };

      const candidateMissingPostStateEvidence: CandidateEvaluationContext = {
        candidateId: 'cand_g',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          // completely missing unobservable_backend_flag
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(cap, candidateMissingPostStateEvidence);
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('Missing evidence for expected post-state property');
    });

    // TEST H & KO-ACTIVE-01: Previously ACTIVE_VALIDATED route is now invalid under current live state -> rejected (ABSTAINED)
    it('TEST H / KO-ACTIVE-01: Previously ACTIVE_VALIDATED route is now invalid under current live state -> current invariant evaluation rejects it (ABSTAINED)', async () => {
      const machine = new IntentNavMachine();
      const cap = AUTHORITATIVE_CAPABILITY_CATALOG.find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
      machine.registerCapability(cap);

      const activeRoute: RouteVersion = {
        routeId: 'route_active_marketing_01',
        capabilityId: cap.capabilityId,
        status: 'ACTIVE_VALIDATED',
        confidenceScore: 0.95,
        steps: [
          {
            stepIndex: 0,
            fromStateId: 'st_notifications_page',
            toStateId: 'st_notifications_page',
            actionDescription: 'Toggle marketing notifications switch',
            targetAccessibleName: 'Disable marketing notifications',
            targetRole: 'switch',
            bindingHandle: {
              handleId: 'handle_optout_btn',
              tagName: 'button',
              role: 'switch',
              accessibleName: 'Disable marketing notifications',
              domStructuralPath: 'button#btn-optout',
              elementIndex: 0,
            },
          },
        ],
        creationTimestamp: Date.now() - 10000,
        lastValidatedTimestamp: Date.now() - 5000,
        versionNumber: 1,
        pathCost: 1,
      };
      machine.graph.attachRouteVersion(cap.capabilityId, activeRoute);

      // Live interface candidate has an invalid state: the toggle is currently disabled (control disabled)
      // or already in disabled state violating ENABLED_TO_DISABLED
      const invalidCandidate: CandidateEvaluationContext = {
        candidateId: 'handle_optout_btn',
        candidateLabel: 'Disable marketing notifications',
        observedActionType: cap.actionType,
        observedTargetEntity: cap.targetEntity,
        observedRole: 'switch',
        bindingHandle: activeRoute.steps[0]!.bindingHandle,
        containerSemantics: ['notifications', 'marketing'],
        observedState: {
          disabled: true, // Invariant violation: control is disabled!
          marketing_notifications_enabled: false, // Already disabled!
        },
      };

      const mockDispatcher: ExecutionDispatcher = {
        async dispatchActivation() {
          return { success: true };
        },
        async collectWitnesses() {
          return [];
        },
      };

      const ctx = await machine.processIntent(
        'Turn off marketing emails',
        { tag: 'button', role: 'switch', id: 'handle_optout_btn', observedPreState: invalidCandidate.observedState },
        [invalidCandidate],
        false,
        mockDispatcher
      );

      // Active route MUST NOT bypass invariant evaluation: must fail and ABSTAIN
      expect(ctx.currentState).toBe('ABSTAINED');
      expect(machine.state).toBe('ABSTAINED');
      expect(machine.state).not.toBe('EXECUTED');
      expect(ctx.invariantResults?.['handle_optout_btn']?.status).not.toBe('PASS');
    });

    // TEST I & KO-ACTIVE-02: Previously ACTIVE_VALIDATED route remains valid -> current invariant evaluation passes and execution proceeds
    it('TEST I / KO-ACTIVE-02: Previously ACTIVE_VALIDATED route remains valid -> current invariant evaluation passes and execution proceeds (EXECUTED)', async () => {
      const machine = new IntentNavMachine();
      const cap = AUTHORITATIVE_CAPABILITY_CATALOG.find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
      machine.registerCapability(cap);

      const activeRoute: RouteVersion = {
        routeId: 'route_active_marketing_02',
        capabilityId: cap.capabilityId,
        status: 'ACTIVE_VALIDATED',
        confidenceScore: 0.95,
        steps: [
          {
            stepIndex: 0,
            fromStateId: 'st_notifications_page',
            toStateId: 'st_notifications_page',
            actionDescription: 'Toggle marketing notifications switch',
            targetAccessibleName: 'Disable marketing notifications',
            targetRole: 'switch',
            bindingHandle: {
              handleId: 'handle_optout_btn_valid',
              tagName: 'button',
              role: 'switch',
              accessibleName: 'Disable marketing notifications',
              domStructuralPath: 'button#btn-optout',
              elementIndex: 0,
            },
          },
        ],
        creationTimestamp: Date.now() - 10000,
        lastValidatedTimestamp: Date.now() - 5000,
        versionNumber: 1,
        pathCost: 1,
      };
      machine.graph.attachRouteVersion(cap.capabilityId, activeRoute);

      // Live candidate satisfies all invariants
      const validCandidate: CandidateEvaluationContext = {
        candidateId: 'handle_optout_btn_valid',
        candidateLabel: 'Disable marketing notifications',
        observedActionType: cap.actionType,
        observedTargetEntity: cap.targetEntity,
        observedRole: 'switch',
        bindingHandle: activeRoute.steps[0]!.bindingHandle,
        containerSemantics: ['notifications', 'marketing'],
        ancestors: ['section[Marketing Preferences]'],
        observedState: {
          disabled: false,
          marketing_notifications_enabled: true, // Valid pre-state for ENABLED_TO_DISABLED
        },
      };

      const t0 = Date.now();
      let capturedActivationId = '';
      const successfulDispatcher: ExecutionDispatcher = {
        async dispatchActivation(actId, cand, capId) {
          capturedActivationId = actId;
          return {
            success: true,
            elementFound: true,
            eventDispatched: true,
            activationEvent: {
              eventId: actId,
              sequenceNumber: 1,
              timestamp: t0,
              targetCandidateId: cand.candidateId,
              eventType: 'click',
              initiatingCapabilityId: capId,
            },
          };
        },
        async collectWitnesses() {
          return [
            {
              witnessId: 'wit_dom_1',
              witnessClass: 'DOM_MUTATION',
              sequenceNumber: 1,
              timestamp: t0 + 10,
              observedDelta: { 'aria-checked': 'false' },
              correlatedActivationEventId: capturedActivationId,
              temporalDeltaMs: 10,
              isCausallyCorrelated: true,
              correlationExplanation: 'DOM mutation observed within causal window',
              source: 'button#btn-optout',
            },
            {
              witnessId: 'wit_app_1',
              witnessClass: 'APPLICATION_STATE_MUTATION',
              sequenceNumber: 2,
              timestamp: t0 + 15,
              observedDelta: { marketing_notifications_enabled: false },
              correlatedActivationEventId: capturedActivationId,
              temporalDeltaMs: 15,
              isCausallyCorrelated: true,
              correlationExplanation: 'Application state mutation observed within causal window',
              source: 'appState',
            },
          ];
        },
        async observePostState() {
          return {
            stateId: 'st_post',
            stateType: 'PAGE',
            urlPattern: 'http://localhost:3000/site-a/',
            domStructuralHash: 'hash_post',
            semanticLandmarks: ['main'],
            activeModalsOrDialogs: [],
            activeTabs: ['notifications'],
            exposedCandidateHandles: [activeRoute.steps[0]!.bindingHandle!],
            observedApplicationState: { marketing_notifications_enabled: false },
            timestamp: t0 + 20,
          };
        },
      };

      const ctx = await machine.processIntent(
        'Turn off marketing emails',
        {
          tag: 'button',
          role: 'switch',
          id: 'handle_optout_btn_valid',
          observedActionType: cap.actionType,
          observedTargetEntity: cap.targetEntity,
          observedPreState: validCandidate.observedState,
          containerSemantics: ['notifications', 'marketing'],
          ancestors: ['section[Marketing Preferences]'],
        },
        [validCandidate],
        false,
        successfulDispatcher
      );

      expect(ctx.currentState).toBe('EXECUTED');
      expect(machine.state).toBe('EXECUTED');
      expect(ctx.invariantResults?.['handle_optout_btn_valid']?.status).toBe('PASS');
    });

    // TEST J: Verify no synthetic invariantResultForWinner = PASS or equivalent bypass remains in production source code
    it('TEST J: Verify no synthetic invariantResultForWinner = PASS or equivalent bypass remains in production source code', () => {
      const machineSrc = fs.readFileSync(path.resolve(__dirname, '../../src/core/stateMachine/machine.ts'), 'utf8');

      // 1. Ensure no hardcoded { candidateId: 'ACTIVE', status: 'PASS' } or similar synthetic bypass exists
      expect(machineSrc).not.toContain("{ candidateId: 'ACTIVE', status: 'PASS'");
      expect(machineSrc).not.toContain("invariantResultForWinner = activeRoute ? { candidateId: 'ACTIVE'");

      // 2. Ensure real invariant evaluation is executed in the active route branch
      expect(machineSrc).toContain('liveInvariantResult = InvariantClosureEngine.evaluateCandidate');
      expect(machineSrc).toContain("if (liveInvariantResult.status !== 'PASS')");
      expect(machineSrc).toContain("this.state = 'ABSTAINED'");

      // 3. Ensure candidate pipeline requires both isEligibleForRanking AND status === 'PASS'
      const pipelineSrc = fs.readFileSync(path.resolve(__dirname, '../../src/core/candidate/pipeline.ts'), 'utf8');
      expect(pipelineSrc).toContain("closureResult.isEligibleForRanking && closureResult.status === 'PASS'");
    });

    // KO-INV-DELTA-01: unsupported/incompatible state delta rejected
    it('KO-INV-DELTA-01: unsupported or unrecognized state delta type is rejected with FAIL', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        allowedStateDelta: [
          {
            property: 'feature_enabled',
            expectedChange: 'UNSUPPORTED_DELTA_TYPE_XYZ' as any,
          },
        ],
      };

      const candidate: CandidateEvaluationContext = {
        candidateId: 'cand_ko_delta',
        candidateLabel: 'Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          disabled: false,
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(cap, candidate);
      expect(result.status).toBe('FAIL');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('Unsupported or unknown state delta type');
    });

    // KO-INV-POST-01: candidate whose required post-state is incompatible cannot pass hard gate
    it('KO-INV-POST-01: candidate whose required post-state is incompatible cannot pass hard gate', () => {
      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        expectedPostState: [
          {
            property: 'is_active',
            expectedValue: true,
          },
        ],
      };

      // Candidate is currently non-interactive / disabled
      const candidateDisabled: CandidateEvaluationContext = {
        candidateId: 'cand_ko_post',
        candidateLabel: 'Active Feature Toggle',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'FEATURE_SETTING',
        observedRole: 'switch',
        observedState: {
          disabled: true, // Non-interactive cannot achieve post-state!
          is_active: false,
        },
      };

      const result = InvariantClosureEngine.evaluateCandidate(cap, candidateDisabled);
      expect(result.status).toBe('FAIL');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('disabled');
    });

    // Additional Pipeline Verification: Candidate ranking receives ONLY invariant-compatible candidates
    it('Pipeline Verification: Candidate ranking receives ONLY invariant-compatible candidates', () => {
      const store = new NegativeEvidenceStore();
      const rankingEngine = new CandidateRankingEngine();
      const pipeline = new CandidatePipeline(store, rankingEngine);

      const cap: FunctionalCapabilityFingerprint = {
        ...baseCap,
        mandatoryPreStatePredicates: [
          createDeclarativePredicate({
            id: 'PRE_MANDATORY_1',
            name: 'Requires enabled pre-state',
            description: 'Requires pre-state flag',
            source: 'PRE_STATE',
            property: 'session_active',
            operator: 'EQUALS',
            expectedValue: true,
          }),
        ],
      };

      const candidates: CandidateEvaluationContext[] = [
        {
          candidateId: 'cand_pass',
          candidateLabel: 'Feature Toggle',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'FEATURE_SETTING',
          observedRole: 'switch',
          observedState: { session_active: true, disabled: false },
        },
        {
          candidateId: 'cand_fail_pre',
          candidateLabel: 'Feature Toggle Bad',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'FEATURE_SETTING',
          observedRole: 'switch',
          observedState: { session_active: false, disabled: false },
        },
        {
          candidateId: 'cand_missing_evidence',
          candidateLabel: 'Feature Toggle Unknown',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'FEATURE_SETTING',
          observedRole: 'switch',
          observedState: { other: 123 },
        },
      ];

      const pipelineResult = pipeline.processCandidates(cap, candidates);

      // Only cand_pass should be in eligibleCandidates and rankedScores
      expect(pipelineResult.eligibleCandidates.length).toBe(1);
      expect(pipelineResult.eligibleCandidates[0]!.candidateId).toBe('cand_pass');
      expect(pipelineResult.rankedScores.length).toBe(1);
      expect(pipelineResult.rankedScores[0]!.candidateId).toBe('cand_pass');

      // Both bad candidates must be in rejectedCandidates
      expect(pipelineResult.rejectedCandidates.length).toBe(2);
      expect(pipelineResult.rejectedCandidates.map((r) => r.candidate.candidateId)).toEqual(
        expect.arrayContaining(['cand_fail_pre', 'cand_missing_evidence'])
      );
    });
  });
});

