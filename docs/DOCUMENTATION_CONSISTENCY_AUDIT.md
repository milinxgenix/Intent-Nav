# IntentNav-SCFR: Documentation & Claim Matrix Consistency Audit

**Date of Audit:** September 24, 2026
**Auditor:** Principal Software Architect & Verification Lead
**Scope:** Repository-wide audit of all technical documentation, specifications, and claim matrices to eliminate stale metric values, unsupported claims of empirical verification, inaccurate cryptographic terminology, and discrepancies between controlled simulation benchmarks and real Chromium browser evidence.

---

## 1. Authoritative Sources of Truth

Every documented metric, test count, and architectural state in this repository derives strictly from an established source of truth:

| Domain | Authoritative Source of Truth | Key Verified Values |
| :--- | :--- | :--- |
| **Controlled JSDOM Benchmark** | `benchmark/results/summary.json` | 2,000 total runs (100 intents × 4 sites × 5 paradigms); Top-1 Accuracy: 59.0%; UI-Change Recovery: 56.1%; Decoy Rejection: 100.0%; Simulated Transition Validation Rate: 28.5%; Unauthorized High-Risk Actions: 0; Mean Latency: 9.3 ms; Clicks-Saved: `NOT_MEASURED`. |
| **Real Chromium E2E (Positive)** | `evidence/chromium_e2e_evidence.json` | 10/10 scenarios (Scenarios A–J) executed in live Chromium (`Chrome/153.0.8010.52`) over CDP WebSocket with live MV3 extension, real DOM MouseEvent dispatch, multi-channel witness collection, independent post-state observation, and causal verification. |
| **Real Chromium E2E (Negative)** | `evidence/chromium_e2e_negative_evidence.json` | 14/14 scenarios (Scenarios N1–N14) safely refused or quarantined under adversarial conditions (precondition failure, missing witness, single witness class, contradictory delta, wrong post-state, forged token, unconfirmed high-risk action). |
| **Automated Test Suite** | `npm test` (`vitest run test/`) | 25 test files, 271 unit, integration, adversarial matrix, property, and browser E2E tests passing cleanly with zero failures. |
| **Type Integrity & Build** | `npx tsc --noEmit` & `npm run build` | Zero TypeScript compilation errors; production Manifest V3 extension bundle generated in `dist/`. |
| **Authoritative Claim Baseline** | `v6.docx` & `docs/CLAIM_RECONCILIATION.md` v2.0 | 20 patent claims (Claims 1–20 / REQ-C1–REQ-C20), reconciled across `v6.docx`, `patent.docx`, and `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx`. |

---

## 2. Itemized Conflict Reconciliation Table

The following table itemizes all detected conflicting, stale, or overclaimed statements across the repository, alongside the authoritative value and the corrective action taken:

