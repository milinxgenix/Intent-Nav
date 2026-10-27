# IntentNav-SCFR: IDF-B Implementation Evidence Matrix
**Document Identifier:** `INTENTNAV-IDF-B-IEM-2026-V1`
**Project Owner / Inventor / Sole Implementer:** MILIND
**Date:** October 26, 2026
**Status:** Audited Engineering Evidence Matrix (Multi-Tier Classification of Implementation & Verification States)
**Controlling Authority Priority:** `v6.docx` (Controlling Priority 1) $\to$ `patent.docx` (Secondary Priority 2) $\to$ `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` (Tertiary Priority 3)
**Git Anchor:** Branch `patent-hardening-phase-2-batch-b-capability-routing` (`bc4a34be60dc58e45dab60a657d4e0009ab77798`)

---

## 1. Evidentiary Standards & Multi-Tier Classification Taxonomy

To provide faculty, technical auditors, and registered patent practitioners with a forensically defensible assessment, this matrix avoids blanket claims of complete demonstration. An entire claim or clause is never classified as demonstrated simply because some underlying code exists or an isolated unit test passes.

### Multi-Tier Evidence State Taxonomy:
- **`REAL_CHROMIUM_TESTED`:** The limitation is actively executed, observed, and validated inside a real Google Chrome browser runtime (Chrome 155.0.8059.85) communicating over the Chrome DevTools Protocol (CDP) on controlled mock-site fixtures.
- **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`:** The limitation is demonstrated across the 13 controlled interface mutation fixtures in the integrated benchmark runner, with recorded telemetry isolating the specific failure mode in simulation.
- **`INTEGRATION_TESTED_IN_SIMULATION`:** The limitation is verified across multiple collaborating engine subsystems inside the Node.js/JSDOM simulation environment (e.g., state machine integration, candidate pipeline, route graph management).
- **`IMPLEMENTED_AND_UNIT_TESTED`:** The limitation is implemented in production TypeScript source code (`src/`) and validated in isolation by unit tests or formal machine property tests.
- **`PARTIALLY_DEMONSTRATED`:** The limitation is implemented and validated under specific constrained conditions, but relies on engineering heuristics or bounded catalog configurations rather than arbitrary, unconstrained runtime execution (e.g., regex-based intent extraction rather than general-purpose NLP; 12-rule volatile feature suppression rather than universal obfuscation handling).
- **`UNTESTED_AT_WEB_SCALE`:** The limitation is structurally implemented and tested on local mock environments, but has not been subjected to live, multi-domain web-scale testing against arbitrary third-party commercial production sites.

---

## 2. Independent Claim 1: Clause-by-Clause Implementation Matrix

### Claim 1 Preamble
* **Limitation Text:**
  `1. A computer-implemented method for adaptive navigation of an asynchronous web interface, comprising:`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183
  - `patent.docx`: ¶ 183
  - `Merged_Final_v3.docx`: ¶ 254
* **Production Implementation Code:**
  - Symbol: `IntentNavSCFR` runtime exports & lifecycle orchestrator
  - File: [`src/index.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/index.ts#L1-L29) (Lines 1–29)
