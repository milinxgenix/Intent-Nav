# IntentNav-SCFR: Invention Implementation Guide

This document details the concrete implementation of the core inventive mechanisms comprising **IntentNav-SCFR**.

---

## 1. Persistent Functional Capability Identity

Conventional browser automation binds navigation targets to DOM paths (`#settings > div.btn-row > button`), CSS selectors, or XPath expressions. When an application updates, these bindings break.

In IntentNav-SCFR, capability identity is defined as an invariant functional contract:

$$\text{Capability} = \langle \text{CapabilityId}, \text{CanonicalFunction}, \text{ActionType}, \text{TargetEntity}, \mathcal{P}_{\text{pre}}, \Delta_{\text{allowed}}, \mathcal{P}_{\text{post}}, \mathcal{P}_{\text{context}}, \mathcal{S}_{\text{transition}}, \mathcal{R}_{\text{risk}} \rangle$$

Where:
- **`ActionType`**: The canonical action verb (`MODIFY_PREFERENCE`, `EXPORT_DATA`, `REVOKE_ACCESS`, `DEACTIVATE_ACCOUNT`, `NAVIGATE`).
- **`TargetEntity`**: The functional domain entity (`MARKETING_NOTIFICATIONS`, `PERSONAL_DATA_EXPORT`, `TWO_FACTOR_AUTH`, `ACCOUNT_STATUS`, `PRIVACY_SETTINGS`).
- **$\mathcal{P}_{\text{pre}}$**: Mandatory preconditions that must hold before interaction.
- **$\Delta_{\text{allowed}}$**: Permissible state transitions.
- **$\mathcal{P}_{\text{post}}$**: Mandatory post-interaction state invariant.
- **$\mathcal{R}_{\text{risk}}$**: Operational risk classification (`LOW`, `MEDIUM`, `HIGH`).

---

## 2. Capability Nodes $\neq$ Interface-State Nodes

In the graph engine ([`src/core/graph/capabilityGraph.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/capabilityGraph.ts)):
- **Capability Nodes**: Represent persistent business functions that persist across web application updates.
- **Interface-State Nodes**: Represent specific UI interaction states (pages, panels, dialogs, tabs, modals).
- **Edges**: Represent transitions, navigations, or exposures.
- **Route Versions**: Each capability contains versioned paths ($V_1, V_2, \dots, V_n$) linking the interface states required to reach and invoke the capability.

---

## 3. Typed Drift Localization

Rather than a single binary "page changed" flag, the system computes a five-dimensional vector:

$$\vec{D} = \begin{bmatrix} D_{\text{presentation}} \\ D_{\text{context}} \\ D_{\text{structure}} \\ D_{\text{capability}} \\ D_{\text{transition}} \end{bmatrix} \in [0, 1]^5$$

- **$D_{\text{presentation}}$**: Measures changes in volatile IDs, utility classes, and styling tokens.
- **$D_{\text{context}}$**: Measures changes in surrounding labels, headings, and container landmarks.
- **$D_{\text{structure}}$**: Measures changes in relative tree depth and sibling order.
- **$D_{\text{capability}}$**: Measures shifts in role, action type, or target entity.
- **$D_{\text{transition}}$**: Measures changes in pre-state or post-state delta expectations.

### Action Decision Logic:
1. $D_{\text{presentation}} > 0$ with all others low $\to$ **`MAINTAIN_ACTIVE`**: The route is fully preserved; no re-binding is triggered.
2. $D_{\text{context}} \ge 0.40$ or $D_{\text{structure}} \ge 0.45$ $\to$ **`TRIGGER_VALIDATION`**: Requires verification before execution.
3. $D_{\text{capability}} \ge 0.20$ or $D_{\text{transition}} \ge 0.25$ $\to$ **`TRIGGER_REBIND_RECOVERY`**: Triggers candidate discovery and invariant closure.

---

## 4. The Critical Ordering Constraint

Semantic similarity is strictly subordinate to functional invariants. Candidate re-binding follows this immutable pipeline:

```
[Observe Interface]
        ↓
[Localize Drift Vector]
        ↓
[Generate Candidates Pool]
        ↓
[Mandatory Invariant Closure]  <--- HARD GATE (Positive & Negative Predicates)
        ↓
[Contradiction Filter]         <--- PURGE (Adversarial Decoys & Incompatible Actions)
        ↓
[Post-Gate Candidate Ranking]  <--- ONLY Invariant-Passing Candidates Scored
        ↓
[Provisional Route Quarantine] <--- Newly Recovered Routes Held in Quarantine
        ↓
[Causal Transition Verification]
```

Under no circumstance can a candidate that failed invariant closure enter the ranking engine.

---

## 5. Causal Transition Verification

Traditional browser automation relies on unverified execution (`click()` followed by a sleep timer). IntentNav-SCFR implements an explicit causal witness protocol:

$$\text{TransitionSignature} = \langle \text{PreState}, \text{ActivationEvent}, \text{ExpectedStateDelta}, \text{WindowMs}, \text{PostState} \rangle$$

Verification requires:
1. **Strict Temporal Causality**: $t_{\text{witness}} > t_{\text{activation}}$. Pre-existing state changes are rejected (`FAILED_PRE_EXISTING_STATE`).
2. **Bounded Interval**: $t_{\text{witness}} - t_{\text{activation}} \le \text{WindowMs}$.
3. **Delta Matching**: Observed mutation properties must satisfy `expectedStateDelta`.
4. **Multi-Class Quorum**: At least 2 independent witness classes must corroborate the transition (`DOM_MUTATION`, `ACCESSIBILITY_STATE_MUTATION`, `HISTORY_STATE_MUTATION`, `CLIENT_ROUTE_MUTATION`, `APPLICATION_STATE_MUTATION`, `ASYNC_ACKNOWLEDGEMENT`).

---

## 6. Route Quarantine, Promotion, and Rollback

1. **Quarantine**: Recovered routes start in the `PROVISIONAL` state.
2. **Promotion**: Transition from `PROVISIONAL` $\to$ `ACTIVE_VALIDATED` occurs strictly upon successful causal verification.
3. **Quarantine Retention**: Failed routes are moved to `QUARANTINED` and committed to `NegativeEvidenceStore`.
4. **Demotion & Rollback**: If an active route subsequently fails at runtime, it is demoted to `DEMOTED`, and the system automatically rolls back to the prior validated version (e.g. $V_1$).

---

## 7. Independent Execution Authorization & Risk Gating

The system strictly enforces:
$$\text{CapabilityConfidence} \neq \text{ExecutionAuthorization}$$

- **High-Risk Actions** (`SECURITY_SENSITIVE`, `DESTRUCTIVE`, `FINANCIAL`):
  Even if capability confidence is $1.0$, execution is **DENIED / CONFIRMATION_REQUIRED** unless:
  1. Multi-source evidence quorum is satisfied (semantic + functional + transition evidence).
  2. Explicit, manual user confirmation is granted.
- **Medium-Risk Actions** (`REVERSIBLE`, `SENSITIVE`):
  Authorized automatically if capability confidence $\ge 0.80$ and route confidence $\ge 0.50$.
- **Low-Risk Actions** (`READ_ONLY`):
  Authorized automatically for direct navigation.