| File | Line(s) | Old Statement | Current Authoritative Value | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `README.md` | 6 | `[![Tests](https://img.shields.io/badge/tests-129%2F129%20passing-brightgreen.svg)]()` | 25 test files, 271/271 passing tests | Updated badge to `271/271 passing`. |
| `README.md` | 61 | `...cryptographic authorization tokens) is separately verified and reported in evidence/chromium_e2e_positive_evidence.json...` | Verified deterministic authorization tokens (SHA-256 route binding, not asymmetric cryptography); file is `evidence/chromium_e2e_evidence.json` | Corrected file path to `chromium_e2e_evidence.json` and terminology to `verified deterministic authorization tokens`. |
| `README.md` | 96 | `60 version-controlled test intents (intents.json)` | 100 version-controlled test intents | Corrected intent count from 60 to 100. |
| `README.md` | 99 | `1,200-trial benchmark execution engine` | 2,000-trial benchmark execution engine (100 intents × 4 sites × 5 paradigms) | Corrected trial count from 1,200 to 2,000. |
| `README.md` | 105 | `CLAIM_COVERAGE_MATRIX.md # Detailed mapping for Claims 1–17` | Claims 1–20 under authoritative v2.0 baseline | Updated claim mapping reference to Claims 1–20. |
| `README.md` | 112 | `Cryptographic claim evidence packages (1–17)` | Empirical browser evidence packages (Scenarios A–J, N1–N14) | Replaced with `Empirical browser evidence packages (Scenarios A–J, N1–N14)`. |
| `README.md` | 115 | `node scripts/serveMocks.js # Local HTTP server for mock sites (port 8080)` | Local mock server runs on port 3000 | Corrected port from 8080 to 3000. |
| `README.md` | 162 | `all 21 automated test suites (129 unit, causal, adversarial, and property tests)` | 25 automated test suites (271 tests) | Updated test suite and test counts to 25 suites / 271 tests. |
| `docs/BENCHMARKS.md` | 5 | `...cryptographic authorization tokens) is separately evaluated and reported in evidence/chromium_e2e_positive_evidence.json...` | Verified deterministic authorization tokens; file is `evidence/chromium_e2e_evidence.json` | Updated file path to `chromium_e2e_evidence.json` and terminology to `verified deterministic authorization tokens`. |
| `benchmark/results/report.md` | 5 | `...cryptographic authorization tokens) is separately evaluated and reported in evidence/chromium_e2e_positive_evidence.json...` | Verified deterministic authorization tokens; file is `evidence/chromium_e2e_evidence.json` | Synchronized with `docs/BENCHMARKS.md`. |
| `docs/REPRODUCIBILITY.md` | 33–58 | Stale test suite execution block showing 21 passed files (119 passed tests) | 25 passed test files (271 passed tests) | Updated expected output block to reflect current 25 test files and 271 tests. |
| `docs/REPRODUCIBILITY.md` | 88 | `Emits raw cryptographic evidence with timestamps...` | Raw empirical browser evidence with timestamps | Replaced `raw cryptographic evidence` with `raw empirical browser evidence`. |
| `docs/REPRODUCIBILITY.md` | 89–90 | Lists only `evidence/chromium_e2e_evidence.json` | Both positive (`chromium_e2e_evidence.json`) and negative (`chromium_e2e_negative_evidence.json`) evidence exist | Added `evidence/chromium_e2e_negative_evidence.json`. |
| `docs/REPRODUCIBILITY.md` | 95 | `...across 100 intents and 4 mock environments (1,200 trials total):` | 2,000 trials total (100 intents × 4 sites × 5 paradigms) | Corrected trial count from 1,200 to 2,000 trials total. |
| `docs/REPRODUCIBILITY.md` | 98–99 | `npm run benchmark` | `npx tsx benchmark/runner.ts` | Updated command to current benchmark runner execution command. |
| `docs/REPRODUCIBILITY.md` | 138 | `http://localhost:8080/site-a/ or site-b/` | `http://localhost:3000/mock-sites/site-a/ or site-b/` | Corrected port and endpoint path. |
| `docs/REPRODUCIBILITY.md` | 141 | `...download append-only cryptographic audit logs.` | Append-only structured audit logs | Replaced `cryptographic audit logs` with `structured audit logs`. |
| `docs/REPRODUCIBILITY.md` | 147–151 | `The project includes cryptographic audit evidence packages in evidence/: evidence/claim_1_evidence.json through evidence/claim_17_evidence.json ... To verify that all 17 claims ... hold` | Evidence packages are `chromium_e2e_evidence.json` and `chromium_e2e_negative_evidence.json`; claims are 1–20 | Replaced stale non-existent claim evidence files with real Chromium evidence files and rephrased claim verification scope. |
| `docs/RISK_AUTHORIZATION.md` | 39 | `...a cryptographic or UI confirmation token from the user interface.` | Tamper-evident confirmation token or explicit UI confirmation | Replaced `cryptographic` with `tamper-evident confirmation token`. |
| `docs/RISK_AUTHORIZATION.md` | 50 | `...emitted to the cryptographic audit trail prior to confirmation request.` | Append-only audit trail | Removed inaccurate `cryptographic` descriptor. |
| `docs/RISK_AUTHORIZATION.md` | 58 | `Across 1,200 benchmark runs spanning 4 mock sites...` | Across 2,000 controlled simulated benchmark runs | Corrected trial count from 1,200 to 2,000 controlled simulated benchmark runs. |
| `docs/EXPERIMENT_PROTOCOL.md` | 24–27 | Ports specified as `http://localhost:8080/site-a/` through `site-d/` | `http://localhost:3000/mock-sites/site-a/` through `site-d/` | Corrected host port from 8080 to 3000 and URL path to `/mock-sites/`. |
| `docs/EXPERIMENT_PROTOCOL.md` | 33–38 | `containing 60 version-controlled evaluation intents ... (12 intents per category)` | 100 version-controlled evaluation intents (20 intents per category) | Corrected intent count from 60 (12/cat) to 100 (20/cat). |
| `docs/EXPERIMENT_PROTOCOL.md` | 53 | `Total Runs = 60 Intents * 4 Sites * 5 Systems = 1,200 Runs` | `Total Runs = 100 Intents * 4 Sites * 5 Systems = 2,000 Runs` | Updated formula and trial count to 2,000 Runs. |
| `docs/EXPERIMENT_PROTOCOL.md` | 56 | `hosting Sites A–D on port 8080` | Local server port 3000 | Corrected port to 3000. |
| `docs/EXPERIMENT_PROTOCOL.md` | 65 | `benchmark/results/benchmark_summary.json` | `benchmark/results/summary.json` | Updated filename to actual generated summary path. |
| `docs/FINAL_CURRENT_STATE_AUDIT.md` | 17, 52 | `20 test files, exactly 155 unit and integration tests passing...` | 25 test files, 271 unit and integration tests passing | Updated test count from 20 files / 155 tests to 25 files / 271 tests. |
| `docs/FINAL_CURRENT_STATE_AUDIT.md` | 34 | `Strict cryptographic binding in TransitionVerificationToken...` | Strict tamper-evident token binding | Replaced `cryptographic binding` with `tamper-evident token binding`. |
| `docs/CLAIM_RECONCILIATION.md` | 419 | `REQ-NC9: Cryptographic Route Promotion Token` | Tamper-evident Route Promotion Token | Replaced `Cryptographic` with `Tamper-Evident`. |
| `docs/CLAIM_RECONCILIATION.md` | 426 | `JSDOM 1200-trial suite` | JSDOM 2000-trial suite | Updated trial count from 1,200 to 2,000. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 9–15 | Verification hierarchy defined `EMPIRICALLY_VERIFIED` as umbrella status | Required granular standards: `IMPLEMENTED`, `UNIT_TESTED`, `INTEGRATION_TESTED`, `BROWSER_E2E_TESTED`, `EMPIRICALLY_DEMONSTRATED`, `BENCHMARK_MEASURED`, `PROTOCOL_PROPOSED` | Updated verification level hierarchy with precise definitions. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 22 | Claim 1 (Independent Method) marked `EMPIRICALLY_VERIFIED` | Closed-loop prototype method tested across Scenarios A–J in Chrome CDP | Reclassified to `BROWSER_E2E_TESTED / EMPIRICALLY_DEMONSTRATED (Scenarios A–J)`. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 24, 26, 27 | Claims 3, 5, 6 marked `EMPIRICALLY_VERIFIED` | Demonstrable via live Chromium Scenario J (Site D decoy rejection) | Clarified to `EMPIRICALLY_DEMONSTRATED`. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 39 | Claim 18 marked `INTEGRATION_TESTED` with 2,000 runs note | Simulated benchmark evaluation (JSDOM) | Marked `INTEGRATION_TESTED / BENCHMARK_MEASURED`. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 40 | Claim 19 (Statutory Computing System) marked `EMPIRICALLY_VERIFIED` | Statutory claim covering computing apparatus/processor; implemented in software architecture and executed on general-purpose hardware | Reclassified from `EMPIRICALLY_VERIFIED` to `IMPLEMENTED`. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 41 | Claim 20 (Statutory Computer-Readable Medium) marked `EMPIRICALLY_VERIFIED` | Statutory claim covering storage medium; packaged in distribution build artifacts | Reclassified from `EMPIRICALLY_VERIFIED` to `IMPLEMENTED`. |
| `docs/CLAIM_COVERAGE_MATRIX.md` | 40, 73 | `All 20 Automated Test Files (155 tests passing)` | 25 test files with 271 tests verified | Updated test counts to 25 files / 271 tests. |
| `docs/FINAL_TECHNICAL_AUDIT.md` | 5 | `Status: ALL 17 CLAIMS FULLY VERIFIED & EMPIRICALLY DEMONSTRATED` | Overbroad claim; project has 20 authoritative claims; statutory claims are implemented; empirical evidence covers mock sites | Updated to accurately describe verification across 25 suites, 2,000 JSDOM trials, and 24 Chromium E2E scenarios. |
| `docs/FINAL_TECHNICAL_AUDIT.md` | 209 | `All 20 test files (106 automated tests passing...)` | All 25 test files (271 automated tests passing) | Updated test counts to 25 files / 271 tests. |