* **Automated Regression / Verification Test:**
  - Test File: [`test/unit/step11_benchmark_integrity.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step11_benchmark_integrity.spec.ts#L30-L50)
  - Suite / Case: `"Step 11: Benchmark Integrity" -> "captures complete environment, Git revision, platform, dataset hash, and config provenance"`
  - Primary Assertion: `expect(prov.runId).toBeDefined()`, `expect(result.telemetry).toBeDefined()`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/step11_benchmark_integrity.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json`
  - `evidence/chromium_e2e_evidence.json`
* **Evidence Classification:** **`INTEGRATION_TESTED_IN_SIMULATION` & `REAL_CHROMIUM_TESTED`**
* **Limitations, Assumptions & Boundaries:**
  Governs the end-to-end method orchestration. Validated across 13 mutation fixtures in Node.js/JSDOM and across 10 positive / 14 negative scenarios in Google Chrome 155.0.8059.85 over CDP on local mock sites. Does not assert execution across arbitrary untracked public internet websites.

---

### Claim 1 Clause (a): Natural-Language Objective Ingestion
* **Limitation Text:**
  `(a) receiving, by a browser-resident processing subsystem, a natural-language objective specifying a requested functional operation;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 18
  - `patent.docx`: ¶ 183, ¶ 18
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 31
* **Production Implementation Code:**
  - Symbols: `IntentNormalizer.normalize()`, `CapabilityIntentResolver.resolve()`
  - Files:
    - [`src/core/intent/normalizer.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/intent/normalizer.ts#L9-L132) (Lines 9–132)
    - [`src/core/intent/resolver.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/intent/resolver.ts#L18-L104) (Lines 18–104)
    - [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L180-L220) (Lines 180–220: state `INTENT_RECEIVED` $\to$ `INTENT_NORMALIZED`)
* **Automated Regression / Verification Test:**
  - Test File: [`test/unit/intent.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/intent.spec.ts#L15-L85)
  - Suite / Case: `"IntentNormalizer" -> "normalizes raw goals into typed actions and target entities"`
  - Primary Assertion: `expect(normalized.actionType).toBe('MODIFY_PREFERENCE')`, `expect(normalized.targetEntity).toBe('MARKETING_NOTIFICATIONS')`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/intent.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json` (Fields: `rawGoal`, `normalizedIntent`)
  - `evidence/chromium_e2e_evidence.json` (Scenarios A–J intent payloads)
* **Evidence Classification:** **`PARTIALLY_DEMONSTRATED`**
* **Limitations, Assumptions & Boundaries:**
  *Why Partially Demonstrated:* The engine parses natural language locally within the browser runtime without external network calls (satisfying local execution), but relies on deterministic regex tokenization, synonym matching, and sensitivity keyword detection. It does not embed a general-purpose on-device LLM. Complex colloquial or ambiguous phrasing outside the domain lexicon triggers fallback or abstention.

---

### Claim 1 Clause (b): Multi-Source Interface Evidence Acquisition
* **Limitation Text:**
  `(b) observing a live interface and obtaining multi-source interface evidence comprising document-structure evidence, accessibility evidence, semantic evidence, contextual-neighborhood evidence, and transition-state evidence;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 19, ¶ 62
  - `patent.docx`: ¶ 183, ¶ 19, ¶ 62
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 32, ¶ 75
* **Production Implementation Code:**
  - Symbols: `InterfaceObserver.captureInterfaceState()`, `DOMObserver`
  - Files:
    - [`src/browser/observer/interfaceObserver.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/browser/observer/interfaceObserver.ts#L19-L112) (Lines 19–112)
    - [`src/types/state.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/state.ts#L15-L45) (`InterfaceStateNode` interface)
* **Automated Regression / Verification Test:**
  - Test File: [`test/unit/step04_raw_evidence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step04_raw_evidence.spec.ts#L10-L75)
  - Suite / Case: `"Raw Evidence Extraction" -> "extracts 5-channel multi-source evidence from live DOM"`
  - Primary Assertion: Verifies capture of `domStructuralHash`, accessible roles/labels, semantic landmarks, active dialogs/tabs, and application state.
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/step04_raw_evidence.spec.ts`
* **Primary Evidence Artifact:**
  - `evidence/chromium_e2e_evidence.json` (Contains full `interfaceState` snapshots for Scenarios A–J)
  - Validated by `npm run validate:evidence`
* **Evidence Classification:** **`REAL_CHROMIUM_TESTED`**
* **Limitations, Assumptions & Boundaries:**
  Demonstrated in real Chromium for standard DOM and modal dialogs on local mock sites. Does not penetrate cross-origin `<iframe>` elements or closed Shadow DOM roots where browser security policy blocks content script inspection.

---

### Claim 1 Clause (c): Functional Capability Fingerprint & Volatile Feature Suppression
* **Limitation Text:**
  `(c) generating or retrieving a persistent Functional Capability Fingerprint for a capability, the fingerprint comprising a canonical capability identity tuple having at least an action type, a target entity, mandatory pre-state predicates, an allowed state delta, an expected post-state, required contextual predicates, forbidden contextual or functional predicates, a transition signature, and a risk class, wherein volatile presentation attributes are excluded from identity-bearing features or assigned a reduced identity weight;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 21, ¶ 64–74
  - `patent.docx`: ¶ 183, ¶ 21, ¶ 64–74
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 34, ¶ 77–88
* **Production Implementation Code:**
  - Symbols: `CapabilityFingerprintConstructor.buildFingerprint()`, `VolatileFeatureSuppressor.suppressVolatileFeatures()`
  - Files:
    - [`src/core/fingerprint/constructor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts#L39-L180) (Lines 39–180)
    - [`src/core/fingerprint/suppressor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/suppressor.ts#L50-L160) (Lines 50–160)
    - [`src/types/capability.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/capability.ts#L20-L80)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/fingerprint.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/fingerprint.spec.ts#L20-L110)
    - [`test/unit/suppression.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/suppression.spec.ts#L15-L95)
  - Suite / Case: `"VolatileFeatureSuppressor" -> "strips generated IDs, hashes, and transient styling classes"`
  - Primary Assertion: `expect(suppression.cleanedText).not.toContain('v2-')`, `expect(fingerprint.canonicalIdentityHash).toBe(expectedHash)`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/fingerprint.spec.ts test/unit/suppression.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json` (Fixtures `MUT_ID_01` & `MUT_ID_02` rebind successfully despite randomized ID prefixes/suffixes)
* **Evidence Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Limitations, Assumptions & Boundaries:**
  Volatile feature suppression relies on 12 explicit regex patterns covering common frameworks (React, Angular, Tailwind, auto-increment IDs). Obfuscation patterns outside these 12 patterns are not handled automatically.

---

### Claim 1 Clause (d): Capability-State Graph & Distinct Route Versions
* **Limitation Text:**
  `(d) maintaining a capability-state graph in which a persistent capability node is distinct from transient interface-state nodes and is associated with a plurality of route versions;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 22, ¶ 75–84
  - `patent.docx`: ¶ 183, ¶ 22, ¶ 75–84
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 35, ¶ 89–98
* **Production Implementation Code:**
  - Symbols: `CapabilityGraphEngine`, `RouteManager`
  - Files:
    - [`src/core/graph/capabilityGraph.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/capabilityGraph.ts#L16-L164) (Lines 16–164)
    - [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L22-L217) (Lines 22–217)
* **Automated Regression / Verification Test:**
  - Test File: [`test/unit/graph.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/graph.spec.ts#L20-L130)
  - Suite / Case: `"CapabilityGraph" -> "associates multiple route versions with single persistent capability node"`
  - Primary Assertion: `expect(capNode.routes.length).toBeGreaterThan(1)`, `expect(capNode.nodeType).toBe('CAPABILITY')`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/graph.spec.ts`
* **Primary Evidence Artifact:**
  - `evidence/chromium_route_rollback_evidence.json` (Scenario K: tracks active v1, provisional v2, demoted v2, restored v1)
  - Validated by `npm run validate:rollback`
* **Evidence Classification:** **`REAL_CHROMIUM_TESTED` & `INTEGRATION_TESTED_IN_SIMULATION`**
* **Limitations, Assumptions & Boundaries:**
  Graph topology is maintained in memory and synchronized to `chrome.storage.local`. Validated in single-page and tab contexts; does not manage cross-browser window routing topologies.

---

### Claim 1 Clause (e): Intent-to-Capability Matching & Route Retrieval
* **Limitation Text:**
  `(e) matching the natural-language objective to the persistent capability node and obtaining a previously validated route version;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 23, ¶ 85
  - `patent.docx`: ¶ 183, ¶ 23, ¶ 85
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 36, ¶ 99
* **Production Implementation Code:**
  - Symbols: `CapabilityIntentResolver.resolve()`, `RouteManager.getActiveRoute()`
  - Files:
    - [`src/core/intent/resolver.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/intent/resolver.ts#L18-L104) (Lines 18–104)
    - [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L45-L80) (Lines 45–80)
* **Automated Regression / Verification Test:**
  - Test File: [`test/unit/intent.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/intent.spec.ts#L90-L140)
  - Suite / Case: `"CapabilityIntentResolver" -> "resolves normalized intent to registered capability and active route"`
  - Primary Assertion: `expect(matchResult[0].capabilityId).toBe('CAP_TOGGLE_MARKETING')`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/intent.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json`
  - `evidence/chromium_e2e_evidence.json` (Scenarios A–J)
* **Evidence Classification:** **`PARTIALLY_DEMONSTRATED`**
* **Limitations, Assumptions & Boundaries:**
  *Why Partially Demonstrated:* Requires pre-registered capability nodes in the authoritative capability catalog (`AUTHORITATIVE_CAPABILITY_CATALOG`). It does not autonomously synthesize new capabilities from scratch for uncataloged arbitrary websites.

---

### Claim 1 Clause (f): 5D Typed Interface-Drift Vector Generation
* **Limitation Text:**
  `(f) generating a typed interface-drift vector by comparing stored and live evidence, the vector distinguishing at least presentation drift from one or more of contextual drift, structural drift, capability drift, and transition drift;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 24, ¶ 86–95
  - `patent.docx`: ¶ 183, ¶ 24, ¶ 86–95
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 37, ¶ 100–109
* **Production Implementation Code:**
  - Symbols: `TypedDriftDetector.calculateTypedDrift()`, `DriftClassifier.classify()`
  - Files:
    - [`src/core/drift/detector.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/detector.ts#L84-L481) (Lines 84–481)
    - [`src/core/drift/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts#L23-L127) (Lines 23–127)
    - [`src/types/drift.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/drift.ts#L10-L40)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/drift_matrix.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/drift_matrix.spec.ts#L15-L120)
    - [`test/unit/presentation_drift.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/presentation_drift.spec.ts#L10-L80)
    - [`test/adversarial/matrix.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/adversarial/matrix.spec.ts#L30-L70) (Scenario Z)
  - Suite / Case: `"TypedDriftDetector" -> "distinguishes presentation drift from structural and capability drift"`
  - Primary Assertion: `expect(vector.presentation).toBeGreaterThan(0.5)`, `expect(vector.capability).toBe(0.0)`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/drift_matrix.spec.ts test/unit/presentation_drift.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json` (Logs continuous 5D drift vectors across all 13 mutation fixtures)
* **Evidence Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Limitations, Assumptions & Boundaries:**
  Vector generation relies on normalized Levenshtein string metrics, Jaccard token overlap, tree-edit distance, and exact delta comparisons. Evaluated across 13 controlled fixtures; compound multi-axis drift in uncontrolled enterprise sites may exhibit non-linear interactions.

---

### Claim 1 Clause (g): Replay Inhibition & Live Candidate Generation
* **Limitation Text:**
  `(g) inhibiting replay of the previously validated route when the typed interface-drift vector satisfies a re-binding condition and generating live candidate controls associated with the persistent capability node;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 25, ¶ 96–97
  - `patent.docx`: ¶ 183, ¶ 25, ¶ 96–97
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 38, ¶ 110–111
* **Production Implementation Code:**
  - Symbols: `DriftClassifier.evaluateDriftAction()`, `CandidatePipeline.discoverCandidates()`, `CandidateGenerator`
  - Files:
    - [`src/core/drift/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts#L30-L75) (Lines 30–75)
    - [`src/core/candidate/pipeline.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/pipeline.ts#L25-L96) (Lines 25–96)
    - [`src/core/candidate/generator.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/generator.ts#L15-L82) (Lines 15–82)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/drift_live_integration.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/drift_live_integration.spec.ts#L15-L85)
    - [`test/unit/step14_17_integrated_validation.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step14_17_integrated_validation.spec.ts#L40-L95)
  - Suite / Case: `"CandidatePipeline" -> "inhibits replay and generates candidates upon structural drift"`
  - Primary Assertion: `expect(actionRequired).toBe('TRIGGER_REBIND_RECOVERY')`, `expect(candidates.length).toBeGreaterThan(0)`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/drift_live_integration.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_ablation_runs.json` (Ablation `NO_DRIFT_REBIND` fails in 9 of 13 fixtures due to blind replay)
* **Evidence Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Limitations, Assumptions & Boundaries:**
  Presentation drift alone ($D_{\text{pres}} \ge 0.90, D_{\text{str}} = 0.0, D_{\text{cap}} = 0.0$) does not inhibit replay, avoiding unnecessary re-binding. Structural or capability drift exceeding thresholds triggers candidate extraction from the live DOM.

---

### Claim 1 Clause (h): Invariant-Closure Gate
* **Limitation Text:**
  `(h) applying an invariant-closure gate to each candidate, the gate requiring satisfaction of mandatory action, target, pre-state, allowed-state-delta, post-state-compatibility, and required-context predicates and rejecting the candidate upon satisfaction of a forbidden predicate;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 26, ¶ 98
  - `patent.docx`: ¶ 183, ¶ 26, ¶ 98
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 39, ¶ 112
* **Production Implementation Code:**
  - Symbols: `InvariantClosureEngine.evaluateCandidate()`, `DeclarativePredicateEvaluator`
  - Files:
    - [`src/core/invariant/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/engine.ts#L38-L291) (Lines 38–291)
    - [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L20-L144) (Lines 20–144)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/invariant.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant.spec.ts#L15-L115)
    - [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L20-L90)
    - [`test/properties/properties.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/properties/properties.spec.ts#L25-L60) (Property 1: Invariant Firewall Primacy)
  - Suite / Case: `"InvariantClosureEngine" -> "strictly rejects candidates failing mandatory action or matching forbidden predicate"`
  - Primary Assertion: `expect(result.status).toBe('FAIL')`, `expect(result.failedPredicates.length).toBeGreaterThan(0)`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/invariant.spec.ts test/properties/properties.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json` (`MUT_RISK_01`, `MUT_RISK_02`, `MUT_SEM_02` blocked)
  - `benchmark/results/phase3/phase3_ablation_runs.json` (Ablation `NO_FINGERPRINT_INVARIANT` causes immediate safety leakage)
* **Evidence Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Limitations, Assumptions & Boundaries:**
  Evaluates 10 invariant classes via boolean evaluation. Binary gate: failure of any mandatory predicate drops candidate immediately. Does not evaluate dynamic visual styling invariants (e.g. element color contrast or font weight).

---

### Claim 1 Clause (i): Post-Gating Re-Binding Score Calculation
* **Limitation Text:**
  `(i) only after a candidate passes the invariant-closure gate, calculating a re-binding score using semantic fit, contextual fit, transition fit, validation history, contradiction evidence, and route staleness;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 27, ¶ 99–101
  - `patent.docx`: ¶ 183, ¶ 27, ¶ 99–101
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 40, ¶ 113–115, ¶ 262
* **Production Implementation Code:**
  - Symbols: `CandidateRankingEngine.rankCandidates()`, `CandidateRankingEngine.computeSemanticSimilarity()`
  - Files:
    - [`src/core/ranking/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/ranking/engine.ts#L35-L390) (Lines 35–390)
    - [`src/types/ranking.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/ranking.ts#L10-L45)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/ranking_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/ranking_verification.spec.ts#L15-L100)
    - [`test/unit/semantic_precedence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/semantic_precedence.spec.ts#L10-L75)
  - Suite / Case: `"CandidateRankingEngine" -> "enforces invariant gate before calculating rebind score"`
  - Primary Assertion: Invariant-failed candidates are pruned before ranking; high semantic similarity ($0.98$) cannot rescue a failed predicate.
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/ranking_verification.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json`
* **Evidence Classification:** **`IMPLEMENTED_AND_UNIT_TESTED`**
* **Limitations, Assumptions & Boundaries:**
  Scoring is linear combination over weights configured in code (`0.35` semantic, `0.25` context, `0.20` transition, `0.10` history, `0.10` invariant fit, minus staleness penalty). Patent disclosure defines general multi-factor formulation without restricting invention to these specific constants.

---

### Claim 1 Clause (j): Provisional Route Version & Validation Record
* **Limitation Text:**
  `(j) creating a provisional route version and a machine-readable validation record for a selected candidate, the validation record storing at least the candidate identity, typed drift vector, invariant results, contradiction results, route version identifier, and transition-verification state;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 28, ¶ 102–104
  - `patent.docx`: ¶ 183, ¶ 28, ¶ 102–104
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 41, ¶ 116–118
* **Production Implementation Code:**
  - Symbols: `RouteManager.createProvisionalRoute()`, `AuditLogger.createValidationRecord()`
  - Files:
    - [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L85-L135) (Lines 85–135)
    - [`src/core/audit/logger.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/audit/logger.ts#L15-L85) (Lines 15–85)
    - [`src/types/transition.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts#L40-L75)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/audit.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/audit.spec.ts#L15-L85)
    - [`test/unit/step08_multistep_route_planning.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step08_multistep_route_planning.spec.ts#L35-L90)
  - Suite / Case: `"AuditLogger" -> "creates machine-readable validation record with complete verification state"`
  - Primary Assertion: `expect(record.validationRecordId).toBeDefined()`, `expect(record.typedDriftVector).toBeDefined()`, `expect(record.routeState).toBe('PROVISIONAL')`
* **Reproducible Execution Command:**
  `npm run validate:evidence`
* **Primary Evidence Artifact:**
  - `evidence/chromium_e2e_evidence.json` (10 scenarios pass all 10 schema checks with 30-field audit records)
* **Evidence Classification:** **`REAL_CHROMIUM_TESTED`**
* **Limitations, Assumptions & Boundaries:**
  Validation records are serialized in JSON format in the browser environment. Monotonic millisecond timestamps are derived from JavaScript runtime clocks.

---

### Claim 1 Clause (k): Safe Verification, Bounded Interval & Causal Witness Quorum
* **Limitation Text:**
  `(k) performing a safe, non-destructive or reversible verification operation when permitted and correlating an activation event produced by the selected candidate with an ordered transition signature comprising an expected state delta and a bounded verification interval containing one or more independent transition witnesses, and accepting the candidate only when the observed witnesses are causally consistent with the expected transition signature;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 29, ¶ 105–118
  - `patent.docx`: ¶ 183, ¶ 29, ¶ 105–118
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 42, ¶ 119–132
* **Production Implementation Code:**
  - Symbols: `SafeVerificationController.assessVerificationSafety()`, `CausalTransitionVerifier.verifyTransition()`, `WitnessCollector.collect()`
  - Files:
    - [`src/core/causal/safeVerification.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/safeVerification.ts#L26-L154) (Lines 26–154)
    - [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts#L41-L750) (Lines 41–750)
    - [`src/core/causal/witnessCollector.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/witnessCollector.ts#L18-L115) (Lines 18–115)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/causal.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/causal.spec.ts#L20-L160)
    - [`test/unit/step09_safe_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step09_safe_verification.spec.ts#L15-L85)
    - [`test/unit/step10_network_acknowledgement.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step10_network_acknowledgement.spec.ts#L20-L95)
  - Suite / Case: `"CausalTransitionVerifier" -> "correlates activation event with multi-class witnesses within tau <= 250ms"`
  - Primary Assertion: `expect(result.causallyVerified).toBe(true)`, `expect(result.verifiedWitnessClasses.length).toBeGreaterThanOrEqual(2)`
* **Reproducible Execution Command:**
  `npm run validate:witness-classes`
* **Primary Evidence Artifact:**
  - `evidence/chromium_witness_class_evidence.json` (Validates 6 distinct witness classes across 5 Chrome scenarios)
* **Evidence Classification:** **`REAL_CHROMIUM_TESTED`**
* **Limitations, Assumptions & Boundaries:**
  Default verification window $\tau \le 250\text{ ms}$ (extensible to $500\text{ ms}$ for network ACKs). In high-latency networks where RTT exceeds $500\text{ ms}$, the system times out and quarantines the route rather than falsely certifying success.

---

### Claim 1 Clause (l): Route Promotion & Quarantined Negative Evidence
* **Limitation Text:**
  `(l) promoting the provisional route version to an active validated route only when the invariant-closure gate and transition-verification acceptance condition are satisfied, while storing failed or contradictory candidates as quarantined negative evidence associated with the failed predicate or evidence signature;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 30, ¶ 119–124
  - `patent.docx`: ¶ 183, ¶ 30, ¶ 119–124
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 43, ¶ 133–138
* **Production Implementation Code:**
  - Symbols: `RoutePromotionController.promoteRoute()`, `NegativeEvidenceStore.recordContradiction()`, `QuarantineController`
  - Files:
    - [`src/core/quarantine/promotion.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/promotion.ts#L19-L84) (Lines 19–84)
    - [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts#L17-L115) (Lines 17–115)
    - [`src/core/quarantine/controller.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/controller.ts#L12-L75) (Lines 12–75)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/quarantine.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/quarantine.spec.ts#L15-L125)
    - [`test/unit/step06_negative_evidence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step06_negative_evidence.spec.ts#L15-L85)
  - Suite / Case: `"RoutePromotionController" -> "promotes route only upon valid verification token"`
  - Primary Assertion: `expect(promotedRoute.state).toBe('VALIDATED')`, `expect(negEvidenceStore.hasContradiction(capId, handleId)).toBe(true)`
* **Reproducible Execution Command:**
  `npm run validate:evidence:neg`
* **Primary Evidence Artifact:**
  - `evidence/chromium_e2e_negative_evidence.json` (Scenarios N1–N14 quarantined in Chrome)
  - `benchmark/results/phase3/phase3_full_system_runs.json` (6 routes promoted, 2 quarantined in benchmark)
* **Evidence Classification:** **`REAL_CHROMIUM_TESTED` & `EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Limitations, Assumptions & Boundaries:**
  Promotion requires joint satisfaction: Invariant Closure = PASS AND Causal Verification = TRUE. Negative evidence caching is evaluated under local mock site conditions; cache eviction under long-running multi-day sessions has not been evaluated.

---

### Claim 1 Clause (m): Separation of Capability Confidence from Execution Authorization
* **Limitation Text:**
  `(m) maintaining capability confidence separately from execution authorization, wherein execution authorization is determined by an operation-risk policy independently of the capability-confidence value;`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 31, ¶ 125–130
  - `patent.docx`: ¶ 183, ¶ 31, ¶ 125–130
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 44, ¶ 139–144
* **Production Implementation Code:**
  - Symbols: `ExecutionAuthorizationController.authorize()`, `RiskClassifier.classifyRisk()`, `EvidenceQuorumEvaluator`
  - Files:
    - [`src/core/authorization/controller.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/controller.ts#L29-L155) (Lines 29–155)
    - [`src/core/authorization/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/classifier.ts#L14-L65) (Lines 14–65)
    - [`src/core/authorization/quorum.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/quorum.ts#L11-L52) (Lines 11–52)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/authorization.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/authorization.spec.ts#L20-L140)
    - [`test/properties/properties.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/properties/properties.spec.ts#L70-L105) (Property 3: Independence of Confidence and Authorization)
  - Suite / Case: `"ExecutionAuthorizationController" -> "denies high-risk execution despite 1.0 capability confidence when policy requires confirmation"`
  - Primary Assertion: `expect(decision.authorized).toBe(false)`, `expect(decision.policyState).toBe('CONFIRMATION_REQUIRED')`
* **Reproducible Execution Command:**
  `npm run test:unit test/unit/authorization.spec.ts test/properties/properties.spec.ts`
* **Primary Evidence Artifact:**
  - `benchmark/results/phase3/phase3_full_system_runs.json` (Fixtures `MUT_RISK_01` and `MUT_RISK_02` blocked from unconfirmed execution)
  - `benchmark/results/phase3/phase3_ablation_runs.json` (Ablation `NO_RISK_GATING` bypassed policy in 13/13 trials)
* **Evidence Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Limitations, Assumptions & Boundaries:**
  Evaluated on risk-tier categories: LOW, MEDIUM, HIGH (DESTRUCTIVE, FINANCIAL, IRREVERSIBLE). Demonstrated on simulated bank transfer commit and account deletion fixtures.

---

### Claim 1 Clause (n): Dispatch / Abstention / Confirmation State Machine Dispatch
* **Limitation Text:**
  `(n) dispatching the requested operation only when the execution-authorization condition is satisfied, and otherwise entering an abstention, ranked-suggestion, or confirmation-required state according to the operation-risk policy.`
* **Authoritative Source References:**
  - `v6.docx`: ¶ 183, ¶ 32, ¶ 131–138
  - `patent.docx`: ¶ 183, ¶ 32, ¶ 131–138
  - `Merged_Final_v3.docx`: ¶ 254, ¶ 45, ¶ 145–152
* **Production Implementation Code:**
  - Symbols: `SystemStateMachine.step()`, `SystemMachineState` (`CONFIRMATION_PENDING`, `ABSTAINED`, `QUARANTINED`, `EXECUTED`)
  - Files:
    - [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L82-L102) (Lines 82–102, Lines 350–430)
* **Automated Regression / Verification Test:**
  - Test Files:
    - [`test/unit/false_success.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/false_success.spec.ts#L15-L95)
    - [`test/adversarial/matrix.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/adversarial/matrix.spec.ts#L80-L150) (Scenarios W, X, Y)
  - Suite / Case: `"SystemStateMachine" -> "transitions to ABSTAINED or CONFIRMATION_PENDING when authorization is withheld"`
  - Primary Assertion: `expect(machine.currentState).toBe('CONFIRMATION_PENDING')`
* **Reproducible Execution Command:**
  `npm run test:adversarial`
* **Primary Evidence Artifact:**
  - `evidence/chromium_e2e_negative_evidence.json` (Validates abstention and confirmation-required states in N13/N14)
* **Evidence Classification:** **`REAL_CHROMIUM_TESTED`**
* **Limitations, Assumptions & Boundaries:**
  States are fully decoupled. In automated testbeds, `CONFIRMATION_PENDING` terminates the trial safely without dispatching events. UI dialog rendering for human user confirmation is implemented in `src/ui/popup.ts`.

---

## 3. Dependent Claims 2–18 Implementation Matrix

### Claim 2: Exclusion of Volatile Presentation Attributes from Capability Identity
* **Limitation Text:** `2. The method of claim 1, wherein volatile presentation attributes comprise generated DOM identifiers, transient framework classes, randomized tokens, exact coordinates, session-specific labels, or equivalent short-lived attributes, and the volatile attributes are prevented from independently establishing capability identity.`
* **Controlling Source:** `v6.docx` ¶ 185; `patent.docx` ¶ 185; `Merged_Final_v3.docx` ¶ 256
* **Code Reference:** [`src/core/fingerprint/suppressor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/suppressor.ts#L50-L160) (`VolatileFeatureSuppressor`)
* **Test Reference:** [`test/unit/suppression.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/suppression.spec.ts#L15-L85)
* **Test Command:** `npm run test:unit test/unit/suppression.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json` (`MUT_ID_01`, `MUT_ID_02` rebind successfully)
* **Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Boundaries:** 12 regex filters suppress framework tokens; arbitrary non-standard hex hashing outside these filters is not covered.

---

### Claim 3: Invariant Closure Normalization into Positive and Negative Predicates
* **Limitation Text:** `3. The method of claim 1, wherein the canonical capability identity tuple is normalized into an invariant closure comprising positive predicates that must hold and negative predicates that must not hold, and a candidate failing any mandatory positive predicate or satisfying any negative predicate is rejected before similarity ranking.`
* **Controlling Source:** `v6.docx` ¶ 186; `patent.docx` ¶ 186; `Merged_Final_v3.docx` ¶ 257
* **Code Reference:** [`src/core/invariant/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/engine.ts#L42-L135) (`InvariantClosureEngine`)
* **Test Reference:** [`test/unit/invariant.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant.spec.ts#L30-L95)
* **Test Command:** `npm run test:unit test/unit/invariant.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json` (`MUT_RISK_01`, `MUT_RISK_02`)
* **Classification:** **`IMPLEMENTED_AND_UNIT_TESTED`**
* **Boundaries:** Binary evaluation logic; does not perform probabilistic fuzzy predicate relaxation.

---

### Claim 4: 5-Channel Drift Vector & Presentation-Only Drift Bypass
* **Limitation Text:** `4. The method of claim 1, wherein the typed interface-drift vector comprises separate measurements for presentation, context, structure, capability semantics, and transition behavior, and wherein presentation-only drift does not by itself invalidate an otherwise verified route.`
* **Controlling Source:** `v6.docx` ¶ 187; `patent.docx` ¶ 187; `Merged_Final_v3.docx` ¶ 258
* **Code Reference:** [`src/core/drift/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts#L23-L60) (`DriftClassifier`)
* **Test Reference:** [`test/unit/presentation_drift.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/presentation_drift.spec.ts#L15-L65); [`test/adversarial/matrix.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/adversarial/matrix.spec.ts#L45-L75) (Scenario Z)
* **Test Command:** `npm run test:unit test/unit/presentation_drift.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json`
* **Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Boundaries:** Threshold configured at $0.90$ for presentation-only drift bypass.

---

### Claim 5: Gated Re-Binding Scoring (Similarity Cannot Compensate for Invariant Failure)
* **Limitation Text:** `5. The method of claim 1, wherein the re-binding score is evaluated only for candidates that pass the invariant-closure gate, such that semantic similarity cannot compensate for failure of a mandatory functional predicate.`
* **Controlling Source:** `v6.docx` ¶ 188; `patent.docx` ¶ 188; `Merged_Final_v3.docx` ¶ 259
* **Code Reference:** [`src/core/ranking/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/ranking/engine.ts#L121-L150) (`CandidateRankingEngine`)
* **Test Reference:** [`test/unit/semantic_precedence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/semantic_precedence.spec.ts#L20-L85)
* **Test Command:** `npm run test:unit test/unit/semantic_precedence.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json` (`MUT_SEM_02` decoy rejected)
* **Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Boundaries:** Architectural non-compensatory gating verified on adversarial keyword-stuffed button fixtures.

---

### Claim 6: Contradiction Predicates & Decoy Rejection
* **Limitation Text:** `6. The method of claim 1, wherein a contradiction predicate identifies at least one decoy action, target entity, forbidden destination state, incompatible post-state, or incompatible transition, whereby a candidate having a higher semantic similarity than an accepted candidate is nevertheless rejected.`
* **Controlling Source:** `v6.docx` ¶ 189; `patent.docx` ¶ 189; `Merged_Final_v3.docx` ¶ 260
* **Code Reference:** [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts#L17-L80) (`NegativeEvidenceStore`)
* **Test Reference:** [`test/unit/step06_negative_evidence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step06_negative_evidence.spec.ts#L15-L80)
* **Test Command:** `npm run test:unit test/unit/step06_negative_evidence.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json` (0 decoys triggered in B5 vs 1 in B2 Keyword Match comparator)
* **Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Boundaries:** Contradictions identified based on recorded negative evidence signatures and explicit decoy metadata.

---

### Claim 7: Ordered Transition Signature & $\ge 2$ Independent Witness Classes
* **Limitation Text:** `7. The method of claim 1, wherein the transition signature specifies an ordered sequence comprising a pre-state, a candidate activation event, an expected state delta, a verification interval, and a post-state, and wherein at least two independently observable witness classes are correlated within the verification interval before route promotion.`
* **Controlling Source:** `v6.docx` ¶ 190; `patent.docx` ¶ 190; `Merged_Final_v3.docx` ¶ 261
* **Code Reference:** [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts#L41-L150) (`CausalTransitionVerifier`)
* **Test Reference:** [`test/unit/causal.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/causal.spec.ts#L25-L95); [`test/unit/ordering.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/ordering.spec.ts#L15-L75)
* **Test Command:** `npm run test:unit test/unit/causal.spec.ts`
* **Primary Evidence:** `evidence/chromium_witness_class_evidence.json` (All 5 tested scenarios demonstrate $\ge 2$ independent classes)
* **Classification:** **`REAL_CHROMIUM_TESTED`**
* **Boundaries:** Verified across 5 specific scenarios on local mock sites in real Chromium.

---

### Claim 8: Multi-Class Transition Witnesses (6 Distinct Classes)
* **Limitation Text:** `8. The method of claim 1, wherein a transition witness is selected from DOM mutation, accessibility-state mutation, history-state mutation, client-side route-state mutation, application-state mutation, or an asynchronous transaction acknowledgement.`
* **Controlling Source:** `v6.docx` ¶ 191; `patent.docx` ¶ 191; `Merged_Final_v3.docx` ¶ 262
* **Code Reference:** [`src/core/causal/witnessCollector.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/witnessCollector.ts#L18-L115) (`WitnessCollector`); [`src/types/transition.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts#L15-L35)
* **Test Reference:** [`test/unit/causal.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/causal.spec.ts#L100-L155); [`test/unit/step10_network_acknowledgement.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step10_network_acknowledgement.spec.ts#L15-L80)
* **Test Command:** `npm run validate:witness-classes`
* **Primary Evidence:** `evidence/chromium_witness_class_evidence.json` (Demonstrates: DOM: 7, A11y: 2, History: 2, Route: 2, App State: 6, Network ACK: 2)
* **Classification:** **`REAL_CHROMIUM_TESTED`**
* **Boundaries:** Tested in real Chrome 155.0.8059.85 across 5 local mock site workflows.

---

### Claim 9: Provisional Quarantine State & Validated Route Promotion
* **Limitation Text:** `9. The method of claim 1, wherein a selected recovered route is first stored in a provisional quarantine state and is promoted to an active validated route only after the invariant-closure gate and transition acceptance condition are satisfied, and wherein a failed route is retained as negative evidence.`
* **Controlling Source:** `v6.docx` ¶ 192; `patent.docx` ¶ 192; `Merged_Final_v3.docx` ¶ 263
* **Code Reference:** [`src/core/quarantine/controller.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/controller.ts#L12-L75); [`src/core/quarantine/promotion.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/promotion.ts#L19-L84)
* **Test Reference:** [`test/unit/quarantine.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/quarantine.spec.ts#L25-L95)
* **Test Command:** `npm run test:unit test/unit/quarantine.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json`
* **Classification:** **`INTEGRATION_TESTED_IN_SIMULATION`**
* **Boundaries:** Validated inside benchmark state machine harness in simulation.

---

### Claim 10: Active Route Demotion & Fallback Rollback
* **Limitation Text:** `10. The method of claim 1, wherein a subsequent validation failure demotes an active route version and restores a previously validated route version or forces fresh re-binding, while preserving the failed route as historical evidence.`
* **Controlling Source:** `v6.docx` ¶ 193; `patent.docx` ¶ 193; `Merged_Final_v3.docx` ¶ 264
* **Code Reference:** [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L140-L195) (`RouteManager.demoteRoute`, `rollbackToPreviousVersion`)
* **Test Reference:** [`test/unit/graph.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/graph.spec.ts#L85-L140)
* **Test Command:** `npm run validate:rollback`
* **Primary Evidence:** `evidence/chromium_route_rollback_evidence.json` (Scenario K: v1 $\to$ v2 $\to$ demotion $\to$ v1 restored)
* **Classification:** **`REAL_CHROMIUM_TESTED`**
* **Boundaries:** Verified for capability `CAP_DISABLE_MARKETING` on local mock site. Multi-version tree forks are pruned to most recent validated predecessor.

---

### Claim 11: Local Browser-Resident Runtime & Zero External Egress
* **Limitation Text:** `11. The method of claim 1, wherein the browser-resident processing subsystem performs intent normalization, interface observation, drift localization, invariant closure, candidate ranking, transition verification, route promotion, and risk gating locally within the browser runtime without transmitting session credentials or authentication tokens to an external inference service.`
* **Controlling Source:** `v6.docx` ¶ 194; `patent.docx` ¶ 194; `Merged_Final_v3.docx` ¶ 265
* **Code Reference:** Core engine execution loop (`src/core/stateMachine/machine.ts`, `src/browser/`)
* **Test Reference:** [`test/unit/security_privacy.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/security_privacy.spec.ts#L15-L85)
* **Test Command:** `npm run validate:network-privacy`
* **Primary Evidence:** `evidence/chromium_network_privacy_evidence.json` (20 intercepted requests: 20 to local mock site, 0 external egress)
* **Classification:** **`REAL_CHROMIUM_TESTED`**
* **Boundaries:** Validated across 10 scenarios in real Chromium; monitors CDP `Network.requestWillBeSent`. Localhost mock site traffic allowed; 0 external outbound requests.

---

### Claim 12: Browser Extension Multi-Process Architecture
* **Limitation Text:** `12. The method of claim 1, wherein the browser-resident processing subsystem comprises an extension content script, a background service worker, a local capability store, a graph engine, and a verification controller communicating through an extension messaging interface.`
* **Controlling Source:** `v6.docx` ¶ 195; `patent.docx` ¶ 195; `Merged_Final_v3.docx` ¶ 266
* **Code Reference:** [`src/browser/contentScript.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/browser/contentScript.ts); [`src/browser/background.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/browser/background.ts); [`manifest.json`](file:///Users/kumarmilind/Desktop/Navigation/manifest.json)
* **Test Reference:** [`test/e2e/browser_e2e.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/e2e/browser_e2e.spec.ts#L20-L95)
* **Test Command:** `npm test test/e2e/browser_e2e.spec.ts`
* **Primary Evidence:** Build output in `dist/` (`contentScript.js`, `manifest.json`, `popup.html`)
* **Classification:** **`PARTIALLY_DEMONSTRATED`**
* **Boundaries:** *Why Partially Demonstrated:* Architecture is implemented, packaged, and tested via integration harness; but Chrome Web Store distribution, live manifest update lifecycle, and multi-profile sync are not evaluated.

---

### Claim 13: Silent Execution Prevention & Witness Failure Abstention
* **Limitation Text:** `13. The method of claim 1, wherein when required transition witnesses are unavailable, contradictory, or causally unrelated to the candidate activation event, the method prevents silent execution and enters the abstention, ranked-suggestion, or confirmation-required state.`
* **Controlling Source:** `v6.docx` ¶ 196; `patent.docx` ¶ 196; `Merged_Final_v3.docx` ¶ 267
* **Code Reference:** [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L410-L460)
* **Test Reference:** [`test/unit/false_success.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/false_success.spec.ts#L25-L90); [`test/unit/quarantine.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/quarantine.spec.ts#L60-L110)
* **Test Command:** `npm run test:unit test/unit/false_success.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json` (`MUT_TRANS_01` HTTP 500 error & `MUT_TRANS_03` uncorrelated delta quarantined with 0 false successes reported)
* **Classification:** **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`**
* **Boundaries:** Evaluated on server HTTP 500 fault and uncorrelated DOM mutation fixtures.

---

### Claim 14: Evidence Quorum for High-Risk Execution Gating
* **Limitation Text:** `14. The method of claim 1, wherein high-risk execution requires an evidence quorum comprising at least semantic evidence, functional invariant evidence, and transition-state evidence, and wherein high capability confidence cannot override failure of the evidence quorum.`
* **Controlling Source:** `v6.docx` ¶ 197; `patent.docx` ¶ 197; `Merged_Final_v3.docx` ¶ 268
* **Code Reference:** [`src/core/authorization/quorum.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/quorum.ts#L11-L52) (`EvidenceQuorumEvaluator`)
* **Test Reference:** [`test/unit/authorization.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/authorization.spec.ts#L65-L125); [`test/properties/properties.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/properties/properties.spec.ts#L70-L105)
* **Test Command:** `npm run test:unit test/unit/authorization.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json` (`MUT_RISK_01`, `MUT_RISK_02`)
* **Classification:** **`IMPLEMENTED_AND_UNIT_TESTED`**
* **Boundaries:** Verified conjunctive satisfaction of all three evidence prongs in unit and property test suites.

---

### Claim 15: Monotonic Timestamping & Verification Interval Enclosure
* **Limitation Text:** `15. The method of claim 1, wherein the machine-readable validation record further stores an activation-event timestamp or sequence identifier and respective timestamps or sequence identifiers of the transition witnesses, and wherein a witness that does not satisfy the configured ordering and verification interval is excluded from the route-promotion condition.`
* **Controlling Source:** `v6.docx` ¶ 199; `patent.docx` ¶ 199; `Merged_Final_v3.docx` ¶ 270
* **Code Reference:** [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts#L95-L140); [`src/core/audit/logger.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/audit/logger.ts#L30-L75)
* **Test Reference:** [`test/unit/ordering.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/ordering.spec.ts#L25-L85)
* **Test Command:** `npm run test:unit test/unit/ordering.spec.ts`
* **Primary Evidence:** `evidence/chromium_e2e_evidence.json` (Monotonic timestamps logged across all 10 scenarios)
* **Classification:** **`REAL_CHROMIUM_TESTED`**
* **Boundaries:** Requires $t_{\text{activation}} \le t_{\text{witness}} \le t_{\text{activation}} + \tau$. Out-of-order witnesses are rejected (tested in N7).

---

### Claim 16: Quarantined Negative Evidence Caching & Repeated Selection Suppression
* **Limitation Text:** `16. The method of claim 1, wherein quarantined negative evidence comprises a normalized evidence signature identifying at least a failed invariant or contradiction predicate, and wherein the signature is used to suppress repeated selection of a materially unchanged rejected candidate until material interface evidence changes.`
* **Controlling Source:** `v6.docx` ¶ 200; `patent.docx` ¶ 200; `Merged_Final_v3.docx` ¶ 271
* **Code Reference:** [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts#L25-L95) (`NegativeEvidenceStore`)
* **Test Reference:** [`test/unit/step06_negative_evidence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step06_negative_evidence.spec.ts#L35-L95)
* **Test Command:** `npm run test:unit test/unit/step06_negative_evidence.spec.ts`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json`
* **Classification:** **`IMPLEMENTED_AND_UNIT_TESTED`**
* **Boundaries:** Signature hashes failed predicate, target selector, and structural path. Invalidation triggered on structural drift $> 0.45$.

---

### Claim 17: Route Version State Machine (Provisional, Validated, Demoted, Quarantined)
* **Limitation Text:** `17. The method of claim 1, wherein route versions are maintained in a state machine comprising at least provisional, validated, demoted, and quarantined states, and wherein a transition between the states is caused by an invariant result or transition-witness result rather than by a confidence score alone.`
* **Controlling Source:** `v6.docx` ¶ 201; `patent.docx` ¶ 201; `Merged_Final_v3.docx` ¶ 272
* **Code Reference:** [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L110-L165); [`src/types/state.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/state.ts#L65-L85)
* **Test Reference:** [`test/unit/graph.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/graph.spec.ts#L95-L145); [`test/unit/quarantine.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/quarantine.spec.ts#L70-L125)
* **Test Command:** `npm run test:unit test/unit/graph.spec.ts`
* **Primary Evidence:** `evidence/chromium_route_rollback_evidence.json`
* **Classification:** **`INTEGRATION_TESTED_IN_SIMULATION`**
* **Boundaries:** All 4 states exist and transition based on verification outcome records rather than numerical score thresholds.

---

### Claim 18: Multi-Factor Route Confidence & Risk-Gating Prohibition
* **Limitation Text:** `18. The method of claim 1, wherein, after the invariant-closure gate has accepted a candidate, the route confidence calculation further incorporates semantic fit, contextual fit, transition consistency, prior validation confidence, route staleness, operation risk, and path cost, and wherein the resulting confidence value cannot by itself authorize a high-risk operation.`
* **Controlling Source:** `v6.docx` ¶ 202; `patent.docx` ¶ 202; `Merged_Final_v3.docx` ¶ 273
* **Code Reference:** [`src/core/ranking/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/ranking/engine.ts#L180-L245); [`src/core/authorization/controller.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/controller.ts#L45-L95)
* **Test Reference:** [`test/unit/ranking_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/ranking_verification.spec.ts#L55-L110); [`test/properties/properties.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/properties/properties.spec.ts#L110-L145) (Property 4)
* **Test Command:** `npm run test:properties`
* **Primary Evidence:** `benchmark/results/phase3/phase3_full_system_runs.json`
* **Classification:** **`IMPLEMENTED_AND_UNIT_TESTED`**
* **Boundaries:** All 7 factors integrated in code; formal property test proves confidence cannot authorize high-risk actions.

---

## 4. Statutory Parallel Claims (Claims 19–20) Implementation Matrix

### Claim 19: Computing System Architecture
* **Limitation Text:** `19. A computing system comprising one or more processors, a browser-resident interface observer, a capability-state graph store, a drift-localization engine, an invariant-closure engine, a transition-verification controller, and an execution-authorization engine, configured to perform the method of claim 1.`
* **Controlling Source:** `v6.docx` ¶ 203; `patent.docx` ¶ 203; `Merged_Final_v3.docx` ¶ 274
* **Code Reference:** [`src/index.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/index.ts#L1-L29) (integrates all 6 sub-engines)
* **Test Reference:** Full test suite (`npm test`, 436 tests passing)
* **Test Command:** `npm test`
* **Primary Evidence:** `evidence/chromium_e2e_evidence.json`
* **Classification:** **`INTEGRATION_TESTED_IN_SIMULATION` & `REAL_CHROMIUM_TESTED`**
* **Boundaries:** Embodied as modular TypeScript engine and packaged extension; executed across Node.js/JSDOM and headless Chrome testbeds.

---

### Claim 20: Non-Transitory Computer-Readable Storage Medium
* **Limitation Text:** `20. A non-transitory computer-readable storage medium storing instructions that, when executed by a browser-resident processing device, cause the processing device to perform the method of claim 1.`
* **Controlling Source:** `v6.docx` ¶ 204; `patent.docx` ¶ 204; `Merged_Final_v3.docx` ¶ 275
* **Code Reference:** Packaged extension files in `dist/` (`dist/contentScript.js`, `dist/manifest.json`, `dist/popup.html`)
* **Test Reference:** `npm run typecheck`
* **Test Command:** `npm run typecheck`
* **Primary Evidence:** Disk-resident compiled files; baseline archive `IntentNav-SCFR-Evidence-Baseline-v1.0.zip`
* **Classification:** **`IMPLEMENTED_AND_UNIT_TESTED`**
* **Boundaries:** Executable instructions stored in non-transitory files on local disk; depends from Claim 1.

---

## 5. Comprehensive Summary & Audited Readiness Tally

| Claim Number | Limitation Summary | Source ¶ (`v6.docx`) | Primary Source Symbol | Audited Evidence Classification |
| :--- | :--- | :---: | :--- | :---: |
| **Claim 1 Preamble** | Method for adaptive navigation | ¶ 183 | `IntentNavSCFR` (`src/index.ts`) | **`INTEGRATION_TESTED_IN_SIMULATION` & `REAL_CHROMIUM_TESTED`** |
| **Claim 1(a)** | Natural-language objective ingestion | ¶ 183 | `IntentNormalizer` (`normalizer.ts`) | **`PARTIALLY_DEMONSTRATED`** |
| **Claim 1(b)** | Multi-source interface evidence | ¶ 183 | `InterfaceObserver` (`interfaceObserver.ts`) | **`REAL_CHROMIUM_TESTED`** |
| **Claim 1(c)** | Functional capability fingerprint & suppression | ¶ 183 | `CapabilityFingerprintConstructor` / `VolatileFeatureSuppressor` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 1(d)** | Capability-state graph & route versions | ¶ 183 | `CapabilityGraphEngine` / `RouteManager` | **`REAL_CHROMIUM_TESTED` & `INTEGRATION_TESTED_IN_SIMULATION`** |
| **Claim 1(e)** | Objective matching & route retrieval | ¶ 183 | `CapabilityIntentResolver` (`resolver.ts`) | **`PARTIALLY_DEMONSTRATED`** |
| **Claim 1(f)** | 5D typed interface-drift vector | ¶ 183 | `TypedDriftDetector` (`detector.ts`) | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 1(g)** | Replay inhibition upon drift | ¶ 183 | `DriftClassifier` / `CandidatePipeline` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 1(h)** | Invariant-closure gate | ¶ 183 | `InvariantClosureEngine` (`engine.ts`) | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 1(i)** | Post-gating re-binding score | ¶ 183 | `CandidateRankingEngine` (`engine.ts`) | **`IMPLEMENTED_AND_UNIT_TESTED`** |
| **Claim 1(j)** | Provisional route & validation record | ¶ 183 | `RouteManager` / `AuditLogger` | **`REAL_CHROMIUM_TESTED`** |
| **Claim 1(k)** | Safe verification & causal witness quorum | ¶ 183 | `CausalTransitionVerifier` / `SafeVerificationController` | **`REAL_CHROMIUM_TESTED`** |
| **Claim 1(l)** | Route promotion & negative evidence | ¶ 183 | `RoutePromotionController` / `NegativeEvidenceStore` | **`REAL_CHROMIUM_TESTED` & `EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 1(m)** | Separation of confidence from authorization | ¶ 183 | `ExecutionAuthorizationController` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 1(n)** | Operation dispatch / abstention state | ¶ 183 | `SystemStateMachine` (`machine.ts`) | **`REAL_CHROMIUM_TESTED`** |
| **Claim 2** | Exclusion of volatile presentation attributes | ¶ 185 | `VolatileFeatureSuppressor` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 3** | Invariant closure positive/negative predicates | ¶ 186 | `InvariantClosureEngine` | **`IMPLEMENTED_AND_UNIT_TESTED`** |
| **Claim 4** | 5-channel drift & presentation bypass | ¶ 187 | `DriftClassifier` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 5** | Similarity cannot compensate for invariant failure | ¶ 188 | `CandidateRankingEngine` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 6** | Contradiction predicates & decoy rejection | ¶ 189 | `NegativeEvidenceStore` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 7** | Ordered sequence & $\ge 2$ witness classes | ¶ 190 | `CausalTransitionVerifier` | **`REAL_CHROMIUM_TESTED`** |
| **Claim 8** | 6 distinct transition witness classes | ¶ 191 | `WitnessCollector` | **`REAL_CHROMIUM_TESTED`** |
| **Claim 9** | Provisional quarantine & validated promotion | ¶ 192 | `QuarantineController` / `RoutePromotionController` | **`INTEGRATION_TESTED_IN_SIMULATION`** |
| **Claim 10** | Route version demotion & rollback | ¶ 193 | `RouteManager` | **`REAL_CHROMIUM_TESTED`** |
| **Claim 11** | Local runtime & zero external egress | ¶ 194 | Core Runtime / Extension Model | **`REAL_CHROMIUM_TESTED`** |
| **Claim 12** | Extension multi-process architecture | ¶ 195 | Content Script / Service Worker | **`PARTIALLY_DEMONSTRATED`** |
| **Claim 13** | Silent execution prevention & abstention | ¶ 196 | `SystemStateMachine` | **`EMPIRICALLY_DEMONSTRATED_UNDER_TESTED_SCENARIOS`** |
| **Claim 14** | Evidence quorum for high-risk gating | ¶ 197 | `EvidenceQuorumEvaluator` | **`IMPLEMENTED_AND_UNIT_TESTED`** |
| **Claim 15** | Monotonic timestamping & interval $\tau$ | ¶ 199 | `CausalTransitionVerifier` | **`REAL_CHROMIUM_TESTED`** |
| **Claim 16** | Quarantined negative evidence caching | ¶ 200 | `NegativeEvidenceStore` | **`IMPLEMENTED_AND_UNIT_TESTED`** |
| **Claim 17** | 4-state route version state machine | ¶ 201 | `RouteManager` / `SystemStateMachine` | **`INTEGRATION_TESTED_IN_SIMULATION`** |
| **Claim 18** | Multi-factor route confidence calculation | ¶ 202 | `CandidateRankingEngine` | **`IMPLEMENTED_AND_UNIT_TESTED`** |
| **Claim 19** | System statutory embodiment | ¶ 203 | Whole Computing System (`src/index.ts`) | **`INTEGRATION_TESTED_IN_SIMULATION` & `REAL_CHROMIUM_TESTED`** |
| **Claim 20** | Non-transitory medium embodiment | ¶ 204 | Compiled Extension Distributable (`dist/`) | **`IMPLEMENTED_AND_UNIT_TESTED`** |

---
*Signed and Certified for Technical Review:*
**MILIND**
Sole Architect & Implementer, IntentNav-SCFR
