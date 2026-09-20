/**
 * IntentNav-SCFR: Persistent Functional Capability Identity & Fingerprint Types
 *
 * Core Principle: Persistent Capability Identity != Current Interface Binding != Volatile DOM Handle
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

export type DeclarativePredicateOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'IN'
  | 'NOT_IN'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'TRUTHY'
  | 'FALSY'
  | 'EXISTS'
  | 'MATCHES_REGEX';

export type DeclarativePredicateSource =
  | 'PRE_STATE'
  | 'POST_STATE'
  | 'CONTEXT'
  | 'ACTION'
  | 'TARGET'
  | 'ELEMENT_ATTRIBUTE';

export interface DeclarativeInvariantPredicate {
  id: string;
  name: string;
  description: string;
  source: DeclarativePredicateSource;
  property: string;
  operator: DeclarativePredicateOperator;
  expectedValue?: unknown;
  expectedValues?: unknown[];
}

export interface InvariantPredicate {
  id: string;
  name: string;
  description: string;
  declarative?: DeclarativeInvariantPredicate;
  evaluate: (context: Record<string, unknown>) => boolean;
}

export interface StateDeltaPredicate {
  property: string;
  expectedChange: 'ENABLED_TO_DISABLED' | 'DISABLED_TO_ENABLED' | 'MODIFIED' | 'ADDED' | 'REMOVED' | string;
  id?: string;
  name?: string;
  description?: string;
  declarative?: DeclarativeInvariantPredicate;
  evaluate?: (context: Record<string, unknown>) => boolean;
}

export interface ExpectedStatePredicate {
  property: string;
  expectedValue?: unknown;
  id?: string;
  name?: string;
  description?: string;
  declarative?: DeclarativeInvariantPredicate;
  evaluate?: (context: Record<string, unknown>) => boolean;
}

export interface ContextPredicate {
  target: 'ancestor' | 'container' | 'sibling' | 'url' | 'page_title';
  pattern: string;
  required: boolean;
  id?: string;
  name?: string;
  description?: string;
  declarative?: DeclarativeInvariantPredicate;
  evaluate?: (context: Record<string, unknown>) => boolean;
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
  contradictionPredicates: (string | InvariantPredicate)[];
  failedInvariantPredicates: (string | InvariantPredicate)[];
  failedTransitionWitnesses: string[];
  decoyRelationships: string[];
  rejectionReasons: string[];
}

/**
 * Volatile Execution Binding Handle
 * Used temporarily by content script for actual browser dispatch.
 * BindingHandle != CapabilityIdentity.
 */
export interface BindingHandle {
  handleId: string;
  tagName: string;
  role: string;
  accessibleName: string;
  domStructuralPath: string;
  elementIndex: number;
  xpath?: string;
  relativeSiblingPath?: string;
  volatileId?: string; // Retained ONLY as volatile execution metadata
  volatileClasses?: string[]; // Retained ONLY as volatile execution metadata
}

/**
 * Current Interface Binding (Versioned)
 * A capability can maintain multiple versions of bindings:
 * CAPABILITY_X
 *   ├── binding/version 1
 *   ├── binding/version 2
 *   ├── binding/version 3
 *   └── binding/version 4
 */
export interface CurrentInterfaceBinding {
  bindingId: string;
  capabilityId: string;
  bindingVersion: number;
  interfaceStateId: string;
  bindingHandle: BindingHandle;
  status: 'PROVISIONAL' | 'ACTIVE_VALIDATED' | 'DEMOTED' | 'QUARANTINED';
  confidence: number;
  creationTimestamp: number;
  lastValidatedTimestamp?: number;
}

/**
 * Persistent Functional Capability Identity
 * Must be independent of DOM id, CSS class, CSS selector, coordinates, URL, menu position.
 */
export interface PersistentCapabilityIdentity {
  capabilityId: string;
  canonicalFunction: string;
  actionType: ActionType;
  targetEntity: TargetEntity;
  domainScope?: string;
  fingerprintHash: string;
}

export interface CapabilityEvidence {
  semantic: SemanticEvidence;
  context: ContextEvidence;
  transition: TransitionEvidence;
  risk: RiskMetadata;
  provenance: Provenance;
  confidence: ConfidenceRecord;
  negative: NegativeEvidenceRecord;
}

/**
 * Functional Capability Fingerprint
 * Authoritative functional identity encoding mandatory invariants.
 */
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

  // Fingerprint Hash
  fingerprintHash?: string;
}

/**
 * First-class FunctionalCapability entity
 */
export interface FunctionalCapability {
  identity: PersistentCapabilityIdentity;
  fingerprint: FunctionalCapabilityFingerprint;
  bindings: Record<string, CurrentInterfaceBinding>; // bindingId -> CurrentInterfaceBinding
  activeBindingId?: string | null;
}