---

## 3. Strict Demarcation of Verification Levels

To prevent overclaiming, every claim limitation and architectural subsystem is classified under the following rigorous verification hierarchy:

1. **`IMPLEMENTED`**:
   - Production TypeScript source code exists with strict static typing and runtime validation.
   - Applies to statutory apparatus and medium claims (Claim 19, Claim 20) and core architecture before test coverage.
2. **`UNIT_TESTED`**:
   - Component logic, boundary conditions, and mathematical invariants verified in isolation via Vitest.
   - Examples: `test/unit/suppression.spec.ts` (volatile feature suppression), `test/unit/causal.spec.ts` (temporal window validation).
3. **`INTEGRATION_TESTED`**:
   - Multi-module pipeline executed end-to-end within the Node.js/JSDOM runtime harness.
   - Examples: `test/adversarial/matrix.spec.ts` (Scenarios A through Z), `test/properties/properties.spec.ts` (Safety Properties 1–10).
4. **`BROWSER_E2E_TESTED`**:
   - Verified inside genuine Google Chrome (`Chrome/153.0.8010.52`) through Chrome DevTools Protocol (CDP) WebSocket sessions. Production Manifest V3 extension loaded unpacked with zero page script injection.
   - Examples: Scenarios A–J in `evidence/chromium_e2e_evidence.json` and Scenarios N1–N14 in `evidence/chromium_e2e_negative_evidence.json`.
