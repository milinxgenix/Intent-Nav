# Patent Hardening Step 2: Canonical Stable Representation + SHA-256 Capability Fingerprint Identity + Transition-Signature Binding

**Branch:** `patent-hardening-step-02-fingerprint-sha256`
**Parent Commit:** `dd17ff3` (*"Harden cryptographic promotion-token integrity"*)
**Frozen Baseline Preserved:** `3392b2a` (`intentnav-evidence-baseline-v1.0`)

---

## 1. Previous Fingerprint Implementation & Identified Weaknesses

Prior to Step 2, [`FingerprintConstructor.computeFingerprintHash`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts) computed capability fingerprint hashes by concatenating string fragments with `|`, `,`, and `:` delimiters and passing the resulting string through a 32-bit non-cryptographic shift-subtract loop (`hash = (hash << 5) - hash + raw.charCodeAt(i); hash |= 0`), formatted as `fph_${Math.abs(hash).toString(16)}`.

Independent engineering audit identified five technical weaknesses in that legacy (`v1_legacy`) mechanism:

1. **32-Bit Collision Space & Sign Folding:** A 32-bit signed integer combined with `Math.abs(hash)` reduces the effective output space to $\le 2^{31}$ values (birthday bound $\approx 46,340$ capabilities), making accidental or adversarial hash collisions computationally trivial.
2. **Delimiter Concatenation Ambiguity:** Joining fields with unescaped `|`, `,`, and `:` delimiters without canonical structural framing allowed field values containing delimiter characters to produce identical concatenated strings across distinct field boundaries.
3. **Lossy Post-State Value Coercion (`String(p.expectedValue)`):** Structured object or array expectations in `expectedPostState` coerced to `"[object Object]"`, collapsing distinct nested post-state predicates into identical hash inputs.
4. **Incomplete Declarative Predicate Serialization:** `mandatoryPreStatePredicates` previously hashed only `p.id || p.name`, omitting structured `declarative` predicate fields (`source`, `property`, `operator`, `expectedValue`, `expectedValues`).
5. **Absence of Domain Separation:** The legacy digest lacked an explicit domain tag separating capability identity digests from transition-signature bindings and witness digests.

---

## 2. Target Pipeline Architecture

Step 2 replaces the legacy 32-bit hash for all new capability identities with a five-stage deterministic cryptographic pipeline:

$$\text{Live / Declared Capability Data} \longrightarrow \text{Volatile-Feature Suppression} \longrightarrow \text{Canonical Stable Representation} \longrightarrow \text{SHA-256} \longrightarrow \texttt{capfp\_sha256\_<64hex>}$$

---

## 3. Volatile-Feature Suppression Rules

[`VolatileFeatureSuppressor`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/suppressor.ts) enforces two complementary suppression layers:

1. **DOM Element Feature Suppression (`suppressVolatileFeatures`):**
   - Strips framework-generated volatile DOM IDs (`react-aria-*`, `:r1:`, `vue-*`, `ember*`, `_ngcontent-*`, UUIDs, long hex hashes, random numeric suffixes).
   - Strips utility and generated CSS classes (`css-*`, `sc-*`, `jsx-*`, CSS module hashes, Tailwind layout/spacing/color/pseudo-class utilities, state toggles `is-*`/`has-*`).
   - Computes relative structural paths rather than pixel coordinates or full brittle XPaths.
2. **Descriptor-Level Suppression (`stripVolatileInputFields`):**
   - Strips volatile presentation attributes (`id`, `volatileId`, `className`, `classes`, `volatileClasses`, `style`, `inlineStyle`, `coordinates`, `boundingBox`, `clientRect`, `x`, `y`, `width`, `height`, `top`, `left`, `right`, `bottom`, `xpath`, `fullXpath`, `cssSelector`, `fullPath`, `domStructuralPath`, `elementIndex`).
   - Strips cosmetic wording variations (`canonicalLabel`, `visibleLabel`, `accessibleName`, `textContent`, `innerText`) from the persistent identity input while preserving them in `semanticEvidence` for candidate scoring.
   - Strips per-execution runtime context (`activationEventId`, `issuedTimestamp`, `creationTimestamp`, `validationTimestamp`, `lastValidatedTimestamp`, `witnessId`, `witnessIds`, `handleId`, `tokenId`, `routeId`, `sessionToken`, `sequenceNumber`, `temporalDeltaMs`, `durationMs`).

