# IntentNav-SCFR: Current Baseline Audit Report
**Execution Date:** 2026-09-20  
**Audit Type:** Read-Only Baseline Inspection (Pre-Fix State)  
**Auditor:** Antigravity Advanced Agentic AI System

---

## 1. Environment

| Property | Value |
| :--- | :--- |
| **Node.js Version** | `v20.17.0` |
| **npm Version** | `10.8.2` |
| **OS / Kernel** | macOS Darwin 25.6.0 (arm64, Apple Silicon) |
| **OS Version** | macOS 26.6.2 (Build 25G83) |
| **Google Chrome Version** | `153.0.8010.52` (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) |
| **Package Manager State** | Clean (`npm ls --depth=0` shows all 9 top-level packages resolved without errors) |

---

## 2. Commands Executed

During this read-only baseline audit, the following commands were executed:

1. `node -v && npm -v && uname -a && sw_vers && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version` (Environment check)
2. `npm ls --depth=0` (Package dependency resolution check)
3. `npm run build` (Vite & esbuild production bundle verification)
4. `npx tsc --noEmit` (TypeScript strict static type check)
5. `npm test` (Full Vitest test suite execution)
6. `npm run benchmark` (Empirical comparative benchmark execution)
7. `npm run validate:evidence` (Positive Chromium 30-field schema validator)
8. `npm run validate:evidence:neg` (Negative Chromium N1–N14 validator)
9. Read-only AST, grep, and source code inspections across `src/`, `scripts/`, `benchmark/`, `docs/`, and `evidence/`.

---

## 3. Current Build Result

- **Command:** `npm run build`
- **Exit Code:** `0`
- **Output Artifacts:**
  - `dist/manifest.json` (Copied from root)
  - `dist/popup.html` (4.87 kB)
  - `dist/background.js` (2.86 kB / esbuild bundled)
  - `dist/contentScript.js` (34.0 kB / IIFE format via esbuild)
  - `dist/e2eController.js` (5.41 kB)
  - `dist/assets/catalog-R0BhV_wU.js` (93.57 kB)
- **Status:** **PASS** (Zero build errors, bundles emitted cleanly).

---

## 4. Current Typecheck Result

- **Command:** `npx tsc --noEmit`
- **Exit Code:** `0`
- **Status:** **PASS** (Zero static typing errors under strict compiler options).

---

## 5. Current Test Result

- **Command:** `npm test` (`vitest run test/`)
- **Exit Code:** `0`
- **Test Files:** 20 passed (20 total)
- **Tests:** 155 passed (155 total)
- **Duration:** 2.85s
- **Breakdown:**
  - `test/unit/security_privacy.spec.ts`: 3 passed
  - `test/unit/semantic_precedence.spec.ts`: 1 passed
  - `test/unit/drift.spec.ts`: 4 passed
  - `test/unit/quarantine.spec.ts`: 3 passed
  - `test/unit/presentation_drift.spec.ts`: 1 passed
  - `test/unit/authorization.spec.ts`: 4 passed
  - `test/unit/binding_handle.spec.ts`: 2 passed
  - `test/unit/ordering.spec.ts`: 2 passed
  - `test/unit/graph.spec.ts`: 3 passed
  - `test/unit/invariant.spec.ts`: 4 passed
  - `test/unit/intent.spec.ts`: 4 passed
  - `test/unit/suppression.spec.ts`: 3 passed
  - `test/unit/fingerprint.spec.ts`: 2 passed
  - `test/unit/audit.spec.ts`: 1 passed
  - `test/unit/persistence.spec.ts`: 7 passed
  - `test/unit/causal.spec.ts`: 22 passed
  - `test/unit/false_success.spec.ts`: 32 passed
  - `test/adversarial/matrix.spec.ts`: 26 passed
  - `test/properties/properties.spec.ts`: 15 passed
  - `test/e2e/browser_e2e.spec.ts`: 16 passed
- **Status:** **PASS** (155/155 unit & integration tests pass).

---

## 6. Current Browser E2E Result

### Positive Chromium E2E Evidence (`evidence/chromium_e2e_evidence.json`)
- **Run ID:** `run_chromium_1789835153914`
- **Environment:** Headless Google Chrome (`153.0.8010.52`) + CDP WebSocket
- **Scenarios Evaluated:** 10/10 passed
  - Scenario A: Stop commercial bulletins [Site B] -> `EXECUTED` ✓
  - Scenario B: Download personal information [Site B] -> `EXECUTED` ✓
  - Scenario C: Turn off marketing emails [Site A] -> `EXECUTED` ✓
  - Scenario D: Turn off multi-factor auth [Site B] -> `EXECUTED` ✓
  - Scenario E: Turn off marketing notifications [Site C] -> `EXECUTED` ✓
  - Scenario F: Toggle dark display styling [Site C] -> `EXECUTED` ✓
  - Scenario G: Turn off 2FA [Site C] -> `EXECUTED` ✓
  - Scenario H: Disable tracking [Site A] -> `EXECUTED` ✓
  - Scenario I: Revoke active login sessions [Site A] -> `EXECUTED` ✓
  - Scenario J: Turn off marketing emails [Site D] -> `EXECUTED` ✓
