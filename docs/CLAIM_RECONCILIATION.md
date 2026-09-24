# IntentNav-SCFR: Authoritative Patent Requirements & Claim Reconciliation

**Document Version:** 2.0 (Corrected Baseline)  
**Reconciliation Target:** Union of technically compatible requirements across authoritative disclosure documents with `v6.docx` controlling priority.  
**Governing Standard:** Strict evidentiary traceability, zero fabricated empirical claims, explicit distinction between simulated DOM and live browser E2E, and separation of protocol targets from established empirical proof.

---

## 1. Document Inventory

The IntentNav-SCFR invention is disclosed across three authoritative patent specification and disclosure documents located in `docs/patent-requirements/`. These documents represent distinct drafting and strengthening iterations of the same core invention.

| Priority | Document File | Size | Statutory Focus | Total Claims in Sec. 9 | Key Distinguishing Additions |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **1 (Highest)** | `docs/patent-requirements/v6.docx` | 2,195,824 bytes | Strengthened Patent Specification | 20 Claims (1–20) | Comprehensive 20-claim structure, explicit machine-readable validation record fields in Claim 1(j), normalized evidence signature in Claim 1(l), full statutory parallel claims (19–20). Controls all direct conflicts and variations. |
| **2** | `docs/patent-requirements/patent.docx` | 960,108 bytes | Strengthened Patent Application Draft | 20 Claims (1–20) | Strengthens claim fallbacks: adds contextual/learned ranking limits in Claim 5; bounded verification interval & fallback in Claim 7; explicit state machine transitions in Claim 17; functional equivalence boundaries in Claim 18; formal 5-part definition of "causal" in §7.14. |
| **3** | `docs/patent-requirements/INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` | 1,324,771 bytes | Audited IDF-B Technical Disclosure | 17 Claims in Sec. 9 + Sec. L Candidate Claims | Contains rich technical architectural disclosures in Sections A–N: multi-layer fingerprint table (§B), explicit mathematical drift and re-binding formulas (§D), confidence/risk matrix (§F), prototype test site specs (§J), and experimental validation plan (§K). |

### Interpretation & Priority Rules
1. **Controlling Authority**: `v6.docx` has the highest priority when there is a direct conflict between versions.
2. **Union of Compatible Limitations**: A limitation that appears only in `patent.docx` or `Merged_Final_v3.docx` must NOT be discarded if it is technically compatible with `v6.docx`. The implementation target is the complete union of all compatible limitations.
3. **Preservation of Stricter Standards**: If a secondary document discloses a stricter compatible limitation or tighter boundary (e.g., explicit state transitions or tighter negative boundaries), the stricter limitation is preserved.
4. **Source-of-Truth Rule**: The original DOCX files remain authoritative. This reconciliation document is a derived engineering requirements artifact and must never override or distort the source disclosures.

---

## 2. Claim Numbering in Each Document

The three documents employ different claim numbering structures, particularly in Section 9 and Section L. The following matrix cross-references all claims to establish a unified internal normalized ID schema.

| Normalized ID | Normalized Title | `v6.docx` Claim # | `patent.docx` Claim # | `Merged_Final_v3.docx` Claim # | Notes / Mapping Rationale |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **REQ-C1** | Independent Method Claim | Claim 1 | Claim 1 | Claim 1 (Sec. 9.2) & Cand. Claim 1 (Sec. L) | 14 core limitations (a)–(n); v6 and patent include explicit validation record and quarantined signature requirements. |
| **REQ-C2** | Volatile Presentation Attribute Suppression | Claim 2 | Claim 2 | Claim 2 (Sec. 9.3) & Sec. L | Generated IDs, transient classes, coordinates excluded from identity. |
| **REQ-C3** | Invariant Closure (Positive/Negative Predicates) | Claim 3 | Claim 3 | Claim 3 (Sec. 9.3) & Sec. L | Mandatory positive must hold; negative must not hold; pre-ranking rejection. |
| **REQ-C4** | 5D Typed Interface-Drift Vector | Claim 4 | Claim 4 | Claim 4 (Sec. 9.3) & Sec. L | Separate $[P, C, S, Cap, T]$; presentation-only drift does not invalidate. |
| **REQ-C5** | Strict Pre-Ranking Gate & Similarity Limits | Claim 5 | Claim 5 | Claim 5 (Sec. 9.3) & Sec. L | Re-binding evaluated only post-gate; similarity cannot override invariant. |
| **REQ-C6** | Contradiction Predicates & Decoy Rejection | Claim 6 | Claim 6 | Claim 6 (Sec. 9.3) & Sec. L | Rejects high-similarity decoys, forbidden destination/post-states. |
| **REQ-C7** | Ordered Transition Signature & Witness Quorum | Claim 7 | Claim 7 | Claim 7 (Sec. 9.3) | Sequence: pre-state, activation, delta, interval, post-state; $\ge 2$ classes. |
| **REQ-C8** | Six Transition Witness Classes | Claim 8 | Claim 8 | Claim 8 (Sec. 9.3) | DOM, A11y, History, Client-Route, App-State, Async Ack. |
| **REQ-C9** | Provisional Route Quarantine & Negative Evidence | Claim 9 | Claim 9 | Claim 9 (Sec. 9.3) | Recovered routes stored provisional; promoted only on verification. |
| **REQ-C10** | Route Demotion, Rollback & History | Claim 10 | Claim 10 | Claim 10 (Sec. 9.3) | Validation failure demotes active; restores previous or re-binds. |
| **REQ-C11** | Local Browser-Resident Privacy Boundary | Claim 11 | Claim 11 | Claim 11 (Sec. 9.3) | Zero credential/token egress to external inference services. |
| **REQ-C12** | Browser Extension Component Architecture | Claim 12 | Claim 12 | Claim 12 (Sec. 9.3) & Sec. J | Content script, service worker, store, graph engine, controller. |
| **REQ-C13** | Fail-Safe Abstention & Suggestion States | Claim 13 | Claim 13 | Claim 13 (Sec. 9.3) & Sec. L | Enters abstention/confirmation when witnesses unavailable or contradictory. |
| **REQ-C14** | Decoupled Risk Gate & Multi-Source Quorum | Claim 14 | Claim 14 | Claim 14 (Sec. 9.3) & Sec. G | High-risk requires semantic + invariant + transition quorum; confidence $\neq$ auth. |
| **REQ-C15** | Validation Record Timestamping & Ordering | Claim 15 | Claim 15 | Described in Sec. 9.6A | Stores monotonic activation timestamp/sequence ID and witness timestamps. |
| **REQ-C16** | Quarantined Negative Evidence Signature | Claim 16 | Claim 16 | Described in Sec. 9.6A | Normalized failed invariant/contradiction signature suppresses repeat selection. |
| **REQ-C17** | Route Version State Machine Transitions | Claim 17 | Claim 17 | Described in Sec. 7.14 / 9.6A | States: Provisional, Validated, Demoted, Quarantined; non-confidence transitions. |
| **REQ-C18** | Route Confidence Multi-Factor Formulation | Claim 18 | Claim 18 | Claim 15 (Sec. 9.4) | Factors: semantic, context, transition, validation, staleness, risk, cost. |
| **REQ-C19** | Computing System Statutory Claim | Claim 19 | Claim 19 | Claim 16 (Sec. 9.4) | Hardware processor, browser interface observer, store, engines, controller. |
| **REQ-C20** | Computer-Readable Medium Statutory Claim | Claim 20 | Claim 20 | Claim 17 (Sec. 9.4) | Non-transitory storage medium storing executable instructions. |

