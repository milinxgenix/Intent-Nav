# IntentNav-SCFR: Claim-to-Evidence & Specification Traceability Map
**Document Identifier:** `INTENTNAV-SUBMISSION-CEM-2026-V1`
**Reviewer / Architect / Sole Implementer:** MILIND
**Date:** October 26, 2026
**Status:** Working Patent Draft Deliverable (Audited for 100% Source Fidelity to `v6.docx` Controlling Disclosures)
**Governing Standard:** `v6.docx` (Controlling Priority 1) $\to$ `patent.docx` (Secondary Priority 2) $\to$ `Merged_Final_v3.docx` (Tertiary Priority 3)
**Git Anchor:** Branch `patent-hardening-phase-2-batch-b-capability-routing` (`bc4a34be60dc58e45dab60a657d4e0009ab77798`)

---

## 1. Overview and Purpose

This document provides a comprehensive, clause-by-clause traceability matrix connecting:
1. Every claim clause in `CLAIMS.md` (Claims 1–20);
2. Paragraphs in the controlling patent specification (`v6.docx`);
3. Paragraphs in the secondary specification (`patent.docx`);
4. Sections in the working submission draft (`SPECIFICATION.md`);
5. Production TypeScript implementation source files (`src/`);
6. Automated regression tests (`test/unit/`);
7. Empirical benchmark results and ablations (`benchmark/results/phase3/`); and
8. Specific action items and recommendations for patent drafting counsel.

---

## 2. Independent Claim 1 Traceability Matrix

