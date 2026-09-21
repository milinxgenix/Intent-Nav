# Invariant Closure, Allowed-State-Delta, Expected Post-State & Active-Route Revalidation Audit

**Audit Date**: 2026-09-21  
**Status**: Verification Complete (All 24 Scenarios Verified & Passing)  
**Specification**: Prompt 3 Hard Gate & Non-Fabrication Remediation  

---

## Executive Summary

This audit evaluates and verifies invariant closure, allowed-state-delta coverage, expected post-state compatibility, and active-route revalidation across `src/core/invariant/*`, `src/core/candidate/*`, `src/core/ranking/*`, and `src/core/stateMachine/*`.

Invariant closure functions as a strict, non-bypassable hard gate before candidate ranking. No candidate may enter ranking unless all mandatory invariants, pre-states, directional transitions, and post-state compatibilities evaluate to `PASS`. If evidence is missing, evaluation returns `INSUFFICIENT_EVIDENCE` (never silent `PASS`).

---

## Part 1 — Allowed State Deltas

Every declared allowed-state-delta type in `src/types/capability.ts` has explicit, verified handling:

| Delta Type | Implementation Location | Test Location | Status |
|---|---|---|---|
| `ENABLED_TO_DISABLED` | [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L227-L245) | [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L86-L125) (Tests 1–4) | **PASS** |
| `DISABLED_TO_ENABLED` | [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L246-L264) | [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L126-L165) (Tests 5–8) | **PASS** |
| `MODIFIED` | [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L265-L270) | [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L166-L185) (Tests 9–10) | **PASS** |
| `ADDED` | [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L271-L281) | [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L186-L205) (Tests 11–12) | **PASS** |
| `REMOVED` | [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L282-L292) | [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L206-L225) (Tests 13–14) | **PASS** |

### Verified Behaviors:
1. `ENABLED_TO_DISABLED`:
   - Valid pre-state (enabled/checked) -> PASS
   - Pre-state already false/disabled -> FAIL
   - Control already unchecked -> FAIL
   - Read-only action (`VIEW`, `READ`, `INSPECT`) -> FAIL
2. `DISABLED_TO_ENABLED`:
   - Valid pre-state (disabled/unchecked) -> PASS
   - Pre-state already true/enabled -> FAIL
   - Control already checked -> FAIL
   - Read-only action (`VIEW`, `READ`, `INSPECT`) -> FAIL
3. `MODIFIED`:
   - Interactive action -> PASS
   - Read-only action -> FAIL
4. `ADDED`:
   - Non-existing property -> PASS
   - Already existing property -> FAIL
   - Read-only action -> FAIL
5. `REMOVED`:
   - Existing property -> PASS
   - Non-existing property -> FAIL
   - Read-only action -> FAIL

---

## Part 2 — Hard Invariant Gates & Precedence

Verified in [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L227-L490) (Tests 15–23):

1. **Mandatory Predicate Failure**:
   - Location: [`src/core/invariant/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/engine.ts#L80-L122)
   - Evaluates mandatory predicates against observed pre-state.
   - Result: `status === 'FAIL'`, `isEligibleForRanking === false`. Candidate is immediately rejected and excluded from ranking.
2. **Forbidden Predicate Violation**:
   - Location: [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L570-L605) & [`src/core/invariant/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/engine.ts#L250-L257)
   - Evaluates forbidden context, forbidden targets, and forbidden destructive actions.
   - Result: `status === 'CONTRADICTED'`, `isEligibleForRanking === false`. Candidate is purged and recorded in `NegativeEvidenceStore`.
3. **Required State Unknown**:
   - Location: [`src/core/invariant/engine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/engine.ts#L76-L100)
   - When mandatory pre-state evidence is unobserved, `hasInsufficientEvidence` is set to `true`.
   - Result: `status === 'INSUFFICIENT_EVIDENCE'`, `isEligibleForRanking === false`.
4. **INSUFFICIENT_EVIDENCE Eligibility**:
   - Location: [`src/core/candidate/pipeline.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/candidate/pipeline.ts#L88-L118)
   - Candidates with status `'INSUFFICIENT_EVIDENCE'` are pushed to `rejectedCandidates` and NEVER passed to `CandidateRankingEngine`.
5. **Expected Post-State Mismatch**:
   - Location: [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L365-L425)
   - Mismatch detected if pre-state already equals expected post-state, candidate label contradicts expected post-state direction, or observed action opposes post-state.
   - Result: `status === 'FAIL'`, rejected before ranking.
6. **Expected Post-State Unknown**:
   - Location: [`src/core/invariant/predicates.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/invariant/predicates.ts#L358-L370, L440-L460)
   - If expected value is undefined or candidate has no semantic connection to post-state property and unobserved state.
   - Result: `hasInsufficientEvidence: true`, `status === 'INSUFFICIENT_EVIDENCE'`. Not treated as compatible/pass.

---

## Part 3 — Active Route Revalidation

Production paths involving `ACTIVE_VALIDATED` and stored route execution:
- Primary location: [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L374-L465)
- Execution authorization check: [`src/core/authorization/controller.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/authorization/controller.ts#L72-L78)

### Key Verifications:
1. **No Invariant Bypass**:
   When an active route is retrieved, `InvariantClosureEngine.evaluateCandidate(matchedCap, activeCandidate)` is executed against live candidate features and current interface state ([`machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L428-L440)).
2. **Live Failure Halts Execution**:
   If `liveInvariantResult.status !== 'PASS'`, the machine immediately transitions to `ABSTAINED`, logs the exact rejection reason to `AuditLogger`, and aborts execution before reaching browser event dispatch ([`machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L431-L440)).
3. **No Synthetic State Default**:
   Active route candidate evaluation derives genuine pre-state and calculates real rebind score breakdowns via `CandidateRankingEngine` rather than injecting synthetic 1.0 constants ([`machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L441-L463)).
4. **Verified in Test 24**:
   [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts#L492-L550) verifies that an `ACTIVE_VALIDATED` route encountering a live interface invariant violation halts execution, performs zero browser dispatches, and records `ABSTAINED`.

---

## Verification Test Results

- Total Test Files: 23 passed (23)
- Total Tests: 235 passed (235)
- Empirical Evidence Strict Validator: 10/10 scenarios passed all 10 consistency checks (100% compliant)
- TypeScript Compilation (`tsc --noEmit`): 0 errors
- Production Build (`npm run build`): 0 errors

