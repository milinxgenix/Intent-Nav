# IntentNav-SCFR: Final Evidence Index

**Version:** 2.0 (Authoritative Verification Baseline)
**Status:** FINAL POST-FIX VERIFICATION COMPLETED — BASELINE READY FOR FREEZE REVIEW
**Governing Standard:** `docs/CLAIM_RECONCILIATION.md` v2.0 + `v6.docx` priority.  
**Git Revision:** `ebcdb3b` (HEAD on branch `post-audit-fixes`)
**Execution Environment:** Google Chrome `Google Chrome 153.0.8010.53` (Headless) + CDP over WebSocket
**Positive E2E Run ID:** `run_chromium_1790270497220` (10/10 scenarios EXECUTED and VERIFIED)
**Negative E2E Run ID:** `run_neg_chromium_1790270587593` (14/14 scenarios REFUSED/SAFELY RESOLVED — zero safety failures)
**Extension Packaging:** Unpacked MV3 loaded via CDP `Extensions.loadUnpacked` with zero webpage script injection (Extension ID: `inieeohgmebogmomdhdpabieolhdfdme`)

### Verification Sequence Timestamps (Rebuilt and Regenerated Post-Build)
1. **Source Code Finalized:** 2026-09-24T17:15:00Z
2. **Production Build Completed (`npm run build`):** 2026-09-24T17:20:53Z
3. **Automated Test Suite (25 files, 271 tests passing):** 2026-09-24T17:21:01Z
4. **Positive A–J Evidence Generated (`evidence/chromium_e2e_evidence.json`):** 2026-09-24T17:21:51Z
5. **Negative N1–N14 Evidence Generated (`evidence/chromium_e2e_negative_evidence.json`):** 2026-09-24T17:23:54Z
6. **Validators Executed (`validateChromiumEvidence.js`, `validateNegativeEvidence.js`):** 2026-09-24T17:23:55Z

> [!IMPORTANT]
> This document distinguishes what the code **implements**, what unit/integration tests **prove**, what real Chromium execution **demonstrates**, what controlled benchmarks **measure**, and what has **NOT been demonstrated**. Every row maps to reproducible, auditable evidence.

---

## Verification Level Definitions

