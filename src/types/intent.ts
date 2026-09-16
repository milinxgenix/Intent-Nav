/**
 * IntentNav-SCFR: Normalized Intent Types
 * Flow: Intent -> Capability Identity -> Candidate Route (NEVER intent -> selector or URL)
 */

import { ActionType, TargetEntity } from './capability';

export interface IntentConstraint {
  type: 'TIMING' | 'SCOPE' | 'REVERSIBLE_ONLY' | 'NO_CONFIRMATION' | 'CUSTOM';
  expression: string;
}

export type SensitivityHint =
  | 'LOW_RISK'
  | 'CONTAINS_PII'
  | 'FINANCIAL'
  | 'SECURITY_CREDENTIAL'
  | 'ACCOUNT_DELETION'
  | 'IRREVERSIBLE';

export interface NormalizedIntent {
  rawGoal: string;
  normalizedGoal: string;
  actionType: ActionType;
  targetEntity: TargetEntity;
  constraints: IntentConstraint[];
  sensitivityHints: SensitivityHint[];
  confidence: number;
  extractedParameters?: Record<string, string>;
}

