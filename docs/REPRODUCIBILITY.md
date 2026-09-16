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

# 3. Execute all unit tests, adversarial matrix suites, and safety property tests
npm test
```

Expected test execution output:
```text
✓ test/unit/drift.spec.ts (2 tests)
✓ test/unit/causal.spec.ts (5 tests)
✓ test/unit/graph.spec.ts (3 tests)
✓ test/unit/authorization.spec.ts (4 tests)
✓ test/unit/ordering.spec.ts (2 tests)
✓ test/adversarial/matrix.spec.ts (26 tests)
✓ test/properties/properties.spec.ts (10 tests)
✓ test/unit/intent.spec.ts (4 tests)
✓ test/unit/invariant.spec.ts (4 tests)
✓ test/unit/quarantine.spec.ts (2 tests)
✓ test/unit/suppression.spec.ts (3 tests)
✓ test/unit/audit.spec.ts (1 test)
✓ test/unit/fingerprint.spec.ts (2 tests)
✓ benchmark/runner.spec.ts (1 test)

Test Files  14 passed (14)
     Tests  69 passed (69)
```

---

## 3. Running the Benchmark Suite

To execute the full 1,200-run empirical benchmark comparing IntentNav-SCFR against Baselines 1–4 across 60 intents and 4 mock environments:

```bash
# Run the benchmark runner directly via tsx
npx tsx benchmark/runner.ts
```

Output files produced:
- `benchmark/results/benchmark_summary.json` — Machine-readable summary statistics per site and paradigm.
- `benchmark/results/benchmark_results.csv` — Full trial-by-trial logs (1,200 rows with latency, outcome, witnesses, authorization).
- `docs/BENCHMARKS.md` — Formatted scientific report with comparison tables and statistical significance.

---

## 4. Serving the Mock Benchmark Websites

The benchmark suite includes four standalone test sites representing varying drift and adversarial conditions:

```bash
# Launch the mock HTTP server on port 8080
node scripts/serveMocks.js
```

Available endpoints:
- `http://localhost:8080/site-a/` — Original clean portal ($V_1$).
- `http://localhost:8080/site-b/` — Lexical synonym & DOM hierarchy drift.
- `http://localhost:8080/site-c/` — Scrambled framework IDs & modal interruptions.
- `http://localhost:8080/site-d/` — Adversarial semantic decoys & destructive traps.

---

## 5. Loading the Browser Extension in Chrome / Chromium

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

## 6. Audit & Evidence Verification

The project includes cryptographic audit evidence packages in `evidence/`:
- `evidence/claim_1_evidence.json` through `evidence/claim_17_evidence.json`
- Full test log outputs and property verification proofs.

To verify that all 17 claims and 10 formal safety properties hold:
```bash
npx vitest run test/properties/properties.spec.ts test/adversarial/matrix.spec.ts
```
All assertions are deterministic, self-contained, and require zero external network access.
