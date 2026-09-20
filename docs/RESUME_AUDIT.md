# IntentNav-SCFR: Resume Remediation Audit

This document audits the exact implementation state of the IntentNav-SCFR codebase as of the resumption of the engineering pass, adhering strictly to empirical verification principles (no claims based solely on type definitions or comments).

---

## Overall Summary Table

| Remediation Item / Subsystem | Status | Verification Evidence / Location | Remaining Gaps |
| :--- | :--- | :--- | :--- |
| **Manifest V3 Extension & Service Worker** | **COMPLETE** | `manifest.json`, `dist/background.js`, `src/browser/background.ts` | None; MV3 build succeeds and registers service worker. |
| **InterfaceObserver & Mutation Interception** | **COMPLETE** | `src/browser/observer/interfaceObserver.ts`, `src/browser/contentScript.ts` | None; handles DOM, a11y, history mutations. |
| **No `data-capability-id` in Mock Sites** | **COMPLETE** | `mock-sites/site-a`, `site-b`, `site-c`, `site-d` (0 occurrences across all HTML/JS) | None; candidate extraction operates on semantic roles, labels, and DOM structure. |
| **5D Typed Drift Localization** | **COMPLETE** | `src/core/drift/typedDriftDetector.ts`, `test/unit/drift.spec.ts` (4/4 pass) | None; computes [P, C, S, Cap, T] drift vector. |
| **Persistent Capability Store** | **COMPLETE** | `src/core/storage/persistentStore.ts`, `test/unit/persistence.spec.ts` (5/5 pass) | None; supports synchronous hydration, state machine re-init, and LRU pruning. |
| **Invariant Closure Engine** | **COMPLETE** | `src/core/invariant/invariantEngine.ts`, `test/unit/invariant.spec.ts` (4/4 pass) | None; evaluates pre-state, delta, post-state, context, and role invariants. |
| **Negative Evidence Store** | **COMPLETE** | `src/core/contradiction/negativeEvidenceStore.ts`, `test/properties/properties.spec.ts` | None; persists fingerprint hashes, rejection reasons, and suppresses recurring decoys. |
| **Route Manager & Quarantine Isolation** | **COMPLETE** | `src/core/graph/routeManager.ts`, `src/core/quarantine/quarantineController.ts` | None; isolates provisional routes and requires token binding. |
| **Execution Authorization Controller** | **COMPLETE** | `src/core/authorization/authorizationController.ts`, `test/unit/authorization.spec.ts` (4/4 pass) | None; gates high-risk capabilities pending confirmation. |
| **15 Formal Safety Properties** | **COMPLETE** | `test/properties/properties.spec.ts` (15/15 pass) | None; proves safety invariants across lifecycle. |
| **26 Adversarial Matrix Scenarios** | **COMPLETE** | `test/adversarial/matrix.spec.ts` (26/26 pass) | None; tests attacks A through Z. |
| **Browser Execution Dispatcher** | **PARTIALLY COMPLETE** | `src/browser/background.ts`, `src/browser/contentScript.ts` | `observePostState()` not implemented; dispatch failure and tab disconnection handling need strict checks. |
| **Strict `EXECUTED` State Semantics** | **PARTIALLY COMPLETE** | `src/core/stateMachine/machine.ts` | Must enforce all 11 conditions; currently transitions to `EXECUTED` without real post-state verification check. |
| **Real Post-State Verification** | **PARTIALLY COMPLETE** | `src/core/causal/verifier.ts`, `src/core/stateMachine/machine.ts` | Pre-state and post-state snapshots are not fully evaluated against `expectedPostState` property values in the loop. |
| **Causal Transition Verifier** | **PARTIALLY COMPLETE** | `src/core/causal/verifier.ts`, `test/unit/causal.spec.ts` (5/5 pass) | Needs deterministic transition matching function rejecting unrelated mutations, timeouts, wrong values, and verifying minimum distinct witness classes. |
| **Independent Witness Classes** | **PARTIALLY COMPLETE** | `src/types/transition.ts`, `src/browser/contentScript.ts` | Supported in types/content script; needs documentation and strict enforcement in verifier for $\ge 2$ independent channels. |
| **Client Route Mutation Channel (SPA)** | **NOT COMPLETE** | `src/browser/contentScript.ts` | `CLIENT_ROUTE_MUTATION` not generated from controlled SPA route outlet change. |
| **Real Async Acknowledgement Channel** | **PARTIALLY COMPLETE** | `mock-sites/site-b/app.js`, `src/browser/contentScript.ts` | Scaffolding exists in `contentScript.ts`; mock sites need controlled async operation emitting verifiable completion event. |
| **Synthetic Benchmark Elimination** | **PARTIALLY COMPLETE** | `benchmark/runner.ts` | Synthetic execution dispatcher still present in `benchmark/runner.ts` lines 624-670; must execute in real browser. |
| **Real Chromium / Playwright E2E** | **NOT COMPLETE** | `test/e2e/playwright/` (missing) | Needs real Chromium execution loading unpacked MV3 extension across Mock Sites A-D. |
| **Benchmark Metric Correction** | **PARTIALLY COMPLETE** | `benchmark/runner.ts` lines 917, 944 | Multipliers (`* 1.1`, `* 0.75`) present in summary calculation; must derive purely from raw trial counts. |
| **Old Simulated Results Archiving** | **NOT COMPLETE** | `evidence/archive/pre-remediation/` (missing) | Old simulated results must be moved to archive before generating genuine browser benchmark data. |
| **Claim Coverage Matrix (Claims 1–17)** | **PARTIALLY COMPLETE** | `docs/CLAIM_COVERAGE_MATRIX.md` | Needs updated evidence links to Playwright E2E tests, empirical trials, and realistic verification statuses. |

