# IntentNav-SCFR: Patent Counsel Action Checklist & Pre-Filing Review Guide
**Document Identifier:** `INTENTNAV-SUBMISSION-CAC-2026-V1`
**Reviewer / Architect / Sole Implementer:** MILIND
**Date:** October 26, 2026
**Status:** Working Patent Review Deliverable (Prioritized Action Guide for Patent Counsel & Filing Agents)
**Controlling Documents:** `v6.docx` (Controlling Priority 1) $\to$ `patent.docx` (Secondary Priority 2) $\to$ `Merged_Final_v3.docx` (Tertiary Priority 3)

---

## 1. Executive Summary & Review Scope

This checklist organizes all identified textual discrepancies, claim numbering variations, statutory eligibility safeguards, and drafting recommendations into three prioritized tiers. It provides exact before/after text comparisons to enable patent counsel to rapidly finalize the application papers for formal filing with the Indian Patent Office (IPO), the USPTO, or under the Patent Cooperation Treaty (PCT).

---

## 2. Priority Tier 1: MUST FIX BEFORE FILING (Procedural & Structural Defects)

These items represent grammatical truncations, numbering misalignments, or formal defects that could trigger immediate formal objections or indefiniteness rejections under 35 U.S.C. § 112 / Indian Patents Act § 10(4).

---

### Action Item 1.1: Complete Claim 19 Sentence Truncation (Discrepancy PD-01)
- **Document & Paragraph:** `v6.docx` Paragraph 203 (Claim 19).
- **Nature of Defect:** The claim terminates abruptly after the word `"claim "` without citing the intended method claim numeral.
- **Current Defective Text in `v6.docx`:**
  ```text
  "19. A computing system comprising one or more processors, a browser-resident interface observer, a capability-state graph store, a drift-localization engine, an invariant-closure engine, a transition-verification controller, and an execution-authorization engine, configured to perform the method of claim "
  ```
- **Recommended Counsel Fix:**
  Append `"1."` to the end of the paragraph, matching `patent.docx` Paragraph 203 and `Merged_Final_v3.docx` Paragraph 214:
  ```text
  "...configured to perform the method of claim 1."
  ```
- **Status in Working Draft:** Fixed in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md#L97) Claim 19.

---

### Action Item 1.2: Reconcile Section 9.3 Heading & Dependent Claim Numbering (Discrepancy PD-02)
- **Document & Paragraph:** `v6.docx` Paragraph 184 & Paragraph 198.
- **Nature of Defect:** Heading at Paragraph 184 reads `9.3 Dependent Claims 2–17`, but only contains Claims 2–14. Subsequent heading at Paragraph 198 reads `9.4 Parallel statutory claim categories`, but places dependent method Claims 15–18 under it alongside independent Claims 19–20.
- **Recommended Counsel Fix (Option A - Recommended):**
  - Retitle Section 9.3 as: `9.3 Dependent Claims (Claims 2–18)` and encompass all dependent method claims under it.
  - Retitle Section 9.4 as: `9.4 Parallel Statutory Claim Categories (Claims 19–20)` containing only independent System Claim 19 and Medium Claim 20.
- **Status in Working Draft:** Fully reconciled in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md#L55) Sections 9.3 and 9.4.

---

### Action Item 1.3: Prepend Leading Numeral Prefix to Claim 1 (Discrepancy PD-03)
- **Document & Paragraph:** `v6.docx` Paragraph 183 (Claim 1).
- **Nature of Defect:** The claim opens directly with `"A computer-implemented method..."` without the numerical prefix `"1. "`.
- **Recommended Counsel Fix:**
  Insert `"1. "` at the very beginning of Paragraph 183.
- **Status in Working Draft:** Fixed in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md#L17) Claim 1.

---

### Action Item 1.4: Confirm 20-Claim Portfolio Baseline (Discrepancy PD-11)
- **Documents Compared:** `v6.docx` (20 claims) vs. `Merged_Final_v3.docx` (17 claims).
- **Nature of Difference:** `v6.docx` and `patent.docx` contain 20 claims, adding explicit claims for validation record sequencing (Claim 15), negative evidence signatures (Claim 16), and route state machine rules (Claim 17). `Merged_Final_v3.docx` contains only 17 claims.
- **Recommended Counsel Action:**
  Confirm that formal filing application papers use the complete 20-claim portfolio from `v6.docx` and `CLAIMS.md`.
