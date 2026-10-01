/**
 * IntentNav-SCFR: Route Promotion and Rollback Controller
 * Promotion from PROVISIONAL to ACTIVE_VALIDATED is strictly gated on Causal Transition Verification.
 */

import { RouteVersion } from '../../types/state';
import { CausalVerificationResult } from '../../types/transition';
import { RouteManager } from '../graph/routeManager';
import { QuarantineController } from './controller';

export interface PromotionDecision {
  promoted: boolean;
  route: RouteVersion;
  reason: string;
  failureReason?: string;
  rollbackRoute?: RouteVersion | null;
}

export class RoutePromotionController {
  constructor(
    private routeManager: RouteManager,
    private quarantineController: QuarantineController
  ) {}

  /**
   * Promotes a provisional route ONLY IF transition verification succeeded with a valid token
   */
  public evaluateAndPromote(
    capabilityId: string,
    routeId: string,
    verificationResult: CausalVerificationResult
  ): PromotionDecision {
    if (!verificationResult.causallyVerified || !verificationResult.verificationToken) {
      // Quarantine the route on failed verification
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        verificationResult.explanation,
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion DENIED: Transition verification failed (${verificationResult.status})`,
        failureReason: verificationResult.failureReason || 'verification_failed',
      };
    }

    const expectations = {
      expectedActivationEventId:
        typeof verificationResult.activationEvent?.eventId === 'string' &&
        verificationResult.activationEvent.eventId.length > 0
          ? verificationResult.activationEvent.eventId
          : undefined,
      expectedTransitionSignature:
        verificationResult.signature &&
        typeof verificationResult.signature.preStateFingerprint === 'string'
          ? verificationResult.signature
          : undefined,
    };

    // Causally verified: promote to ACTIVE_VALIDATED using TransitionVerificationToken
    try {
      const activeRoute = this.routeManager.promoteToActive(
        capabilityId,
        routeId,
        verificationResult.verificationToken,
        expectations
      );
      return {
        promoted: true,
        route: activeRoute,
        reason: 'PROMOTED to ACTIVE_VALIDATED: Causal transition verified with required witnesses',
      };
    } catch (err: any) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        err.message || 'Promotion rejected: invalid verification token',
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion REJECTED: ${err.message}`,
        failureReason: 'invalid_promotion_token',
      };
    }
  }

  /**
   * Asynchronously promotes a provisional route ONLY IF transition verification
   * succeeded with an HMAC-SHA-256 authenticated token (supports browser WebCrypto and Node crypto).
   */
  public async evaluateAndPromoteAsync(
    capabilityId: string,
    routeId: string,
    verificationResult: CausalVerificationResult
  ): Promise<PromotionDecision> {
    if (!verificationResult.causallyVerified || !verificationResult.verificationToken) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        verificationResult.explanation,
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion DENIED: Transition verification failed (${verificationResult.status})`,
        failureReason: verificationResult.failureReason || 'verification_failed',
      };
    }

    const expectations = {
      expectedActivationEventId:
        typeof verificationResult.activationEvent?.eventId === 'string' &&
        verificationResult.activationEvent.eventId.length > 0
          ? verificationResult.activationEvent.eventId
          : undefined,
      expectedTransitionSignature:
        verificationResult.signature &&
        typeof verificationResult.signature.preStateFingerprint === 'string'
          ? verificationResult.signature
          : undefined,
    };

    try {
      const activeRoute = await this.routeManager.promoteToActiveAsync(
        capabilityId,
        routeId,
        verificationResult.verificationToken,
        expectations
      );
      return {
        promoted: true,
        route: activeRoute,
        reason: 'PROMOTED to ACTIVE_VALIDATED: Causal transition verified with required witnesses',
      };
    } catch (err: any) {
      const quarantined = this.quarantineController.quarantineFailedRoute(
        capabilityId,
        routeId,
        err.message || 'Promotion rejected: invalid verification token',
        { verificationResult }
      );
      return {
        promoted: false,
        route: quarantined,
        reason: `Promotion REJECTED: ${err.message}`,
        failureReason: 'invalid_promotion_token',
      };
    }
  }

  /**
   * Demotes an active route upon runtime failure and triggers rollback or fresh recovery
   */
  public demoteAndRollback(
    capabilityId: string,
    routeId: string,
    failureReason: string
  ): PromotionDecision {
    const { demotedRoute, rollbackRoute } = this.routeManager.demoteActiveRoute(
      capabilityId,
      routeId,
      failureReason
    );

    return {
      promoted: false,
      route: demotedRoute,
      rollbackRoute,
      reason: rollbackRoute
        ? `Route DEMOTED. Automatically rolled back to prior validated route: ${rollbackRoute.routeId}`
        : 'Route DEMOTED. No prior validated route available; fresh recovery required.',
    };
  }
}
