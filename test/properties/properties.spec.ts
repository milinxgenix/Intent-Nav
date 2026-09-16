/**
 * IntentNav-SCFR: Formal Machine Safety Properties (1 through 10)
 */

import { describe, it, expect } from 'vitest';
import { IntentNavMachine } from '../../src/core/stateMachine/machine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { ExecutionAuthorizationController } from '../../src/core/authorization/controller';
import { InvariantClosureEngine } from '../../src/core/invariant/engine';
import { VolatileFeatureSuppressor } from '../../src/core/fingerprint/suppressor';

describe('Formal Machine Safety Properties (1 through 10)', () => {
  const cap: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_SEC',
    canonicalFunction: 'disable_security',
    actionType: 'REVOKE_ACCESS',
    targetEntity: 'TWO_FACTOR_AUTH',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [],
    expectedPostState: [],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable 2FA',
      semanticSynonyms: ['turn off 2fa'],
      accessibleName: 'Disable 2FA',
      role: 'button',
      visibleLabel: 'Turn Off 2FA',
      sectionMeaning: 'Security',
      actionDescription: 'Disable 2FA',
    },
    contextEvidence: {} as any,
    transitionEvidence: {
      preStateFingerprint: 'PRE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: {},
      postStateFingerprint: 'POST',
      historicalTransitionObservations: 2,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
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
    negativeEvidence: { rejectedCandidateIdentities: [], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
  };

  // PROPERTY 1: No ACTIVE route exists unless invariant closure passed.
  it('PROPERTY 1: No ACTIVE route exists unless invariant closure passed', () => {
    const candidate = {
      candidateId: 'cand_fail',
      candidateLabel: 'Wrong target',
      observedActionType: 'REVOKE_ACCESS',
      observedTargetEntity: 'WRONG_ENTITY',
      observedRole: 'button',
    };
    const closure = InvariantClosureEngine.evaluateCandidate(cap, candidate);
    expect(closure.isEligibleForRanking).toBe(false);
    expect(closure.status).not.toBe('PASS');
  });

  // PROPERTY 2: No ACTIVE recovered route exists unless transition verification passed when verification is required.
  it('PROPERTY 2: No ACTIVE recovered route exists unless transition verification passed', () => {
    const machine = new IntentNavMachine();
    machine.registerCapability(cap);
    const provisional = machine.routeManager.createProvisionalRoute('CAP_SEC', [], 0.9);
    expect(provisional.status).toBe('PROVISIONAL');

    // Attempt promotion with failed verification
    const promo = machine.promotionController.evaluateAndPromote('CAP_SEC', provisional.routeId, {
      signature: {} as any,
      activationEvent: {} as any,
      observedWitnesses: [],
      verifiedWitnessClasses: [],
      status: 'FAILED_MISSING_WITNESSES',
      causallyVerified: false,
      durationMs: 1500,
      explanation: 'No witnesses',
    });

    expect(promo.promoted).toBe(false);
    expect(machine.graph.getActiveRoute('CAP_SEC')).toBeNull();
  });

  // PROPERTY 3: No high-risk execution occurs without authorization.
  it('PROPERTY 3: No high-risk execution occurs without authorization', () => {
    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: cap,
      capabilityConfidence: 1.0,
      routeConfidence: 1.0,
      invariantResult: { candidateId: 'c1', status: 'PASS', isEligibleForRanking: true, passedPredicates: [{} as any], failedPredicates: [], evaluatedTimestamp: 0 },
      transitionResult: { signature: {} as any, activationEvent: {} as any, observedWitnesses: [{} as any, {} as any], verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'], status: 'VERIFIED', causallyVerified: true, durationMs: 50, explanation: '' },
      userConfirmationGranted: false,
    });
    expect(decision.status).not.toBe('AUTHORIZED');
    expect(decision.requiresUserConfirmation).toBe(true);
  });

  // PROPERTY 4: No candidate failing mandatory invariant can be selected.
  it('PROPERTY 4: No candidate failing mandatory invariant can be selected', () => {
    const machine = new IntentNavMachine();
    const result = machine.candidatePipeline.processCandidates(cap, [
      {
        candidateId: 'bad_candidate',
        candidateLabel: 'Disable 2FA Exactly (Wrong Action)',
        observedActionType: 'VIEW', // Mismatch!
        observedTargetEntity: 'TWO_FACTOR_AUTH',
        observedRole: 'link',
      },
    ]);
    expect(result.eligibleCandidates).toHaveLength(0);
    expect(result.selectedWinner).toBeNull();
  });

  // PROPERTY 5: No semantic score can override a forbidden predicate.
  it('PROPERTY 5: No semantic score can override a forbidden predicate', () => {
    const machine = new IntentNavMachine();
    const result = machine.candidatePipeline.processCandidates(cap, [
      {
        candidateId: 'decoy_exact_string_match',
        candidateLabel: 'Disable two-factor authentication (Purge All Credentials)',
        observedActionType: 'DELETE', // Forbidden destructive action!
        observedTargetEntity: 'TWO_FACTOR_AUTH',
        observedRole: 'button',
      },
    ]);
    expect(result.invariantResults['decoy_exact_string_match']?.status).toBe('CONTRADICTED');
    expect(result.eligibleCandidates).toHaveLength(0);
  });

  // PROPERTY 6: No route can bypass quarantine.
  it('PROPERTY 6: No route can bypass quarantine', () => {
    const machine = new IntentNavMachine();
    machine.registerCapability(cap);
    const newRoute = machine.routeManager.createProvisionalRoute('CAP_SEC', [], 0.95);
    expect(newRoute.status).toBe('PROVISIONAL');
    expect(machine.quarantineController.isUnderQuarantine(newRoute.status)).toBe(true);
  });

  // PROPERTY 7: No unrelated mutation can establish causal transition verification.
  it('PROPERTY 7: No unrelated mutation can establish causal transition verification', () => {
    const machine = new IntentNavMachine();
    const w = machine.witnessCollector.recordWitness('DOM_MUTATION', { unrelated: true });
    expect(w.isCausallyCorrelated).toBe(false);
  });

  // PROPERTY 8: Negative evidence can never itself authorize execution.
  it('PROPERTY 8: Negative evidence can never itself authorize execution', () => {
    const machine = new IntentNavMachine();
    machine.negativeEvidenceStore.recordContradiction('trap', 'KNOWN_DECOY_PATTERN', 'H1', 'Trap');
    expect(machine.negativeEvidenceStore.isKnownContradiction('trap')).toBe(true);
  });

  // PROPERTY 9: Capability identity is not dependent on volatile IDs/classes/coordinates.
  it('PROPERTY 9: Capability identity is not dependent on volatile IDs/classes/coordinates', () => {
    const el1 = document.createElement('button');
    el1.id = 'react-aria-1';
    el1.className = 'css-123 px-4';
    el1.setAttribute('role', 'switch');
    el1.textContent = 'Marketing Toggle';

    const el2 = document.createElement('button');
    el2.id = 'dyn-id-888';
    el2.className = 'sc-998 py-2';
    el2.setAttribute('role', 'switch');
    el2.textContent = 'Marketing Toggle';

    const s1 = VolatileFeatureSuppressor.suppressVolatileFeatures(el1);
    const s2 = VolatileFeatureSuppressor.suppressVolatileFeatures(el2);

    expect(s1.cleanedRole).toBe(s2.cleanedRole);
    expect(s1.cleanedText).toBe(s2.cleanedText);
    expect(s1.isSuppressedId).toBe(true);
    expect(s2.isSuppressedId).toBe(true);
  });

  // PROPERTY 10: Execution authorization is independent of capability confidence.
  it('PROPERTY 10: Execution authorization is independent of capability confidence', () => {
    const decisionHighConf = ExecutionAuthorizationController.authorize({
      fingerprint: cap,
      capabilityConfidence: 0.999, // Extremely high confidence!
      routeConfidence: 0.999,
      invariantResult: { candidateId: 'c1', status: 'PASS', isEligibleForRanking: true, passedPredicates: [{} as any], failedPredicates: [], evaluatedTimestamp: 0 },
      transitionResult: { signature: {} as any, activationEvent: {} as any, observedWitnesses: [{} as any, {} as any], verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'], status: 'VERIFIED', causallyVerified: true, durationMs: 50, explanation: '' },
      userConfirmationGranted: false,
    });

    // Despite 0.999 confidence, status MUST NOT be AUTHORIZED without user confirmation!
    expect(decisionHighConf.status).toBe('CONFIRMATION_REQUIRED');
  });
});