- **Status in Working Draft:** All 20 claims drafted and mapped in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md) and [`CLAIM_EVIDENCE_MAP.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIM_EVIDENCE_MAP.md).

---

### Action Item 1.5: Adopt Explicit Route Lifecycle Transition Rules in Claim 17 (Discrepancy PD-08)
- **Documents Compared:** `v6.docx` Paragraph 201 vs. `patent.docx` Paragraph 201.
- **Nature of Difference:** `v6.docx` recites broad state machine transitions based on invariants/witnesses without enumerating operational causes. `patent.docx` recites explicit operational rules:
  - `PROVISIONAL` promoted to `VALIDATED` only after invariant and causal verification;
  - `VALIDATED` demoted upon subsequent verification or invariant failure;
  - Failed or contradictory candidate quarantined;
  - Transitions caused by invariant/witness results rather than confidence score alone.
- **Recommended Counsel Fix:**
  Adopt the explicit operational transition rules of `patent.docx` Paragraph 201 to eliminate indefiniteness risks under 35 U.S.C. § 112 / Indian Patent Act § 10(4).
- **Status in Working Draft:** Incorporated in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md#L88-L90) Claim 17.

---

## 3. Priority Tier 2: SHOULD REVIEW (Strategic Scope & Statutory Defenses)

These items concern strategic claim scope, eligibility safeguards under Indian Patent Law § 3(k), and clarity of novel technical terminology.

---

### Action Item 2.1: Independent Claim 1 Strategic Scope (Fidelity Verification)
- **Review Finding:**
  Independent Claim 1 in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md) has been audited and restored to the authentic verbatim 14-clause sequence (a)–(n) of `v6.docx` Paragraph 183 / `patent.docx` Paragraph 183.
- **Counsel Recommendation:**
  Retain this broad statutory claim language. Avoid embedding software-specific implementation mechanisms (such as HMAC-SHA256 tokens) directly into Claim 1, as that would unnecessarily narrow literal infringement scope and allow competitors to design around the claim. Retain cryptographic token mechanisms in the detailed description and in dependent claims.

---

### Action Item 2.2: Safeguard Eligibility under Indian Patent Act Section 3(k)
- **Vulnerable Claims:** Independent Claims 1, 19, 20.
- **Counsel Recommendation:**
  Ensure the independent method claim explicitly maintains the browser-resident processing subsystem, multi-source interface evidence, and state machine transitions. In prosecution arguments before the IPO, rely on Delhi High Court precedents (*Ferid Allani* and *Microsoft Technology Licensing*) emphasizing that the invention provides a technical solution to the problem of silent automation failure and unauthorized transaction execution.

---

### Action Item 2.3: Adopt Hardened Negative Limitations in Claim 5 (Discrepancy PD-04)
- **Documents Compared:** `v6.docx` vs. `patent.docx` Paragraph 188.
- **Counsel Recommendation:**
  Adopt the negative limitation from `patent.docx` Claim 5 stating that:
  *"semantic similarity, contextual similarity, or a learned ranking value cannot compensate for failure of a mandatory functional predicate and cannot by itself authorize route promotion."*
  This provides a vital fallback position against prior-art obviousness rejections based on US 11,971,936 B2 and US 12,625,918 B2.
- **Status in Working Draft:** Adopted in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md#L64-L65) Claim 5.

---

## 4. Priority Tier 3: NICE TO HAVE / POST-FILING (Enablement & Telemetry)

1. **Disclose Default Hyperparameters:**
   Preserve the empirical default hyperparameters ($\alpha=0.50, \beta=0.30, \gamma=0.20$, observation timeout $\tau=250\text{ ms}$, lease window $T_{\text{lease}}=5000\text{ ms}$) in the specification as preferred non-limiting embodiments to provide full statutory enablement under 35 U.S.C. § 112(a).
2. **Characterize JSDOM Simulation vs. Live Reflow:**
   Maintain the clear boundary disclosure in the specification distinguishing JSDOM algorithmic verification from live Chromium Blink rendering reflow timings.
3. **PCT National Phase Readiness:**
   The claims and specification in `docs/submission-draft/` are drafted to comply with both USPTO format (two-part method/system claims) and Indian Patent Office requirements (preamble + characterising clause compatibility).

---

## 5. Pre-Filing Sign-Off Matrix

| Review Step | Responsible Party | Status | Verification Reference |
| :--- | :---: | :---: | :--- |
| **Engineering Verification** | MILIND (Sole Architect) | **COMPLETE** | 378/378 unit tests passing; clean typecheck |
| **Source Fidelity Audit** | MILIND (Sole Architect) | **COMPLETE** | 20/20 claims audited against `v6.docx` & `patent.docx` |
| **Typographical Defect Fixes** | Patent Drafting Counsel | **READY FOR COUNSEL** | Action Items 1.1, 1.2, 1.3 in `CLAIMS.md` |
| **Claim Scope Review** | Patent Drafting Counsel | **READY FOR COUNSEL** | Action Items 1.4, 1.5, 2.1, 2.3 in `CLAIMS.md` |
| **Formal Application Filing** | Registered Patent Agent | **PENDING** | IPO / USPTO / PCT Submission |

---
*Signed and Authenticated:*
**MILIND**
Sole Architect & Implementer, IntentNav-SCFR