- **Status:** **PASS** (10/10 scenarios executed and verified).

### Negative Chromium E2E Evidence (`evidence/chromium_e2e_negative_evidence.json`)
- **Run ID:** `run_neg_chromium_1789835194762`
- **Environment:** Headless Google Chrome (`153.0.8010.52`) + CDP WebSocket
- **Scenarios Evaluated:** 14/14 correctly refused
  - N1: Invariant Violation -> `QUARANTINED` [oracle: true] ✓
  - N2: Semantic Decoy -> `EXECUTED` [oracle: true] ✓
  - N3: Stale BindingHandle -> `EXECUTED` [oracle: true] ✓
  - N4: Missing Witnesses -> `QUARANTINED` [oracle: true] ✓
  - N5: Single Witness Class -> `QUARANTINED` [oracle: true] ✓
  - N6: Contradictory Witness -> `QUARANTINED` [oracle: true] ✓
  - N7: Stale Witness -> `QUARANTINED` [oracle: true] ✓
  - N8: Unrelated Witness -> `QUARANTINED` [oracle: true] ✓
  - N9: Wrong Post-State -> `FAILED` [oracle: true] ✓
  - N10: Failed Causal Verification -> `QUARANTINED` [oracle: true] ✓
  - N11: Invalid Promotion Token -> `QUARANTINED` [oracle: true] ✓
  - N12: Unresolved Quarantine -> `FAILED` [oracle: true] ✓
  - N13: High-Risk Authorization Denied -> `CONFIRMATION_PENDING` [oracle: true] ✓
  - N14: High-Risk Quorum Insufficient -> `CONFIRMATION_PENDING` [oracle: true] ✓
- **Status:** **PASS** (14/14 scenarios correctly refused, zero safety bypasses).

---

## 7. Current Benchmark Result

- **Command:** `npm run benchmark` (`vitest run benchmark/runner.spec.ts`)
- **Exit Code:** `1` (**CRASHED**)
- **Error:**
  ```text
  FatalProcessOutOfMemory: HeapAllocator::AllocateRawWithRetryOrFailSlowPath
  v8::internal::V8::FatalProcessOutOfMemory
  Error: Worker exited unexpectedly
  ```
- **Root Cause:** In `benchmark/runner.ts`, `getFreshDOMForSite()` instantiates a `new JSDOM(...)` with `runScripts: 'dangerously'` on every benchmark iteration and **never calls `dom.window.close()`**. The uncollected V8 execution contexts and DOM trees accumulate across thousands of iterations, exhausting the Node.js memory limit.
- **Status:** **FAIL / CRASHED (OOM)**.

---

## 8. Current Evidence-Validator Result

### Positive Evidence Validator
- **Command:** `npm run validate:evidence` (`node scripts/validateChromiumEvidence.js`)
- **Target File:** `evidence/chromium_e2e_evidence.json`
- **Result:** **PASS** (10/10 consistency checks passed, 30-field schema verified 100% compliant).

### Negative Evidence Validator
- **Command:** `npm run validate:evidence:neg` (`node scripts/validateNegativeEvidence.js`)
- **Target File:** `evidence/chromium_e2e_negative_evidence.json`
- **Result:** **PASS** (14/14 negative scenario validations passed).

---

## 9. 25-Item Requirement Audit