---

## 4. Canonical Stable Representation Format

[`FingerprintConstructor.buildCanonicalCapabilityRepresentation`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts) constructs a deterministic JSON structure serialized via [`canonicalizeValue`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts):

- **Recursive Lexicographical Key Ordering:** Every object's keys are filtered for defined, non-function values and sorted lexicographically (`Object.keys(obj).sort()`).
- **Unicode & Numeric Normalization:** Strings are normalized to Unicode NFC; `-0` is normalized to `0`; non-finite numbers serialize as `null`.
- **Order-Insensitive Predicate Set Canonicalization:** `mandatoryPreStatePredicates`, `allowedStateDelta`, `expectedPostState`, `requiredContextPredicates`, and `forbiddenContextPredicates` are normalized into structured predicate descriptors (including full `declarative` predicate definitions and deep `expectedValue` objects), deduplicated, and sorted lexicographically by their canonical JSON strings.
- **Canonical Payload Schema:**
  ```json
  {
    "actionType": "MODIFY_PREFERENCE",
    "allowedStateDelta": [...],
    "canonicalFunction": "disable_marketing_notifications",
    "domain": "INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2",
    "domainScope": null,
    "expectedPostState": [...],
    "forbiddenContextPredicates": [...],
    "mandatoryPreStatePredicates": [...],
    "requiredContextPredicates": [...],
    "riskClass": "REVERSIBLE",
    "role": "switch",
    "targetEntity": "MARKETING_NOTIFICATIONS",
    "transitionContract": null,
    "version": "v2"
  }
  ```

---

## 5. SHA-256 Digest Construction & Standard Runtime Primitives

- **Node.js / Vitest Runtimes:** Uses Node's built-in OpenSSL `crypto.createHash('sha256')` via `process.getBuiltinModule('crypto')` (`FingerprintConstructor.sha256HexSync` and `FingerprintConstructor.sha256HexAsync`).
- **Browser Extension Runtimes:** Uses the W3C Web Cryptography API `globalThis.crypto.subtle.digest('SHA-256', ...)` (`FingerprintConstructor.sha256HexAsync` and `FingerprintConstructor.computeFingerprintHashAsync`), backed by an internal digest cache for synchronous reads.
- **Zero Custom Cryptography:** No custom cryptographic hash functions are used for `v2` capability identity generation.
- **Output Format:** `capfp_sha256_<64 lowercase hex characters>` (256-bit digest).

---

## 6. Explicit Domain Separation

To prevent cross-domain digest collisions where structurally similar payloads are hashed in different subsystems, explicit domain constants are embedded into every canonical representation prior to SHA-256 hashing:

| Subsystem Digest | Domain Marker Constant | Output Prefix |
| :--- | :--- | :--- |
| **Capability Fingerprint Identity** | `INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2` | `capfp_sha256_<64hex>` |
| **Transition-Signature Binding** | `INTENTNAV_SCFR_TRANSITION_BINDING_V2` | `tb_sha256_<64hex>` |
| **Witness Quorum Binding** | `INTENTNAV_SCFR_WITNESS_BINDING_V2` | `wd_sha256_<64hex>` |
| **Witness Evidence Digest** | `INTENTNAV_SCFR_WITNESS_EVIDENCE_V2` | `we_sha256_<64hex>` |
| **Promotion Token HMAC Payload** | `INTENTNAV_SCFR_PROMOTION_TOKEN_V1` | `hmac_sha256_<64hex>` |

---

## 7. Separation & Binding of Persistent Capability Identity, Transition Semantics, and Runtime Context

Step 2 enforces a strict three-tier separation and cryptographic binding model:

1. **Persistent Capability Identity (`capfp_sha256_<64hex>`):**
   - Determined strictly by canonical functional fields and invariant contracts (`canonicalFunction`, `actionType`, `targetEntity`, `role`, `riskClass`, `domainScope`, `mandatoryPreStatePredicates`, `allowedStateDelta`, `expectedPostState`, `requiredContextPredicates`, `forbiddenContextPredicates`).
   - Invariant across UI restyling, volatile framework IDs/classes, coordinate/layout shifts, cosmetic label variations, and per-execution runtime timestamps or event IDs.
