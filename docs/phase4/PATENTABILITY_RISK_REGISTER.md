# IntentNav-SCFR: Patentability Risk Register & Mitigation Strategy
**Document Identifier:** `INTENTNAV-PH4-PRR-2026-V1`
**Author:** MILIND (Sole Implementer & Architect)
**Date:** October 26, 2026
**Status:** Approved for Patent Drafting & Evidence Reconciliation
**Git Anchor:** Branch `patent-hardening-phase-2-batch-b-capability-routing` (`bc4a34be60dc58e45dab60a657d4e0009ab77798`)
**Controlling Specifications:** `docs/patent-requirements/v6.docx` (Primary), `patent.docx` (Secondary), `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` (Tertiary)

---

## 1. Executive Summary & Purpose

This Patentability Risk Register catalogs and evaluates potential legal, technical, and examiner-driven risks to the grant of patents for **IntentNav-SCFR** across the Indian Patent Office (IPO), the United States Patent and Trademark Office (USPTO), and the European Patent Office (EPO).

For each identified risk, this register articulates:
1. **The Legal Basis & Citation** (e.g., Indian Patents Act §§ 3(k), 2(1)(ja), 10(4); 35 U.S.C. §§ 101, 102, 103, 112; EPC Arts 52, 54, 56, 84).
2. **The Vulnerable Claim Elements**.
3. **The Risk Severity & Likelihood**.
4. **Concrete Technical Distinctions & Rebuttal Arguments**.
5. **Actionable Claim Amendments & Drafting Recommendations**.

---

## 2. Risk Register Matrix Overview

| Risk ID | Category | Description | Severity | Likelihood | Controlling Jurisdictions |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **RISK-01** | Subject Matter / Section 3(k) | Characterization as "Computer Programme per se" / Abstract Algorithm | **HIGH** | **HIGH** | India (IPO), USA (§ 101) |
| **RISK-02** | Prior Art / Novelty (35 U.S.C. § 102) | Overlap with UiPath Self-Healing Automation Patents | **HIGH** | **MEDIUM** | Global (USPTO, IPO, EPO) |
| **RISK-03** | Inventive Step (35 U.S.C. § 103 / § 2(1)(ja)) | Obvious Combination of Robula+ Anchors and Daikon Invariant Mining | **MEDIUM** | **HIGH** | Global (USPTO, IPO, EPO) |
| **RISK-04** | Clarity & Antecedent Basis (Act § 10(4)) | Ambiguity in "allowed state delta" and "ephemeral binding handle" | **MEDIUM** | **MEDIUM** | India (IPO), EPO (Art 84), USPTO |
| **RISK-05** | Sufficiency of Disclosure / Enablement | Calibration of Semantic-Structural Hybrid Weights ($\alpha, \beta, \gamma$) | **LOW** | **MEDIUM** | Global (IPO § 10(4), 35 U.S.C. § 112) |
| **RISK-06** | Claim Breadth / Preemption | Scope of Multi-Class Causal Verification across Arbitrary Web Stacks | **MEDIUM** | **LOW** | Global |

---

## 3. Deep-Dive Risk Analysis & Defenses

---

### RISK-01: Section 3(k) Subject Matter Eligibility (Computer Programme per se)
- **Jurisdictions:** India (Patents Act, 1970 § 3(k)); United States (35 U.S.C. § 101 - *Alice/Mayo* Step 2A/2B).
- **Vulnerable Claims:** Claims 1, 10, 19, 20.
- **Risk Characterization:**
  Examiners at the Indian Patent Office (IPO) routinely reject software-related claims under Section 3(k) as "computer programme per se" or "algorithms" unless a tangible hardware connection or concrete technical effect outside the computer program is explicitly claimed. Similarly, a USPTO examiner may characterize claim 1 as an abstract idea of "organizing human activity" or "navigating web pages based on intent."

