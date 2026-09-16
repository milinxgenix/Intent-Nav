/**
 * IntentNav-SCFR: Execution Authorization & Risk Gating Types
 * Mandatory Separation: Capability Confidence != Execution Authorization
 */

import { RiskClass } from './capability';

export type ExecutionAuthorizationStatus =
  | 'AUTHORIZED'
  | 'CONFIRMATION_REQUIRED'
  | 'SUGGESTION_ONLY'
  | 'DENIED_ABSTAIN'
  | 'DENIED_HIGH_RISK_WITHOUT_CONFIRMATION'
  | 'DENIED_INSUFFICIENT_QUORUM';

export interface EvidenceQuorum {
  hasSemanticEvidence: boolean;
  hasFunctionalInvariantEvidence: boolean;
  hasTransitionStateEvidence: boolean;
  quorumSatisfied: boolean; // All three mandatory for high-risk
}

export interface ExecutionAuthorizationDecision {
  status: ExecutionAuthorizationStatus;
  riskClass: RiskClass;
  capabilityConfidence: number;
  routeConfidence: number;
  evidenceQuorum: EvidenceQuorum;
  requiresUserConfirmation: boolean;
  userConfirmationGranted?: boolean;
  policyReason: string;
  evaluatedTimestamp: number;
}

