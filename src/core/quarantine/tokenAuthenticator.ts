/**
 * IntentNav-SCFR: Cryptographic Promotion-Token Authenticator
 *
 * Hardens the route-promotion trust boundary using standard runtime cryptographic
 * primitives (HMAC-SHA-256 and SHA-256):
 * - Uses Node.js built-in OpenSSL `crypto` module (`createHmac`, `createHash`,
 *   `randomBytes`, `timingSafeEqual`) when executing in Node.js runtimes.
 * - Uses W3C Web Cryptography API (`globalThis.crypto.subtle` HMAC-SHA-256 and
 *   SHA-256 digest with `getRandomValues`) when executing in browser extension
 *   runtimes.
 * - Does NOT implement custom cryptographic primitives.
 * - Secret HMAC key is generated via CSPRNG and encapsulated within a private
 *   class field (`#secretKey`) inside the trusted extension/verifier execution
 *   context; it is never exposed to untrusted page content, DOM attributes,
 *   serialized state, or external network services.
 * - Enforces deterministic canonical serialization (lexicographically sorted
 *   keys and normalized arrays) over stable verification context fields:
 *   routeId, capabilityId, activationEventId, verifiedStatus,
 *   verifiedWitnessClasses, transitionBinding, witnessDigest, and issuedTimestamp.
 */

import {
  TransitionSignature,
  TransitionVerificationToken,
  TransitionWitness,
  WitnessClass,
} from '../../types/transition';

export interface IssuePromotionTokenParams {
  tokenId?: string;
  routeId: string;
  capabilityId: string;
  activationEventId: string;
  verifiedWitnessClasses: WitnessClass[];
  transitionSignature?: TransitionSignature;
  observedWitnesses?: TransitionWitness[];
  issuedTimestamp?: number;
}

export interface VerifyPromotionTokenExpectations {
  expectedRouteId: string;
  expectedCapabilityId: string;
  expectedActivationEventId?: string;
  expectedTransitionSignature?: TransitionSignature;
  minWitnessClasses?: number;
}

export type TokenVerificationFailureCode =
  | 'TOKEN_MISSING'
  | 'INVALID_STATUS'
  | 'ROUTE_ID_MISMATCH'
  | 'CAPABILITY_ID_MISMATCH'
  | 'ACTIVATION_EVENT_ID_INVALID'
  | 'WITNESS_QUORUM_INSUFFICIENT'
  | 'ISSUED_TIMESTAMP_INVALID'
  | 'TRANSITION_BINDING_MISMATCH'
  | 'WITNESS_DIGEST_MISMATCH'
  | 'HMAC_SIGNATURE_INVALID';

export interface TokenVerificationOutcome {
  valid: boolean;
  reason: string;
  failedCheck?: TokenVerificationFailureCode;
}

