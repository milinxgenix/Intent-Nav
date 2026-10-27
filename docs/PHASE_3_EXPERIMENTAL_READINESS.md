# IntentNav-SCFR: Phase 3 Experimental Readiness Report
**Phase 3 Transition & Experimental Infrastructure Audit**
**Lead Owner**: MILIND
**Downstream Experiment Owner**: SREE (Phase 3 Steps 11–13: Benchmark Integrity, Comparison Baselines, Controlled Mutations)

---

## 1. Exact Starting Commit and Repository State

### 1.1 Git Working Tree & Ref Verification
The repository identity, commit ancestry, and branch synchronization have been confirmed from Git:

| Parameter | Recorded Value / Ref | Verification Status |
| :--- | :--- | :--- |
| **Active Branch** | `patent-hardening-phase-2-batch-b-capability-routing` | Exact local branch |
| **Remote Tracking** | `origin/patent-hardening-phase-2-batch-b-capability-routing` | Fully synchronized (0 ahead, 0 behind) |
| **HEAD Commit SHA** | `bc4a34be60dc58e45dab60a657d4e0009ab77798` | Verified |
| **Parent Commit (Batch A)** | `b336e352d6995b0c3db4c2987ec534733de892fa` | Verified linear parent (`HEAD^`) |
| **Ancestor Commit (Step 3)** | `3a87d754700e62e29d79bf842c75e6bf2343393c` | Verified ancestor |
| **Frozen Baseline Tag** | `intentnav-evidence-baseline-v1.0` $\rightarrow$ `3392b2adcc309431a3fcff08a872524713a4782c` | Immutable baseline tag verified |
| **Authoritative Patent Docs** | `docs/patent-requirements/` | **0 differences** (`git diff` returned empty) |
| **Tracked Working Tree** | Clean (`git status --porcelain=v1` reports 0 modified tracked files) | Clean |

### 1.2 Preserved Untracked Artifacts
In compliance with repository preservation rules, the following six untracked release and patent-review files remain untouched:
1. `IntentNav-SCFR-Evidence-Baseline-v1.0.zip`
2. `release/`
3. `docs/RELEASE_INTEGRITY_MANIFEST.sha256`
4. `docs/FINAL_CLAIM_DOCUMENT_RECONCILIATION.md`
5. `docs/FINAL_SUBMISSION_MANIFEST.md`
6. `docs/PATENT_REVIEW_ACTION_ITEMS.md`

### 1.3 Baseline Discrepancy Resolution
The 40-character commit SHA of the frozen baseline tag is confirmed as `3392b2adcc309431a3fcff08a872524713a4782c`. The string `3392b2ac1c9a0c79ca2fc76f034a7fb4ce9d9b6a` recorded in an earlier chat summary was an unverified textual typo and has been corrected against authoritative Git output.

---

## 2. Existing Experimental Infrastructure and Evidence Formats

The repository contains two distinct, complementary experimental testbeds that must remain separated:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TESTBED ARCHITECTURE                                  │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│    A. CONTROLLED JSDOM BENCHMARK      │       B. REAL HEADLESS CHROMIUM         │
│         (Steps 11–13 Suite)           │            (CDP / MV3 Suite)            │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ • Runner: benchmark/runner.ts         │ • Runner: scripts/runChromiumE2E.js     │
│ • Oracle: SITE_EXPECTED_ELEMENT_IDS   │ • Oracle: window.IntentNavMockState     │
│ • Mock Sites: Site A, B, C, D (HTML)  │ • Mock Server: http://localhost:3000    │
│ • Baselines: Baselines 1–4            │ • MV3 Extension: dist/manifest.json     │
│ • Intents: benchmark/dataset/         │ • Live Events: Real Blink DOM Mutation, │
│ • Telemetry: CPU, Heap, Latency       │   CDP WebSocket, Navigation Intercept   │
│ • Output: benchmark/results/          │ • Output: evidence/chromium_*.json      │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

### 2.1 Available Test Commands & Tooling Inventory
The following commands and scripts constitute the available test and validation infrastructure configured in the repository:

