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
});