---

## 3. Complete Independent Claim Comparison

Independent Claim 1 defines the foundational computer-implemented method. The text across `v6.docx`, `patent.docx`, and `Merged_Final_v3.docx` is deconstructed into **26 atomic technical limitations** (`REQ-C1-A` through `REQ-C1-Z`).

### Comparative Text Analysis of Claim 1
- **Preamble & Elements (a)–(i)**: Substantively identical across all three documents. `v6.docx` and `patent.docx` contain identical wording. `Merged_Final_v3.docx` (Sec. 9.2) contains identical substantive limitations, with minor paragraphing distinctions.
- **Element (j)**:
  - `v6.docx` & `patent.docx`: *"(j) creating a provisional route version and a machine-readable validation record for a selected candidate, the validation record storing at least the candidate identity, typed drift vector, invariant results, contradiction results, route version identifier, and transition-verification state;"*
  - `Merged_Final_v3.docx`: *"(j) creating a provisional route version for a selected candidate and performing a safe, non-destructive or reversible verification operation when permitted;"*
  - *Reconciliation*: `v6.docx` controls. The explicit creation of the machine-readable validation record containing all six mandatory fields is strictly required. The reversible verification operation is preserved under Element (k).
- **Element (k)**:
  - `v6.docx` & `patent.docx`: *"(k) performing a safe, non-destructive or reversible verification operation when permitted and correlating an activation event produced by the selected candidate with an ordered transition signature comprising an expected state delta and a bounded verification interval containing one or more independent transition witnesses, and accepting the candidate only when the observed witnesses are causally consistent with the expected transition signature;"*
  - `Merged_Final_v3.docx`: Correlates activation event with ordered transition signature (having placed the verification operation in (j)).
  - *Reconciliation*: Fully compatible organization difference. Both require non-destructive verification, ordered transition signatures, bounded intervals, and causal consistency.
- **Element (l)**:
  - `v6.docx` & `patent.docx`: *"(l) promoting the provisional route version to an active validated route only after the invariant-closure gate and transition-verification acceptance condition are satisfied, while storing failed or contradictory candidates as quarantined negative evidence associated with the failed predicate or evidence signature;"*
  - `Merged_Final_v3.docx`: *"...while storing failed or contradictory candidates as quarantined negative evidence;"*
  - *Reconciliation*: `v6.docx` controls and provides the stricter requirement: quarantined negative evidence must be explicitly indexed/associated with the failed predicate or evidence signature.
- **Elements (m)–(n)**: Verbatim identical across all three documents: separation of capability confidence from execution authorization; risk policy gating; abstention/suggestion/confirmation states.

---

## 4. Complete Dependent Claim Comparison

The following details the verbatim text, substantive scope, and wording differences across Dependent Claims 2–20:

### Claim 2: Volatile Presentation Attribute Suppression
- **`v6.docx` (Claim 2)**: *The method of claim 1, wherein volatile presentation attributes comprise generated DOM identifiers, transient framework classes, randomized tokens, exact coordinates, session-specific labels, or equivalent short-lived attributes, and the volatile attributes are prevented from independently establishing capability identity.*
- **`patent.docx` (Claim 2)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 2)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C2`).

### Claim 3: Invariant Closure Normalization
- **`v6.docx` (Claim 3)**: *The method of claim 1, wherein the canonical capability identity tuple is normalized into an invariant closure comprising positive predicates that must hold and negative predicates that must not hold, and a candidate failing any mandatory positive predicate or satisfying any negative predicate is rejected before similarity ranking.*
- **`patent.docx` (Claim 3)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 3)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C3`).

### Claim 4: Typed Interface-Drift Vector
- **`v6.docx` (Claim 4)**: *The method of claim 1, wherein the typed interface-drift vector comprises separate measurements for presentation, context, structure, capability semantics, and transition behavior, and wherein presentation-only drift does not by itself invalidate an otherwise verified route.*
- **`patent.docx` (Claim 4)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 4)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C4`).

### Claim 5: Re-Binding Score Evaluation & Similarity Limits
- **`v6.docx` (Claim 5) & `Merged_Final_v3.docx` (Claim 5)**: *The method of claim 1, wherein the re-binding score is evaluated only for candidates that pass the invariant-closure gate, such that semantic similarity cannot compensate for failure of a mandatory functional predicate.*
- **`patent.docx` (Claim 5 - Stricter)**: *The method of claim 1, wherein the semantic/re-binding score is evaluated only for candidates that pass the invariant-closure gate, such that semantic similarity, contextual similarity, or a learned ranking value cannot compensate for failure of a mandatory functional predicate and cannot by itself authorize route promotion.*
- **Reconciliation**: Preserved stricter `patent.docx` limitation. Semantic, contextual, or learned ranking values are barred from overriding invariants and barred from authorizing promotion (`REQ-C5`).

### Claim 6: Contradiction Predicates & Decoy Rejection
- **`v6.docx` (Claim 6)**: *The method of claim 1, wherein a contradiction predicate identifies at least one decoy action, target entity, forbidden destination state, incompatible post-state, or incompatible transition, whereby a candidate having a higher semantic similarity than an accepted candidate is nevertheless rejected.*
- **`patent.docx` (Claim 6)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 6)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C6`).

### Claim 7: Transition Signature & Witness Quorum
- **`v6.docx` (Claim 7) & `Merged_Final_v3.docx` (Claim 7)**: *The method of claim 1, wherein the transition signature specifies an ordered sequence comprising a pre-state, a candidate activation event, an expected state delta, a verification interval, and a post-state, and wherein at least two independently observable witness classes are correlated within the verification interval before route promotion.*
- **`patent.docx` (Claim 7 - Stricter / Clarified)**: *...a bounded verification interval measured from the activation event, and a post-state, and wherein at least two independently observable witness classes are correlated within the verification interval before route promotion when at least two such witness classes are available.*
- **Reconciliation**: Preserved `patent.docx` clarification: interval is bounded and measured from activation event; $\ge 2$ independent witness classes required before promotion where available (`REQ-C7`).

### Claim 8: Transition Witness Classes
- **`v6.docx` (Claim 8)**: *The method of claim 1, wherein a transition witness is selected from DOM mutation, accessibility-state mutation, history-state mutation, client-side route-state mutation, application-state mutation, or an asynchronous transaction acknowledgement.*
- **`patent.docx` (Claim 8)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 8)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C8`).

### Claim 9: Provisional Quarantine State
- **`v6.docx` (Claim 9) & `Merged_Final_v3.docx` (Claim 9)**: *...promoted to an active validated route only after the invariant-closure gate and transition acceptance condition are satisfied, and wherein a failed route is retained as negative evidence.*
- **`patent.docx` (Claim 9 - Stricter)**: *...promoted to an active validated route only after the invariant-closure gate and causal transition-verification acceptance condition are satisfied, and wherein a failed route is retained as quarantined negative evidence.*
- **Reconciliation**: Stricter `patent.docx` language adopted (`REQ-C9`).

### Claim 10: Route Demotion & Rollback
- **`v6.docx` (Claim 10)**: *The method of claim 1, wherein a subsequent validation failure demotes an active route version and restores a previously validated route version or forces fresh re-binding, while preserving the failed route as historical evidence.*
- **`patent.docx` (Claim 10)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 10)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C10`).

