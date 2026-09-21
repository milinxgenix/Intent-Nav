# IntentNav-SCFR: Benchmark Integrity & Measurement Audit

**Audit Date**: September 21, 2026  
**Subject**: Controlled Simulated Benchmark (`benchmark/runner.ts`, `benchmark/reporter.ts`, `docs/BENCHMARKS.md`, `README.md`)  
**Auditor**: IntentNav-SCFR Verification & Remediation Team  
**Status**: Pre-Correction Assessment (Phase 1)

---

## Executive Summary

An exhaustive inspection of the IntentNav-SCFR benchmark implementation (`benchmark/`), execution results (`benchmark/results/`), documentation (`docs/`), and project `README.md` was conducted.

The audit confirms significant synthetic shortcuts, fabricated evidence in the controlled benchmark execution dispatcher, an active JSDOM memory leak, missing resource/interaction metrics, and severe discrepancies between documented marketing claims (e.g. `98.3%` accuracy in `README.md`) and actual measured benchmark records (`33.7%` in `summary.json`).

---

## Detailed Audit Findings

### Finding 1: Synthetic State Change Injection (`stateChanged || true`)
- **File**: [`benchmark/runner.ts`](file:///Users/kumarmilind/Desktop/Navigation/benchmark/runner.ts#L227)
- **Function**: `benchmarkDispatcher.dispatchActivation()`
- **Current Behavior**:
  ```typescript
  const stateChanged =
    JSON.stringify(preAppState) !== JSON.stringify(postAppState) ||
    preAria !== postAria ||
    preText !== postText;

  return {
    success: true,
    elementFound: true,
    eventDispatched,
    stateChanged: stateChanged || true, // <-- FORCED TRUE
    activationEvent: { ... }
  };
  ```
- **Why It Is Problematic**: If a click dispatch fails to cause any DOM or application state mutation (e.g. inactive button, decoy element, or broken handler), `stateChanged || true` unconditionally forces `stateChanged: true`. This masks execution failures and prevents detection of no-op dispatches.
- **Required Correction**: Remove `stateChanged: stateChanged || true`. Observe genuine state deltas from the mock DOM and application state.
- **Expected Measurement Impact**: Candidates that dispatch events but produce no measurable mutation will correctly report failure or lack of state mutation rather than synthetic success.

---

### Finding 2: Injection of Expected State Delta into Observed Witness Delta
- **File**: [`benchmark/runner.ts`](file:///Users/kumarmilind/Desktop/Navigation/benchmark/runner.ts#L240-L245)
- **Function**: `benchmarkDispatcher.collectWitnesses()`
- **Current Behavior**:
  ```typescript
  const cap = AUTHORITATIVE_CAPABILITY_CATALOG.find((c) => c.capabilityId === lastCapabilityId);
  const expectedDelta = cap?.transitionEvidence.expectedDelta || {};
  const observedDelta = { ...appState, ...expectedDelta }; // <-- INJECTION
  ```
- **Why It Is Problematic**: The execution dispatcher looks up what the capability *expected* to observe, and merges `...expectedDelta` directly into `observedDelta`. The causal verifier then checks `observedDelta` against `expectedDelta`. Because the benchmark pre-injected the expected answer into the observation, the verifier is evaluating synthetic self-fulfilling evidence rather than actual mock-site state mutation.
- **Required Correction**: Remove `...expectedDelta` injection completely. Compute `observedDelta` strictly from real pre- vs. post-activation DOM and `IntentNavMockState` diffs. If a field was not actually mutated by the mock site's event handler, it must not appear in `observedDelta`.
- **Expected Measurement Impact**: Causal verification will only succeed when the mock-site handler legitimately mutates the expected property. Trials on unhandled actions or decoys will accurately fail causal verification.

---

### Finding 3: Manually Manufactured Witnesses and Correlation Metadata
- **File**: [`benchmark/runner.ts`](file:///Users/kumarmilind/Desktop/Navigation/benchmark/runner.ts#L246-L270)
- **Function**: `benchmarkDispatcher.collectWitnesses()`
- **Current Behavior**:
  ```typescript
  return [
    {
      witnessId: `wit_dom_${now}`,
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 1,
      timestamp: now + 20,
      observedDelta,
      correlatedActivationEventId: lastEventId, // Manually populated
      temporalDeltaMs: 20,
      isCausallyCorrelated: true,
      correlationExplanation: 'Live DOM mutation observed after click dispatch',
    },
    {
      witnessId: `wit_a11y_${now}`,
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 2,
      timestamp: now + 40,
      observedDelta,
      correlatedActivationEventId: lastEventId, // Manually populated
      temporalDeltaMs: 40,
      isCausallyCorrelated: true,
      correlationExplanation: 'Live Accessibility state mutation observed after click dispatch',
    },
  ];
  ```
- **Why It Is Problematic**: The benchmark fabricates two witness classes (`DOM_MUTATION` and `ACCESSIBILITY_STATE_MUTATION`) with identical copies of `observedDelta` (containing injected `expectedDelta`), hardcodes `isCausallyCorrelated: true`, and assigns the correlation ID directly. This bypasses genuine multi-channel witness collection.
- **Required Correction**: In the controlled JSDOM environment, where asynchronous browser mutation observer streams are simulated, witness generation must genuinely inspect DOM mutations (e.g. `aria-checked`, class, style) and distinct accessibility/application state mutations. If distinct witness classes are not independently observable for a given trial, mark as `INSUFFICIENT_EVIDENCE` rather than fabricating synthetic corroboration.
- **Expected Measurement Impact**: Causal verification rate will reflect true witness quorum availability rather than an artificially guaranteed multi-class quorum.

---

### Finding 4: JSDOM Window Lifecycle & Resource Leaks
- **File**: [`benchmark/runner.ts`](file:///Users/kumarmilind/Desktop/Navigation/benchmark/runner.ts#L304-L310)
- **Function**: `BenchmarkRunner.runBenchmark()`
- **Current Behavior**:
  ```typescript
  for (const intent of intents) {
    for (const site of sites) {
      ...
      currentSiteDOM = getFreshDOMForSite(site);
      // DOM window is never closed!
  ```
- **Why It Is Problematic**: For each of the 60 intents across 4 sites (240 iterations), `getFreshDOMForSite()` creates a new `JSDOM` instance with `runScripts: 'dangerously'`. Because `dom.window.close()` is never called, the window object, DOM tree, evaluation context, and event listeners remain pinned in memory, leading to continuous V8 heap accumulation and eventual OOM unless masked by arbitrary `--max-old-space-size`.
- **Required Correction**: Wrap the trial execution in a `try...finally` block that strictly calls `currentSiteDOM.window.close()` and nulls `currentSiteDOM`. Ensure no closures retain stale DOM elements.
- **Expected Measurement Impact**: Drastic reduction in resident set size (RSS) and heap growth across repeated benchmark runs; eliminates memory leak without needing excessive Node heap allocation.

---

### Finding 5: Clicks-Saved & Interaction Reduction Claims Are Unmeasured
- **File**: `benchmark/runner.ts`, `benchmark/reporter.ts`
- **Current Behavior**: The benchmark runner measures Top-1 accuracy, Top-3 accuracy, decoy rejection rate, false discovery rate, UI-change recovery rate, causal verification rate, and latency. However, claims of "clicks saved" or "interaction efficiency" mentioned in patent/documentation text are completely absent from the benchmark output metrics.
- **Why It Is Problematic**: If clicks saved is claimed without an empirical baseline comparison, it represents an unmeasured assertion.
- **Required Correction**: Explicitly define and calculate:
  - `manual_baseline_clicks`: The number of interactive clicks/steps a user must manually perform to locate and trigger the target capability on each mock site (ground-truth task interaction depth).
  - `intentnav_clicks`: Actual clicks dispatched by IntentNav (1 for direct action, plus 1 for confirmation if required).
  - `clicks_saved`: `manual_baseline_clicks - intentnav_clicks`.
  - `clicks_saved_percentage`: `clicks_saved / manual_baseline_clicks * 100`.
  If baseline interaction steps cannot be established with empirical ground truth for a given trial, report `NOT_MEASURED`.
- **Expected Measurement Impact**: Provides reproducible, auditable interaction reduction metrics.

---

### Finding 6: CPU and Memory Resource Consumption Unmeasured
- **File**: `benchmark/runner.ts`, `benchmark/reporter.ts`
- **Current Behavior**: Only execution wall-clock latency (`latencyMs`) is measured via `performance.now()`. Process RSS, heap memory, and CPU utilization are omitted from the metrics.
- **Why It Is Problematic**: Without resource telemetry, memory regressions and CPU spikes cannot be detected or compared against baselines.
- **Required Correction**: Measure `process.memoryUsage()` (heapUsed, heapTotal, rss) before and after the benchmark run, and track elapsed process CPU time via `process.cpuUsage()`. Clearly label these as Node/JSDOM process-level measurements, NOT browser extension runtime footprint.
- **Expected Measurement Impact**: Objective, reproducible resource reporting without fabrication.

---

### Finding 7: Ambiguous Benchmark Environment Labeling
- **File**: `benchmark/runner.ts`, `docs/BENCHMARKS.md`, `README.md`
- **Current Behavior**: In several places, JSDOM benchmark outputs are referred to as "Empirical Benchmark Evaluation" or "Simulated Execution Traces", while `report.md` states "100% of recovered routes underwent provisional quarantine and were promoted only after multi-class causal transition verification". This blurs the distinction between controlled JSDOM simulation and real Chromium MV3 E2E execution.
- **Why It Is Problematic**: Readers and patent examiners could conflate the JSDOM simulated benchmark with the separate Chromium CDP E2E test harness (`scripts/runChromiumE2E.js`).
- **Required Correction**: Explicitly label all benchmark headers, reports, and documentation as **CONTROLLED SIMULATED / JSDOM BENCHMARK**. Clearly distinguish it from **REAL CHROMIUM MV3 E2E EVIDENCE**.
- **Expected Measurement Impact**: Clear separation of scientific evidence tiers.

---

### Finding 8: Stale Benchmark Documentation & Contradictory Claims
- **Files**:
  - [`README.md`](file:///Users/kumarmilind/Desktop/Navigation/README.md#L72-L77): Claims `98.3%` accuracy, `0.0%` false discovery, `31.8 ms` latency.
  - [`benchmark/results/summary.json`](file:///Users/kumarmilind/Desktop/Navigation/benchmark/results/summary.json#L54-L64): Contains `33.68%` accuracy (`top1Accuracy: 0.3368`), `7.14 ms` average latency, `totalRuns: 2000`.
  - [`docs/CLAIM_RECONCILIATION.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/CLAIM_RECONCILIATION.md#L426): Cites "JSDOM 1200-trial suite".
  - [`benchmark/results/report.md`](file:///Users/kumarmilind/Desktop/Navigation/benchmark/results/report.md#L19): Text asserts "100% of recovered routes underwent provisional quarantine..." while the adjacent table shows `26.3%` causal verification.
- **Why It Is Problematic**: Presents obsolete/unverified numbers (`98.3%`) directly alongside lower measured metrics (`33.7%`), undermining audit credibility.
- **Required Correction**: Update all documentation to reflect actual verified measurements from the corrected benchmark, or explicitly label historical claims as obsolete archival data.
- **Expected Measurement Impact**: 100% consistency across `README.md`, `BENCHMARKS.md`, `summary.json`, and raw trial records.

---

## Summary Audit Table

| Finding # | Category | File & Location | Current Behavior | Required Correction | Impact |
|:---:|:---|:---|:---|:---|:---|
| 1 | Synthetic Success | `benchmark/runner.ts:227` | `stateChanged: stateChanged \|\| true` | Remove `\|\| true`; use real DOM/app diff | Fails unmutated dispatches |
| 2 | Injected Expected Data | `benchmark/runner.ts:244` | `{ ...appState, ...expectedDelta }` | Remove `...expectedDelta` from observed delta | Evaluates genuine mutations only |
| 3 | Fabricated Witnesses | `benchmark/runner.ts:246-269` | Hardcoded 2-class witnesses with injected data | Observe genuine DOM & a11y deltas | True causal rate reporting |
| 4 | Memory Leak | `benchmark/runner.ts:308` | JSDOM windows never closed | `try...finally { dom.window.close(); }` | Eliminates heap runaway |
| 5 | Unmeasured Metric | `benchmark/reporter.ts` | Clicks saved not measured | Implement ground-truth baseline vs IntentNav clicks | Auditable interaction reduction |
| 6 | Unmeasured Metric | `benchmark/runner.ts` | CPU and memory omitted | Capture `process.memoryUsage()` & `cpuUsage()` | Transparent resource telemetry |
| 7 | Ambiguous Labeling | `docs/BENCHMARKS.md` | JSDOM called "empirical execution" | Explicitly label as "CONTROLLED JSDOM BENCHMARK" | Evidence tier separation |
| 8 | Stale Documentation | `README.md:72`, `docs/` | `98.3%` vs `33.7%` vs `1200/2000` | Reconcile all docs with verified runs | Documentation integrity |

---

*End of Phase 1 Benchmark Integrity Audit.*

