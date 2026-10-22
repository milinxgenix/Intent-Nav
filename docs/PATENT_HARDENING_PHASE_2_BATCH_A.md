# Patent Hardening Phase 2, Batch A: Evidence Integrity, Post-State Fingerprints & Negative Evidence

**Branch:** `patent-hardening-phase-2-batch-a-evidence`
**Parent Commit:** `3a87d75` (*"Integrate five-dimensional drift recovery and evidence"*)
**Frozen Baseline Preserved:** `3392b2a` (`intentnav-evidence-baseline-v1.0`)
**Authoritative Source Documents Preserved:** `docs/patent-requirements/` (100% clean)

---

## 1. Executive Summary & Batch Scope

This engineering batch completes and validates the closed-loop verification architecture across three tightly coupled roadmap milestones:
- **Step 4: Raw evidence and independent interpretation**
- **Step 5: Observed post-state fingerprint**
- **Step 6: Complete negative evidence**

All mechanisms are strictly implemented in code, empirically validated in live headless Google Chrome (155.0.8059.85), and accompanied by 339 passing unit and integration tests across 31 test suites.

---

## 2. Step 4 — Raw Evidence and Independent Interpretation

### Architectural Problem Addressed
Previously, witness collection retained only derived state delta maps. A caller or mock dispatcher could simulate `{ passed: true }` or duplicate the same observation across two witness records to artificially satisfy multi-class quorum.

### Implemented Mechanism
1. **Raw Observation Preservation:**
   - [`src/types/transition.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts) enhances `TransitionWitness` with:
     - `rawObservation`: Raw unprocessed DOM mutation or event payload.
     - `observationType`: Precise event category (`DOM_ATTRIBUTE_CHANGE`, `CHILD_LIST_MUTATION`, `ASYNC_ACK`, `APPLICATION_STATE`).
     - `provenance`: Origin tracking (`origin`, `sequenceId`, `observedAt`, `observerId`).
     - `routeId` and `capabilityId`: Strict binding metadata.
2. **Independent Derivation in Verifier:**
   - [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts) does not trust caller-supplied `isCausallyCorrelated: true`, `passed: true`, or `success: true`.
   - Derives transition validity strictly by comparing observed deltas against `expectedStateDelta`.
3. **Distinct Observational Origins Quorum:**
   - Verifies that witness records derive from distinct observational origins (`origins.size >= minClasses`), rejecting duplicate witnesses or multiple records synthesized from the same observer event.
4. **Inter-Witness Contradiction Elimination:**
   - When multiple witnesses are collected, detects and rejects conflicting values on expected transition delta properties with `FAILED_CONTRADICTORY_WITNESS`.
5. **Deduplication:**
   - Identical `witnessId` occurrences are deduplicated before quorum evaluation.

### Verification & Tests
- Covered by [`test/unit/step04_raw_evidence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step04_raw_evidence.spec.ts) (7 tests).

---

## 3. Step 5 — Observed Post-State Fingerprint

### Architectural Problem Addressed
Previously, the state machine passed the precomputed *expected* post-state fingerprint into transition verification, allowing verification to succeed through tautological self-matching. Real browser observations were only inspected downstream after verification completed.

### Implemented Mechanism
1. **Domain-Separated Canonical Post-State Fingerprint:**
   - Defined `POST_STATE_FINGERPRINT_DOMAIN = 'INTENTNAV_SCFR_POST_STATE_FINGERPRINT_V2'`.
   - Implemented `FingerprintConstructor.computePostStateFingerprint()` in [`src/core/fingerprint/constructor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts), producing SHA-256 hashes (`postfp_sha256_<64hex>`).
   - Deterministically canonicalizes:
     - Lexicographically sorted `observedApplicationState` key-value pairs.
     - Sorted arrays for `semanticLandmarks`, `activeModalsOrDialogs`, and `activeTabs`.
     - Monotonically bound to `capabilityId`, `routeId`, `activationEventId`, and `domStructuralHash`.
2. **Observed vs. Expected Separation:**
   - Introduced `ObservedPostState` in [`src/types/transition.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts) requiring `isObserved: true`.
   - In [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts), post-state observation occurs *before* causal verification via `dispatcher.observePostState()`, and the resulting `ObservedPostState` is passed to the verifier.
