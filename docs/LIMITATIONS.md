# IntentNav-SCFR: System Limitations & Boundary Conditions

While **IntentNav-SCFR** substantially advances the state of the art in resilient, invariant-gated web navigation and drift recovery, rigorous scientific evaluation requires explicit identification of its architectural boundaries and operational constraints.

---

## 1. Non-DOM Presentation Technologies (Canvas & WebGL)

### Constraint
IntentNav-SCFR relies on semantic DOM tree structures, ARIA accessibility trees, and mutation events. Interfaces rendered completely within graphical surfaces—such as HTML5 `<canvas>`, WebGL scenes, Flutter Web without HTML rendering, or WebAssembly pixel buffers—do not expose individual functional DOM nodes.

### Impact & Mitigation
- **Impact**: Without exposed DOM nodes, volatile feature suppression, invariant predicates, and structural witness collection cannot operate directly.
- **Mitigation**: Modern accessible web standards mandate Accessibility Object Model (AOM) or fallback DOM elements for interactive controls. Where available, IntentNav-SCFR attaches to these accessibility layers. When purely graphical rendering is detected, the system transitions to a degraded state and requests human interaction.

---

## 2. Closed Shadow DOM Boundaries

### Constraint
Elements encapsulated within closed Shadow DOM roots (`attachShadow({ mode: "closed" })`) cannot be traversed or inspected by external content scripts via standard DOM APIs (`element.shadowRoot` returns `null`).

### Impact & Mitigation
- **Impact**: Open Shadow DOM trees are fully supported and recursively traversed by `InterfaceObserver`. However, closed Shadow DOM roots remain opaque to content scripts.
- **Mitigation**: Chrome Extensions utilizing the Chrome DevTools Protocol (`chrome.debugger`) can pierce closed shadow roots, but IntentNav-SCFR intentionally avoids broad debugger permissions to preserve user security and Manifest V3 lightweight execution.

---

## 3. Out-of-Band Multi-Factor Authentication (MFA / 2FA)

### Constraint
Authentication flows requiring out-of-band human interaction—such as SMS one-time passcodes, authenticator app TOTPs, push notification approval on external mobile devices, or hardware security keys (WebAuthn / FIDO2)—cannot be causally driven or verified solely within the in-browser DOM context.

### Impact & Mitigation
- **Impact**: Autonomous progression stops when an out-of-band challenge is encountered.
- **Mitigation**: IntentNav-SCFR explicitly recognizes security and credential checkpoints (`RiskLevel: HIGH` / `CRITICAL`), halts execution, yields control to the human user, and waits for post-challenge URL/DOM transition witnesses before resuming navigation.

---

## 4. Virtualized Scrolling Lists

### Constraint
High-performance dynamic applications (e.g. data grids, infinite feeds) utilize DOM recycling / virtual scrolling, where only elements within the immediate viewport are mounted in the DOM. Target capabilities located down-page do not exist in the DOM tree until scrolled.

### Impact & Mitigation
- **Impact**: Initial candidate generation may report zero matching candidates.
- **Mitigation**: When candidate generation fails on a virtualized container, the Route Manager schedules an incremental viewport scroll action to trigger DOM hydration before re-evaluating candidate invariants.

---

## 5. High-Latency Asynchronous Backend Mutations

### Constraint
The Causal Transition Verifier expects causal witnesses to manifest within a bounded temporal window (default: $\Delta t_{\max} = 800\text{ms}$, configurable to $3000\text{ms}$). On networks with extreme latency or backend batch operations, state transitions may take several seconds to appear in the DOM.

### Impact & Mitigation
- **Impact**: If witnesses do not arrive within the timeout window, the transition is classified as unverified, preventing route promotion and placing the candidate in provisional quarantine.
- **Mitigation**: The system supports configurable adaptive witness windows per capability category, allowing asynchronous confirmation polling without blocking browser responsiveness.

---

## 6. Radically Divergent Functional Workflows

### Constraint
If an application undergoes an architectural redesign that completely removes a functional capability or replaces a single-step action with an entirely new multi-step wizard, local drift localization may detect that $S_{\text{cap}} \approx 0$.

### Impact & Mitigation
- **Impact**: Invariant closure will correctly reject existing candidates to prevent accidental misexecution.
- **Mitigation**: Rather than hallucinating a target, IntentNav-SCFR safely aborts the active route, flags the capability as `UNRESOLVABLE_DRIFT`, logs the event to the audit trail, and alerts the operator to record a new baseline route $V_{k+1}$.

---

## 7. Capability Taxonomy & Autonomous Scope Boundary

### Constraint
IntentNav-SCFR is designed as an invariant-gated, deterministic navigation and drift recovery engine, **not** an unbounded, general-purpose open-world autonomous web crawler or conversational web agent.

### Impact & Mitigation
- **Scope & Ontology**: The production architecture operates from a strongly typed, generic capability schema (`actionType`, `targetEntity`, `preconditions`, `allowedStateDelta`, `expectedPostState`, `contextPredicates`, `riskMetadata`, `functionalFingerprint`). While the architecture is domain-agnostic and does not depend on hardcoded site vocabularies for its invariant closure and causal verification pipelines, capability specifications must be registered, declared by the application/component, or configured as target capabilities.
- **No Unbounded Discovery Claim**: IntentNav-SCFR does not claim arbitrary autonomous capability discovery across completely unknown, unmodeled web platforms without declared or registered functional capability definitions.

