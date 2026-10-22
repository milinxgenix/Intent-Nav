/**
 * IntentNav-SCFR: Live Five-Dimensional Drift Integration Test Suite
 *
 * Covers all 10 Task D scenarios:
 * 1. Identifier changes while underlying capability remains identical (P-drift only)
 * 2. Structural DOM changes (S-drift triggers route validation)
 * 3. Semantic / accessibility changes (role/aria change triggers rebind recovery)
 * 4. Context or relationship changes (container/ancestor relocation triggers validation)
 * 5. Application-state or transition-condition changes (pre-state change triggers rebind)
 * 6. Localized invalidation: change affects one capability while unrelated capability remains stable
 * 7. Missing or contradictory observation evidence (uncertainty handling / safe abstention)
 * 8. Misleading candidate that fails invariant closure (decoy rejection)
 * 9. Repeated drift and recovery without stale-route execution
 * 10. No silent promotion merely because drift score is low (requires full transition token)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntentNavMachine } from '../../src/core/stateMachine/machine';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../../src/core/capability/catalog';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { TransitionWitness } from '../../src/types/transition';
import { BindingHandle } from '../../src/types/capability';

describe('Live 5D Drift Integration (Task D Scenarios 1–10)', () => {
  let machine: IntentNavMachine;

  beforeEach(async () => {
    machine = new IntentNavMachine();
    await machine.init();
    for (const cap of AUTHORITATIVE_CAPABILITY_CATALOG) {
      machine.registerCapability(cap);
    }
  });

  const createWitnesses = (now: number, actId: string, stateKey: string): TransitionWitness[] => [
    {
      witnessId: `wit_app_${now}`,
      witnessClass: 'APPLICATION_STATE_MUTATION',
      sequenceNumber: 1,
      timestamp: now + 5,
      observedDelta: { [stateKey]: false },
      correlatedActivationEventId: actId,
      temporalDeltaMs: 5,
      isCausallyCorrelated: true,
      correlationExplanation: 'Application state mutated',
    },
    {
      witnessId: `wit_dom_${now}`,
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 2,
      timestamp: now + 10,
      observedDelta: { 'aria-checked': 'false' },
      correlatedActivationEventId: actId,
      temporalDeltaMs: 10,
      isCausallyCorrelated: true,
      correlationExplanation: 'DOM attribute mutated',
    },
  ];

  // 1. Identifier changes while the underlying capability remains the same
  it('1. Identifier changes while underlying capability remains identical -> P drift only, route stays valid', async () => {
    const cap = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;

    // Seed initial active validated route
    const now = Date.now();
    const catalogPath = cap.contextEvidence?.relativeStructuralRelationships?.[0] || 'form > div > label > input[type=checkbox]';
    const handle: BindingHandle = {
      handleId: 'handle_initial_btn',
      tagName: 'button',
      role: 'switch',
      accessibleName: 'Disable marketing emails',
      domStructuralPath: catalogPath,
      elementIndex: 0,
      volatileId: 'btn_marketing_initial',
      volatileClasses: ['btn', 'btn-primary'],
    };
    const initialRoute = machine.routeManager.createProvisionalRoute(
      cap.capabilityId,
      [
        {
          stepIndex: 1,
          fromStateId: 'CURRENT_PAGE',
          toStateId: 'PANEL_MARKETING_NOTIFICATIONS',
          actionDescription: 'Disable marketing emails',
          bindingHandle: handle,
          targetRole: 'switch',
          targetAccessibleName: 'Disable marketing emails',
        },
      ],
      0.95
    );
    const promoToken = machine.tokenAuthenticator.issueToken({
      capabilityId: cap.capabilityId,
      routeId: initialRoute.routeId,
      activationEventId: 'act_initial_01',
      verifiedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'DOM_MUTATION'],
      capabilityFingerprintHash: cap.fingerprintHash,
    });
    machine.routeManager.promoteToActive(cap.capabilityId, initialRoute.routeId, promoToken);

    // Live observation with scrambled volatile ID and classes, but identical functional semantics
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_scrambled_id_99',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: {
        ...handle,
        handleId: 'cand_scrambled_id_99',
        volatileId: 'scrambled_dynamic_hash_abc123',
        volatileClasses: ['scrambled-class-77', 'utility-p4'],
      },
      ancestors: [...(cap.contextEvidence?.ancestorRelationships || [])],
      containerSemantics: [...(cap.contextEvidence?.containerSemantics || [])],
      nearbyText: [...(cap.contextEvidence?.nearbyText || [])],
      domStructuralPath: catalogPath,
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [candidate],
      false,
      createWitnesses(now, 'act_scenario_1', 'marketing_notifications_enabled')
    );

    expect(ctx.driftVector?.presentation).toBeGreaterThan(0.40);
    expect(ctx.driftVector?.capability).toBe(0.0);
    expect(ctx.driftVector?.transition).toBe(0.0);
    expect(ctx.driftResult?.actionRequired).toBe('MAINTAIN_ACTIVE');
    expect(ctx.currentState).toBe('EXECUTED');
    expect(ctx.activeRoute?.status).toBe('ACTIVE_VALIDATED');
  });

  // 2. Structural DOM changes
  it('2. Structural DOM changes -> S drift exceeds threshold, triggers route validation and recovery', async () => {
    const cap = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
    const now = Date.now();

    // Active route expects 'main > section:nth-of-type(1) > button:nth-of-type(1)'
    const handle: BindingHandle = {
      handleId: 'handle_struct_btn',
      tagName: 'button',
      role: 'switch',
      accessibleName: 'Disable marketing emails',
      domStructuralPath: 'main > section:nth-of-type(1) > button:nth-of-type(1)',
      elementIndex: 0,
    };
    const route = machine.routeManager.createProvisionalRoute(
      cap.capabilityId,
      [
        {
          stepIndex: 1,
          fromStateId: 'CURRENT_PAGE',
          toStateId: 'PANEL_MARKETING_NOTIFICATIONS',
          actionDescription: 'Disable marketing emails',
          bindingHandle: handle,
          targetRole: 'switch',
          targetAccessibleName: 'Disable marketing emails',
        },
      ],
      0.95
    );
    const promoToken = machine.tokenAuthenticator.issueToken({
      capabilityId: cap.capabilityId,
      routeId: route.routeId,
      activationEventId: 'act_struct_01',
      verifiedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'DOM_MUTATION'],
      capabilityFingerprintHash: cap.fingerprintHash,
    });
    machine.routeManager.promoteToActive(cap.capabilityId, route.routeId, promoToken);

    // Candidate moved to deep nested modal/wrapper
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_nested_deep',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: {
        ...handle,
        domStructuralPath: 'div.modal > div.wrapper > div.drawer > div.content > div.row > button',
      },
      ancestors: [...(cap.contextEvidence?.ancestorRelationships || [])],
      containerSemantics: [...(cap.contextEvidence?.containerSemantics || [])],
      nearbyText: [...(cap.contextEvidence?.nearbyText || [])],
      domStructuralPath: 'div.modal > div.wrapper > div.drawer > div.content > div.row > button',
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [candidate],
      false,
      createWitnesses(now, 'act_scenario_2', 'marketing_notifications_enabled')
    );

    expect(ctx.driftVector?.structure).toBeGreaterThanOrEqual(0.45);
    expect(ctx.driftResult?.actionRequired).toBe('TRIGGER_VALIDATION');
    expect(ctx.currentState).toBe('EXECUTED');
    // Stale route was demoted and new provisional route promoted with token
    expect(ctx.provisionalRoute).not.toBeNull();
    expect(ctx.activeRoute?.status).toBe('ACTIVE_VALIDATED');
  });

  // 3. Semantic / accessibility changes
  it('3. Semantic/accessibility changes -> Cap drift exceeds threshold, triggers rebind recovery', async () => {
    const cap = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
    const now = Date.now();

    // Active route expects 'switch' role
    const handle: BindingHandle = {
      handleId: 'handle_a11y_btn',
      tagName: 'button',
      role: 'switch',
      accessibleName: 'Disable marketing emails',
      domStructuralPath: 'main > section:nth-of-type(1) > button:nth-of-type(1)',
      elementIndex: 0,
    };
    const route = machine.routeManager.createProvisionalRoute(
      cap.capabilityId,
      [
        {
          stepIndex: 1,
          fromStateId: 'CURRENT_PAGE',
          toStateId: 'PANEL_MARKETING_NOTIFICATIONS',
          actionDescription: 'Disable marketing emails',
          bindingHandle: handle,
          targetRole: 'switch',
          targetAccessibleName: 'Disable marketing emails',
        },
      ],
      0.95
    );
    const promoToken = machine.tokenAuthenticator.issueToken({
      capabilityId: cap.capabilityId,
      routeId: route.routeId,
      activationEventId: 'act_a11y_01',
      verifiedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'DOM_MUTATION'],
      capabilityFingerprintHash: cap.fingerprintHash,
    });
    machine.routeManager.promoteToActive(cap.capabilityId, route.routeId, promoToken);

    // Candidate re-architected with link tag and different target entity
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_semantic_drift',
      candidateLabel: 'View Marketing Campaign Analytics',
      observedActionType: 'VIEW',
      observedTargetEntity: 'ALL_DATA', // Target shift
      observedRole: 'link',
      bindingHandle: {
        handleId: 'cand_semantic_drift',
        tagName: 'a',
        role: 'link',
        accessibleName: 'View Marketing Campaign Analytics',
        domStructuralPath: 'main > section:nth-of-type(1) > a:nth-of-type(1)',
        elementIndex: 0,
      },
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'a' },
      [candidate],
      false,
      createWitnesses(now, 'act_scenario_3', 'marketing_notifications_enabled')
    );

    expect(ctx.driftVector?.capability).toBeGreaterThanOrEqual(0.20);
    expect(ctx.currentState).toBe('ABSTAINED'); // Invariant closure rejects candidate due to incompatible target
  });

  // 4. Context or relationship changes
  it('4. Context or relationship changes -> C drift exceeds threshold, triggers route validation', async () => {
    const cap = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
    const now = Date.now();

    const handle: BindingHandle = {
      handleId: 'handle_ctx_btn',
      tagName: 'button',
      role: 'switch',
      accessibleName: 'Disable marketing emails',
      domStructuralPath: 'main > section:nth-of-type(1) > button:nth-of-type(1)',
      elementIndex: 0,
    };
    const route = machine.routeManager.createProvisionalRoute(
      cap.capabilityId,
      [
        {
          stepIndex: 1,
          fromStateId: 'CURRENT_PAGE',
          toStateId: 'PANEL_MARKETING_NOTIFICATIONS',
          actionDescription: 'Disable marketing emails',
          bindingHandle: handle,
          targetRole: 'switch',
          targetAccessibleName: 'Disable marketing emails',
        },
      ],
      0.95
    );
    const promoToken = machine.tokenAuthenticator.issueToken({
      capabilityId: cap.capabilityId,
      routeId: route.routeId,
      activationEventId: 'act_ctx_01',
      verifiedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'DOM_MUTATION'],
      capabilityFingerprintHash: cap.fingerprintHash,
    });
    machine.routeManager.promoteToActive(cap.capabilityId, route.routeId, promoToken);

    // Element relocated into new sub-panel with different section context but preserving required 'marketing' container
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_relocated_ctx',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: handle,
      ancestors: ['section[marketing]', 'div.invoices', 'main[account]'],
      containerSemantics: ['marketing', 'invoices', 'payment_history', 'billing_alerts'],
      nearbyText: ['Invoice #4992', 'Receipt download', 'Payment method'],
      domStructuralPath: 'main > section:nth-of-type(1) > button:nth-of-type(1)',
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [candidate],
      false,
      createWitnesses(now, 'act_scenario_4', 'marketing_notifications_enabled')
    );

    expect(ctx.driftVector?.context).toBeGreaterThanOrEqual(0.40);
    expect(ctx.driftResult?.actionRequired).toBe('TRIGGER_VALIDATION');
    expect(ctx.currentState).toBe('EXECUTED');
    expect(ctx.activeRoute?.status).toBe('ACTIVE_VALIDATED');
  });

  // 5. Application-state or transition-condition changes
  it('5. Application-state changes -> T drift detected when pre-state predicate is unmet', async () => {
    const now = Date.now();

    // Candidate has pre-state where marketing_notifications_enabled is already FALSE
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_state_drift',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: {
        handleId: 'cand_state_drift',
        tagName: 'button',
        role: 'switch',
        accessibleName: 'Disable marketing emails',
        domStructuralPath: 'button',
        elementIndex: 0,
      },
      observedState: { marketing_notifications_enabled: false }, // Violates mandatory pre-state
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button', observedPreState: { marketing_notifications_enabled: false } },
      [candidate],
      false,
      createWitnesses(now, 'act_scenario_5', 'marketing_notifications_enabled')
    );

    expect(ctx.driftVector?.transition).toBeGreaterThan(0.0);
    expect(ctx.currentState).toBe('ABSTAINED'); // Hard invariant closure gate rejects
  });

  // 6. Localized Invalidation: One capability affected, unrelated capability remains stable
  it('6. Localized invalidation -> Drift on CAP_A demotes only CAP_A route, leaving CAP_B active', async () => {
    const capMarketing = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
    const cap2FA = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_2FA')!;
    const now = Date.now();

    // 1. Establish active routes for BOTH capabilities
    const routeM = machine.routeManager.createProvisionalRoute(
      capMarketing.capabilityId,
      [
        {
          stepIndex: 1,
          fromStateId: 'CURRENT_PAGE',
          toStateId: 'PANEL_MARKETING',
          actionDescription: 'Disable marketing emails',
          bindingHandle: { handleId: 'h_m', tagName: 'button', role: 'switch', accessibleName: 'Disable marketing', domStructuralPath: 'button#m', elementIndex: 0 },
        },
      ],
      0.95
    );
    const tokM = machine.tokenAuthenticator.issueToken({
      capabilityId: capMarketing.capabilityId,
      routeId: routeM.routeId,
      activationEventId: 'act_m_01',
      verifiedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'DOM_MUTATION'],
      capabilityFingerprintHash: capMarketing.fingerprintHash,
    });
    machine.routeManager.promoteToActive(capMarketing.capabilityId, routeM.routeId, tokM);

    const route2FA = machine.routeManager.createProvisionalRoute(
      cap2FA.capabilityId,
      [
        {
          stepIndex: 1,
          fromStateId: 'CURRENT_PAGE',
          toStateId: 'PANEL_SECURITY',
          actionDescription: 'Turn off 2FA',
          bindingHandle: { handleId: 'h_2fa', tagName: 'button', role: 'button', accessibleName: 'Disable 2FA', domStructuralPath: 'button#2fa', elementIndex: 1 },
        },
      ],
      0.95
    );
    const tok2FA = machine.tokenAuthenticator.issueToken({
      capabilityId: cap2FA.capabilityId,
      routeId: route2FA.routeId,
      activationEventId: 'act_2fa_01',
      verifiedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'DOM_MUTATION'],
      capabilityFingerprintHash: cap2FA.fingerprintHash,
    });
    machine.routeManager.promoteToActive(cap2FA.capabilityId, route2FA.routeId, tok2FA);

    expect(machine.graph.getActiveRoute(capMarketing.capabilityId)?.routeId).toBe(routeM.routeId);
    expect(machine.graph.getActiveRoute(cap2FA.capabilityId)?.routeId).toBe(route2FA.routeId);

    // 2. Trigger high drift on CAP_DISABLE_MARKETING
    const driftedCandidateM: CandidateEvaluationContext = {
      candidateId: 'cand_m_drifted',
      candidateLabel: 'Disable marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: {
        handleId: 'cand_m_drifted',
        tagName: 'button',
        role: 'switch',
        accessibleName: 'Disable marketing emails',
        domStructuralPath: 'div.deep-wrapper > button',
        elementIndex: 0,
      },
      domStructuralPath: 'div.deep-wrapper > button',
      observedState: { marketing_notifications_enabled: true },
    };

    await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [driftedCandidateM],
      false,
      createWitnesses(now, 'act_loc_01', 'marketing_notifications_enabled')
    );

    // CAP_DISABLE_MARKETING route was invalidated & re-promoted to a new provisional route
    // But CAP_DISABLE_2FA route MUST REMAIN STRICTLY ACTIVE AND UNTOUCHED
    const activeRoute2FA = machine.graph.getActiveRoute(cap2FA.capabilityId);
    expect(activeRoute2FA).not.toBeNull();
    expect(activeRoute2FA?.routeId).toBe(route2FA.routeId);
    expect(activeRoute2FA?.status).toBe('ACTIVE_VALIDATED');
  });

  // 7. Missing or contradictory observation evidence
  it('7. Missing or contradictory observation evidence -> Quarantines route or safely abstains', async () => {
    // Contradictory observation: Extreme capability drift (action: DELETE, target: ALL_DATA, role: input)
    const contradictoryCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_wipe_all',
      candidateLabel: 'Purge Entire Account Data',
      observedActionType: 'DELETE',
      observedTargetEntity: 'ALL_DATA',
      observedRole: 'input',
      bindingHandle: {
        handleId: 'cand_wipe_all',
        tagName: 'input',
        role: 'input',
        accessibleName: 'Purge Entire Account Data',
        domStructuralPath: 'input#purge',
        elementIndex: 0,
      },
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'input', observedActionType: 'DELETE', observedTargetEntity: 'ALL_DATA' },
      [contradictoryCandidate],
      false
    );

    expect(ctx.driftVector?.capability).toBeGreaterThanOrEqual(0.80);
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // 8. Misleading candidate that must fail invariant closure
  it('8. Misleading candidate -> High semantic similarity label but fails invariant closure gate', async () => {
    // Decoy candidate: Identical label but missing pre-state predicate and wrong target
    const decoyCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_decoy_marketing',
      candidateLabel: 'Disable Marketing Emails',
      observedActionType: 'VIEW',
      observedTargetEntity: 'ALL_NOTIFICATIONS',
      observedRole: 'link',
      bindingHandle: {
        handleId: 'cand_decoy_marketing',
        tagName: 'a',
        role: 'link',
        accessibleName: 'Disable Marketing Emails',
        domStructuralPath: 'a#decoy',
        elementIndex: 0,
      },
      observedState: { marketing_notifications_enabled: false }, // Fails PRE_CHECKED
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'a' },
      [decoyCandidate],
      false
    );

    expect(ctx.invariantResults?.[decoyCandidate.candidateId]?.status).not.toBe('PASS');
    expect(ctx.currentState).toBe('ABSTAINED');
  });

  // 9. Repeated drift and recovery without stale-route execution
  it('9. Repeated drift and recovery -> Multiple successive mutations each invalidate and re-bind safely', async () => {
    const cap = machine.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_DISABLE_MARKETING')!;
    let now = Date.now();

    // Step 1: Initial execution under Mutation 1
    const cand1: CandidateEvaluationContext = {
      candidateId: 'cand_step1',
      candidateLabel: 'Disable Marketing Emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: { handleId: 'h1', tagName: 'button', role: 'switch', accessibleName: 'Disable Marketing', domStructuralPath: 'div#v1 > button', elementIndex: 0 },
      ancestors: [...(cap.contextEvidence?.ancestorRelationships || [])],
      containerSemantics: [...(cap.contextEvidence?.containerSemantics || [])],
      nearbyText: [...(cap.contextEvidence?.nearbyText || [])],
      observedState: { marketing_notifications_enabled: true },
    };
    const ctx1 = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [cand1],
      false,
      createWitnesses(now, 'act_rep_1', 'marketing_notifications_enabled')
    );
    expect(ctx1.currentState).toBe('EXECUTED');
    const routeV1 = ctx1.activeRoute?.routeId;

    // Step 2: Interface drifts to Mutation 2 (different structure and classes)
    now += 500;
    const cand2: CandidateEvaluationContext = {
      candidateId: 'cand_step2',
      candidateLabel: 'Disable Marketing Emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: { handleId: 'h2', tagName: 'button', role: 'switch', accessibleName: 'Disable Marketing', domStructuralPath: 'div#v2_container > section > button', elementIndex: 0 },
      ancestors: [...(cap.contextEvidence?.ancestorRelationships || [])],
      containerSemantics: [...(cap.contextEvidence?.containerSemantics || [])],
      nearbyText: [...(cap.contextEvidence?.nearbyText || [])],
      domStructuralPath: 'div#v2_container > section > button',
      observedState: { marketing_notifications_enabled: true },
    };
    const ctx2 = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [cand2],
      false,
      createWitnesses(now, 'act_rep_2', 'marketing_notifications_enabled')
    );
    expect(ctx2.currentState).toBe('EXECUTED');
    const routeV2 = ctx2.activeRoute?.routeId;
    expect(routeV2).not.toBe(routeV1);

    // Stale route v1 must be DEMOTED
    const node = machine.graph.getCapability(cap.capabilityId)!;
    expect(node.routeVersions[routeV1!]?.status).toBe('DEMOTED');
    expect(node.routeVersions[routeV2!]?.status).toBe('ACTIVE_VALIDATED');
  });

  // 10. No silent promotion merely because drift score is low
  it('10. No silent promotion merely because drift score is low -> Promotion strictly requires valid token', async () => {
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_zero_drift',
      candidateLabel: 'Disable Marketing Emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'switch',
      bindingHandle: { handleId: 'h_zero', tagName: 'button', role: 'switch', accessibleName: 'Disable Marketing Emails', domStructuralPath: 'button', elementIndex: 0 },
      ancestors: ['section[Marketing Preferences]', 'form#notifications'],
      containerSemantics: ['notifications', 'marketing'],
      nearbyText: ['Receive promotional emails about special offers and deals'],
      observedState: { marketing_notifications_enabled: true },
    };

    // Execute with corrupted promotion token option
    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button' },
      [candidate],
      false,
      createWitnesses(Date.now(), 'act_corrupt_promo', 'marketing_notifications_enabled'),
      { corruptPromotionToken: true }
    );

    // Even though drift is 0.0 across all dimensions, route CANNOT be promoted
    expect(ctx.currentState).toBe('QUARANTINED');
    expect(ctx.promotionTokenValid).toBe(false);
    expect(ctx.promotionDecision?.promoted).toBe(false);
    expect(ctx.activeRoute?.status).not.toBe('ACTIVE_VALIDATED');
  });

  // 11. DriftRecoveryMetrics direct measurement under candidate rebind recovery
  it('11. DriftRecoveryMetrics directly measures inspected nodes, evaluations, invalidations, and monotonic latency', async () => {
    const candidate: CandidateEvaluationContext = {
      candidateId: 'cand_metrics_test',
      candidateLabel: 'Turn off marketing emails',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedRole: 'button',
      bindingHandle: { handleId: 'h_metrics', tagName: 'button', role: 'button', accessibleName: 'Turn off marketing emails', domStructuralPath: 'main > form > button', elementIndex: 0 },
      ancestors: ['main', 'form'],
      containerSemantics: ['notifications', 'marketing'],
      nearbyText: ['Marketing preferences and newsletters'],
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      {
        tag: 'button',
        role: 'button',
        classes: ['btn', 'btn-primary'],
        containerSemantics: ['notifications', 'marketing'],
      },
      [candidate],
      false,
      createWitnesses(Date.now(), 'act_metrics', 'marketing_notifications_enabled')
    );

    expect(ctx.driftRecoveryMetrics).toBeDefined();
    const metrics = ctx.driftRecoveryMetrics!;
    expect(metrics.inspectedCandidatesCount).toBe(1);
    expect(metrics.inspectedNodesCount).toBe(1);
    expect(metrics.candidateEvaluationsCount).toBe(1);
    expect(metrics.fingerprintComputationsCount).toBeGreaterThanOrEqual(0);
    expect(metrics.unnecessarilyInvalidatedCount).toBe(0);
    expect(metrics.recoveryLatencyMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(metrics.recoveryLatencyMs)).toBe(true);
    expect(metrics.abstentionsCount).toBe(0);
    expect(metrics.staleExecutionAttemptsAvoided).toBe(0); // Proactive demotion without targeted execution attempt = 0
  });

  // 12. DriftRecoveryMetrics tracking under contradictory abstention
  it('12. DriftRecoveryMetrics correctly records abstention on contradictory functional drift', async () => {
    const decoyCandidate: CandidateEvaluationContext = {
      candidateId: 'cand_contradictory_test',
      candidateLabel: 'Delete All Account Data',
      observedActionType: 'DELETE',
      observedTargetEntity: 'ALL_USER_DATA',
      observedRole: 'button',
      bindingHandle: { handleId: 'h_contradict', tagName: 'button', role: 'button', accessibleName: 'Delete All Account Data', domStructuralPath: 'div > button', elementIndex: 0 },
      ancestors: ['div.danger-zone'],
      containerSemantics: ['danger', 'destructive'],
      nearbyText: ['Permanently delete everything'],
      observedState: { marketing_notifications_enabled: true },
    };

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      {
        tag: 'button',
        role: 'button',
        observedActionType: 'DELETE',
        observedTargetEntity: 'ALL_USER_DATA',
        containerSemantics: ['danger', 'destructive'],
      },
      [decoyCandidate]
    );

    expect(ctx.currentState).toBe('ABSTAINED');
    expect(ctx.driftRecoveryMetrics).toBeDefined();
    const metrics = ctx.driftRecoveryMetrics!;
    expect(metrics.abstentionsCount).toBe(1);
    expect(metrics.unnecessarilyInvalidatedCount).toBe(0);
    expect(metrics.candidateEvaluationsCount).toBe(1); // 1 candidate evaluated and rejected by invariant closure
    expect(metrics.recoveryLatencyMs).toBeGreaterThanOrEqual(0);
  });

  // 14. DriftRecoveryMetrics under immediate quarantine (both capability and transition drift >= 0.90)
  it('14. DriftRecoveryMetrics records 0 candidate evaluations when immediate quarantine aborts recovery', async () => {
    const extremeDecoy: CandidateEvaluationContext = {
      candidateId: 'cand_extreme_decoy',
      candidateLabel: 'Purge Entire Database',
      observedActionType: 'DELETE',
      observedTargetEntity: 'ALL_DATA',
      observedRole: 'input',
      bindingHandle: { handleId: 'h_extreme', tagName: 'input', role: 'input', accessibleName: 'Purge Entire Database', domStructuralPath: 'div > input', elementIndex: 0 },
      observedState: { database_purged: true },
    };

    // Extreme concurrent capability and transition drift (both >= 0.90)
    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      {
        tag: 'input',
        role: 'input',
        observedActionType: 'DELETE',
        observedTargetEntity: 'ALL_DATA',
        observedPreState: { database_purged: true, state_destroyed: true, unrecoverable: true },
        observedStateDelta: { database_purged: true },
        observedPostState: { database_purged: true },
        observedActivationEventType: 'KEY_ENTER', // wrong activation
        observedWitnessClasses: ['CONSOLE_MUTATION' as any],
      },
      [extremeDecoy]
    );

    expect(ctx.currentState).toBe('ABSTAINED');
    const m = ctx.driftRecoveryMetrics!;
    expect(m.abstentionsCount).toBe(1);
    expect(m.candidateEvaluationsCount).toBe(0); // Recovery aborted before candidate evaluation
  });

  // 13. Direct measurement verification: Metrics cannot be hardcoded constants or proxies
  it('13. Metrics directly scale with actual evaluated operations and operational state', async () => {
    // A. Candidate evaluations scale with candidate array size
    const candidates: CandidateEvaluationContext[] = [
      {
        candidateId: 'cand_multi_1',
        candidateLabel: 'Opt out of marketing bulletins',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'button',
        bindingHandle: { handleId: 'h_1', tagName: 'button', role: 'button', accessibleName: 'Opt out of marketing bulletins', domStructuralPath: 'main > button:nth-child(1)', elementIndex: 0 },
        ancestors: ['main'],
        containerSemantics: ['marketing'],
        nearbyText: ['bulletins'],
        observedState: { marketing_notifications_enabled: true },
      },
      {
        candidateId: 'cand_multi_2',
        candidateLabel: 'Stop all promotional emails',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'button',
        bindingHandle: { handleId: 'h_2', tagName: 'button', role: 'button', accessibleName: 'Stop all promotional emails', domStructuralPath: 'main > button:nth-child(2)', elementIndex: 1 },
        ancestors: ['main'],
        containerSemantics: ['marketing'],
        nearbyText: ['promotions'],
        observedState: { marketing_notifications_enabled: true },
      },
      {
        candidateId: 'cand_multi_3',
        candidateLabel: 'Unsubscribe from alerts',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'button',
        bindingHandle: { handleId: 'h_3', tagName: 'button', role: 'button', accessibleName: 'Unsubscribe from alerts', domStructuralPath: 'main > button:nth-child(3)', elementIndex: 2 },
        ancestors: ['main'],
        containerSemantics: ['marketing'],
        nearbyText: ['alerts'],
        observedState: { marketing_notifications_enabled: true },
      },
    ];

    const ctx = await machine.processIntent(
      'Turn off marketing emails',
      { tag: 'button', role: 'button' },
      candidates,
      false,
      createWitnesses(Date.now(), 'act_multi', 'marketing_notifications_enabled')
    );

    const m = ctx.driftRecoveryMetrics!;
    expect(m.inspectedCandidatesCount).toBe(3);
    expect(m.inspectedNodesCount).toBe(3);
    expect(m.candidateEvaluationsCount).toBe(3); // Exactly 3 evaluations at candidate evaluation site

    // B. Operational staleExecutionAttemptsAvoided is 1 only when an explicit attempt targets the demoted route
    // First, establish an active route
    const cap = machine.graph.getCapability('CAP_DISABLE_MARKETING')!;
    const activeRouteId = cap.activeRouteId!;
    expect(activeRouteId).toBeDefined();

    // Now execute with high drift causing demotion, while requesting execution of the stale route
    const ctxStale = await machine.processIntent(
      'Turn off marketing emails',
      {
        tag: 'div',
        relativeStructuralPath: 'completely > shifted > hierarchy > modal > div',
      },
      candidates,
      false,
      createWitnesses(Date.now(), 'act_stale', 'marketing_notifications_enabled'),
      { targetRouteId: activeRouteId } // Targeted execution of the stale route
    );

    expect(ctxStale.driftRecoveryMetrics?.staleExecutionAttemptsAvoided).toBe(1);
    expect(ctxStale.driftRecoveryMetrics?.invalidatedCapabilitiesCount).toBe(1);
    expect(ctxStale.driftRecoveryMetrics?.unnecessarilyInvalidatedCount).toBe(0);
  });
});