### Claim 11: Local Browser Runtime & Zero-Egress Privacy
- **`v6.docx` (Claim 11)**: *The method of claim 1, wherein the browser-resident processing subsystem performs intent normalization, interface observation, drift localization, invariant closure, candidate ranking, transition verification, route promotion, and risk gating locally within the browser runtime without transmitting session credentials or authentication tokens to an external inference service.*
- **`patent.docx` (Claim 11)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 11)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C11`).

### Claim 12: Browser Extension Architecture
- **`v6.docx` (Claim 12)**: *The method of claim 1, wherein the browser-resident processing subsystem comprises an extension content script, a background service worker, a local capability store, a graph engine, and a verification controller communicating through an extension messaging interface.*
- **`patent.docx` (Claim 12)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 12)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C12`).

### Claim 13: Non-Silent Fallback State Machine
- **`v6.docx` (Claim 13)**: *The method of claim 1, wherein when required transition witnesses are unavailable, contradictory, or causally unrelated to the candidate activation event, the method prevents silent execution and enters the abstention, ranked-suggestion, or confirmation-required state.*
- **`patent.docx` (Claim 13)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 13)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C13`).

### Claim 14: High-Risk Evidence Quorum
- **`v6.docx` (Claim 14)**: *The method of claim 1, wherein high-risk execution requires an evidence quorum comprising at least semantic evidence, functional invariant evidence, and transition-state evidence, and wherein high capability confidence cannot override failure of the evidence quorum.*
- **`patent.docx` (Claim 14)**: Verbatim identical.
- **`Merged_Final_v3.docx` (Claim 14)**: Verbatim identical.
- **Reconciliation**: 100% unified requirement (`REQ-C14`).

### Claim 15: Validation Record Monotonic Sequencing
- **`v6.docx` (Claim 15) & `patent.docx` (Claim 15)**: *The method of claim 1, wherein the machine-readable validation record further stores an activation-event timestamp or sequence identifier and respective timestamps or sequence identifiers of the transition witnesses, and wherein a witness that does not satisfy the configured ordering and verification interval is excluded from the route-promotion condition.*
- **`Merged_Final_v3.docx`**: Disclosed substantively in Section 9.6A and Section H.
- **Reconciliation**: Formalized as mandatory requirement `REQ-C15`.

### Claim 16: Quarantined Negative Evidence Signature
- **`v6.docx` (Claim 16)**: *...identifying at least a failed invariant or contradiction predicate...*
- **`patent.docx` (Claim 16 - Stricter)**: *...identifying at least the specific failed invariant or contradiction predicate, and wherein the signature is used to suppress repeated selection of the materially unchanged rejected candidate until material interface evidence changes.*
- **`Merged_Final_v3.docx`**: Disclosed substantively in Section 9.6A and Section C.
- **Reconciliation**: Formalized as mandatory requirement `REQ-C16` using specific failed predicate identification.

### Claim 17: Route Version State Machine Transitions
- **`v6.docx` (Claim 17)**: *...state machine comprising at least provisional, validated, demoted, and quarantined states, and wherein a transition between the states is caused by an invariant result or transition-witness result rather than by a confidence score alone.*
- **`patent.docx` (Claim 17 - Stricter)**: *...wherein a provisional route is promoted to validated only after invariant and causal transition-verification acceptance, a validated route is demoted upon a subsequent verification or invariant failure, and a failed or contradictory candidate is quarantined, and wherein each transition between the states is caused by an invariant result or transition-witness result rather than by a confidence score alone.*
- **`Merged_Final_v3.docx`**: Disclosed in Section 7.14 and Section 9.6A.
- **Reconciliation**: Preserved explicit state transition rules as `REQ-C17`.

### Claim 18: Multi-Factor Route Confidence & Negative Boundaries
- **`v6.docx` (Claim 18) & `Merged_Final_v3.docx` (Claim 15)**: *...incorporates semantic fit, contextual fit, transition consistency, prior validation confidence, route staleness, operation risk, and path cost, and wherein the resulting confidence value cannot by itself authorize a high-risk operation.*
- **`patent.docx` (Claim 18 - Stricter)**: *...cannot by itself establish functional equivalence, promote an unverified route, or authorize a high-risk operation.*
- **Reconciliation**: Preserved stricter negative boundaries as `REQ-C18`.

### Claim 19: Statutory Computing System Claim
- **`v6.docx` (Claim 19)**: Contains typographical truncation (*"configured to perform the method of claim"*).
- **`patent.docx` (Claim 19) & `Merged_Final_v3.docx` (Claim 16)**: Completes truncation: *"configured to perform the method of claim 1."*
- **Limitation**: Computing system comprising processor(s), browser interface observer, capability graph store, drift engine, invariant engine, transition controller, authorization engine (`REQ-C19`).

### Claim 20: Statutory Storage Medium Claim
- **`v6.docx` (Claim 20), `patent.docx` (Claim 20), `Merged_Final_v3.docx` (Claim 17)**: Verbatim identical substantive scope.
- **Limitation**: Non-transitory computer-readable storage medium storing instructions causing a browser-resident processing device to perform the method of claim 1 (`REQ-C20`).

---

## 5. Atomic Limitation Breakdown

The following table itemizes every atomic technical limitation extracted from Claims 1 through 20:

| Atomic ID | Source Element | Atomic Technical Limitation |
| :--- | :---: | :--- |
| **REQ-C1-A** | Claim 1(a) | Receipt of natural-language objective specifying requested functional operation by browser-resident processing subsystem. |
| **REQ-C1-B** | Claim 1(b) | Live interface observation acquiring multi-source interface evidence: document-structure, accessibility, semantic, contextual, transition. |
| **REQ-C1-C** | Claim 1(c-1) | FCF Canonical identity tuple: action type, target entity, pre-state predicates, allowed state delta, expected post-state, required context, forbidden context/functional, transition signature, risk class. |
| **REQ-C1-D** | Claim 1(c-2) | Volatile presentation attribute suppression: volatile features excluded from identity or assigned reduced identity weight. |
| **REQ-C1-E** | Claim 1(d-1) | Capability-state graph: persistent capability nodes distinct from transient interface-state nodes. |
| **REQ-C1-F** | Claim 1(d-2) | Capability association with plurality of versioned routes over time. |
| **REQ-C1-G** | Claim 1(e) | Matching natural-language objective to persistent capability node and obtaining previously validated route version. |
| **REQ-C1-H** | Claim 1(f) | Generating 5D typed interface-drift vector distinguishing presentation, context, structure, capability, transition drift. |
| **REQ-C1-I** | Claim 1(g-1) | Replay inhibition: inhibiting automatic replay of previously validated route upon drift re-binding condition. |
| **REQ-C1-J** | Claim 1(g-2) | Live candidate generation: discovering candidate interactive controls from live DOM associated with capability node. |
| **REQ-C1-K** | Claim 1(h-1) | Invariant-closure gate positive evaluation: requiring satisfaction of mandatory action, target, pre-state, delta, post-state, context predicates. |
| **REQ-C1-L** | Claim 1(h-2) | Invariant-closure gate negative evaluation: immediate rejection upon satisfaction of forbidden contextual or functional predicate. |
| **REQ-C1-M** | Claim 1(i-1) | Strict pre-ranking gate ordering: candidate ranking score evaluated ONLY AFTER candidate passes invariant-closure gate. |
| **REQ-C1-N** | Claim 1(i-2) | Multi-factor re-binding scoring incorporating semantic fit, contextual fit, transition fit, validation history, contradiction evidence, route staleness. |
| **REQ-C1-O** | Claim 1(j-1) | Provisional route creation: placing selected candidate in unpromoted provisional route state. |
| **REQ-C1-P** | Claim 1(j-2) | Machine-readable validation record generation storing candidate identity, drift vector, invariant results, contradiction results, route version ID, transition state. |
| **REQ-C1-Q** | Claim 1(k-1) | Non-destructive verification: performing safe, non-destructive or reversible verification operation when permitted. |
| **REQ-C1-R** | Claim 1(k-2) | Activation event correlation: correlating candidate activation event with ordered transition signature and expected state delta. |
| **REQ-C1-S** | Claim 1(k-3) | Bounded verification interval: measuring transition witnesses within bounded time interval $W$ measured from activation event. |
| **REQ-C1-T** | Claim 1(k-4) | Causal consistency check: accepting candidate only when observed witnesses are causally consistent (rejecting pre-existing or unrelated mutations). |
| **REQ-C1-U** | Claim 1(l-1) | Conditional promotion: promoting provisional route to active validated route ONLY when both invariant gate AND transition verification are satisfied. |
| **REQ-C1-V** | Claim 1(l-2) | Quarantined negative evidence: storing failed or contradictory candidates in quarantine associated with failed predicate or evidence signature. |
| **REQ-C1-W** | Claim 1(m-1) | Capability confidence separation: maintaining capability confidence as an independent metric from execution authorization. |
| **REQ-C1-X** | Claim 1(m-2) | Independent execution authorization: determining execution authorization via operation-risk policy independently of capability confidence. |
| **REQ-C1-Y** | Claim 1(n-1) | Gated dispatch: dispatching requested operation only when execution-authorization condition is satisfied. |
| **REQ-C1-Z** | Claim 1(n-2) | Explicit safety fallback: entering abstention, ranked-suggestion, or confirmation-required state when execution authorization is withheld. |
| **REQ-C2** | Claim 2 | Suppressing generated DOM IDs, transient framework classes, randomized tokens, exact coordinates from capability identity. |
| **REQ-C3** | Claim 3 | Invariant closure positive/negative predicate normalization; failing mandatory positive or satisfying negative rejects before similarity ranking. |
| **REQ-C4** | Claim 4 | 5D Typed drift vector $[P, C, S, Cap, T]$; presentation-only drift does not invalidate an otherwise verified route. |
| **REQ-C5** | Claim 5 | Re-binding evaluated only post-gate; semantic, contextual, or learned score cannot compensate for invariant failure or authorize promotion. |
| **REQ-C6** | Claim 6 | Contradiction predicate identifying decoy action, target entity, forbidden destination state, incompatible post-state, or transition. |
| **REQ-C7** | Claim 7 | Transition signature ordered sequence; $\ge 2$ independently observable witness classes correlated within interval before promotion where available. |
| **REQ-C8** | Claim 8 | Six transition witness classes: DOM mutation, accessibility mutation, history mutation, client-route mutation, app-state mutation, async ack. |
| **REQ-C9** | Claim 9 | Provisional route quarantine state; route promoted only after invariant gate and causal transition verification; failed route stored as negative evidence. |
| **REQ-C10** | Claim 10 | Route demotion & rollback: subsequent failure demotes active route, restores previous validated route or forces fresh re-binding. |
| **REQ-C11** | Claim 11 | Local browser runtime execution: zero transmission of session credentials or auth tokens to external inference services. |
| **REQ-C12** | Claim 12 | Browser extension architecture: content script, background service worker, local store, graph engine, verification controller. |
| **REQ-C13** | Claim 13 | Non-silent fallback: enters abstention, ranked suggestion, or confirmation when witnesses are unavailable, contradictory, or unrelated. |
| **REQ-C14** | Claim 14 | High-risk execution evidence quorum: requires semantic + functional invariant + transition evidence; confidence cannot override quorum failure. |
| **REQ-C15** | Claim 15 | Monotonic timestamps/sequence IDs for activation event and witnesses; out-of-order or late witnesses excluded from promotion. |
| **REQ-C16** | Claim 16 | Quarantined negative evidence normalized signature identifying specific failed invariant/contradiction; suppresses repeated selection until interface changes. |
| **REQ-C17** | Claim 17 | Route version state machine: provisional promoted on verification; active demoted on failure; failed quarantined; non-confidence transitions. |
| **REQ-C18** | Claim 18 | Route confidence multi-factor formula; confidence cannot establish equivalence, promote unverified route, or authorize high-risk execution. |
| **REQ-C19** | Claim 19 | Computing system comprising processors, browser observer, capability graph store, drift engine, invariant engine, transition controller, authorization engine. |
| **REQ-C20** | Claim 20 | Non-transitory computer-readable storage medium storing instructions to perform the method of Claim 1. |

---

## 6. Additional Limitations Unique to Each Document

### Unique to `patent.docx`
1. **Formal 5-Part Definition of "Causal" (§7.14)**:
   Explicitly defines the 5 conditions required to establish causal transition verification:
   - (1) Specific candidate activation event occurs;
   - (2) Defined expected state delta;
   - (3) Expected delta observed within bounded verification interval measured from activation;
   - (4) Supported by ordered, independently observable witness classes ($\ge 2$ when available);
   - (5) Temporally ordered and causally consistent with activation event and expected delta.
2. **Explicit Route State Machine Transitions (Claim 17)**:
   Specifies the exact lifecycle mechanics: provisional $\to$ validated on verification pass; validated $\to$ demoted on subsequent failure; failed/contradictory $\to$ quarantined.
3. **Stricter Route Confidence Negative Boundaries (Claim 18)**:
   Adds that confidence value cannot by itself *"establish functional equivalence, promote an unverified route, or authorize a high-risk operation."*
4. **Ranking Similarity Limits (Claim 5)**:
   Specifies that neither semantic similarity, contextual similarity, NOR a learned ranking value can compensate for invariant failure or authorize route promotion.

### Unique to `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx`
1. **Multi-Layer Functional Capability Fingerprint Table (§B)**:
   Provides explicit tabular decomposition of fingerprint layers: Invariant Core, Semantic Evidence, Context Evidence, Transition Evidence, and Risk Metadata.
2. **Mathematical Drift Score Formulation (§D)**:
   Discloses the formula:
   $$\text{Drift} = \sum \alpha_i (1 - \text{EvidenceSimilarity}_i) + \beta \cdot \text{TransitionMismatch} + \gamma \cdot \text{StructuralChange}$$
3. **Mathematical Re-Binding Score Formulation (§D)**:
   Discloses the conceptual scoring formula:
   $$\text{RebindScore} = w_1 \cdot \text{InvariantFit} + w_2 \cdot \text{SemanticFit} + w_3 \cdot \text{ContextFit} + w_4 \cdot \text{TransitionFit} + w_5 \cdot \text{ValidationHistory} - w_6 \cdot \text{Contradiction} - w_7 \cdot \text{Staleness}$$
4. **Confidence / Risk Execution Decision Matrix (§F)**:
   Discloses the 4-cell behavioral matrix:
   - High Confidence / Low Risk $\implies$ Automatic execution permitted.
   - High Confidence / Medium Risk $\implies$ Action summary or confirmation.
   - High Confidence / High Risk $\implies$ Explicit confirmation required; zero silent execution.
   - Low Confidence / Any Risk $\implies$ Abstain / ranked suggestion.
5. **Strengthened Prototype Test Site Specifications (§J)**:
   Specifies 4 mock site architectures: Site A (original hierarchy/labels), Site B (renamed controls/reordered menus), Site C (changed DOM IDs/classes, intermediate dialog, altered hierarchy), Site D (adversarial semantic decoys & destructive traps).
6. **Candidate Independent Claim 1 & Dependent Features (Section L)**:
   Alternative consolidated claim language for practitioner review.

---

## 7. Corresponding Limitations Across Versions

The following table maps equivalent technical mechanisms disclosed under differing terminology or section arrangements across the three documents:

| Technical Mechanism | `v6.docx` Representation | `patent.docx` Representation | `Merged_Final_v3.docx` Representation | Reconciled Standard |
| :--- | :--- | :--- | :--- | :--- |
| **Validation Record** | Claim 1(j), Claim 15, §9.6A | Claim 1(j), Claim 15, §9.6A | §9.6A, §H | Mandatory 6-field record with sequence IDs |
| **Negative Evidence** | Claim 1(l), Claim 9, Claim 16 | Claim 1(l), Claim 9, Claim 16 | Claim 1(l), Claim 9, §7.14, §C | Normalized signature indexed by failed predicate |
| **Witness Quorum** | Claim 7 ($\ge 2$ classes) | Claim 7 ($\ge 2$ classes when available) | Claim 7 ($\ge 2$ classes), §7.14 | $\ge 2$ classes for active promotion where available |
| **Confidence vs Auth** | Claim 1(m), Claim 14, §7.8 | Claim 1(m), Claim 14, §7.8 | Claim 1(m), Claim 14, §7.8, §F | Independent risk gate; zero high-risk bypass |
| **Route State Machine** | Claim 17, §7.14, §9.6A | Claim 17 (explicit transitions), §7.14 | §7.14, §9.6A, §H | States: Provisional, Validated, Demoted, Quarantined |
| **Drift Localization** | Claim 1(f), Claim 4, §7.12 | Claim 1(f), Claim 4, §7.13 | Claim 1(f), Claim 4, §7.13, §D | 5D vector $[P, C, S, Cap, T]$ with typed thresholds |

---

## 8. Document Differences, Interpretive Variations & Genuine Conflict Analysis

A rigorous comparative examination of the text across all three documents reveals that there are **ZERO irreconcilable technical contradictions** between the documents. The identified differences fall into two categories: **Document Drafting Differences** and **Interpretive Variations / Fallback Ambiguities**.

### Document Drafting Differences (8 Total)
1. **Claim Numbering in Merged Final v3**: Contains 17 claims in Section 9; Claims 15–17 of v6/patent appear as disclosure text in §9.6A and §H rather than statutory claims; Claim 18 is numbered Claim 15; Claim 19 is numbered Claim 16; Claim 20 is numbered Claim 17.
2. **Sections A–N in Merged Final v3**: Sections A through N appear exclusively in `Merged_Final_v3.docx`.
3. **Section L Candidate Claims**: Appears exclusively in `Merged_Final_v3.docx`.
4. **Formal 5-Part Definition of "Causal"**: Appears in §7.14 of `patent.docx`.
5. **Typographical Truncation in v6 Claim 19**: `v6.docx` accidentally truncates *"method of claim"*; completed as *"method of claim 1."* in `patent.docx` and `Merged_Final_v3.docx`.
6. **Explicit Route State Machine Transitions**: Explicitly detailed in `patent.docx` Claim 17.
7. **Negative Boundaries in Claims 5 and 18**: Stricter boundaries (*"or a learned ranking value"*, *"cannot establish functional equivalence"*) appear in `patent.docx`.
8. **Claim 1(j)/(l) Specificity**: Explicit 6-field validation record and failed predicate signature indexing in `v6.docx` and `patent.docx`.

### Interpretive Variations & Fallback Ambiguities (3 Total)

#### 1. Witness Quorum Fallback Ambiguity (Claim 7)
- **Texts**:
  - `v6.docx` Claim 7: *"...at least two independently observable witness classes are correlated within the verification interval before route promotion."*
  - `patent.docx` Claim 7: *"...at least two independently observable witness classes are correlated within the verification interval before route promotion when at least two such witness classes are available."*
  - `Merged_Final_v3.docx` §7.14: *"...two or more independent witness classes when available..."*
- **Analysis**: This is a requirement variation and fallback ambiguity rather than an irreconcilable contradiction. If an interface physically emits only one witness class (e.g. an isolated DOM toggle), `v6.docx` strictly governs active route promotion. The system does NOT invent silent single-witness route promotion; instead, it retains the candidate in `PROVISIONAL` quarantine or transitions to `CONFIRMATION_REQUIRED` / `ABSTENTION` (satisfying Claim 13).

#### 2. Claim-Element Organization Difference in Claim 1(j)/(k)
- **Texts**:
  - `Merged_Final_v3.docx` places reversible verification probing inside element (j).
  - `v6.docx` and `patent.docx` dedicate element (j) to the creation of the machine-readable validation record and place reversible verification probing in element (k).
- **Analysis**: This is a pure claim-element drafting/organization difference. Both technical functions are fully compatible: (1) provisional route creation and machine-readable validation record generation, and (2) safe/reversible verification operation with transition signature correlation. `v6.docx` controls the element organization and mandates the 6-field validation record.

#### 3. Invariant Closure Boolean Pre-Ranking Gate vs. Conceptual Scoring Formula (§D vs. Claim 1(h)/(i))
- **Texts**:
  - `Merged_Final_v3.docx` §D presents a high-level conceptual formula:
    $$\text{RebindScore} = w_1 \cdot \text{InvariantFit} + w_2 \cdot \text{SemanticFit} + \dots$$
  - Claim 1(h)/(i) and Claim 5 in all three documents explicitly mandate that invariant closure is an unbypassable pre-ranking gate: candidates failing any mandatory invariant or triggering any forbidden predicate are rejected *before* similarity ranking.
- **Analysis**: This is an interpretive variation between a high-level descriptive formula and statutory claim limitations. The statutory claims control: invariant closure is a boolean eligibility gate ($[0, 1] \to \{ \text{PASS}, \text{FAIL} \}$). The scoring formula operates strictly post-gate on admissible candidates (where $\text{InvariantFit} = 1.0$). Semantic similarity can never compensate for an invariant violation.

---

## 9. v6-Controlled Conflict & Variation Resolutions

In accordance with the Document Priority Rule, `v6.docx` controls the technical implementation:

### Ruling 1: Witness Quorum & Promotion Policy
- For route promotion to `ACTIVE`, the `v6.docx` requirement of at least two independently observable witness classes controls where two such witness classes are available.
- If fewer than two qualifying independent witness classes are available on an interface, the system does NOT invent silent single-witness promotion. The route remains in `PROVISIONAL` quarantine, or transitions to `CONFIRMATION_REQUIRED` or `ABSTENTION` (consistent with Claim 13).

### Ruling 2: Invariant Gate Ordering
- Invariant closure is strictly a **boolean pre-ranking filter** ($[0, 1] \to \{ \text{PASS}, \text{FAIL} \}$). If any mandatory invariant fails or any forbidden predicate is satisfied, the candidate is immediately purged. Ranking occurs *only* among candidates where $\text{InvariantFit} = 1.0$.

### Ruling 3: Validation Record & Verification Probing
- Element (j) creates the provisional route AND generates the machine-readable validation record storing all 6 required fields (`candidate identity`, `typed drift vector`, `invariant results`, `contradiction results`, `route version identifier`, `transition-verification state`). Element (k) performs reversible verification probing and correlates the activation event with the transition signature.

---

## 10. Master Reconciled Requirements Traceability Matrix

The following matrix itemizes all 62 atomic requirements across separate evidentiary columns:
- **Requirement**: Normalized ID and Title.
- **Implementation**: Code file location.
- **Unit Test**: Test file exercising logic in isolation.
- **Integration Test**: Multi-module integration test (e.g. JSDOM browser simulation).
- **Browser E2E**: Real Google Chrome CDP headless test scenario (`scripts/runChromiumE2E.js` -> `evidence/chromium_e2e_evidence.json`).
- **Empirical Evidence**: Full experimental benchmark completion from raw browser trial records (`NO (Protocol Target)` unless full empirical data exists).
- **Status**: Highest verified development state (`IMPLEMENTED`, `UNIT TESTED`, `INTEGRATION TESTED`, `BROWSER E2E TESTED`, `EMPIRICALLY VERIFIED`).
- **Evidence Reference**: Exact artifact path and scenario/test identifier.

| Requirement | Implementation | Unit Test | Integration Test | Browser E2E | Empirical Evidence | Status | Evidence Reference |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **REQ-C1-A**: Local Intent Reception | `src/browser/contentScript.ts`, `src/core/intent/normalizer.ts` | `test/unit/intent.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A, B) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A, B)` |
| **REQ-C1-B**: Multi-Source Live Observation | `src/browser/observer/interfaceObserver.ts` | `test/unit/causal.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario C, D) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios C, D)` |
| **REQ-C1-C**: FCF 9-Tuple Identity | `src/types/capability.ts`, `src/core/storage/persistentStore.ts` | `test/unit/persistence.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/persistence.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 14)` |
| **REQ-C1-D**: Volatile Attribute Suppression | `src/core/fingerprint/suppressor.ts` | `test/unit/suppression.spec.ts` | `test/adversarial/matrix.spec.ts` | YES (Scenario E, F) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios E, F)` |
| **REQ-C1-E**: Graph Capability/State Separation | `src/core/graph/capabilityGraph.ts` | `test/unit/graph.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/graph.spec.ts`, `test/properties/properties.spec.ts (Prop 12)` |
| **REQ-C1-F**: Versioned Route Accumulation | `src/core/graph/routeManager.ts` | `test/unit/graph.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/graph.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 9)` |
| **REQ-C1-G**: Intent Matching & Route Retrieval | `src/core/intent/resolver.ts` | `test/unit/intent.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C1-H**: 5D Typed Drift Vector | `src/core/drift/detector.ts` | `test/unit/drift.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-F) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-F)` |
| **REQ-C1-I**: Drift-Triggered Replay Inhibition | `src/core/stateMachine/machine.ts` | `test/unit/drift.spec.ts` | `test/adversarial/matrix.spec.ts` | YES (Scenario A-F) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-F)` |
| **REQ-C1-J**: Live Candidate DOM Discovery | `src/core/candidate/generator.ts` | `test/unit/ordering.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C1-K**: Invariant Positive Closure | `src/core/invariant/engine.ts` | `test/unit/invariant.spec.ts` | `test/properties/properties.spec.ts` | YES (Scenario G, J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios G, J)` |
| **REQ-C1-L**: Invariant Negative Rejection | `src/core/invariant/predicates.ts` | `test/unit/invariant.spec.ts` | `test/adversarial/matrix.spec.ts` | YES (Scenario J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenario J)` |
| **REQ-C1-M**: Strict Pre-Ranking Gate Ordering | `src/core/candidate/pipeline.ts` | `test/unit/ordering.spec.ts` | `test/properties/properties.spec.ts` | YES (Scenario J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenario J)` |
| **REQ-C1-N**: Multi-Factor Post-Gate Ranking | `src/core/ranking/engine.ts` | `test/unit/ordering.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C1-O**: Provisional Route Quarantine | `src/core/quarantine/controller.ts` | `test/unit/quarantine.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/quarantine.spec.ts`, `test/properties/properties.spec.ts (Prop 3)` |
| **REQ-C1-P**: Machine-Readable Validation Record | `src/core/stateMachine/machine.ts` | `test/unit/audit.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/audit.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 13)` |
| **REQ-C1-Q**: Reversible Verification Probing | `src/core/stateMachine/machine.ts` | `test/unit/false_success.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario G, H) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios G, H)` |
| **REQ-C1-R**: Activation Event Correlation | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C1-S**: Bounded Verification Interval $W$ | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/causal.spec.ts`, `test/properties/properties.spec.ts (Prop 5)` |
| **REQ-C1-T**: Causal Consistency & Non-Spurious | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/properties/properties.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C1-U**: Conditional Route Promotion | `src/core/quarantine/promotion.ts` | `test/unit/quarantine.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/quarantine.spec.ts`, `test/properties/properties.spec.ts (Prop 3)` |
| **REQ-C1-V**: Quarantined Negative Evidence Store | `src/core/contradiction/store.ts` | `test/unit/ordering.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/ordering.spec.ts`, `test/properties/properties.spec.ts (Prop 14)` |
| **REQ-C1-W**: Confidence Separated from Auth | `src/core/authorization/controller.ts` | `test/unit/authorization.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/properties/properties.spec.ts (Prop 8)` |
| **REQ-C1-X**: Risk-Gated Execution Authorization | `src/core/authorization/controller.ts` | `test/unit/authorization.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 5)` |
| **REQ-C1-Y**: Gated Real DOM Dispatch | `src/browser/background.ts` | `test/unit/false_success.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C1-Z**: Executable Fallback States | `src/core/stateMachine/machine.ts` | `test/unit/authorization.spec.ts` | `test/adversarial/matrix.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/adversarial/matrix.spec.ts (Scenario G)` |
| **REQ-C2**: Volatile Feature Suppression | `src/core/fingerprint/suppressor.ts` | `test/unit/suppression.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario E, F) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios E, F)` |
| **REQ-C3**: Invariant Normalization | `src/core/invariant/predicates.ts` | `test/unit/invariant.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/invariant.spec.ts`, `test/properties/properties.spec.ts (Prop 1)` |
| **REQ-C4**: 5D Drift; Presentation Preserves | `src/core/drift/detector.ts` | `test/unit/drift.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-F) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-F)` |
| **REQ-C5**: Similarity Limits & Promotion Barrier | `src/core/candidate/pipeline.ts` | `test/unit/ordering.spec.ts` | `test/properties/properties.spec.ts` | YES (Scenario J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenario J)` |
| **REQ-C6**: Contradiction & Decoy Rejection | `src/core/contradiction/store.ts` | `test/unit/ordering.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenario J)` |
| **REQ-C7**: Transition Signature & Witness Quorum | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/causal.spec.ts`, `test/properties/properties.spec.ts (Prop 6)` |
| **REQ-C8**: Six Transition Witness Classes | `src/browser/observer/interfaceObserver.ts` | `test/unit/causal.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario C, D) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios C, D)` |
| **REQ-C9**: Provisional Quarantine Lifecycle | `src/core/quarantine/controller.ts` | `test/unit/quarantine.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/quarantine.spec.ts`, `test/properties/properties.spec.ts (Prop 3, 13)` |
| **REQ-C10**: Route Demotion & Historical Rollback | `src/core/graph/routeManager.ts` | `test/unit/graph.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/graph.spec.ts`, `test/properties/properties.spec.ts (Prop 7)` |
| **REQ-C11**: Browser-Resident Zero-Egress Privacy | `src/core/intent/normalizer.ts` | `test/unit/security_privacy.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C12**: Browser Extension MV3 Architecture | `src/browser/` (`dist/`) | `test/unit/binding_handle.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-C13**: Non-Silent Fallback State Machine | `src/core/stateMachine/machine.ts` | `test/unit/causal.spec.ts` | `test/adversarial/matrix.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/causal.spec.ts`, `test/adversarial/matrix.spec.ts (Scenario G)` |
| **REQ-C14**: High-Risk Multi-Source Quorum | `src/core/authorization/quorum.ts` | `test/unit/authorization.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/properties/properties.spec.ts (Prop 8, 9)` |
| **REQ-C15**: Validation Monotonic Sequence IDs | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/causal.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 10)` |
| **REQ-C16**: Negative Evidence Predicate Signature | `src/core/contradiction/store.ts` | `test/unit/ordering.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/ordering.spec.ts`, `test/properties/properties.spec.ts (Prop 14)` |
| **REQ-C17**: Explicit Route State Machine | `src/core/graph/routeManager.ts` | `test/unit/quarantine.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/quarantine.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 6)` |
| **REQ-C18**: Multi-Factor Confidence Limits | `src/core/ranking/engine.ts` | `test/unit/ordering.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/ordering.spec.ts`, `test/properties/properties.spec.ts (Prop 2, 8)` |
| **REQ-C19**: Computing System Statutory Claim | `src/` Architecture | `All 21 test suites` | `All 16 e2e scenarios` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json` |
| **REQ-C20**: Storage Medium Statutory Claim | `dist/`, `package.json` | `All 21 test suites` | Clean build verification | YES (Loaded in Chrome) | NO (Protocol Target) | **BROWSER E2E TESTED** | `dist/manifest.json`, `evidence/chromium_e2e_evidence.json` |
| **REQ-NC1**: Multi-Layer Fingerprint Structure | `src/types/capability.ts` | `test/unit/fingerprint.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/fingerprint.spec.ts` |
| **REQ-NC2**: Framework Hash Regex Filters | `src/core/fingerprint/suppressor.ts` | `test/unit/suppression.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario E, F) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios E, F)` |
| **REQ-NC3**: Abstract Capability vs Concrete State | `src/core/graph/capabilityGraph.ts` | `test/unit/graph.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/graph.spec.ts`, `test/properties/properties.spec.ts (Prop 12)` |
| **REQ-NC4**: Mathematical Drift Formula | `src/core/drift/detector.ts` | `test/unit/drift.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/drift.spec.ts` |
| **REQ-NC5**: 10-Class Invariant Closure Engine | `src/core/invariant/engine.ts` | `test/unit/invariant.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/invariant.spec.ts`, `test/properties/properties.spec.ts (Prop 1)` |
| **REQ-NC6**: Post-Gate Re-Binding Formula | `src/core/ranking/engine.ts` | `test/unit/ordering.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/ordering.spec.ts` |
| **REQ-NC7**: 5-Step Causal Verification Protocol | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/causal.spec.ts`, `test/properties/properties.spec.ts (Prop 4, 5, 6)` |
| **REQ-NC8**: Async Ack Channel Correlation | `src/core/causal/verifier.ts` | `test/unit/causal.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/causal.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 12)` |
| **REQ-NC9**: Tamper-Evident Route Promotion Token | `src/core/quarantine/promotion.ts` | `test/unit/quarantine.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/quarantine.spec.ts`, `test/properties/properties.spec.ts (Prop 3)` |
| **REQ-NC10**: Monotonic Versioning & Demotion | `src/core/graph/routeManager.ts` | `test/unit/graph.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/graph.spec.ts`, `test/properties/properties.spec.ts (Prop 7, 12)` |
| **REQ-NC11**: Hash-Change Contradiction Reconsider | `src/core/contradiction/store.ts` | `test/unit/ordering.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/ordering.spec.ts`, `test/properties/properties.spec.ts (Prop 14)` |
| **REQ-NC12**: Confidence/Risk Decision Matrix | `src/core/authorization/controller.ts` | `test/unit/authorization.spec.ts` | `test/properties/properties.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/properties/properties.spec.ts (Prop 8, 9)` |
| **REQ-NC13**: Sensitive Triple Evidence Quorum | `src/core/authorization/quorum.ts` | `test/unit/authorization.spec.ts` | `test/e2e/browser_e2e.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/e2e/browser_e2e.spec.ts (Scenario 5)` |
| **REQ-NC14**: Executable Fallback States | `src/core/stateMachine/machine.ts` | `test/unit/authorization.spec.ts` | `test/adversarial/matrix.spec.ts` | NO | NO (Protocol Target) | **INTEGRATION TESTED** | `test/unit/authorization.spec.ts`, `test/adversarial/matrix.spec.ts (Scenario G)` |
| **REQ-NC15**: Zero-Egress Local Extension Runtime | `src/browser/background.ts` | `test/unit/security_privacy.spec.ts` | `test/e2e/browser_e2e.spec.ts` | YES (Scenario A-J) | NO (Protocol Target) | **BROWSER E2E TESTED** | `evidence/chromium_e2e_evidence.json (Scenarios A-J)` |
| **REQ-NC16**: 100-Intent Mock Benchmark Protocol | `benchmark/runner.ts`, `benchmark/metricValidator.ts` | `benchmark/runner.spec.ts` | JSDOM 2000-trial suite | NO (Automated JSDOM Suite) | NO (Protocol Target) | **INTEGRATION TESTED** | `benchmark/results/summary.json (JSDOM Protocol Verification)` |
| **REQ-NC17**: Stated Non-Claims & Safety Boundaries | `docs/LIMITATIONS.md` | N/A (Safety Specification) | N/A | NO | NO (Protocol Target) | **IMPLEMENTED** | `docs/LIMITATIONS.md` |