interface NodeCryptoModule {
  randomBytes(size: number): Uint8Array;
  createHash(algorithm: string): {
    update(data: string | Uint8Array, inputEncoding?: string): { digest(encoding: 'hex'): string };
  };
  createHmac(
    algorithm: string,
    key: Uint8Array
  ): {
    update(data: string | Uint8Array, inputEncoding?: string): { digest(encoding: 'hex'): string };
  };
  timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

function getNodeCrypto(): NodeCryptoModule | null {
  try {
    const proc = (globalThis as any).process;
    if (proc && typeof proc.getBuiltinModule === 'function') {
      const mod = proc.getBuiltinModule('crypto');
      if (mod && typeof mod.createHmac === 'function') {
        return mod as NodeCryptoModule;
      }
    }
  } catch {
    // Ignore in restricted browser contexts
  }
  return null;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 !== 0) {
    return null;
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Constant-time byte array comparison.
 * Uses Node's native `crypto.timingSafeEqual` when available, or a constant-time
 * bitwise XOR accumulator over equal-length Uint8Arrays.
 */
function constantTimeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const nodeCrypto = getNodeCrypto();
  if (nodeCrypto && typeof nodeCrypto.timingSafeEqual === 'function') {
    return nodeCrypto.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/**
 * Deterministic canonical JSON serializer.
 * Recursively sorts all object keys lexicographically so key insertion order
 * can never alter the serialized representation.
 */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 'null';
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return `[${items.join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    const entries = sortedKeys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value));
}

function generateSecretKeyBytes(): Uint8Array {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  const nodeCrypto = getNodeCrypto();
  if (nodeCrypto) {
    return new Uint8Array(nodeCrypto.randomBytes(32));
  }
  throw new Error('Cryptographic CSPRNG unavailable in current runtime environment.');
}

export class PromotionTokenAuthenticator {
  /**
   * 256-bit (32-byte) secret key held strictly in a private field within the
   * trusted extension/verifier execution context. Never exposed externally.
   */
  readonly #secretKey: Uint8Array;
  #webCryptoKeyPromise: Promise<CryptoKey> | null = null;
  /**
   * Tracks canonical payload -> verified HMAC signature tags validated via
   * asynchronous WebCrypto in browser environments where synchronous Node
   * crypto is unavailable.
   */
  readonly #verifiedWebCryptoSignatures: Map<string, string> = new Map();
  readonly #cachedSha256Digests: Map<string, string> = new Map();

  constructor(secretKeyBytes?: Uint8Array) {
    if (secretKeyBytes) {
      if (!(secretKeyBytes instanceof Uint8Array) || secretKeyBytes.byteLength < 32) {
        throw new Error('PromotionTokenAuthenticator requires at least a 256-bit (32-byte) secret key.');
      }
      this.#secretKey = new Uint8Array(secretKeyBytes);
    } else {
      this.#secretKey = generateSecretKeyBytes();
    }
  }

  private getWebCryptoKey(): Promise<CryptoKey> {
    if (!this.#webCryptoKeyPromise) {
      if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
        return Promise.reject(new Error('Web Cryptography API (crypto.subtle) is unavailable.'));
      }
      this.#webCryptoKeyPromise = globalThis.crypto.subtle.importKey(
        'raw',
        this.#secretKey as BufferSource,
        { name: 'HMAC', hash: 'SHA-256' },
        false, // non-extractable key
        ['sign', 'verify']
      );
    }
    return this.#webCryptoKeyPromise;
  }

  private sha256HexSync(canonicalInput: string): string {
    const nodeCrypto = getNodeCrypto();
    if (!nodeCrypto) {
      throw new Error(
        'Synchronous SHA-256 requires Node.js crypto module; use async method in browser WebCrypto environments.'
      );
    }
    return nodeCrypto.createHash('sha256').update(canonicalInput, 'utf8').digest('hex');
  }

  private async sha256HexAsync(canonicalInput: string): Promise<string> {
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      return nodeCrypto.createHash('sha256').update(canonicalInput, 'utf8').digest('hex');
    }
    const bytes = new TextEncoder().encode(canonicalInput);
    const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
    return bytesToHex(new Uint8Array(digestBuffer));
  }

  private hmacSha256HexSync(canonicalInput: string): string {
    const nodeCrypto = getNodeCrypto();
    if (!nodeCrypto) {
      throw new Error(
        'Synchronous HMAC-SHA-256 requires Node.js crypto module; use async method in browser WebCrypto environments.'
      );
    }
    return nodeCrypto.createHmac('sha256', this.#secretKey).update(canonicalInput, 'utf8').digest('hex');
  }

  private async hmacSha256HexAsync(canonicalInput: string): Promise<string> {
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      return nodeCrypto.createHmac('sha256', this.#secretKey).update(canonicalInput, 'utf8').digest('hex');
    }
    const cryptoKey = await this.getWebCryptoKey();
    const bytes = new TextEncoder().encode(canonicalInput);
    const sigBuffer = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, bytes as BufferSource);
    const hex = bytesToHex(new Uint8Array(sigBuffer));
    this.#verifiedWebCryptoSignatures.set(canonicalInput, hex);
    return hex;
  }

  /**
   * Canonicalizes stable transition semantics from TransitionSignature.
   * Excludes volatile timing measurements while binding preStateFingerprint,
   * activationEventExpected, expectedStateDelta, verificationWindowMs, and postStateFingerprint.
   */
  public static buildCanonicalTransitionSemantics(signature?: TransitionSignature | null): string {
    if (!signature || typeof signature !== 'object') {
      return canonicalize({
        activationEventExpected: { code: null, eventType: 'click', key: null, keyCode: null },
        expectedStateDelta: {},
        postStateFingerprint: '',
        preStateFingerprint: '',
        verificationWindowMs: 2000,
      });
    }
    return canonicalize({
      activationEventExpected: {
        code: signature.activationEventExpected?.code ?? null,
        eventType: signature.activationEventExpected?.eventType ?? 'click',
        key: signature.activationEventExpected?.key ?? null,
        keyCode: signature.activationEventExpected?.keyCode ?? null,
      },
      expectedStateDelta: signature.expectedStateDelta ?? {},
      postStateFingerprint: signature.postStateFingerprint ?? '',
      preStateFingerprint: signature.preStateFingerprint ?? '',
      verificationWindowMs: signature.verificationWindowMs ?? 2000,
    });
  }

  public computeTransitionBinding(signature?: TransitionSignature | null): string {
    const canonicalSemantics = PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(signature);
    const binding = `tb_sha256_${this.sha256HexSync(canonicalSemantics)}`;
    this.#cachedSha256Digests.set(canonicalSemantics, binding);
    return binding;
  }

  public async computeTransitionBindingAsync(signature?: TransitionSignature | null): Promise<string> {
    const canonicalSemantics = PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(signature);
    const hex = await this.sha256HexAsync(canonicalSemantics);
    const binding = `tb_sha256_${hex}`;
    this.#cachedSha256Digests.set(canonicalSemantics, binding);
    return binding;
  }

  /**
   * Canonicalizes observed causal witness records (excluding volatile arrival timestamps
   * while binding witnessClass, correlatedActivationEventId, and observedDelta).
   */
  public static buildCanonicalWitnessEvidence(observedWitnesses?: TransitionWitness[] | null): string {
    if (!Array.isArray(observedWitnesses) || observedWitnesses.length === 0) {
      return canonicalize([]);
    }
    const normalizedRecords = observedWitnesses
      .map((w) => ({
        correlatedActivationEventId: w.correlatedActivationEventId ?? null,
        observedDelta: w.observedDelta ?? {},
        witnessClass: w.witnessClass,
      }))
      .sort((a, b) => {
        const strA = `${a.witnessClass}:${canonicalize(a.observedDelta)}`;
        const strB = `${b.witnessClass}:${canonicalize(b.observedDelta)}`;
        return strA.localeCompare(strB);
      });
    return canonicalize(normalizedRecords);
  }

  public computeWitnessEvidenceHash(observedWitnesses?: TransitionWitness[] | null): string {
    const canonicalEvidence = PromotionTokenAuthenticator.buildCanonicalWitnessEvidence(observedWitnesses);
    const hash = `we_sha256_${this.sha256HexSync(canonicalEvidence)}`;
    this.#cachedSha256Digests.set(canonicalEvidence, hash);
    return hash;
  }

  public async computeWitnessEvidenceHashAsync(
    observedWitnesses?: TransitionWitness[] | null
  ): Promise<string> {
    const canonicalEvidence = PromotionTokenAuthenticator.buildCanonicalWitnessEvidence(observedWitnesses);
    const hex = await this.sha256HexAsync(canonicalEvidence);
    const hash = `we_sha256_${hex}`;
    this.#cachedSha256Digests.set(canonicalEvidence, hash);
    return hash;
  }

  public static buildCanonicalWitnessBindingInput(
    verifiedWitnessClasses: WitnessClass[],
    activationEventId: string,
    witnessEvidenceHash?: string
  ): string {
    const sortedClasses = Array.from(new Set(verifiedWitnessClasses || [])).sort();
    return canonicalize({
      activationEventId,
      verifiedWitnessClasses: sortedClasses,
      witnessClassCount: sortedClasses.length,
      witnessEvidenceHash: witnessEvidenceHash ?? 'we_sha256_none',
    });
  }

  public computeWitnessDigest(
    verifiedWitnessClasses: WitnessClass[],
    activationEventId: string,
    witnessEvidenceHash?: string
  ): string {
    const canonicalInput = PromotionTokenAuthenticator.buildCanonicalWitnessBindingInput(
      verifiedWitnessClasses,
      activationEventId,
      witnessEvidenceHash
    );
    const digest = `wd_sha256_${this.sha256HexSync(canonicalInput)}`;
    this.#cachedSha256Digests.set(canonicalInput, digest);
    return digest;
  }

  public async computeWitnessDigestAsync(
    verifiedWitnessClasses: WitnessClass[],
    activationEventId: string,
    witnessEvidenceHash?: string
  ): Promise<string> {
    const canonicalInput = PromotionTokenAuthenticator.buildCanonicalWitnessBindingInput(
      verifiedWitnessClasses,
      activationEventId,
      witnessEvidenceHash
    );
    const hex = await this.sha256HexAsync(canonicalInput);
    const digest = `wd_sha256_${hex}`;
    this.#cachedSha256Digests.set(canonicalInput, digest);
    return digest;
  }

  /**
   * Produces the deterministic canonical message authenticated by HMAC-SHA-256.
   */
  public static serializeCanonicalTokenPayload(token: {
    routeId: string;
    capabilityId: string;
    activationEventId: string;
    verifiedStatus: string;
    verifiedWitnessClasses: WitnessClass[];
    transitionBinding?: string;
    witnessDigest?: string;
    issuedTimestamp: number;
  }): string {
    const sortedClasses = Array.from(new Set(token.verifiedWitnessClasses || [])).sort();
    return canonicalize({
      activationEventId: token.activationEventId,
      algorithm: 'HMAC-SHA-256',
      capabilityId: token.capabilityId,
      domain: 'INTENTNAV_SCFR_PROMOTION_TOKEN_V1',
      issuedTimestamp: token.issuedTimestamp,
      routeId: token.routeId,
      transitionBinding: token.transitionBinding ?? '',
      verifiedStatus: token.verifiedStatus,
      verifiedWitnessClasses: sortedClasses,
      witnessDigest: token.witnessDigest ?? '',
    });
  }

  /**
   * Synchronously mints a cryptographically authenticated TransitionVerificationToken.
   */
  public issueToken(params: IssuePromotionTokenParams): TransitionVerificationToken {
    const issuedTimestamp = params.issuedTimestamp ?? Date.now();
    const distinctClasses = Array.from(new Set(params.verifiedWitnessClasses || []));
    const transitionBinding = this.computeTransitionBinding(params.transitionSignature);
    const witnessEvidenceHash = this.computeWitnessEvidenceHash(params.observedWitnesses);
    const witnessDigest = this.computeWitnessDigest(
      distinctClasses,
      params.activationEventId,
      witnessEvidenceHash
    );

    const payload = {
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      activationEventId: params.activationEventId,
      verifiedStatus: 'VERIFIED' as const,
      verifiedWitnessClasses: distinctClasses,
      transitionBinding,
      witnessDigest,
      issuedTimestamp,
    };

    const canonicalMessage = PromotionTokenAuthenticator.serializeCanonicalTokenPayload(payload);
    const hmacHex = this.hmacSha256HexSync(canonicalMessage);

    return {
      tokenId: params.tokenId ?? `tok_${issuedTimestamp}_${hmacHex.slice(0, 12)}`,
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      activationEventId: params.activationEventId,
      verifiedWitnessClasses: distinctClasses,
      transitionSignature: params.transitionSignature,
      transitionBinding,
      witnessDigest,
      witnessEvidenceHash,
      issuedTimestamp,
      verifiedStatus: 'VERIFIED',
      algorithm: 'HMAC-SHA-256',
      signatureHash: `hmac_sha256_${hmacHex}`,
    };
  }

  /**
   * Asynchronously mints a cryptographically authenticated TransitionVerificationToken
   * (supports both Web Cryptography API in browsers and Node.js crypto).
   */
  public async issueTokenAsync(params: IssuePromotionTokenParams): Promise<TransitionVerificationToken> {
    const issuedTimestamp = params.issuedTimestamp ?? Date.now();
    const distinctClasses = Array.from(new Set(params.verifiedWitnessClasses || []));
    const transitionBinding = await this.computeTransitionBindingAsync(params.transitionSignature);
    const witnessEvidenceHash = await this.computeWitnessEvidenceHashAsync(params.observedWitnesses);
    const witnessDigest = await this.computeWitnessDigestAsync(
      distinctClasses,
      params.activationEventId,
      witnessEvidenceHash
    );

    const payload = {
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      activationEventId: params.activationEventId,
      verifiedStatus: 'VERIFIED' as const,
      verifiedWitnessClasses: distinctClasses,
      transitionBinding,
      witnessDigest,
      issuedTimestamp,
    };

    const canonicalMessage = PromotionTokenAuthenticator.serializeCanonicalTokenPayload(payload);
    const hmacHex = await this.hmacSha256HexAsync(canonicalMessage);

    return {
      tokenId: params.tokenId ?? `tok_${issuedTimestamp}_${hmacHex.slice(0, 12)}`,
      routeId: params.routeId,
      capabilityId: params.capabilityId,
      activationEventId: params.activationEventId,
      verifiedWitnessClasses: distinctClasses,
      transitionSignature: params.transitionSignature,
      transitionBinding,
      witnessDigest,
      witnessEvidenceHash,
      issuedTimestamp,
      verifiedStatus: 'VERIFIED',
      algorithm: 'HMAC-SHA-256',
      signatureHash: `hmac_sha256_${hmacHex}`,
    };
  }

  /**
   * Performs structural and binding validations common to sync and async paths.
   */
  private validateStructuralFields(
    token: TransitionVerificationToken,
    expectations: VerifyPromotionTokenExpectations
  ): TokenVerificationOutcome | null {
    if (!token || typeof token !== 'object') {
      return {
        valid: false,
        failedCheck: 'TOKEN_MISSING',
        reason:
          'INVARIANT VIOLATION: Cannot promote provisional route to ACTIVE_VALIDATED without a valid TransitionVerificationToken.',
      };
    }

    if (token.verifiedStatus !== 'VERIFIED') {
      return {
        valid: false,
        failedCheck: 'INVALID_STATUS',
        reason: `INVARIANT VIOLATION: TransitionVerificationToken status is '${token.verifiedStatus}'; must be 'VERIFIED'.`,
      };
    }

    if (!token.capabilityId || token.capabilityId !== expectations.expectedCapabilityId) {
      return {
        valid: false,
        failedCheck: 'CAPABILITY_ID_MISMATCH',
        reason: `INVARIANT VIOLATION: Token capabilityId '${token.capabilityId}' does not match route capabilityId '${expectations.expectedCapabilityId}'.`,
      };
    }

    if (!token.routeId || token.routeId !== expectations.expectedRouteId) {
      return {
        valid: false,
        failedCheck: 'ROUTE_ID_MISMATCH',
        reason: `INVARIANT VIOLATION: Token routeId '${token.routeId}' does not match target routeId '${expectations.expectedRouteId}'. A valid token for capability ${expectations.expectedCapabilityId} cannot promote another route version.`,
      };
    }

    if (
      !token.activationEventId ||
      typeof token.activationEventId !== 'string' ||
      token.activationEventId.trim().length === 0 ||
      (expectations.expectedActivationEventId !== undefined &&
        token.activationEventId !== expectations.expectedActivationEventId)
    ) {
      return {
        valid: false,
        failedCheck: 'ACTIVATION_EVENT_ID_INVALID',
        reason: `INVARIANT VIOLATION: Token activationEventId '${token.activationEventId}' is missing, invalid, or does not match expected activation event.`,
      };
    }

    const minClasses = expectations.minWitnessClasses ?? 2;
    const distinctClasses = Array.isArray(token.verifiedWitnessClasses)
      ? Array.from(new Set(token.verifiedWitnessClasses))
      : [];
    if (distinctClasses.length < minClasses) {
      return {
        valid: false,
        failedCheck: 'WITNESS_QUORUM_INSUFFICIENT',
        reason:
          'INVARIANT VIOLATION: Token does not demonstrate the required quorum of >=2 independent witness classes.',
      };
    }

    if (
      typeof token.issuedTimestamp !== 'number' ||
      !Number.isFinite(token.issuedTimestamp) ||
      token.issuedTimestamp <= 0
    ) {
      return {
        valid: false,
        failedCheck: 'ISSUED_TIMESTAMP_INVALID',
        reason: `INVARIANT VIOLATION: Token issuedTimestamp '${token.issuedTimestamp}' is missing or invalid.`,
      };
    }

    if (
      !token.transitionBinding ||
      typeof token.transitionBinding !== 'string' ||
      !/^tb_sha256_[0-9a-f]{64}$/.test(token.transitionBinding)
    ) {
      return {
        valid: false,
        failedCheck: 'TRANSITION_BINDING_MISMATCH',
        reason: `INVARIANT VIOLATION: Token transitionBinding '${token.transitionBinding}' is missing or malformed.`,
      };
    }

    if (
      !token.witnessDigest ||
      typeof token.witnessDigest !== 'string' ||
      !/^wd_sha256_[0-9a-f]{64}$/.test(token.witnessDigest)
    ) {
      return {
        valid: false,
        failedCheck: 'WITNESS_DIGEST_MISMATCH',
        reason: `INVARIANT VIOLATION: Token witnessDigest '${token.witnessDigest}' is missing or malformed.`,
      };
    }

    if (
      !token.signatureHash ||
      typeof token.signatureHash !== 'string' ||
      !/^hmac_sha256_[0-9a-f]{64}$/.test(token.signatureHash)
    ) {
      return {
        valid: false,
        failedCheck: 'HMAC_SIGNATURE_INVALID',
        reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`,
      };
    }

