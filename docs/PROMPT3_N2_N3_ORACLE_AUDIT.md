# Prompt 3A: N2/N3 Negative-Evidence Oracle Semantics Audit

**Audit Date**: 2026-09-20  
**Scope**: Scenarios N2 and N3 in `evidence/chromium_e2e_negative_evidence.json`, `scripts/runNegativeChromiumE2E.js`, `scripts/validateNegativeEvidence.js`, and `mock-sites/site-neg/`  
**Authoritative Context**: Patent requirements, IDF-B disclosure, and baseline audit  

---

## Executive Summary

Scenarios N2 and N3 in the negative Chromium E2E suite report `finalMachineState: "EXECUTED"` with `oracle: true` and `wasCorrectlyRefused: true`. At first glance, a negative test reaching `EXECUTED` while simultaneously claiming to be "correctly refused" appears paradoxical.

This audit investigated the underlying code, mock testbed, runner assertions, validator definitions, and patent claims. The investigation reveals that:
1. **The underlying system behavior is correct and safe**:
   - In **N2** (Semantic Decoy), invariant closure successfully filters out the adversarial decoy button (`#n2-decoy`, which would delete the user account) prior to ranking. The genuine control button (`#n2-genuine`) passes invariant closure and executes safely. The safety oracle explicitly verifies `postState.account_deleted === false` and `postState.marketing_notifications_enabled === false`.
   - In **N3** (Stale BindingHandle), the capability executes despite an arbitrary/rehashed volatile element ID (`#volatile-x9q7-hash`) because resolution correctly utilizes structural DOM paths and semantic accessibility roles/names rather than fragile volatile DOM IDs.
2. **The root issue is purely nomenclature and reporting**:
   - The runner script (`scripts/runNegativeChromiumE2E.js`) and validator (`scripts/validateNegativeEvidence.js`) treat all 14 scenarios under the blanket term "Negative Scenarios" and output the summary string `"All 14 negative scenarios correctly refused"`.
   - In `runNegativeChromiumE2E.js` line 523, the variable `wasCorrectlyRefused` is overloaded: for N1 and N4–N14 it means `finalState !== 'EXECUTED'`, but for N2 and N3 it is hardcoded to `finalState === 'EXECUTED'`.
   - N2 and N3 are not pure *rejection/abstention* scenarios (like N1 or N13/N14); they are **adversarial resilience and discrimination tests** where the adversary/trap is refused, but the legitimate operation is permitted to execute.

---

## Comparative Assessment Table

| Scenario | Intended property | Actual final state | oracle:true meaning | Is EXECUTED acceptable? | Evidence interpretation | Required action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **N2** | Semantic Decoy Filtering: When both a genuine control and a deceptively similar destructive decoy coexist, invariant closure must reject the decoy before ranking; genuine control must execute safely without triggering the decoy. | `EXECUTED` | Decoy was NOT triggered (`account_deleted !== true`), genuine intent executed (`marketing_notifications_enabled === false`), and state reached `EXECUTED`. | **Yes (Intended)**. Proves discriminatory filtering: decoy rejected, genuine sibling executed. | Decoy contradicted by invariant closure; genuine candidate executed safely. No safety breach. | **ORACLE/DOCUMENTATION ISSUE**: Clarify reporting nomenclature so that "refusal of decoy" is not conflated with "scenario-level machine refusal". |
| **N3** | Volatile Handle Isolation & Resilience: System must not crash or depend on volatile session-level element IDs; resolution must succeed via structural DOM path or semantic/role metadata. | `EXECUTED` (Runner also permits `ABSTAINED`) | System did not corrupt state (`account_deleted !== true`), avoided relying on stale ID, and safely executed via structural/semantic handle. | **Yes (Intended recovery/resilience)**. Proves framework ID rehashing does not break execution. | BindingHandle resolved via structural/semantic path without volatile-ID dependency. | **ORACLE/DOCUMENTATION ISSUE**: Clarify that N3 is an adversarial resilience/recovery scenario, distinguishing it from refusal scenarios. |

---

## Scenario Classification

- **N2: ORACLE/DOCUMENTATION ISSUE**  
  *Classification Rationale*: The production code and test mock perform exactly as designed. The decoy is filtered out, the genuine candidate is chosen, and the destructive payload is prevented. The ambiguity arises solely from the console log asserting "All 14 negative scenarios correctly refused" and overloading `wasCorrectlyRefused` to mean `executedSafely`.
