# Evidence-Driven Ranking Model Specification

**Specification Version**: 2.0.0  
**Status**: Authoritative Engineering Model  
**Component**: `src/core/ranking/engine.ts`  

---

## 1. Architectural Role and Ordering Mandate

Candidate ranking in IntentNav-SCFR occurs **strictly after Invariant Closure and Contradiction Filtering**:

```
Live DOM Observation
        ↓
Candidate Discovery
        ↓
Hard Invariant Closure Gate
        ↓
Hard Contradiction & Decoy Filtering
        ↓
Only Eligible Candidates Reach Ranking Engine
        ↓
Evidence-Driven Ranking (`CandidateRankingEngine`)
        ↓
Provisional Route Creation & Authorization
        ↓
Activation Dispatch
        ↓
Witness Collection & Correlation
        ↓
Causal Transition Verification
        ↓
Validated Promotion / Quarantine
```

### Invariant Precedence
A candidate that produces `FAIL`, `CONTRADICTION`, or `INSUFFICIENT_EVIDENCE` during Invariant Closure is **purged before ranking**. High semantic similarity can **never** compensate for an invariant failure.

---

## 2. Evidence Source Mapping

The ranking engine calculates a weighted multi-factor score strictly from observed, verifiable evidence:

$$S_{\text{total}} = w_1 S_{\text{inv}} + w_2 S_{\text{sem}} + w_3 S_{\text{ctx}} + w_4 S_{\text{trans}} + w_5 S_{\text{hist}} - w_6 P_{\text{contra}} - w_7 P_{\text{stale}} - w_8 P_{\text{risk}} - w_9 P_{\text{path}}$$

| Component | Weight Parameter | Default Weight | Evidence Source | Missing Evidence Behavior |
| :--- | :---: | :---: | :--- | :--- |
| **Invariant Fit ($S_{\text{inv}}$)** | `wInvariantFit` | `0.30` | Invariant Closure outcome (`status === 'PASS'`). | `0.0` (ineligible; purged before ranking). |
| **Semantic Fit ($S_{\text{sem}}$)** | `wSemanticFit` | `0.25` | Morphological stemming, domain synonym mapping, and token overlap/containment across `candidateLabel` and target `canonicalLabel`, `semanticSynonyms`, `accessibleName`, `actionDescription`, `visibleLabel`, and live normalized `intent`. | `0.0` if candidate label is absent or disjoint. |
| **Context Fit ($S_{\text{ctx}}$)** | `wContextFit` | `0.15` | Multi-channel overlap across `containerSemantics` (0.50), `ancestorRelationships` (0.30), and `nearbyText` (0.20). | `0.0` (strictly NO POSITIVE EVIDENCE AVAILABLE). Zero synthetic fallback. |
| **Transition Feasibility ($S_{\text{trans}}$)** | `wTransitionFit` | `0.15` | Pre-activation transition feasibility: `mandatoryPreStatePredicates` compatibility (0.40), `allowedStateDelta` compatibility (0.40), interactive control status (0.20). | `0.0` if pre-state unobserved. Zero synthetic fallback. |
| **Validation History ($S_{\text{hist}}$)** | `wValidationHistory` | `0.10` | Persisted validation records in `provenance.validationHistory`: historical success ratio ($\text{successes} / \text{total}$). | `0.0` if no historical validations exist. Zero synthetic fallback. |
| **Contradiction Penalty ($P_{\text{contra}}$)** | `wContradictionPenalty`| `0.25` | Soft negative evidence in `negativeEvidence.rejectedCandidateIdentities`. Note: Hard decoys are already purged at gate. | `0.0` if no negative evidence. |
| **Staleness Penalty ($P_{\text{stale}}$)** | `wStalenessPenalty` | `0.05` | Elapsed age since `provenance.validationTimestamp` (> 24 hours scales to 1.0 at 72 hours). | `0.0` if fresh or unvalidated. |
| **Risk Penalty ($P_{\text{risk}}$)** | `wRiskPenalty` | `0.10` | Declared `targetFingerprint.riskMetadata.riskClass` (0.30 for `DESTRUCTIVE`, 0.20 for `SECURITY_SENSITIVE`). | `0.0` for reversible/read-only. |
| **Path Cost Penalty ($P_{\text{path}}$)** | `wPathCostPenalty` | `0.05` | Real DOM structural depth parsed from `candidate.domStructuralPath` segment count ($\min(1.0, (\text{depth} - 2) / 10)$). | `0.0` for shallow/direct controls. Zero unconditional penalty. |

---

## 3. Strict Semantic Distinctions

### Pre-Activation Feasibility vs Post-Activation Causal Verification
- **$S_{\text{trans}}$ in ranking represents ONLY pre-activation feasibility**:
  - Does the candidate's currently observed pre-state satisfy declared pre-conditions?
  - Does the current control state permit the allowed delta (e.g. not already disabled when an enable-to-disable transition is requested)?
  - Is the element interactive (`disabled !== true`)?
- **It is NOT causal transition verification**: It does **not** prove that the transition occurred. Causal transition verification occurs strictly post-activation and requires real event dispatch, observed mutation witnesses, multi-class quorum ($\ge 2$ classes), and temporal correlation.

### Distinction: UNKNOWN vs NEGATIVE
- A score of `0.0` resulting from missing evidence (e.g. unobserved context, no validation history, unobserved pre-state) represents:
  $$\text{Score } 0.0 \equiv \mathbf{NO\ POSITIVE\ EVIDENCE\ AVAILABLE}$$
- It does **not** represent:
  $$\text{Score } 0.0 \not\equiv \mathbf{CONTRADICTION\ OR\ FAILED\ EVIDENCE}$$
- Contradictions and failures produce hard gate rejection or explicit penalties. Missing evidence simply receives zero contribution, preventing manufactured positive scores.

---

## 4. Deterministic Execution Guarantee

Ties in candidate scoring are resolved deterministically:
1. Primary sort: descending by `totalScore`.
2. Secondary tie-breaker: ascending lexicographical order of `candidateId` (`a.candidateId.localeCompare(b.candidateId)`).
Identical evidence inputs evaluate to identical rankings across runs.