- **Technical Rebuttal & Distinguishing Features:**
  1. **Physical Browser Execution Gating:** The invention does not simply calculate abstract paths; it gates physical, asynchronous hardware event dispatches (mouse clicks, keypresses via the Chromium DevTools Protocol / Blink event queue).
  2. **Hardware/Network Socket Binding:** The transition witness verifier interfaces with physical network sockets and TCP/HTTP stream listeners to capture actual transmission acknowledgements.
  3. **Security Firewall Architecture:** IntentNav-SCFR operates as an active security barrier, preventing unauthorized state corruption (financial transactions, data deletion) on the underlying operating system and remote servers.
  4. **Controlling Precedents (India):**
     - *Ferid Allani v. Union of India* (2019 DHC): Software that achieves a technical effect or has a technical contribution is patentable.
     - *Microsoft Technology Licensing LLC v. Assistant Controller* (2023 DHC): A software mechanism providing security isolation and technical efficiency is not excluded by Section 3(k).

- **Mandatory Drafting Action:**
  - In Claim 1(a), ensure the execution environment is explicitly recited as: *"a computer system comprising one or more processors and a memory coupled to a web browser execution runtime and a network interface..."*
  - Frame the claims as a *"method and system for secure, invariant-gated autonomous web browser navigation and fault-tolerant route promotion."*
  - Include dependent claims explicitly reciting the interception of physical event dispatch queues and network transport socket states.

---

### RISK-02: Anticipation / Obviousness Over UiPath Self-Healing Patents
- **Jurisdictions:** USPTO (35 U.S.C. §§ 102/103), IPO (§ 2(1)(ja)), EPO (Art 54/56).
- **Primary References:**
  - US Patent 11,200,073 B2 (UiPath Inc. - *Computer vision-based element selection*)
  - US Patent 11,232,170 B2 (UiPath Inc. - *Self-healing execution workflows*)
  - US Patent 11,461,164 B2 (UiPath Inc. - *Multi-anchor UI automation*)
- **Vulnerable Claims:** Claims 1(b), 1(d), 2, 4.
- **Risk Characterization:**
  UiPath discloses multi-anchor UI automation and runtime self-healing where a broken selector falls back to visual fuzzy matching or secondary anchor selectors. An examiner may argue that IntentNav-SCFR's candidate re-binding pipeline is merely an obvious extension of UiPath's anchor fallback.

- **Technical Rebuttal & Distinguishing Features:**
  1. **Invariant-First Pre-Filtering vs. Visual Re-Targeting:**
     UiPath re-heals *after* a failure or matches based on visual bounding boxes regardless of internal application invariants. IntentNav-SCFR enforces an **invariant closure check before** candidate scoring: if an element violates state invariants (e.g., required parent context, read-only attributes, permission boundaries), it is discarded regardless of visual or syntactic similarity.
  2. **Multi-Class Causal Verification vs. Blind Action Firing:**
     UiPath assumes action success when the OS synthetic click completes. IntentNav-SCFR requires asynchronous multi-class witnesses (DOM mutation + network ACK + route state change) within an observational causal lease. In Phase 3 tests, UiPath-style baselines experienced 100% false-success on HTTP 500 errors, whereas IntentNav-SCFR quarantined the failure.
  3. **Ephemeral Cryptographic Authority Binding:**
     UiPath employs static execution tokens or raw selector strings. IntentNav-SCFR binds execution to an ephemeral HMAC token valid only for a single transition lease.

- **Mandatory Drafting Action:**
  - Structure Claim 1 such that candidate re-binding is structurally subordinate to invariant closure: no candidate can be re-bound unless it satisfies the invariant closure predicate.
  - Recite the multi-class witness requirement in Independent Claim 1.

---