    return null;
  }

  /**
   * Synchronously verifies all structural bindings, transition/witness digests,
   * and the HMAC-SHA-256 cryptographic signature in constant time.
   */
  public verifyToken(
    token: TransitionVerificationToken,
    expectations: VerifyPromotionTokenExpectations
  ): TokenVerificationOutcome {
    const structuralError = this.validateStructuralFields(token, expectations);
    if (structuralError) {
      return structuralError;
    }

    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      if (token.transitionSignature !== undefined) {
        const expectedTb = this.computeTransitionBinding(token.transitionSignature);
        if (token.transitionBinding !== expectedTb) {
          return {
            valid: false,
            failedCheck: 'TRANSITION_BINDING_MISMATCH',
            reason:
              'INVARIANT VIOLATION: Token transitionBinding does not match token transitionSignature semantics.',
          };
        }
      }

      if (expectations.expectedTransitionSignature !== undefined) {
        const expectedTb = this.computeTransitionBinding(expectations.expectedTransitionSignature);
        if (token.transitionBinding !== expectedTb) {
          return {
            valid: false,
            failedCheck: 'TRANSITION_BINDING_MISMATCH',
            reason:
              'INVARIANT VIOLATION: Token transitionBinding does not match expected capability transition signature.',
          };
        }
      }

      const expectedWd = this.computeWitnessDigest(
        token.verifiedWitnessClasses,
        token.activationEventId,
        token.witnessEvidenceHash
      );
      if (token.witnessDigest !== expectedWd) {
        return {
          valid: false,
          failedCheck: 'WITNESS_DIGEST_MISMATCH',
          reason:
            'INVARIANT VIOLATION: Token witnessDigest does not match verifiedWitnessClasses and activationEventId.',
        };
      }

      const canonicalMessage = PromotionTokenAuthenticator.serializeCanonicalTokenPayload(token);
      const expectedHmacHex = this.hmacSha256HexSync(canonicalMessage);
      const providedHmacHex = token.signatureHash.slice('hmac_sha256_'.length);

      const expectedBytes = hexToBytes(expectedHmacHex);
      const providedBytes = hexToBytes(providedHmacHex);

      if (!expectedBytes || !providedBytes || !constantTimeEqualBytes(expectedBytes, providedBytes)) {
        return {
          valid: false,
          failedCheck: 'HMAC_SIGNATURE_INVALID',
          reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`,
        };
      }

      return {
        valid: true,
        reason: 'Token cryptographically authenticated via HMAC-SHA-256 and all bindings verified.',
      };
    }

    // Browser fallback when synchronous verifyToken is called after async WebCrypto verification
    if (token.transitionSignature !== undefined) {
      const canonicalSemantics = PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(
        token.transitionSignature
      );
      const cachedTb = this.#cachedSha256Digests.get(canonicalSemantics);
      if (!cachedTb || token.transitionBinding !== cachedTb) {
        return {
          valid: false,
          failedCheck: 'TRANSITION_BINDING_MISMATCH',
          reason:
            'INVARIANT VIOLATION: Token transitionBinding does not match token transitionSignature semantics.',
        };
      }
    }

    if (expectations.expectedTransitionSignature !== undefined) {
      const canonicalSemantics = PromotionTokenAuthenticator.buildCanonicalTransitionSemantics(
        expectations.expectedTransitionSignature
      );
      const cachedTb = this.#cachedSha256Digests.get(canonicalSemantics);
      if (!cachedTb || token.transitionBinding !== cachedTb) {
        return {
          valid: false,
          failedCheck: 'TRANSITION_BINDING_MISMATCH',
          reason:
            'INVARIANT VIOLATION: Token transitionBinding does not match expected capability transition signature.',
        };
      }
    }

    const canonicalWitnessInput = PromotionTokenAuthenticator.buildCanonicalWitnessBindingInput(
      token.verifiedWitnessClasses,
      token.activationEventId,
      token.witnessEvidenceHash
    );
    const cachedWd = this.#cachedSha256Digests.get(canonicalWitnessInput);
    if (!cachedWd || token.witnessDigest !== cachedWd) {
      return {
        valid: false,
        failedCheck: 'WITNESS_DIGEST_MISMATCH',
        reason:
          'INVARIANT VIOLATION: Token witnessDigest does not match verifiedWitnessClasses and activationEventId.',
      };
    }

    const canonicalMessage = PromotionTokenAuthenticator.serializeCanonicalTokenPayload(token);
    const cachedHex = this.#verifiedWebCryptoSignatures.get(canonicalMessage);
    const providedHmacHex = token.signatureHash.slice('hmac_sha256_'.length);
    const expectedBytes = cachedHex ? hexToBytes(cachedHex) : null;
    const providedBytes = hexToBytes(providedHmacHex);

    if (!expectedBytes || !providedBytes || !constantTimeEqualBytes(expectedBytes, providedBytes)) {
      return {
        valid: false,
        failedCheck: 'HMAC_SIGNATURE_INVALID',
        reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`,
      };
    }

    return {
      valid: true,
      reason: 'Token cryptographically authenticated via WebCrypto HMAC-SHA-256.',
    };
  }

  /**
   * Asynchronously verifies all structural bindings, transition/witness digests,
   * and the HMAC-SHA-256 cryptographic signature (supports WebCrypto in browsers
   * and Node.js crypto).
   */
  public async verifyTokenAsync(
    token: TransitionVerificationToken,
    expectations: VerifyPromotionTokenExpectations
  ): Promise<TokenVerificationOutcome> {
    const structuralError = this.validateStructuralFields(token, expectations);
    if (structuralError) {
      return structuralError;
    }

    if (token.transitionSignature !== undefined) {
      const expectedTb = await this.computeTransitionBindingAsync(token.transitionSignature);
      if (token.transitionBinding !== expectedTb) {
        return {
          valid: false,
          failedCheck: 'TRANSITION_BINDING_MISMATCH',
          reason:
            'INVARIANT VIOLATION: Token transitionBinding does not match token transitionSignature semantics.',
        };
      }
    }

    if (expectations.expectedTransitionSignature !== undefined) {
      const expectedTb = await this.computeTransitionBindingAsync(
        expectations.expectedTransitionSignature
      );
      if (token.transitionBinding !== expectedTb) {
        return {
          valid: false,
          failedCheck: 'TRANSITION_BINDING_MISMATCH',
          reason:
            'INVARIANT VIOLATION: Token transitionBinding does not match expected capability transition signature.',
        };
      }
    }

    const expectedWd = await this.computeWitnessDigestAsync(
      token.verifiedWitnessClasses,
      token.activationEventId,
      token.witnessEvidenceHash
    );
    if (token.witnessDigest !== expectedWd) {
      return {
        valid: false,
        failedCheck: 'WITNESS_DIGEST_MISMATCH',
        reason:
          'INVARIANT VIOLATION: Token witnessDigest does not match verifiedWitnessClasses and activationEventId.',
      };
    }

    const canonicalMessage = PromotionTokenAuthenticator.serializeCanonicalTokenPayload(token);
    const providedHmacHex = token.signatureHash.slice('hmac_sha256_'.length);
    const providedBytes = hexToBytes(providedHmacHex);
    if (!providedBytes) {
      return {
        valid: false,
        failedCheck: 'HMAC_SIGNATURE_INVALID',
        reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`,
      };
    }

    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      const expectedHmacHex = this.hmacSha256HexSync(canonicalMessage);
      const expectedBytes = hexToBytes(expectedHmacHex);
      if (!expectedBytes || !constantTimeEqualBytes(expectedBytes, providedBytes)) {
        return {
          valid: false,
          failedCheck: 'HMAC_SIGNATURE_INVALID',
          reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`,
        };
      }
    } else {
      const cryptoKey = await this.getWebCryptoKey();
      const messageBytes = new TextEncoder().encode(canonicalMessage);
      const isValid = await globalThis.crypto.subtle.verify(
        'HMAC',
        cryptoKey,
        providedBytes as BufferSource,
        messageBytes as BufferSource
      );
      if (!isValid) {
        return {
          valid: false,
          failedCheck: 'HMAC_SIGNATURE_INVALID',
          reason: `INVARIANT VIOLATION: Token signature hash is invalid or forged ('${token.signatureHash}').`,
        };
      }
      this.#verifiedWebCryptoSignatures.set(canonicalMessage, providedHmacHex.toLowerCase());
    }

    return {
      valid: true,
      reason: 'Token cryptographically authenticated via HMAC-SHA-256 and all bindings verified.',
    };
  }
}

/**
 * Default session-scoped trusted authenticator instance shared within the
 * trusted extension/verifier runtime context.
 */
export const defaultTokenAuthenticator = new PromotionTokenAuthenticator();
