# Functional Capability Fingerprint Specification

## 1. Overview

The `FunctionalCapabilityFingerprint` represents the complete, persistent identity of an interactive capability on the web. It replaces fragile DOM selectors with a multi-channel evidence record combining invariant rules, semantic descriptions, contextual landmarks, transition witnesses, risk metadata, and negative evidence.

---

## 2. Interface Definition

```typescript
export interface FunctionalCapabilityFingerprint {
  // Functional Invariant Core
  capabilityId: string;
  canonicalFunction: string;
  actionType: ActionType;
  targetEntity: TargetEntity;

  // Predicate Invariants
  mandatoryPreStatePredicates: InvariantPredicate[];
  allowedStateDelta: StateDeltaPredicate[];
  expectedPostState: ExpectedStatePredicate[];
  requiredContextPredicates: ContextPredicate[];
  forbiddenContextPredicates: ContextPredicate[];

  // Evidence Channels
  semanticEvidence: SemanticEvidence;
  contextEvidence: ContextEvidence;
  transitionEvidence: TransitionEvidence;
  riskMetadata: RiskMetadata;
  provenance: Provenance;
  confidence: ConfidenceRecord;
  negativeEvidence: NegativeEvidenceRecord;
}
```

---

## 3. Evidence Channels

### A. Semantic Evidence
Captures human-readable and accessible descriptors:
- `canonicalLabel`: Official name of the function.
- `semanticSynonyms`: Paraphrases and user query patterns.
- `accessibleName`: Calculated accessible name (ARIA label, title, text).
- `role`: ARIA or HTML semantic role (`switch`, `button`, `link`).
- `visibleLabel`: Text rendered on screen.
- `sectionMeaning`: High-level topic descriptor.

### B. Context Evidence
Captures structural and environmental relationships without relying on absolute coordinates:
- `ancestorRelationships`: Hierarchical containers (`section[notifications]`, `main[settings]`).
- `nearbyText`: Text content of adjacent sibling nodes.
- `containerSemantics`: Landmarks enclosing the control.
- `relativeStructuralRelationships`: Normalized path using tag and relative sibling order.
- `urlSemantics`: Semantic path pattern.

### C. Transition Evidence
Defines the expected causal contract of the interaction:
- `preStateFingerprint`: Identifier for expected pre-interaction state.
- `activationEventCharacteristics`: Event type (`click`, `change`), bubbling, and modifier requirements.
- `expectedDelta`: Key-value map of expected application state mutations.
- `postStateFingerprint`: Expected post-state identifier.
- `witnessClasses`: Permissible witness classes (`DOM_MUTATION`, `ACCESSIBILITY_STATE_MUTATION`, etc.).
- `verificationWindowMs`: Bounded temporal interval (e.g. 2000ms).

### D. Risk Metadata
Classifies risk impact:
- `riskClass`: `READ_ONLY`, `REVERSIBLE`, `MEDIUM_IMPACT`, `SENSITIVE`, `SECURITY_SENSITIVE`, `DESTRUCTIVE`, `FINANCIAL`, `IRREVERSIBLE`.
- `requiresConfirmation`: Boolean enforcing manual user authorization.

### E. Negative Evidence
Tracks failed candidates and contradiction patterns to prevent recurring errors:
- `rejectedCandidateIdentities`: Array of candidate IDs known to fail invariants.
- `contradictionPredicates`: Identifiers of triggered negative predicates.
- `failedTransitionWitnesses`: Historical witness failure logs.
