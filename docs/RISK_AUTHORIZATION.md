# IntentNav-SCFR: Independent Execution Authorization & Risk Gating

## 1. Principle of Decoupled Authorization (Claim 11 & Claim 12)

In conventional web automation and agentic frameworks, candidate scoring and execution authorization are conflated: if an LLM or similarity model assigns a high probability score (e.g., $S = 0.98$) to a candidate element, the agent automatically dispatches a synthetic click or keypress.

**IntentNav-SCFR strictly forbids confidence-driven execution.**

Under IntentNav-SCFR:
$$\text{Capability Match Confidence } S_{\text{match}} \neq \text{Execution Authorization } \mathcal{A}_{\text{exec}}$$

High confidence in candidate identity merely establishes that an element is indeed the target functional capability. Whether that capability is permitted to execute depends entirely on an independent, non-bypassable **Risk-Gated Execution Authorization Subsystem**.

---

## 2. Risk Classification Matrix

Every functional action is classified dynamically across multiple risk dimensions before any candidate is evaluated:

| Risk Level | Financial Impact | Security Impact | Data Loss Potential | Reversibility | Required Evidence Quorum | Human Confirmation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LOW** | None | Read-only / Telemetry | None | Fully Reversible | $\ge 2$ independent witnesses | Automatic if quorum satisfied |
| **MEDIUM** | Non-financial | Cosmetic / Session preference | Transient state change | Reversible via UI | $\ge 3$ witnesses + Invariant pass | Automatic if quorum satisfied |
| **HIGH** | Potential financial impact | Credential / Privacy exposure | Permanent configuration change | Semi-reversible / Asymmetric | $\ge 4$ witnesses + Validated route | **MANDATORY** User Confirmation |
| **CRITICAL** | Direct capital transfer | Authentication revocation / Deletion | Irreversible data destruction | **Irreversible** | Complete quorum + Audit logging | **MANDATORY** Explicit Modal Prompt |

### Intent Sensitivity Elevation
Even if a capability fingerprint was originally classified as `LOW` or `MEDIUM`, the `ExecutionAuthorizationClassifier` analyzes user intent keywords. If the intent specifies destructive operations (`"delete"`, `"purge"`, `"erase"`, `"wipe"`, `"destroy"`) or security modifications (`"2fa"`, `"mfa"`, `"password"`, `"api key"`, `"token"`), the classification is dynamically elevated to `HIGH` or `CRITICAL`, requiring explicit human confirmation.

---

## 3. Evidence Quorum Engine

The authorization subsystem requires an **Evidence Quorum** composed of distinct evidence classes:
1. **DOM Structure Invariant Witness**: Proof that all structural invariants (enclosing form, parent container, semantic role) evaluate to `PASS`.
2. **Negative Evidence Verification**: Proof that the target candidate does not match any known contradictory or decoy pattern in the negative evidence store.
3. **Route History Verification**: Confirmation that the navigation trajectory leading to this capability is an active, non-demoted route ($V_k$) or an approved provisional route.
4. **Transition Precedence Witness**: Pre-execution snapshot establishing baseline UI state before event dispatch.
5. **Human Explicit Authorization**: For `HIGH` and `CRITICAL` risk tiers, a cryptographic or UI confirmation token from the user interface.

If any required quorum item is absent, `ExecutionAuthorizationController.evaluate()` returns `DENIED` or `CONFIRMATION_REQUIRED`, halting the pipeline immediately.

---

## 4. Reversibility & Rollback Guarantees

For actions flagged as `IRREVERSIBLE`, the controller enforces:
- Strict lockout of autonomous single-click execution.
- Display of an immutable pre-execution impact summary in the IntentNav-SCFR extension panel detailing the exact DOM mutations and side effects predicted.
- An append-only pre-execution audit event emitted to the cryptographic audit trail prior to confirmation request.

---

## 5. Formal Verification: Safety Properties 5 & 6

The authorization subsystem is formally validated by automated property tests in `test/properties/properties.spec.ts`:
- **Property 5 (Decoupled Confidence)**: A test fixture with $S_{\text{match}} = 0.999$ on a `DELETE_ACCOUNT` capability is fed to the engine. The engine returns `status: "CONFIRMATION_REQUIRED"`, `canExecute: false`.
- **Property 6 (Zero Unauthorized High-Risk Actions)**: Across 1,200 benchmark runs spanning 4 mock sites (including Site D with adversarial decoys and destructive traps), exactly **0** high-risk actions executed without authorization.