| Claim 1 Clause | Controlling ¶ (`v6.docx`) | Secondary ¶ (`patent.docx`) | Working Spec Section | Implementation Module | Automated Unit Test | Phase 3 Empirical Evidence | Counsel Action Item |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| **Preamble** | ¶ 183 | ¶ 183 | Detailed Desc § 1 | [`src/index.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/index.ts) | `step11_benchmark_integrity.spec.ts` | Whole System B5 Baseline | Restored leading numeral `"1. "`. 100% match to `v6.docx`. |
| **1(a) Objective** | ¶ 183 | ¶ 183 | Detailed Desc § 4 | [`src/core/intent/parser.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/intent/parser.ts) | `test/unit/intent.spec.ts` | Natural-language intent ingestion across 13 fixtures | Verbatim text retained. |
| **1(b) Evidence** | ¶ 183 | ¶ 183 | Detailed Desc § 1 & § 2 | [`src/core/observer/domObserver.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/observer/domObserver.ts) | `test/unit/step04_raw_evidence.spec.ts` | Multi-source evidence streams across 13 fixtures | Verbatim text retained. |
| **1(c) Fingerprint** | ¶ 183 | ¶ 183 | Detailed Desc § 2 | [`src/core/invariants/closure.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariants/closure.ts) | `step05_post_state_fingerprint.spec.ts` | Fixtures `MUT_ID_01`, `MUT_ID_02` (resilient re-binding) | Verbatim text retained. |
| **1(d) Graph** | ¶ 183 | ¶ 183 | Detailed Desc § 4 | [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts) | `test/unit/graph.spec.ts` | Capability-state graph route lifecycle | Verbatim text retained. |
| **1(e) Matching** | ¶ 183 | ¶ 183 | Detailed Desc § 4 | [`src/core/intent/parser.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/intent/parser.ts) | `test/unit/intent.spec.ts` | Intent matching to persistent capability nodes | Verbatim text retained. |
| **1(f) Drift Vector** | ¶ 183 | ¶ 183 | Detailed Desc § 3 | [`src/core/drift/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts) | `test/unit/drift_matrix.spec.ts` | 5D drift classification across 13 fixtures | Verbatim text retained. |
| **1(g) Inhibit Replay**| ¶ 183 | ¶ 183 | Detailed Desc § 3 & § 5 | [`src/core/candidate/pipeline.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/pipeline.ts) | `test/unit/drift_live_integration.spec.ts` | Stale route replay inhibited upon drift | Verbatim text retained. |
| **1(h) Invariant Gate**| ¶ 183 | ¶ 183 | Detailed Desc § 5 | [`src/core/invariants/evaluator.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariants/evaluator.ts) | `invariant_closure_verification.spec.ts` | Ablation `NO_FINGERPRINT_INVARIANT` | Verbatim text retained. |
| **1(i) Scoring** | ¶ 183 | ¶ 183 | Detailed Desc § 5 | [`src/core/candidate/scorer.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/scorer.ts) | `test/unit/ranking_verification.spec.ts` | Scored post-invariant gate (`RebindScore`) | Verbatim text retained. |
| **1(j) Validation Rec**| ¶ 183 | ¶ 183 | Detailed Desc § 5 & § 7 | [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts) | `step08_multistep_route_planning.spec.ts` | Machine-readable validation records logged | Verbatim text retained (`v6` addition). |
| **1(k) Verification** | ¶ 183 | ¶ 183 | Detailed Desc § 7 | [`src/core/causal/safeVerification.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/safeVerification.ts) | `step10_network_acknowledgement.spec.ts` | Bounded interval $\tau \le 250\text{ ms}$; witness correlation | Verbatim text retained. |
| **1(l) Promotion** | ¶ 183 | ¶ 183 | Detailed Desc § 7 | [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts) | `test/unit/quarantine.spec.ts` | 6 routes promoted, 2 quarantined in Phase 3 | Verbatim text retained. |
| **1(m) Risk Policy** | ¶ 183 | ¶ 183 | Detailed Desc § 6 | [`src/core/authorization/riskEngine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/riskEngine.ts) | `test/unit/authorization.spec.ts` | Ablation `NO_RISK_GATING` (13/13 bypasses) | Verbatim text retained. |
| **1(n) Dispatch/Abstain**| ¶ 183 | ¶ 183 | Detailed Desc § 6 | [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts) | `test/unit/false_success.spec.ts` | High-risk actions enter abstention/confirmation | Verbatim text retained. |

---

## 3. Dependent Claims 2–18 Traceability Matrix

| Claim # | Controlling ¶ (`v6.docx`) | Secondary ¶ (`patent.docx`) | Working Spec Section | Implementation Module | Automated Unit Test | Phase 3 Empirical Evidence | Counsel Action Item |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| **Claim 2** | ¶ 185 | ¶ 185 | Detailed Desc § 2 | [`src/core/fingerprint/suppressor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/suppressor.ts) | `test/unit/suppression.spec.ts` | Resilient re-binding on `MUT_ID_01`/`02` | Exact 100% match to `v6.docx` restored. |
| **Claim 3** | ¶ 186 | ¶ 186 | Detailed Desc § 2 | [`src/core/invariants/closure.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariants/closure.ts) | `test/unit/invariant.spec.ts` | Gating on `MUT_RISK_01`, `MUT_RISK_02` | Exact 100% match to `v6.docx` restored. |
| **Claim 4** | ¶ 187 | ¶ 187 | Detailed Desc § 3 | [`src/core/drift/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts) | `test/unit/drift_matrix.spec.ts` | Ablation `NO_DRIFT_REBIND` | Exact 100% match to `v6.docx` restored. Presentation-only bypass. |
| **Claim 5** | ¶ 188 | ¶ 188 | Detailed Desc § 5 | [`src/core/candidate/scorer.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/scorer.ts) | `test/unit/ranking_verification.spec.ts` | 100% decoy rejection under keyword drift | 100% match to controlling `v6.docx` restored. Fallback negative limits in `OPEN_COUNSEL_ISSUES.md`. |
| **Claim 6** | ¶ 189 | ¶ 189 | Detailed Desc § 5 & § 7 | [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts) | `test/unit/step06_negative_evidence.spec.ts` | 0 decoys triggered in B5 vs 1 in B2 | Exact 100% match to `v6.docx` restored. Decoy rejection. |
| **Claim 7** | ¶ 190 | ¶ 190 | Detailed Desc § 7 | [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts) | `test/unit/causal.spec.ts` | Bounded interval $\tau \le 250\text{ ms}$; $\ge 2$ classes | 100% match to controlling `v6.docx` restored. Measured from activation fallback in `OPEN_COUNSEL_ISSUES.md`. |
| **Claim 8** | ¶ 191 | ¶ 191 | Detailed Desc § 7 | [`src/core/causal/safeVerification.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/safeVerification.ts) | `step10_network_acknowledgement.spec.ts` | 6 witness classes verified in Phase 3 | Exact 100% match to `v6.docx` restored. 6 witness classes. |
| **Claim 9** | ¶ 192 | ¶ 192 | Detailed Desc § 7 | [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts) | `test/unit/quarantine.spec.ts` | 2 routes quarantined in Phase 3 | Exact 100% match to `v6.docx` restored. Provisional quarantine. |
| **Claim 10** | ¶ 193 | ¶ 193 | Detailed Desc § 7 | [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts) | `test/unit/graph.spec.ts` | Route rollback without session crash | Exact 100% match to `v6.docx` restored. Route demotion & rollback. |
| **Claim 11** | ¶ 194 | ¶ 194 | Detailed Desc § 1 | Browser Extension Core | `test/unit/security_privacy.spec.ts` | 0 network egress requests | Exact 100% match to `v6.docx` restored. Zero-egress boundary. |
| **Claim 12** | ¶ 195 | ¶ 195 | Detailed Desc § 1 | Browser Extension Manifest | Extension Packaging Tests | Content script / background worker model | Exact 100% match to `v6.docx` restored. Extension components. |
| **Claim 13** | ¶ 196 | ¶ 196 | Detailed Desc § 6 | [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts) | `test/unit/quarantine.spec.ts` | Abstention state when witnesses missing | Exact 100% match to `v6.docx` restored. Fail-safe abstention. |
| **Claim 14** | ¶ 197 | ¶ 197 | Detailed Desc § 6 | [`src/core/authorization/riskEngine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/riskEngine.ts) | `test/unit/authorization.spec.ts` | Ablation `NO_RISK_GATING` (100% bypass) | Exact 100% match to `v6.docx` restored. Evidence quorum for risk. |
| **Claim 15** | ¶ 199 | ¶ 199 | Detailed Desc § 5 & § 7 | [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts) | `step08_multistep_route_planning.spec.ts` | Monotonic timestamps in validation record | Exact 100% match to `v6.docx` restored. Timestamping/ordering. |
| **Claim 16** | ¶ 200 | ¶ 200 | Detailed Desc § 5 & § 7 | [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts) | `test/unit/step06_negative_evidence.spec.ts` | Normalized failure signature caching | Exact 100% match to `v6.docx` restored. Quarantined negative evidence. |
| **Claim 17** | ¶ 201 | ¶ 201 | Detailed Desc § 7 | [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts) | `step08_multistep_route_planning.spec.ts` | State machine transitions verified | 100% match to controlling `v6.docx` restored. Explicit state rules in `OPEN_COUNSEL_ISSUES.md`. |
| **Claim 18** | ¶ 202 | ¶ 202 | Detailed Desc § 4 | [`src/core/candidate/scorer.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/scorer.ts) | `test/unit/ranking_verification.spec.ts` | Multi-factor route confidence calculation | Exact 100% match to `v6.docx` restored. Multi-factor `RouteScore`. |

---

## 4. Statutory Parallel Claims (Claims 19–20) Traceability Matrix

| Claim # | Controlling ¶ (`v6.docx`) | Secondary ¶ (`patent.docx`) | Working Spec Section | Implementation Module | Automated Unit Test | Phase 3 Empirical Evidence | Counsel Action Item |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| **Claim 19 (System)** | ¶ 203 | ¶ 203 | Detailed Desc § 1 | [`src/index.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/index.ts) | `step11_benchmark_integrity.spec.ts` | 65 trials across baseline systems | Restored terminating `"1."`. 100% match to `v6.docx`. |
| **Claim 20 (Medium)** | ¶ 204 | ¶ 204 | Detailed Desc § 1 | Compiled Engine (`dist/`) | System Execution Tests | Executable instructions embodiment | Exact 100% match to `v6.docx` restored. Properly depends from Claim 1. |

---
*Signed and Authenticated:*
**MILIND**
Sole Architect & Implementer, IntentNav-SCFR