---

## 11. Non-Claim Technical Requirements Extracted from Disclosures

Beyond the specific claim recitations, the three disclosures provide essential architectural mechanisms:

1. **Multi-layer Functional Capability Fingerprint Construction (`REQ-NC1`)**:
   - Invariant Core: canonical function name, action type, target entity, pre-state predicates, expected post-state.
   - Semantic Evidence: accessible name, visible label, synonym list, ARIA role, container context.
   - Contextual Neighborhood Evidence: ancestor chain, heading hierarchy, neighboring labels.
   - Transition Evidence: trigger event type, expected DOM/app-state mutations, route/URL changes.
   - Risk Metadata: operation risk category (`LOW`, `MEDIUM`, `HIGH`, `SECURITY_SENSITIVE`, `DESTRUCTIVE`), confirmation policy, reversible probing flag.
2. **Volatile Feature Suppression Engine (`REQ-NC2`)**:
   - Regular expressions targeting generated CSS classes (Tailwind utility classes, CSS Modules hashes, Styled Components, Emotion, Vite build hashes).
   - Structural down-weighting: volatile DOM IDs, session-specific tokens, and exact pixel coordinates are excluded from identity-bearing features.
3. **Graph Architecture Separation (`REQ-NC3`)**:
   - Capability nodes represent abstract functional tasks.
   - Interface-state nodes represent concrete pages, DOM states, or modal contexts.
   - Routes represent versioned directed edges connecting capabilities to concrete DOM binding handles.
