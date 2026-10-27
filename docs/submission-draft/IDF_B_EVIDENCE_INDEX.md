# IntentNav-SCFR: IDF-B Master Evidence Index
**Document Identifier:** `INTENTNAV-IDF-B-MEI-2026-V1`
**Project Owner / Inventor / Sole Implementer:** MILIND
**Date:** October 26, 2026
**Status:** Cryptographically Anchored Evidence Master Index
**Controlling Authority Priority:** `v6.docx` (Controlling Priority 1) $\to$ `patent.docx` (Secondary Priority 2) $\to$ `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` (Tertiary Priority 3)
**Git Anchor:** Branch `patent-hardening-phase-2-batch-b-capability-routing` (`bc4a34be60dc58e45dab60a657d4e0009ab77798`)

---

## 1. Overview and Evidentiary Purpose

This document serves as the authoritative, cryptographically verified catalog of all primary empirical artifacts, automated verification test suites, benchmark telemetry, and frozen historical records supporting the **IntentNav-SCFR** patent application and IDF-B readiness submission.

Every entry in this index is grounded in a physical file present in the repository, accompanied by its exact relative file path, exact byte size, SHA-256 cryptographic checksum, associated patent claims, test harness context, and validation commands.

---

## 2. Frozen Baseline Archive & Authoritative Disclosures

| Artifact Name | Path | Size (Bytes) | SHA-256 Cryptographic Checksum | Patent Claims Supported | Description & Authority |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **Controlling Specification (Priority 1)** | `docs/patent-requirements/v6.docx` | 2,195,824 | `d7aa3efad8be671e85b161df3b71a2b6dea3d5dc43594f11e43d12d31c542940` | Claims 1–20 | Highest authority disclosure controlling all claim wording and dependencies. |
| **Secondary Specification (Priority 2)** | `docs/patent-requirements/patent.docx` | 960,108 | `383b45412f85881b6b07a8ed42986e407606fadc9e3ff03306b64bb0c6877da4` | Claims 1–20 | Secondary supporting disclosure with tightened boundary options. |
| **Merged Audited Disclosure (Priority 3)** | `docs/patent-requirements/INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` | 1,324,771 | `51695d2de5cd4e7c8981bec9d76b93c17b0baf2ef6bab8af2ae6394042a6202a` | Claims 1–20 | Comprehensive technical disclosure and audit history. |
| **Frozen Evidence Baseline Zip** | `IntentNav-SCFR-Evidence-Baseline-v1.0.zip` | 4,472,947 | `ccf0f75a8b84e6c01d6fc43d3956dfdb9eb3bbc38f48cd00ba88e31894916139` | Claims 1–20 | Immutable frozen baseline evidence package from initial hardening pass. |
| **Frozen Working Claims Draft** | `docs/submission-draft/CLAIMS.md` | 10,607 | `18e82953b46b3ed0869615b2566f76d5c747b7137c38d8fc479e91bff635908b` | Claims 1–20 | Working claims draft restored to 100% verbatim source fidelity with `v6.docx`. |

---

## 3. Real Chromium CDP Evidence Dossiers (Local Mock-Site Testbed)

All dossiers in this category were captured from live executions in Google Chrome (version 155.0.8059.85) over the Chrome DevTools Protocol (CDP) executing against locally served mock test sites (Sites A, B, C, D) hosted via `scripts/serveMocks.js`.

| Dossier Name | Path | Size (Bytes) | SHA-256 Checksum | Claims Supported | Testbed & Verification Command |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **Chromium Positive E2E Evidence** | `evidence/chromium_e2e_evidence.json` | 1,192,249 | `d54ce43bad22f0f8265a0131d7ee0eb4d67117c3beffc7f8616e6d22aefc8356` | Claim 1(a)–(n), Claims 2–20 | 10 positive scenarios (A–J) on local mock sites. Command: `npm run validate:evidence` |
| **Chromium Negative & Defect Evidence** | `evidence/chromium_e2e_negative_evidence.json` | 194,188 | `68c287e2fc8b44a2417ca298140f4fe7599f0c5643bd9becf48021e390fd00d9` | Claim 1(l), (n), Claims 6, 9, 13, 16 | 14 negative defect scenarios (N1–N14) in Chrome. Command: `npm run validate:evidence:neg` |
| **Network Privacy & Zero Egress Evidence** | `evidence/chromium_network_privacy_evidence.json` | 11,544 | `4be9bc3d3be1fd1f1ffa7142df413acee8b44e0426f68a7042d79663f2188b08` | Claim 1(a), Claim 11 | 20 intercepted requests: 20 to local mock site, 0 external requests. Command: `npm run validate:network-privacy` |
| **Route Rollback & Demotion Evidence** | `evidence/chromium_route_rollback_evidence.json` | 4,909 | `420eb2a923be9f4ab4b5d1f659e9a22ea3c959df8867740af82aa07132c27856` | Claim 1(d), (j), Claims 10, 17 | Scenario K: v1 $\to$ v2 $\to$ demotion $\to$ v1 rollback. Command: `npm run validate:rollback` |
| **Multi-Class Witness Quorum Evidence** | `evidence/chromium_witness_class_evidence.json` | 21,147 | `eabafb6d7730bbf831aeaeed294d64a51f9ed5304271c2876b6536a6e248c46a` | Claim 1(k), Claims 7, 8, 15 | 6 witness classes across 5 scenarios (A, B, D, G, I). Command: `npm run validate:witness-classes` |

