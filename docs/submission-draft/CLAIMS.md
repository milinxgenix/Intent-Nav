# IntentNav-SCFR: Complete Working Patent Claims Draft
**Document Identifier:** `INTENTNAV-SUBMISSION-CLAIMS-2026-V1`
**Author / Inventor / Sole Implementer:** MILIND
**Date:** October 26, 2026
**Status:** Working Patent Draft Deliverable (Restored to 100% Verbatim Source Fidelity with `v6.docx` Controlling Specification ¶ 183–204; Cleaned of Markdown Artifacts)
**Controlling Authority Priority:** `v6.docx` (Controlling Priority 1) $\to$ `patent.docx` (Secondary Priority 2) $\to$ `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx` (Tertiary Priority 3)

---

## Section 9.1: Preamble and Statutory Classification

The following claims define the scope of the invention for submission to patent examination authorities (including the Indian Patent Office under The Patents Act, 1970; the USPTO under 35 U.S.C. §§ 101, 102, 103, 112; and the EPO under EPC Arts 52, 54, 56, 84).

---

## Section 9.2: Foundational Independent Method Claim

1. A computer-implemented method for adaptive navigation of an asynchronous web interface, comprising:

   (a) receiving, by a browser-resident processing subsystem, a natural-language objective specifying a requested functional operation;

   (b) observing a live interface and obtaining multi-source interface evidence comprising document-structure evidence, accessibility evidence, semantic evidence, contextual-neighborhood evidence, and transition-state evidence;

   (c) generating or retrieving a persistent Functional Capability Fingerprint for a capability, the fingerprint comprising a canonical capability identity tuple having at least an action type, a target entity, mandatory pre-state predicates, an allowed state delta, an expected post-state, required contextual predicates, forbidden contextual or functional predicates, a transition signature, and a risk class, wherein volatile presentation attributes are excluded from identity-bearing features or assigned a reduced identity weight;

   (d) maintaining a capability-state graph in which a persistent capability node is distinct from transient interface-state nodes and is associated with a plurality of route versions;

   (e) matching the natural-language objective to the persistent capability node and obtaining a previously validated route version;

   (f) generating a typed interface-drift vector by comparing stored and live evidence, the vector distinguishing at least presentation drift from one or more of contextual drift, structural drift, capability drift, and transition drift;

   (g) inhibiting replay of the previously validated route when the typed interface-drift vector satisfies a re-binding condition and generating live candidate controls associated with the persistent capability node;

   (h) applying an invariant-closure gate to each candidate, the gate requiring satisfaction of mandatory action, target, pre-state, allowed-state-delta, post-state-compatibility, and required-context predicates and rejecting the candidate upon satisfaction of a forbidden predicate;

   (i) only after a candidate passes the invariant-closure gate, calculating a re-binding score using semantic fit, contextual fit, transition fit, validation history, contradiction evidence, and route staleness;

   (j) creating a provisional route version and a machine-readable validation record for a selected candidate, the validation record storing at least the candidate identity, typed drift vector, invariant results, contradiction results, route version identifier, and transition-verification state;

   (k) performing a safe, non-destructive or reversible verification operation when permitted and correlating an activation event produced by the selected candidate with an ordered transition signature comprising an expected state delta and a bounded verification interval containing one or more independent transition witnesses, and accepting the candidate only when the observed witnesses are causally consistent with the expected transition signature;

   (l) promoting the provisional route version to an active validated route only when the invariant-closure gate and transition-verification acceptance condition are satisfied, while storing failed or contradictory candidates as quarantined negative evidence associated with the failed predicate or evidence signature;

   (m) maintaining capability confidence separately from execution authorization, wherein execution authorization is determined by an operation-risk policy independently of the capability-confidence value; and

   (n) dispatching the requested operation only when the execution-authorization condition is satisfied, and otherwise entering an abstention, ranked-suggestion, or confirmation-required state according to the operation-risk policy.

---

## Section 9.3: Dependent Claims (Claims 2–18)

2. The method of claim 1, wherein volatile presentation attributes comprise generated DOM identifiers, transient framework classes, randomized tokens, exact coordinates, session-specific labels, or equivalent short-lived attributes, and the volatile attributes are prevented from independently establishing capability identity.

