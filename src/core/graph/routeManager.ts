/**
 * IntentNav-SCFR: Route Lifecycle and Version Manager
 * Enforces:
 * - Route quarantine in PROVISIONAL state
 * - Promotion only on causal transition verification
 * - Demotion on subsequent validation failure
 * - Rollback to prior validated version or triggering fresh recovery
 */

import { RouteVersion, RouteStep } from '../../types/state';
import { CapabilityGraphEngine } from './capabilityGraph';

export class RouteManager {
  constructor(private graph: CapabilityGraphEngine) {}

  /**
   * Creates a new route in the PROVISIONAL quarantine state
   */
  public createProvisionalRoute(
    capabilityId: string,
    steps: RouteStep[],
    confidenceScore: number,
    pathCost: number = 1.0
  ): RouteVersion {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) {
      this.graph.registerCapability(capabilityId, `Capability_${capabilityId}`);
    }

    const existingRoutes = this.graph.getRoutesForCapability(capabilityId);
    const nextVersion = existingRoutes.length + 1;
    const routeId = `route_${capabilityId}_v${nextVersion}_${Date.now()}`;

    const provisionalRoute: RouteVersion = {
      routeId,
      capabilityId,
      versionNumber: nextVersion,
      status: 'PROVISIONAL', // MUST start in quarantine
      steps,
      creationTimestamp: Date.now(),
      confidenceScore,
      pathCost,
      quarantineReason: 'Awaiting causal transition verification before promotion to active',
    };

    this.graph.attachRouteVersion(capabilityId, provisionalRoute);
    return provisionalRoute;
  }

  /**
   * Promotes a route from PROVISIONAL (or TRANSITION_VERIFIED) to ACTIVE_VALIDATED
   */
  public promoteToActive(capabilityId: string, routeId: string): RouteVersion {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found`);

    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found for capability ${capabilityId}`);

    // Invariant: cannot promote if status is QUARANTINED or DEMOTED without verification
    if (route.status !== 'PROVISIONAL' && route.status !== 'TRANSITION_VERIFIED') {
      throw new Error(`Cannot promote route with status ${route.status} directly to ACTIVE_VALIDATED`);
    }

    route.status = 'ACTIVE_VALIDATED';
    route.lastValidatedTimestamp = Date.now();
    route.quarantineReason = undefined;

    // Set as active route on capability node
    capability.activeRouteId = routeId;
    capability.provisionalRouteIds = capability.provisionalRouteIds.filter((id) => id !== routeId);

    return route;
  }

  /**
   * Demotes an active route upon runtime validation or transition failure
   */
  public demoteActiveRoute(
    capabilityId: string,
    routeId: string,
    reason: string
  ): { demotedRoute: RouteVersion; rollbackRoute: RouteVersion | null } {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found`);

    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found`);

    route.status = 'DEMOTED';
    route.demotionReason = reason;

    if (capability.activeRouteId === routeId) {
      capability.activeRouteId = null;
    }
    if (!capability.demotedRouteIds.includes(routeId)) {
      capability.demotedRouteIds.push(routeId);
    }

    // Check for prior validated version to rollback to
    const allRoutes = Object.values(capability.routeVersions)
      .filter((r) => r.routeId !== routeId && r.lastValidatedTimestamp && r.status !== 'QUARANTINED')
      .sort((a, b) => (b.lastValidatedTimestamp || 0) - (a.lastValidatedTimestamp || 0));

    let rollbackRoute: RouteVersion | null = null;
    if (allRoutes.length > 0 && allRoutes[0]) {
      rollbackRoute = allRoutes[0];
      rollbackRoute.status = 'ACTIVE_VALIDATED';
      capability.activeRouteId = rollbackRoute.routeId;
    }

    return { demotedRoute: route, rollbackRoute };
  }

  /**
   * Quarantines a route permanently (e.g. repeated failure, decoy)
   */
  public quarantineRoute(capabilityId: string, routeId: string, reason: string): RouteVersion {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found`);

    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found`);

    route.status = 'QUARANTINED';
    route.quarantineReason = reason;

    if (capability.activeRouteId === routeId) {
      capability.activeRouteId = null;
    }
    if (!capability.quarantinedRouteIds.includes(routeId)) {
      capability.quarantinedRouteIds.push(routeId);
    }

    return route;
  }
}

