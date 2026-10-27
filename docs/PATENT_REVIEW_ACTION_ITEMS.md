# IntentNav-SCFR: Patent Counsel Review Action Items

**Document Version:** 1.0 (Final Release Baseline)
**Date:** September 26, 2026
**Auditor / Author:** Principal Software Architect & Verification Lead
**Audience:** Patent Attorneys, Patent Agents, Technical Reviewers, and Inventors
**Governing Standard:** `v6.docx` (Controlling Priority) + `patent.docx` (Secondary Priority) + `Merged_Final_v3.docx` (Tertiary Priority)
**Baseline Git Tag:** `intentnav-evidence-baseline-v1.0` (Commit: `3392b2a`)

---

## 1. Executive Summary & Legal Boundary Notice

> [!IMPORTANT]
> **Engineering Scope & Legal Boundary Disclaimer:**
> This action list is an engineering document consistency and claim traceability briefing. It does **not** constitute legal advice, patent prosecution counsel, or a formal legal opinion on patentability, novelty, non-obviousness, freedom to operate, or claim validity.
>
> The items below identify specific textual discrepancies, editorial omissions, structural misalignments, and claim scope variations discovered across the three authoritative patent documents (`v6.docx`, `patent.docx`, `Merged_Final_v3.docx`). They are organized into three prioritized action tiers to facilitate efficient review by patent counsel prior to formal filing with patent examination authorities.

---

## 2. Priority Tier 1: MUST REVIEW BEFORE FILING

The following items represent formal typographical omissions, incomplete claim dependencies, or structural misalignments that could create formal §112 indefiniteness rejections or procedural objections during patent examination.

### Action Item 1.1: Fix Claim 19 Wording Truncation (Discrepancy PD-01)
- **Document & Location:** `v6.docx` Paragraph 203 (Claim 19)
- **Observed Defect:**
  ```text
  "19. A computing system comprising one or more processors, a browser-resident interface observer, a capability-state graph store, a drift-localization engine, an invariant-closure engine, a transition-verification controller, and an execution-authorization engine, configured to perform the method of claim "
  ```
- **Analysis:** Sentence terminates abruptly after the word `"claim "` without referencing the intended method claim number (intended as `"1."`).
- **Counsel Action Required:** Append `"1."` so that the claim ends with `"configured to perform the method of claim 1."`, identical to `patent.docx` Paragraph 203 and `Merged_Final_v3.docx` Paragraph 214.

---

### Action Item 1.2: Reconcile Section 9.3 Heading & Dependent Claim Numbering (Discrepancy PD-02)
- **Document & Location:** `v6.docx` Paragraph 184 & Paragraph 198
- **Observed Defect:**
  - Heading at Paragraph 184 reads: `9.3 Dependent Claims 2–17`
  - Claims actually present under Section 9.3: Claims 2 through 14.
  - Subsequent Heading at Paragraph 198 reads: `9.4 Parallel statutory claim categories`
  - Claims placed under Section 9.4: Dependent method Claims 15–18 alongside statutory independent system Claim 19 and medium Claim 20.
- **Analysis:** Internal document contradiction. Dependent method claims (Claims 15–18) are misfiled under "Parallel statutory claim categories".
- **Counsel Action Required:** Select one of two organizational remedies:
  - **Option A (Recommended):** Title Section 9.3 as `Dependent Claims 2–18` and place Claims 2–18 under it, reserving Section 9.4 strictly for `Parallel Statutory Claim Categories (Claims 19–20)`.
  - **Option B:** Adopt the structure of `patent.docx`: `9.3 Dependent Claims 2–14` and `9.4 Parallel statutory claim categories (Claims 15–20)`.

---

### Action Item 1.3: Restore Leading Claim Numeral Prefix in Claim 1 (Discrepancy PD-03)
- **Document & Location:** `v6.docx` Paragraph 183 (Claim 1)
- **Observed Defect:** The claim opens with `"A computer-implemented method for adaptive navigation..."` without the numerical prefix `"1. "`.
- **Analysis:** Typographical omission of the standard claim numeral.
- **Counsel Action Required:** Insert `"1. "` at the very beginning of Paragraph 183.

