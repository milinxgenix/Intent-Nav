# Typed Drift Localization Specification

## 1. Multi-Dimensional Drift Formulation

Web applications exhibit different categories of interface change that require fundamentally different recovery strategies. IntentNav-SCFR defines a structured 5-dimensional drift vector:

$$\vec{D} = \begin{bmatrix} D_{\text{presentation}} \\ D_{\text{context}} \\ D_{\text{structure}} \\ D_{\text{capability}} \\ D_{\text{transition}} \end{bmatrix}$$

### Mathematical Formulation of Dimensions

1. **Presentation Drift ($D_{\text{presentation}}$)**:
   $$D_{\text{presentation}} = J(S_{\text{classes}}, O_{\text{classes}})$$
   Where $J$ is the Jaccard distance over class names and ID tokens. Measures styling, framework ID hashes, and visual changes.

2. **Contextual Drift ($D_{\text{context}}$)**:
   $$D_{\text{context}} = 0.6 \cdot J(S_{\text{ancestors}}, O_{\text{ancestors}}) + 0.4 \cdot J(S_{\text{nearby}}, O_{\text{nearby}})$$
   Measures shifts in surrounding landmarks, section headings, and adjacent labels.

3. **Structural Drift ($D_{\text{structure}}$)**:
   Measures distance in relative hierarchy paths between stored and observed elements.

4. **Capability Drift ($D_{\text{capability}}$)**:
   $$D_{\text{capability}} = w_{\text{target}} \cdot \mathbb{I}(T_S \neq T_O) + w_{\text{action}} \cdot \mathbb{I}(A_S \neq A_O) + w_{\text{role}} \cdot \mathbb{I}(R_S \neq R_O)$$
   Directly captures functional changes in role, target entity, or action type.

5. **Transition Drift ($D_{\text{transition}}$)**:
   Measures deviations in observed pre-state or post-state delta expectations.

---

## 2. Threshold Calibration and Decision Logic

Default calibrated thresholds ([`src/core/drift/classifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/drift/classifier.ts)):

| Threshold Parameter | Value | Action Triggered | Rationale |
| :--- | :---: | :--- | :--- |
| `presentationRecoveryThreshold` | 0.90 | None (`MAINTAIN_ACTIVE`) | Presentation shifts alone do not invalidate capability bindings. |
| `contextValidationThreshold` | 0.40 | `TRIGGER_VALIDATION` | Relocated containers require verification before execution. |
| `structureValidationThreshold` | 0.45 | `TRIGGER_VALIDATION` | Altered DOM hierarchy requires re-validation. |
| `capabilityRebindThreshold` | 0.20 | `TRIGGER_REBIND_RECOVERY` | Functional mismatch mandates immediate candidate re-binding. |
| `transitionRebindThreshold` | 0.25 | `TRIGGER_REBIND_RECOVERY` | Pre/post state change mandates candidate re-binding. |

---

## 3. Explanatory Trace Generation

Every drift classification produces an auditable explanation, identifying:
- The dominant drift dimension
- Specific trigger factors exceeding calibrated thresholds
- The exact action required (`MAINTAIN_ACTIVE`, `TRIGGER_VALIDATION`, `TRIGGER_REBIND_RECOVERY`, `QUARANTINE_IMMEDIATELY`)