4. **5D Typed Drift Localization Vector (`REQ-NC4`)**:
   $$\mathbf{D} = [P, C, S, Cap, T] \in [0, 1]^5$$
   - $P$ (Presentation): changes in layout, colors, styling classes.
   - $C$ (Context): changes in surrounding labels, section headers, container elements.
   - $S$ (Structure): changes in DOM hierarchy, parent nesting, depth.
   - $Cap$ (Capability Semantics): changes in control action or accessible role.
   - $T$ (Transition Behavior): changes in triggered post-action mutations.
   - Presentation-only drift ($P > \tau_P, C \le \tau_C, S \le \tau_S$) allows route retention without re-binding.
5. **10-Class Invariant Closure Engine (`REQ-NC5`)**:
   Evaluates: (1) Action Type, (2) Target Entity, (3) Pre-State, (4) Allowed Delta, (5) Expected Post-State, (6) Required Context, (7) Forbidden Context, (8) Role Compatibility, (9) Transition Compatibility, (10) Forbidden Target/Action. Pure boolean pre-ranking barrier.
6. **Multi-Factor Post-Gate Re-Binding Score (`REQ-NC6`)**:
   Evaluated strictly among candidates passing invariant closure:
   $$\text{RebindScore} = w_1 \text{Inv} + w_2 \text{Sem} + w_3 \text{Ctx} + w_4 \text{Trans} + w_5 \text{Hist} - w_6 \text{Contra} - w_7 \text{Stale}$$