| Level | Meaning |
|:---:|:---|
| `IMPLEMENTED` | Production TypeScript source exists with strict types |
| `UNIT_TESTED` | Isolated component test passes via `npm test` |
| `INTEGRATION_TESTED` | Full multi-module pipeline runs end-to-end in Node.js/JSDOM |
| `BROWSER_E2E_TESTED` | Exercised in live Google Chrome via CDP; result captured in evidence file |
| `EMPIRICALLY_VERIFIED` | Chromium result independently validated by `validateChromiumEvidence.js` |
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
| N1 | Invariant violation — element has no role/aria-checked → invariant closure rejects it | `FAILED` / `ABSTAINED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N2 | Semantic decoy — two similar elements; correct one selected, purge decoy rejected | Not `EXECUTED` w/ decoy; or EXECUTED on correct | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N3 | Stale BindingHandle — system must not crash or silently fall back to getElementById | Any non-crash state | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N4 | No witnesses emitted — silent click handler → zero witnesses → causal failure | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N5 | Single witness class only — DOM_MUTATION only, no app-state event → quorum failure | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N6 | Contradictory witness delta → rejected as contradictory evidence | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N7 | Stale witness (pre-existing mutation before activation) → rejected | `QUARANTINED` / any | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N8 | Unrelated witness delta keys → don't contribute to quorum | `QUARANTINED` / any | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N9 | Wrong post-state — state not changed after activation → `postStateVerified=false` | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N10 | Failed causal verification — no valid evidence chain | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N11 | Invalid promotion token — causal & post-state pass, forged token supplied to promotion → rejected by RouteManager.promoteToActive() → route remains in QUARANTINED | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N12 | Unresolved quarantine — target route explicitly placed in QUARANTINED; witnesses emitted, canEnterExecutedState() reaches PRE_16 and rejects | `QUARANTINED` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N13 | IRREVERSIBLE delete account without confirmation → `CONFIRMATION_PENDING` | `CONFIRMATION_PENDING` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |
| N14 | IRREVERSIBLE revoke tokens without confirmation → refused | `CONFIRMATION_PENDING` / `FAILED` | `npm run test:e2e:chromium:neg` | `evidence/chromium_e2e_negative_evidence.json` | **BROWSER_E2E_TESTED** |

---

## Unit & Integration Test Evidence

| Test File | What It Proves | Count | Test Command | Level |
|:---|:---|:---:|:---:|:---:|
| `test/unit/generic_capability.spec.ts` | Extensible generic capability schema, dynamic target entities, invariant gating, closed loop | 7 | `npm test` | `UNIT_TESTED` |
| `test/unit/fingerprint.spec.ts` | Deterministic fingerprint hash computation based strictly on functional primitives | 7 | `npm test` | `UNIT_TESTED` |
| `test/unit/security_privacy.spec.ts` | Local browser execution boundary, sanitization of sensitive values, zero transmission | 3 | `npm test` | `UNIT_TESTED` |
| `test/unit/semantic_precedence.spec.ts` | Invariant gating takes absolute precedence over semantic similarity | 1 | `npm test` | `UNIT_TESTED` |
| `test/unit/drift.spec.ts` | 5D typed interface-drift vector detection and classification | 4 | `npm test` | `UNIT_TESTED` |
| `test/unit/drift_matrix.spec.ts` | Comprehensive 5D drift test matrix across all orthogonal dimensions | 21 | `npm test` | `UNIT_TESTED` |
| `test/unit/presentation_drift.spec.ts` | Presentation-only drift does not invalidate functional routes | 1 | `npm test` | `UNIT_TESTED` |
| `test/unit/quarantine.spec.ts` | Route quarantine, provisional storage, promotion, demotion lifecycle | 3 | `npm test` | `UNIT_TESTED` |
| `test/unit/authorization.spec.ts` | Authorization gate: quorum, risk class, confirmation token requirements | 4 | `npm test` | `UNIT_TESTED` |
| `test/unit/binding_handle.spec.ts` | DOM binding handle resolution and volatile ID independence | 2 | `npm test` | `UNIT_TESTED` |
| `test/unit/ordering.spec.ts` | Ranking pipeline: post-gate ordering, contradiction penalty | 2 | `npm test` | `UNIT_TESTED` |
| `test/unit/ranking_verification.spec.ts` | Multi-dimensional evidence-driven candidate ranking | 9 | `npm test` | `UNIT_TESTED` |
| `test/unit/graph.spec.ts` | Capability-state graph topology and route version management | 3 | `npm test` | `UNIT_TESTED` |
| `test/unit/intent.spec.ts` | Intent normalization, classification, and dynamic target entity resolution | 4 | `npm test` | `UNIT_TESTED` |
| `test/unit/suppression.spec.ts` | Volatile feature suppression (generated IDs, transient classes) | 3 | `npm test` | `UNIT_TESTED` |
| `test/unit/audit.spec.ts` | Structured audit record generation | 1 | `npm test` | `UNIT_TESTED` |
| `test/unit/activation_events.spec.ts` | Preservation of declared browser activation event types (`click`, `input`, `change`, `submit`) | 12 | `npm test` | `UNIT_TESTED` |
| `test/unit/persistence.spec.ts` | Persistent storage engine: schema versioning, checksum validation, migration | 14 | `npm test` | `UNIT_TESTED` |
| `test/unit/invariant.spec.ts` | Invariant closure: positive/negative predicates, PASS/FAIL/CONTRADICTED | 25 | `npm test` | `UNIT_TESTED` |
| `test/unit/invariant_closure_verification.spec.ts` | Preconditions PRE_1 through PRE_16 gating execution state entry | 24 | `npm test` | `UNIT_TESTED` |
| `test/unit/causal.spec.ts` | Causal verifier: temporal ordering, pre-existing rejection, window timeout, contradiction, quorum | 31 | `npm test` | `UNIT_TESTED` |
| `test/unit/false_success.spec.ts` | False-success scenarios fail safely; 17 individual precondition knockout tests (one per PRE) | 32 | `npm test` | `INTEGRATION_TESTED` |
| `test/adversarial/matrix.spec.ts` | 26 adversarial scenarios across the full pipeline | 26 | `npm test` | `INTEGRATION_TESTED` |
| `test/properties/properties.spec.ts` | Mathematical and safety invariant properties across the state machine | 15 | `npm test` | `UNIT_TESTED` |
| `test/e2e/browser_e2e.spec.ts` | JSDOM-level E2E integration tests for all 4 mock sites | 17 | `npm test` | `INTEGRATION_TESTED` |
| **Total Test Suite** | **25 Passed Test Files** | **271 Passed Tests** | `npm test` | **100% PASS** |

---

## Controlled Simulated Benchmark

| What | What It Measures | Runs | Runner | Labeling |
|:---|:---|:---:|:---:|:---:|
| IntentNav-SCFR accuracy vs Baselines 1–4 | Correct-target-ID selection rate across 100 intents × 4 sites | 2,000 | `benchmark/runner.ts` (JSDOM) | **CONTROLLED SIMULATED BENCHMARK** — NOT real browser |
| Protocol accuracy: JSDOM route recovery | Whether routing decisions survive structural drift in JSDOM | 2,000 | `benchmark/runner.ts` (JSDOM) | **CONTROLLED SIMULATED BENCHMARK** |

> [!CAUTION]
> Benchmark results use `SITE_EXPECTED_ELEMENT_IDS` (ground-truth DOM IDs) to simulate element selection in JSDOM — because real Chromium mutation events are not available in JSDOM. This means the benchmark measures the **decision pipeline accuracy** but not **real browser dispatch, real mutation witness capture, or real causal verification**. Do not claim these as real browser evidence.

---

## What Has NOT Been Demonstrated

| Gap | Status | Notes |
|:---|:---:|:---|
| Generalization to commercial websites (beyond 4 mock sites) | NOT_VERIFIED | Evidence is limited to Sites A–D under controlled conditions |
| Robustness across all major browser versions (only Chrome/153) | NOT_VERIFIED | Only tested on `Google Chrome 153.0.8010.53` headless |
| Simultaneous live verification of all six witness classes | NOT_VERIFIED | Positive Chromium E2E specifically records DOM and Application State mutations to satisfy the $\ge 2$ quorum; remaining classes are supported in implementation and unit-tested |
| Independent external network trace for Claim 11 | NOT_VERIFIED | Local execution boundary and credential sanitization are verified in unit tests; no independent CDP Network domain trace was recorded |
| High-load / concurrency behavior | NOT_VERIFIED | Single-threaded sequential test runs only |
| Cross-tab / multi-frame navigation | NOT_VERIFIED | Single page context only |
| Performance benchmarks in real Chrome (latency, memory) | NOT_VERIFIED | Only JSDOM timing; no real Chrome profiling |
| N1–N3 producing exact expected states | PARTIALLY_VERIFIED | These negative scenarios may produce variant non-EXECUTED states depending on intent normalization; safety is preserved regardless |
| Independent third-party replication | NOT_VERIFIED | All evidence produced by the same test harness |

---

## Reproducibility Instructions

```bash
# 1. Install dependencies (clean)
npm ci

# 2. TypeScript type check
npx tsc --noEmit

# 3. Unit and integration tests
npm test

# 4. Build production bundle
npm run build

# 5. Positive Chromium E2E (requires Google Chrome at /Applications/Google Chrome.app)
npm run test:e2e:chromium

# 6. Validate positive evidence
npm run validate:evidence

# 7. Negative Chromium E2E
npm run test:e2e:chromium:neg

# 8. Validate negative evidence
npm run validate:evidence:neg
```

> [!NOTE]
> Steps 5–8 require **Google Chrome** installed at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
> Chrome runs headless via CDP on local ports 9222 (positive) and 9223 (negative).
> A local HTTP server is started on port 3000/3001 to serve mock sites.
