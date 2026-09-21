import { describe, it, expect } from 'vitest';
import { InvariantClosureEngine, CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { InvariantPredicates } from '../../src/core/invariant/predicates';
import { CandidatePipeline } from '../../src/core/candidate/pipeline';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('Prompt 3 Verification: Invariant Closure, Allowed Deltas & Active-Route Revalidation', () => {
  const baseFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_PREF_TOGGLE',
    canonicalFunction: 'toggle_user_preference',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [],
    expectedPostState: [],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Marketing Notifications',
      semanticSynonyms: ['marketing emails', 'commercial bulletins'],
      accessibleName: 'Marketing email notifications switch',
      role: 'switch',
      visibleLabel: 'Marketing',
      sectionMeaning: 'Notifications',
      actionDescription: 'Toggle marketing notifications',
    },
    contextEvidence: {
      ancestorRelationships: ['section[notifications]'],
      nearbyText: ['receive promotional emails'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications'],
      menuPanelRelationships: ['notifications'],
      relativeStructuralRelationships: ['main > section > button'],
      urlSemantics: '/settings/notifications',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_emails_enabled: false },
      postStateFingerprint: 'POST',
      historicalTransitionObservations: 10,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
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
      validationHistory: [],
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

  const baseCandidate: CandidateEvaluationContext = {
    candidateId: 'cand_test_1',
    candidateLabel: 'Marketing email notifications switch',
    observedActionType: 'MODIFY_PREFERENCE',
    observedTargetEntity: 'MARKETING_NOTIFICATIONS',
    observedRole: 'switch',
    observedState: {},
    containerSemantics: ['notifications'],
    ancestors: ['section[notifications]'],
    nearbyText: ['promotional emails'],
  };

  // =========================================================================
  // PART 1 — ALLOWED STATE DELTAS (14 Scenarios)
  // =========================================================================
  describe('Part 1: Allowed State Delta Coverage', () => {
    // 1. ENABLED_TO_DISABLED on enabled control -> PASS
    it('1. ENABLED_TO_DISABLED on enabled control evaluates to PASS', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
        { checked: true, disabled: false },
        'MODIFY_PREFERENCE'
      );
      expect(rec.passed).toBe(true);
    });

    // 2. ENABLED_TO_DISABLED on already disabled control -> FAIL
    it('2. ENABLED_TO_DISABLED on already disabled property evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'marketing_emails_enabled', expectedChange: 'ENABLED_TO_DISABLED' }],
        { marketing_emails_enabled: false, disabled: false },
        'MODIFY_PREFERENCE'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('already false/disabled');
    });

    // 3. ENABLED_TO_DISABLED on unchecked control -> FAIL
    it('3. ENABLED_TO_DISABLED on already unchecked control evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
        { checked: false, disabled: false },
        'MODIFY_PREFERENCE'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('already unchecked');
    });

    // 4. ENABLED_TO_DISABLED with read-only action -> FAIL
    it('4. ENABLED_TO_DISABLED with read-only action (VIEW) evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
        { checked: true, disabled: false },
        'VIEW'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('read-only');
    });

    // 5. DISABLED_TO_ENABLED on disabled control -> PASS
    it('5. DISABLED_TO_ENABLED on currently disabled property evaluates to PASS', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'dark_mode_enabled', expectedChange: 'DISABLED_TO_ENABLED' }],
        { dark_mode_enabled: false, disabled: false },
        'MODIFY_PREFERENCE'
      );
      expect(rec.passed).toBe(true);
    });

    // 6. DISABLED_TO_ENABLED on already enabled control -> FAIL
    it('6. DISABLED_TO_ENABLED on already enabled property evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'dark_mode_enabled', expectedChange: 'DISABLED_TO_ENABLED' }],
        { dark_mode_enabled: true, disabled: false },
        'MODIFY_PREFERENCE'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('already true/enabled');
    });

    // 7. DISABLED_TO_ENABLED on checked control -> FAIL
    it('7. DISABLED_TO_ENABLED on already checked control evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'checked', expectedChange: 'DISABLED_TO_ENABLED' }],
        { checked: true, disabled: false },
        'MODIFY_PREFERENCE'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('already checked');
    });

    // 8. DISABLED_TO_ENABLED with read-only action -> FAIL
    it('8. DISABLED_TO_ENABLED with read-only action (VIEW) evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'checked', expectedChange: 'DISABLED_TO_ENABLED' }],
        { checked: false, disabled: false },
        'VIEW'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('read-only');
    });

    // 9. MODIFIED on valid interactive control -> PASS
    it('9. MODIFIED on valid interactive control evaluates to PASS', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'active_session_count', expectedChange: 'MODIFIED' }],
        { active_session_count: 3, disabled: false },
        'SUBMIT'
      );
      expect(rec.passed).toBe(true);
    });

    // 10. MODIFIED with read-only action -> FAIL
    it('10. MODIFIED with read-only action evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'active_session_count', expectedChange: 'MODIFIED' }],
        { active_session_count: 3, disabled: false },
        'VIEW'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('read-only');
    });

    // 11. ADDED on non-existing property -> PASS
    it('11. ADDED on non-existing property evaluates to PASS', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'security_key_id', expectedChange: 'ADDED' }],
        { disabled: false },
        'SUBMIT'
      );
      expect(rec.passed).toBe(true);
    });

    // 12. ADDED on existing property -> FAIL
    it('12. ADDED on already existing property evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'security_key_id', expectedChange: 'ADDED' }],
        { security_key_id: 'key_123', disabled: false },
        'SUBMIT'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('already exists');
    });

    // 13. REMOVED on existing property -> PASS
    it('13. REMOVED on existing property evaluates to PASS', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'backup_email', expectedChange: 'REMOVED' }],
        { backup_email: 'user@example.com', disabled: false },
        'SUBMIT'
      );
      expect(rec.passed).toBe(true);
    });

    // 14. REMOVED on non-existing property -> FAIL
    it('14. REMOVED on non-existing property evaluates to FAIL', () => {
      const rec = InvariantPredicates.matchAllowedStateDelta(
        [{ property: 'backup_email', expectedChange: 'REMOVED' }],
        { disabled: false },
        'SUBMIT'
      );
      expect(rec.passed).toBe(false);
      expect(rec.explanation).toContain('does not exist');
    });
  });

  // =========================================================================
  // PART 2 — HARD INVARIANT GATES (Scenarios 15 to 23)
  // =========================================================================
  describe('Part 2: Hard Invariant Gates & Precedence', () => {
    // 15. Mandatory pre-state predicate failure => candidate rejected
    it('15. Mandatory predicate failure rejects candidate with status FAIL', () => {
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        mandatoryPreStatePredicates: [
          {
            id: 'PRE_MANDATORY_NOTIF',
            name: 'Notifications Must Be Enabled',
            description: 'Cannot disable notifications if already off',
            declarative: {
              id: 'decl_1',
              name: 'decl_1',
              description: 'decl_1',
              source: 'PRE_STATE',
              property: 'notifications_enabled',
              operator: 'EQUALS',
              expectedValue: true,
            },
            evaluate: (s) => s.notifications_enabled === true,
          },
        ],
      };

      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        observedState: { notifications_enabled: false },
      };

      const result = InvariantClosureEngine.evaluateCandidate(fp, cand);
      expect(result.status).toBe('FAIL');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('Notifications Must Be Enabled');
    });

    // 16. Required state unknown => INSUFFICIENT_EVIDENCE
    it('16. Required pre-state unknown evaluates to INSUFFICIENT_EVIDENCE', () => {
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        mandatoryPreStatePredicates: [
          {
            id: 'PRE_MANDATORY_REQ',
            name: 'Required State Check',
            description: 'Requires specific property in observedState',
            declarative: {
              id: 'decl_req',
              name: 'decl_req',
              description: 'decl_req',
              source: 'PRE_STATE',
              property: 'session_authenticated',
              operator: 'EQUALS',
              expectedValue: true,
            },
            evaluate: (s) => s.session_authenticated === true,
          },
        ],
      };

      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        observedState: {}, // Property session_authenticated is unobserved
      };

      const result = InvariantClosureEngine.evaluateCandidate(fp, cand);
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('session_authenticated');
    });

    // 17. INSUFFICIENT_EVIDENCE => not eligible for ranking
    it('17. INSUFFICIENT_EVIDENCE candidate is never passed to CandidateRankingEngine', () => {
      const pipeline = new CandidatePipeline(new NegativeEvidenceStore(), new CandidateRankingEngine());
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        mandatoryPreStatePredicates: [
          {
            id: 'PRE_MANDATORY_REQ',
            name: 'Required State Check',
            description: 'Requires specific property in observedState',
            declarative: {
              id: 'decl_req',
              name: 'decl_req',
              description: 'decl_req',
              source: 'PRE_STATE',
              property: 'auth_token_present',
              operator: 'EQUALS',
              expectedValue: true,
            },
            evaluate: (s) => s.auth_token_present === true,
          },
        ],
      };

      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        observedState: {},
      };

      const pipelineResult = pipeline.processCandidates(fp, [cand]);
      expect(pipelineResult.eligibleCandidates).toHaveLength(0);
      expect(pipelineResult.rejectedCandidates).toHaveLength(1);
      expect(pipelineResult.rankedScores).toHaveLength(0);
      expect(pipelineResult.selectedWinner).toBeNull();
      expect(pipelineResult.rejectedCandidates[0]!.result.status).toBe('INSUFFICIENT_EVIDENCE');
    });

    // 18. Forbidden predicate violation => candidate rejected with status CONTRADICTED
    it('18. Forbidden predicate violation rejects candidate with CONTRADICTED', () => {
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        forbiddenContextPredicates: [
          {
            target: 'container',
            pattern: 'administrative|root|billing_admin',
            required: false,
          },
        ],
      };

      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        containerSemantics: ['administrative', 'settings'],
      };

      const result = InvariantClosureEngine.evaluateCandidate(fp, cand);
      expect(result.status).toBe('CONTRADICTED');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('CONTRADICTION');
    });

    // 19. Forbidden target match => rejected / CONTRADICTED
    it('19. Forbidden target match (ALL_NOTIFICATIONS decoy) rejects candidate with CONTRADICTED', () => {
      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        observedTargetEntity: 'ALL_NOTIFICATIONS',
      };

      const result = InvariantClosureEngine.evaluateCandidate(baseFingerprint, cand);
      expect(result.status).toBe('CONTRADICTED');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('ALL_NOTIFICATIONS');
    });

    // 20. Forbidden action match => rejected / CONTRADICTED
    it('20. Forbidden action match (destructive DELETE on preference goal) rejects candidate with CONTRADICTED', () => {
      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        observedActionType: 'DELETE',
      };

      const result = InvariantClosureEngine.evaluateCandidate(baseFingerprint, cand);
      expect(result.status).toBe('CONTRADICTED');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('destructive action');
    });

    // 21. Expected post-state match => PASS
    it('21. Expected post-state compatible candidate passes invariant closure', () => {
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        expectedPostState: [
          { property: 'marketing_emails_enabled', expectedValue: false },
        ],
      };

      const cand: CandidateEvaluationContext = {
        ...baseCandidate,
        candidateLabel: 'Disable marketing emails',
        observedRole: 'switch',
        observedState: { marketing_emails_enabled: true },
      };

      const result = InvariantClosureEngine.evaluateCandidate(fp, cand);
      expect(result.status).toBe('PASS');
      expect(result.isEligibleForRanking).toBe(true);
    });

    // 22. Expected post-state mismatch => rejected before ranking
    it('22. Expected post-state mismatch (opposing action or already in post-state) rejects candidate', () => {
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        expectedPostState: [
          { property: 'marketing_emails_enabled', expectedValue: false },
        ],
      };

      // Candidate pre-state is ALREADY false (already achieved post-state)
      const candPreStateConflict: CandidateEvaluationContext = {
        ...baseCandidate,
        candidateLabel: 'Disable marketing emails',
        observedRole: 'switch',
        observedState: { marketing_emails_enabled: false },
      };

      const res1 = InvariantClosureEngine.evaluateCandidate(fp, candPreStateConflict);
      expect(res1.status).toBe('FAIL');
      expect(res1.isEligibleForRanking).toBe(false);
      expect(res1.rejectionReason).toContain('already equal to expected post-state');

      // Candidate label indicates opposite direction ("Enable marketing emails")
      const candOpposingLabel: CandidateEvaluationContext = {
        ...baseCandidate,
        candidateLabel: 'Enable marketing emails',
        observedRole: 'switch',
        observedState: { marketing_emails_enabled: true },
      };

      const res2 = InvariantClosureEngine.evaluateCandidate(fp, candOpposingLabel);
      expect(res2.status).toBe('FAIL');
      expect(res2.isEligibleForRanking).toBe(false);
      expect(res2.rejectionReason).toContain('contradicts expected post-state');
    });

    // 23. Expected post-state unknown => INSUFFICIENT_EVIDENCE
    it('23. Expected post-state unknown evaluates to INSUFFICIENT_EVIDENCE and is not ranked', () => {
      const fp: FunctionalCapabilityFingerprint = {
        ...baseFingerprint,
        expectedPostState: [
          { property: 'custom_preference_flag', expectedValue: false },
        ],
      };

      // Candidate has generic button label with no semantic link to custom_preference_flag and no observedState for it
      const candNoEvidence: CandidateEvaluationContext = {
        ...baseCandidate,
        candidateLabel: 'Save Generic Changes',
        observedTargetEntity: 'UNKNOWN',
        observedState: {},
      };

      const result = InvariantClosureEngine.evaluateCandidate(fp, candNoEvidence);
      expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
      expect(result.isEligibleForRanking).toBe(false);
      expect(result.rejectionReason).toContain('Missing evidence for expected post-state property');
    });
  });

  // =========================================================================
  // PART 3 — ACTIVE ROUTE REVALIDATION (Scenario 24)
  // =========================================================================
  describe('Part 3: Active Route Revalidation', () => {
    it('24. Active route revalidation with live invariant failure halts execution and enters ABSTAINED', async () => {
      const machine = new IntentNavMachine();
      machine.registerCapability(baseFingerprint);

      // Create and promote a route to ACTIVE_VALIDATED
      const v1 = machine.routeManager.createProvisionalRoute(baseFingerprint.capabilityId, [], 0.95);
      const token: any = {
        tokenId: 'tok_active_rev_1',
        routeId: v1.routeId,
        capabilityId: baseFingerprint.capabilityId,
        activationEventId: 'act_rev_1',
        verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
        issuedTimestamp: Date.now(),
        verifiedStatus: 'VERIFIED',
        signatureHash: 'hash_rev',
      };
      machine.routeManager.promoteToActive(baseFingerprint.capabilityId, v1.routeId, token);

      let wasDispatched = false;
      const dispatcher: ExecutionDispatcher = {
        async dispatchActivation(activationEventId: string, candidate: any, capabilityId: string) {
          wasDispatched = true;
          return {
            success: true,
            activationEvent: {
              eventId: activationEventId,
              sequenceNumber: 1,
              timestamp: Date.now(),
              targetCandidateId: candidate.candidateId,
              eventType: 'click',
              initiatingCapabilityId: capabilityId,
            },
          };
        },
        async collectWitnesses() {
          return [];
        },
      };

      // Now attempt execution via active route revalidation, but live observed interface state fails invariant
      // (control is currently disabled: disabled = true)
      const ctx = await machine.processIntent(
        'Disable marketing emails',
        {
          tag: 'button',
          id: 'btn_mkt_toggle',
          role: 'switch',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'MARKETING_NOTIFICATIONS',
          observedPreState: { disabled: true }, // LIVE INVARIANT VIOLATION: Control is disabled!
        },
        [],
        false,
        dispatcher
      );

      // ACTIVE_VALIDATED MUST NOT OVERRIDE LIVE INVARIANT FAILURE!
      expect(ctx.currentState).toBe('ABSTAINED');
      expect(wasDispatched).toBe(false);
      expect(
        machine.auditLogger.getRecords().some(
          (log) => log.executionAuthorization?.policyReason.includes('Active route failed current invariant evaluation')
        )
      ).toBe(true);
    });
  });
});