3. **Fail-Closed Verification Gates:**
   - Rejects unchanged post-state (`postStateFingerprint === preStateFingerprint`) with `FAILED_POST_STATE_MISMATCH`.
   - Rejects predicted or simulated states (`isObserved !== true`).
   - Rejects stale `activationEventId` or mismatched `capabilityId` bindings.

### Verification & Tests
- Covered by [`test/unit/step05_post_state_fingerprint.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step05_post_state_fingerprint.spec.ts) (7 tests).

---

## 4. Step 6 — Complete Negative Evidence

### Architectural Problem Addressed
Previously, failed routes did not systematically record auditable failure conditions, quarantine decisions, or instructions for reconsideration, risking either permanent suppression or premature re-execution.

### Implemented Mechanism
1. **Structured Negative Evidence Schema:**
   - Enhanced `NegativeEvidenceEntry` in [`src/types/negativeEvidence.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/negativeEvidence.ts) with:
     - `failedCondition`: Specific failed predicate or causal status (`FAILED_POST_STATE_MISMATCH`, `FAILED_CONTRADICTORY_WITNESS`, etc.).
     - `affectedCapabilityId`, `affectedRouteId`, `affectedCandidateId`.
     - `sequenceNumber`, `activationEventId`, `witnessIds`.
     - `failureClassification`.
     - `quarantined: true`.
     - `canReconsider: boolean`.
     - `requiredMaterialEvidenceChange`: Actionable explanation of what interface change permits reevaluation.
2. **Lifecycle Quarantine & Storage Integration:**
   - Enhanced [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts) with `recordCausalFailure()` and `canCandidateBeReconsidered()`.
   - Enhanced `QuarantineController.quarantineFailedRoute()` in [`src/core/quarantine/controller.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/controller.ts) to record structured negative evidence whenever routes are quarantined.
   - Connected `machine.ts` transition verification failure directly to `quarantineFailedRoute()`.
   - Integrated with `PersistentCapabilityStore` for cross-session durability.
3. **Material Evidence Reconsideration Rule:**
   - Candidates presenting identical material hashes are suppressed.
   - Candidates exhibiting material interface changes (e.g. modified target entity, role, or container semantics) are permitted to be reconsidered without permanent lock-out.

### Verification & Tests
- Covered by [`test/unit/step06_negative_evidence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/step06_negative_evidence.spec.ts) (5 tests).

---

## 5. Test & Browser Evidence Provenance

### Automated Unit & Integration Suites
- **Test Suites:** 31 passed, 31 total.
- **Tests:** 339 passed, 339 total.
- **Execution Time:** ~3.7 seconds.

### Live Headless Chromium E2E Evidence
All 5 Chromium browser harnesses executed in real Google Chrome (155.0.8059.85):

| Evidence File | Run ID | Timestamp | SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- | :--- |
| `evidence/chromium_e2e_evidence.json` | `run_chromium_1792648392820` | `1792648407763` | `3b490e0acdde26f84540c9b2b47e4da9e3a0af695b32e441724f9b6a2a720aa4` | 10/10 Verified |
| `evidence/chromium_e2e_negative_evidence.json` | `run_neg_chromium_1792649458545` | `1792649478860` | `f851232232c8a129ad62fb1840f0f421e246981e012e4327969593c734abb577` | 14/14 Refused |
| `evidence/chromium_network_privacy_evidence.json` | `run_privacy_1792650935784` | `1792650951399` | `66403c986a48e35ddb5e001ea13033a9de9ab2439d0edf8075f75c67a2edde14` | Zero Outbound Calls |
| `evidence/chromium_route_rollback_evidence.json` | `run_rollback_1792649540927` | `1792649545098` | `e3f34db864e461c9dc65c7c6404c238614fe6af5ed53b8b2986a708a494c8832` | Claim 10 Verified |
| `evidence/chromium_witness_class_evidence.json` | `run_witness_1792649899345` | `1792649907360` | `31f89f52d32c3afaa8f10196b9efa94468fc9d82a06b11dbb22cc352c1a061d7` | Claim 8 (All 6 Classes) |

All 5 validation scripts (`scripts/validate*.js`) executed and passed with 100% compliance.

---

## 6. Dependency Vulnerability Status

`npm audit` reports 4 vulnerabilities (2 high, 2 moderate) confined exclusively to build and testing tooling (`vite`, `vitest`, `source-map-js`). No dependency manifests were modified during this batch, preserving reproducibility and dependency isolation.
