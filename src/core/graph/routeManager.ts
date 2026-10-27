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
import {
  PromotionTokenAuthenticator,
  defaultTokenAuthenticator,
  VerifyPromotionTokenExpectations,
  TokenVerificationOutcome,
} from '../quarantine/tokenAuthenticator';

export class RouteManager {
  public readonly tokenAuthenticator: PromotionTokenAuthenticator;
  private readonly consumedTokenIds: Set<string> = new Set();
  private readonly consumedSignatureHashes: Set<string> = new Set();

  constructor(
    public readonly graph: CapabilityGraphEngine,
    tokenAuthenticator: PromotionTokenAuthenticator = defaultTokenAuthenticator
  ) {
    this.tokenAuthenticator = tokenAuthenticator;
  }

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
   * Independently verifies a TransitionVerificationToken against target routeId,
   * capabilityId, and anti-replay state without mutating route status.
   */
  public verifyPromotionToken(
    capabilityId: string,
    routeId: string,
    token: TransitionVerificationToken,
    expectations?: Partial<VerifyPromotionTokenExpectations>
  ): TokenVerificationOutcome {
    const outcome = this.tokenAuthenticator.verifyToken(token, {
      expectedRouteId: routeId,
      expectedCapabilityId: capabilityId,
      ...expectations,
    });
    if (!outcome.valid) {
      return outcome;
    }
    if (
      (token.tokenId && this.consumedTokenIds.has(token.tokenId)) ||
      (token.signatureHash && this.consumedSignatureHashes.has(token.signatureHash))
    ) {
      return {
        valid: false,
        reason: `INVARIANT VIOLATION: Replay detected — TransitionVerificationToken '${token.tokenId}' has already been consumed and cannot be replayed.`,
      };
    }
    return outcome;
  }

  /**
   * Asynchronously verifies a TransitionVerificationToken (supports browser WebCrypto and Node crypto).
   */
  public async verifyPromotionTokenAsync(
    capabilityId: string,
    routeId: string,
    token: TransitionVerificationToken,
    expectations?: Partial<VerifyPromotionTokenExpectations>
  ): Promise<TokenVerificationOutcome> {
    const outcome = await this.tokenAuthenticator.verifyTokenAsync(token, {
      expectedRouteId: routeId,
      expectedCapabilityId: capabilityId,
      ...expectations,
    });
    if (!outcome.valid) {
      return outcome;
    }
    if (
      (token.tokenId && this.consumedTokenIds.has(token.tokenId)) ||
      (token.signatureHash && this.consumedSignatureHashes.has(token.signatureHash))
    ) {
      return {
        valid: false,
        reason: `INVARIANT VIOLATION: Replay detected — TransitionVerificationToken '${token.tokenId}' has already been consumed and cannot be replayed.`,
      };
    }
    return outcome;
  }

  private finalizeRoutePromotion(
    capabilityId: string,
    routeId: string,
    token: TransitionVerificationToken
  ): RouteVersion {
    const capability = this.graph.getCapability(capabilityId);
    if (!capability) throw new Error(`Capability ${capabilityId} not found in graph.`);

    const route = capability.routeVersions[routeId];
    if (!route) throw new Error(`Route ${routeId} not found for capability ${capabilityId}.`);

    if (route.status !== 'PROVISIONAL' && route.status !== 'TRANSITION_VERIFIED') {
      throw new Error(
        `INVARIANT VIOLATION: Cannot promote route with status '${route.status}' directly to ACTIVE_VALIDATED.`
      );
    }

    if (token.tokenId) {
      this.consumedTokenIds.add(token.tokenId);
    }
    if (token.signatureHash) {
      this.consumedSignatureHashes.add(token.signatureHash);
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
   * Promotes a route from PROVISIONAL to ACTIVE_VALIDATED.
   * UNBYPASSABLE: Strictly requires an HMAC-SHA-256 authenticated TransitionVerificationToken
   * bound to the exact routeId, capabilityId, activationEventId, transitionBinding,
   * and witnessDigest with >=2 independent witness classes and anti-replay protection.
   */
  public promoteToActive(
    capabilityId: string,
    routeId: string,
    token: TransitionVerificationToken,
    expectations?: Partial<VerifyPromotionTokenExpectations>
  ): RouteVersion {
    const verification = this.verifyPromotionToken(capabilityId, routeId, token, expectations);
    if (!verification.valid) {
      throw new Error(verification.reason);
    }

    return this.finalizeRoutePromotion(capabilityId, routeId, token);
  }

  /**
   * Asynchronously promotes a route from PROVISIONAL to ACTIVE_VALIDATED
   * (supports browser WebCrypto and Node crypto).
   */
  public async promoteToActiveAsync(
    capabilityId: string,
    routeId: string,
    token: TransitionVerificationToken,
    expectations?: Partial<VerifyPromotionTokenExpectations>
  ): Promise<RouteVersion> {
    const verification = await this.verifyPromotionTokenAsync(
      capabilityId,
      routeId,
      token,
      expectations
    );
    if (!verification.valid) {
      throw new Error(verification.reason);
    }

    return this.finalizeRoutePromotion(capabilityId, routeId, token);
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