---

## Detailed Audit by Remediation Phase

### Phase 1: Clean Install + Types
- **Status:** **PARTIALLY COMPLETE**
- **Findings:** `src/` compiles with zero TypeScript errors under strict mode (`noUnusedLocals: true`, `noUnusedParameters: true`). `test/e2e/browser_e2e.spec.ts` has 8 type errors due to DOM window casting and unused variables.
- **Action Required:** Fix type errors in `test/e2e/browser_e2e.spec.ts`, ensure `npx tsc --noEmit` exits 0 cleanly.

### Phase 2: Complete Real Browser Execution
- **Status:** **PARTIALLY COMPLETE**
- **Findings:** `BrowserExecutionDispatcher` in `src/browser/background.ts` implements `dispatchActivation()` and `collectWitnesses()`, but lacks `observePostState()`. Content script handles `DISPATCH_ACTIVATION_EVENT` and `COLLECT_WITNESSES`, but lacks `OBSERVE_POST_STATE`.
- **Action Required:** Implement `observePostState()` on both sides; ensure dispatch fails cleanly on missing element or tab disconnection without fabricating events.

### Phase 3 & 4: Strict `EXECUTED` State & Real Post-State Verification
- **Status:** **PARTIALLY COMPLETE**
- **Findings:** State machine currently marks `EXECUTED` based on causal verification of witnesses, but does not enforce pre-state snapshot comparison against post-state snapshot and `expectedPostState` predicates.
- **Action Required:** Update `machine.ts` to capture pre-state, perform dispatch, collect witnesses, capture post-state, and evaluate post-state predicates before permitting `EXECUTED`.

### Phase 5 & 6: Strengthen Causal Verification & Independent Witness Classes
- **Status:** **PARTIALLY COMPLETE**
- **Findings:** `CausalTransitionVerifier` checks time bounds and event correlation, but lacks a strict deterministic matching function for full functional state delta and does not reject unrelated mutations or require $\ge 2$ distinct witness classes.
- **Action Required:** Enhance `verifier.ts` to enforce independent witness classes and strict delta verification. Document definitions in `docs/CAUSAL_TRANSITION_VERIFICATION.md`.

### Phase 7 & 8: Client Route Mutation & Real Async Acknowledgement
- **Status:** **NOT COMPLETE**
- **Findings:** Content script intercepts `history.pushState` but doesn't emit `CLIENT_ROUTE_MUTATION` with route outlet details. Mock sites lack a controlled async job emitting verifiable completion.
- **Action Required:** Wire SPA route state change event and mock-site async export job with genuine event listener.

### Phase 9, 18, 19, 21: Benchmark Execution, Metrics, Raw Data & Archiving
- **Status:** **PARTIALLY COMPLETE**
- **Findings:** `benchmark/runner.ts` contains simulated dispatchers and formulaic adjustments (`* 1.1`, `* 0.75`). Old JSON files in `benchmark/results/` and `evidence/experiment-run/` represent simulated runs.
- **Action Required:** Archive old files to `evidence/archive/pre-remediation/`. Remove hardcoded formulas. Implement real browser/DOM execution. Log comprehensive raw trial records and calculate honest metrics.

### Phase 10: Real Chromium E2E
- **Status:** **NOT COMPLETE**
- **Findings:** `test/e2e/browser_e2e.spec.ts` runs inside JSDOM. A real Chromium runner loading unpacked extension is needed.
- **Action Required:** Build a dedicated Chromium test runner targeting `/Applications/Google Chrome.app` (or Playwright/CDP) loading `dist/` and executing against mock sites.

### Phase 14, 15, 16, 17: Negative Evidence, Persistence Restart, Route Gating & Rollback
- **Status:** **COMPLETE / PARTIALLY COMPLETE**
- **Findings:** Unit, adversarial, and property tests verify negative evidence and persistence. Hard promotion gate with route token binding is tested in `test/properties/properties.spec.ts`.
- **Action Required:** Ensure restart and rollback tests are integrated into regression suites.

### Phase 22 & 23: Claim Coverage Matrix & Security Gate
- **Status:** **PARTIALLY COMPLETE**
- **Findings:** `docs/CLAIM_COVERAGE_MATRIX.md` exists but has not been mapped to the real browser tests and genuine trial data.
- **Action Required:** Update Claim Coverage Matrix for Claims 1–17 with strict statuses (`VERIFIED`, `PARTIALLY VERIFIED`, `NOT VERIFIED`).

