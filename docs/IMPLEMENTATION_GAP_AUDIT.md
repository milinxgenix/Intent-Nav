# IntentNav-SCFR: Implementation Gap Audit (Pre-Remediation Baseline)

**Date**: 2026-09-16  
**Auditor**: Principal Software Architect & Patent Alignment Engineer  
**Objective**: Comprehensive audit of the existing codebase against the three patent disclosure documents (*v6.docx*, *patent.docx*, and *INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx*) to identify all simulation shortcuts, hardcoded values, missing checks, and architectural compromises prior to remediation.

---

## 1. Executive Summary of Baseline Gaps

The initial architectural prototype established key structural boundaries, but contained several critical implementation compromises:
1. **Simulated Activations & Witnesses**: In `src/core/stateMachine/machine.ts`, synthetic activation events and multi-class transition witnesses were fabricated in-memory rather than collected from live browser interactions.
2. **Website-Provided Identifier Dependency (`data-capability-id`)**: Mock sites (Sites A, B, C, D), `InterfaceObserver`, `CandidateGenerator`, and `contentScript.ts` queried and matched elements directly using `data-capability-id`, bypassing genuine DOM-based functional candidate discovery.
3. **In-Memory Volatile Persistence**: State storage in `CapabilityGraphEngine`, `RouteManager`, and `NegativeEvidenceStore` relied exclusively on in-memory `Map` objects, failing to survive service worker shutdowns or extension reloads.
4. **Bypassable Quarantine & Promotion**: `RouteManager.promoteToActive(capabilityId, routeId)` permitted route promotion without validating a transition verification token or checking evidence quorums.
5. **Hardcoded Invariants & Empty Invariant Arrays**: Fingerprints defined in `background.ts` and `benchmark/runner.ts` left `mandatoryPreStatePredicates`, `allowedStateDelta`, `expectedPostState`, and `forbiddenContextPredicates` as empty arrays (`[]`), and `InvariantClosureEngine` fell back to hardcoded strings (`ALL_NOTIFICATIONS`, `DELETE`).
6. **Arbitrary Constants in Typed Drift Vector**: `TypedDriftDetector` assigned fixed constants (e.g., `structure = 0.65`, `transition = 0.85`) rather than computing normalized metric distances between equivalent evidence classes.
7. **Caller-Asserted Causality**: `CausalTransitionVerifier` checked `w.isCausallyCorrelated`, relying on the caller to declare causality rather than deriving it from temporal precedence, sequence alignment, delta compatibility, and pre-existing state rejection.
8. **Decoupled Browser Execution**: Execution was flagged as `EXECUTED` when authorization was granted, without performing actual browser dispatch via the content script and without validating the post-transition state.
9. **Benchmark Scope & Fabricated Output Risks**: The benchmark dataset contained only 60 intents instead of $\ge 100$, and baseline agents made heuristic assumptions rather than operating on real DOM trees.

---

## 2. Detailed File-by-File Gap Analysis

### 2.1. `src/core/stateMachine/machine.ts`
- **Line 198–202**: Created routes with hardcoded placeholder state IDs (`fromStateId: 'CURRENT_PAGE'`, `toStateId: 'TARGET_PANEL'`).
- **Line 209–237**: Fabricated synthetic activation events (`act_${Date.now()}`) and manually injected mock witnesses into `WitnessCollector` (`this.witnessCollector.recordWitness('DOM_MUTATION', ...)`).
- **Line 304–308**: Marked machine state as `EXECUTED` immediately upon authorization approval without dispatching to the content script or verifying the resulting post-state.

### 2.2. `src/browser/contentScript.ts` & `src/browser/observer/interfaceObserver.ts`
- **`contentScript.ts` Line 58**: Dispatched clicks by querying `document.querySelector('[data-capability-id="..."]')`.
- **`interfaceObserver.ts` Line 53–56**: Captured `exposedCapabilityIds` by scanning for `[data-capability-id]`.
- **`contentScript.ts` Line 18–23**: Recorded only coarse DOM mutations (`{ url, title }`) without capturing changed attributes (`aria-checked`, `aria-expanded`, `disabled`), target node hierarchies, or application state changes.
- **Missing**: History API interception (`pushState`, `replaceState`) and `window.IntentNavMockState` application-state event monitoring.