| Command | Entrypoint Script | Output Location | Infrastructure Role & Scope |
| :--- | :--- | :--- | :--- |
| `npm run benchmark` | `benchmark/runner.spec.ts` $\rightarrow$ `benchmark/runner.ts` | `benchmark/results/` | JSDOM comparative benchmark against Baselines 1–4 across 100 intents. |
| `npm run test:e2e:chromium` | `scripts/runChromiumE2E.js` | `evidence/chromium_e2e_evidence.json` | Headless Chrome CDP E2E runner over live mock HTTP server (Scenarios A–J). |
| `npm run test:e2e:chromium:neg` | `scripts/runNegativeChromiumE2E.js` | `evidence/chromium_e2e_negative_evidence.json` | Negative evidence, contradiction capture, and suppression runner in Chrome. |
| `npm run test:e2e:chromium:rollback` | `scripts/runChromiumRouteRollbackE2E.js` | `evidence/chromium_route_rollback_evidence.json` | Reversible transition rollback & invariant verification runner in Chrome. |
| `npm run test:e2e:chromium:witnesses` | `scripts/runChromiumWitnessClassE2E.js` | `evidence/chromium_witness_class_evidence.json` | Multi-class witness verification runner ($\ge 2$ classes) in Chrome. |
| `npm run test:e2e:chromium:privacy` | `scripts/runChromiumNetworkPrivacyE2E.js` | `evidence/chromium_network_privacy_evidence.json` | Zero external network egress verification runner under CDP auditing. |
| `npm run validate:evidence` | `scripts/validateChromiumEvidence.js` | Console report (Exit 0/1) | Structural schema and invariant validator for positive Chrome evidence. |
| `npm run validate:evidence:neg` | `scripts/validateNegativeEvidence.js` | Console report (Exit 0/1) | Structural schema validator for negative Chrome evidence file. |
| `npm run validate:rollback` | `scripts/validateChromiumRouteRollbackEvidence.js` | Console report (Exit 0/1) | Validator for rollback evidence integrity and live invariant closure. |
| `npm run validate:witness-classes` | `scripts/validateChromiumWitnessClassEvidence.js` | Console report (Exit 0/1) | Validator for quorum and independent observer origins in Chrome evidence. |
| `npm run validate:network-privacy` | `scripts/validateChromiumNetworkPrivacyEvidence.js` | Console report (Exit 0/1) | Validator for SHA-256 digest and zero-egress assertion on privacy log. |

*(Note: These commands and validators represent available testbed infrastructure. During this preparation inspection task, no new test executions or evidence regenerations were authorized or run.)*

### 2.2 Environment Metadata & Reproducibility Boundary
The existing runners systematically capture the following runtime metadata:
- **Operating System & Architecture**: `process.platform`, `process.arch` via `scripts/resolveChrome.js`.
- **Node.js Runtime Version**: `process.version` captured in `BenchmarkTelemetry` (`benchmark/reporter.ts#L42`).
- **Browser Binary & Version**: Resolved Chrome executable path and version queried over `http://127.0.0.1:9222/json/version` (`scripts/runChromiumE2E.js#L81-L86`).
- **Run Identity**: Unique timestamped `runId` generated per execution.
- **Resource Profiling**: Start/end heap memory, RSS, user/system CPU execution time (`benchmark/reporter.ts#L44-L55`).
- **Separation of Test Oracle from Target Engine**:
  - In JSDOM (`benchmark/runner.ts#L30-L42`): Ground-truth element IDs in `SITE_EXPECTED_ELEMENT_IDS` are accessed **strictly post-hoc** by the test oracle to grade whether the chosen element matches expectations. Ground-truth IDs are never passed into `CandidateGenerator`, capability matching, or the state machine.
  - In Chromium (`scripts/runChromiumE2E.js#L502-L511`): The test harness evaluates `window.IntentNavMockState` via an independent post-execution hook (`evaluatedBy: 'INDEPENDENT_TEST_ORACLE'`).

**Reproducibility Qualification**: Recording runtime versions and metadata does not by itself guarantee absolute experimental reproducibility across distinct physical machines. Critical environmental variables remain to be validated during experimental protocol setup, including:
1. Microarchitectural CPU frequency scaling and background system process load affecting millisecond latency measurements.
2. Operating-system monotonic clock resolution and jitter during tight witness collection intervals.
3. Chrome CDP WebSocket message dispatch timing and DevTools protocol latency variations under heavy concurrency.
4. Browser font-rendering, sub-pixel layout rounding, and GPU rasterization differences across operating systems.

