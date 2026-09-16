/**
 * IntentNav-SCFR: Execution Authorization Controller
 * ARCHITECTURAL RULE: Capability Confidence != Execution Authorization
 * High capability confidence can NEVER automatically authorize high-risk actions.
 */

import {
  ExecutionAuthorizationDecision,
  ExecutionAuthorizationStatus,
} from '../../types/authorization';
import { FunctionalCapabilityFingerprint, RiskClass } from '../../types/capability';
import { InvariantClosureResult } from '../../types/invariant';
import { CausalVerificationResult } from '../../types/transition';
import { RiskClassifier } from './classifier';
import { EvidenceQuorumEvaluator } from './quorum';

import { NormalizedIntent } from '../../types/intent';

export interface AuthorizationEvaluationInput {
  fingerprint: FunctionalCapabilityFingerprint;
  capabilityConfidence: number;
  routeConfidence: number;
  invariantResult: InvariantClosureResult | null;
  transitionResult: CausalVerificationResult | null;
  userConfirmationGranted?: boolean;
  intent?: NormalizedIntent;
}

export class ExecutionAuthorizationController {
  public static authorize(input: AuthorizationEvaluationInput): ExecutionAuthorizationDecision {
    const {
      fingerprint,
      capabilityConfidence,
      routeConfidence,
      invariantResult,
      transitionResult,
      userConfirmationGranted = false,
      intent,
    } = input;

    let riskInfo = RiskClassifier.classifyRisk(
      fingerprint.actionType,
      fingerprint.targetEntity,
      fingerprint.riskMetadata.riskClass
    );

    // Elevate to HIGH risk if intent contains destructive or security hints
    if (intent) {
      if (
        intent.actionType === 'DELETE' ||
        intent.sensitivityHints.includes('ACCOUNT_DELETION') ||
        intent.sensitivityHints.includes('SECURITY_CREDENTIAL')
      ) {
        riskInfo = {
          riskClass: intent.actionType === 'DELETE' ? 'DESTRUCTIVE' : 'SECURITY_SENSITIVE',
          riskLevel: 'HIGH',
          isDestructive: true,
        };
      }
    }

    const quorum = EvidenceQuorumEvaluator.evaluateQuorum(
      fingerprint,
      invariantResult,
      transitionResult
    );

    let status: ExecutionAuthorizationStatus = 'DENIED_ABSTAIN';
    let policyReason = '';
    let requiresUserConfirmation = false;

    // RULE 1: If invariant closure failed or was contradicted, immediate denial
    if (invariantResult && invariantResult.status !== 'PASS') {
      status = 'DENIED_ABSTAIN';
      policyReason = `Execution DENIED: Invariant closure status is ${invariantResult.status}`;
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }

    // RULE 2: Low capability confidence -> suggestion or abstain
    if (capabilityConfidence < 0.60) {
      status = 'SUGGESTION_ONLY';
      policyReason = `Low capability confidence (${capabilityConfidence.toFixed(2)} < 0.60): Execution abstained, presenting ranked suggestion only.`;
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }

    // RULE 3: High-Risk Operations
    if (riskInfo.riskLevel === 'HIGH') {
      requiresUserConfirmation = true;

      // Check quorum
      if (!quorum.quorumSatisfied) {
        status = 'DENIED_INSUFFICIENT_QUORUM';
        policyReason = 'High-risk action DENIED: Evidence quorum incomplete (semantic + functional + transition required).';
        return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
      }

      // Check User Confirmation
      if (userConfirmationGranted) {
        status = 'AUTHORIZED';
        policyReason = 'High-risk action AUTHORIZED: Evidence quorum satisfied and explicit user confirmation granted.';
      } else {
        status = 'CONFIRMATION_REQUIRED';
        policyReason = `High-risk action (${riskInfo.riskClass}): Capability confidence is high (${capabilityConfidence.toFixed(2)}), but explicit user confirmation is mandatory before execution.`;
      }
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }

    // RULE 4: Medium-Risk Operations (Preferences, Toggles, Exports)
    if (riskInfo.riskLevel === 'MEDIUM') {
      if (capabilityConfidence >= 0.80 && routeConfidence >= 0.50) {
        status = 'AUTHORIZED';
        policyReason = 'Medium-risk reversible operation AUTHORIZED with high confidence.';
      } else {
        requiresUserConfirmation = true;
        status = userConfirmationGranted ? 'AUTHORIZED' : 'CONFIRMATION_REQUIRED';
        policyReason = 'Medium-risk operation requires user confirmation due to moderate route confidence.';
      }
      return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
    }

    // RULE 5: Low-Risk Operations (Read-Only Navigation)
    if (capabilityConfidence >= 0.60) {
      status = 'AUTHORIZED';
      policyReason = 'Low-risk read-only navigation AUTHORIZED.';
    } else {
      status = 'SUGGESTION_ONLY';
      policyReason = 'Low-risk navigation presented as suggestion due to lower confidence.';
    }

    return this.buildDecision(status, riskInfo.riskClass, capabilityConfidence, routeConfidence, quorum, requiresUserConfirmation, userConfirmationGranted, policyReason);
  }

  private static buildDecision(
    status: ExecutionAuthorizationStatus,
    riskClass: RiskClass,
    capabilityConfidence: number,
    routeConfidence: number,
    evidenceQuorum: any,
    requiresUserConfirmation: boolean,
    userConfirmationGranted: boolean,
    policyReason: string
  ): ExecutionAuthorizationDecision {
    return {
      status,
      riskClass,
      capabilityConfidence,
      routeConfidence,
      evidenceQuorum,
      requiresUserConfirmation,
      userConfirmationGranted,
      policyReason,
      evaluatedTimestamp: Date.now(),
    };
  }
}
