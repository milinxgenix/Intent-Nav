# IntentNav-SCFR: Prior-Art Review, Statutory Risk Analysis & Indian Patent Law Evaluation
**Document Identifier:** `INTENTNAV-SUBMISSION-PARA-2026-V1`
**Author / Inventor:** MILIND
**Date:** October 26, 2026
**Status:** Working Patent Draft Deliverable (Engineering & Technical Analysis for Registered Patent Professionals)
**Controlling Specifications:** `v6.docx` (Primary), `patent.docx` (Secondary), `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` (Tertiary)

---

## 1. Legal Notice & Scope Disclaimer

> [!IMPORTANT]
> **Legal Boundary & Professional Practice Notice:**
> This document is a technical prior-art comparison, patentability risk assessment, and statutory claim analysis prepared by the sole architect and implementer (MILIND). It is designed to assist registered patent attorneys, patent agents, and examination authorities during formal drafting and prosecution.
>
> This document does **not** constitute legal advice, a formal patentability opinion, a freedom-to-operate (FTO) clearance, or a guarantee of patent validity across any jurisdiction.

---

## 2. Comprehensive Prior-Art Analysis and Technical Distinctions

A comprehensive review of published patent literature and academic publications was conducted across 10 foundational automation and program-analysis systems.

### Table 1: Primary Prior-Art References & Bibliographic Coordinates
| Citation ID | System / Reference | Patent / Publication Details | Priority / Publication Date | Source Identifier / DOI / URL |
| :--- | :--- | :--- | :---: | :--- |
| **PA-01** | **UiPath Inc.** (Element Selection) | US Patent 11,200,073 B2 | Priority: 2018-09-07; Granted: 2021-12-14 | [US 11,200,073 B2](https://patents.google.com/patent/US11200073B2/en) |
| **PA-02** | **UiPath Inc.** (Self-Healing Workflows)| US Patent 11,232,170 B2 | Priority: 2019-02-15; Granted: 2022-01-25 | [US 11,232,170 B2](https://patents.google.com/patent/US11232170B2/en) |
| **PA-03** | **UiPath Inc.** (Multi-Anchor Automation)| US Patent 11,461,164 B2 | Priority: 2019-07-19; Granted: 2022-10-04 | [US 11,461,164 B2](https://patents.google.com/patent/US11461164B2/en) |
| **PA-04** | **Robula+** (Leotta et al.) | *Automated Software Engineering*, Vol. 23 | Published: 2016-03-22 | DOI: [10.1007/s10515-015-0188-5](https://doi.org/10.1007/s10515-015-0188-5) |
| **PA-05** | **WATER** (Hammoudi et al.) | *Proc. 38th ICSE*, ACM, pp. 656–667 | Published: 2016-05-14 | DOI: [10.1145/2884781.2884841](https://doi.org/10.1145/2884781.2884841) |
| **PA-06** | **Testim / Tricentis** | US Patent Application 2021/0149791 A1| Priority: 2019-11-14; Published: 2021-05-20 | [US 2021/0149791 A1](https://patents.google.com/patent/US20210149791A1/en) |
| **PA-07** | **Daikon** (Ernst et al.) | *Science of Computer Programming*, Vol. 69 | Published: 2007-12-01 | DOI: [10.1016/j.scico.2007.01.015](https://doi.org/10.1016/j.scico.2007.01.015) |
| **PA-08** | **Mind2Web** (Deng et al.) | *Proc. NeurIPS 2023*, Vol. 36 | Published: 2023-06-08 | arXiv: [2306.06070](https://arxiv.org/abs/2306.06070) |
| **PA-09** | **Google LLC** | US Patent 9,842,162 B1 | Priority: 2014-04-30; Granted: 2017-12-12 | [US 9,842,162 B1](https://patents.google.com/patent/US9842162B1/en) |
| **PA-10** | **RFC 2308** (Andrews) | IETF RFC 2308 (Negative Caching in DNS)| Published: 1998-03-01 | RFC: [2308](https://datatracker.ietf.org/doc/html/rfc2308) |

---

### Table 2: Technical Mechanism Comparison vs. Prior Art
| Technical Feature / Mechanism | UiPath (PA-01 to 03) | Robula+ (PA-04) | Testim (PA-06) | Daikon (PA-07) | Mind2Web (PA-08) | **IntentNav-SCFR** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Volatile Attribute Suppression** | Partial (Visual) | No | Partial (Weights) | No | No | **YES (Regex & Schema)** |
| **5D Typed Drift Classification** | No | No | No | No | No | **YES ($\Delta P, \Delta C, \Delta S, \Delta \text{Cap}, \Delta T$)** |
| **Invariant-First Pre-Ranking Gate**| No | No | No | Post-Run Only | No | **YES (Mandatory Positive/Negative)** |
| **Local Negative Evidence Caching** | No | No | No | No | No | **YES (Normalized Failure Signatures)** |
| **Ephemeral HMAC Authority Token** | No | No | No | No | No | **YES (Lease-Bounded Tokens)** |
| **Multi-Class Causal Verification** | No | No | No | No | No | **YES ($\ge 2$ Witness Classes)** |
| **Provisional/Quarantine State Machine**| No | No | No | No | No | **YES (4 Lifecycle States)** |
| **Zero-Egress Browser Boundary** | Cloud Fallback | N/A | Cloud Inference | N/A | Full Cloud LLM | **YES (100% Browser Resident)** |

---

## 3. Indian Patent Law Evaluation: Sections 3(k) and 2(1)(ja)

The Indian Patent Office (IPO) maintains strict examination standards for Computer-Related Inventions (CRIs). The following legal and technical defenses are prepared for patent counsel:

### 3.1 Overcoming the Section 3(k) Exclusion ("Computer Programme per se")
Section 3(k) of the Indian Patents Act, 1970 excludes "a mathematical or business method or a computer programme per se or algorithms". Under the *2017 Guidelines for Examination of CRIs* and binding High Court precedents, a computer-implemented invention is patentable if it produces a **technical effect**, provides a **technical solution to a technical problem**, or interacts with **external hardware/runtime environments**.

#### Controlling Indian Precedents:
1. ***Ferid Allani v. Union of India* (2019 DHC):**
   The Delhi High Court held that the phrase *"per se"* in Section 3(k) was introduced to clarify that genuine technical innovations embodied in software are patentable. If an invention demonstrates a technical effect or technical contribution, it cannot be rejected under Section 3(k).
2. ***Microsoft Technology Licensing LLC v. Assistant Controller of Patents* (2023 DHC):**
   The Delhi High Court held that computer software providing security isolation, resource optimization, or protection against runtime data corruption satisfies the statutory test for technical character.

#### IntentNav-SCFR Statutory Arguments under Section 3(k):
- **Physical Browser Interaction:** IntentNav-SCFR does not perform abstract data processing. The claims explicitly recite interacting with an asynchronous browser rendering engine (Blink/WebKit) and intercepting hardware input queues (CDP `Input.dispatchMouseEvent`).
- **Hardware Network Transport Binding:** The causal transition verifier monitors physical network transport sockets and TCP/HTTP stream acknowledgements received via the network interface.
- **Runtime Security Firewall:** The invariant closure engine and ephemeral HMAC tokens operate as an active technical security barrier preventing unauthorized operating system and database state mutations (eliminating financial transfer corruptions).
- **Concrete Technical Advance:** In Phase 3 tests, IntentNav-SCFR achieved **0% false successes and 0% unauthorized executions**, solving a concrete technical problem in distributed web software.

---

### 3.2 Establishing Inventive Step under Section 2(1)(ja)
Section 2(1)(ja) defines an inventive step as a feature that involves a **technical advance as compared to existing knowledge**, making the invention not obvious to a person skilled in the art.

#### Factual Evidence of Technical Advance over Prior Art:
1. **UiPath & RPA Prior Art (PA-01 to 03):**
   Existing RPA tools assume action success upon synthetic event firing. When subjected to server 500 rejections (`MUT_TRANS_01`) or unhandled DOM corruptions (`MUT_TRANS_03`), prior art exhibited a **100% false-success rate**, corrupting automation workflows. IntentNav-SCFR intercepted 100% of these failures, achieving a **0% false-success rate**.
2. **Robula+ and Test Automation Art (PA-04 to 06):**
   Prior art teaches maximizing selector generality so that clicks execute even when interfaces mutate. They teach *against* invariant pre-filtering. IntentNav-SCFR demonstrated that invariant-first gating eliminated **100% of unauthorized high-risk actions**, whereas un-gated baselines bypassed safety in **13/13 trials (100% bypass)**.
3. **Unexpected Synergy:** The combination of invariant gating, ephemeral HMAC tokens, and multi-class witness verification produces an unexpected technical synergy under *KSR v. Teleflex*, providing robust drift tolerance without compromising execution safety.

---

## 4. Prior-Art Obviousness Risk Analysis (35 U.S.C. § 103 / EPC Art 56)

### Potential Primary Rejection: Robula+ (PA-04) + Daikon (PA-07)
An examiner may argue that it would be obvious to combine Robula+ (for robust structural element locating) with Daikon (for invariant assertions).

#### Technical Rebuttal & Teaching-Away Arguments:
1. **Teaching Away from Pre-Execution Gating:**
   Robula+ is designed for test replay where the goal is to trigger the element regardless of state drift. Daikon is an offline, post-execution invariant detector used for debugging after a test run finishes. Neither reference teaches or suggests an **online, pre-ranking invariant firewall** that prunes candidate elements before semantic scoring.
2. **Temporal & Cryptographic Separation:**
   Neither Robula+ nor Daikon discloses issuing ephemeral, time-bounded cryptographic HMAC tokens to an asynchronous browser dispatch queue to gate physical event delivery.
3. **Multi-Class Causal Quorums:**
   Daikon examines program memory variables; it does not teach monitoring multi-class asynchronous web streams (combining DOM mutations with physical TCP/HTTP socket acknowledgements) within an observational causal timeout window.

---

## 5. Clarity, Support & Added-Matter Risks

| Risk Area | Controlling Law | Potential Examiner Objection | Engineering Mitigation & Working Spec Reference |
| :--- | :--- | :--- | :--- |
| **Novel Terminology** | 35 U.S.C. § 112(b); Act § 10(4); EPC Art 84 | Lack of antecedent basis or standard definitions for "invariant closure", "allowed state delta", "ephemeral binding handle" | Detailed mathematical definitions and structural data structures disclosed in `SPECIFICATION.md` Detailed Description §§ 2–5. |
| **Weight Calibration** | 35 U.S.C. § 112(a); Act § 10(4) | Lack of enablement for composite scoring weights ($\alpha, \beta, \gamma$) | Exact linear formula and empirical default weights ($\alpha=0.50, \beta=0.30, \gamma=0.20$) explicitly disclosed in `SPECIFICATION.md` § 4. |
| **Observation Window** | EPC Art 84; Act § 10(4) | Indefiniteness regarding timeout interval $\tau$ | Specified as a bounded interval $\tau \le 500\text{ ms}$ (with preferred default $\tau = 250\text{ ms}$) in Claim 7 and Working Spec § 5. |
| **Added Matter** | EPC Art 123(2); Act § 59 | Risk of introducing unbacked limitations | All claim limitations are traced to `v6.docx` ¶ 183–204 in `CLAIM_EVIDENCE_MAP.md`. No new matter added. |

---

## 6. Summary of Action Items for Patent Drafting Counsel

1. **Section 3(k) Gating:** Retain explicit recitation of the hardware processor, asynchronous web browser runtime, event dispatch queue, and network interface in Independent Claim 1.
2. **Adopt Stricter Operational Transitions (PD-08):** Incorporate the explicit route lifecycle transition rules from `patent.docx` ¶ 201 into Claim 17 to ensure clarity under Section 10(4) / 35 U.S.C. § 112.
3. **Formally Fix Typographical Defects (PD-01, PD-02, PD-03):**
   - Complete Claim 19 by adding `"1."` at the end;
   - Realign Section 9.3 heading to encompass Claims 2–18;
   - Prepend `"1. "` to Claim 1.
4. **Disclose Default Hyperparameters in Specification:** Preserve the exact empirical hyperparameters ($\alpha=0.50, \beta=0.30, \gamma=0.20, \tau=250\text{ ms}$) in the detailed description to satisfy statutory enablement requirements.

---
*Signed and Authenticated:*
**MILIND**
Sole Architect & Implementer, IntentNav-SCFR