### 2.3. `src/core/candidate/generator.ts`
- **Line 60–74**: Hardcoded specific regex rules mapping button labels to predetermined target entity strings (`MARKETING_NOTIFICATIONS`, `ALL_NOTIFICATIONS`, `PERSONAL_DATA_EXPORT`).
- **Line 76**: Assigned `candidateId` directly from `el.getAttribute('data-capability-id')`.
- **Missing**: Constructing a distinct `BindingHandle` for execution while deriving functional candidate evidence strictly from observable DOM semantics.

### 2.4. `src/core/invariant/engine.ts` & `predicates.ts`
- **Line 90–94**: Hardcoded forbidden target arrays (`['ALL_NOTIFICATIONS', 'DELETE_ACCOUNT', 'SYSTEM_ROOT', 'GLOBAL_SETTINGS']`) rather than evaluating the fingerprint's `forbiddenContextPredicates` and `negativeEvidence`.
- **Missing**: Returning `INSUFFICIENT_EVIDENCE` status when required contextual or state evidence is absent.
- **Missing**: Full evaluation of state delta compatibility and post-state predicate validation.

### 2.5. `src/core/drift/detector.ts`
- **Line 45**: Inappropriately compared `stored.contextEvidence.relativeStructuralRelationships` (structural paths) against `observedClasses` (CSS classes).
- **Line 68 & 95**: Assigned hardcoded constants (`0.65`, `0.85`) instead of continuous normalized distances.

### 2.6. `src/core/causal/verifier.ts`
- **Line 44**: Relied on `w.isCausallyCorrelated === true` asserted by the caller.
- **Missing**: Internal derivation of causality based on activation event ID correlation, temporal bounds, sequence ordering, and pre-existing state rejection.
- **Missing**: Strict verification of $\ge 2$ distinct, independent witness classes (e.g., rejecting duplicate `DOM_MUTATION` events).

### 2.7. `src/core/graph/routeManager.ts` & `capabilityGraph.ts`
- **Line 53**: `promoteToActive(capabilityId, routeId)` took no verification token, allowing unverified routes to be promoted directly to active.
- **Missing**: Persistence layer; all nodes, route versions, and edges were stored only in JavaScript `Map` instances.

### 2.8. `mock-sites/`
- All mock sites (`site-a`, `site-b`, `site-c`, `site-d`) embedded `data-capability-id="..."` on buttons, giving away capability identity.
- No mock sites exposed `window.IntentNavMockState` for application-state witness validation.

### 2.9. `benchmark/`
- Dataset contained only 60 intents instead of the required $\ge 100$.
- Fingerprints in `BENCHMARK_CAPABILITIES` left predicate arrays empty.

---

## 3. Remediation Target Summary

| Subsystem | Baseline Status | Required Remediated State |
| :--- | :--- | :--- |
| **Capability Identity** | Relied on `data-capability-id` attribute | Derived strictly from DOM semantics; decoupled `BindingHandle` |
| **Persistence** | In-memory Maps | `chrome.storage.local` with schema migrations and restart survival |
| **Invariant Closure** | Hardcoded strings, missing `INSUFFICIENT_EVIDENCE` | 10-point evaluation; strictly authoritative fingerprint predicates |
| **Typed Drift** | Cross-class comparisons, arbitrary constants | True normalized distances comparing equivalent evidence |
| **Causal Verifier** | Trusted caller `isCausallyCorrelated` | Derived causality, pre-existing state rejection, multi-class quorum |
| **Route Quarantine** | Directly promotable without evidence | Strict `TransitionVerificationToken` requirement |
| **Activation & Witnesses** | In-memory simulated events | Real browser content-script message dispatch and mutation capture |
| **Safety Properties** | 10 properties verified | 15 formal properties verified (Properties 1–15) |
| **Benchmark Dataset** | 60 intents | $\ge 100$ intents across 10 categories with raw metric computation |

This audit serves as the baseline record for the remediation pass.