### RISK-03: Obviousness Combination of Robula+ and Daikon Invariant Mining
- **Jurisdictions:** Global (35 U.S.C. § 103, Indian Patents Act § 2(1)(ja), EPC Art 56).
- **Primary References:**
  - Leotta et al. (Robula+, *Automated Software Engineering*, 2016)
  - Ernst et al. (Daikon, *Science of Computer Programming*, 2007)
  - Hammoudi et al. (WATER, *ICSE*, 2016)
- **Vulnerable Claims:** Claim 1(c), Claim 1(g), Claim 3, Claim 5.
- **Risk Characterization:**
  An examiner may construct a rejection by combining Robula+ (for robust structural XPath generation) with Daikon (for runtime program invariant assertion), arguing that applying program invariant checks to web element selectors is an obvious design choice for a person skilled in the art.

- **Technical Rebuttal & Distinguishing Features:**
  1. **Teaching Away from Pre-Execution Invariant Firewalls in Automation:**
     Robula+ and web test automation prior art teach maximizing selector generality to ensure a click executes even when pages change. They teach *against* strict invariant gating because invariant gating intentionally suppresses execution when page context drifts unexpectedly.
  2. **Dynamic Hybrid Multi-Dimensional Scoring:**
     IntentNav-SCFR does not merely evaluate Boolean assertions (as in Daikon); it synthesizes a 3-way vector combining cosine semantic embedding distance, structural tree edit cost, and historical negative evidence contradictions.
  3. **Synergistic Empirical Advance:**
     Combining invariant gating with candidate re-binding produces an unexpected technical synergy demonstrated in Phase 3 ablation studies: disabling risk gating caused 13/13 safety bypasses, while disabling causal verification caused a 50% spike in false executions (jumping from 6 to 9). This demonstrates an inventive synergy under *KSR v. Teleflex*.

- **Mandatory Drafting Action:**
  - Explicitly recite the interactive feedback loop between the negative evidence store (historical failures) and the invariant closure engine in the claims.
  - Rely on the experimental ablation data from `TECHNICAL_EFFECT_ASSESSMENT.md` Table 2 during prosecution.

---

### RISK-04: Clarity, Conciseness, and Antecedent Basis (§ 10(4) / 35 U.S.C. § 112(b))
- **Jurisdictions:** India (Patents Act § 10(4)), EPO (EPC Art 84), USPTO (35 U.S.C. § 112(b)).
- **Vulnerable Claims:** Claim 1(c), Claim 1(h), Claim 1(l), Claim 1(m).
- **Risk Characterization:**
  Examiners may issue clarity/indefiniteness rejections for novel technical terminology that lacks standard textbook definitions, specifically:
  - *"invariant closure"*
  - *"allowed state delta"*
  - *"ephemeral binding handle"*
  - *"causal transition token"*

- **Technical Rebuttal & Distinguishing Features:**
  - Every novel term corresponds to a mathematically rigorous, concrete data structure implemented in the source code:
    - *Invariant Closure:* Defined in `src/core/invariants/closure.ts` as a set of logical predicates over element tag, attributes, parent context, and accessibility tree that must evaluate to `true`.
    - *Allowed State Delta:* Defined in `src/core/causal/verifier.ts` as the expected diff set between pre-state DOM hash and post-state DOM tree, constrained by a permissible mutation budget.
    - *Ephemeral Binding Handle:* Defined in `src/core/stateMachine/machine.ts` as an in-memory reference token cryptographically authenticated via HMAC-SHA256 with an epoch-based expiration lease.
    - *Causal Transition Token:* The signed authorization payload passed from the state machine to the fast-path route manager.

- **Mandatory Drafting Action:**
  - Explicitly define each term in the "Definitions and Terms" section of the patent specification, providing formal mathematical or programmatic definitions.
  - Amend the claims to include structural qualifiers (e.g., *"an ephemeral binding handle comprising an authenticated in-memory identifier expiring after a pre-determined lease window"*).

---