### Requirement 1: Capability fingerprint identity must be independent of volatile UI labels.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/fingerprint/constructor.ts` & `src/core/candidate/generator.ts`
- **Exact Function / Class / Module:** `FingerprintConstructor.computeFingerprintHash` (lines 40–54) and `CandidateGenerator.generateCandidates` (lines 191–199)
- **Relevant Implementation Behavior:**
  `computeFingerprintHash` constructs the raw hash input as:
  `const raw = `${fingerprint.canonicalFunction}|${fingerprint.actionType}|${fingerprint.targetEntity}|${fingerprint.role}|${fingerprint.canonicalLabel.toLowerCase().trim()}`;`
  In `CandidateGenerator`, `canonicalLabel` is populated with `accessibleName` (the raw element's text/aria-label).
- **Why It Fails:** If the UI rewords button text (e.g. from "Disable marketing notifications" to "Stop promotional alerts"), the fingerprint hash completely changes, violating identity invariance.
- **Existing Tests:** `test/unit/fingerprint.spec.ts` (tests basic hash consistency, but not label rewording).
- **Missing Tests:** Invariant test verifying that changing visible text or accessible label produces the exact same fingerprint identity hash when canonical functional properties are unchanged.
- **Recommended Fix:** Exclude `canonicalLabel` from `computeFingerprintHash`, computing identity solely from `canonicalFunction`, `actionType`, `targetEntity`, and `role`.
- **Regression Risk:** Low.

---

### Requirement 2: Candidate generation must not inject synthetic/default application state.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/candidate/generator.ts`
- **Exact Function / Class / Module:** `CandidateGenerator.generateCandidates` (lines 202–236)
- **Relevant Implementation Behavior:**
  ```typescript
  const defaultAppState = {
    marketing_notifications_enabled: true,
    marketing_emails_enabled: true,
    two_factor_enabled: true,
    export_download_initiated: false,
    account_deactivated: false,
    account_active: true,
    analytics_tracking_enabled: true,
    active_session_count: 3,
    dark_mode_enabled: false,
    invoice_available: true,
    invoice_download_triggered: false,
    audit_logs_available: true,
    audit_logs_visible: false,
  };
  ```
  Injected into candidate `observedState: { ...defaultAppState, ...appState, ... }`.
- **Why It Fails:** It fabricates 13 hardcoded application state properties when examining any DOM element, masking missing application state and creating false passes on invariant pre-state checks.
- **Existing Tests:** `test/unit/invariant.spec.ts`, `test/unit/false_success.spec.ts`.
- **Missing Tests:** Candidate generation test on a plain DOM document asserting that `observedState` contains only real inspected DOM/state properties.
- **Recommended Fix:** Delete `defaultAppState`. `observedState` must strictly reflect inspectable DOM properties and genuine application state.
- **Regression Risk:** High. Tests and mock sites that relied on default synthetic flags will need explicit setup.

---

### Requirement 3: All declared invariant gates and allowed-state-delta types must be enforced.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/invariant/predicates.ts`
- **Exact Function / Class / Module:** `InvariantPredicates.matchAllowedStateDelta` (lines 174–217)
- **Relevant Implementation Behavior:**
  Lines 194–196 only check `delta.property === 'checked' || delta.property === 'aria-checked'`. In `catalog.ts`, capabilities declare `delta.property` as `'marketing_notifications_enabled'` or other application state keys.
- **Why It Fails:** Because `delta.property` does not match `'checked'`, the check is silently bypassed for all application state properties. Furthermore, only `'ENABLED_TO_DISABLED'` is handled; `'DISABLED_TO_ENABLED'`, `'VALUE_CHANGE'`, and numeric deltas are unhandled.
- **Existing Tests:** `test/unit/invariant.spec.ts`.
- **Missing Tests:** Unit tests asserting rejection when application state properties declared in `allowedStateDelta` are not in the compatible pre-state.
- **Recommended Fix:** Check `delta.property` across both DOM attributes and application state properties in `observedState`, supporting all enum delta transitions.
- **Regression Risk:** Medium.

---

### Requirement 4: Expected post-state compatibility must be checked before ranking where required.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/invariant/predicates.ts`
- **Exact Function / Class / Module:** `InvariantPredicates.matchExpectedPostState` (lines 222–251)
- **Relevant Implementation Behavior:**
  Lines 238–245:
  `const isInteractive = !observedRole || ['button', 'switch', 'link', 'input', 'select', 'a'].includes(role);`
  `return { passed: isInteractive };`
- **Why It Fails:** It performs a generic tag/role interactivity check, completely ignoring the declared `expectedPostState` predicates.
- **Existing Tests:** `test/unit/invariant.spec.ts`.
- **Missing Tests:** Negative test ensuring candidates incapable of achieving `expectedPostState` fail prior to ranking.
- **Recommended Fix:** Compare candidate pre-state and control capability against declared `expectedPostState` requirements before admitting to ranking.
- **Regression Risk:** Low-to-medium.

---

### Requirement 5: Active routes must not bypass current invariant evaluation.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/stateMachine/machine.ts`
- **Exact Function / Class / Module:** `IntentNavMachine.processIntent` (lines 287–305 and 359–368)
- **Relevant Implementation Behavior:**
  When `activeRoute` exists and `driftResult.actionRequired === 'PROCEED'`, candidate discovery and invariant closure are skipped. Line 361 fabricates a synthetic PASS:
  `{ candidateId: 'ACTIVE', status: 'PASS', passedPredicates: [], failedPredicates: [] }`.
- **Why It Fails:** The active route executes without evaluating current DOM invariants, allowing execution even if the interface or state has mutated incompatibly.
- **Existing Tests:** `test/unit/graph.spec.ts`, E2E Scenario B.
- **Missing Tests:** Adversarial test where an active route exists but DOM invariant fails; verifying that the machine aborts or demotes the route.
- **Recommended Fix:** Always resolve the active route's target element in the live DOM and evaluate it via `InvariantClosureEngine` before authorization.
- **Regression Risk:** Medium.

---

### Requirement 6: Five-dimensional drift calculation must use correct types and units.
- **Status:** `PARTIALLY FIXED`
- **Exact File Path:** `src/core/drift/detector.ts` & `src/types/drift.ts`
- **Exact Function / Class / Module:** `TypedDriftDetector.computeDrift` and `TypedDriftVector`
- **Relevant Implementation Behavior:**
  Returns `TypedDriftVector` with 5 numeric properties in `[0.0, 1.0]`.
- **Why It Partially Fails:**
  `transition` drift is computed as a ratio of failed pre-state predicates rather than a continuous metric distance; types are mixed between objects and tuples across modules.
- **Existing Tests:** `test/unit/drift.spec.ts`.
- **Missing Tests:** Metric space property tests (triangle inequality, non-negativity, identity).
- **Recommended Fix:** Refine transition distance calculation to use continuous distance metric and unify type definitions.
- **Regression Risk:** Low.

---

### Requirement 7: Transition drift must consider expected delta, expected post-state, transition signature and witness behavior.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/drift/detector.ts`
- **Exact Function / Class / Module:** `TypedDriftDetector.computeDrift` (lines 187–200)
- **Relevant Implementation Behavior:**
  `transition` drift calculation checks:
  `failedPreCount / stored.mandatoryPreStatePredicates.length`.
- **Why It Fails:** It only checks pre-state predicates! It ignores expected state delta, expected post-state, activation event characteristics, and witness classes.
- **Existing Tests:** `test/unit/drift.spec.ts`.
- **Missing Tests:** Test with mismatched expected delta producing non-zero transition drift.
- **Recommended Fix:** Include delta, event characteristics, and post-state comparisons in transition drift dimension.
- **Regression Risk:** Low.

---

### Requirement 8: Ranking must use actual evidence rather than placeholder constants.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/ranking/engine.ts`
- **Exact Function / Class / Module:** `CandidateRankingEngine.rankCandidates` (lines 108–123)
- **Relevant Implementation Behavior:**
  ```typescript
  const transitionFit = 0.9;
  const validationHistory = 0.85;
  const contradictionPenalty = 0.0;
  const stalenessPenalty = 0.0;
  const pathCostPenalty = 0.05;
  ```
- **Why It Fails:** Ranking uses static, hardcoded constants instead of empirical evidence from candidate history or DOM structure.
- **Existing Tests:** `test/unit/ordering.spec.ts`.
- **Missing Tests:** Unit test verifying ranking differentiation based on genuine validation history records and DOM structural path cost.
- **Recommended Fix:** Calculate `validationHistory` from historical validation records, `pathCostPenalty` from DOM structural path length, and `transitionFit` from observed candidate characteristics.
- **Regression Risk:** Medium.

---

### Requirement 9: Causal delta matching must verify all required expected constraints.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/causal/verifier.ts`
- **Exact Function / Class / Module:** `CausalTransitionVerifier.isDeltaMatching` (lines 109–123)
- **Relevant Implementation Behavior:**
  ```typescript
  for (const [key, expectedVal] of Object.entries(expected)) {
    if (key in observed) {
      if (observed[key] === expectedVal) return true;
    }
  }
  ```
- **Why It Fails:** As soon as ONE key matches, it returns `true`, ignoring all remaining expected constraints.
- **Existing Tests:** `test/unit/causal.spec.ts`.
- **Missing Tests:** Unit test with multi-key expected delta where one matches and another fails, asserting return `false`.
- **Recommended Fix:** Ensure all declared expected delta constraints are satisfied before returning `true`.
- **Regression Risk:** Medium.

---

### Requirement 10: Missing correlation IDs must not count as positive causal evidence.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/causal/verifier.ts`
- **Exact Function / Class / Module:** `CausalTransitionVerifier.verifyTransition` (lines 214–215)
- **Relevant Implementation Behavior:**
  `const isCorrelatedWithEvent = !w.correlatedActivationEventId || w.correlatedActivationEventId === activationEvent.eventId;`
- **Why It Fails:** If `correlatedActivationEventId` is undefined or null, `!w.correlatedActivationEventId` evaluates to `true`, treating uncorrelated mutations as causal evidence.
- **Existing Tests:** `test/unit/causal.spec.ts`.
- **Missing Tests:** Negative test asserting that missing correlation IDs cannot satisfy strict causal correlation.
- **Recommended Fix:** Require matching `correlatedActivationEventId` for event-correlated witness classes.
- **Regression Risk:** High for mock sites omitting correlation IDs.

---

### Requirement 11: Post-state verification must compare against the expected post-state.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/causal/verifier.ts`
- **Exact Function / Class / Module:** `CausalTransitionVerifier.verifyTransition` (lines 336–352)
- **Relevant Implementation Behavior:**
  `if (currentPostStateFingerprint === signature.preStateFingerprint)` rejects.
- **Why It Fails:** It only verifies that post-state is not equal to pre-state; it never verifies that `currentPostStateFingerprint === signature.postStateFingerprint`.
- **Existing Tests:** `test/unit/causal.spec.ts`.
- **Missing Tests:** Negative test where post-state changes to an unintended/error state, asserting rejection.
- **Recommended Fix:** Check that `currentPostStateFingerprint === signature.postStateFingerprint` (or matches expected post-state predicates).
- **Regression Risk:** Medium.

---

### Requirement 12: Verification tokens must not be described as cryptographic unless the implementation actually provides cryptographic security.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/causal/verifier.ts` (lines 40–53) and documentation files
- **Exact Function / Class / Module:** `CausalTransitionVerifier.generateTokenSignature`
- **Relevant Implementation Behavior:**
  Signature is computed via a 32-bit polynomial bitshift hash (`(hash << 5) - hash + charCode`).
- **Why It Fails:** Documentation and comments repeatedly claim "cryptographic verification token" and "cryptographic proof", which is scientifically inaccurate for a 32-bit non-cryptographic hash.
- **Existing Tests:** `test/unit/causal.spec.ts`.
- **Missing Tests:** N/A.
- **Recommended Fix:** Either replace with real `crypto.subtle` SHA-256 HMAC digest or update documentation/comments to accurately state "deterministic state transition integrity token".
- **Regression Risk:** Low.

---

### Requirement 13: Browser activation must honor click/keydown/change/submit event types.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/browser/contentScript.ts`
- **Exact Function / Class / Module:** `contentScript.ts` message listener (lines 229–246)
- **Relevant Implementation Behavior:**
  Unconditionally creates and dispatches `new MouseEvent('click', ...)`.
- **Why It Fails:** `keydown`, `change`, and `submit` event types requested in the payload are ignored and dispatched as clicks.
- **Existing Tests:** `test/e2e/browser_e2e.spec.ts`.
- **Missing Tests:** Activation dispatch tests for `keydown`, `change`, and `submit`.
- **Recommended Fix:** Implement factory dispatching `KeyboardEvent`, `Event('change')`, or `Event('submit')` according to `payload.eventType`.
- **Regression Risk:** Low.

---

### Requirement 14: Machine-readable validation records must contain the actual transition signature.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/stateMachine/machine.ts`
- **Exact Function / Class / Module:** `IntentNavMachine.recordValidationRecord` (line 874)
- **Relevant Implementation Behavior:**
  `transitionSignature: null,`
- **Why It Fails:** Hardcoded to `null` on the validation record.
- **Existing Tests:** `test/unit/audit.spec.ts`.
- **Missing Tests:** Test asserting `validationRecord.transitionSignature !== null`.
- **Recommended Fix:** Populate with the actual capability `transitionEvidence` or verification result signature.
- **Regression Risk:** Low.

---

### Requirement 15: Capability graph edges must persist across restart.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/graph/capabilityGraph.ts` & `src/core/storage/persistentStore.ts`
- **Exact Function / Class / Module:** `CapabilityGraphEngine.addEdge`, `loadFromStore`, and `PersistentStoreSchema`
- **Relevant Implementation Behavior:**
  Edges are stored in a transient in-memory array `private edges: GraphEdge[] = []`. `PersistentStoreSchema` has no `edges` field.
- **Why It Fails:** All graph edges vanish when the extension or process restarts.
- **Existing Tests:** `test/unit/graph.spec.ts`.
- **Missing Tests:** Persistence test verifying edges survive `store.persist()` and `loadFromStore()`.
- **Recommended Fix:** Add `edges: GraphEdge[]` to `PersistentStoreSchema`, save in `addEdge`, and reload in `loadFromStore`.
- **Regression Risk:** Low.

---

### Requirement 16: Quarantine state must persist.
- **Status:** `NOT FIXED`
- **Exact File Path:** `src/core/graph/routeManager.ts` (lines 176–195) & `src/core/graph/capabilityGraph.ts` (lines 30–40)
- **Exact Function / Class / Module:** `RouteManager.quarantineRoute` & `CapabilityGraphEngine.loadFromStore`
- **Relevant Implementation Behavior:**
  `quarantineRoute` sets in-memory status but never saves to `store`. `loadFromStore` only links `ACTIVE_VALIDATED` routes, ignoring `quarantinedRouteIds`.
- **Why It Fails:** Quarantined routes lose their quarantine linkage upon extension reload.
- **Existing Tests:** `test/unit/quarantine.spec.ts`.
- **Missing Tests:** Restart persistence test asserting quarantined routes remain quarantined after hydration.
- **Recommended Fix:** Save updated route and capability node in `quarantineRoute`; restore `quarantinedRouteIds` in `loadFromStore`.
- **Regression Risk:** Low.

---

### Requirement 17: Rollback and active-route linkage must persist.
- **Status:** `PARTIALLY FIXED`
- **Exact File Path:** `src/core/graph/routeManager.ts` (lines 163–168)
- **Exact Function / Class / Module:** `RouteManager.demoteActiveRoute`
- **Relevant Implementation Behavior:**
  `rollbackRoute.status = 'ACTIVE_VALIDATED'` is set in-memory, but `attachRouteVersion` is only called for the demoted route, not the restored rollback route.
- **Why It Partially Fails:** The restored route's new status is not persisted to storage.
- **Existing Tests:** `test/unit/graph.spec.ts`.
- **Missing Tests:** Persistence test for route demotion and rollback restoration across reload.
- **Recommended Fix:** Persist `rollbackRoute` and the capability node when rollback occurs.
- **Regression Risk:** Low.

---

### Requirement 18: Website/generalization limitations must be accurately represented.
- **Status:** `PARTIALLY FIXED`
- **Exact File Path:** `docs/LIMITATIONS.md`
- **Exact Function / Class / Module:** Full document
- **Relevant Implementation Behavior:**
  Documents Canvas/WebGL, closed shadow DOM, MFA, virtualized lists, and latency.
- **Why It Partially Fails:** Does not state that empirical evaluation was restricted to controlled local mock sites (Sites A–D, NEG), and does not characterize limitations regarding arbitrary live internet sites.
- **Existing Tests:** N/A.
- **Missing Tests:** N/A.
- **Recommended Fix:** Add explicit section defining the empirical evaluation boundary (local mock apps vs live web).
- **Regression Risk:** None.

---

### Requirement 19: Positive Chromium evidence must contain the actual capability fingerprint hash.
- **Status:** `NOT FIXED`
- **Exact File Path:** `scripts/runChromiumE2E.js` (line 389) & `evidence/chromium_e2e_evidence.json`
- **Exact Function / Class / Module:** `runChromiumE2E.js` record builder
- **Relevant Implementation Behavior:**
  `capabilityFingerprintHash: context?.resolvedCapability?.capabilityFingerprintHash || '',`
- **Why It Fails:** All 10 scenarios in `evidence/chromium_e2e_evidence.json` contain `capabilityFingerprintHash: ""` (empty string) because catalog capabilities do not define this property name.
- **Existing Tests:** `scripts/validateChromiumEvidence.js`.
- **Missing Tests:** Schema assertion that `capabilityFingerprintHash` is non-empty and formatted as `^fph_[0-9a-f]+$`.
- **Recommended Fix:** Populate `fingerprintHash` on catalog capabilities and map `context?.resolvedCapability?.fingerprintHash` in the runner.
- **Regression Risk:** Low.

---

### Requirement 20: Negative scenario oracles must prove exactly the property they claim.
- **Status:** `PARTIALLY FIXED`
- **Exact File Path:** `scripts/runNegativeChromiumE2E.js` & `mock-sites/site-neg/app.js`
- **Exact Function / Class / Module:** Negative Scenarios N1 and N10
- **Relevant Implementation Behavior:**
  N1 claims to prove invariant rejection, but invariant closure passes and the test only stops at Step 8 due to missing witnesses.
- **Why It Partially Fails:** N11 and N12 are mechanism-specific, but N1 still terminates in `witness_missing` rather than invariant closure failure.
- **Existing Tests:** `scripts/runNegativeChromiumE2E.js`, `scripts/validateNegativeEvidence.js`.
- **Missing Tests:** Assertion in `validateNegativeEvidence.js` that N1's invariant closure status is `FAIL` or `CONTRADICTED`.
- **Recommended Fix:** Update N1 element markup so invariant closure actually fails; update oracle to verify `invariantResults.status === 'FAIL'`.
- **Regression Risk:** Low.

---

### Requirement 21: Benchmark must not inject expected answers into observed results.
- **Status:** `NOT FIXED`
- **Exact File Path:** `benchmark/runner.ts` (lines 242–245)
- **Exact Function / Class / Module:** `BenchmarkRunner.runBenchmark` -> `collectWitnesses`
- **Relevant Implementation Behavior:**
  ```typescript
  const cap = AUTHORITATIVE_CAPABILITY_CATALOG.find((c) => c.capabilityId === lastCapabilityId);
  const expectedDelta = cap?.transitionEvidence.expectedDelta || {};
  const observedDelta = { ...appState, ...expectedDelta };
  ```
- **Why It Fails:** Injects the answer key (`expectedDelta`) into the observed witness delta, fabricating a 100% causal match instead of observing actual DOM mutation deltas.
- **Existing Tests:** `benchmark/runner.spec.ts`.
- **Missing Tests:** Benchmark test asserting that `observedDelta` reflects only genuine state changes between pre- and post-activation DOM snapshots.
- **Recommended Fix:** Remove `...expectedDelta`; compute `observedDelta` by diffing `postAppState` against `preAppState`.
- **Regression Risk:** High for benchmark pass rates if mock sites do not mutate state matching catalog expectations.

---

### Requirement 22: Benchmark/JSDOM lifecycle must correctly release DOM resources.
- **Status:** `NOT FIXED`
- **Exact File Path:** `benchmark/runner.ts` (lines 96, 111)
- **Exact Function / Class / Module:** `getFreshDOMForSite`
- **Relevant Implementation Behavior:**
  Creates `new JSDOM(...)` on every run without ever calling `dom.window.close()`.
- **Why It Fails:** Causes fatal Node.js out-of-memory crash (`FatalProcessOutOfMemory`) when running `npm run benchmark`.
- **Existing Tests:** `benchmark/runner.spec.ts`.
- **Missing Tests:** Benchmark lifecycle memory teardown test.
- **Recommended Fix:** Explicitly call `window.close()` or maintain a pool of reset DOM instances.
- **Regression Risk:** Low.

---

### Requirement 23: Benchmark metrics and documentation must be internally consistent.
- **Status:** `PARTIALLY FIXED`
- **Exact File Path:** `benchmark/results/summary.json` vs `docs/BENCHMARKS.md`
- **Exact Function / Class / Module:** Benchmark reports and summary schemas
- **Relevant Implementation Behavior:**
  `summary.json` lists 2,000 total runs (400 per baseline) with Top-1 accuracy 33.7%, while text in some documentation mentions differing figures.
- **Why It Partially Fails:** Discrepancies exist between simulated trial counts and documented summaries.
- **Existing Tests:** `benchmark/metricValidator.ts`.
- **Missing Tests:** Direct JSON-to-Markdown table schema assertion test.
- **Recommended Fix:** Fix benchmark memory leak, re-run cleanly, regenerate summaries, and enforce metric validation.
- **Regression Risk:** Low.

---

### Requirement 24: Chromium execution must be reproducible and must not depend on a single hardcoded Mac path.
- **Status:** `NOT FIXED`
- **Exact File Path:** `scripts/runChromiumE2E.js` (line 38) & `scripts/runNegativeChromiumE2E.js` (line 31)
- **Exact Function / Class / Module:** Top-level constant `CHROME_PATH`
- **Relevant Implementation Behavior:**
  `const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';`
- **Why It Fails:** Fails immediately on Linux, Windows, or CI systems where Chrome is at `/usr/bin/google-chrome` or specified via `CHROME_BIN`.
- **Existing Tests:** None.
- **Missing Tests:** Cross-platform browser launcher test.
- **Recommended Fix:** Implement `resolveChromePath()` supporting `process.env.CHROME_BIN`, `process.env.CHROME_PATH`, Linux/Windows defaults, and `which google-chrome`.
- **Regression Risk:** Low.

---

### Requirement 25: Documentation must not claim empirical verification that has not actually been demonstrated.
- **Status:** `NOT FIXED`
- **Exact File Path:** `docs/CLAIM_COVERAGE_MATRIX.md` & `docs/FINAL_TECHNICAL_AUDIT.md`
- **Exact Function / Class / Module:** Claim verification level classifications
- **Relevant Implementation Behavior:**
  Multiple claims are marked `EMPIRICALLY_VERIFIED`.
- **Why It Fails:** Given that `capabilityFingerprintHash` was empty in positive evidence, `transitionSignature` was null, post-state and causal delta matching were incomplete, and benchmark injected answer keys, claiming full empirical verification overstates what was verified.
- **Existing Tests:** N/A.
- **Missing Tests:** N/A.
- **Recommended Fix:** Refine claim status classifications to accurately reflect mock-site integration testing and disclose current baseline limitations.
- **Regression Risk:** None.

---

## 10. Exact Affected Files and Functions

| File Path | Function / Class / Area | Requirements Affected |
| :--- | :--- | :--- |
| `src/core/fingerprint/constructor.ts` | `computeFingerprintHash`, `fromElement` | Req 1 |
| `src/core/candidate/generator.ts` | `generateCandidates`, `defaultAppState` | Req 1, Req 2 |
| `src/core/invariant/predicates.ts` | `matchAllowedStateDelta`, `matchExpectedPostState` | Req 3, Req 4 |
| `src/core/stateMachine/machine.ts` | `processIntent`, `recordValidationRecord` | Req 5, Req 14 |
| `src/core/drift/detector.ts` | `computeDrift` (transition dimension) | Req 6, Req 7 |
| `src/core/ranking/engine.ts` | `rankCandidates` (hardcoded constants) | Req 8 |
| `src/core/causal/verifier.ts` | `isDeltaMatching`, `verifyTransition`, `generateTokenSignature` | Req 9, Req 10, Req 11, Req 12 |
| `src/browser/contentScript.ts` | Event dispatch listener | Req 13 |
| `src/core/graph/capabilityGraph.ts` | `addEdge`, `loadFromStore` | Req 15, Req 16, Req 17 |
| `src/core/graph/routeManager.ts` | `quarantineRoute`, `demoteActiveRoute` | Req 16, Req 17 |
| `src/core/storage/persistentStore.ts` | `PersistentStoreSchema`, edge persistence | Req 15, Req 16 |
| `docs/LIMITATIONS.md` | Generalization & mock site boundaries | Req 18 |
| `scripts/runChromiumE2E.js` | Evidence recording (`capabilityFingerprintHash`), `CHROME_PATH` | Req 19, Req 24 |
| `scripts/runNegativeChromiumE2E.js` | N1 invariant failure oracle, `CHROME_PATH` | Req 20, Req 24 |
| `mock-sites/site-neg/app.js` | N1 button markup & attributes | Req 20 |
| `benchmark/runner.ts` | `collectWitnesses`, `getFreshDOMForSite` (JSDOM OOM) | Req 21, Req 22, Req 23 |
| `docs/CLAIM_COVERAGE_MATRIX.md` | Verification status claims | Req 25 |

---

## 11. Existing Weaknesses Summary

1. **Benchmark Process Memory Leak & Crashes:** `benchmark/runner.ts` causes fatal process OOM because JSDOM window instances are never closed.
2. **Benchmark Data Integrity Gap:** `benchmark/runner.ts` artificially injects catalog `expectedDelta` directly into observed witness deltas.
3. **Synthetic State Injection in Production Code:** `CandidateGenerator` injects 13 synthetic default properties into every candidate's `observedState`.
4. **Invariant Pre-Filtering Bypasses:**
   - Active routes bypass invariant closure when drift is low, fabricating a synthetic `PASS`.
   - `matchAllowedStateDelta` only checks `'checked'`/`'aria-checked'`, bypassing application state deltas.
   - `matchExpectedPostState` only checks tag interactivity, ignoring expected post-state predicates.
5. **Causal Verification Gaps:**
   - `isDeltaMatching` returns `true` if any single key matches.
   - Missing correlation IDs are accepted as positive causal correlation.
   - Post-state verification only checks `postState !== preState` rather than `postState === expectedPostState`.
6. **Persistence & Lifecycle Leaks:** Graph edges and quarantined route IDs are not persisted or restored across restarts.
7. **Cross-Platform Portability:** Chromium E2E runners hardcode `/Applications/Google Chrome.app/...`.
8. **Evidence Artifact Completeness:** Positive Chromium evidence contains `capabilityFingerprintHash: ""` and validation records contain `transitionSignature: null`.

---

## 12. Recommended Fix Order

To systematically remediate all 25 items without regressions, the recommended execution order is:

1. **Phase 1: Memory & Cross-Platform Infrastructure (Req 22, 24)**
   - Fix JSDOM lifecycle leak (`dom.window.close()`) in `benchmark/runner.ts`.
   - Implement `resolveChromePath()` in `scripts/runChromiumE2E.js` and `scripts/runNegativeChromiumE2E.js`.
2. **Phase 2: Core Data Integrity & Identity (Req 1, 2, 12, 19)**
   - Remove `canonicalLabel` dependency from `computeFingerprintHash`.
   - Remove synthetic `defaultAppState` from `CandidateGenerator`.
   - Populate `fingerprintHash` on catalog capabilities and record it in E2E runners.
   - Align token cryptographic terminology in code and docs.
3. **Phase 3: Invariant Closure & Active Route Gates (Req 3, 4, 5)**
   - Enforce application state properties and all transition types in `matchAllowedStateDelta`.
   - Implement real expected post-state validation in `matchExpectedPostState`.
   - Require active routes to evaluate live element invariants before dispatch.
4. **Phase 4: Causal Transition Verification Hardening (Req 9, 10, 11, 13, 14)**
   - Require all expected delta keys to match in `isDeltaMatching`.
   - Disallow missing correlation IDs from counting as causal correlation.
   - Enforce `postState === expectedPostState` in `verifyTransition`.
   - Support `keydown`, `change`, and `submit` in `contentScript.ts`.
   - Record actual `transitionSignature` in `recordValidationRecord`.
5. **Phase 5: Drift & Ranking Metrics (Req 6, 7, 8)**
   - Expand transition drift to account for expected delta, post-state, and event characteristics.
   - Replace ranking placeholder constants with empirical validation history, path depth, and transition fit.
6. **Phase 6: Persistence Layer Hardening (Req 15, 16, 17)**
   - Add graph edges to `PersistentStoreSchema` and restore in `loadFromStore`.
   - Persist quarantine status and route lists in `quarantineRoute` and `loadFromStore`.
   - Persist restored rollback routes during demotion.
7. **Phase 7: Benchmark & Evidence Realism (Req 20, 21, 23)**
   - Make N1 fail at invariant closure in `site-neg` and runner oracle.
   - Remove answer key injection (`expectedDelta`) from benchmark `collectWitnesses`.
   - Re-run benchmark, update `summary.json` and sync documentation.
8. **Phase 8: Documentation & Claim Realism (Req 18, 25)**
   - Accurately document mock-site evaluation boundaries in `docs/LIMITATIONS.md`.
   - Calibrate claim verification levels in `docs/CLAIM_COVERAGE_MATRIX.md`.

---

**End of Current Baseline Audit Report**

