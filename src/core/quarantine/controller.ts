/**
 * IntentNav-SCFR: Route Quarantine Controller
 * Enforces:
 * - All newly synthesized or recovered routes are quarantined in PROVISIONAL state
 * - Failed routes are moved to QUARANTINED state and negative evidence store
 */

import { RouteVersion, RouteLifecycleState } from '../../types/state';
import { RouteManager } from '../graph/routeManager';
import { NegativeEvidenceStore } from '../contradiction/store';

export class QuarantineController {
  constructor(
    private routeManager: RouteManager,
    private negativeEvidenceStore: NegativeEvidenceStore
  ) {}

  /**
   * Places a route into PROVISIONAL quarantine
   */
  public quarantineProvisional(
    _capabilityId: string,
    route: RouteVersion,
    reason: string
  ): RouteVersion {
    route.status = 'PROVISIONAL';
    route.quarantineReason = reason;
    return route;
  }

  /**
   * Transitions route to failed QUARANTINED state and records negative evidence
   */
  public quarantineFailedRoute(
    capabilityId: string,
    routeId: string,
    reason: string,
    evidenceDetails: Record<string, unknown> = {}
  ): RouteVersion {
    const quarantined = this.routeManager.quarantineRoute(capabilityId, routeId, reason);

    this.negativeEvidenceStore.recordContradiction(
      routeId,
      'CAUSAL_WITNESS_FAILURE',
      'TRANSITION_VERIFICATION_FAILURE',
      reason,
      evidenceDetails,
      {},
      routeId
    );

    return quarantined;
  }

  /**
   * Checks if a route status is quarantined or provisional
   */
  public isUnderQuarantine(status: RouteLifecycleState): boolean {
    return status === 'PROVISIONAL' || status === 'QUARANTINED';
  }
}

