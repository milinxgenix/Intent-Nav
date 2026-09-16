# Invariant Closure Engine Specification

## 1. Concept and Purpose

The **Invariant Closure Engine** functions as the primary security and correctness gate in IntentNav-SCFR. In standard AI web automation or selector-matching tools, candidates are evaluated purely on semantic similarity or embedding distances. This leads to catastrophic false positives when presented with **adversarial decoys**—controls whose visible text is semantically close to the user's objective, but whose underlying functional target, action, or state delta is incompatible or destructive.

The Invariant Closure Engine guarantees that:
1. No candidate can be considered for ranking unless it satisfies all positive functional invariants.
2. Any candidate triggering a negative predicate or contradiction is immediately tagged `CONTRADICTED` and purged.
3. The ranking engine receives strictly the subset of eligible, invariant-validated candidates.

---

## 2. Positive and Negative Predicates

### Positive Predicates

1. **`POS_PRED_TARGET_ENTITY` (Target Entity Match)**:
   - Ensures that the observed candidate targets the exact entity intended by the capability.
   - *Example:* If target is `MARKETING_NOTIFICATIONS`, a candidate targeting `ALL_NOTIFICATIONS` fails.

2. **`POS_PRED_ACTION_TYPE` (Action Type Compatibility)**:
   - Verifies functional compatibility between the requested action and observed control action.
   - *Compatibility rules:* `MODIFY_PREFERENCE` is compatible with `TOGGLE`. `DELETE` is never compatible with `VIEW` or `MODIFY_PREFERENCE`.

3. **`POS_PRED_PRE_STATE` (Pre-State Verification)**:
   - Evaluates whether the control is interactive and in the expected initial state (e.g. toggle is currently enabled before disabling).

### Negative Predicates (Contradictions)

1. **`NEG_PRED_FORBIDDEN_TARGET` (Forbidden Target Rejection)**:
   - Rejects candidates targeting forbidden global or destructive scopes (e.g. `SYSTEM_ROOT`, `GLOBAL_SETTINGS`, `ALL_NOTIFICATIONS`).

2. **`NEG_PRED_FORBIDDEN_ACTION` (Forbidden Action Rejection)**:
   - Detects destructive actions (`DELETE`, `ERASE`, `PURGE`, `DEACTIVATE_ACCOUNT`) when the capability is non-destructive (`REVERSIBLE`, `READ_ONLY`).

---

## 3. Evaluation Lifecycle & Traceability

When evaluating candidate $C$ against capability $K$:

1. $C$ is checked against `NegativeEvidenceStore`. If recognized as a known contradiction $\to$ status is `CONTRADICTED`, `isEligibleForRanking = false`.
2. Positive predicates are evaluated.
3. Negative predicates are evaluated.
4. If any negative predicate triggers $\to$ `status = 'CONTRADICTED'`, committed to negative evidence.
5. If any positive predicate fails $\to$ `status = 'FAIL'`.
6. Only if all positive predicates pass and zero negative predicates trigger $\to$ `status = 'PASS'`, `isEligibleForRanking = true`.