---

### Action Item 1.4: Confirm 20-Claim Portfolio Baseline Supersedes 17-Claim Disclosure (Discrepancy PD-11)
- **Document & Location:** `v6.docx` / `patent.docx` vs `Merged_Final_v3.docx`
- **Observed Difference:** `v6.docx` and `patent.docx` contain 20 claims, adding explicit claims for validation record sequencing (Claim 15), negative evidence signatures (Claim 16), and route lifecycle state machines (Claim 17). `Merged_Final_v3.docx` contains only 17 claims.
- **Analysis:** The 20-claim set represents the expanded, strengthened baseline.
- **Counsel Action Required:** Confirm that the formal application papers file the complete 20-claim set of `v6.docx` rather than the earlier 17-claim set of `Merged_Final_v3.docx`.

---

### Action Item 1.5: Review Route State Machine Transition Scope in Claim 17 (Discrepancy PD-08)
- **Document & Location:** `v6.docx` Paragraph 201 vs `patent.docx` Paragraph 201
- **Observed Difference:**
  - `v6.docx`: Recites broad state machine where transitions between provisional, validated, demoted, and quarantined are caused by invariant/witness results rather than confidence score alone.
  - `patent.docx`: Recites explicit operational transitions: provisional is promoted only after invariant and causal verification; validated is demoted upon failure; failed candidate is quarantined.
- **Counsel Action Required:** Decide whether the explicit transition rules of `patent.docx` Claim 17 should be adopted in the formal filing to provide clear statutory structure and prevent §112 indefiniteness rejections, or whether broad language is preferred for initial filing.

---

## 3. Priority Tier 2: SHOULD REVIEW (Scope & Boundary Hardening)

These items concern strategic claim scope decisions, negative limitations, and prosecution fallback positions between `v6.docx` and `patent.docx`.

| Item ID | Topic & Claim | Text Comparison & Nature | Strategic Prosecution Consideration | Counsel Recommendation |
| :---: | :--- | :--- | :--- | :--- |
| **PD-04** | **Claim 5 Similarity Limits** | `v6.docx`: semantic similarity cannot compensate for failed functional predicate.<br>`patent.docx`: adds contextual similarity, learned ranking values, and cannot authorize promotion. | Explicitly disclaiming machine-learning ranking scores from overriding invariants overcomes prior art relying on heuristic AI navigation. | **Adopt `patent.docx` phrasing** to establish ironclad non-equivalence over heuristic ML systems. |
| **PD-05** | **Claim 7 Witness Quorum** | `v6.docx`: correlated within verification interval before promotion.<br>`patent.docx`: bounded interval measured from activation event; quorum applies when $\ge 2$ classes available. | The conditional phrase `"when at least two such witness classes are available"` provides commercial fallback flexibility on simple web interfaces. | **Evaluate commercial necessity** of conditional fallback vs strict unconditional quorum. |
| **PD-06** | **Claim 9 Quarantine Terminology** | `v6.docx`: transition acceptance condition; negative evidence.<br>`patent.docx`: *causal* transition-verification acceptance; *quarantined* negative evidence. | Using "causal" and "quarantined" directly connects Claim 9 to the technical definitions in Section 7.14. | **Adopt `patent.docx` phrasing** for enhanced claim definiteness. |
| **PD-07** | **Claim 16 Negative Signatures** | `v6.docx`: identifying at least *a* failed invariant or contradiction predicate.<br>`patent.docx`: identifying at least *the specific* failed invariant, persisting until material interface evidence changes. | "The specific failed invariant" is more definite; temporal boundary clarifies how quarantine is exited. | **Adopt `patent.docx` phrasing** for precise antecedent basis and lifecycle clarity. |
| **PD-09** | **Claim 18 Confidence Limits** | `v6.docx`: confidence value cannot authorize high-risk operation.<br>`patent.docx`: cannot establish functional equivalence, promote unverified route, or authorize high-risk operation. | Adds three explicit negative boundaries against algorithmic overreach. | **Adopt `patent.docx` expanded boundaries** to defeat obviousness rejections. |
| **PD-10** | **Section 7 Numbering** | `v6.docx`: clean sequential 7.10–7.16.<br>`patent.docx`: skips 7.11.<br>`Merged_Final_v3`: misplaces 7.11. | Numbering defect in draft documents. | **Retain sequential numbering of `v6.docx`**. |
| **PD-12** | **Application Title** | `v6.docx`: *A Self-Adaptive Functional Capability Identity...*<br>`patent.docx`: *System and Method for Capability-Preserving Adaptive Navigation...* | Formal administrative title selection. | **Counsel selection** based on portfolio filing conventions. |
| **PD-13** | **Priority Dates** | `v6.docx` internal date: 17/09/2026.<br>`patent.docx` internal date: 11/09/2026. | Versioning timeline indicator. | **Note `v6.docx` as latest controlling text**. |