---

## 4. Phase 3 Experimental Benchmark Results (156 Trials in Node.js/JSDOM)

Captured from the unified Phase 3 benchmark suite executing 65 full-system baseline trials (5 systems $\times$ 13 fixtures) and 91 ablation trials (7 ablations $\times$ 13 fixtures) in Node.js v20.17.0 with JSDOM on macOS Darwin arm64.

| Benchmark Artifact | Path | Size (Bytes) | SHA-256 Checksum | Evidentiary Role & Scope |
| :--- | :--- | :---: | :--- | :--- |
| **Full-System Baseline Runs (B1–B5)** | `benchmark/results/phase3/phase3_full_system_runs.json` | 62,383 | `1300e77d2f8d4314c07d700904fcab73407963c39ba077b4d6ad7039c29b6835` | 65 trials comparing prototype against 4 in-repo baseline comparators. |
| **Ablation Study Runs (A1–A7)** | `benchmark/results/phase3/phase3_ablation_runs.json` | 95,416 | `39e28f747c0b7dd392a2e97275865e8950573afa6ac91aa922994c4444d38b59` | 91 ablation trials isolating invariant, drift, verification, and risk gating. |
| **Computational Metric Report** | `benchmark/results/phase3/phase3_computational_report.json` | 1,975 | `be6b75adb6ae26f1297b14af25f48727bdf9cb173e727bae8e9247b2a137d899` | Summary distributions: mean latencies (B1: 14.11ms, B5: 15.13ms), memory, CPU. |
| **Consolidated CSV Dossier** | `benchmark/results/phase3/phase3_results.csv` | 26,582 | `c70df72052ca51f4186d65ab3d77216f03808140356b7d54f178a35ff6711400` | Machine-readable tabular results for all 156 experimental runs. |
| **Comprehensive Markdown Report** | `benchmark/results/phase3/phase3_comprehensive_report.md` | 2,454 | `59b5836fcfed37b7069304cd1b324e6dc8f24d18b84117e578f557c72e1e6047` | Human-readable synthesis of Phase 3 findings and baseline comparisons. |
| **Phase 3 Evidence Manifest** | `benchmark/results/phase3/manifest.json` | 2,833 | `5c05933f928129f160e50dce5617af0c9272bbf0d44ccd7991f840def99bd3c9` | Cryptographic inventory of all Phase 3 files. |

---

## 5. Automated Verification Suites & Machine Property Tests

| Test Suite / Script | Path | Test Count | Focus & Claims Validated | Command |
| :--- | :--- | :---: | :--- | :--- |
| **Adversarial Test Matrix** | `test/adversarial/matrix.spec.ts` | 26 tests | Scenarios A–Z: decoys, presentation drift bypass, risk rejection, abstention. | `npm run test:adversarial` |
| **Formal Property Tests** | `test/properties/properties.spec.ts` | 15 properties | Machine invariants: firewall primacy, token validity, quorum rules. | `npm run test:properties` |
| **Unit Test Suite (36 files)** | `test/unit/*.spec.ts` | 378 tests | Fine-grained unit tests covering every class and algorithm in isolation. | `npm run test:unit` |
| **Integrated Suite** | `test/` | 436 tests | Complete test suite including browser E2E integration test. | `npm test` |
| **Phase 3 Benchmark Runner** | `scripts/runPhase3Validation.mjs` | 156 trials | Runs 65 baseline trials and 91 ablation trials in 2.26s. | `node scripts/runPhase3Validation.mjs` |
| **Evidence Schema Validator** | `scripts/validateChromiumEvidence.js` | 10 scenarios | Validates 30-field schema compliance on positive Chrome traces. | `npm run validate:evidence` |
| **Negative Evidence Validator** | `scripts/validateNegativeEvidence.js` | 14 scenarios | Validates quarantine and negative evidence logging on N1–N14. | `npm run validate:evidence:neg` |
| **Network Privacy Validator** | `scripts/validateChromiumNetworkPrivacyEvidence.js` | 1 suite | Enforces 0 external requests during navigation workflows. | `npm run validate:network-privacy` |
| **Route Rollback Validator** | `scripts/validateChromiumRouteRollbackEvidence.js` | 1 suite | Validates route demotion and fallback version restoration (Scenario K). | `npm run validate:rollback` |
| **Witness Class Validator** | `scripts/validateChromiumWitnessClassEvidence.js` | 6 classes | Validates all 6 witness classes (DOM, A11y, History, Route, App, ACK). | `npm run validate:witness-classes` |

---

## 6. Core Source Code Module Directory (`src/`)

