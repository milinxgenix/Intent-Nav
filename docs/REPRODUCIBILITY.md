# IntentNav-SCFR: Complete Reproducibility Guide

This document provides exact, deterministic instructions to install, build, test, benchmark, and run the **IntentNav-SCFR** research prototype and browser extension.

---

## 1. System Requirements

- **Operating System**: macOS (Darwin x64/arm64), Linux (Ubuntu 20.04+ / Debian 11+), Windows 10/11 (via WSL2 or PowerShell).
- **Node.js**: v20.0.0 or higher (`node -v`). Tested on Node v20.17.0.
- **npm**: v10.0.0 or higher (`npm -v`). Tested on npm 10.8.2.
- **Web Browser**: Any Chromium-based browser supporting Manifest V3 (Google Chrome $\ge 118$, Brave $\ge 1.60$, Chromium $\ge 118$).
- **Hardware**: Minimum 4 GB RAM, 2 CPU cores, 500 MB free disk space.

---

## 2. Quickstart & Installation

From the project root directory:

```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript and build the Manifest V3 extension bundle into dist/
npm run build

# 3. Execute all unit tests, adversarial matrix suites, safety property tests, and browser E2E suite
npm test
```

Expected test execution output:
```text
 ✓ test/adversarial/matrix.spec.ts (26 tests)
 ✓ test/e2e/browser_e2e.spec.ts (16 tests)
 ✓ test/properties/properties.spec.ts (15 tests)
 ✓ test/unit/audit.spec.ts (1 test)
 ✓ test/unit/authorization.spec.ts (4 tests)
 ✓ test/unit/binding_handle.spec.ts (2 tests)
 ✓ test/unit/causal.spec.ts (8 tests)
 ✓ test/unit/drift.spec.ts (4 tests)
 ✓ test/unit/false_success.spec.ts (9 tests)
 ✓ test/unit/fingerprint.spec.ts (2 tests)
 ✓ test/unit/graph.spec.ts (3 tests)
 ✓ test/unit/intent.spec.ts (4 tests)
 ✓ test/unit/invariant.spec.ts (4 tests)
 ✓ test/unit/ordering.spec.ts (2 tests)
 ✓ test/unit/persistence.spec.ts (7 tests)
 ✓ test/unit/presentation_drift.spec.ts (1 test)
 ✓ test/unit/quarantine.spec.ts (3 tests)
 ✓ test/unit/security_privacy.spec.ts (3 tests)
 ✓ test/unit/semantic_precedence.spec.ts (1 test)
 ✓ test/unit/suppression.spec.ts (3 tests)
 ✓ benchmark/runner.spec.ts (1 test)

Test Files  21 passed (21)
     Tests  119 passed (119)
```

---

## 3. Real Chromium Headless MV3 End-to-End Testing (Live Browser CDP Suite)

To execute the genuine live browser end-to-end test suite across Scenarios A through J in headless Google Chrome:

```bash
# Spawns Google Chrome with --headless=new --load-extension=dist/ and communicates over CDP WebSocket
npm run test:e2e:chromium
# or directly:
node scripts/runChromiumE2E.js
```

### What this runs:
1. Launches live HTTP servers serving mock sites A through D (`scripts/serveMocks.js`).
2. Spawns Google Chrome binary in headless mode with remote debugging port `9222` and loaded MV3 extension (`dist/`).
3. Connects via direct WebSocket to Chrome DevTools Protocol (`ws://127.0.0.1:9222/devtools/browser/...`).
4. Dispatches and validates 10 empirical scenarios (**Scenarios A through J**):
   - **Scenario A**: Extension Service Worker registration and active lifecycle.
   - **Scenario B**: Content script automated injection and IPC communication.
   - **Scenario C**: Real DOM element discovery and real MouseEvent dispatch.
   - **Scenario D**: Multi-channel witness recording across live DOM, URL, and application state.
   - **Scenario E**: Invariant post-state enforcement preventing false positives on broken mutations.
   - **Scenario F**: Quarantine and promotion cycle under live drift.
   - **Scenario G**: Adversarial trap avoidance and suppression of destructive actions.
   - **Scenario H**: Asynchronous completion verification via acknowledgement channel.
   - **Scenario I**: 2FA/approval quorum workflow on high-risk mutations.
   - **Scenario J**: Multi-step graph navigation across sequential DOM states.
5. Emits raw cryptographic evidence with timestamps, event IDs, and execution trace to:
   - `evidence/chromium_e2e_evidence.json`

---

## 4. Running the Benchmark Suite

To execute the full empirical benchmark comparing IntentNav-SCFR against Baselines 1–3 across 100 intents and 4 mock environments (1,200 trials total):

```bash
# Run the benchmark runner via local vitest harness
npm run benchmark
```

The benchmark runner executes actual DOM evaluations via `CandidateGenerator.generateFromDOM()` inside loaded JSDOM window environments for all 4 sites, performing real event dispatch, state mutation inspection, and multi-channel witness collection. All trial outcomes and summary statistics are validated by `MetricValidator.validate()` to guarantee mathematical reconciliation between raw runs and aggregated summaries without synthetic multipliers.

Output files produced:
- `benchmark/results/summary.json` — Machine-readable summary statistics per site and paradigm.
- `benchmark/results/raw_runs.json` — All raw trial records with latency, outcome, witnesses, authorization.
- `benchmark/results/benchmark_results.csv` — Full trial-by-trial logs.
- `benchmark/results/report.md` / `docs/BENCHMARKS.md` — Formatted scientific report with comparison tables and statistical significance.
- `evidence/experiment-run/metrics.json` — Packaged summary metrics.

---

## 5. Serving the Mock Benchmark Websites

The benchmark suite includes four standalone test sites representing varying drift and adversarial conditions:

```bash
# Launch the mock HTTP server on port 3000
node scripts/serveMocks.js
```

Available endpoints:
- `http://localhost:3000/mock-sites/site-a/index.html` — Original clean portal ($V_1$).
- `http://localhost:3000/mock-sites/site-b/index.html` — Lexical synonym & DOM hierarchy drift.
- `http://localhost:3000/mock-sites/site-c/index.html` — Scrambled framework IDs & modal interruptions.
- `http://localhost:3000/mock-sites/site-d/index.html` — Adversarial semantic decoys & destructive traps.

---

## 6. Loading the Browser Extension in Chrome / Chromium

To inspect and test the interactive extension UI:
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `dist/` directory inside this project: `/Users/kumarmilind/Desktop/Navigation/dist`.
5. The extension **IntentNav-SCFR** will appear in the toolbar.
6. Open any test site (e.g. `http://localhost:8080/site-a/` or `site-b/`).
7. Click the IntentNav-SCFR icon to open the popup:
   - **User Mode**: Enter natural language intents (e.g., `"Change my password"`).
   - **Research / Debug Mode**: Inspect live 5D drift vectors ($[P, C, S, Cap, T]$), invariant gate results, witness correlation counters, and download append-only cryptographic audit logs.

---

## 7. Audit & Evidence Verification

The project includes cryptographic audit evidence packages in `evidence/`:
- `evidence/claim_1_evidence.json` through `evidence/claim_17_evidence.json`
- Full test log outputs and property verification proofs.

To verify that all 17 claims and 10 formal safety properties hold:
```bash
npx vitest run test/properties/properties.spec.ts test/adversarial/matrix.spec.ts
```
All assertions are deterministic, self-contained, and require zero external network access.

