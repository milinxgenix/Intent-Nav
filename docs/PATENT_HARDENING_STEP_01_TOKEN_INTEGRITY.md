# Patent Hardening Step 1: Cryptographic Promotion-Token Integrity

- **Branch:** `patent-hardening-step-01-token-integrity`
- **Starting Frozen Baseline Commit:** `3392b2adcc309431a3fcff08a872524713a4782c` (`3392b2a`)
- **Frozen Tag (Preserved):** `intentnav-evidence-baseline-v1.0`

---

## 1. Audit Finding Summary

An independent technical audit of the route-promotion trust boundary (`PROVISIONAL -> ACTIVE_VALIDATED`) identified three implementation weaknesses in the prior `TransitionVerificationToken` mechanism:

1. **Non-Cryptographic Signature Generation:** `CausalTransitionVerifier.generateTokenSignature()` previously computed a 32-bit bitwise shift-and-subtract hash (`tok_<hex>`) over a pipe-delimited string (`routeId|capabilityId|activationEventId|timestamp|VALIDATED_SCFR`). It did not use a keyed cryptographic message authentication code (MAC) or bind the verified witness classes or transition signature semantics.
2. **Non-Cryptographic Promotion Gate:** `RouteManager.promoteToActive()` checked structural field equality (`verifiedStatus === 'VERIFIED'`, `capabilityId`, `routeId`, `verifiedWitnessClasses.length >= 2`) and checked only whether `signatureHash` was missing or prefixed with literal strings (`'FORGED'` / `'INVALID'`). It did not recompute or cryptographically authenticate `signatureHash`.
3. **Conflated Negative Corruption Path:** In `IntentNavMachine.processIntent()`, the `corruptPromotionToken` option simultaneously mutated `routeId: 'forged_route_mismatch_id'` and `signatureHash: 'FORGED_INVALID_TOKEN_SIGNATURE'`, causing promotion rejection to trigger on the `routeId` mismatch check prior to reaching signature verification.

---

## 2. Previous Implementation Behavior

Prior to this hardening step:

- `CausalTransitionVerifier` generated `signatureHash` via a 32-bit unkeyed integer loop (`hash = (hash << 5) - hash + charCodeAt(i)`).
- `RouteManager.promoteToActive()` accepted any `TransitionVerificationToken` whose `routeId`, `capabilityId`, `verifiedStatus`, and `verifiedWitnessClasses` matched the target route and whose `signatureHash` was any non-empty string not starting with `'FORGED'` or `'INVALID'`.
- Post-signing mutations to `activationEventId`, `verifiedWitnessClasses`, `transitionSignature`, or `issuedTimestamp`—or arbitrary forged `signatureHash` values such as `'hash_test'`—were not detected by `RouteManager.promoteToActive()`.
- `RouteManager` did not maintain a consumed-token anti-replay registry.

---

## 3. New Cryptographic Token Authentication Design

The route-promotion trust boundary is now hardened via [`PromotionTokenAuthenticator`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/tokenAuthenticator.ts) using standard runtime cryptographic primitives:

- **Cryptographic Primitive:** **HMAC-SHA-256** (256-bit tag prefixed with `hmac_sha256_`) paired with **SHA-256** content bindings (`tb_sha256_<64hex>` for transition semantics and `wd_sha256_<64hex>` for witness evidence).
- **Zero Custom Cryptography:**
  - In Node.js / Vitest runtimes, `PromotionTokenAuthenticator` uses the built-in OpenSSL-backed Node.js `crypto` module (`createHmac('sha256', key)`, `createHash('sha256')`, `randomBytes(32)`, and `timingSafeEqual`).
  - In browser extension runtimes, `PromotionTokenAuthenticator` uses the W3C Web Cryptography API (`globalThis.crypto.subtle.importKey`, `crypto.subtle.sign('HMAC', ...)`, `crypto.subtle.verify('HMAC', ...)`, `crypto.subtle.digest('SHA-256', ...)`, and `crypto.getRandomValues(new Uint8Array(32))`).
  - Both paths operate over identical UTF-8 canonical byte payloads and produce bit-for-bit identical 64-character hexadecimal digests.
- **Constant-Time Verification:** Signature comparisons compare decoded 32-byte tags using `crypto.timingSafeEqual` (or a constant-time XOR byte accumulator over equal-length `Uint8Array` buffers when running in browser fallback mode) or `crypto.subtle.verify`.

---

## 4. Canonical Token Payload Fields