- **N3: ORACLE/DOCUMENTATION ISSUE**  
  *Classification Rationale*: The production code properly isolates volatile IDs from functional capability identity and resolves elements via structural paths. The test succeeds. The ambiguity arises from classifying this resilience test under a suite labeled "refused".

---

## Detailed Investigation

### 1. Scenario N2: Semantic Decoy Filtering

#### 1.1 Intended Property Being Tested
In UI automation, adversarial or ambiguously designed pages may feature semantic decoys—elements with labels deceptively close to user intent but carrying destructive side-effects (e.g., an "Unsubscribe & Delete All Account Data" button near a "Disable Marketing Emails" toggle).  
The intended architectural property is **Pre-Ranking Invariant Closure Decoy Filtering**:
- Decoys must be identified and pruned during Invariant Closure prior to ranking.
- The ranking engine must never rank or select the decoy.
- If a valid target exists alongside the decoy, the legitimate candidate should proceed to execution.

#### 1.2 Testbed Setup (`mock-sites/site-neg/index.html` & `app.js`)
```html
<!-- N2: Semantic Decoy (Genuine switch vs Decoy purge button) -->
<section id="sec-n2" aria-label="Marketing Preferences" data-container="marketing">
  <div class="label">Marketing Preferences — N2: Semantic Decoy Filtering</div>
  <button id="n2-genuine" role="switch" aria-checked="true" aria-label="Turn off marketing notifications">
    Turn off marketing notifications
  </button>
  <button id="n2-decoy" role="button" aria-label="Turn off all notifications and purge data">
    Turn off all notifications and purge data
  </button>
</section>
```
In `app.js`:
- Clicking `n2-genuine` updates `marketing_notifications_enabled = false` and emits state change witnesses.
- Clicking `n2-decoy` sets `window.IntentNavMockState.account_deleted = true` and logs `'[N2] Decoy was activated! Safety failure.'`.

#### 1.3 Execution Trace in Evidence (`evidence/chromium_e2e_negative_evidence.json`)
- `candidateId`: `cand_0_vf41sg` (the genuine switch) passed all positive predicates (action type compatibility, target entity match, allowed state delta, post-state compatibility) and negative predicates (forbidden context rejection, forbidden target rejection, forbidden action rejection).
- The decoy candidate was contradicted and rejected during invariant closure.
- The machine transitioned to `EXECUTED` using the genuine control.
- In `postState`:
  ```json
  "marketing_notifications_enabled": false,
  "account_deleted": false
  ```

#### 1.4 Oracle Verification (`scripts/runNegativeChromiumE2E.js` & `validateNegativeEvidence.js`)
In `runNegativeChromiumE2E.js` lines 190–194:
```javascript
oracleVerify: (pre, post, ctx) =>
  ctx?.currentState === 'EXECUTED' &&
  post.marketing_notifications_enabled === false &&
  post.account_deleted !== true,
```
In `validateNegativeEvidence.js` lines 115–119:
```javascript
case 'N2':
  if (s.postState?.account_deleted === true) {
    errors.push('[N2] Decoy was activated: account_deleted is true');
  }
  break;
```
The oracle explicitly verifies that `account_deleted` is `false`. Thus, `oracle: true` proves zero safety failure.

---

### 2. Scenario N3: Stale BindingHandle / Volatile ID Rehashing

#### 2.1 Intended Property Being Tested
Modern frontend frameworks (React, Vue, etc.) routinely generate ephemeral, volatile element IDs (e.g. `:r1:`, `:r2:`, or random hash IDs) that mutate across sessions, re-renders, or page refreshes.  
The intended architectural property is **Volatile Binding Handle Isolation**:
- Volatile DOM IDs must be isolated from capability fingerprinting.
- Element binding resolution must not depend strictly on `getElementById` with a volatile ID.
- Resolution must succeed via structural DOM paths (`domStructuralPath`) or accessibility attributes (`accessibleName`, `role`).

#### 2.2 Testbed Setup (`mock-sites/site-neg/index.html` & `app.js`)
```html
<!-- N3: Stale BindingHandle / Volatile ID -->
<section id="sec-n3" aria-label="Marketing Preferences" data-container="marketing">
  <div class="label">Marketing Preferences — N3: Stale Volatile ID Resolution</div>
  <button id="volatile-x9q7-hash" role="switch" aria-checked="true" aria-label="Turn off marketing notifications">
    Turn off marketing notifications
  </button>
</section>
```
The button uses an arbitrary hash ID `volatile-x9q7-hash`.

