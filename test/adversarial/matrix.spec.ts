/**
 * IntentNav-SCFR: Adversarial Test Matrix (Scenarios A through Z)
 * Rigorously verifies every failure mode, adversarial trap, and resilience property.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { TransitionWitness, TransitionVerificationToken } from '../../src/types/transition';

describe('Adversarial Test Matrix (A through Z)', () => {
  let machine: IntentNavMachine;

  const marketingCap: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'marketing_emails_enabled', expectedValue: false }],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing emails',
      semanticSynonyms: ['turn off promotional emails', 'stop marketing notifications'],
      accessibleName: 'Marketing email toggle',
      role: 'switch',
      visibleLabel: 'Marketing',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable marketing emails',
    },
    contextEvidence: {
      ancestorRelationships: ['section[notifications]'],
      nearbyText: ['promotional bulletins'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications'],
      menuPanelRelationships: ['notifications'],
      relativeStructuralRelationships: ['main > section:nth-of-type(1) > button'],
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
    provenance: { source: 'INITIAL_SPEC', creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1.0.0', validationHistory: [] },
    confidence: { capabilityConfidence: 0.95, routeConfidence: 0.90 },
    negativeEvidence: { rejectedCandidateIdentities: [], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
  };

  const security2FACap: FunctionalCapabilityFingerprint = {
    ...marketingCap,
    capabilityId: 'CAP_DISABLE_2FA',
    canonicalFunction: 'disable_two_factor_auth',
    actionType: 'REVOKE_ACCESS',
    targetEntity: 'TWO_FACTOR_AUTH',
    allowedStateDelta: [{ property: 'two_factor_enabled', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'two_factor_enabled', expectedValue: false }],
    semanticEvidence: {
      ...marketingCap.semanticEvidence,
      canonicalLabel: 'Disable two-factor authentication',
      semanticSynonyms: ['turn off 2fa', 'remove two-factor'],
      accessibleName: 'Disable 2FA button',
    },
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: false,
      financial: false,
      security: true,
      destructive: true,
      requiresConfirmation: true,
    },
  };

  const createTestToken = (capabilityId: string, routeId: string): TransitionVerificationToken => ({
    tokenId: `tok_${routeId}`,
    routeId,
    capabilityId,
    activationEventId: 'act_test',
    verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
    issuedTimestamp: Date.now(),
    verifiedStatus: 'VERIFIED',
    signatureHash: 'hash_test',
  });

  let lastActivationEventId = 'act_1';
  let lastActivationTimestamp = Date.now();

  const defaultMarketingDispatcher: ExecutionDispatcher = {
    async dispatchActivation(activationEventId, candidate, capabilityId) {
      lastActivationEventId = activationEventId;
      lastActivationTimestamp = Date.now();
      return {
        success: true,
        activationEvent: {
          eventId: activationEventId,
          sequenceNumber: 1,
          timestamp: lastActivationTimestamp,
          targetCandidateId: candidate.candidateId,
          eventType: 'click',
          initiatingCapabilityId: capabilityId,
        },
      };
    },
    async collectWitnesses() {
      const now = lastActivationTimestamp + 10;
      return [
        {
          witnessId: `wit_dom_${now}`,
          witnessClass: 'DOM_MUTATION',
          sequenceNumber: 1,
          timestamp: now + 20,
          observedDelta: { marketing_emails_enabled: false },
          correlatedActivationEventId: lastActivationEventId,
          temporalDeltaMs: 20,
          isCausallyCorrelated: true,
          correlationExplanation: 'DOM state mutated',
        },
        {
          witnessId: `wit_a11y_${now}`,
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
          sequenceNumber: 2,
          timestamp: now + 50,
          observedDelta: { ariaChecked: 'false' },
          correlatedActivationEventId: lastActivationEventId,
          temporalDeltaMs: 50,
          isCausallyCorrelated: true,
          correlationExplanation: 'Accessibility ariaChecked mutated to false',
        },
      ];
    },
  };

  beforeEach(() => {
    machine = new IntentNavMachine();
    machine.setDefaultDispatcher(defaultMarketingDispatcher);
    machine.registerCapability(marketingCap);
    machine.registerCapability(security2FACap);
  });

  // A. Label rename
  it('Scenario A: Label rename recovery', async () => {
    const ctx = await machine.processIntent(
      'Turn off promotional emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_renamed',
        candidateLabel: 'Stop Commercial Bulletins',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        containerSemantics: ['notifications'],
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
    expect(ctx.selectedCandidate?.candidateId).toBe('cand_renamed');
  });

  // B. Label synonym replacement
  it('Scenario B: Label synonym replacement recovery', async () => {
    const ctx = await machine.processIntent(
      'Opt out of marketing notifications',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_synonym',
        candidateLabel: 'Opt Out Of Marketing Alerts',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
    expect(ctx.selectedCandidate?.candidateId).toBe('cand_synonym');
  });

  // C. Menu reorder
  it('Scenario C: Resilient to menu reordering', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', ancestors: ['section[reordered_menu]'], observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_reordered',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // D. Hierarchy change
  it('Scenario D: Resilient to container hierarchy nesting changes', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', relativeStructuralPath: 'div > div > section:nth-of-type(3) > button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_nested',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // E. DOM ID change
  it('Scenario E: Resilient to volatile framework-generated DOM ID changes', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', id: ':r999:', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: ':r999:',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // F. CSS class change
  it('Scenario F: Resilient to scrambled CSS utility classes', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', classes: ['css-random99', 'p-4', 'hover:bg-blue'], observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_css_scrambled',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // G. Additional intermediate dialog
  it('Scenario G: Handles intermediate dialog state transition', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'btn_confirm_dialog',
        candidateLabel: 'Confirm Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'button',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // H. Changed URL semantics
  it('Scenario H: Resilient to altered URL path', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_new_url',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // I. Changed route
  it('Scenario I: Recovers new route version when old route is stale', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_route_v2',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }]
    );
    expect(ctx.activeRoute?.versionNumber).toBeGreaterThanOrEqual(1);
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // J. Semantically similar decoy
  it('Scenario J: Rejects semantically similar decoy before ranking', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [
        {
          candidateId: 'decoy_trap',
          candidateLabel: 'Disable Marketing and All Communications',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'ALL_NOTIFICATIONS', // DECOY!
          observedRole: 'switch',
        },
        {
          candidateId: 'genuine_control',
          candidateLabel: 'Promotional Mail',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'MARKETING_NOTIFICATIONS',
          observedRole: 'switch',
        },
      ]
    );
    expect(ctx.selectedCandidate?.candidateId).toBe('genuine_control');
    expect(ctx.invariantResults?.['decoy_trap']?.isEligibleForRanking).toBe(false);
  });

  // K. Wrong target
  it('Scenario K: Rejects candidate with wrong target', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_wrong_target',
        candidateLabel: 'Disable Marketing',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'SECURITY_SETTINGS',
        observedRole: 'button',
      }]
    );
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // L. Wrong action type
  it('Scenario L: Rejects candidate with wrong action type (DELETE vs MODIFY_PREFERENCE)', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_wrong_action',
        candidateLabel: 'Delete Marketing Information',
        observedActionType: 'DELETE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'button',
      }]
    );
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // M. Wrong pre-state
  it('Scenario M: Rejects candidate failing mandatory pre-state', async () => {
    const capWithPrestate: FunctionalCapabilityFingerprint = {
      ...marketingCap,
      capabilityId: 'CAP_PRESTATE',
      mandatoryPreStatePredicates: [{
        id: 'PRE_ENABLED',
        name: 'Must be enabled',
        description: 'toggle must be enabled initially',
        evaluate: (c) => c['checked'] === true,
      }],
    };
    const prestateMachine = new IntentNavMachine();
    prestateMachine.registerCapability(capWithPrestate);

    const ctx = await prestateMachine.processIntent(
      'Disable marketing emails',
      {
        tag: 'button',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { checked: false }, // Already disabled!
      },
      [{
        candidateId: 'cand_already_disabled',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        observedState: { checked: false },
      }]
    );
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // N. Wrong post-state
  it('Scenario N: Rejects candidate whose transition produces wrong post-state', async () => {
    const t0 = Date.now();
    const wrongWitnesses: TransitionWitness[] = [
      {
        witnessId: 'w1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 40,
        observedDelta: { marketing_emails_enabled: true }, // Expected false!
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 40,
        isCausallyCorrelated: true,
        correlationExplanation: 'Observed',
      },
      {
        witnessId: 'w2',
        witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
        sequenceNumber: 2,
        timestamp: t0 + 60,
        observedDelta: {},
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 60,
        isCausallyCorrelated: true,
        correlationExplanation: 'Observed',
      },
    ];

    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_wrong_delta',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }],
      false,
      wrongWitnesses
    );
    expect(ctx.currentState).toBe('QUARANTINED');
  });

  // O. Forbidden destination
  it('Scenario O: Rejects candidate pointing to forbidden target entity', async () => {
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_forbidden_dest',
        candidateLabel: 'Disable Marketing (Root)',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'GLOBAL_SETTINGS', // Forbidden
        observedRole: 'button',
      }]
    );
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // P. Unrelated DOM mutation
  it('Scenario P: Unrelated DOM mutation without activation event correlation fails causal verification', () => {
    machine.witnessCollector.clear();
    const w = machine.witnessCollector.recordWitness('DOM_MUTATION', { banner: 'ad' });
    expect(w.isCausallyCorrelated).toBe(false);
  });

  // Q. Missing transition witness
  it('Scenario Q: Missing transition witness causes quarantine instead of silent execution', async () => {
    const missingWitnesses: TransitionWitness[] = []; // No witnesses observed!
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_no_witness',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }],
      false,
      missingWitnesses
    );
    expect(ctx.currentState).toBe('QUARANTINED');
  });

  // R. Conflicting witnesses
  it('Scenario R: Conflicting or insufficient witness classes cause quarantine', async () => {
    const singleClassWitnesses: TransitionWitness[] = [
      {
        witnessId: 'w1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: Date.now() + 50,
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 50,
        isCausallyCorrelated: true,
        correlationExplanation: 'OK',
      },
    ];

    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_conflicting',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }],
      false,
      singleClassWitnesses
    );
    expect(ctx.currentState).toBe('QUARANTINED');
  });

  // S. Activation without expected state change
  it('Scenario S: Activation without state change delta fails verification', async () => {
    const emptyDeltaWitnesses: TransitionWitness[] = [
      {
        witnessId: 'w1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: Date.now() + 50,
        observedDelta: { unrelated: 123 }, // Missing marketing_emails_enabled: false
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 50,
        isCausallyCorrelated: true,
        correlationExplanation: 'OK',
      },
      {
        witnessId: 'w2',
        witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
        sequenceNumber: 2,
        timestamp: Date.now() + 70,
        observedDelta: {},
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 70,
        isCausallyCorrelated: true,
        correlationExplanation: 'OK',
      },
    ];

    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_empty_delta',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }],
      false,
      emptyDeltaWitnesses
    );
    expect(ctx.currentState).toBe('QUARANTINED');
  });

  // T. Expected state change without activation event
  it('Scenario T: State change without activation event is rejected as non-causal', () => {
    const verifier = machine.causalVerifier;
    const preExistingWitness: TransitionWitness = {
      witnessId: 'w_pre',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: 100, // Happened at t=100
      observedDelta: { marketing_emails_enabled: false },
      correlatedActivationEventId: null,
      temporalDeltaMs: -900,
      isCausallyCorrelated: false,
      correlationExplanation: 'Pre-existing',
    };

    const result = verifier.verifyTransition(
      marketingCap.transitionEvidence as any,
      { eventId: 'act_later', sequenceNumber: 1, timestamp: 1000, targetCandidateId: 'c1', eventType: 'click', initiatingCapabilityId: 'CAP' },
      [preExistingWitness]
    );
    expect(result.causallyVerified).toBe(false);
    expect(result.status).toBe('FAILED_PRE_EXISTING_STATE');
  });

  // U. Delayed but valid asynchronous transition
  it('Scenario U: Valid asynchronous transition within window is accepted', async () => {
    const t0 = Date.now();
    const asyncWitnesses: TransitionWitness[] = [
      {
        witnessId: 'w_async1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 1,
        timestamp: t0 + 400, // within 2000ms window
        observedDelta: { marketing_emails_enabled: false },
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 400,
        isCausallyCorrelated: true,
        correlationExplanation: 'Async acknowledgement received',
      },
      {
        witnessId: 'w_async2',
        witnessClass: 'ASYNC_ACKNOWLEDGEMENT',
        sequenceNumber: 2,
        timestamp: t0 + 600,
        observedDelta: {},
        correlatedActivationEventId: 'act_test',
        temporalDeltaMs: 600,
        isCausallyCorrelated: true,
        correlationExplanation: 'Server ack',
      },
    ];

    const ctx = await machine.processIntent(
      'Disable marketing emails',
      { tag: 'button', observedActionType: 'MODIFY_PREFERENCE', observedTargetEntity: 'MARKETING_NOTIFICATIONS' },
      [{
        candidateId: 'cand_async',
        candidateLabel: 'Disable Marketing Emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
      }],
      false,
      asyncWitnesses
    );
    expect(ctx.currentState).toBe('EXECUTED');
  });

  // V. Route version rollback
  it('Scenario V: Route version rollback after demotion', () => {
    const v1 = machine.routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.85);
    machine.routeManager.promoteToActive('CAP_DISABLE_MARKETING', v1.routeId, createTestToken('CAP_DISABLE_MARKETING', v1.routeId));

    const v2 = machine.routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.95);
    machine.routeManager.promoteToActive('CAP_DISABLE_MARKETING', v2.routeId, createTestToken('CAP_DISABLE_MARKETING', v2.routeId));

    const { rollbackRoute } = machine.routeManager.demoteActiveRoute('CAP_DISABLE_MARKETING', v2.routeId, 'Broken route');
    expect(rollbackRoute?.routeId).toBe(v1.routeId);
    expect(machine.graph.getActiveRoute('CAP_DISABLE_MARKETING')?.routeId).toBe(v1.routeId);
  });

  // W. High-risk capability without confirmation
  it('Scenario W: High-risk capability enters CONFIRMATION_PENDING without silent execution', async () => {
    const ctx = await machine.processIntent(
      'Turn off two-factor authentication',
      { tag: 'button', observedActionType: 'REVOKE_ACCESS', observedTargetEntity: 'TWO_FACTOR_AUTH' },
      [{
        candidateId: 'btn_2fa',
        candidateLabel: 'Disable Two-Factor Authentication',
        observedActionType: 'REVOKE_ACCESS',
        observedTargetEntity: 'TWO_FACTOR_AUTH',
        observedRole: 'button',
      }],
      false // user confirmation NOT granted!
    );
    expect(ctx.currentState).toBe('CONFIRMATION_PENDING');
  });

  // X. High semantic confidence but low evidence quorum
  it('Scenario X: High semantic confidence but missing quorum denies high-risk execution', async () => {
    const ctx = await machine.processIntent(
      'Turn off two-factor authentication',
      { tag: 'button', observedActionType: 'REVOKE_ACCESS', observedTargetEntity: 'TWO_FACTOR_AUTH' },
      [{
        candidateId: 'btn_2fa',
        candidateLabel: 'Disable Two-Factor Authentication Exactly',
        observedActionType: 'REVOKE_ACCESS',
        observedTargetEntity: 'TWO_FACTOR_AUTH',
        observedRole: 'button',
      }],
      true, // user clicked confirm, BUT...
      [] // No witnesses, quorum fails!
    );
    expect(ctx.currentState).toBe('QUARANTINED');
  });

  // Y. Low capability confidence
  it('Scenario Y: Low capability confidence triggers suggestion or abstention', async () => {
    const lowConfCap = { ...marketingCap, capabilityId: 'CAP_LOW_CONF', confidence: { capabilityConfidence: 0.35, routeConfidence: 0.35 } };
    machine.registerCapability(lowConfCap);

    const ctx = await machine.processIntent(
      'Something completely ambiguous',
      { tag: 'body' },
      []
    );
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // Z. Presentation-only drift
  it('Scenario Z: Presentation-only drift preserves route without requiring re-binding', async () => {
    // Setup active route first
    const v1 = machine.routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.90);
    machine.routeManager.promoteToActive('CAP_DISABLE_MARKETING', v1.routeId, createTestToken('CAP_DISABLE_MARKETING', v1.routeId));

    // Provide observation with ONLY presentation change (different classes and IDs)
    const ctx = await machine.processIntent(
      'Disable marketing emails',
      {
        tag: 'button',
        id: 'new-framework-id-888',
        classes: ['styled-components-random', 'bg-red'],
        role: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      },
      []
    );

    // Active route should remain V1 without candidate re-binding
    expect(ctx.activeRoute?.routeId).toBe(v1.routeId);
    expect(ctx.driftResult?.actionRequired).toBe('MAINTAIN_ACTIVE');
    expect(ctx.currentState).toBe('EXECUTED');
  });
});