---

## 4. Priority Tier 3: ENGINEERING INFORMATION ONLY

The following technical facts provide essential background context for patent counsel when drafting application remarks, declarations, or office action responses:

1. **Evidentiary Boundary Scope:**
   - Real-browser empirical evidence was generated in **Google Chrome 153.0.8010.53** via Chrome DevTools Protocol (CDP) across Mock Sites A, B, C, and D.
   - It rigorously validates the causal mechanisms under Scenarios A–K and N1–N14.
   - Counsel must clearly scope remarks to the demonstrated environments and avoid asserting universal applicability across arbitrary, uninspected web applications.

2. **Zero Synthetic Shortcuts:**
   - All browser interactions were driven through real CDP input dispatch (`Input.dispatchMouseEvent`, `Input.dispatchKeyEvent`).
   - Zero synthetic shortcuts, zero hardcoded DOM element IDs, zero mock bypasses, and zero fabricated timestamps were utilized.
   - All empirical JSON artifacts are accompanied by standalone deterministic validator scripts (`scripts/validate*.js`) that execute independently with exit code 0.

3. **Multi-Class Witness Verification (Claim 8):**
   - Live browser execution demonstrated all six claimed witness classes:
     - `DOM_MUTATION` (7 live observations)
     - `ACCESSIBILITY_STATE_MUTATION` (2 live observations)
     - `HISTORY_STATE_MUTATION` (2 live observations)
     - `CLIENT_ROUTE_MUTATION` (2 live observations)
     - `APPLICATION_STATE_MUTATION` (6 live observations)
     - `ASYNC_ACKNOWLEDGEMENT` (2 live observations)
   - Every demonstrated transition satisfied the causal quorum requirement ($\ge 2$ independent witness classes).

4. **Zero-Egress Privacy Verification (Claim 11):**
   - Verified via live CDP `Network.requestWillBeSent` interception during execution of Scenarios A–J.
   - Result: 20 total HTTP requests, all directed to `http://localhost:3000`.
   - Exactly 0 external telemetry requests, 0 external AI/LLM inference requests, and 0 remote cloud route store requests.

5. **Route Demotion & Rollback Demonstration (Claim 10):**
   - Live Scenario K demonstrated: v1 promotion $\to$ v2 promotion $\to$ injected failure in v2 $\to$ automatic demotion of v2 $\to$ rollback to v1 $\to$ successful re-execution under v1.

6. **Codebase & Security Baseline:**
   - TypeScript compilation: 0 errors (`npm run typecheck`).
   - Production Vite bundle: 0 errors (`npm run build`).
   - Automated test suite: 25 files, 271/271 tests passing (`npm test`).
   - Security audit: 0 vulnerabilities under Vite 6.4.3 and Vitest 4.1.11 on Node 20.17.0 (`npm audit`).