---

## 3. Experimental Readiness Checklist for SREE (Steps 11–13)

### Step 11: Benchmark Integrity and Memory Lifecycle

| Check Item | Requirement & Methodology | Controlled Constant | Deliberately Changed | Success Criteria / Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **11.1 Run Provenance** | Every trial record must include `runId`, `gitCommitSha`, `timestamp`, `environment`, and `siteVersion`. | Git commit SHA, site HTML/JS source code. | User intent queries ($N=100$). | All trial records contain complete, non-null provenance fields. |
| **11.2 State Isolation** | Test state from trial $N$ must not leak into trial $N+1$. | Storage backend schema, mock site HTML. | Successive intent queries. | Fresh in-memory `PersistentCapabilityStore` and `IntentNavMachine` per trial or explicit reset. |
| **11.3 Memory Lifecycle** | Measure heap delta and garbage collection stability across sequential runs. | Intent sequence, execution dispatcher timeout. | Execution iterations ($1 \dots N$). | No unbounded heap growth; memory ceiling and heap delta threshold **[Pending Protocol Design Decision]**. |
| **11.4 Replay Contamination** | Verify that negative evidence from a failed trial does not suppress legitimate candidates in subsequent unrelated trials. | Interface state hash on unrelated sites. | Target capability. | Zero false suppression on distinct capability contexts. |
| **11.5 Metric Validation** | Run `MetricValidator.validate()` on all aggregate numbers. | Metric formulas in `benchmark/metricValidator.ts`. | Aggregated trial results. | Top-1 $\le$ Top-3; Unauthorized High-Risk $\equiv 0$; 100% decoy rejection on adversarial sets. |

### Step 12: Comparison Baselines

*Scope Note*: The characterizations below describe the specific baseline implementations provided in `benchmark/baselines/`, not universal claims about all possible selector-based, keyword, or semantic automation systems.

| Baseline System | Implementation Source | Operational Mechanics & Fairness Controls | Measured Metrics | Specific Implementation Characterization & Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Baseline 1: Fixed Selector Replay** | `benchmark/baselines/baseline1_selector.ts` | Replays fixed CSS selectors (`#id`, `.class`). Emulates conventional fixed-target RPA scripts. | Top-1 Accuracy, Recovery Rate, Latency. | Fails completely when selectors break or change; provides zero drift localization; lacks safety invariant gating. |
| **Baseline 2: Keyword Matching** | `benchmark/baselines/baseline2_keyword.ts` | Tokenizes user intent and matches lexical tokens against DOM button/link text content. | Top-1 Accuracy, Decoy Rejection, Latency. | Selects high-lexical-overlap decoys; vulnerable to inverted polarity (negation); no structural invariant closure. |
| **Baseline 3: Semantic Embeddings** | `benchmark/baselines/baseline3_semantic.ts` | Computes term-vector cosine similarity between intent text and candidate accessibility labels. | Top-1 Accuracy, Decoy Rejection, Latency. | Confuses semantically related but functionally opposed operations (e.g. "Deactivate" vs "Delete"); no pre-gate invariant checking. |
| **Baseline 4: Page Navigation** | `benchmark/baselines/baseline4_pageNav.ts` | Matches URL patterns and page-level heading structures; assumes target exists at conventional route. | Top-1 Accuracy, False Discovery Rate. | Incapable of operating in-page modal dialogs, tab panels, or dynamic drawers without separate URL routes. |

*Fairness Control*: All four baseline implementations receive and evaluate the exact same candidate evaluation contexts (`CandidateEvaluationContext[]`) and HTML DOM representations as IntentNav-SCFR.

### Step 13: Controlled Interface Mutations

