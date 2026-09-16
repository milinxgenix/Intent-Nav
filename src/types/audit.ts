/**
 * IntentNav-SCFR: Append-Only Immutable Research Audit Log Types
 */

import { NormalizedIntent } from './intent';
import { TypedDriftVector } from './drift';
import { InvariantClosureResult } from './invariant';
import { CandidateRebindScore } from './ranking';
import { CausalVerificationResult } from './transition';
import { RouteLifecycleState } from './state';
import { RiskClass } from './capability';
import { ExecutionAuthorizationDecision } from './authorization';

export interface AuditRecord {
  recordId: string;
  sessionId: string;
  timestamp: number;
  intent: NormalizedIntent;
  capabilityId: string;
  previousRouteId: string | null;
  currentRouteId: string | null;
  interfaceStateId: string;
  driftVector: TypedDriftVector | null;
  candidateList: string[];
  invariantResults: Record<string, InvariantClosureResult>;
  contradictionResults: Record<string, boolean>;
  rebindScores: Record<string, CandidateRebindScore>;
  selectedCandidateId: string | null;
  causalVerificationResult: CausalVerificationResult | null;
  quarantineState: RouteLifecycleState;
  promotionResult: 'PROMOTED' | 'HELD_IN_QUARANTINE' | 'DEMOTED' | 'NONE';
  capabilityConfidence: number;
  routeConfidence: number;
  riskClass: RiskClass;
  executionAuthorization: ExecutionAuthorizationDecision;
  userConfirmation: boolean | null;
  finalOutcome: 'EXECUTED' | 'ABSTAINED' | 'CONFIRMATION_PENDING' | 'SUGGESTED' | 'FAILED';
  failureReason?: string;
}

export interface AuditLogExport {
  exportId: string;
  exportedAt: number;
  systemVersion: string;
  recordsCount: number;
  records: AuditRecord[];
}

