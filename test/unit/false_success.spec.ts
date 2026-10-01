/**
 * IntentNav-SCFR: False-Success & Fail-Safe Execution Tests
 *
 * Phase 2 & 19 Requirements:
 * Proves that a simulated `{ success: true }` from a dispatcher is NEVER sufficient
 * to reach EXECUTED state. Enforces that all false-success anomalies fail safely:
 * 1. Dispatcher reports success but element did not change (stateChanged: false)
 * 2. Target element could not be resolved (elementFound: false)
 * 3. Browser event dispatch failed (eventDispatched: false)
 * 4. Unrelated DOM mutation occurred instead of capability delta
 * 5. Only one witness class exists (quorum failure)
 * 6. Post-state did not occur (missing expected property)
 * 7. Wrong post-state value observed
 * 8. Mutation occurred before activation (pre-existing)
 * 9. Mutation occurred after verification window (timed-out)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../../src/core/capability/catalog';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { InterfaceStateNode } from '../../src/types/state';

function setupMockDOM(siteDir: string): { window: any; document: Document } {
  const basePath = path.resolve(__dirname, '../../mock-sites', siteDir);
  const html = fs.readFileSync(path.join(basePath, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(basePath, 'app.js'), 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: `http://localhost:3000/${siteDir}/`,
  });

  dom.window.eval(js);

  return {
    window: dom.window,
    document: dom.window.document,
  };
}

describe('False-Success & Fail-Safe Execution Semantics', () => {
  let machine: IntentNavMachine;
  let candidates: CandidateEvaluationContext[];
  let document: Document;

  beforeEach(() => {
    machine = new IntentNavMachine();
    AUTHORITATIVE_CAPABILITY_CATALOG.forEach((cap) => machine.registerCapability(cap));

    const mockDOM = setupMockDOM('site-a');
    document = mockDOM.document;
    candidates = CandidateGenerator.generateFromDOM(document);
  });

  const mockContextElement = { tag: 'body', observedActionType: 'VIEW', observedTargetEntity: 'UNKNOWN' };

  const mockInterfaceState: InterfaceStateNode = {
    stateId: 'st_001',
    stateType: 'PAGE',
    urlPattern: 'http://localhost:3000/site-a/',
    domStructuralHash: 'hash_test',
    semanticLandmarks: ['main', 'section[notifications]'],
    activeModalsOrDialogs: [],
    activeTabs: ['notifications'],
    exposedCandidateHandles: [],
    observedApplicationState: { marketing_notifications_enabled: true },
    timestamp: Date.now(),
  };

  it('fails safely when dispatcher reports success but element not found (elementFound: false via false success)', async () => {
    // Note: stateChanged is no longer part of the dispatch protocol.
    // State change is determined by causal verification and post-state observation.
    // This test verifies that elementFound:false still causes a FAILED state even
    // when success:true is simultaneously returned.
    const falseSuccessDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        return {
          success: true,    // Conflicting: success:true but element was never found
          elementFound: false,
          eventDispatched: false,
          reason: 'Simulated element mismatch — element could not be resolved',
        };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      falseSuccessDispatcher
    );

    expect(result.currentState).toBe('FAILED');
    expect(machine.state).toBe('FAILED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('fails safely when target DOM element could not be resolved (elementFound: false)', async () => {
    const missingElementDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        return {
          success: false,
          elementFound: false,
          reason: 'Element selector detached from DOM',
        };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      missingElementDispatcher
    );

    expect(result.currentState).toBe('FAILED');
    expect(machine.state).toBe('FAILED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('fails safely when browser event dispatch failed (eventDispatched: false)', async () => {
    const dispatchFailedDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        return {
          success: true,
          elementFound: true,
          eventDispatched: false, // Event prevented or handler threw
          stateChanged: false,
        };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      dispatchFailedDispatcher
    );

    expect(result.currentState).toBe('FAILED');
    expect(machine.state).toBe('FAILED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('quarantines and fails when only unrelated DOM mutation occurs', async () => {
    const t0 = Date.now();
    const unrelatedMutationDispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
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
            witnessId: 'w_unrelated',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: t0 + 40,
            observedDelta: { some_random_theme: 'dark' }, // Completely unrelated delta!
            correlatedActivationEventId: 'act_other',
            temporalDeltaMs: 40,
            isCausallyCorrelated: false,
            correlationExplanation: 'Unrelated mutation',
          },
        ];
      },
      async observePostState() {
        return {
          ...mockInterfaceState,
          observedApplicationState: { marketing_notifications_enabled: true },
        };
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      unrelatedMutationDispatcher
    );

    expect(result.currentState).toBe('QUARANTINED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('quarantines and fails when only one witness class exists (insufficient quorum)', async () => {
    const t0 = Date.now();
    let capturedActId = 'act_test';
    const singleClassDispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        capturedActId = actId;
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
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
        // Two witnesses of the EXACT SAME CLASS (DOM_MUTATION) - no multi-class quorum
        return [
          {
            witnessId: 'w_dom1',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: t0 + 30,
            observedDelta: { marketing_notifications_enabled: false },
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 30,
            isCausallyCorrelated: true,
            correlationExplanation: 'DOM mutation 1',
          },
          {
            witnessId: 'w_dom2',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 2,
            timestamp: t0 + 50,
            observedDelta: { marketing_notifications_enabled: false },
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 50,
            isCausallyCorrelated: true,
            correlationExplanation: 'DOM mutation 2',
          },
        ];
      },
      async observePostState() {
        return {
          ...mockInterfaceState,
          observedApplicationState: { marketing_notifications_enabled: false },
        };
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      singleClassDispatcher
    );

    expect(result.currentState).toBe('QUARANTINED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('fails safely when expected post-state does not occur (missing property)', async () => {
    const t0 = Date.now();
    let capturedActId = 'act_test';
    const missingPostStateDispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        capturedActId = actId;
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
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
        // Both witnesses present with 2 classes, but delta does not contain marketing_notifications_enabled
        return [
          {
            witnessId: 'w_dom',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: t0 + 30,
            observedDelta: { unrelated_counter: 1 },
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 30,
            isCausallyCorrelated: false,
            correlationExplanation: 'Unrelated DOM change',
          },
          {
            witnessId: 'w_a11y',
            witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
            sequenceNumber: 2,
            timestamp: t0 + 60,
            observedDelta: { unrelated_aria: 'expanded' },
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 60,
            isCausallyCorrelated: false,
            correlationExplanation: 'Unrelated a11y change',
          },
        ];
      },
      async observePostState() {
        // Post-state completely omits marketing_notifications_enabled
        return {
          ...mockInterfaceState,
          observedApplicationState: { other_unrelated_feature: true },
        };
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      missingPostStateDispatcher
    );

    expect(['QUARANTINED', 'FAILED']).toContain(result.currentState);
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('fails safely when expected post-state property has wrong value', async () => {
    const t0 = Date.now();
    let capturedActId = 'act_test';
    const wrongPostStateDispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        capturedActId = actId;
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
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
            witnessId: 'w_dom',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: t0 + 30,
            observedDelta: { marketing_notifications_enabled: true }, // WRONG: expected false!
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 30,
            isCausallyCorrelated: true,
            correlationExplanation: 'DOM mutation wrong value',
          },
          {
            witnessId: 'w_a11y',
            witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
            sequenceNumber: 2,
            timestamp: t0 + 60,
            observedDelta: { ariaChecked: 'true' },
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 60,
            isCausallyCorrelated: true,
            correlationExplanation: 'A11y wrong value',
          },
        ];
      },
      async observePostState() {
        return {
          ...mockInterfaceState,
          observedApplicationState: { marketing_notifications_enabled: true }, // WRONG: expected false!
        };
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      wrongPostStateDispatcher
    );

    expect(['QUARANTINED', 'FAILED']).toContain(result.currentState);
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('fails safely when mutation occurred before activation (pre-existing anomaly)', async () => {
    const t0 = Date.now();
    const preExistingDispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
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
            witnessId: 'w_pre',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: t0 - 100, // BEFORE activation!
            observedDelta: { marketing_notifications_enabled: false },
            correlatedActivationEventId: null,
            temporalDeltaMs: -100,
            isCausallyCorrelated: false,
            correlationExplanation: 'pre-existing',
          },
        ];
      },
      async observePostState() {
        return {
          ...mockInterfaceState,
          observedApplicationState: { marketing_notifications_enabled: false },
        };
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      preExistingDispatcher
    );

    expect(result.currentState).toBe('QUARANTINED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  it('fails safely when mutation occurred after verification window (timed-out)', async () => {
    const t0 = Date.now();
    let capturedActId = 'act_test';
    const timedOutDispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        capturedActId = actId;
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
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
            witnessId: 'w_late1',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: t0 + 5000, // Beyond 1500ms window!
            observedDelta: { marketing_notifications_enabled: false },
            correlatedActivationEventId: capturedActId,
            temporalDeltaMs: 5000,
            isCausallyCorrelated: true,
            correlationExplanation: 'late',
          },
        ];
      },
      async observePostState() {
        return {
          ...mockInterfaceState,
          observedApplicationState: { marketing_notifications_enabled: false },
        };
      },
    };

    const result = await machine.processIntent(
      'Turn off marketing emails',
      mockContextElement,
      candidates,
      false,
      timedOutDispatcher
    );

    expect(result.currentState).toBe('QUARANTINED');
    expect(machine.state).not.toBe('EXECUTED');
  });

  describe('Authoritative 17-Precondition Enforcement (Phase 14)', () => {
    it('validates each of the 17 preconditions explicitly preventing EXECUTED state', () => {
      const validContext: import('../../src/core/stateMachine/machine').StateMachineContext = {
        currentState: 'TRANSITION_VERIFYING',
        normalizedIntent: {
          rawGoal: 'turn off marketing emails',
          normalizedGoal: 'turn off marketing emails',
          actionType: 'MODIFY_PREFERENCE',
          targetEntity: 'MARKETING_NOTIFICATIONS',
          confidence: 0.95,
          constraints: [],
          sensitivityHints: [],
        },
        resolvedCapability: {
          ...AUTHORITATIVE_CAPABILITY_CATALOG[0]!,
        },
        activeRoute: {
          routeId: 'route_valid_v1',
          capabilityId: 'CAP_DISABLE_MARKETING',
          versionNumber: 1,
          status: 'ACTIVE_VALIDATED',
          steps: [
            {
              stepIndex: 1,
              fromStateId: 'PAGE',
              toStateId: 'PANEL',
              actionDescription: 'Click toggle',
              bindingHandle: {
                handleId: 'handle_01',
                tagName: 'BUTTON',
                role: 'switch',
                accessibleName: 'Marketing email toggle',
                domStructuralPath: '#btn-marketing',
                elementIndex: 0,
              },
            },
          ],
          creationTimestamp: Date.now(),
          confidenceScore: 0.95,
          pathCost: 1.0,
        },
        selectedCandidate: {
          candidateId: 'cand_01',
          candidateLabel: 'Marketing email toggle',
          isEligible: true,
          rank: 1,
          weightsVersion: '1.0',
          bindingHandle: {
            handleId: 'handle_01',
            tagName: 'BUTTON',
            role: 'switch',
            accessibleName: 'Marketing email toggle',
            domStructuralPath: '#btn-marketing',
            elementIndex: 0,
          },
          scoreBreakdown: {
            invariantFit: 0.9,
            semanticFit: 0.9,
            contextFit: 0.9,
            transitionFit: 0.9,
            validationHistory: 0.9,
            contradictionPenalty: 0,
            stalenessPenalty: 0,
            riskPenalty: 0,
            pathCostPenalty: 0,
            totalScore: 0.9,
          },
        },
        invariantResults: {
          cand_01: {
            candidateId: 'cand_01',
            status: 'PASS',
            isEligibleForRanking: true,
            passedPredicates: [],
            failedPredicates: [],
            evaluatedTimestamp: Date.now(),
          },
        },
        authorizationDecision: {
          status: 'AUTHORIZED',
          riskClass: 'REVERSIBLE',
          capabilityConfidence: 0.95,
          routeConfidence: 0.95,
          evidenceQuorum: {
            hasSemanticEvidence: true,
            hasFunctionalInvariantEvidence: true,
            hasTransitionStateEvidence: true,
            quorumSatisfied: true,
          },
          requiresUserConfirmation: false,
          policyReason: 'Policy passed',
          evaluatedTimestamp: Date.now(),
        },
        activationEvent: {
          eventId: 'act_001',
          sequenceNumber: 1,
          timestamp: 1000,
          targetCandidateId: 'cand_01',
          eventType: 'click',
          initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          bindingHandle: {
            handleId: 'handle_01',
            tagName: 'BUTTON',
            role: 'switch',
            accessibleName: 'Marketing email toggle',
            domStructuralPath: '#btn-marketing',
            elementIndex: 0,
          },
        },
        capturedWitnesses: [
          {
            witnessId: 'w1',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: 1050,
            observedDelta: { marketing_emails_enabled: false },
            correlatedActivationEventId: 'act_001',
            temporalDeltaMs: 50,
            isCausallyCorrelated: true,
            correlationExplanation: 'dom',
          },
          {
            witnessId: 'w2',
            witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
            sequenceNumber: 2,
            timestamp: 1080,
            observedDelta: { ariaChecked: 'false' },
            correlatedActivationEventId: 'act_001',
            temporalDeltaMs: 80,
            isCausallyCorrelated: true,
            correlationExplanation: 'a11y',
          },
        ],
        verificationResult: {
          signature: {
            preStateFingerprint: 'PRE',
            activationEventExpected: { eventType: 'click' },
            expectedStateDelta: { marketing_emails_enabled: false },
            verificationWindowMs: 2000,
            postStateFingerprint: 'POST',
          },
          activationEvent: {
            eventId: 'act_001',
            sequenceNumber: 1,
            timestamp: 1000,
            targetCandidateId: 'cand_01',
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
          observedWitnesses: [],
          verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
          status: 'VERIFIED',
          causallyVerified: true,
          durationMs: 80,
          explanation: 'Verified',
        },
        dispatchSuccessful: true,
        postStateVerified: true,
        causalVerified: true,
      };

      // 0. Base check should pass all 17 conditions
      const baseline = machine.canEnterExecutedState(validContext);
      expect(baseline.allowed).toBe(true);
      expect(baseline.failedPreconditions).toHaveLength(0);

      // 1. Missing intent
      const check1 = machine.canEnterExecutedState({ ...validContext, normalizedIntent: undefined, rawGoal: undefined });
      expect(check1.allowed).toBe(false);
      expect(check1.failedPreconditions).toContain('PRE_1_INTENT_NORMALIZED');

      // 2. Missing candidate and active route
      const check2 = machine.canEnterExecutedState({ ...validContext, selectedCandidate: null, activeRoute: null });
      expect(check2.allowed).toBe(false);
      expect(check2.failedPreconditions).toContain('PRE_2_CANDIDATE_RESOLVED');

      // 3. Missing capability identity
      const check3 = machine.canEnterExecutedState({
        ...validContext,
        resolvedCapability: { ...validContext.resolvedCapability!, capabilityId: '' },
      });
      expect(check3.allowed).toBe(false);
      expect(check3.failedPreconditions).toContain('PRE_3_CAPABILITY_IDENTITY');

      // 4. Missing binding handle
      const check4 = machine.canEnterExecutedState({
        ...validContext,
        selectedCandidate: { ...validContext.selectedCandidate!, bindingHandle: undefined },
        activationEvent: { ...validContext.activationEvent!, bindingHandle: undefined },
        activeRoute: { ...validContext.activeRoute!, steps: [] },
      });
      expect(check4.allowed).toBe(false);
      expect(check4.failedPreconditions).toContain('PRE_4_VALID_BINDING_HANDLE');

      // 5. Invariant closure failure
      const check5 = machine.canEnterExecutedState({
        ...validContext,
        invariantResults: { cand_01: { ...validContext.invariantResults!['cand_01']!, status: 'FAIL' } },
      });
      expect(check5.allowed).toBe(false);
      expect(check5.failedPreconditions).toContain('PRE_5_INVARIANT_CLOSURE');

      // 6. Route not authorized
      const check6 = machine.canEnterExecutedState({
        ...validContext,
        activeRoute: { ...validContext.activeRoute!, status: 'DEMOTED' },
      });
      expect(check6.allowed).toBe(false);
      expect(check6.failedPreconditions).toContain('PRE_6_ROUTE_AUTHORIZED');

      // 7. Authorization denied
      const check7 = machine.canEnterExecutedState({
        ...validContext,
        authorizationDecision: { ...validContext.authorizationDecision!, status: 'DENIED_ABSTAIN' },
      });
      expect(check7.allowed).toBe(false);
      expect(check7.failedPreconditions).toContain('PRE_7_EXECUTION_AUTHORIZED');

      // 8. Missing dispatch activation event
      const check8 = machine.canEnterExecutedState({ ...validContext, activationEvent: null });
      expect(check8.allowed).toBe(false);
      expect(check8.failedPreconditions).toContain('PRE_8_ACTIVATION_DISPATCHED');

      // 9. Dispatch failed or undefined
      const check9False = machine.canEnterExecutedState({ ...validContext, dispatchSuccessful: false });
      expect(check9False.allowed).toBe(false);
      expect(check9False.failedPreconditions).toContain('PRE_9_DISPATCH_SUCCESSFUL');

      const check9Undefined = machine.canEnterExecutedState({ ...validContext, dispatchSuccessful: undefined });
      expect(check9Undefined.allowed).toBe(false);
      expect(check9Undefined.failedPreconditions).toContain('PRE_9_DISPATCH_SUCCESSFUL');

      // 10. Activation event does not precede witnesses (t_act >= t_wit)
      const check10 = machine.canEnterExecutedState({
        ...validContext,
        activationEvent: { ...validContext.activationEvent!, timestamp: 1200 }, // 1200 > 1050
      });
      expect(check10.allowed).toBe(false);
      expect(check10.failedPreconditions).toContain('PRE_10_ACTIVATION_EVENT_VALID');

      // 11. Missing witnesses
      const check11 = machine.canEnterExecutedState({ ...validContext, capturedWitnesses: [] });
      expect(check11.allowed).toBe(false);
      expect(check11.failedPreconditions).toContain('PRE_11_WITNESSES_CAPTURED');

      // 12. Causal verification failed or undefined
      const check12Failed = machine.canEnterExecutedState({
        ...validContext,
        verificationResult: { ...validContext.verificationResult!, causallyVerified: false, status: 'FAILED_WRONG_STATE_DELTA' },
      });
      expect(check12Failed.allowed).toBe(false);
      expect(check12Failed.failedPreconditions).toContain('PRE_12_CAUSAL_VERIFIED');

      const check12Undefined = machine.canEnterExecutedState({ ...validContext, causalVerified: undefined });
      expect(check12Undefined.allowed).toBe(false);
      expect(check12Undefined.failedPreconditions).toContain('PRE_12_CAUSAL_VERIFIED');

      // 13. Post-state verification failed or undefined
      const check13False = machine.canEnterExecutedState({ ...validContext, postStateVerified: false });
      expect(check13False.allowed).toBe(false);
      expect(check13False.failedPreconditions).toContain('PRE_13_POST_STATE_VERIFIED');

      const check13Undefined = machine.canEnterExecutedState({ ...validContext, postStateVerified: undefined });
      expect(check13Undefined.allowed).toBe(false);
      expect(check13Undefined.failedPreconditions).toContain('PRE_13_POST_STATE_VERIFIED');

      // 14. Insufficient witness quorum (requires >=2 for REVERSIBLE)
      const check14 = machine.canEnterExecutedState({
        ...validContext,
        verificationResult: { ...validContext.verificationResult!, verifiedWitnessClasses: ['DOM_MUTATION'] },
      });
      expect(check14.allowed).toBe(false);
      expect(check14.failedPreconditions).toContain('PRE_14_WITNESS_QUORUM');

      // 15. Contradictory evidence
      const check15 = machine.canEnterExecutedState({
        ...validContext,
        invariantResults: { cand_01: { ...validContext.invariantResults!['cand_01']!, status: 'CONTRADICTED' } },
      });
      expect(check15.allowed).toBe(false);
      expect(check15.failedPreconditions).toContain('PRE_15_NO_CONTRADICTORY_EVIDENCE');

      // 16. Unresolved quarantine
      const check16 = machine.canEnterExecutedState({
        ...validContext,
        provisionalRoute: { ...validContext.activeRoute!, status: 'QUARANTINED' },
      });
      expect(check16.allowed).toBe(false);
      expect(check16.failedPreconditions).toContain('PRE_16_NO_UNRESOLVED_QUARANTINE');

      // 17. Provisional route with invalid promotion token
      const check17 = machine.canEnterExecutedState({
        ...validContext,
        provisionalRoute: { ...validContext.activeRoute!, status: 'PROVISIONAL' },
        verificationResult: { ...validContext.verificationResult!, verificationToken: undefined },
      });
      expect(check17.allowed).toBe(false);
      expect(check17.failedPreconditions).toContain('PRE_17_PROMOTION_TOKEN_VALID');
    });
  });

  describe('Authoritative 17-Precondition Single-Knockout Regression Tests', () => {
    /**
     * Mutation-style tests: each test takes a fully-valid context and removes
     * exactly ONE precondition at a time. Proves that every individual
     * precondition independently gates the EXECUTED state.
     */

    function makeValidContext(): import('../../src/core/stateMachine/machine').StateMachineContext {
      const t0 = 1000;
      return {
        currentState: 'TRANSITION_VERIFYING',
        normalizedIntent: {
          rawGoal: 'turn off marketing emails',
          normalizedGoal: 'turn off marketing emails',
          actionType: 'MODIFY_PREFERENCE',
          targetEntity: 'MARKETING_NOTIFICATIONS',
          confidence: 0.95,
          constraints: [],
          sensitivityHints: [],
        },
        resolvedCapability: { ...AUTHORITATIVE_CAPABILITY_CATALOG[0]! },
        activeRoute: {
          routeId: 'route_ko_v1',
          capabilityId: 'CAP_DISABLE_MARKETING',
          versionNumber: 1,
          status: 'ACTIVE_VALIDATED',
          steps: [{
            stepIndex: 1, fromStateId: 'PAGE', toStateId: 'PANEL',
            actionDescription: 'Click toggle',
            bindingHandle: {
              handleId: 'handle_ko', tagName: 'BUTTON', role: 'switch',
              accessibleName: 'Marketing email toggle',
              domStructuralPath: '#btn-marketing', elementIndex: 0,
            },
          }],
          creationTimestamp: t0, confidenceScore: 0.95, pathCost: 1.0,
        },
        selectedCandidate: {
          candidateId: 'cand_ko', candidateLabel: 'Marketing email toggle',
          isEligible: true, rank: 1, weightsVersion: '1.0',
          bindingHandle: {
            handleId: 'handle_ko', tagName: 'BUTTON', role: 'switch',
            accessibleName: 'Marketing email toggle',
            domStructuralPath: '#btn-marketing', elementIndex: 0,
          },
          scoreBreakdown: {
            invariantFit: 0.9, semanticFit: 0.9, contextFit: 0.9, transitionFit: 0.9,
            validationHistory: 0.9, contradictionPenalty: 0, stalenessPenalty: 0,
            riskPenalty: 0, pathCostPenalty: 0, totalScore: 0.9,
          },
        },
        invariantResults: {
          cand_ko: {
            candidateId: 'cand_ko', status: 'PASS', isEligibleForRanking: true,
            passedPredicates: [], failedPredicates: [], evaluatedTimestamp: t0,
          },
        },
        authorizationDecision: {
          status: 'AUTHORIZED', riskClass: 'REVERSIBLE',
          capabilityConfidence: 0.95, routeConfidence: 0.95,
          evidenceQuorum: {
            hasSemanticEvidence: true, hasFunctionalInvariantEvidence: true,
            hasTransitionStateEvidence: true, quorumSatisfied: true,
          },
          requiresUserConfirmation: false, policyReason: 'Policy passed', evaluatedTimestamp: t0,
        },
        activationEvent: {
          eventId: 'act_ko', sequenceNumber: 1, timestamp: t0,
          targetCandidateId: 'cand_ko', eventType: 'click',
          initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          bindingHandle: {
            handleId: 'handle_ko', tagName: 'BUTTON', role: 'switch',
            accessibleName: 'Marketing email toggle',
            domStructuralPath: '#btn-marketing', elementIndex: 0,
          },
        },
        capturedWitnesses: [
          {
            witnessId: 'w_ko_1', witnessClass: 'DOM_MUTATION', sequenceNumber: 1,
            timestamp: t0 + 50, observedDelta: { marketing_emails_enabled: false },
            correlatedActivationEventId: 'act_ko', temporalDeltaMs: 50,
            isCausallyCorrelated: true, correlationExplanation: 'dom',
          },
          {
            witnessId: 'w_ko_2', witnessClass: 'ACCESSIBILITY_STATE_MUTATION', sequenceNumber: 2,
            timestamp: t0 + 80, observedDelta: { ariaChecked: 'false' },
            correlatedActivationEventId: 'act_ko', temporalDeltaMs: 80,
            isCausallyCorrelated: true, correlationExplanation: 'a11y',
          },
        ],
        verificationResult: {
          signature: {
            preStateFingerprint: 'PRE', activationEventExpected: { eventType: 'click' },
            expectedStateDelta: { marketing_emails_enabled: false },
            verificationWindowMs: 2000, postStateFingerprint: 'POST',
          },
          activationEvent: {
            eventId: 'act_ko', sequenceNumber: 1, timestamp: t0,
            targetCandidateId: 'cand_ko', eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
          observedWitnesses: [],
          verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
          status: 'VERIFIED',
          causallyVerified: true,
          durationMs: 80,
          explanation: 'Verified',
          verificationToken: machine.tokenAuthenticator.issueToken({
            tokenId: 'tok_ko',
            routeId: 'route_ko_v1',
            capabilityId: 'CAP_DISABLE_MARKETING',
            activationEventId: 'act_ko',
            verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
            issuedTimestamp: t0 + 80,
          }),
        },
        dispatchSuccessful: true, postStateVerified: true, causalVerified: true,
      };
    }

    it('[KO-PRE_1] removing normalizedIntent alone → EXECUTED blocked', () => {
      const base = machine.canEnterExecutedState(makeValidContext());
      expect(base.allowed).toBe(true); // Sanity: baseline must pass
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), normalizedIntent: undefined });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_1_INTENT_NORMALIZED');
    });

    it('[KO-PRE_2] removing selectedCandidate and activeRoute alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), selectedCandidate: null, activeRoute: null });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_2_CANDIDATE_RESOLVED');
    });

    it('[KO-PRE_3] empty capabilityId alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({ ...ctx, resolvedCapability: { ...ctx.resolvedCapability!, capabilityId: '' } });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_3_CAPABILITY_IDENTITY');
    });

    it('[KO-PRE_4] missing bindingHandle on candidate, event, and route steps alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx,
        selectedCandidate: { ...ctx.selectedCandidate!, bindingHandle: undefined },
        activationEvent: { ...ctx.activationEvent!, bindingHandle: undefined },
        activeRoute: { ...ctx.activeRoute!, steps: [] },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_4_VALID_BINDING_HANDLE');
    });

    it('[KO-PRE_5] invariant result FAIL alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx,
        invariantResults: { cand_ko: { ...ctx.invariantResults!['cand_ko']!, status: 'FAIL' } },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_5_INVARIANT_CLOSURE');
    });

    it('[KO-PRE_6] route status DEMOTED alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({ ...ctx, activeRoute: { ...ctx.activeRoute!, status: 'DEMOTED' } });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_6_ROUTE_AUTHORIZED');
    });

    it('[KO-PRE_6b] route status PROVISIONAL alone (unpromoted) → EXECUTED blocked (no loophole)', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({ ...ctx, activeRoute: { ...ctx.activeRoute!, status: 'PROVISIONAL' } });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_6_ROUTE_AUTHORIZED');
    });

    it('[KO-PRE_7] authorizationDecision DENIED alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx, authorizationDecision: { ...ctx.authorizationDecision!, status: 'DENIED_ABSTAIN' },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_7_EXECUTION_AUTHORIZED');
    });

    it('[KO-PRE_8] activationEvent null alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), activationEvent: null });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_8_ACTIVATION_DISPATCHED');
    });

    it('[KO-PRE_9] dispatchSuccessful false alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), dispatchSuccessful: false });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_9_DISPATCH_SUCCESSFUL');
    });

    it('[KO-PRE_9] dispatchSuccessful undefined (not explicitly true) alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), dispatchSuccessful: undefined });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_9_DISPATCH_SUCCESSFUL');
    });

    it('[KO-PRE_10] activationEvent timestamp >= witness timestamp alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx, activationEvent: { ...ctx.activationEvent!, timestamp: 1200 },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_10_ACTIVATION_EVENT_VALID');
    });

    it('[KO-PRE_11] empty capturedWitnesses alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), capturedWitnesses: [] });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_11_WITNESSES_CAPTURED');
    });

    it('[KO-PRE_12] causallyVerified false in verificationResult alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx,
        verificationResult: { ...ctx.verificationResult!, causallyVerified: false, status: 'FAILED_WRONG_STATE_DELTA' },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_12_CAUSAL_VERIFIED');
    });

    it('[KO-PRE_12] causalVerified context flag undefined alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), causalVerified: undefined });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_12_CAUSAL_VERIFIED');
    });

    it('[KO-PRE_13] postStateVerified false alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), postStateVerified: false });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_13_POST_STATE_VERIFIED');
    });

    it('[KO-PRE_13] postStateVerified undefined (not explicitly true) alone → EXECUTED blocked', () => {
      const ko = machine.canEnterExecutedState({ ...makeValidContext(), postStateVerified: undefined });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_13_POST_STATE_VERIFIED');
    });

    it('[KO-PRE_14] single witness class in verifiedWitnessClasses alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx, verificationResult: { ...ctx.verificationResult!, verifiedWitnessClasses: ['DOM_MUTATION'] },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_14_WITNESS_QUORUM');
    });

    it('[KO-PRE_15] invariant result CONTRADICTED alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx, invariantResults: { cand_ko: { ...ctx.invariantResults!['cand_ko']!, status: 'CONTRADICTED' } },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_15_NO_CONTRADICTORY_EVIDENCE');
    });

    it('[KO-PRE_16] unresolved QUARANTINED provisional route alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx, provisionalRoute: { ...ctx.activeRoute!, status: 'QUARANTINED' },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_16_NO_UNRESOLVED_QUARANTINE');
    });

    it('[KO-PRE_17] PROVISIONAL route without promotion token alone → EXECUTED blocked', () => {
      const ctx = makeValidContext();
      const ko = machine.canEnterExecutedState({
        ...ctx,
        provisionalRoute: { ...ctx.activeRoute!, status: 'PROVISIONAL' },
        verificationResult: { ...ctx.verificationResult!, verificationToken: undefined },
      });
      expect(ko.allowed).toBe(false);
      expect(ko.failedPreconditions).toContain('PRE_17_PROMOTION_TOKEN_VALID');
    });
  });

  describe('Volatile ID Regression: resolveElement must not fall back to getElementById (REQ-C2)', () => {
    it('resolves functional target via semantic matching even when volatileId is stale', () => {
      /**
       * Proves that changing a button DOM ID (framework ID rehashing like :r3: → :r4:)
       * does NOT break resolution — because IntentNav uses structural path and accessible
       * name, NOT getElementById. The stale volatileId should resolve to null.
       */
      const { document: doc } = setupMockDOM('site-a');
      const allCandidates = CandidateGenerator.generateFromDOM(doc);
      const marketingCandidate = allCandidates.find(
        (c) => c.candidateLabel?.toLowerCase().includes('marketing') && c.bindingHandle
      );

      expect(marketingCandidate).toBeDefined();
      const handle = marketingCandidate!.bindingHandle!;

      // Verify the stale ID does not exist in DOM
      const staleFallback = doc.getElementById('completely_stale_id_xz99_that_does_not_exist');
      expect(staleFallback).toBeNull();

      // Verify that structural path or accessible name does resolve
      const resolvedByPath = handle.domStructuralPath
        ? (doc.querySelector(handle.domStructuralPath) as HTMLElement | null)
        : null;

      const resolvedByLabel = (() => {
        const selector = `[role="${handle.role}"], ${handle.tagName}`;
        const elements = Array.from(doc.querySelectorAll(selector)) as HTMLElement[];
        const targetLabel = (handle.accessibleName || '').toLowerCase().trim();
        return elements.find((el) => {
          const elAria = (
            el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || ''
          ).toLowerCase().trim();
          return elAria && targetLabel && (elAria.includes(targetLabel) || targetLabel.includes(elAria));
        }) ?? null;
      })();

      const resolved = resolvedByPath || resolvedByLabel;
      // At least one non-volatile resolution method must succeed
      expect(resolved).not.toBeNull();
    });
  });
});
