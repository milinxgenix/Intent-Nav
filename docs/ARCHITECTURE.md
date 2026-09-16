# IntentNav-SCFR: System Architecture

## 1. Architectural Philosophy

Modern dynamic web applications undergo rapid presentation and structural drift due to:
- Continuous deployment and A/B testing
- Dynamic CSS-in-JS hashing and utility class generation
- Framework-generated IDs (React, Angular, Ember, Vue)
- Reorganized menu trees, intermediate confirmation dialogs, and responsive layouts
- Adversarial patterns and semantic decoys

Existing automation paradigms (DOM selector replay, keyword search, embedding-only similarity, generic LLM web agents) fail because they treat web elements as presentation targets rather than **functional capability bindings**, lack causal event correlation, and allow semantic similarity to override safety invariants.

**IntentNav-SCFR** establishes a closed-loop, self-adaptive architecture based on:
1. **Persistent Functional Capability Identity**: Decoupling functional capability from interface presentation.
2. **Volatile Feature Suppression**: Systematically stripping transient presentation tokens.
3. **Capability-State Graph**: Separating Capability Nodes from Interface-State Nodes.
4. **Typed Drift Vector**: Localizing presentation, context, structure, capability, and transition drift.
5. **Critical Invariant Closure Gate**: Hard predicate filtering strictly preceding candidate ranking.
6. **Contradiction & Negative Evidence Engine**: Persistent rejection of adversarial decoys.
7. **Causal Transition Verification**: Event correlation requiring $\ge 2$ independent witness classes.
8. **Provisional Route Quarantine & Promotion**: Isolating recovered routes until proven.
9. **Independent Execution Authorization**: Decoupling capability confidence from risk-gated execution.

---

## 2. Core Subsystems & Components

```
+------------------------------------------------------------------------------------+
|                                BROWSER INTERFACE                                   |
|  [DOM Document] <---> [Interface Observer] <---> [Witness Collector]               |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                                INTENT PROCESSING                                   |
|  Natural Language Query  ---> [Intent Normalizer] ---> Canonical Functional Tuple   |
|                                [Resolver]        ---> Capability Identity Query     |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                         TYPED DRIFT LOCALIZATION ENGINE                            |
|  Stored Fingerprint vs Observed State ---> 5D Vector: [P, C, S, Cap, T]            |
|  Threshold Evaluation: Maintain Active | Validate | Rebind Recovery | Quarantine    |
+------------------------------------------------------------------------------------+
                                      |
                   (If Recovery Required: Strict Gated Flow)
                                      v
+------------------------------------------------------------------------------------+
|                         CANDIDATE INVARIANT CLOSURE GATE                           |
|  Observed Candidates ---> [Invariant Closure Engine] (Positive/Negative Predicates)|
|                      ---> [Contradiction Filter]      (Decoy Rejection)            |
|                           * Non-passing candidates purged before ranking *         |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                            POST-GATE RANKING ENGINE                                |
|  Eligible Candidates Pool ---> Weighted Rebind Scoring ---> Top-1 Candidate Winner |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                           ROUTE QUARANTINE & CAUSAL VERIFIER                       |
|  Provisional Route ---> Activation Event ---> Bounded Temporal Window              |
|  Transition Verifier ---> Checks >=2 Witness Classes & State Delta Match           |
|  Promotion Controller ---> Promoted to ACTIVE_VALIDATED (or Quarantined)           |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                        INDEPENDENT EXECUTION AUTHORIZATION                         |
|  Capability Confidence != Execution Authorization                                  |
|  Risk Classifier (LOW / MEDIUM / HIGH) ---> Evidence Quorum Evaluator              |
|  Policy Engine ---> EXECUTED | CONFIRMATION_PENDING | ABSTAINED                     |
+------------------------------------------------------------------------------------+
                                      |
                                      v
+------------------------------------------------------------------------------------+
|                         RESEARCH AUDIT LOG & EVIDENCE EXPORT                       |
|  Frozen Append-Only Audit Records ---> JSON / CSV / Evidence Packages               |
+------------------------------------------------------------------------------------+
```

---

## 3. Directory Layout & Module Responsibilities

- **`src/types/`**: Strongly typed domain models (fingerprints, states, drift, invariants, transitions, authorization, audit).
- **`src/core/fingerprint/`**: Construction of capability fingerprints and volatile attribute suppression.
- **`src/core/graph/`**: Graph engine separating Capability Nodes from Interface-State Nodes and versioned route management.
- **`src/core/intent/`**: Local-first intent normalization and functional capability resolution.
- **`src/core/drift/`**: 5D typed drift vector computation and threshold-based action decider.
- **`src/core/invariant/`**: Positive and negative predicates and hard invariant closure engine.
- **`src/core/contradiction/`**: Persistent store for failed candidates and decoy signatures.
- **`src/core/candidate/`**: Candidate discovery and the pipeline enforcing invariant closure before ranking.
- **`src/core/ranking/`**: Multi-channel scoring engine for invariant-passing candidates.
- **`src/core/causal/`**: Activation event correlation and multi-class transition witness verification.
- **`src/core/quarantine/`**: Route quarantine, promotion, demotion, and rollback.
- **`src/core/authorization/`**: Risk classification, evidence quorum check, and authorization controller.
- **`src/core/audit/`**: Immutable append-only research audit trail.
- **`src/core/stateMachine/`**: Central controller state machine.
- **`src/browser/`**: Manifest V3 extension observer, background service worker, and content script.
- **`src/ui/`**: Dual-mode extension popup (Normal User Mode & Research / Debug Mode).
- **`mock-sites/`**: Controlled experimental portals (Sites A, B, C, D).
- **`test/`**: Unit tests, 26 adversarial matrix scenarios (A-Z), and 10 formal safety properties.
- **`benchmark/`**: 60-intent benchmark harness and 4 comparative baseline architectures.
- **`docs/`**: Complete patent specification, coverage matrix, and technical documentation.
