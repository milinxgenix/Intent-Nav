# IntentNav-SCFR: Final Evidence Index

**Version:** 3.0 (Final Hardened Patent Evidence Baseline)
**Status:** FINAL PATENT EVIDENCE HARDENING COMPLETED — FULL 20-CLAIM BASELINE READY FOR AUDIT
**Governing Standard:** `docs/PATENT_IMPLEMENTATION_EVIDENCE_DOSSIER.md` + `docs/CLAIM_RECONCILIATION.md` + `v6.docx` priority.
**Git Revision:** `d732e0e` (Branch: `dependency-security-review`)
**Execution Environment:** Google Chrome `Google Chrome 153.0.8010.53` (Headless) + CDP over WebSocket
**Extension Packaging:** Unpacked MV3 loaded via CDP `Extensions.loadUnpacked` with zero webpage script injection (Extension ID: `inieeohgmebogmomdhdpabieolhdfdme`)

---

## Verification Sequence & Artifact Ledger

| Test Suite / Scope | Evidence Artifact | Deterministic Validator | Execution Status |
| :--- | :--- | :--- | :---: |
| **Positive Scenarios (A–J)** | [`evidence/chromium_e2e_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_e2e_evidence.json) | `node scripts/validateChromiumEvidence.js` | **10/10 PASS** |
| **Negative Scenarios (N1–N14)** | [`evidence/chromium_e2e_negative_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_e2e_negative_evidence.json) | `node scripts/validateNegativeEvidence.js` | **14/14 PASS** |
| **Network Privacy (Claim 11)** | [`evidence/chromium_network_privacy_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_network_privacy_evidence.json) | `node scripts/validateChromiumNetworkPrivacyEvidence.js` | **ZERO LEAKAGE (PASS)** |
| **Route Rollback (Claim 10)** | [`evidence/chromium_route_rollback_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_route_rollback_evidence.json) | `node scripts/validateChromiumRouteRollbackEvidence.js` | **ROLLBACK VERIFIED (PASS)** |
| **6-Class Witnesses (Claim 8)** | [`evidence/chromium_witness_class_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_witness_class_evidence.json) | `node scripts/validateChromiumWitnessClassEvidence.js` | **W1–W6 VERIFIED (PASS)** |
| **Automated Unit & Integration** | 25 test files / 271 unit & integration tests | `vitest run test/` | **271/271 PASS** |
| **TypeScript Static Check** | 0 type errors | `tsc --noEmit` | **PASS** |
| **Production Build** | `dist/` MV3 extension bundle | `npm run build` | **PASS (243ms)** |

> [!IMPORTANT]
> This document distinguishes what the code **implements**, what unit/integration tests **prove**, what real Chromium execution **demonstrates**, what controlled benchmarks **measure**, and what has **NOT been demonstrated**. Every row maps to reproducible, auditable evidence.

---

## Verification Level Definitions

| Level | Meaning |
|:---:|:---|
| `IMPLEMENTED` | Production TypeScript source exists with strict types in `src/` |
| `UNIT_TESTED` | Isolated component test passes via `npm test` |
| `INTEGRATION_TESTED` | Full multi-module pipeline runs end-to-end in Node.js/JSDOM |
| `REAL_CHROMIUM_TESTED` | Exercised in live Google Chrome via CDP; result captured in evidence file |
| `EMPIRICALLY_VERIFIED` | Chromium result independently validated by deterministic validation script |
| `CONTROLLED_BENCHMARK` | Measured in JSDOM simulated protocol — NOT real browser |
| `NOT_VERIFIED` | Code exists but no test/evidence covers it |

---

## Positive Evidence — Scenarios A–J (Real Chromium)

> [!NOTE]
> **Claim 1 Scope Note:** Browser E2E / empirical demonstration is limited to the executed Scenarios A–J on the tested mock-site environment; this is not a universal proof across arbitrary websites.

| Scenario | Claim/Req | What Is Demonstrated | Test Command | Evidence File | Result | Level |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|
| A | REQ-C1, REQ-C2, REQ-C4 | Label rename recovery — `Stop commercial bulletins` resolved via semantic matching to button labeled differently on Site B | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| B | REQ-C1, REQ-C14 | Label synonym recovery with IRREVERSIBLE confirmation gate — `Download personal information` requires `userConfirmationGranted:true` | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| C | REQ-C1, REQ-C4 | Resilience to menu reordering — `Turn off marketing emails` on Site A despite changed element order | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| D | REQ-C1, REQ-C4 | Container hierarchy nesting changes — `Turn off multi-factor auth` on Site B | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| E | REQ-C2, REQ-C4 | Framework-generated volatile ID changes (`:r3:`) — `Turn off marketing notifications` on Site C | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| F | REQ-C2, REQ-C4 | Scrambled CSS utility classes — `Toggle dark display styling` on Site C | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| G | REQ-C1, REQ-C9 | Intermediate dialog state transition — `Turn off 2FA` via modal on Site C | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| H | REQ-C1, REQ-C4 | Altered URL path with fragment — `Disable tracking` on Site A with `#settings/notifications` | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| I | REQ-C9, REQ-C10, REQ-C17 | Route version lifecycle and promotion recovery — `Revoke active login sessions` on Site A | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED | **EMPIRICALLY_VERIFIED** |
| J | REQ-C3, REQ-C5, REQ-C6 | Adversarial decoy rejection — `Turn off marketing emails` on Site D with 13 destructive decoys all rejected by invariant closure | `npm run test:e2e:chromium` | `evidence/chromium_e2e_evidence.json` | EXECUTED, oracle PASSED, 13 decoys rejected | **EMPIRICALLY_VERIFIED** |

---

## Negative Evidence — Scenarios N1–N14 (Real Chromium)

| Scenario | What Is Demonstrated | Expected State | Test Command | Evidence File | Level |
|:---:|:---|:---:|:---:|:---:|:---:|
| N1 | Invariant violation — element has no role/aria-checked → invariant closure rejects it | `QUARANTINED` / `ABSTAINED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N2 | Semantic decoy — two similar elements; correct one selected, purge decoy rejected | Not `EXECUTED` w/ decoy; or EXECUTED on correct | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N3 | Stale BindingHandle — system must not crash or silently fall back to getElementById | Any non-crash state | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N4 | No witnesses emitted — silent click handler → zero witnesses → causal failure | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N5 | Single witness class only — DOM_MUTATION only, no app-state event → quorum failure | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N6 | Contradictory witness delta → rejected as contradictory evidence | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N7 | Stale witness (pre-existing mutation before activation) → rejected | `QUARANTINED` / any | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N8 | Unrelated witness delta keys → don't contribute to quorum | `QUARANTINED` / any | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N9 | Wrong post-state — state not changed after activation → `postStateVerified=false` | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N10 | Failed causal verification — no valid evidence chain | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N11 | Invalid promotion token — causal & post-state pass, forged token supplied to promotion → rejected by RouteManager.promoteToActive() → route remains in QUARANTINED | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N12 | Unresolved quarantine — target route explicitly placed in QUARANTINED; witnesses emitted, canEnterExecutedState() reaches PRE_16 and rejects | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N13 | IRREVERSIBLE delete account without confirmation → `CONFIRMATION_PENDING` | `CONFIRMATION_PENDING` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |
| N14 | IRREVERSIBLE revoke tokens without confirmation → refused | `CONFIRMATION_PENDING` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **EMPIRICALLY_VERIFIED** |

---

## Dedicated Claim Hardening Evidence (Claims 8, 10, 11)

### 1. Claim 11: Real CDP Network Trace & Zero External Leakage
- **Runner:** `npm run test:e2e:chromium:privacy` (`scripts/runChromiumNetworkPrivacyE2E.js`)
- **Validator:** `npm run validate:network-privacy` (`scripts/validateChromiumNetworkPrivacyEvidence.js`)
- **Evidence:** [`evidence/chromium_network_privacy_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_network_privacy_evidence.json)
- **Demonstrated Facts:**
  - Total CDP Intercepted Requests: 20
  - External Telemetry / Analytics: **0 (Zero)**
  - External LLM / AI Inference: **0 (Zero)**
  - External Cloud Route Sync: **0 (Zero)**
  - 100% of network requests strictly confined to `http://localhost:3000/*`
  - Zero user data, credentials, or tokens transmitted outside localhost