[`canonicalize()`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/tokenAuthenticator.ts#L142-L168) implements a recursive, deterministic JSON serializer that lexicographically sorts all object keys at every nesting depth and normalizes witness-class sets into deduplicated, lexicographically sorted arrays.

Each minted [`TransitionVerificationToken`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts#L128-L141) binds the following canonical payload fields under domain separator `'INTENTNAV_SCFR_PROMOTION_TOKEN_V1'`:

| Canonical Payload Field | Type | Description |
| :--- | :--- | :--- |
| `domain` | `'INTENTNAV_SCFR_PROMOTION_TOKEN_V1'` | Fixed domain-separation constant preventing cross-protocol MAC reuse |
| `algorithm` | `'HMAC-SHA-256'` | Explicit MAC algorithm identifier |
| `routeId` | `string` | Exact provisional route version identifier being promoted |
| `capabilityId` | `string` | Persistent functional capability identifier |
| `activationEventId` | `string` | Unique identifier of the causally preceding browser activation event |
| `verifiedStatus` | `'VERIFIED'` | Mandatory causal verification outcome status |
| `verifiedWitnessClasses` | `WitnessClass[]` | Deduplicated, lexicographically sorted array of independent witness classes ($\ge 2$) |
| `transitionBinding` | `string` (`tb_sha256_<64hex>`) | SHA-256 digest of canonical `TransitionSignature` (`preStateFingerprint`, `activationEventExpected`, `expectedStateDelta`, `verificationWindowMs`, `postStateFingerprint`) |
| `witnessDigest` | `string` (`wd_sha256_<64hex>`) | SHA-256 digest of canonical witness binding (`activationEventId`, sorted `verifiedWitnessClasses`, `witnessClassCount`, and `witnessEvidenceHash` over observed witness deltas) |
| `issuedTimestamp` | `number` | Finite positive epoch timestamp at token issuance |

---

## 5. Secret Key Boundary and Trust Model

- **CSPRNG Key Generation:** Each `PromotionTokenAuthenticator` instance initializes a 256-bit (32-byte) secret key via `crypto.getRandomValues` / `crypto.randomBytes`.
- **Language-Level Private Encapsulation:** The secret key is stored exclusively in an ECMAScript private field (`readonly #secretKey: Uint8Array`) inside [`PromotionTokenAuthenticator`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/tokenAuthenticator.ts#L183-L206). When imported into WebCrypto, the `CryptoKey` is marked `extractable: false`.
- **Zero Untrusted Exposure:** The secret key cannot be read or enumerated by untrusted page scripts, is never written to DOM attributes or `window` globals, is never persisted in serialized route records, and is never transmitted over the network.
- **Shared Trusted Context:** `IntentNavMachine` wires a trusted `PromotionTokenAuthenticator` instance shared between `CausalTransitionVerifier` (token issuer) and `RouteManager` (token verifier). Any token minted by an external or untrusted instance with a different key is rejected during HMAC-SHA-256 verification.

---

## 6. RouteManager Independent Verification Rules

[`RouteManager.promoteToActive()`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L175-L188) and [`RouteManager.promoteToActiveAsync()`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts#L193-L210) independently enforce all 10 verification requirements before any route can transition to `ACTIVE_VALIDATED`:

1. **Token Presence:** `token` must be a non-null object (`TOKEN_MISSING`).
2. **Verified Status:** `token.verifiedStatus === 'VERIFIED'` (`INVALID_STATUS`).
3. **Capability Binding:** `token.capabilityId === capabilityId` (`CAPABILITY_ID_MISMATCH`).
4. **Route Version Binding:** `token.routeId === routeId` (`ROUTE_ID_MISMATCH`).
5. **Activation Event Binding:** `token.activationEventId` is a non-empty string and matches `expectedActivationEventId` (`ACTIVATION_EVENT_ID_INVALID`).
6. **Independent Witness Quorum:** `new Set(token.verifiedWitnessClasses).size >= 2` (`WITNESS_QUORUM_INSUFFICIENT`).
7. **Timestamp Validity:** `token.issuedTimestamp` is a finite positive number (`ISSUED_TIMESTAMP_INVALID`).
8. **Transition Semantics Binding:** `token.transitionBinding` matches `^tb_sha256_[0-9a-f]{64}$` and equals the SHA-256 digest of `token.transitionSignature` and `expectedTransitionSignature` (`TRANSITION_BINDING_MISMATCH`).
9. **Witness Evidence Digest Binding:** `token.witnessDigest` matches `^wd_sha256_[0-9a-f]{64}$` and equals the recomputed SHA-256 digest over `verifiedWitnessClasses`, `activationEventId`, and `witnessEvidenceHash` (`WITNESS_DIGEST_MISMATCH`).
10. **Cryptographic HMAC-SHA-256 Authentication, Anti-Replay & Route Eligibility:**
    - `token.signatureHash` matches `^hmac_sha256_[0-9a-f]{64}$` and passes constant-time HMAC-SHA-256 verification over the canonical token payload (`HMAC_SIGNATURE_INVALID`).
    - Neither `token.tokenId` nor `token.signatureHash` has previously been consumed in `RouteManager` (`consumedTokenIds` / `consumedSignatureHashes` anti-replay check).
    - Target route exists in `CapabilityGraphEngine` and has status `'PROVISIONAL'` or `'TRANSITION_VERIFIED'` (never `'QUARANTINED'` or `'DEMOTED'`).

In addition, [`IntentNavMachine`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts#L773-L789) was updated so that `corruptPromotionToken` preserves the valid `routeId`, `capabilityId`, `activationEventId`, `verifiedWitnessClasses`, `transitionBinding`, `witnessDigest`, and `verifiedStatus: 'VERIFIED'` while forging only `signatureHash` (`'hmac_sha256_' + '0'.repeat(64)`), ensuring Scenario N11 exercises cryptographic signature rejection directly.

---

## 7. New Tampering and Replay Test Cases

A dedicated test suite [`test/unit/token_integrity.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/token_integrity.spec.ts) was added with 10 deterministic tests covering all required tampering and replay vectors:

| Test Case | Scenario Description | Expected & Observed Outcome |
| :--- | :--- | :--- |
| **TEST 1** | Valid HMAC-SHA-256 token minted by `CausalTransitionVerifier` promotes provisional route | `promoteToActive()` succeeds; route status becomes `ACTIVE_VALIDATED` |
| **TEST 2** | Tampered `routeId` (both unmodified token used on `route_B` and `token.routeId` mutated to `route_B` without re-signing) | Promotion rejected (`ROUTE_ID_MISMATCH` / `HMAC_SIGNATURE_INVALID`); `route_B` remains `PROVISIONAL` |
| **TEST 3** | Tampered `capabilityId` (`token.capabilityId` mutated from `CAP_A` to `CAP_B` without re-signing) | Promotion rejected (`HMAC_SIGNATURE_INVALID`); route remains `PROVISIONAL` |
| **TEST 4** | Tampered `activationEventId` (mutated from `act_1` to `act_2`, both with and without recomputed `witnessDigest`) | Promotion rejected (`WITNESS_DIGEST_MISMATCH` / `HMAC_SIGNATURE_INVALID`) |
| **TEST 5** | Tampered `verifiedWitnessClasses` (mutated after signing, both with and without recomputed `witnessDigest`) | Promotion rejected (`WITNESS_DIGEST_MISMATCH` / `HMAC_SIGNATURE_INVALID`) |
| **TEST 6** | Tampered `transitionSignature` / `transitionBinding` (mutated post-state fingerprint and recomputed unkeyed `transitionBinding`) | Promotion rejected (`TRANSITION_BINDING_MISMATCH` / `HMAC_SIGNATURE_INVALID`) |
| **TEST 7** | Tampered `issuedTimestamp` (`issuedTimestamp + 1000` after signing) | Promotion rejected (`HMAC_SIGNATURE_INVALID`) |
| **TEST 8** | **Mandatory Forged `signatureHash` Test:** Valid `routeId`, `capabilityId`, `activationEventId`, `verifiedWitnessClasses` ($\ge 2$), `verifiedStatus: 'VERIFIED'`, `transitionBinding`, `witnessDigest`, `issuedTimestamp`, with only `signatureHash` flipped by 1 hex nibble, signed by a different key, or corrupted via `IntentNavMachine` `{ corruptPromotionToken: true }` | Promotion rejected solely on `HMAC_SIGNATURE_INVALID`; route quarantined (`QUARANTINED`) |
| **TEST 9** | Replay across route versions (`route_v1` token replayed on `route_v2`) and replay of consumed token after route demotion | Promotion rejected (`ROUTE_ID_MISMATCH` and anti-replay check) |
| **TEST 10** | Canonical serialization determinism across permuted object key insertion orders and sync/async WebCrypto parity | `canonicalize()` and `issueToken()` / `issueTokenAsync()` produce identical bindings and HMAC tags |

---

## 8. Verification Results

All build, static analysis, unit/integration/adversarial/E2E test suites, standalone evidence validators, and security audits passed:

- `npm run typecheck`: **PASS** (0 errors)
- `npm run build`: **PASS** (`dist/` built cleanly)
- `npm test`: **PASS** (**26/26 test files, 281/281 tests passing**, including 10/10 new tests in `test/unit/token_integrity.spec.ts`)
- `npm run validate:evidence`: **PASS** (10/10 positive Chromium scenarios verified)
- `npm run validate:evidence:neg`: **PASS** (14/14 negative Chromium scenarios verified)
- `npm run validate:network-privacy`: **PASS** (20 local requests, 0 external requests)
- `npm run validate:rollback`: **PASS** (Scenario K lifecycle and rollback verified)
- `npm run validate:witness-classes`: **PASS** (All 6 witness classes verified)
- `npm audit`: **PASS** (`found 0 vulnerabilities`)
- `git diff --check`: **PASS** (0 whitespace or formatting issues)

---

## 9. Exact Files Modified

### Core Implementation & Types
- [`src/core/quarantine/tokenAuthenticator.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/tokenAuthenticator.ts) *(new)* — `PromotionTokenAuthenticator` (HMAC-SHA-256 & SHA-256 via Node `crypto` and WebCrypto `crypto.subtle`) and deterministic `canonicalize()` serializer
- [`src/types/transition.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/types/transition.ts) — Extended `TransitionVerificationToken` interface with `transitionBinding`, `witnessDigest`, `witnessEvidenceHash`, and `algorithm`
- [`src/core/causal/verifier.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/causal/verifier.ts) — Replaced non-cryptographic `generateTokenSignature` with `PromotionTokenAuthenticator.issueToken()` and `issueTokenAsync()`
- [`src/core/graph/routeManager.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/graph/routeManager.ts) — Enforced independent cryptographic verification (`verifyPromotionToken` / `verifyPromotionTokenAsync`) and consumed-token anti-replay tracking in `promoteToActive()` / `promoteToActiveAsync()`
- [`src/core/quarantine/promotion.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/quarantine/promotion.ts) — Forwarded expected activation event and transition signature bindings to `RouteManager` and added `evaluateAndPromoteAsync()`
- [`src/core/stateMachine/machine.ts`](file:///Users/kumarmilind/Desktop/Navigation/src/core/stateMachine/machine.ts) — Wired shared `PromotionTokenAuthenticator`, updated `corruptPromotionToken` to preserve valid `routeId` while forging only `signatureHash`, and hardened Precondition 17 (`PRE_17_PROMOTION_TOKEN_VALID`)

### Automated Tests & Documentation
- [`test/unit/token_integrity.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/token_integrity.spec.ts) *(new)* — 10 unit and integration tests covering TESTS 1–9 and canonical serialization determinism
- [`test/unit/causal.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/causal.spec.ts) — Updated token signature assertion to verify `^hmac_sha256_[0-9a-f]{64}$`, `transitionBinding`, and `witnessDigest`
- [`test/unit/quarantine.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/quarantine.spec.ts) — Updated test token fixtures to mint authentic HMAC-SHA-256 tokens
- [`test/unit/graph.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/graph.spec.ts) — Updated `createTestToken` helper to mint authentic HMAC-SHA-256 tokens
- [`test/unit/persistence.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/persistence.spec.ts) — Updated route promotion test fixtures to mint authentic HMAC-SHA-256 tokens
- [`test/unit/invariant_closure_verification.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/invariant_closure_verification.spec.ts) — Updated Scenario 24 route setup fixture to mint authentic HMAC-SHA-256 token
- [`test/unit/false_success.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/unit/false_success.spec.ts) — Updated `makeValidContext` precondition knockout fixture to mint authentic HMAC-SHA-256 token
- [`test/adversarial/matrix.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/adversarial/matrix.spec.ts) — Updated `createTestToken` helper to mint authentic HMAC-SHA-256 tokens
- [`test/e2e/browser_e2e.spec.ts`](file:///Users/kumarmilind/Desktop/Navigation/test/e2e/browser_e2e.spec.ts) — Updated Scenarios 8, 11, and 12 pre-promoted route fixtures to mint authentic HMAC-SHA-256 tokens
- [`docs/PATENT_HARDENING_STEP_01_TOKEN_INTEGRITY.md`](file:///Users/kumarmilind/Desktop/Navigation/docs/PATENT_HARDENING_STEP_01_TOKEN_INTEGRITY.md) *(new)* — Step 1 engineering report
