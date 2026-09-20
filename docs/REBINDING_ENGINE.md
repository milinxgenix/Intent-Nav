# Candidate Re-Binding Engine Specification

## 1. Pipeline Overview

When drift localization determines that recovery is required (`TRIGGER_REBIND_RECOVERY`), the Candidate Re-Binding Engine coordinates the discovery, filtering, and scoring of new candidate control bindings.

The pipeline strictly enforces the **Critical Ordering Constraint**:

$$\text{Observe} \longrightarrow \text{Generate Candidates} \longrightarrow \text{Invariant Closure} \longrightarrow \text{Contradiction Filter} \longrightarrow \text{Post-Gate Ranking}$$

---

## 2. Post-Gate Rebind Scoring Formula

Only candidates that achieve `status === 'PASS'` during Invariant Closure are scored. The scoring formula combines positive evidence and penalizes negative risk factors:

$$\text{RebindScore}(C) = w_1 I(C) + w_2 S(C) + w_3 C(C) + w_4 T(C) + w_5 V(C) - w_6 K(C) - w_7 L(C) - w_8 R(C) - w_9 P(C)$$

Where:
- $I(C)$: Invariant Fit ($1.0$ for all eligible candidates)
- $S(C)$: Semantic Fit (token Jaccard similarity across canonical label and synonyms)
- $C(C)$: Context Fit (container landmark overlap)
- $T(C)$: Transition Fit (expected interaction compatibility)
- $V(C)$: Historical Validation Score
- $K(C)$: Contradiction Penalty ($0.0$ for eligible candidates)
- $L(C)$: Staleness Penalty
- $R(C)$: Risk Penalty (penalizes high-risk actions to favor safer paths)
- $P(C)$: Path Cost Penalty

### Configured Weights (Version 1.0.0):
- $w_1 = 0.30$ (Invariant Fit)
- $w_2 = 0.25$ (Semantic Fit)
- $w_3 = 0.15$ (Context Fit)
- $w_4 = 0.15$ (Transition Fit)
- $w_5 = 0.10$ (Validation History)
- $w_6 = 0.25$ (Contradiction Penalty)
- $w_7 = 0.05$ (Staleness Penalty)
- $w_8 = 0.10$ (Risk Penalty)
- $w_9 = 0.05$ (Path Cost Penalty)

---

## 3. Versioned Route Generation

Once the winning candidate is selected:
1. A new `RouteVersion` is generated with incremented version number ($V_{n+1}$).
2. The route is placed directly into **`PROVISIONAL` quarantine**.
3. It cannot be executed or set to active until causal transition verification is performed.

