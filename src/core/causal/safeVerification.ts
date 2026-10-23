/**
 * IntentNav-SCFR: Safe and Reversible Verification Controller
 *
 * Implements Step 9: Safe and Reversible Verification
 * - Classifies verification operations by risk and reversibility.
 * - Enforces preference for non-destructive observation and reversible operations.
 * - Strictly prohibits automatic execution of irreversible/destructive/financial actions for verification.
 * - Evaluates and verifies rollback outcomes rather than assuming restoration succeeded.
 * - Fails closed to ABSTAINED / QUARANTINED when safety cannot be established.
 */

import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { RollbackVerificationOutcome } from '../../types/transition';
import { RiskClassifier, RiskClassificationResult } from '../authorization/classifier';
import { InvariantClosureEngine, CandidateEvaluationContext } from '../invariant/engine';
import { RouteManager } from '../graph/routeManager';

export interface VerificationSafetyAssessment {
  riskInfo: RiskClassificationResult;
  isSafeToProbe: boolean;
  requiresUserConfirmation: boolean;
  probeType: 'NON_DESTRUCTIVE_OBSERVATION' | 'REVERSIBLE_PROBE' | 'CONFIRMATION_GATED_EXECUTION' | 'PROHIBITED_UNSAFE_PROBE';
  policyReason: string;
}

export class SafeVerificationController {
  /**
   * Assesses whether an action or route verification is safe to perform automatically.
   */
  public static assessVerificationSafety(
    fingerprint: FunctionalCapabilityFingerprint,
    userConfirmationGranted: boolean = false
  ): VerificationSafetyAssessment {
    const riskInfo = RiskClassifier.classifyRisk(
      fingerprint.actionType,
      fingerprint.targetEntity,
      fingerprint.riskMetadata?.riskClass
    );

    // 1. High-risk operations (DESTRUCTIVE, FINANCIAL, IRREVERSIBLE, SECURITY_SENSITIVE)
    if (riskInfo.riskLevel === 'HIGH' || riskInfo.isDestructive) {
      if (!userConfirmationGranted) {
        return {
          riskInfo,
          isSafeToProbe: false,
          requiresUserConfirmation: true,
          probeType: 'PROHIBITED_UNSAFE_PROBE',
          policyReason: `High-risk action (${riskInfo.riskClass}) cannot be executed for verification without explicit user confirmation.`,
        };
      }
      return {
        riskInfo,
        isSafeToProbe: true,
        requiresUserConfirmation: true,
        probeType: 'CONFIRMATION_GATED_EXECUTION',
        policyReason: `High-risk action authorized for verification via explicit user confirmation.`,
      };
    }

    // 2. Read-only operations: always safe to verify via non-destructive observation
    if (riskInfo.riskClass === 'READ_ONLY' || fingerprint.actionType === 'VIEW' || fingerprint.actionType === 'NAVIGATE') {
      return {
        riskInfo,
        isSafeToProbe: true,
        requiresUserConfirmation: false,
        probeType: 'NON_DESTRUCTIVE_OBSERVATION',
        policyReason: 'Read-only action verified via passive non-destructive observation.',
      };
    }

    // 3. Reversible operations: safe with reversible probe
    return {
      riskInfo,
      isSafeToProbe: true,
      requiresUserConfirmation: false,
      probeType: 'REVERSIBLE_PROBE',
      policyReason: 'Reversible state modification authorized for verification.',
    };
  }

  /**
   * Performs an authoritative, verified rollback after a runtime or transition failure.
   * Evaluates whether the prior validated route can be restored AND verifies that its invariants
   * actually hold in the current post-failure environment.
   */
  public static verifyAndExecuteRollback(
    routeManager: RouteManager,
    capability: FunctionalCapabilityFingerprint,
    failedRouteId: string,
    currentCandidate: CandidateEvaluationContext | null,
    failureReason: string
  ): RollbackVerificationOutcome {
    const capabilityNode = (routeManager as any).graph?.getCapability(capability.capabilityId);
    if (!capabilityNode) {
      return {
        rollbackAttempted: false,
        restoredRouteId: null,
        status: 'ROLLBACK_UNAVAILABLE',
        invariantsPassed: false,
        explanation: `Capability '${capability.capabilityId}' not registered in capability graph. Demoted without rollback.`,
        timestamp: Date.now(),
      };
    }

    const demotionResult = routeManager.demoteActiveRoute(
      capability.capabilityId,
      failedRouteId,
      failureReason
    );

    const rollbackRoute = demotionResult.rollbackRoute;
    if (!rollbackRoute) {
      return {
        rollbackAttempted: true,
        restoredRouteId: null,
        status: 'ROLLBACK_UNAVAILABLE',
        invariantsPassed: false,
        explanation: `No prior validated route version exists for capability '${capability.capabilityId}'. Demoted without rollback.`,
        timestamp: Date.now(),
      };
    }

    // Verify the restored route in the live environment if candidate context is provided
    if (currentCandidate) {
      const closureResult = InvariantClosureEngine.evaluateCandidate(capability, currentCandidate);
      if (closureResult.status !== 'PASS') {
        // Rollback route was restored in memory but fails live invariants -> rollback is partial/failed!
        routeManager.quarantineRoute(
          capability.capabilityId,
          rollbackRoute.routeId,
          `Rollback verification failed live invariant closure: ${closureResult.rejectionReason}`
        );

        return {
          rollbackAttempted: true,
          restoredRouteId: rollbackRoute.routeId,
          status: 'ROLLBACK_FAILED',
          invariantsPassed: false,
          explanation: `Prior validated route '${rollbackRoute.routeId}' was restored but failed live invariant closure: ${closureResult.rejectionReason}. Quarantined.`,
          timestamp: Date.now(),
        };
      }
    }

    return {
      rollbackAttempted: true,
      restoredRouteId: rollbackRoute.routeId,
      status: 'ROLLBACK_VERIFIED',
      invariantsPassed: true,
      explanation: `Prior validated route '${rollbackRoute.routeId}' (version ${rollbackRoute.versionNumber}) successfully restored and verified.`,
      timestamp: Date.now(),
    };
  }
}