### 2. Claim 10: Real-Browser Route Demotion & Prior-Validated Rollback
- **Runner:** `npm run test:e2e:chromium:rollback` (`scripts/runChromiumRouteRollbackE2E.js`)
- **Validator:** `npm run validate:rollback` (`scripts/validateChromiumRouteRollbackEvidence.js`)
- **Evidence:** [`evidence/chromium_route_rollback_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_route_rollback_evidence.json)
- **Demonstrated Facts (Scenario K):**
  - Route v1 established in `PROVISIONAL` quarantine $\to$ verified $\to$ promoted to `ACTIVE_VALIDATED`
  - Route v2 established in `PROVISIONAL` quarantine $\to$ promoted to `ACTIVE_VALIDATED`
  - Invalidation condition applied to Route v2
  - Deterministic demotion of Route v2 (`status = 'DEMOTED'`)
  - Invariant rollback restoring prior validated Route v1 (`status = 'ACTIVE_VALIDATED'`)
  - Re-execution under restored Route v1 reaches `EXECUTED` state

### 3. Claim 8: Live Observation of All 6 Witness Classes in Chromium
- **Runner:** `npm run test:e2e:chromium:witnesses` (`scripts/runChromiumWitnessClassE2E.js`)
- **Validator:** `npm run validate:witness-classes` (`scripts/validateChromiumWitnessClassEvidence.js`)
- **Evidence:** [`evidence/chromium_witness_class_evidence.json`](file:///Users/kumarmilind/Desktop/Navigation/evidence/chromium_witness_class_evidence.json)
- **Demonstrated Facts:**
  - **W1 (DOM_MUTATION):** 7 live observations
  - **W2 (ACCESSIBILITY_STATE_MUTATION):** 2 live observations
  - **W3 (HISTORY_STATE_MUTATION):** 2 live observations
  - **W4 (CLIENT_ROUTE_MUTATION):** 2 live observations
  - **W5 (APPLICATION_STATE_MUTATION):** 6 live observations
  - **W6 (ASYNC_ACKNOWLEDGEMENT):** 2 live observations
  - 100% of declared classes demonstrated in real Chromium sessions with quorum $\ge 2$.

---

## Unit & Integration Test Evidence (25 Files / 271 Tests)

All 271 tests pass in Vitest 4.1.11 under Node v20.17.0:

| Test File | What It Proves | Count | Status |
| :---| :---| :---: | :---: |
| `test/unit/generic_capability.spec.ts` | Extensible generic capability schema and dynamic entity resolution | 7 | PASS |
| `test/unit/fingerprint.spec.ts` | Deterministic fingerprint hash computation strictly on functional primitives | 7 | PASS |
| `test/unit/security_privacy.spec.ts` | Local browser execution boundary and sanitization | 3 | PASS |
| `test/unit/semantic_precedence.spec.ts` | Invariant gating takes absolute precedence over semantic similarity | 1 | PASS |
| `test/unit/drift.spec.ts` | 5D typed interface-drift vector detection and classification | 4 | PASS |
| `test/unit/drift_matrix.spec.ts` | Comprehensive 5D drift test matrix across orthogonal dimensions | 21 | PASS |
| `test/unit/presentation_drift.spec.ts` | Presentation-only drift does not invalidate functional routes | 1 | PASS |
| `test/unit/quarantine.spec.ts` | Route quarantine, provisional storage, promotion, demotion lifecycle | 3 | PASS |
| `test/unit/authorization.spec.ts` | Authorization gate: quorum, risk class, confirmation token requirements | 4 | PASS |
| `test/unit/binding_handle.spec.ts` | DOM binding handle resolution and volatile ID independence | 2 | PASS |
| `test/unit/ordering.spec.ts` | Ranking pipeline: post-gate ordering, contradiction penalty | 2 | PASS |
| `test/unit/ranking_verification.spec.ts` | Multi-dimensional evidence-driven candidate ranking | 9 | PASS |
| `test/unit/graph.spec.ts` | Capability-state graph topology and route version management | 3 | PASS |
| `test/unit/intent.spec.ts` | Intent normalization, classification, and target entity resolution | 4 | PASS |
| `test/unit/suppression.spec.ts` | Volatile feature suppression (generated IDs, transient classes) | 3 | PASS |
| `test/unit/audit.spec.ts` | Structured audit record generation | 1 | PASS |
| `test/unit/activation_events.spec.ts` | Preservation of declared browser activation event types | 12 | PASS |
| `test/unit/persistence.spec.ts` | Persistent storage engine: schema versioning, checksum validation | 14 | PASS |
| `test/unit/invariant.spec.ts` | Invariant closure: positive/negative predicates, PASS/FAIL/CONTRADICTED | 25 | PASS |
| `test/unit/invariant_closure_verification.spec.ts` | Preconditions PRE_1 through PRE_16 gating execution state entry | 24 | PASS |
| `test/unit/causal.spec.ts` | Causal verifier: temporal ordering, pre-existing rejection, quorum | 31 | PASS |
| `test/unit/false_success.spec.ts` | False-success scenarios fail safely; 17 individual precondition knockouts | 32 | PASS |
| `test/adversarial/matrix.spec.ts` | 26 adversarial scenarios across the full pipeline | 26 | PASS |
| `test/properties/properties.spec.ts` | Mathematical and safety invariant properties across the state machine | 15 | PASS |
| `test/e2e/browser_e2e.spec.ts` | JSDOM-level E2E integration tests for all 4 mock sites | 17 | PASS |
| **Total Test Suite** | **25 Passed Test Files** | **271 Passed Tests** | **100% PASS** |

---

## Controlled Simulated Benchmark

| Benchmark Experiment | What It Measures | Runs | Environment | Labeling |
| :---| :---| :---: | :---: | :---: |
| IntentNav-SCFR accuracy vs Baselines 1–4 | Target-ID selection rate across 100 intents × 4 sites | 2,000 | `benchmark/runner.ts` (JSDOM) | **CONTROLLED SIMULATED BENCHMARK** — NOT real browser |
| Protocol accuracy: JSDOM route recovery | Whether routing decisions survive structural drift | 2,000 | `benchmark/runner.ts` (JSDOM) | **CONTROLLED SIMULATED BENCHMARK** |

> [!CAUTION]
> Benchmark results use `SITE_EXPECTED_ELEMENT_IDS` (ground-truth DOM IDs) to evaluate element selection in JSDOM because real Chromium mutation events are not available in JSDOM. Benchmark measures the **decision pipeline accuracy** but not **real browser dispatch, mutation witness capture, or causal verification**. Do not claim these as real browser evidence.

---

## Scope Boundaries & What Has NOT Been Demonstrated

| Boundary / Gap | Status | Notes |
|:---|:---:|:---|
| Generalization to commercial websites (beyond 4 mock sites) | NOT_VERIFIED | Evidence is limited to Sites A–D under controlled experimental conditions |
| Robustness across all major browser versions (only Chrome/153) | NOT_VERIFIED | Only tested on `Google Chrome 153.0.8010.53` headless |
| High-load / multi-threaded concurrency behavior | NOT_VERIFIED | Single-threaded sequential test runs only |
| Cross-tab / multi-frame iframe navigation | NOT_VERIFIED | Single top-level page context only |
| Real Chrome performance benchmarking (memory, CPU profiling) | NOT_VERIFIED | Only JSDOM benchmark timing; no Chrome DevTools performance trace |
| Independent third-party replication | NOT_VERIFIED | All evidence produced by the internal test harness |

---

## Complete Reproducibility Command Suite

```bash
# 1. Clean Dependency Installation
npm ci

# 2. Static Typecheck
npm run typecheck

# 3. Production Bundle Build
npm run build

# 4. Unit & Integration Test Suite (271 tests)
npm test

# 5. Positive Chromium E2E (Scenarios A–J)
npm run test:e2e:chromium

# 6. Validate Positive Evidence
npm run validate:evidence

# 7. Negative Chromium E2E (Scenarios N1–N14)
npm run test:e2e:chromium:neg

# 8. Validate Negative Evidence
npm run validate:evidence:neg

# 9. Real CDP Network Privacy Trace (Claim 11)
npm run test:e2e:chromium:privacy

# 10. Validate Network Privacy Evidence
npm run validate:network-privacy

# 11. Real Chromium Route Rollback (Claim 10)
npm run test:e2e:chromium:rollback

# 12. Validate Route Rollback Evidence
npm run validate:rollback

# 13. Real Chromium 6-Class Witness Trace (Claim 8)
npm run test:e2e:chromium:witnesses

# 14. Validate 6-Class Witness Evidence
npm run validate:witness-classes

# 15. All 5 Deterministic Validators Chain
npm run validate:evidence && \
npm run validate:evidence:neg && \
npm run validate:network-privacy && \
npm run validate:rollback && \
npm run validate:witness-classes
```