7. **5-Step Formal Causal Verification Protocol (`REQ-NC7`)**:
   - Step 1: Candidate activation event emitted.
   - Step 2: Expected state delta defined.
   - Step 3: Bounded interval $W$ measured from activation event.
   - Step 4: $\ge 2$ independent witness classes correlated where available.
   - Step 5: Temporal ordering ($t_{\text{act}} < t_{\text{wit}} \le t_{\text{act}} + W$) and causal relevance verified; pre-existing ($t \le t_{\text{act}}$) and unrelated changes rejected.
8. **Multi-Channel Witness Collector (`REQ-NC8`)**:
   Captures DOM mutations, accessibility mutations, history updates, client route changes, app state changes, and async network acknowledgements.
9. **Route Quarantine & Cryptographic Promotion (`REQ-NC9`)**:
   Provisional routes cannot execute in production. Promotion requires unforgeable `TransitionVerificationToken` bound to both `routeId` and `capabilityId`.
10. **Monotonic Versioning & Demotion/Rollback (`REQ-NC10`)**:
    Routes versioned monotonically ($v_1 < v_2 < \dots$). Failures demote active routes and rollback to previous validated routes or force fresh discovery.
11. **Negative Evidence Contradiction Store (`REQ-NC11`)**:
    Failed candidates indexed by normalized evidence signature. Repeated selection of identical broken elements suppressed until interface element hash changes.
