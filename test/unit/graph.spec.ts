/**
 * IntentNav-SCFR: Capability-State Graph & Route Manager Tests
 * Proves: CAPABILITY NODES != INTERFACE-STATE NODES
 */

import { describe, it, expect } from 'vitest';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { RouteManager } from '../../src/core/graph/routeManager';
import { InterfaceStateNode } from '../../src/types/state';
import { TransitionVerificationToken } from '../../src/types/transition';
import { defaultTokenAuthenticator } from '../../src/core/quarantine/tokenAuthenticator';

const createTestToken = (capabilityId: string, routeId: string): TransitionVerificationToken =>
  defaultTokenAuthenticator.issueToken({
    tokenId: `tok_${routeId}_${Math.random().toString(36).slice(2, 6)}`,
    routeId,
    capabilityId,
    activationEventId: `act_test_${routeId}`,
    verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
  });

describe('CapabilityGraphEngine & RouteManager', () => {
  it('differentiates Capability Nodes from Interface-State Nodes', () => {
    const graph = new CapabilityGraphEngine();

    // 1. Register Capability Node
    const capNode = graph.registerCapability('CAP_DISABLE_MARKETING', 'disable_marketing_communications');
    expect(capNode.capabilityId).toBe('CAP_DISABLE_MARKETING');

    // 2. Register Interface-State Nodes (Pages/Panels)
    const state1: InterfaceStateNode = {
      stateId: 'STATE_SETTINGS_MAIN',
      stateType: 'PAGE',
      urlPattern: '/settings',
      domStructuralHash: 'hash_123',
      semanticLandmarks: ['main', 'nav'],
      activeModalsOrDialogs: [],
      activeTabs: [],
      timestamp: Date.now(),
    };

    const state2: InterfaceStateNode = {
      stateId: 'STATE_NOTIFICATIONS_PANEL',
      stateType: 'PANEL',
      urlPattern: '/settings/notifications',
      domStructuralHash: 'hash_456',
      semanticLandmarks: ['section[Notifications]'],
      activeModalsOrDialogs: [],
      activeTabs: ['Notifications'],
      timestamp: Date.now(),
    };

    graph.registerInterfaceState(state1);
    graph.registerInterfaceState(state2);

    expect(graph.getAllCapabilities().length).toBe(1);
    expect(graph.getAllInterfaceStates().length).toBe(2);
    // Verified: Capability nodes are NOT interface-state nodes!
  });

  it('manages versioned routes (V1, V2) under a single persistent capability node', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);

    // Initial Route V1
    const routeV1 = routeManager.createProvisionalRoute(
      'CAP_DISABLE_MARKETING',
      [{ stepIndex: 1, fromStateId: 'PAGE_MAIN', toStateId: 'PANEL_NOTIF', actionDescription: 'Click Settings > Notifications' }],
      0.85
    );
    expect(routeV1.versionNumber).toBe(1);
    expect(routeV1.status).toBe('PROVISIONAL');

    // Promote V1 to active
    routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeV1.routeId, createTestToken('CAP_DISABLE_MARKETING', routeV1.routeId));
    expect(graph.getActiveRoute('CAP_DISABLE_MARKETING')?.routeId).toBe(routeV1.routeId);

    // Website changes -> Route V2 created
    const routeV2 = routeManager.createProvisionalRoute(
      'CAP_DISABLE_MARKETING',
      [{ stepIndex: 1, fromStateId: 'PAGE_MAIN', toStateId: 'HUB_COMMUNICATIONS', actionDescription: 'Click Hub > Bulletins' }],
      0.90
    );
    expect(routeV2.versionNumber).toBe(2);
    expect(routeV2.status).toBe('PROVISIONAL'); // Newly recovered route must start in PROVISIONAL quarantine!

    // Verify capability node holds both routes
    const cap = graph.getCapability('CAP_DISABLE_MARKETING')!;
    expect(Object.keys(cap.routeVersions).length).toBe(2);
    expect(cap.provisionalRouteIds).toContain(routeV2.routeId);
  });

  it('demotes active route and performs rollback to prior validated version', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);

    // V1 validated
    const v1 = routeManager.createProvisionalRoute('CAP_EXPORT', [], 0.80);
    routeManager.promoteToActive('CAP_EXPORT', v1.routeId, createTestToken('CAP_EXPORT', v1.routeId));

    // V2 validated later
    const v2 = routeManager.createProvisionalRoute('CAP_EXPORT', [], 0.90);
    routeManager.promoteToActive('CAP_EXPORT', v2.routeId, createTestToken('CAP_EXPORT', v2.routeId));

    expect(graph.getActiveRoute('CAP_EXPORT')?.routeId).toBe(v2.routeId);

    // V2 fails at runtime -> Demoted
    const { demotedRoute, rollbackRoute } = routeManager.demoteActiveRoute(
      'CAP_EXPORT',
      v2.routeId,
      'Runtime navigation failure on step 2'
    );

    expect(demotedRoute.status).toBe('DEMOTED');
    expect(rollbackRoute).not.toBeNull();
    expect(rollbackRoute?.routeId).toBe(v1.routeId);
    expect(graph.getActiveRoute('CAP_EXPORT')?.routeId).toBe(v1.routeId);
  });
});

