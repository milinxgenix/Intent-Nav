/**
 * IntentNav-SCFR: Controlled Interface Mutation Types
 * Phase 3, Step 13 Implementation
 *
 * Defines canonical data types, descriptors, and trial results for evaluating
 * systems under controlled interface mutations across the 5 canonical drift categories:
 * 1. Identifier drift
 * 2. Structural drift
 * 3. Presentation drift
 * 4. State drift
 * 5. Transition drift
 */

import { BaselineSystemId } from '../baselines/registry';

export type MutationCategory =
  | 'IDENTIFIER'
  | 'STRUCTURAL'
  | 'PRESENTATION'
  | 'STATE'
  | 'TRANSITION';

export interface MutationConfig {
  idMutation?: {
    newId: string;
    preserveAttributes?: boolean;
  };
  structuralMutation?: {
    wrapperTag?: string;
    wrapperClasses?: string[];
    extraDepth?: number;
    prependDecoySibling?: boolean;
    decoyId?: string;
    decoyLabel?: string;
  };
  presentationMutation?: {
    newLabel?: string;
    newClasses?: string[];
    ariaLabelOverride?: string;
    roleOverride?: string;
  };
  stateMutation?: {
    initialAppState?: Record<string, unknown>;
    initialAriaChecked?: string;
    disabled?: boolean;
    insideClosedModal?: boolean;
  };
  transitionMutation?: {
    outcome: 'NORMAL' | 'REJECTED' | 'DELAYED' | 'UNCORRELATED_DELTA';
    errorMessage?: string;
    delayedByMs?: number;
    mutatedProperty?: string;
    mutatedValue?: unknown;
  };
}

export interface MutationOracleRules {
  selectionMatchRule: string;
  executionSuccessRule: string;
  verificationRule: string;
}

export interface MutationDescriptor {
  id: string;
  name: string;
  category: MutationCategory;
  description: string;
  baseSite: 'SiteA';
  intentId: string;
  intentQuery: string;
  capabilityId: string;
  originalTargetId: string;
  expectedTargetId: string | null;
  expectedPostActionState: Record<string, unknown> | null;
  applicableSystems: BaselineSystemId[];
  inapplicableSystems: Array<{
    systemId: BaselineSystemId;
    reason: string;
  }>;
  oracleRules: MutationOracleRules;
  isPositiveControl: boolean;
  isNegativeOrAdversarial: boolean;
  mutationConfig: MutationConfig;
}

export type MutationTrialStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'INCOMPLETE'
  | 'NOT_APPLICABLE'
  | 'DECOY_TRIGGERED'
  | 'QUARANTINED'
  | 'ABSTAINED';

export type MutationVerificationStatus =
  | 'VERIFIED'
  | 'FAILED'
  | 'QUARANTINED'
  | 'NOT_APPLICABLE';

export interface MutationTrialResult {
  trialId: string;
  mutationId: string;
  category: MutationCategory;
  systemId: BaselineSystemId;
  systemName: string;
  applicable: boolean;
  inapplicableReason?: string;
  selectedTargetId: string | null;
  targetSelectedCorrectly: boolean;
  executionAttempted: boolean;
  executionSucceeded: boolean;
  verificationStatus: MutationVerificationStatus;
  trialStatus: MutationTrialStatus;
  latencyMs: number;
  causallyVerified: boolean;
  errorNotes?: string;
}

export interface SystemCategorySummary {
  systemId: BaselineSystemId;
  systemName: string;
  category: MutationCategory;
  totalTrials: number;
  applicableTrials: number;
  notApplicableTrials: number;
  selectionSuccesses: number;
  selectionAccuracy: number;
  executionSuccesses: number;
  executionSuccessRate: number;
  verificationSuccesses: number;
  verificationSuccessRate: number;
  quarantinedOrAbstained: number;
}

export interface MutationEvaluationSummary {
  timestamp: number;
  totalMutations: number;
  categoryBreakdown: Record<MutationCategory, number>;
  systemsEvaluated: BaselineSystemId[];
  systemCategorySummaries: SystemCategorySummary[];
}