### RISK-05: Sufficiency of Disclosure / Enablement for Scoring Weights ($\alpha, \beta, \gamma$)
- **Jurisdictions:** India (Patents Act § 10(4)), USPTO (35 U.S.C. § 112(a)), EPO (EPC Art 83).
- **Vulnerable Claims:** Claim 1(g), Claim 5.
- **Risk Characterization:**
  Claim 1(g) recites evaluating candidates based on a *"composite score combining semantic similarity, structural stability, and execution safety."* If the specification fails to disclose the exact mathematical weighting or how a practitioner can calibrate $\alpha, \beta, \gamma$, an examiner could assert lack of enablement.

- **Mitigation & Disclosure Action:**
  - Disclose the exact linear formulation implemented in `src/core/candidate/pipeline.ts`:
    $$S(c) = \alpha \cdot \text{Sim}_{\text{sem}}(c, I) + \beta \cdot (1 - \text{Cost}_{\text{str}}(c, T)) - \gamma \cdot \text{Risk}_{\text{penalty}}(c)$$
  - Disclose the empirical default hyperparameters utilized in the Phase 3 validation: $\alpha = 0.50$, $\beta = 0.30$, $\gamma = 0.20$.
  - Provide disclosure showing how the weights are dynamically normalized to the $[0, 1]$ interval.

---

### RISK-06: European Patent Convention (EPO) "Technical Problem-Solution" Scrutiny
- **Jurisdictions:** European Patent Office (EPC Arts 52, 56).
- **Vulnerable Claims:** Claim 1, Claim 10.
- **Risk Characterization:**
  The EPO applies the strict "Comvik approach": features that do not contribute to the technical character of an invention cannot support an inventive step. If the examiner views navigation planning as non-technical "administrative business logic" or "presentation of information," the inventive step analysis will ignore those features.

- **Mitigation & Formulation of the Objective Technical Problem:**
  - **Objective Technical Problem:** *"How to reliably and securely execute autonomous web browser input events in the presence of dynamic client-side interface drift without causing unauthorized state transitions or silent execution failures."*
  - Emphasize that the problem and the solution reside strictly within the technical domain of **software reliability, runtime security, and asynchronous browser event dispatch**.
  - Frame the invention as a technical device controller for a web browser engine.

---

## 4. Prior Art Risk Comparison Matrix

| System / Citation | Invariant Pre-Filter | Dynamic Drift Re-Binding | Ephemeral HMAC Token | Multi-Class Causal Verifier | Route Promotion to Fast-Path |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **UiPath (US 11,200,073)** | No | Yes (Visual) | No | No | No |
| **Robula+ (Leotta 2016)** | No | Partial (XPath) | No | No | No |
| **Testim (US 2021/0149791)** | No | Yes (Weights) | No | No | No |
| **Daikon (Ernst 2007)** | Yes (Post-run) | No | No | No | No |
| **Mind2Web (Deng 2023)** | No | No | No | No | No |
| **Google (US 9,842,162)** | No | No | No | No | No |
| **IntentNav-SCFR (Claim 1)** | **YES** | **YES** | **YES** | **YES** | **YES** |

---

## 5. Summary of Recommended Claim Amendments

1. **Independent Method Claim 1:**
   - Incorporate explicit recitation of the execution runtime: *"executed by a computer system interacting with an asynchronous browser rendering engine and a network interface"*.
   - Explicitly link the multi-class witness verification to the state machine transition before fast-path route promotion.
2. **Dependent Claims for Section 3(k) Protection:**
   - Add a dependent claim specifying that physical input event dispatch is inhibited whenever an invariant closure condition is violated.
   - Add a dependent claim specifying that the multi-class witness requires receiving an HTTP transport acknowledgement from a remote server within a defined timeout threshold.
3. **Definitions in Specification:**
   - Add explicit definitions for "invariant closure", "allowed state delta", "ephemeral binding handle", and "causal witness" in the descriptive specification.

---
*Signed and Authenticated:*
**MILIND**
Sole Architect & Implementer, IntentNav-SCFR