12. **Independent Risk-Gated Authorization (`REQ-NC12`, `REQ-NC13`)**:
    High capability confidence cannot bypass high-risk policies. Operations classified as `SECURITY_SENSITIVE` or `DESTRUCTIVE` strictly require user confirmation. High-risk operations require evidence quorum across semantic, invariant, and transition evidence.
13. **Executable Fallback State Machine (`REQ-NC14`)**:
    Uncertainty transitions to explicit states: `ABSTAIN`, `RANKED_SUGGESTION`, `CONFIRMATION_REQUIRED`, `RE_OBSERVE`.
14. **Zero-Leak Local Extension Privacy (`REQ-NC15`)**:
    Complete execution within local browser extension runtime without network egress of credentials, tokens, or personal data.

---

## 12. Validation & Evidence Requirements

The disclosure documents set forth strict empirical standards that govern what can and cannot be claimed as verified:

1. **100-Intent / Multi-Site Benchmark Protocol Specified**:
   - Section 8, Section K, and Section 9.2 specify the experimental evaluation of 100 intents across Mock Sites A, B, C, and D as an **experimental protocol and target**, explicitly cautioning that completed empirical results must not be claimed until actually measured: *\"No fabricated benchmark percentages, latency values, security counts or TRL claims should be inserted... The present disclosure should not claim completed benchmark results until they are actually measured.\"*
   - Empirical completion must be established from raw browser trial records rather than synthetic multipliers or simulated DOM projections.
