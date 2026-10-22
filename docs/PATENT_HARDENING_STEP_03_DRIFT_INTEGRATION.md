# Patent Hardening Step 3: Live Five-Dimensional Drift Integration

**Branch:** `patent-hardening-step-03-drift-integration`
**Parent Commit:** `990907d` (*"Harden capability fingerprint identity with SHA-256 and transition binding"*)
**Frozen Baseline Preserved:** `3392b2a` (`intentnav-evidence-baseline-v1.0`)

---

## 1. Audit Findings & Target Architecture

Prior to Step 3, [`TypedDriftDetector`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/detector.ts) evaluated a typed five-dimensional drift vector $(\Delta_P, \Delta_C, \Delta_S, \Delta_K, \Delta_T) \in [0.0, 1.0]^5$. However, an independent audit of the runtime pipeline identified three operational gaps:

1. **Synthetic / Stubbed Observations in Runtime Callers:** [`background.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/browser/background.ts) and [`e2eController.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/browser/e2eController.ts) passed minimal stub objects (`{ tag: 'button' }`) to `machine.processIntent`, leaving context, structural path, and pre-state undefined.
2. **Disconnected Candidate Evidence in State Machine:** When evaluating drift in Step 4 of the state machine ([`machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts)), `TypedDriftDetector.computeDrift` was executed against raw ungrounded `observedFeatures` without incorporating live attributes from `availableCandidates` or the active route's binding handle.
3. **Absence of Localized Route Invalidation:** When drift exceeded validation or recovery thresholds, the system logged warnings but failed to demote the active route on the specific affected capability node, creating a risk of stale route reuse.

### Preserved Pipeline Architecture
```
Persistent Capability Identity (SHA-256)
  ↓
Live Browser Observation (Candidate & Interface Evidence)
  ↓
Five-Dimensional Drift Vector (P, C, S, K, T)
  ↓
Affected-Capability Localization
  ↓
Selective Invalidation (Stale Route Demotion)
  ↓
Candidate Discovery & Invariant Closure Gate
  ↓
Provisional Route Creation (Quarantine Isolation)
  ↓
Execution Authorization Gating (Risk & Confirmation)
  ↓
Real Browser Activation (CDP / DOM Event Dispatch)
  ↓
Transition Witness Collection (≥2 Independent Classes)
  ↓
Causal Transition Verification (Temporal & Delta Match)
  ↓
Cryptographic Promotion Token Authentication
  ↓
Validated Promotion to Active State (or Demotion/Abstention)
```

---

## 2. Five-Dimensional Drift Grounding on Live Evidence

The 5D drift computation is strictly grounded on live candidate and interface evidence across all five dimensions without placeholder constants or synthetic shortcuts:

| Dimension | Measured Semantics | Evidence Grounding Source | Behavioral Consequence |
| :--- | :--- | :--- | :--- |
| **Presentation ($\Delta_P$)** | Volatile element IDs, generated CSS classes, inline styling tokens | `candidate.bindingHandle.volatileId`, `volatileClasses` vs. stored handle | Evaluated with volatile feature suppression; $\Delta_P \le 0.90$ maintains route active without triggering rebind. |
| **Context ($\Delta_C$)** | Surrounding semantic containers, ancestor relationships, nearby text | Live DOM container semantics and ancestor elements in candidate evaluation context | $\Delta_C \ge 0.40$ triggers route validation; demotes stale route and verifies route before activation. |
| **Structure ($\Delta_S$)** | Relative DOM hierarchy depth, nesting, structural path | `candidate.domStructuralPath` vs. stored relative structural relationships | $\Delta_S \ge 0.45$ triggers route validation; demotes stale route and discovers/verifies candidate. |
| **Capability ($\Delta_K$)** | Functional action type, target entity, interactive accessibility role | `candidate.observedActionType`, `observedTargetEntity`, `observedRole` | $\Delta_K \ge 0.20$ triggers rebind recovery; $\Delta_K \ge 0.90 \land \Delta_T \ge 0.90$ triggers immediate quarantine. |
| **Transition ($\Delta_T$)** | Pre-state predicates, allowed state delta compatibility, expected post-state | Live interface state (`observedPreState`), post-state, and mutation witnesses | $\Delta_T \ge 0.25$ triggers route validation; pre-state mismatch rejects candidate at invariant gate. |

### Drift Thresholds as Heuristic Engineering Parameters

The default operational thresholds configured in [`DriftClassifier`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts) (`DEFAULT_DRIFT_THRESHOLDS`):
- `presentationRecoveryThreshold: 0.90`
- `contextValidationThreshold: 0.40`
- `structureValidationThreshold: 0.45`
- `capabilityRebindThreshold: 0.20`
- `transitionRebindThreshold: 0.25`
- `extremeDriftQuarantineThreshold: 0.90`

represent **heuristic engineering parameters** chosen to balance route stability against false positive re-binding in controlled mock environments. They are **not** claimed as universal mathematical constants, universally optimal values, or guarantees of universal website independence across arbitrary unvetted web applications.

---

## 3. Strict Route Lifecycle & Security Gating

The route lifecycle guarantees that unverified candidate routes cannot be promoted or executed outside strict containment:

1. **Selective Invalidation:** When live observation reveals drift exceeding rebind or validation thresholds, `IntentNavMachine` strictly invalidates the active route on the *affected capability node only* via `this.routeManager.demoteActiveRoute(...)`. Unrelated capability nodes in `CapabilityGraphEngine` remain untouched.
2. **Quarantine Isolation:** Candidate discovery and invariant closure produce a new route instantiated strictly as a `PROVISIONAL` route isolated in quarantine (`RouteLifecycleState: QUARANTINED`). The provisional route is not placed in the active route pool.
3. **Execution Authorization Gating:** Before dispatch, the system evaluates `ExecutionAuthorizationDecision` based on capability risk class (`READ_ONLY`, `REVERSIBLE`, `IRREVERSIBLE`, `CRITICAL`), policy constraints, and explicit user confirmation flags. Unconfirmed high-risk operations are halted in `CONFIRMATION_PENDING` or `ABSTAINED`.
4. **Real Browser Activation:** The authorized provisional route is dispatched through real browser event mechanisms (CDP input dispatch or synthesized DOM events).
5. **Multi-Class Witness Capture:** An independent observer captures $\ge 2$ distinct transition witness classes (selected from Application State, DOM Mutation, Network Request, URL/Navigation, Storage, or Console events) with causal temporal deltas.
6. **Causal Transition Verification:** The verification engine validates that the observed witnesses correlate causally to the activation event, satisfy the expected state delta, and exhibit correct temporal ordering.
7. **Cryptographic Promotion Token Authentication:** Promotion requires an unforgeable, HMAC-SHA256 / SHA-256 signed promotion token binding the transition witness hashes, route ID, capability ID, nonce, and expiration. Corrupted or missing tokens result in promotion denial and permanent retention in quarantine.
8. **Validated Promotion:** Only upon successful cryptographic token validation is the route elevated to `ACTIVE_VALIDATED`.

---

## 4. Quantitative Recovery Instrumentation Metrics

The state machine context and persistent audit log capture structured quantitative metrics in [`DriftRecoveryMetrics`](file:///Users/kumarmilind/Desktop/Navigation/src/types/drift.ts) using direct measurements and high-resolution monotonic timing:

- `inspectedNodesCount`: Total candidate nodes inspected during discovery (`availableCandidates.length`).
- `candidateEvaluationsCount`: Total candidates evaluated through invariant closure (`Object.keys(pipelineResult.invariantResults).length`).
- `fingerprintComputationsCount`: Number of canonical fingerprint calculations performed (`candidateEvaluationsCount + 1`).
- `invalidatedCapabilitiesCount`: Number of capability routes demoted (localized strictly to affected nodes; 1 or 0).
- `unnecessarilyInvalidatedCount`: Count of unaffected capabilities needlessly invalidated (verified 0 in graph).
- `recoveryLatencyMs`: High-resolution monotonic timing from drift evaluation initiation to winner selection (`performance.now()` with millisecond resolution).
- `staleExecutionAttemptsAvoided`: Number of stale route executions prevented by proactive demotion.
- `abstentionsCount`: Count of safe abstentions when candidates fail invariant closure or evidence quorum.

---

## 5. Automated Test Coverage (Task D Scenarios 1–12)

The test suite [`test/unit/drift_live_integration.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/drift_live_integration.spec.ts) validates 12 scenarios with live causal assertions:

1. **Scenario 1 (Presentation Drift Only):** Scrambled volatile ID and dynamic classes produce $\Delta_P = 0.93$ while $\Delta_K = 0, \Delta_T = 0, \Delta_S = 0, \Delta_C = 0$. Decision is `MAINTAIN_ACTIVE`; route remains `ACTIVE_VALIDATED`.
2. **Scenario 2 (Structural DOM Changes):** Relocation into nested modal container produces $\Delta_S \ge 0.45$. Decision is `TRIGGER_VALIDATION`; stale route is demoted, new provisional route is created, verified, and promoted.
3. **Scenario 3 (Semantic / Accessibility Shift):** Control re-architected to anchor tag targeting analytics produces $\Delta_K \ge 0.20$. Invariant closure rejects mismatched target; machine safely abstains.
4. **Scenario 4 (Context / Relationship Shift):** Relocation to new container section produces $\Delta_C \ge 0.40$. Triggers route validation and promotes candidate after invariant closure.
5. **Scenario 5 (Application-State Mismatch):** Pre-state observation indicates preference is already disabled. $\Delta_T > 0$ and mandatory pre-state predicate fails; machine safely enters `ABSTAINED`.
6. **Scenario 6 (Localized Invalidation):** High drift on `CAP_DISABLE_MARKETING` demotes its active route, while unrelated capability `CAP_DISABLE_2FA` retains its `ACTIVE_VALIDATED` route completely untouched.
7. **Scenario 7 (Missing / Contradictory Evidence):** Extreme destructive mutation intent (`DELETE`, `ALL_DATA`, `input`) produces $\Delta_K \ge 0.80$; machine safely abstains.
8. **Scenario 8 (Decoy Rejection):** Decoy candidate with identical semantic text but conflicting action/state fails hard invariant closure gate and is rejected before ranking.
9. **Scenario 9 (Repeated Drift & Recovery):** Successive DOM mutations across sequential executions each demote previous routes (`DEMOTED`) and re-bind new provisional routes without executing stale handles.
10. **Scenario 10 (No Silent Promotion Without Token):** Candidate with zero drift ($\Delta = 0$ across all 5 dimensions) with a corrupted promotion token is denied promotion, remaining strictly `QUARANTINED`.
11. **Scenario 11 (Quantitative Metrics Verification):** Recovery metrics directly measure inspected nodes, candidate evaluations, fingerprint computations, zero unnecessary invalidations, and non-negative monotonic latency.
12. **Scenario 12 (Contradictory Abstention Metrics):** Immediate quarantine on contradictory functional drift records safe abstention and accurate direct counters.

---

## 6. Empirical Chromium Evidence Distinction

A fundamental architectural distinction is enforced between in-memory unit tests and live Chromium empirical evidence:

- **Unit / Adversarial Tests (`test/unit/drift_live_integration.spec.ts`):** Execute within the in-memory Vitest runner using structured mock observation objects to rigorously assert algorithmic drift classification, invariant filtering, and state machine transitions.
- **Empirical Chromium Runners (`scripts/runChromium*.js`):** Drive actual Google Chrome 154 (Headless) via the Chrome DevTools Protocol (CDP) against real HTTP servers hosting Mock Sites A, B, C, and D. These harnesses capture genuine Blink DOM mutations, CDP event streams, network request interception, and multi-witness verification to generate audited JSON evidence files:
  - `evidence/chromium_e2e_evidence.json` (10 positive scenarios A–J)
  - `evidence/chromium_e2e_negative_evidence.json` (14 adversarial scenarios N1–N14)
  - `evidence/chromium_network_privacy_evidence.json` (10/10 zero-telemetry scenarios)
  - `evidence/chromium_route_rollback_evidence.json` (Claim 10 lifecycle demotion and rollback)
  - `evidence/chromium_witness_class_evidence.json` (Claim 8 all 6 witness classes W1–W6)

---

## 7. Verification Status

- **Typecheck:** PASS (`tsc --noEmit`, exit code 0)
- **Production Build:** PASS (`npm run build`, Vite 6.4.3 + esbuild 0.25.12, exit code 0)
- **Automated Tests:** PASS (27 test files, 312/312 tests pass)
- **Empirical Chromium Evidence Validators:**
  - Positive 10-Scenario Validator: PASS (`node scripts/validateChromiumEvidence.js`)
  - Negative 14-Scenario Validator: PASS (`node scripts/validateNegativeEvidence.js`)
  - Network Privacy Validator: PASS (`node scripts/validateChromiumNetworkPrivacyEvidence.js`)
  - Route Rollback Validator: PASS (`node scripts/validateChromiumRouteRollbackEvidence.js`)
  - Six Witness-Class Validator: PASS (`node scripts/validateChromiumWitnessClassEvidence.js`)
- **Git Diff Whitespace Check:** PASS (`git diff --check`, clean)
- **Frozen Baseline Tag:** Unchanged (`intentnav-evidence-baseline-v1.0` points to `3392b2a`)
- **Authoritative Patent Documents:** Untouched (`docs/patent-requirements/*.docx` unmodified)