2. **Stable Transition Signature Semantics (`tb_sha256_<64hex>`):**
   - Computed over `preStateFingerprint`, `activationEventExpected`, `expectedStateDelta`, `postStateFingerprint`, and `verificationWindowMs` under domain `INTENTNAV_SCFR_TRANSITION_BINDING_V2` (with optional binding to `capabilityFingerprintHash` on `FunctionalCapabilityFingerprint.transitionSignatureBinding`).
3. **Runtime Execution Context (`TransitionVerificationToken`):**
   - Per-execution values (`activationEventId`, `issuedTimestamp`, observed `TransitionWitness` records) are bound into `witnessEvidenceHash` (`we_sha256_<64hex>`), `witnessDigest` (`wd_sha256_<64hex>`), and the HMAC-SHA-256 `signatureHash` (`hmac_sha256_<64hex>`), along with optional `capabilityFingerprintHash` verification (`CAPABILITY_FINGERPRINT_MISMATCH`).

---

## 8. Backward-Compatibility / Version Handling (`v1_legacy` vs `v2`)

- Every capability constructed or registered at runtime carries `fingerprintVersion: 'v2'` and `fingerprintHash: 'capfp_sha256_<64hex>'`.
- [`PersistentCapabilityStore.hydrateCapability`](file:///Users/kumarmilind/Desktop/Navigation/src/core/storage/persistentStore.ts) automatically migrates any persisted capability record holding a missing or `v1_legacy` (`fph_...`) hash to `v2` (`capfp_sha256_<64hex>`) upon hydration.
- [`FingerprintConstructor.matchesCapabilityFingerprint`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts) and [`scripts/validateChromiumEvidence.js`](file:///Users/kumarmilind/Desktop/Navigation/scripts/validateChromiumEvidence.js) enforce explicit version classification (`'v2'` vs `'v1_legacy'`), allowing frozen baseline evidence artifacts (`intentnav-evidence-baseline-v1.0`) to be verified deterministically without modifying frozen baseline files.

---

## 9. Files Modified

- [`src/types/capability.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/capability.ts)
- [`src/types/transition.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts)
- [`src/core/fingerprint/suppressor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/suppressor.ts)
- [`src/core/fingerprint/constructor.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/fingerprint/constructor.ts)
- [`src/core/capability/catalog.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/capability/catalog.ts)
- [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts)
- [`src/core/storage/persistentStore.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/storage/persistentStore.ts)
- [`src/core/contradiction/store.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/contradiction/store.ts)
- [`src/core/quarantine/tokenAuthenticator.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/tokenAuthenticator.ts)
- [`scripts/validateChromiumEvidence.js`](file:///Users/kumarmilind/Desktop/Navigation/scripts/validateChromiumEvidence.js)
- [`test/unit/fingerprint.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/fingerprint.spec.ts)
- [`test/unit/generic_capability.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/generic_capability.spec.ts)
- [`docs/FINAL_CLAIM_SUPPORT_MATRIX.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/FINAL_CLAIM_SUPPORT_MATRIX.md)
- [`docs/PATENT_HARDENING_STEP_02_FINGERPRINT_SHA256.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/PATENT_HARDENING_STEP_02_FINGERPRINT_SHA256.md)

---

## 10. Tests Added & Updated

In [`test/unit/fingerprint.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/fingerprint.spec.ts) (26 total tests in file; 300 total tests across all 26 test files):

- **TESTS A–E:** Requirement 1 & Requirement 19 regression suite updated for `v2` `capfp_sha256_<64hex>` and explicit `v1_legacy` $\to$ `v2` evidence verification.
- **TEST 1 — Determinism:** Repeated sync and async invocations produce identical canonical JSON and identical `capfp_sha256_<64hex>` digests.
- **TEST 2 — Key-Order Invariance:** Permuted top-level and nested object key orders produce identical canonical representations and SHA-256 digests.
- **TEST 3 — Set-Order Invariance:** Permuted and duplicate entries in `mandatoryPreStatePredicates`, `allowedStateDelta`, `expectedPostState`, `requiredContextPredicates`, and `forbiddenContextPredicates` produce identical SHA-256 digests.
- **TEST 4 — Volatile ID / CSS Suppression:** React (`react-aria-*`, `:r1a:`), Vue (`vue-uid-*`), Emotion (`css-*`), styled-components (`sc-*`), CSS modules, and Tailwind classes are suppressed and yield identical capability fingerprints.
- **TEST 5 — Coordinate / Layout Invariance:** Different DOM container hierarchies, bounding boxes, pixel coordinates, and XPaths yield identical capability fingerprints.
- **TEST 6 — Cosmetic Label Variation vs Canonical Function:** Different `visibleLabel`, `accessibleName`, and `canonicalLabel` strings yield identical capability fingerprints when canonical functional fields are unchanged.
- **TEST 7 — Action Type Sensitivity:** Distinct `actionType` values produce distinct SHA-256 fingerprints.
- **TEST 8 — Target Entity Sensitivity:** Distinct `targetEntity` values produce distinct SHA-256 fingerprints.
- **TEST 9 — Risk Class Sensitivity:** Distinct `riskClass` values produce distinct SHA-256 fingerprints.
- **TEST 10 — Pre-State / Post-State Predicate Sensitivity:** Changes to pre-state predicates, primitive post-state values, or nested object post-state values produce distinct SHA-256 fingerprints.
- **TEST 11 — Allowed Delta Sensitivity:** Changes to `allowedStateDelta` properties or expected transitions produce distinct SHA-256 fingerprints.
- **TEST 12 — Transition Signature Binding Sensitivity:** Changes to `TransitionSignature` fields produce distinct `tb_sha256_<64hex>` bindings and cause `PromotionTokenAuthenticator` to reject mismatched tokens with `TRANSITION_BINDING_MISMATCH`.
- **TEST 13 — Runtime Context Independence:** Varying `activationEventId`, `issuedTimestamp`, `witnessId`, and `sessionToken` leaves persistent capability identity (`capfp_sha256_<64hex>`) invariant while changing runtime token digests.
- **TEST 14 — Domain Separation:** Identical structural payloads hashed under `INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2`, `INTENTNAV_SCFR_TRANSITION_BINDING_V2`, and `INTENTNAV_SCFR_WITNESS_BINDING_V2` produce distinct 256-bit SHA-256 digests.
- **TEST 15 — Known SHA-256 Test Vectors & 2,500-Sample Collision Check:** Verifies NIST FIPS 180-4 SHA-256 vectors (`""` and `"abc"`), verifies exact canonical capability JSON against independent Node OpenSSL `crypto.createHash('sha256')`, and verifies 2,500 distinct synthetic capability specifications produce 2,500 unique `capfp_sha256_<64hex>` hashes (0 collisions).
- **Adversarial 1–4:** Verifies decoy target rejection (`CONTRADICTED`), disguised destructive control risk preservation (`DESTRUCTIVE`), spoofed DOM attribute resistance, promotion-token fingerprint mutation rejection (`CAPABILITY_FINGERPRINT_MISMATCH` / `HMAC_SIGNATURE_INVALID`), and automatic `v1_legacy` $\to$ `v2` migration on store hydration.

---

## 11. Verification Results

- `npm run typecheck`: **PASS** (0 errors)
- `npm run build`: **PASS**
- `npm test`: **PASS** (26/26 test files, 300/300 tests passing)
- `npm run validate:evidence`: **PASS** (10/10 positive Chromium scenarios verified)
- `npm run validate:evidence:neg`: **PASS** (14/14 negative Chromium safety scenarios verified)
- `npm run validate:network-privacy`: **PASS** (0 external requests, 100% localhost isolation)
- `npm run validate:rollback`: **PASS** (Scenario K lifecycle verified)
- `npm run validate:witness-classes`: **PASS** (All 6 witness classes verified)
- `npm audit`: **0 vulnerabilities**
- `git diff --check`: **PASS** (0 whitespace or formatting errors)

---

## 12. Remaining Technical Limitations

1. **Canonical Input Dependence:** SHA-256 capability fingerprint determinism guarantees that identical canonical functional specifications map to identical 256-bit digests, but relies on upstream capability specifications or candidate extraction rules to supply accurate `actionType` and `targetEntity` classifications.
2. **Async WebCrypto in Browser Content Scripts:** Because W3C `crypto.subtle.digest('SHA-256', ...)` is asynchronous in browser contexts where Node's `crypto` module is absent, browser-only callers that require synchronous fingerprint access rely on pre-populated catalog/store hashes or `computeFingerprintHashAsync` pre-computation.
3. **Engineering Scope Boundary:** This hardening step strengthens cryptographic identity representation, collision resistance, and transition-signature binding within the tested architecture and scenarios; it does not constitute a legal opinion on patentability or a universal guarantee across arbitrary uninspected third-party websites.
