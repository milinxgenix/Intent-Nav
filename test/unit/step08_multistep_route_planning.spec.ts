/**
 * IntentNav-SCFR: Step 8 — Multi-Step Route Planning Unit Tests
 *
 * Verifies:
 * 1. Construction and planning of ordered multi-step transition routes.
 * 2. Intermediate precondition and postcondition evaluation.
 * 3. Immediate halt upon intermediate transition failure (preventing downstream execution).
 * 4. Stale edge filtering (demoted/quarantined edges).
 * 5. Forbidden state avoidance.
 * 6. Cycle detection and bounded search termination.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { MultiStepRoutePlanner } from '../../src/core/graph/planner';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { createFunctionalCapability } from '../../src/core/capability/catalog';

describe('Step 8: Genuine Multi-Step Route Planning Engine', () => {
  let graph: CapabilityGraphEngine;
  let planner: MultiStepRoutePlanner;

  beforeEach(() => {
    graph = new CapabilityGraphEngine();
    planner = new MultiStepRoutePlanner(graph);

    // Register test interface states
    graph.registerInterfaceState({
      stateId: 'STATE_HOME',
      stateType: 'PAGE',
      urlPattern: '/home',
      domStructuralHash: 'hash_home',
      semanticLandmarks: ['main', 'nav'],
      activeModalsOrDialogs: [],
      activeTabs: [],
      timestamp: Date.now(),
    });

    graph.registerInterfaceState({
      stateId: 'STATE_SETTINGS_MODAL',
      stateType: 'MODAL',
      urlPattern: '/home#settings',
      domStructuralHash: 'hash_settings',
      semanticLandmarks: ['dialog[Settings]'],
      activeModalsOrDialogs: ['Settings'],
      activeTabs: [],
      timestamp: Date.now(),
    });

    graph.registerInterfaceState({
      stateId: 'STATE_NOTIFICATIONS_TAB',
      stateType: 'TAB',
      urlPattern: '/home#settings/notifications',
      domStructuralHash: 'hash_notifications',
      semanticLandmarks: ['dialog[Settings]', 'tab[Notifications]'],
      activeModalsOrDialogs: ['Settings'],
      activeTabs: ['Notifications'],
      timestamp: Date.now(),
    });

    graph.registerCapability('CAP_DISABLE_MARKETING', 'disable_marketing_notifications');

    // Add edges forming a 2-step route: HOME -> SETTINGS_MODAL -> NOTIFICATIONS_TAB -> CAP_DISABLE_MARKETING
    graph.addEdge({
      id: 'edge_home_to_settings',
      sourceNodeId: 'STATE_HOME',
      targetNodeId: 'STATE_SETTINGS_MODAL',
      edgeType: 'INTERACT',
      actionRequired: 'Click Settings Gear icon',
      weight: 1.0,
      validationStatus: 'ACTIVE_VALIDATED',
    });

    graph.addEdge({
      id: 'edge_settings_to_notifications',
      sourceNodeId: 'STATE_SETTINGS_MODAL',
      targetNodeId: 'STATE_NOTIFICATIONS_TAB',
      edgeType: 'INTERACT',
      actionRequired: 'Click Notifications Tab',
      weight: 1.0,
      validationStatus: 'ACTIVE_VALIDATED',
    });

    graph.addEdge({
      id: 'edge_notifications_exposes_cap',
      sourceNodeId: 'STATE_NOTIFICATIONS_TAB',
      targetNodeId: 'CAP_DISABLE_MARKETING',
      edgeType: 'EXPOSES_CAPABILITY',
      actionRequired: 'Toggle Marketing Switch',
      weight: 1.0,
      validationStatus: 'ACTIVE_VALIDATED',
    });
  });

  it('successfully plans an ordered multi-step route across sequential transitions', () => {
    const result = planner.planRoute({
      initialStateId: 'STATE_HOME',
      targetCapabilityId: 'CAP_DISABLE_MARKETING',
      maxDepth: 5,
    });

    expect(result.success).toBe(true);
    expect(result.route).toBeDefined();
    expect(result.route?.steps.length).toBe(2);

    const step1 = result.route?.steps[0]!;
    expect(step1.stepIndex).toBe(1);
    expect(step1.fromStateId).toBe('STATE_HOME');
    expect(step1.toStateId).toBe('STATE_SETTINGS_MODAL');

    const step2 = result.route?.steps[1]!;
    expect(step2.stepIndex).toBe(2);
    expect(step2.fromStateId).toBe('STATE_SETTINGS_MODAL');
    expect(step2.toStateId).toBe('STATE_NOTIFICATIONS_TAB');
  });

  it('filters out stale or demoted edges during planning', () => {
    // Demote the intermediate edge
    graph.addEdge({
      id: 'edge_settings_to_notifications',
      sourceNodeId: 'STATE_SETTINGS_MODAL',
      targetNodeId: 'STATE_NOTIFICATIONS_TAB',
      edgeType: 'INTERACT',
      actionRequired: 'Click Notifications Tab',
      weight: 1.0,
      validationStatus: 'DEMOTED', // STALE / INVALIDATED
    });

    const result = planner.planRoute({
      initialStateId: 'STATE_HOME',
      targetCapabilityId: 'CAP_DISABLE_MARKETING',
    });

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('NO_PATH');
  });

  it('avoids paths passing through forbidden states', () => {
    const result = planner.planRoute({
      initialStateId: 'STATE_HOME',
      targetCapabilityId: 'CAP_DISABLE_MARKETING',
      forbiddenStateIds: ['STATE_SETTINGS_MODAL'],
    });

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('NO_PATH');
  });

  it('detects cycles and terminates bounded search without infinite loops', () => {
    // Introduce a cyclic loop: SETTINGS_MODAL -> STATE_HELP -> SETTINGS_MODAL
    graph.registerInterfaceState({
      stateId: 'STATE_HELP',
      stateType: 'MODAL',
      urlPattern: '/help',
      domStructuralHash: 'hash_help',
      semanticLandmarks: ['dialog[Help]'],
      activeModalsOrDialogs: ['Help'],
      activeTabs: [],
      timestamp: Date.now(),
    });

    graph.addEdge({
      id: 'edge_settings_to_help',
      sourceNodeId: 'STATE_SETTINGS_MODAL',
      targetNodeId: 'STATE_HELP',
      edgeType: 'INTERACT',
      weight: 1.0,
    });

    graph.addEdge({
      id: 'edge_help_to_settings',
      sourceNodeId: 'STATE_HELP',
      targetNodeId: 'STATE_SETTINGS_MODAL',
      edgeType: 'INTERACT',
      weight: 1.0,
    });

    const result = planner.planRoute({
      initialStateId: 'STATE_HELP',
      targetCapabilityId: 'CAP_NONEXISTENT',
      maxDepth: 4,
    });

    expect(result.success).toBe(false);
    expect(['CYCLE_DETECTED', 'DEPTH_EXHAUSTED', 'NO_PATH']).toContain(result.failureReason);
  });

  it('terminates when search depth limit is exhausted', () => {
    const result = planner.planRoute({
      initialStateId: 'STATE_HOME',
      targetCapabilityId: 'CAP_DISABLE_MARKETING',
      maxDepth: 1, // Requires 2 steps, but limit is 1
    });

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('DEPTH_EXHAUSTED');
  });

  it('halts execution immediately if an intermediate transition fails, preventing downstream action', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const multiRoute = {
      routeId: 'route_multistep_test_01',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_SETTINGS_MODAL',
          actionDescription: 'Open Settings',
        },
        {
          stepIndex: 2,
          fromStateId: 'STATE_SETTINGS_MODAL',
          toStateId: 'STATE_NOTIFICATIONS_TAB',
          actionDescription: 'Open Notifications Tab',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 2.0,
    };

    let step2Executed = false;

    // Dispatcher fails on Step 1
    const failingDispatcher: ExecutionDispatcher = {
      async dispatchActivation(_actId, candidate) {
        if (candidate.candidateId.includes('step_1')) {
          return { success: false, reason: 'Settings button not found in DOM' };
        }
        step2Executed = true;
        return { success: true };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      failingDispatcher,
      testCap
    );

    expect(outcome.success).toBe(false);
    expect(outcome.failedStepIndex).toBe(1);
    expect(step2Executed).toBe(false); // Step 2 was strictly NOT executed
    expect(outcome.finalState).toBe('FAILED');
  });

  it('promotes multi-step route from PROVISIONAL to ACTIVE_VALIDATED upon successful causal verification of all transitions', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const multiRoute = {
      routeId: 'route_multistep_success_01',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_SETTINGS_MODAL',
          actionDescription: 'Open Settings',
        },
        {
          stepIndex: 2,
          fromStateId: 'STATE_SETTINGS_MODAL',
          toStateId: 'STATE_NOTIFICATIONS_TAB',
          actionDescription: 'Open Notifications Tab',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 2.0,
    };

    let currentEventId = '';
    let currentTimestamp = 0;

    const validDispatcher: ExecutionDispatcher = {
      async dispatchActivation(_actId, candidate) {
        currentEventId = `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        currentTimestamp = Date.now();
        return {
          success: true,
          activationEvent: {
            eventId: currentEventId,
            sequenceNumber: 1,
            timestamp: currentTimestamp,
            targetCandidateId: candidate.candidateId,
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: `wit_dom_${Date.now()}_${Math.random()}`,
            witnessClass: 'DOM_MUTATION',
            sourceOrigin: 'DOM_OBSERVER',
            timestamp: currentTimestamp + 20,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
          {
            witnessId: `wit_app_${Date.now()}_${Math.random()}`,
            witnessClass: 'APPLICATION_STATE_MUTATION',
            sourceOrigin: 'APPLICATION_STATE',
            timestamp: currentTimestamp + 30,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
        ] as any;
      },
      async observePostState() {
        return {
          stateId: 'STATE_POST_OBSERVED',
          stateType: 'PAGE',
          domStructuralHash: 'hash_observed_post',
          observedApplicationState: { marketing_notifications_enabled: false },
          timestamp: currentTimestamp + 40,
        } as any;
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      validDispatcher,
      testCap
    );

    expect(outcome.success).toBe(true);
    expect(outcome.completedStepsCount).toBe(2);
    expect(outcome.finalState).toBe('EXECUTED');
    expect(outcome.promotedRoute).toBeDefined();
    expect(outcome.promotedRoute?.status).toBe('ACTIVE_VALIDATED');
    expect(multiRoute.status).toBe('ACTIVE_VALIDATED');

    // Capability node in graph should have activeRouteId pointing to promoted multi-step route
    const activeRoute = machine.graph.getActiveRoute('CAP_DISABLE_MARKETING');
    expect(activeRoute).toBeDefined();
    expect(activeRoute?.routeId).toBe(multiRoute.routeId);
    expect(activeRoute?.status).toBe('ACTIVE_VALIDATED');
  });

  it('halts execution and quarantines route when intermediate transition fails causal verification (insufficient witness quorum)', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const multiRoute = {
      routeId: 'route_multistep_fail_witness',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_SETTINGS_MODAL',
          actionDescription: 'Open Settings',
        },
        {
          stepIndex: 2,
          fromStateId: 'STATE_SETTINGS_MODAL',
          toStateId: 'STATE_NOTIFICATIONS_TAB',
          actionDescription: 'Open Notifications Tab',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 2.0,
    };

    let step2Dispatched = false;
    let currentEventId = '';
    let currentTimestamp = 0;

    // Dispatcher provides only 1 witness class for Step 1 -> fails causal verification quorum!
    const insufficientWitnessDispatcher: ExecutionDispatcher = {
      async dispatchActivation(_actId, candidate) {
        if (candidate.candidateId.includes('step_2')) {
          step2Dispatched = true;
        }
        currentEventId = `act_event_${Date.now()}`;
        currentTimestamp = Date.now();
        return {
          success: true,
          activationEvent: {
            eventId: currentEventId,
            sequenceNumber: 1,
            timestamp: currentTimestamp,
            targetCandidateId: candidate.candidateId,
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: `wit_dom_only_${Date.now()}`,
            witnessClass: 'DOM_MUTATION', // Only 1 witness class (< 2 required)
            sourceOrigin: 'DOM_OBSERVER',
            timestamp: currentTimestamp + 20,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
        ] as any;
      },
      async observePostState() {
        return {
          stateId: 'STATE_POST_NODE',
          stateType: 'PAGE',
          domStructuralHash: 'hash_post',
          timestamp: currentTimestamp + 30,
        } as any;
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      insufficientWitnessDispatcher,
      testCap
    );

    expect(outcome.success).toBe(false);
    expect(outcome.failedStepIndex).toBe(1);
    expect(step2Dispatched).toBe(false); // Step 2 was halted immediately!
    expect(outcome.finalState).toBe('QUARANTINED');
    expect(['QUARANTINED', 'DEMOTED']).toContain(multiRoute.status);

    // Route must NOT be promoted
    const activeRoute = machine.graph.getActiveRoute('CAP_DISABLE_MARKETING');
    expect(activeRoute).toBeNull();
  });

  it('rejects route promotion and quarantines route when promotion token signature is tampered or invalid', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const multiRoute = {
      routeId: 'route_multistep_tampered_token',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_SETTINGS_MODAL',
          actionDescription: 'Open Settings',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 1.0,
    };

    let currentEventId = '';
    let currentTimestamp = 0;

    const validDispatcher: ExecutionDispatcher = {
      async dispatchActivation(_actId, candidate) {
        currentEventId = `event_tamper_${Date.now()}`;
        currentTimestamp = Date.now();
        return {
          success: true,
          activationEvent: {
            eventId: currentEventId,
            sequenceNumber: 1,
            timestamp: currentTimestamp,
            targetCandidateId: candidate.candidateId,
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: `wit_1_${Date.now()}`,
            witnessClass: 'DOM_MUTATION',
            sourceOrigin: 'DOM_OBSERVER',
            timestamp: currentTimestamp + 20,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
          {
            witnessId: `wit_2_${Date.now()}`,
            witnessClass: 'APPLICATION_STATE_MUTATION',
            sourceOrigin: 'APPLICATION_STATE',
            timestamp: currentTimestamp + 30,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
        ] as any;
      },
      async observePostState() {
        return {
          stateId: 'STATE_POST_TAMPER',
          stateType: 'PAGE',
          domStructuralHash: 'hash_tamper',
          timestamp: currentTimestamp + 40,
        } as any;
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      validDispatcher,
      testCap,
      { corruptPromotionToken: true } // Simulated cryptographic tampering
    );

    expect(outcome.success).toBe(false);
    expect(outcome.finalState).toBe('QUARANTINED');
    expect(['QUARANTINED', 'DEMOTED']).toContain(multiRoute.status);
    expect(machine.graph.getActiveRoute('CAP_DISABLE_MARKETING')).toBeNull();
  });

  it('halts before dispatching any transition when high-risk action lacks user confirmation', async () => {
    const machine = new IntentNavMachine();
    // High-risk destructive capability
    const highRiskCap = createFunctionalCapability({
      capabilityId: 'CAP_PURGE_ACCOUNT_DATA',
      canonicalFunction: 'purge_account_data',
      actionType: 'DELETE',
      targetEntity: 'ACCOUNT_STATUS',
      riskMetadata: {
        riskClass: 'DESTRUCTIVE',
        reversible: false,
        requiresConfirmation: true,
        financial: false,
        security: true,
        destructive: true,
      },
    });

    const multiRoute = {
      routeId: 'route_high_risk_unconfirmed',
      capabilityId: 'CAP_PURGE_ACCOUNT_DATA',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_PURGE_CONFIRMATION',
          actionDescription: 'Initiate Account Data Purge',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 1.0,
    };

    let dispatchCalled = false;
    const testDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        dispatchCalled = true;
        return { success: true };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      testDispatcher,
      highRiskCap,
      { userConfirmationGranted: false } // Confirmation denied / not granted
    );

    expect(outcome.success).toBe(false);
    expect(outcome.finalState).toBe('CONFIRMATION_PENDING');
    expect(dispatchCalled).toBe(false); // Zero transitions dispatched!
    expect(multiRoute.status).toBe('PROVISIONAL'); // Not promoted!
    expect(machine.graph.getActiveRoute('CAP_PURGE_ACCOUNT_DATA')).toBeNull();
  });

  it('fails closed and refuses promotion when given an empty route with zero steps', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const emptyRoute = {
      routeId: 'route_empty_01',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [], // Zero steps!
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 0,
    };

    const mockDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        return { success: true };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      emptyRoute,
      mockDispatcher,
      testCap
    );

    expect(outcome.success).toBe(false);
    expect(outcome.finalState).toBe('FAILED');
    expect(outcome.failureReason).toContain('empty route');
    expect(emptyRoute.status).toBe('PROVISIONAL');
    expect(machine.graph.getActiveRoute('CAP_DISABLE_MARKETING')).toBeNull();
  });

  it('prevents replay and fails closed if attempting to re-promote an already validated route', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const multiRoute = {
      routeId: 'route_multistep_replay_test',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_NOTIFICATIONS_TAB',
          actionDescription: 'Disable Notifications',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 1.0,
    };

    let currentEventId = '';
    let currentTimestamp = 0;

    const validDispatcher: ExecutionDispatcher = {
      async dispatchActivation(_actId, candidate) {
        currentEventId = `event_replay_${Date.now()}_${Math.random()}`;
        currentTimestamp = Date.now();
        return {
          success: true,
          activationEvent: {
            eventId: currentEventId,
            sequenceNumber: 1,
            timestamp: currentTimestamp,
            targetCandidateId: candidate.candidateId,
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: `wit_1_${Date.now()}_${Math.random()}`,
            witnessClass: 'DOM_MUTATION',
            sourceOrigin: 'DOM_OBSERVER',
            timestamp: currentTimestamp + 20,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
          {
            witnessId: `wit_2_${Date.now()}_${Math.random()}`,
            witnessClass: 'APPLICATION_STATE_MUTATION',
            sourceOrigin: 'APPLICATION_STATE',
            timestamp: currentTimestamp + 30,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
        ] as any;
      },
      async observePostState() {
        return {
          stateId: 'STATE_POST_REPLAY',
          stateType: 'PAGE',
          domStructuralHash: 'hash_replay_post',
          timestamp: currentTimestamp + 40,
        } as any;
      },
    };

    // First execution: should succeed and promote route to ACTIVE_VALIDATED
    const firstOutcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      validDispatcher,
      testCap
    );
    expect(firstOutcome.success).toBe(true);
    expect(multiRoute.status).toBe('ACTIVE_VALIDATED');

    // Second execution with the exact same route: cannot promote an already ACTIVE_VALIDATED route directly
    const secondOutcome = await machine.executeMultiStepRouteAsync(
      multiRoute,
      validDispatcher,
      testCap
    );
    expect(secondOutcome.success).toBe(false);
    expect(secondOutcome.failureReason).toContain('Cannot promote route with status');
  });

  it('halts before dispatch when an individual route step is high-risk/destructive even if capability is classified safe', async () => {
    const machine = new IntentNavMachine();
    // Capability itself is safe / non-destructive
    const safeCap = createFunctionalCapability({
      capabilityId: 'CAP_EXPORT_DATA',
      canonicalFunction: 'export_data',
      actionType: 'NAVIGATE',
      targetEntity: 'USER_DATA',
    });

    // But route step 2 carries high-risk destructive action
    const highRiskStepRoute = {
      routeId: 'route_step_high_risk',
      capabilityId: 'CAP_EXPORT_DATA',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_SETTINGS',
          actionDescription: 'Go to Settings',
        },
        {
          stepIndex: 2,
          fromStateId: 'STATE_SETTINGS',
          toStateId: 'STATE_PURGED',
          actionDescription: 'Purge Old Logs',
          riskMetadata: {
            destructive: true,
            reversible: false,
            requiresConfirmation: true,
            riskClass: 'DESTRUCTIVE',
          },
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 2.0,
    };

    let dispatchCalled = false;
    const testDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        dispatchCalled = true;
        return { success: true };
      },
      async collectWitnesses() {
        return [];
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      highRiskStepRoute,
      testDispatcher,
      safeCap,
      { userConfirmationGranted: false }
    );

    expect(outcome.success).toBe(false);
    expect(outcome.finalState).toBe('CONFIRMATION_PENDING');
    expect(dispatchCalled).toBe(false); // Disallowed downstream execution before user confirmation!
    expect(highRiskStepRoute.status).toBe('PROVISIONAL');
  });

  it('records negative evidence contradiction in negativeEvidenceStore on intermediate causal verification failure', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const failingRoute = {
      routeId: 'route_causal_neg_evidence',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_FAIL',
          actionDescription: 'Click failing toggle',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.8,
      pathCost: 1.0,
    };

    const failingDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        return {
          success: true,
          activationEvent: {
            eventId: 'act_fail_neg_01',
            sequenceNumber: 1,
            timestamp: Date.now(),
            targetCandidateId: 'cand_fail_neg',
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
        };
      },
      async collectWitnesses() {
        // Empty witnesses -> fails causal quorum
        return [];
      },
    };

    const outcome = await machine.executeMultiStepRouteAsync(
      failingRoute,
      failingDispatcher,
      testCap
    );

    expect(outcome.success).toBe(false);
    expect(outcome.finalState).toBe('QUARANTINED');

    // Negative evidence store should now contain contradiction record for failing route
    const hasContradiction = machine.negativeEvidenceStore.isKnownContradiction(
      failingRoute.routeId,
      undefined,
      'CAP_DISABLE_MARKETING'
    );
    expect(hasContradiction).toBe(true);

    const negEvidence = machine.negativeEvidenceStore.getNegativeEvidence(
      failingRoute.routeId,
      'CAP_DISABLE_MARKETING'
    );
    expect(negEvidence).toBeDefined();
    expect(negEvidence?.contradictionType).toBe('CAUSAL_WITNESS_FAILURE');
  });

  it('rejects route promotion when attempting cross-route token reuse (token issued for route A cannot promote route B)', async () => {
    const machine = new IntentNavMachine();
    const testCap = createFunctionalCapability({
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    const routeA = {
      routeId: 'route_valid_A',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 1,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_DONE',
          actionDescription: 'Step A',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 1.0,
    };

    let currentEventId = 'event_cross_01';
    let currentTimestamp = Date.now();

    const validDispatcher: ExecutionDispatcher = {
      async dispatchActivation(_actId, candidate) {
        return {
          success: true,
          activationEvent: {
            eventId: currentEventId,
            sequenceNumber: 1,
            timestamp: currentTimestamp,
            targetCandidateId: candidate.candidateId,
            eventType: 'click',
            initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: `wit_1_${Date.now()}`,
            witnessClass: 'DOM_MUTATION',
            sourceOrigin: 'DOM_OBSERVER',
            timestamp: currentTimestamp + 20,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
          {
            witnessId: `wit_2_${Date.now()}`,
            witnessClass: 'APPLICATION_STATE_MUTATION',
            sourceOrigin: 'APPLICATION_STATE',
            timestamp: currentTimestamp + 30,
            correlatedActivationEventId: currentEventId,
            observedDelta: { marketing_notifications_enabled: false },
          },
        ] as any;
      },
      async observePostState() {
        return {
          stateId: 'STATE_DONE',
          stateType: 'PAGE',
          domStructuralHash: 'hash_done',
          timestamp: currentTimestamp + 40,
        } as any;
      },
    };

    // Execute route A to generate a valid token bound to route_valid_A
    const outcomeA = await machine.executeMultiStepRouteAsync(routeA, validDispatcher, testCap);
    expect(outcomeA.success).toBe(true);
    expect(routeA.status).toBe('ACTIVE_VALIDATED');

    // Create a new provisional route B
    const routeB = {
      routeId: 'route_provisional_B',
      capabilityId: 'CAP_DISABLE_MARKETING',
      versionNumber: 2,
      status: 'PROVISIONAL' as const,
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_HOME',
          toStateId: 'STATE_DONE',
          actionDescription: 'Step B',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.9,
      pathCost: 1.0,
    };

    machine.graph.attachRouteVersion('CAP_DISABLE_MARKETING', routeB);

    // Verify directly with promotion controller that route A's verification token cannot promote route B
    const activeRouteA = machine.graph.getActiveRoute('CAP_DISABLE_MARKETING');
    expect(activeRouteA?.routeId).toBe('route_valid_A');

    // Trying to promote route B with a verification result that has routeId 'route_valid_A'
    const tokenForA = (machine.routeManager as any).tokenAuthenticator;
    const forgedResult = {
      causallyVerified: true,
      status: 'VERIFIED' as const,
      signature: {
        preStateFingerprint: 'STATE_PRE',
        activationEventExpected: { eventType: 'click' as const },
        expectedStateDelta: {},
        verificationWindowMs: 2500,
        postStateFingerprint: 'STATE_POST',
      },
      activationEvent: {
        eventId: 'event_cross_01',
        sequenceNumber: 1,
        timestamp: Date.now(),
        targetCandidateId: 'cand_1',
        eventType: 'click' as const,
        initiatingCapabilityId: 'CAP_DISABLE_MARKETING',
      },
      durationMs: 10,
      verifiedWitnessClasses: ['DOM_MUTATION' as const, 'APPLICATION_STATE_MUTATION' as const],
      observedWitnesses: [],
      explanation: 'Verified',
      verificationToken: await tokenForA.issueTokenAsync({
        routeId: 'route_valid_A', // Bound to Route A!
        capabilityId: 'CAP_DISABLE_MARKETING',
        activationEventId: 'event_cross_01',
        verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
        issuedTimestamp: Date.now(),
      }),
    };

    const promoB = await machine.promotionController.evaluateAndPromoteAsync(
      'CAP_DISABLE_MARKETING',
      'route_provisional_B',
      forgedResult
    );

    expect(promoB.promoted).toBe(false);
    expect(promoB.reason).toContain("does not match target routeId 'route_provisional_B'");
    expect(routeB.status).toBe('QUARANTINED');
  });
});