2. **Clear Demarcation Between Simulated DOM and Live Browser E2E**:
   - JSDOM test execution (`npm test`, `test/e2e/browser_e2e.spec.ts`) evaluates component logic, state machine transitions, and DOM event dispatch inside a simulated Node.js environment. These are classified strictly as **Unit & Integration Evidence**.
   - Live browser E2E verification is established exclusively by `scripts/runChromiumE2E.js` spawning headless Google Chrome 152 with loaded Manifest V3 extension communicating over Chrome DevTools Protocol (CDP) WebSocket, saved in `evidence/chromium_e2e_evidence.json`.
3. **Traceability & Proof Standards**:
   - All benchmark numbers must be reconcilable with individual raw run records without heuristic scaling factors (`* 1.1`, `* 0.75`).
   - The test suite and live browser runner must execute locally without cloud API keys (`docs/REPRODUCIBILITY.md`).

---

## 13. Requirements That Cannot Yet Be Considered Empirically Verified

In strict adherence to the patent disclosures and truth-in-evidence rules, the following capabilities are architected and tested within prototype environments, but **CANNOT yet be claimed as universally or empirically verified at open-web commercial scale**:

1. **Longitudinal Commercial Web Scale**: The prototype has been validated on mock sites representing specific structural, lexical, and adversarial UI drift. Empirical verification across millions of live commercial third-party websites undergoing real-world production evolution remains an open-web empirical target.
2. **Cross-Domain Iframe Security Boundaries**: Testing covers same-origin and permitted extension frames. Arbitrary cross-origin iframe security boundaries with strict browser sandbox restrictions (e.g. out-of-process iframes with cross-origin opener policies) require extension host permissions across arbitrary origins.
3. **Open-Domain Open-Vocabulary NLP**: The browser-resident intent normalizer processes functional objectives within the domain of web tasks. Universal comprehension of arbitrarily ambiguous, figurative, or multi-lingual colloquial queries without remote LLM assistance is explicitly outside the claimed scope.
4. **Autonomous Execution of Irreversible Destructive Actions**: Claim 14 and Section 7.8 explicitly forbid autonomous verification probing on destructive actions (e.g. deleting an account or authorizing a bank transfer). Such actions strictly transition to `CONFIRMATION_REQUIRED` and cannot be empirically verified via autonomous execution without user interaction.