The controlled mutation suite must evaluate the five canonical dimensions of interface mutation across Mock Sites A, B, C, D:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   5D CONTROLLED INTERFACE MUTATIONS                    │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 1. Identifier Mutation   │ Dynamic IDs, React 18 (:r3:), Ember hashes  │
│ 2. Structural Mutation   │ DOM depth shifts, container re-parenting    │
│ 3. Presentation Mutation │ CSS class changes, dark mode, layout shifts │
│ 4. State Mutation        │ In-page modals, dialogs, tab transitions    │
│ 5. Transition Mutation   │ Delayed DOM mutation, missing event deltas  │
└──────────────────────────┴─────────────────────────────────────────────┘
```

| Mutation Category | Controlled Constant | Deliberately Mutated Attribute | What is Measured | Valid Trial Condition |
| :--- | :--- | :--- | :--- | :--- |
| **13.1 Identifier** | Element role, accessible name, structural ancestors. | `id` and `class` attributes scrambled (e.g. `SiteC` dynamic framework hashes). | Top-1 Recovery Rate, $\Delta P$ presentation drift. | Target element remains clickable and functional in DOM. |
| **13.2 Structural** | Accessible name, target function, visual styles. | DOM hierarchy depth (+2 nested wrapper divs), sibling node reordering. | Structural drift $\Delta S$, recovery latency. | Target element remains visible in accessibility tree. |
| **13.3 Presentation** | DOM hierarchy, IDs, target capability. | Theme swap (light to dark), color, font family, padding, absolute layout shift. | $\Delta P$ drift score; proof that presentation drift alone does NOT trigger route invalidation. | Visual change occurs without functional interface state mutation. |
| **13.4 State** | Goal intent, final target button. | Intermediate interface state (target enclosed in closed Modal or unselected Tab). | Multi-step route planning success, intermediate state transition. | Target capability reachable only after intermediate state mutation. |
| **13.5 Transition** | Candidate selection, activation event. | Mutation timing (delayed delta > verification window), suppressed DOM events, synthetic false success. | Causal verification rejection rate, negative evidence logging. | Injected transition anomaly must be caught by witness verifier. |

*Protocol Design Note*: Numerical performance thresholds (such as acceptable recovery latency ceilings and drift tolerance boundaries) are explicitly **[Pending Design Decision]** until SREE establishes the calibrated Phase 3 baseline protocol.

---

## 4. Multi-Step Route Finding: Scope, Impact & Limitations

### 4.1 Detailed Code-Path Analysis
The integration audit identified the following specific architectural characteristic in multi-step execution:
1. In `executeMultiStepRouteAsync()` ([`src/core/stateMachine/machine.ts#L1445-L1453`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L1445-L1453)), after all sequential transitions $[T_1, T_2, \dots]$ pass causal verification, the method returns `{ success: true, completedStepsCount, finalState: 'EXECUTED' }` and sets `this.state = 'EXECUTED'`.
2. However, `route.status` is not updated to `ACTIVE_VALIDATED` on the capability node in `CapabilityGraphEngine`; the route object remains in status `'PROVISIONAL'`.
3. In `test/unit/step08_multistep_route_planning.spec.ts` ([`L199-L258`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step08_multistep_route_planning.spec.ts#L199-L258)), `executeMultiStepRouteAsync()` is tested only for intermediate step failure and immediate halting. There is currently no positive unit test asserting the full promotion of a multi-step route to `ACTIVE_VALIDATED`.
4. Furthermore, **none of the five frozen Chromium runners** (`scripts/runChromiumE2E.js`, `runNegativeChromiumE2E.js`, `runChromiumRouteRollbackE2E.js`, `runChromiumWitnessClassE2E.js`, `runChromiumNetworkPrivacyE2E.js`) invoke `executeMultiStepRouteAsync()`. Successful multi-step route promotion remains insufficiently tested and is unverified under genuine browser CDP execution.

### 4.2 Scoped Impact on Phase 3 Experiments
- **Impact on the Primary Comparative Benchmark Runner (`benchmark/runner.ts`)**:
  - The comparative benchmark runner calls `machine.processIntent()`.
  - `processIntent()` executes the primary single-transition closed-loop pipeline (`executeTransition()`), which **does** promote the route to `ACTIVE_VALIDATED` via `this.promotionController.evaluateAndPromoteAsync()` and validates Precondition 6 (`PRE_6_ROUTE_AUTHORIZED`) and Precondition 17 (`PRE_17_PROMOTION_TOKEN_VALID` and `PRE_17_ROUTE_PROMOTED`).
  - Therefore, the primary 100-intent comparative evaluation across Mock Sites A, B, C, D is **unaffected** by this code path.
- **Potential Impact on Downstream Phase 3 Experiments**:
  - If SREE designs an experiment that specifically evaluates *persistent caching, graph re-selection, and automatic replay of multi-step graph route versions*, that experiment **will be impacted** because multi-step routes currently remain in `PROVISIONAL` status.
  - The behavior is fail-safe (it does not promote unverified routes), but it means multi-step routes currently operate in a transient execution mode rather than as persistent validated graph paths.

### 4.3 Controlled Limitation Definition
This behavior is formally classified as a **Controlled Experiment Limitation**:
- Multi-step graph routes operate exclusively in transient verified execution mode.
- Persistent multi-step route caching and graph-level promotion to `ACTIVE_VALIDATED` must not be assumed in experimental hypotheses without prior remediation and dedicated regression testing.

---

## 5. Dependency and Tooling Safety Review

### 5.1 Package Versions in `package-lock.json`
Direct inspection of `package-lock.json` records the exact installed versions:
- `vite`: `6.4.3` (`devDependencies`)
- `vitest`: `4.1.11` (`devDependencies`)
- `source-map-js`: `1.2.1` (transitive via `vite`)
- `@vitest/mocker`: `4.1.11` (transitive via `vitest`)

### 5.2 Security and Production Isolation Context
- **Tooling Isolation**: All Vite and Vitest dependencies reside exclusively in build and test developer tooling. Zero lines of Vite or Vitest code are packaged into production extension runtime bundles (`dist/contentScript.js`, `dist/background.js`).
- **Prior Advisory Reconciliation**: The advisories referenced in earlier Step 3 audit summaries (`source-map-js <1.0.2` and `vite <=5.4.11`) applied to an earlier lockfile. The current lockfile contains `vite 6.4.3` and `source-map-js 1.2.1`.
- **Policy Enforcement**: In strict adherence to project boundaries, `npm audit fix`, package upgrades, and lockfile modifications were not performed during this inspection.

---

## 6. Prerequisites SREE Needs Before Starting Phase 3

Before initiating experimental trials under Steps 11–13, SREE must satisfy the following operational prerequisites:
1. **Clean Baseline Working Tree**: Working tree must match commit `bc4a34be60dc58e45dab60a657d4e0009ab77798` with no modified tracked files.
2. **Local Mock Server Availability**: TCP Port 3000 must be unreserved to avoid EADDRINUSE collisions during mock site serving.
3. **Dedicated Chrome CDP Port**: TCP Port 9222 must be free for headless Chrome remote debugging.
4. **Independent Evidence Directory Isolation**: New experimental runs for Steps 11–13 must output to dedicated directories (e.g. `benchmark/results/phase3/` or `evidence/phase3/`) to avoid overwriting or corrupting the frozen baseline evidence files (`evidence/chromium_*.json`).
5. **Strict Test Oracle Independence**: SREE's experimental harnesses must never inject `SITE_EXPECTED_ELEMENT_IDS` or ground-truth element handles into `CandidateGenerator`, capability matching, or `IntentNavMachine`.

---

## 7. Experimental Readiness Decision

### **DECISION: READY WITH CONTROLLED LIMITATIONS**

**Summary of Grounds**:
1. **Repository & Working Tree Cleanliness**: Active branch `patent-hardening-phase-2-batch-b-capability-routing` at `bc4a34b` is verified clean and synchronized with origin.
2. **Authoritative Requirements Uncompromised**: The frozen baseline tag `intentnav-evidence-baseline-v1.0` (`3392b2adcc309431a3fcff08a872524713a4782c`) has zero diff against `docs/patent-requirements/`.
3. **Available Testbed Infrastructure Confirmed**: Test commands, JSDOM benchmark runners, headless Chromium runners, and evidence validators are structurally cataloged and available.
4. **Controlled Limitation Documented**: The multi-step route promotion limitation is clearly bounded to multi-step route caching and does not compromise the primary single-transition comparative benchmark pipeline.
5. **Thresholds & Reproducibility Formally Qualified**: Performance ceilings and memory thresholds remain pending until protocol calibration; environmental reproducibility boundaries are explicitly defined.

---

*Report prepared under MILIND's ownership for handover to Phase 3 experimental design.*