3. The method of claim 1, wherein the canonical capability identity tuple is normalized into an invariant closure comprising positive predicates that must hold and negative predicates that must not hold, and a candidate failing any mandatory positive predicate or satisfying any negative predicate is rejected before similarity ranking.

4. The method of claim 1, wherein the typed interface-drift vector comprises separate measurements for presentation, context, structure, capability semantics, and transition behavior, and wherein presentation-only drift does not by itself invalidate an otherwise verified route.

5. The method of claim 1, wherein the re-binding score is evaluated only for candidates that pass the invariant-closure gate, such that semantic similarity cannot compensate for failure of a mandatory functional predicate.

6. The method of claim 1, wherein a contradiction predicate identifies at least one decoy action, target entity, forbidden destination state, incompatible post-state, or incompatible transition, whereby a candidate having a higher semantic similarity than an accepted candidate is nevertheless rejected.

7. The method of claim 1, wherein the transition signature specifies an ordered sequence comprising a pre-state, a candidate activation event, an expected state delta, a verification interval, and a post-state, and wherein at least two independently observable witness classes are correlated within the verification interval before route promotion.

8. The method of claim 1, wherein a transition witness is selected from DOM mutation, accessibility-state mutation, history-state mutation, client-side route-state mutation, application-state mutation, or an asynchronous transaction acknowledgement.

9. The method of claim 1, wherein a selected recovered route is first stored in a provisional quarantine state and is promoted to an active validated route only after the invariant-closure gate and transition acceptance condition are satisfied, and wherein a failed route is retained as negative evidence.

10. The method of claim 1, wherein a subsequent validation failure demotes an active route version and restores a previously validated route version or forces fresh re-binding, while preserving the failed route as historical evidence.

11. The method of claim 1, wherein the browser-resident processing subsystem performs intent normalization, interface observation, drift localization, invariant closure, candidate ranking, transition verification, route promotion, and risk gating locally within the browser runtime without transmitting session credentials or authentication tokens to an external inference service.

12. The method of claim 1, wherein the browser-resident processing subsystem comprises an extension content script, a background service worker, a local capability store, a graph engine, and a verification controller communicating through an extension messaging interface.

13. The method of claim 1, wherein when required transition witnesses are unavailable, contradictory, or causally unrelated to the candidate activation event, the method prevents silent execution and enters the abstention, ranked-suggestion, or confirmation-required state.

14. The method of claim 1, wherein high-risk execution requires an evidence quorum comprising at least semantic evidence, functional invariant evidence, and transition-state evidence, and wherein high capability confidence cannot override failure of the evidence quorum.

15. The method of claim 1, wherein the machine-readable validation record further stores an activation-event timestamp or sequence identifier and respective timestamps or sequence identifiers of the transition witnesses, and wherein a witness that does not satisfy the configured ordering and verification interval is excluded from the route-promotion condition.

16. The method of claim 1, wherein quarantined negative evidence comprises a normalized evidence signature identifying at least a failed invariant or contradiction predicate, and wherein the signature is used to suppress repeated selection of a materially unchanged rejected candidate until material interface evidence changes.

17. The method of claim 1, wherein route versions are maintained in a state machine comprising at least provisional, validated, demoted, and quarantined states, and wherein a transition between the states is caused by an invariant result or transition-witness result rather than by a confidence score alone.

18. The method of claim 1, wherein, after the invariant-closure gate has accepted a candidate, the route confidence calculation further incorporates semantic fit, contextual fit, transition consistency, prior validation confidence, route staleness, operation risk, and path cost, and wherein the resulting confidence value cannot by itself authorize a high-risk operation.

---

## Section 9.4: Parallel Statutory Claim Categories (Claims 19–20)

19. A computing system comprising one or more processors, a browser-resident interface observer, a capability-state graph store, a drift-localization engine, an invariant-closure engine, a transition-verification controller, and an execution-authorization engine, configured to perform the method of claim 1.

20. A non-transitory computer-readable storage medium storing instructions that, when executed by a browser-resident processing device, cause the processing device to perform the method of claim 1.