5. **`EMPIRICALLY_DEMONSTRATED`**:
   - Demonstrated on live mock web applications under real browser conditions, with end-to-end evidence captured and confirmed by an external, independent validator (`scripts/validateChromiumEvidence.js`).
   - Specifically applicable to dynamic label drift, modal handling, and adversarial decoy rejection (Scenario J on Site D).
6. **`BENCHMARK_MEASURED`**:
   - Measured statistically across repeated simulated trials in a controlled test harness (JSDOM, 2,000 trials).
   - Distinct from real browser execution; measures algorithmic decision accuracy without real browser rendering or CDP.
7. **`PROTOCOL_PROPOSED`**:
   - Defined as an experimental protocol or specification target (e.g. multi-site generalization to unknown commercial web architectures).

---

## 4. Distinction Between JSDOM Simulation and Real Chromium Evidence

A primary finding of this audit is the critical distinction between the **Controlled Simulated Benchmark** and **Real Browser Evidence**:

```
┌────────────────────────────────────────────────────────┐
│          Controlled Simulated Benchmark (JSDOM)        │
│  - 2,000 factorial trials (100 intents × 4 sites × 5) │
│  - Environment: Node.js v20 / JSDOM (headless DOM)     │
│  - Dispatch: Synthetic DOM dispatch in JSDOM window    │
│  - Purpose: Comparative algorithmic accuracy           │
│  - Results: 59.0% Top-1 Accuracy, 9.3 ms Mean Latency  │
│  - Transition Validation: 28.5% (observed vs expected) │
│  - Clicks Saved: NOT_MEASURED                          │
└────────────────────────────────────────────────────────┘
                           ≠
┌────────────────────────────────────────────────────────┐
│             Real Chromium Evidence (CDP)               │
│  - 10 Positive Scenarios (A–J), 14 Negative (N1–N14)   │
│  - Environment: Real Google Chrome (v153) + Blink      │
│  - Dispatch: Genuine MouseEvent click in browser       │
│  - Extension: Production Manifest V3 loaded unpacked   │
│  - Communication: Native chrome.runtime messaging      │
│  - Witnesses: Real MutationObserver & AppState bridge  │
│  - Causal Verification: Monotonic timestamp quorum     │
│  - Negative Refusal: 14/14 safely blocked/quarantined  │
└────────────────────────────────────────────────────────┘
```

