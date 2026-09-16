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
      };
    }

    // Causally verified: promote to ACTIVE_VALIDATED using TransitionVerificationToken
    const activeRoute = this.routeManager.promoteToActive(
      capabilityId,
      routeId,
      verificationResult.verificationToken
    );
    return {
      promoted: true,
      route: activeRoute,
      reason: 'PROMOTED to ACTIVE_VALIDATED: Causal transition verified with required witnesses',
    };
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