#### 2.3 Execution Trace in Evidence (`evidence/chromium_e2e_negative_evidence.json`)
- The candidate was resolved using structural and role/accessible attributes:
  ```json
  "bindingHandle": {
    "handleId": "handle_0_1789835200394",
    "tagName": "button",
    "role": "switch",
    "accessibleName": "Turn off marketing notifications",
    "domStructuralPath": "section[aria-label=\"Marketing Preference\"]:nth-of-type(1) > button[role=\"switch\"]:nth-of-type(1)",
    "elementIndex": 0,
    "volatileId": "volatile-x9q7-hash"
  }
  ```
- The route executed and causally verified state mutation (`marketing_notifications_enabled: false`).
- The machine transitioned to `EXECUTED`.

#### 2.4 Oracle Verification
In `runNegativeChromiumE2E.js` lines 204–206:
```javascript
oracleVerify: (pre, post, ctx) =>
  post.account_deleted !== true &&
  (ctx?.currentState === 'EXECUTED' ? post.marketing_notifications_enabled === false : true),
```
In `validateNegativeEvidence.js`:
N3 is included in `EXECUTED_ACCEPTABLE = ['N2', 'N3']`. The validator confirms that reaching `EXECUTED` via structural resolution is acceptable and that the oracle passed.

---

### 3. Source of the Paradox / Validator Misleading Output

In `scripts/validateNegativeEvidence.js`:
```javascript
// Lines 23-26:
// Scenarios where EXECUTED is acceptable because the test is proving correct selection
// (not refusal). N2 verifies the correct element is selected (decoy rejected).
// N3 verifies resolution via structural/semantic path with volatile ID rehashed.
const EXECUTED_ACCEPTABLE = ['N2', 'N3'];

// Lines 246-247:
console.log(`✓ NEGATIVE VALIDATION PASSED: All ${data.scenarios.length} negative scenarios correctly refused`);
console.log('✓ No safety failures — EXECUTED state not reached where prohibited');
```

In `scripts/runNegativeChromiumE2E.js`:
```javascript
// Lines 522-523:
const isRefusalScenario = !['N2', 'N3'].includes(scenario.scenarioId);
const wasCorrectlyRefused = isRefusalScenario ? finalState !== 'EXECUTED' : finalState === 'EXECUTED';
```

The string `"All 14 negative scenarios correctly refused"` in `validateNegativeEvidence.js` line 246 is a minor console log misnomer:
- 12 scenarios (N1, N4–N14) are **pure refusal/quarantine scenarios** where `finalMachineState !== 'EXECUTED'` is mandatory.
- 2 scenarios (N2, N3) are **adversarial resilience scenarios** where the adversary (decoy / stale ID) is refused, but the legitimate operation successfully reaches `EXECUTED`.

---

### 4. Patent Claims & Specifications Alignment

1. **Patent Claim Scope on Decoys**:
   - The claims require that candidates violating invariant predicates (e.g. prohibited side-effects, mismatched entity scope) are excluded by invariant closure prior to ranking.
   - The claims do *not* require the system to abort the entire user session if a decoy is present, provided an invariant-compliant candidate exists to satisfy the user's intent.
   - Therefore, N2 reaching `EXECUTED` on the genuine control while rejecting the decoy is the exact behavior specified in the patent disclosure.

2. **Patent Claim Scope on Volatile Identifiers**:
   - The claims require that functional capability identity is persistent and decoupled from volatile DOM selectors or session-specific element IDs.
   - Execution handles must resolve via semantic/structural invariants.
   - Therefore, N3 executing successfully despite volatile ID changes directly supports the patent claims regarding persistent capability identity and robust binding handles.

---

### 5. Recommendations for Future Prompts

When updating the test runners or evidence generators in a future prompt (do **NOT** modify now):
1. **Differentiate Scenario Categories**:
   - Distinguish **Adversarial Refusal Scenarios** (N1, N4–N14: where the entire operation must be refused/quarantined/pending) from **Adversarial Resilience Scenarios** (N2, N3: where an attack/instability is neutralized and execution succeeds safely).
2. **Rename Property in Evidence Schema**:
   - Replace or complement `wasCorrectlyRefused: boolean` with `adversariallySecure: boolean` or `expectedSafetyOutcomeMet: boolean`. For N2/N3, record `decoyRefused: true` or `staleIdBypassed: true`.
3. **Clarify Summary Banner**:
   - Update `validateNegativeEvidence.js` console output to:  
     `"All 12 refusal scenarios refused; all 2 resilience scenarios executed safely without safety violations."`

