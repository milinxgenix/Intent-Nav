# IntentNav-SCFR: Benchmark Experiment Protocol

## 1. Experimental Objectives

This protocol establishes a standardized, reproducible benchmark methodology to evaluate the resilience, safety, and precision of **IntentNav-SCFR** compared against four industry-standard baseline paradigms:
1. **Baseline 1: Fixed Selector Replay** (CSS/XPath hardcoded replay standard in Selenium, Cypress, Playwright).
2. **Baseline 2: Keyword / Substring Matching** (Text search over accessible names and innerText).
3. **Baseline 3: Semantic-Only Similarity** (Dense embedding / high-dimensional semantic ranking without invariant gating).
4. **Baseline 4: Page-Level Direct Navigation** (Heuristic URL routing without interface state tracking).

The experimental evaluation addresses three primary research questions:
- **RQ1 (Resilience under Drift)**: Does IntentNav-SCFR maintain high Navigation Success Rate ($>95\%$) across severe presentation, structural, and lexical drift where traditional baselines fail?
- **RQ2 (Safety against Adversarial Decoys)**: Does the Invariant Closure and Contradiction Engine reject semantic decoys and achieve $0\%$ False Discovery Rate where semantic similarity fails?
- **RQ3 (Risk Authorization Integrity)**: Does the decoupled Execution Authorization Subsystem prevent $100\%$ of unauthorized high-risk operations regardless of candidate confidence?

---

## 2. Benchmark Environments & Test Sites

The benchmark suite deploys four isolated web environments running via a local HTTP server (`mock-sites/`):

| Environment | Host Port | Architectural Characteristics & Perturbations |
| :--- | :--- | :--- |
| **Site A: Original Portal** | `http://localhost:8080/site-a/` | Clean semantic DOM, stable IDs, hierarchical navigation (Settings, Privacy, Security, Notifications, Account). Represents initial deployment state $V_1$. |
| **Site B: Lexical & Hierarchy Drift** | `http://localhost:8080/site-b/` | Terminology drifted to enterprise synonyms ("Privacy & Safety" $\to$ "Data Governance", "2FA" $\to$ "Multi-Factor Protection"); restructured DOM trees; reordered menus. |
| **Site C: Scrambled Hash & Modal Drift** | `http://localhost:8080/site-c/` | Framework-generated IDs (`btn_jsx_8f912`), dynamic utility CSS (`flex py-2 w-full`), intermediate confirmation dialogs, transient DOM elements. |
| **Site D: Adversarial Decoy & Honeypots** | `http://localhost:8080/site-d/` | Semantic decoys ("Disable All Notifications" with high lexical similarity to "Notification Preferences"), destructive trap buttons, disguised input fields. |

---

## 3. Dataset Specification

The evaluation utilizes `benchmark/dataset/intents.json`, containing 60 version-controlled evaluation intents across 5 functional categories:
1. **Account & Identity Management** (12 intents): Password rotation, email updates, profile editing, 2FA configuration.
2. **Privacy & Data Governance** (12 intents): Telemetry toggles, data export, cookie consent, tracking permissions.
3. **Security & Access Control** (12 intents): Active sessions, API key creation, passkey enrollment, audit export.
4. **Notification & Channel Preferences** (12 intents): Email alerts, push digests, frequency throttling, quiet hours.
5. **High-Risk & Destructive Actions** (12 intents): Account closure, session revocation, factory reset, data erasure.

Each intent specifies:
- `intentId`: Canonical string identifier (e.g., `INT-001`).
- `rawQuery`: Natural language query (e.g., `"Update my backup recovery email address"`).
- `targetCapability`: Canonical capability URI.
- `riskLevel`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`.
- `expectedInvariants`: Array of mandatory predicate IDs.
- `forbiddenTargets`: Array of decoy candidate signatures.

---

## 4. Execution Matrix & Experimental Procedure

The full benchmark conducts an exhaustive factorial evaluation:
$$\text{Total Runs} = 60 \text{ Intents} \times 4 \text{ Sites} \times 5 \text{ Systems} = 1,200 \text{ Runs}$$

### Step-by-Step Procedure
1. **Server Initialization**: The local mock server is started (`node scripts/serveMocks.js`), hosting Sites A–D on port 8080.
2. **Harness Setup**: The automated runner (`benchmark/runner.ts`) initializes clean isolated browser contexts for each trial to eliminate cross-run state pollution.
3. **Baseline Evaluation**:
   - For each intent and each site, the 4 baseline agents execute their standard candidate resolution.
   - Failures (stale selectors, wrong semantic matches, decoy selection) are recorded with timestamp and reason.
4. **IntentNav-SCFR Evaluation**:
   - Executes the complete pipeline: Observe $\to$ 5D Drift Localization $\to$ Candidate Generation $\to$ Invariant Closure Gate $\to$ Negative Contradiction Check $\to$ Multi-Factor Post-Gate Ranking $\to$ Causal Transition Verification $\to$ Risk-Gated Authorization.
   - Emits an append-only audit event per run.
5. **Data Export**:
   - Results are compiled into `benchmark/results/benchmark_summary.json`.
   - Raw per-trial records are written to `benchmark/results/benchmark_results.csv`.
   - Summary markdown is published to `docs/BENCHMARKS.md`.

---

## 5. Metrics & Statistical Definitions

- **Navigation Success Rate (NSR %)**:
  $$\text{NSR} = \frac{N_{\text{success}}}{N_{\text{total}}} \times 100\%$$
- **False Discovery Rate (FDR %)**:
  $$\text{FDR} = \frac{N_{\text{decoy\_or\_wrong}}}{N_{\text{total}}} \times 100\%$$
- **Unauthorized High-Risk Executions ($N_{\text{unauth}}$)**:
  $$\text{Count of high/critical risk actions executed without human confirmation or required quorum (Target: 0)}$$
- **Mean Re-binding Latency ($\overline{t}_{\text{rebind}}$)**:
  $$\overline{t}_{\text{rebind}} = \frac{1}{N_{\text{rebind}}} \sum_{i=1}^{N_{\text{rebind}}} t_i \quad (\text{measured in milliseconds})$$
- **Invariant Rejection Rate (IRR %)**:
  $$\text{IRR} = \frac{N_{\text{candidates\_rejected\_by\_invariants}}}{N_{\text{total\_candidates\_observed}}} \times 100\%$$