| Module Subsystem | File Path | Primary Class / Symbol | Core Functionality |
| :--- | :--- | :--- | :--- |
| **Intent Normalization** | `src/core/intent/normalizer.ts` (132 lines) | `IntentNormalizer` | Normalizes goals to `ActionType` and `TargetEntity`. |
| **Capability Resolution** | `src/core/intent/resolver.ts` (104 lines) | `CapabilityIntentResolver` | Resolves intent to canonical capability node. |
| **Interface Observation** | `src/browser/observer/interfaceObserver.ts` (169 lines) | `InterfaceObserver` | Extracts 5-channel live DOM evidence. |
| **Fingerprint Construction** | `src/core/fingerprint/constructor.ts` (1131 lines) | `CapabilityFingerprintConstructor` | Assembles persistent capability identity tuple. |
| **Volatile Suppression** | `src/core/fingerprint/suppressor.ts` (160 lines) | `VolatileFeatureSuppressor` | Strips transient IDs, hashes, and styling classes. |
| **Drift Detection** | `src/core/drift/detector.ts` (481 lines) | `TypedDriftDetector` | Computes 5-dimensional continuous drift vector. |
| **Drift Classification** | `src/core/drift/classifier.ts` (127 lines) | `DriftClassifier` | Evaluates action required (maintain, validate, rebind, quarantine). |
| **Candidate Discovery** | `src/core/candidate/pipeline.ts` (96 lines) | `CandidatePipeline` | Discovers live DOM candidate controls upon drift. |
| **Invariant Closure** | `src/core/invariant/engine.ts` (291 lines) | `InvariantClosureEngine` | Evaluates 10 invariant classes; binary PASS/FAIL gate. |
| **Predicate Evaluation** | `src/core/invariant/predicates.ts` (144 lines) | `DeclarativePredicateEvaluator` | Declarative predicate evaluation logic. |
| **Candidate Ranking** | `src/core/ranking/engine.ts` (390 lines) | `CandidateRankingEngine` | Scores eligible candidates post-invariant gate. |
| **Risk Classification** | `src/core/authorization/classifier.ts` (65 lines) | `RiskClassifier` | Classifies operation risk levels (LOW, MEDIUM, HIGH). |
| **Evidence Quorum** | `src/core/authorization/quorum.ts` (53 lines) | `EvidenceQuorumEvaluator` | Enforces 3-prong evidence quorum for high risk. |
| **Authorization Controller** | `src/core/authorization/controller.ts` (155 lines) | `ExecutionAuthorizationController` | Enforces execution authorization independent of confidence. |
| **Causal Verification** | `src/core/causal/verifier.ts` (750 lines) | `CausalTransitionVerifier` | Correlates activation with $\ge 2$ witness classes within $\tau$. |
| **Safe Verification** | `src/core/causal/safeVerification.ts` (154 lines) | `SafeVerificationController` | Enforces non-destructive / reversible probe policy. |
| **Witness Collection** | `src/core/causal/witnessCollector.ts` (115 lines) | `WitnessCollector` | Captures DOM, A11y, history, route, app, and ACK witnesses. |
| **Network ACK Tracker** | `src/core/network/acknowledgement.ts` (124 lines) | `AcknowledgementTracker` | Intercepts HTTP/XHR transaction confirmations. |
| **Quarantine Controller** | `src/core/quarantine/controller.ts` (75 lines) | `QuarantineController` | Manages provisional route state and isolation. |
| **Route Promotion** | `src/core/quarantine/promotion.ts` (84 lines) | `RoutePromotionController` | Promotes routes upon verifying cryptographic token. |
| **Token Authenticator** | `src/core/quarantine/tokenAuthenticator.ts` (916 lines) | `PromotionTokenAuthenticator` | Issues and verifies HMAC-SHA256 transition tokens. |
| **Negative Evidence Store** | `src/core/contradiction/store.ts` (115 lines) | `NegativeEvidenceStore` | Records contradiction signatures to suppress loops. |
| **Capability Graph Store** | `src/core/storage/persistentStore.ts` (140 lines) | `PersistentCapabilityStore` | Persists capability-state graph in browser storage. |
| **Route Version Manager** | `src/core/graph/routeManager.ts` (217 lines) | `RouteManager` | Manages route versions, state machine, and rollback. |
| **Core State Machine** | `src/core/stateMachine/machine.ts` (1815 lines) | `SystemStateMachine` | Master 12-state system execution engine. |
| **Audit Logger** | `src/core/audit/logger.ts` (85 lines) | `AuditLogger` | Generates 30-field machine-readable validation records. |
| **Master Orchestrator** | `src/index.ts` (29 lines) | Root Package Entry | Re-exports all core subsystems and types. |
| **Extension Content Script**| `src/browser/contentScript.ts` (150 lines) | Content Script Entrypoint | Observes DOM, dispatches events, and messages background. |
| **Extension Background** | `src/browser/background.ts` (120 lines) | Background Service Worker | Manages persistent store, graph, and authorization. |

---
*Signed and Authenticated:*
**MILIND**
Sole Architect & Implementer, IntentNav-SCFR
