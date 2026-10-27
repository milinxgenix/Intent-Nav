# IntentNav-SCFR: Independent Verification Report of Corrected Working Patent Draft
**Document Identifier:** `INTENTNAV-SUBMISSION-IVR-2026-V1`
**Reviewer / Auditor:** Principal Software Architect & Verification Lead (Acting for MILIND)
**Date:** October 26, 2026
**Status:** Independent Quality Assurance & Source Fidelity Report (**Audit Only — Draft Edits Held for Approval**)
**Controlling Authority Priority:**
1. `docs/patent-requirements/v6.docx` (Highest Priority / Controlling Specification — 340 paragraphs, 20 claims)
2. `docs/patent-requirements/patent.docx` (Secondary Priority / Boundary Fallback — 340 paragraphs, 20 claims)
3. `docs/patent-requirements/INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` (Tertiary Priority / Technical Disclosure — 543 paragraphs, 17 claims)

---

## 1. Executive Summary & Verification Mandate

Pursuant to MILIND's directive, an independent, rigorous source-fidelity and claim-support verification pass was conducted on the IntentNav-SCFR working patent draft in `docs/submission-draft/`.

All files under `docs/submission-draft/` (`CLAIMS.md`, `SPECIFICATION.md`, `ABSTRACT.md`, `FIGURES.md`, `CLAIM_EVIDENCE_MAP.md`, `CLAIM_SOURCE_FIDELITY_REVIEW.md`, `SPECIFICATION_SOURCE_FIDELITY_REVIEW.md`, `DRAFT_CORRECTION_LOG.md`, and `OPEN_COUNSEL_ISSUES.md`) were independently cross-checked against the raw XML text re-extracted directly from the three authoritative `.docx` source files.

### Core Audit Principles Enforced:
1. **Zero Assumption of Disclosure from Implementation:** Implementation in TypeScript source code or passing test suites does **not** constitute proof of disclosure in the original patent documents. Features existing in code but absent from `v6.docx`, `patent.docx`, and `Merged_Final_v3.docx` are strictly flagged as `UNSUPPORTED`.
2. **Draft Editing Freeze:** In accordance with instructions, **no edits to the working draft files were made during this pass**. This report documents all verified facts, source mismatches, unsupported additions, and prioritized corrections, and pauses for MILIND's formal approval before any corrections are applied.
3. **Immutability of Source Documents & Baseline Assets:** `docs/patent-requirements/`, `evidence/`, `benchmark/results/phase3/`, and all source code outside `docs/submission-draft/` remain completely untouched.

---

## 2. Independent Claim Verification Matrix (Claims 1–20)

