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
   * Transitions route to failed QUARANTINED state and records structured negative evidence
   */
  public quarantineFailedRoute(
    capabilityId: string,
    routeId: string,
    reason: string,
    evidenceDetails: Record<string, unknown> = {},
    extra?: {
      failedCondition?: string;
      activationEventId?: string;
      sequenceNumber?: number;
      witnessIds?: string[];
      candidateIdentifier?: string;
      requiredMaterialEvidenceChange?: string;
    }
  ): RouteVersion {
    const quarantined = this.routeManager.quarantineRoute(capabilityId, routeId, reason);

    const statusCondition = extra?.failedCondition || (evidenceDetails['status'] as string) || 'TRANSITION_VERIFICATION_FAILURE';
    const requiredChange =
      extra?.requiredMaterialEvidenceChange ||
      (statusCondition === 'FAILED_POST_STATE_MISMATCH'
        ? 'Requires valid observed interface post-state progression differing from pre-state and satisfying expected delta.'
        : 'Requires material interface or state transition change before candidate can be reconsidered.');

    this.negativeEvidenceStore.recordContradiction(
      routeId,
      'CAUSAL_WITNESS_FAILURE',
      statusCondition,
      reason,
      evidenceDetails,
      { capabilityId },
      routeId,
      undefined,
      {
        failedCondition: statusCondition,
        affectedCapabilityId: capabilityId,
        affectedRouteId: routeId,
        affectedCandidateId: extra?.candidateIdentifier || routeId,
        sequenceNumber: extra?.sequenceNumber,
        activationEventId: extra?.activationEventId,
        witnessIds: extra?.witnessIds,
        failureClassification: statusCondition,
        quarantined: true,
        canReconsider: true,
        requiredMaterialEvidenceChange: requiredChange,
      }
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

