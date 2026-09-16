/**
 * IntentNav-SCFR: Persistent Functional Capability Identity & Fingerprint Types
 */

export type RiskClass =
  | 'READ_ONLY'
  | 'REVERSIBLE'
  | 'MEDIUM_IMPACT'
  | 'SENSITIVE'
  | 'SECURITY_SENSITIVE'
  | 'DESTRUCTIVE'
  | 'FINANCIAL'
  | 'IRREVERSIBLE';

export type ActionType =
  | 'NAVIGATE'
  | 'VIEW'
  | 'MODIFY_PREFERENCE'
  | 'TOGGLE'
  | 'INPUT_TEXT'
  | 'SUBMIT'
  | 'DOWNLOAD'
  | 'EXPORT_DATA'
  | 'AUTHENTICATE'
  | 'REVOKE_ACCESS'
  | 'DEACTIVATE_ACCOUNT'
  | 'DELETE';

export type TargetEntity =
  | 'PRIVACY_SETTINGS'
  | 'MARKETING_NOTIFICATIONS'
  | 'SECURITY_SETTINGS'
  | 'TWO_FACTOR_AUTH'
  | 'PERSONAL_DATA_EXPORT'
  | 'ACCOUNT_STATUS'
  | 'BILLING_PREFERENCES'
  | string;

export interface InvariantPredicate {
  id: string;
  name: string;
  description: string;
  evaluate: (context: Record<string, unknown>) => boolean;
}

export interface StateDeltaPredicate {
  property: string;
  expectedChange: 'ENABLED_TO_DISABLED' | 'DISABLED_TO_ENABLED' | 'MODIFIED' | 'ADDED' | 'REMOVED' | string;
}

export interface ExpectedStatePredicate {
  property: string;
  expectedValue: unknown;
}

export interface ContextPredicate {
  target: 'ancestor' | 'container' | 'sibling' | 'url' | 'page_title';
  pattern: string;
  required: boolean;
}

export interface ActivationEventCharacteristics {
  eventType: 'click' | 'change' | 'submit' | 'keydown';
  bubbles: boolean;
  cancelable: boolean;
  requiredModifiers?: string[];
}

export interface SemanticEvidence {
  canonicalLabel: string;
  semanticSynonyms: string[];
  accessibleName: string;
  role: string;
  visibleLabel: string;
  sectionMeaning: string;
  actionDescription: string;
}

export interface ContextEvidence {
  ancestorRelationships: string[];
  nearbyText: string[];
  surroundingLabels: string[];
  containerSemantics: string[];
  menuPanelRelationships: string[];
  relativeStructuralRelationships: string[];
  urlSemantics?: string;
}

export interface TransitionEvidence {
  preStateFingerprint: string;
  activationEventCharacteristics: ActivationEventCharacteristics;
  expectedDelta: Record<string, unknown>;
  postStateFingerprint: string;
  historicalTransitionObservations: number;
  witnessClasses: string[];
  verificationWindowMs: number;
}

export interface RiskMetadata {
  riskClass: RiskClass;
  reversible: boolean;
  financial: boolean;
  security: boolean;
  destructive: boolean;
  requiresConfirmation: boolean;
}

export interface ValidationHistoryEntry {
  timestamp: number;
  routeVersion: string;
  success: boolean;
  witnessCount: number;
  failureReason?: string;
}

export interface Provenance {
  source: 'INITIAL_SPEC' | 'DISCOVERED' | 'REBOUND' | 'USER_CONFIRMED';
  creationTimestamp: number;
  validationTimestamp: number;
  routeVersion: string;
  invalidationReason?: string;
  validationHistory: ValidationHistoryEntry[];
}

export interface ConfidenceRecord {
  capabilityConfidence: number;
  routeConfidence: number;
}

export interface NegativeEvidenceRecord {
  rejectedCandidateIdentities: string[];
  contradictionPredicates: string[];
  failedInvariantPredicates: string[];
  failedTransitionWitnesses: string[];
  decoyRelationships: string[];
  rejectionReasons: string[];
}

export interface FunctionalCapabilityFingerprint {
  capabilityId: string;
  canonicalFunction: string;
  actionType: ActionType;
  targetEntity: TargetEntity;

  // Invariant Core
  mandatoryPreStatePredicates: InvariantPredicate[];
  allowedStateDelta: StateDeltaPredicate[];
  expectedPostState: ExpectedStatePredicate[];
  requiredContextPredicates: ContextPredicate[];
  forbiddenContextPredicates: ContextPredicate[];

  // Evidence channels
  semanticEvidence: SemanticEvidence;
  contextEvidence: ContextEvidence;
  transitionEvidence: TransitionEvidence;
  riskMetadata: RiskMetadata;
  provenance: Provenance;
  confidence: ConfidenceRecord;
  negativeEvidence: NegativeEvidenceRecord;
}