Every claim in [`CLAIMS.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/submission-draft/CLAIMS.md) was checked against `v6.docx` ¶ 183–204 and `patent.docx` ¶ 183–204.

| Claim ID & Element | Controlling Source Reference (`v6.docx`) | Secondary Source Reference (`patent.docx`) | Draft Location (`CLAIMS.md`) | Classification | Audit Finding & Technical Analysis |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Claim 1 Preamble** | ¶ 183 (`"A computer-implemented method..."`) | ¶ 183 (`"1. A computer-implemented method..."`) | Line 17 | `PASS` | Leading numeral `"1. "` correctly prepended (PD-03). Statutory method category preserved. |
| **Claim 1(a)–(n)** | ¶ 183 (Clauses a–n) | ¶ 183 (Clauses a–n) | Lines 19–49 | `PASS` | All 14 clauses match verbatim the controlling text of `v6.docx` ¶ 183 and `patent.docx` ¶ 183. |
| **Claim 2** | ¶ 185 | ¶ 185 | Lines 57–58 | `SOURCE MISMATCH` | **Text Omission:** Draft ends with `"...or equivalent unstable selectors."`, whereas `v6.docx` ¶ 185 and `patent.docx` ¶ 185 verbatim state: `"...or equivalent short-lived attributes, and the volatile attributes are prevented from independently establishing capability identity."` The omission of the second clause weakens the claim. |
| **Claim 3** | ¶ 186 | ¶ 186 | Lines 60–61 | `SOURCE MISMATCH` | **Substantive Paraphrase:** Draft ends with `"...and wherein the invariant closure is evaluated before similarity ranking."`, whereas `v6.docx` ¶ 186 and `patent.docx` ¶ 186 verbatim state: `"...and a candidate failing any mandatory positive predicate or satisfying any negative predicate is rejected before similarity ranking."` The source recites explicit rejection of failing candidates. |
| **Claim 4** | ¶ 187 | ¶ 187 | Lines 63–64 | `SOURCE MISMATCH` | **Unauthorized Text Substitution:** Draft ends with `"...and wherein presentation-only drift triggers invariant revalidation without candidate discovery."` In `v6.docx` ¶ 187 and `patent.docx` ¶ 187, the actual claim text is: `"...and wherein presentation-only drift does not by itself invalidate an otherwise verified route."` The draft imported text from detailed description ¶ 218 into the claim, altering the authentic claim scope. |
| **Claim 5** | ¶ 188 (`"semantic similarity cannot compensate..."`) | ¶ 188 (`"...cannot compensate... and cannot by itself authorize route promotion."`) | Lines 66–67 | `COUNSEL DECISION REQUIRED` | **Boundary Hardening (PD-04):** Draft adopts `patent.docx` ¶ 188 negative ranking limits. This is a deliberate, beneficial fallback against US 11,971,936 B2 and US 12,625,918 B2, but requires formal counsel confirmation. |
| **Claim 6** | ¶ 189 | ¶ 189 | Lines 69–70 | `SOURCE MISMATCH` | **Omission of Whereby Clause:** Draft ends with `"...wherein candidate controls that trigger a contradiction predicate are rejected before ranking or execution."`, whereas `v6.docx` ¶ 189 and `patent.docx` ¶ 189 verbatim recite: `"...whereby a candidate having a higher semantic similarity than an accepted candidate is nevertheless rejected."` The omitted whereby clause is the core novelty distinction over semantic search. |
| **Claim 7** | ¶ 190 | ¶ 190 | Lines 72–73 | `COUNSEL DECISION REQUIRED` | **Boundary Hardening:** Draft adopts `patent.docx` ¶ 190 (`"measured from the activation event"` and `"when at least two such witness classes are available"`). Counsel must confirm adopting this secondary specification refinement. |
| **Claim 8** | ¶ 191 | ¶ 191 | Lines 75–76 | `SOURCE MISMATCH` | **Terminology Alteration:** Draft recites `"...and asynchronous network transport acknowledgement."`, whereas `v6.docx` ¶ 191 and `patent.docx` ¶ 191 recite `"...or an asynchronous transaction acknowledgement."` The source uses "or" (disjunctive) and "transaction acknowledgement". |
| **Claim 9** | ¶ 192 | ¶ 192 | Lines 78–79 | `COUNSEL DECISION REQUIRED` | **Linguistic Refinement:** Draft adopts `patent.docx` ¶ 192 (`"causal transition-verification"` and `"quarantined negative evidence"`). Compatible with `v6.docx` ¶ 192. |
| **Claim 10** | ¶ 193 | ¶ 193 | Lines 81–82 | `SOURCE MISMATCH` | **Word Substitution:** Draft ends with `"...while preserving the failed route as negative evidence."`, whereas `v6.docx` ¶ 193 and `patent.docx` ¶ 193 recite `"...while preserving the failed route as historical evidence."` |
| **Claim 11** | ¶ 194 | ¶ 194 | Lines 84–86 | `SOURCE MISMATCH` | **Substantive Alteration:** Draft recites `"...and route state management within a local browser security boundary, without transmitting user authentication credentials or private interface contents to an external inference service."`, whereas `v6.docx` ¶ 194 and `patent.docx` ¶ 194 recite: `"...transition verification, route promotion, and risk gating locally within the browser runtime without transmitting session credentials or authentication tokens to an external inference service."` |
| **Claim 12** | ¶ 195 | ¶ 195 | Lines 88–89 | `SOURCE MISMATCH` | **Omission of Interface Clause:** Draft terminates with `"...and a verification controller."`, omitting the final statutory limitation in `v6.docx` ¶ 195 and `patent.docx` ¶ 195: `"...communicating through an extension messaging interface."` |
| **Claim 13** | ¶ 196 | ¶ 196 | Lines 91–92 | `PASS` | Minor article change ("the" to "an" abstention state); technical meaning identical. |
| **Claim 14** | ¶ 197 | ¶ 197 | Lines 94–95 | `PASS` | Verbatim identical to `v6.docx` ¶ 197 and `patent.docx` ¶ 197. |
| **Claim 15** | ¶ 199 | ¶ 199 | Lines 97–98 | `SOURCE MISMATCH` | **Critical Limitation Omission:** Draft terminates with `"...thereby establishing a verifiable activation-to-witness ordering."`, omitting the entire second half of `v6.docx` ¶ 199 and `patent.docx` ¶ 199: `"...and wherein a witness that does not satisfy the configured ordering and verification interval is excluded from the route-promotion condition."` |
| **Claim 16** | ¶ 200 | ¶ 200 | Lines 100–101 | `COUNSEL DECISION REQUIRED` | Draft adopts `patent.docx` ¶ 200 (`"the specific failed invariant"`), whereas `v6.docx` ¶ 200 says `"a failed invariant"`. Counsel decision required. |
| **Claim 17** | ¶ 201 | ¶ 201 | Lines 103–105 | `COUNSEL DECISION REQUIRED` | **Explicit Transition Rules (PD-08):** Draft adopts `patent.docx` ¶ 201 operational transition rules to satisfy § 112 / § 10(4). Requires formal counsel confirmation. |
| **Claim 18** | ¶ 202 | ¶ 202 | Lines 107–108 | `COUNSEL DECISION REQUIRED` | Draft adopts `patent.docx` ¶ 202 negative boundaries (`"cannot by itself establish functional equivalence, promote an unverified route, or authorize a high-risk operation"`). Requires formal counsel confirmation. (Also contains markdown formatting artifact to be cleaned). |
| **Claim 19** | ¶ 203 | ¶ 203 | Lines 114–115 | `PASS` | Truncation in `v6.docx` ¶ 203 corrected by adding `"1."` matching `patent.docx` ¶ 203 (PD-01). |
| **Claim 20** | ¶ 204 | ¶ 204 | Lines 117–118 | `PASS` | Verbatim match with `v6.docx` ¶ 204 / `patent.docx` ¶ 204. (Formatting artifact to be cleaned). |

---

## 3. Specification Source Fidelity & Technical Feature Audit

### 3.1 Equations in `SPECIFICATION.md` vs. Source Documents
1. **Candidate Scoring Formula (Line 162 in `SPECIFICATION.md`):**
   $$S(c) = \alpha \cdot \text{Sim}_{\text{sem}}(c, I) + \beta \cdot (1 - \text{Cost}_{\text{str}}(c, T)) - \gamma \cdot \text{Risk}_{\text{penalty}}(c)$$
   - **Finding:** `UNSUPPORTED in v6.docx & patent.docx`.
   - **Source Reality:** In `Merged_Final_v3.docx` Paragraph 402, the actual disclosed formula is:
     $$\text{RebindScore} = w_1 \cdot \text{InvariantFit} + w_2 \cdot \text{SemanticFit} + w_3 \cdot \text{ContextFit} + w_4 \cdot \text{TransitionFit} + w_5 \cdot \text{ValidationHistory} - w_6 \cdot \text{Contradiction} - w_7 \cdot \text{Staleness}$$
     And in Paragraph 100:
     $$\text{RouteScore} = w_1 \cdot \text{SemanticFit} + w_2 \cdot \text{ContextFit} + w_3 \cdot \text{TransitionFit} + w_4 \cdot \text{ValidationConfidence} - w_5 \cdot \text{Staleness} - w_6 \cdot \text{Risk} - w_7 \cdot \text{PathCost}$$
   - **Severity:** HIGH. The 3-term formula $S(c)$ was created for the prototype code implementation in `src/core/candidate/pipeline.ts`.
   - **Action Required:** Disclose the authentic multi-factor formulas from `Merged_Final_v3.docx` ¶ 100 & ¶ 402 in the specification, and present $S(c)$ strictly as an *illustrative simplified prototype implementation evaluated in the empirical benchmark*, not as the primary disclosed formula.

2. **Cryptographic HMAC Token Formula (Line 172 in `SPECIFICATION.md`):**
   $$\text{Token} = \text{HMAC-SHA256}_{K_{\text{session}}}(\text{NodeID} \,\|\, \text{IntentID} \,\|\, \text{Timestamp} \,\|\, T_{\text{lease}})$$
   - **Finding:** `UNSUPPORTED in all source documents`.
   - **Source Reality:** Neither `v6.docx`, `patent.docx`, nor `Merged_Final_v3.docx` mentions "HMAC", "SHA256", or this mathematical equation. `v6.docx` Paragraph 217 specifies a *machine-readable validation record storing capability identity, drift vector, invariant results, activation timestamp, transition-witness state, and route version ID.*
   - **Severity:** HIGH (Added-Matter Risk if claimed as patent disclosure).
   - **Action Required:** Frame the HMAC-SHA256 formulation strictly as an *optional, software-implemented cryptographic security embodiment* of the token authenticator module in the prototype, not as an original patent specification disclosure.

---

### 3.2 Hyperparameters and Timing Constants
1. **Scoring Weights ($\alpha=0.50, \beta=0.30, \gamma=0.20$):**
   - **Finding:** `UNSUPPORTED in source documents`.
   - **Source Reality:** `Merged_Final_v3.docx` Paragraph 100 explicitly states: *"The weights may be tuned experimentally."* Specific numerical weights do not appear in `v6.docx` or `patent.docx`.
   - **Action Required:** Clearly label $\alpha=0.50, \beta=0.30, \gamma=0.20$ as *empirical benchmark test configuration values used in Phase 3*, rather than specification defaults.
2. **Observation Timeout ($\tau = 250\text{ ms}$) and Lease Duration ($T_{\text{lease}} = 5000\text{ ms}$):**
   - **Finding:** `UNSUPPORTED in source documents`.
   - **Source Reality:** `v6.docx` Paragraph 120 and `patent.docx` Paragraph 120 disclose a `"bounded verification interval"` without specifying numerical millisecond constants.
   - **Action Required:** Disclose that the verification interval is bounded, and cite $250\text{ ms}$ strictly as the prototype benchmark harness timeout.

---

### 3.3 Figure Architecture Alignment in `FIGURES.md`
- **Source Disclosure Reality:** In `v6.docx` (Paragraphs 66, 88, 98, 106, 114, 125), the figures are explicitly enumerated:
  - **Figure 1:** System architecture prepared for this disclosure (¶ 66).
  - **Figure 2:** Capability-fingerprint construction diagram (¶ 88).
  - **Figure 3:** Semantic capability graph and route-ranking illustration (¶ 98).
  - **Figure 4:** Semantic path-recovery flow (¶ 106).
  - **Figure 5:** Risk-gated navigation flow (¶ 114).
  - **Figure 6:** Closed-loop capability lifecycle showing the strengthened control sequence from persistent capability identity through drift localization, invariant closure, causal transition verification, provisional quarantine, validated promotion, and independent execution authorization (¶ 125).
- **Draft Discrepancy:** In `FIGURES.md`, Figure 4 was renamed "Ephemeral HMAC Token Lifecycle" and Figure 6 was renamed "Phase 3 Experimental Validation Workflow".
- **Finding:** `SOURCE MISMATCH`. Figure 4 in `v6.docx` is the *Semantic path-recovery flow*, and Figure 6 is the *Closed-loop capability lifecycle*.
- **Action Required:** Realign the figure descriptions in `FIGURES.md` and `SPECIFICATION.md` to directly match the authentic titles and structural content of Figures 1–6 in `v6.docx` Paragraphs 66–125.

---

### 3.4 Formal Definition of "Causal" in Specification
- **Finding:** In `patent.docx` Paragraph 120, the inventor provided an explicit, formal **5-part statutory definition of "causal"**:
  1. A specific candidate activation event occurs;
  2. The activation event is associated with a defined expected state delta;
  3. The expected delta must be observed within a configured bounded verification interval measured from the activation event;
  4. The resulting state change is supported by one or more ordered, independently observable witness classes (preferably $\ge 2$); and
  5. The controller accepts the transition only when witnesses are temporally ordered and causally consistent with the activation event and expected delta.
- **Action Required:** Incorporate this exact 5-part definition verbatim into `SPECIFICATION.md` Detailed Description § 5 to provide complete antecedent support for Claim 1(k), Claim 7, and Claim 9.

---

## 4. Prior-Art & Empirical Performance Claims Audit

1. **Prior-Art Patent Citations:**
   - `SPECIFICATION.md` now incorporates the six prior-art patent boundaries from `v6.docx` Section 9.5 (US 11,971,936 B2, US 12,625,918 B2, US 12,147,732 B2, US 9,274,934 B2, US 11,714,843 B2).
   - **Finding:** `PASS`. Fully supported by `v6.docx` Paragraphs 206–212.
2. **Empirical Benchmarks & JSDOM vs. Real Browser:**
   - Both `SPECIFICATION.md` and `EXPERIMENTAL_RESULTS_SUMMARY.md` explicitly disclose that Phase 3 results reflect JSDOM execution in Node.js, distinguishing them from live GPU Blink rendering reflows.
   - **Finding:** `PASS`. Compliant with candor requirements and `v6.docx` Paragraph 215.
3. **Execution Count Reconciliation (B5 vs. BASELINE):**
   - The report accurately accounts for all 13 mutation fixtures (6 executed, 2 quarantined, 2 blocked pre-dispatch by risk gating, 3 non-executable targets).
   - **Finding:** `PASS`. 100% mathematically reconciled.

---

## 5. Prioritized List of Required Corrections

The following prioritized corrections are submitted for MILIND's formal approval:

### Priority Tier 1: Immediate Claim Source Mismatches (Must Restore Verbatim Source Text)
1. **Claim 2:** Restore verbatim text from `v6.docx` ¶ 185:
   Replace `or equivalent unstable selectors.` with `or equivalent short-lived attributes, and the volatile attributes are prevented from independently establishing capability identity.`
2. **Claim 3:** Restore verbatim text from `v6.docx` ¶ 186:
   Replace `and wherein the invariant closure is evaluated before similarity ranking.` with `and a candidate failing any mandatory positive predicate or satisfying any negative predicate is rejected before similarity ranking.`
3. **Claim 4:** Restore verbatim text from `v6.docx` ¶ 187:
   Replace `triggers invariant revalidation without candidate discovery.` with `does not by itself invalidate an otherwise verified route.`
4. **Claim 6:** Restore verbatim text from `v6.docx` ¶ 189:
   Replace `wherein candidate controls that trigger a contradiction predicate are rejected before ranking or execution.` with `whereby a candidate having a higher semantic similarity than an accepted candidate is nevertheless rejected.`
5. **Claim 8:** Restore verbatim text from `v6.docx` ¶ 191:
   Replace `and asynchronous network transport acknowledgement.` with `or an asynchronous transaction acknowledgement.`
6. **Claim 10:** Restore verbatim text from `v6.docx` ¶ 193:
   Replace `negative evidence.` with `historical evidence.`
7. **Claim 11:** Restore verbatim text from `v6.docx` ¶ 194:
   Restore exact phrase: `"...transition verification, route promotion, and risk gating locally within the browser runtime without transmitting session credentials or authentication tokens to an external inference service."`
8. **Claim 12:** Restore verbatim text from `v6.docx` ¶ 195:
   Append `communicating through an extension messaging interface.` at the end of Claim 12.
9. **Claim 15:** Restore verbatim text from `v6.docx` ¶ 199:
   Restore the omitted second half: `"...and wherein a witness that does not satisfy the configured ordering and verification interval is excluded from the route-promotion condition."`
10. **Formatting Cleanup (Claims 18 & 20):** Remove trailing markdown signature blocks embedded inside claim text.

### Priority Tier 2: Specification Unsupported Features & Equation Alignment
1. **Disclose Authentic Scoring Formulas:** In `SPECIFICATION.md`, disclose the source-backed formulas from `Merged_Final_v3.docx` ¶ 100 (`RouteScore`) and ¶ 402 (`RebindScore`), and state that $S(c)$ is an illustrative simplified implementation used in benchmark evaluations.
2. **Re-frame HMAC-SHA256 Token:** Label HMAC-SHA256 as an *illustrative software security embodiment* of the token authenticator module, rather than an original patent disclosure requirement.
3. **Incorporate 5-Part Definition of "Causal":** Insert the formal 5-part definition from `patent.docx` ¶ 120 verbatim into `SPECIFICATION.md` § 5.
4. **Realign Figures 1–6 in `FIGURES.md`:** Realign figure titles and descriptions to correspond to Figures 1–6 in `v6.docx` Paragraphs 66–125 (Figure 4 = Semantic path recovery; Figure 6 = Closed-loop capability lifecycle).

### Priority Tier 3: Patent Counsel Strategic Decisions (Formal Approval)
1. **Confirm Fallback Boundaries in Claims 5, 7, 9, 16, 17, 18:** Formally ratify the adoption of `patent.docx` sharpened boundaries (PD-04, PD-08, explicit transition causes).

---

## 6. Review Summary & Next Steps

| Category | Checked Items | PASS | SOURCE MISMATCH | COUNSEL DECISION | UNSUPPORTED |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Claims 1–20** | 20 Claims | 5 | 8 | 7 | 0 |
| **Specification Sections** | 8 Sections | 5 | 1 (Figures) | 0 | 2 (HMAC / S(c)) |
| **Empirical Claims** | Phase 3 Data | 4 | 0 | 0 | 0 |

**Status:** Independent verification complete. No draft files were modified during this pass. All findings and prioritized corrections are documented above.

**Awaiting MILIND's approval before applying the prioritized corrections to `docs/submission-draft/`.**