The repository documentation now explicitly maintains this boundary:
- No JSDOM simulated metric is reported as "browser verified".
- The 28.5% transition validation rate in JSDOM is explicitly documented as measuring observed mock application/DOM state changes against expected capability deltas in JSDOM, and is not conflated with real-browser multi-channel causal witness verification.
- Clicks-saved is explicitly recorded as `NOT_MEASURED` due to the lack of ground-truth human interaction baselines in flat single-page mock architectures.

---

## 5. Cryptographic vs. Deterministic/Tamper-Evident Terminology Audit

The codebase was audited to eliminate inappropriate uses of the word "cryptographic":

1. **Route Promotion Token (`TransitionVerificationToken`)**:
   - *Implementation:* Formed by computing a SHA-256 digest over `capabilityId`, `routeId`, `activationEventId`, and timestamp.
   - *Technical Reality:* Provides a deterministic, tamper-evident hash binding to verify that a token generated for `Route_X` cannot be used to promote `Route_Y`. It does *not* utilize public-key digital signatures, HMAC secrets, or a certificate authority.
   - *Action Taken:* All documentation references were updated from "cryptographic verification token" to "tamper-evident verification token" or "deterministic authorization token".
2. **Audit Trail (`AuditLogger`)**:
   - *Implementation:* Emits structured JSON records with parent hash chaining for append-only tamper evidence.
   - *Technical Reality:* Provides append-only integrity checking, not cryptographic non-repudiation across hostile nodes.
   - *Action Taken:* Updated references from "cryptographic audit trail" to "append-only structured audit trail".

---

## 6. Generalization Boundaries & Operational Scope

In accordance with Prompt 11 remediation, the documentation explicitly reflects the actual operational boundaries:
- The system supports **generic capability schema and dynamic target matching** (`src/core/capability/catalog.ts`, `src/core/candidate/generator.ts`), allowing arbitrary capabilities outside the benchmark taxonomy to be defined, resolved, and verified without hardcoded special cases (verified in `test/unit/generic_capability.spec.ts`).
- However, full open-world website independence is **not** claimed. The current implementation evaluates controlled mock web applications (Sites A, B, C, D) and documented synthetic enterprise scenarios. Unbounded web crawling, zero-shot arbitrary DOM semantic discovery, and cross-origin iframe traversal remain documented operational limits (`docs/LIMITATIONS.md`).

---

## 7. Audit Conclusion

All conflicting numbers, stale trial counts, exaggerated marketing claims, and inappropriate technical terminology have been systematically reconciled across the repository. The documentation is now 100% consistent with the authoritative benchmark outputs (`summary.json`), the real Chromium browser evidence (`chromium_e2e_evidence.json`, `chromium_e2e_negative_evidence.json`), the 25 automated test suites (271 passing tests), and the governing 20-claim patent specification.
