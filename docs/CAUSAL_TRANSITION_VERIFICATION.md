# Causal Transition Verification Specification

## 1. The Causal Witness Protocol

Unverified execution in automated web navigation leads to silent failures, false promotions, and state corruption. IntentNav-SCFR defines a formal transition witness protocol:

$$\text{TransitionSignature} = \langle \text{PreState}, \text{ActivationEvent}, \text{ExpectedStateDelta}, \text{WindowMs}, \text{PostState} \rangle$$

---

## 2. Independent Witness Classes

To eliminate correlation errors caused by single-channel artifacts (e.g. random DOM noise, analytics scripts), verification requires evidence from at least **two independent witness classes**:

1. **`DOM_MUTATION`**: Subtree addition/removal or attribute changes in the main content container.
2. **`ACCESSIBILITY_STATE_MUTATION`**: Changes in `aria-expanded`, `aria-checked`, `aria-selected`, or element `disabled` state.
3. **`HISTORY_STATE_MUTATION`**: `popstate` or `pushState` navigation changes.
4. **`CLIENT_ROUTE_MUTATION`**: Client-side hash or framework route updates.
5. **`APPLICATION_STATE_MUTATION`**: Client application state or storage mutations.
6. **`ASYNC_ACKNOWLEDGEMENT`**: Background network transaction responses or API confirmations.

---

## 3. Strict Causality Rules

1. **Temporal Precedence**:
   $$t_{\text{activation}} < t_{\text{witness}} \le t_{\text{activation}} + \text{WindowMs}$$
   If a state change exists at $t \le t_{\text{activation}}$, it is rejected as `FAILED_PRE_EXISTING_STATE`.

2. **Unrelated Mutation Rejection**:
   Mutations occurring without a correlated activation event ID are rejected as `FAILED_UNRELATED_MUTATION`.

3. **Delta Matching**:
   The properties in `observedDelta` across the witness set must satisfy every key-value requirement in `expectedStateDelta`. If properties mismatch, the transition is rejected as `FAILED_WRONG_STATE_DELTA`.

4. **Multi-Class Quorum**:
   If the number of unique witness classes is $< 2$ (or configured minimum), the transition is rejected as `FAILED_INSUFFICIENT_WITNESS_CLASSES`.

