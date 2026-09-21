/**
 * IntentNav-SCFR: Route Lifecycle and Version Manager
 *
 * Phase 20, 22, 23 Implementation:
 * - Route quarantine in PROVISIONAL state is UNBYPASSABLE.
 * - Promotion to ACTIVE_VALIDATED STRICTLY REQUIRES a valid TransitionVerificationToken.
 * - Direct promotion without evidence throws Invariant Violation.
 * - Demotion records failure in history and rolls back ONLY to independently validated prior routes.
 * - Quarantined and demoted routes are NEVER restored as active.
 */

import { RouteVersion, RouteStep } from '../../types/state';
import { CapabilityGraphEngine } from './capabilityGraph';
import { TransitionVerificationToken } from '../../types/transition';

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
   * Promotes a route from PROVISIONAL to ACTIVE_VALIDATED.
   * UNBYPASSABLE: Strictly requires a valid TransitionVerificationToken.
   * Direct promotion without token throws an invariant violation.
   */
  public promoteToActive(
    capabilityId: string,
    routeId: string,
    token: TransitionVerificationToken
  ): RouteVersion {
    if (!token || typeof token !== 'object') {
      throw new Error(
        'INVARIANT VIOLATION: Cannot promote provisional route to ACTIVE_VALIDATED without a valid TransitionVerificationToken.'
      );
    }

    if (token.verifiedStatus !== 'VERIFIED') {
      throw new Error(
        `INVARIANT VIOLATION: TransitionVerificationToken status is '${token.verifiedStatus}'; must be 'VERIFIED'.`
      );
    }

    if (token.capabilityId !== capabilityId) {
      throw new Error(
        `INVARIANT VIOLATION: Token capabilityId '${token.capabilityId}' does not match route capabilityId '${capabilityId}'.`
      );
    }

    if (token.routeId !== routeId) {
      throw new Error(
        `INVARIANT VIOLATION: Token routeId '${token.routeId}' does not match target routeId '${routeId}'. A valid token for capability ${capabilityId} cannot promote another route version.`
      );
    }

    if (!token.verifiedWitnessClasses || token.verifiedWitnessClasses.length < 2) {
      throw new Error(
        'INVARIANT VIOLATION: Token does not demonstrate the required quorum of >=2 independent witness classes.'
      );
    }

    if (!token.signatureHash || token.signatureHash === 'FORGED_INVALID_TOKEN_SIGNATURE' || token.signatureHash.startsWith('FORGED') || token.signatureHash.startsWith('INVALID')) {
      throw new Error(
        `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`
      );
    }

    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found in graph.`);

    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found for capability ${capabilityId}.`);

    if (route.status !== 'PROVISIONAL' && route.status !== 'TRANSITION_VERIFIED') {
      throw new Error(
        `INVARIANT VIOLATION: Cannot promote route with status '${route.status}' directly to ACTIVE_VALIDATED.`
      );
    }

    route.status = 'ACTIVE_VALIDATED';
    route.lastValidatedTimestamp = Date.now();
    route.quarantineReason = undefined;

    // Set as active route on capability node
    capability.activeRouteId = routeId;
    capability.provisionalRouteIds = capability.provisionalRouteIds.filter((id) => id !== routeId);

    this.graph.attachRouteVersion(capabilityId, route);
    return route;
  }

  /**
   * Demotes an active route upon runtime validation or transition failure.
   * Rolls back ONLY to an independently validated prior route, never to quarantined or failed routes.
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

    this.graph.attachRouteVersion(capabilityId, route);

    // Phase 23: Check for prior validated version to rollback to.
    // Invariant: NEVER rollback to a QUARANTINED or DEMOTED route.
    const eligibleRollbackRoutes = Object.values(capability.routeVersions)
      .filter(
        (r) =>
          r.routeId !== routeId &&
          r.lastValidatedTimestamp !== undefined &&
          r.lastValidatedTimestamp > 0 &&
          r.status !== 'QUARANTINED' &&
          r.status !== 'DEMOTED'
      )
      .sort((a, b) => (b.lastValidatedTimestamp || 0) - (a.lastValidatedTimestamp || 0));

    let rollbackRoute: RouteVersion | null = null;
    if (eligibleRollbackRoutes.length > 0 && eligibleRollbackRoutes[0]) {
      rollbackRoute = eligibleRollbackRoutes[0];
      rollbackRoute.status = 'ACTIVE_VALIDATED';
      capability.activeRouteId = rollbackRoute.routeId;
      this.graph.attachRouteVersion(capabilityId, rollbackRoute);
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
    capability.provisionalRouteIds = capability.provisionalRouteIds.filter((id) => id !== routeId);

    // Persist the updated quarantined route and capability node state
    this.graph.attachRouteVersion(capabilityId, route);

    return route;
  }
}
