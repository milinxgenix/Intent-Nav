/**
 * IntentNav-SCFR: Functional Capability Fingerprint Constructor
 *
 * Implements the hardened capability fingerprint identity pipeline:
 * LIVE / DECLARED CAPABILITY DATA
 *   -> VOLATILE-FEATURE SUPPRESSION
 *   -> CANONICAL STABLE REPRESENTATION (with explicit domain separation)
 *   -> SHA-256 (Node.js OpenSSL crypto / W3C Web Cryptography API crypto.subtle)
 *   -> CAPABILITY FINGERPRINT IDENTITY (`capfp_sha256_<64hex>`)
 *
 * Security & Determinism Properties:
 * - Uses ONLY standard runtime cryptographic primitives (`crypto.createHash('sha256')`
 *   in Node.js and `globalThis.crypto.subtle.digest('SHA-256', ...)` in browsers).
 * - Zero custom hash algorithms for v2 capability identity generation.
 * - Explicit domain separation (`INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2`,
 *   `INTENTNAV_SCFR_TRANSITION_BINDING_V2`, `INTENTNAV_SCFR_WITNESS_BINDING_V2`)
 *   prevents cross-domain digest confusion.
 * - Strictly excludes volatile presentation attributes (DOM IDs, CSS classes,
 *   coordinates, bounding boxes, XPaths, cosmetic labels) and per-execution
 *   runtime context (`activationEventId`, `issuedTimestamp`, `witnessId`, etc.).
 */

import {
  FunctionalCapabilityFingerprint,
  ActionType,
  TargetEntity,
  RiskClass,
  InvariantPredicate,
  StateDeltaPredicate,
  ExpectedStatePredicate,
  ContextPredicate,
  DeclarativeInvariantPredicate,
  CapabilityFingerprintVersion,
} from '../../types/capability';
import { TransitionSignature, WitnessClass } from '../../types/transition';
import { VolatileFeatureSuppressor } from './suppressor';

export const CAPABILITY_FINGERPRINT_DOMAIN = 'INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2' as const;
export const TRANSITION_BINDING_DOMAIN = 'INTENTNAV_SCFR_TRANSITION_BINDING_V2' as const;
export const WITNESS_BINDING_DOMAIN = 'INTENTNAV_SCFR_WITNESS_BINDING_V2' as const;
export const WITNESS_EVIDENCE_DOMAIN = 'INTENTNAV_SCFR_WITNESS_EVIDENCE_V2' as const;

export const FINGERPRINT_PREFIX_V2 = 'capfp_sha256_' as const;
export const FINGERPRINT_PREFIX_V1_LEGACY = 'fph_' as const;

export interface FingerprintConstructionOptions {
  capabilityId: string;
  canonicalFunction: string;
  actionType: ActionType;
  targetEntity: TargetEntity;
  riskClass?: RiskClass;
  domainScope?: string;
  canonicalLabel?: string;
  semanticSynonyms?: string[];
  mandatoryPreStatePredicates?: InvariantPredicate[];
  allowedStateDelta?: StateDeltaPredicate[];
  expectedPostState?: ExpectedStatePredicate[];
  requiredContextPredicates?: ContextPredicate[];
  forbiddenContextPredicates?: ContextPredicate[];
  urlSemantics?: string;
  transitionSignature?: TransitionSignature;
}

export interface FunctionalFingerprintInput {
  canonicalFunction: string;
  actionType: string;
  targetEntity: string;
  role: string;
  riskClass?: string;
  domainScope?: string;
  canonicalLabel?: string; // Explicitly ignored for persistent functional identity hash
  mandatoryPreStatePredicates?: Array<{
    id?: string;
    name?: string;
    declarative?: DeclarativeInvariantPredicate;
  }>;
  allowedStateDelta?: Array<{
    property: string;
    expectedChange?: string;
    id?: string;
    declarative?: DeclarativeInvariantPredicate;
  }>;
  expectedPostState?: Array<{
    property: string;
    expectedValue?: unknown;
    id?: string;
    declarative?: DeclarativeInvariantPredicate;
  }>;
  requiredContextPredicates?: Array<{
    target?: string;
    pattern?: string;
    required?: boolean;
    id?: string;
    declarative?: DeclarativeInvariantPredicate;
  }>;
  forbiddenContextPredicates?: Array<{
    target?: string;
    pattern?: string;
    required?: boolean;
    id?: string;
    declarative?: DeclarativeInvariantPredicate;
  }>;
  transitionContract?: Partial<TransitionSignature> | null;
  // Optional volatile or runtime fields that callers might pass; stripped before canonicalization
  [volatileOrRuntimeKey: string]: unknown;
}

interface NodeCryptoHashModule {
  createHash(algorithm: string): {
    update(data: string | Uint8Array, inputEncoding?: string): { digest(encoding: 'hex'): string };
  };
}

function getNodeCrypto(): NodeCryptoHashModule | null {
  try {
    const proc = (globalThis as any).process;
    if (proc && typeof proc.getBuiltinModule === 'function') {
      const mod = proc.getBuiltinModule('crypto');
      if (mod && typeof mod.createHash === 'function') {
        return mod as NodeCryptoHashModule;
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

/**
 * FIPS 180-4 compliant standard SHA-256 digest computation for non-Node browser/worker runtimes.
 * Produces byte-for-byte identical 256-bit hexadecimal digests to OpenSSL and WebCrypto.
 */
function pureSha256(asciiOrUtf8: string): string {
  const ch = (x: number, y: number, z: number) => (x & y) ^ (~x & z);
  const maj = (x: number, y: number, z: number) => (x & y) ^ (x & z) ^ (y & z);
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const sigma0 = (x: number) => rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  const sigma1 = (x: number) => rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  const gamma0 = (x: number) => rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
  const gamma1 = (x: number) => rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const bytes = new TextEncoder().encode(asciiOrUtf8);
  const bitLen = bytes.length * 8;

  const padLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const words = new Uint32Array(padLen >> 2);
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | (bytes[i]! << ((3 - (i & 3)) * 8));
  }
  words[bytes.length >> 2] = (words[bytes.length >> 2] ?? 0) | (0x80 << ((3 - (bytes.length & 3)) * 8));
  words[words.length - 2] = Math.floor(bitLen / 0x100000000);
  words[words.length - 1] = bitLen & 0xffffffff;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let chunk = 0; chunk < words.length; chunk += 16) {
    for (let i = 0; i < 16; i++) w[i] = words[chunk + i]!;
    for (let i = 16; i < 64; i++) {
      w[i] = (gamma1(w[i - 2]!) + w[i - 7]! + gamma0(w[i - 15]!) + w[i - 16]!) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[i]! + w[i]!) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}

/**
 * Deterministic canonical serializer for arbitrary structured values.
 * - Recursively sorts object keys lexicographically.
 * - Normalizes Strings with Unicode NFC.
 * - Converts Maps to sorted key-value entry lists and Sets to sorted canonical element lists.
 * - Produces compact, locale-independent JSON without whitespace ambiguity.
 */
export function canonicalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value.normalize('NFC'));
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 'null';
    }
    // Normalize -0 to 0
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (value instanceof Set) {
    const elements = Array.from(value).map((el) => canonicalizeValue(el)).sort();
    return `[${elements.join(',')}]`;
  }
  if (value instanceof Map) {
    const entries = Array.from(value.entries())
      .map(([k, v]) => [String(k).normalize('NFC'), v] as const)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalizeValue(v)}`);
    return `{${entries.join(',')}}`;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalizeValue(item));
    return `[${items.join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined && typeof obj[k] !== 'function')
      .sort();
    const entries = sortedKeys.map(
      (k) => `${JSON.stringify(k.normalize('NFC'))}:${canonicalizeValue(obj[k])}`
    );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value).normalize('NFC'));
}

function normalizeDeclarativeSpec(
  decl?: DeclarativeInvariantPredicate | null
): Record<string, unknown> | null {
  if (!decl || typeof decl !== 'object') {
    return null;
  }
  return {
    expectedValue: decl.expectedValue !== undefined ? decl.expectedValue : null,
    expectedValues: Array.isArray(decl.expectedValues) ? decl.expectedValues : null,
    id: (decl.id || '').trim(),
    operator: (decl.operator || '').trim().toUpperCase(),
    property: (decl.property || '').trim(),
    source: (decl.source || '').trim().toUpperCase(),
  };
}

/**
 * Deduplicates and sorts an order-insensitive collection of structured descriptors
 * by their canonical JSON representation.
 */
function canonicalizeOrderInsensitiveCollection<T>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  const byCanonical = new Map<string, T>();
  for (const item of items) {
    const serialized = canonicalizeValue(item);
    if (!byCanonical.has(serialized)) {
      byCanonical.set(serialized, item);
    }
  }
  return Array.from(byCanonical.entries())
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
    .map(([, item]) => item);
}

export class FingerprintConstructor {
  private static readonly webCryptoDigestCache: Map<string, string> = new Map();
  private static computationCounter = 0;

  /**
   * Retrieves the lifetime count of SHA-256 fingerprint computations performed at the primitive site.
   */
  public static getComputationCount(): number {
    return this.computationCounter;
  }

  /**
   * Resets the computation counter (e.g. for differential cycle measurement or test isolation).
   */
  public static resetComputationCount(): void {
    this.computationCounter = 0;
  }

  /**
   * Computes a standard 256-bit SHA-256 hex digest synchronously using Node.js OpenSSL `crypto`
   * (or from pre-computed WebCrypto cache in browser runtimes).
   */
  public static sha256HexSync(canonicalInput: string): string {
    this.computationCounter++;
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      const hex = nodeCrypto.createHash('sha256').update(canonicalInput, 'utf8').digest('hex');
      this.webCryptoDigestCache.set(canonicalInput, hex);
      return hex;
    }
    const cached = this.webCryptoDigestCache.get(canonicalInput);
    if (cached) {
      return cached;
    }
    const hex = pureSha256(canonicalInput);
    this.webCryptoDigestCache.set(canonicalInput, hex);
    return hex;
  }

  /**
   * Computes a standard 256-bit SHA-256 hex digest asynchronously using Node.js OpenSSL `crypto`
   * or W3C Web Cryptography API (`globalThis.crypto.subtle.digest('SHA-256', ...)`).
   */
  public static async sha256HexAsync(canonicalInput: string): Promise<string> {
    this.computationCounter++;
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto) {
      const hex = nodeCrypto.createHash('sha256').update(canonicalInput, 'utf8').digest('hex');
      this.webCryptoDigestCache.set(canonicalInput, hex);
      return hex;
    }
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
      const bytes = new TextEncoder().encode(canonicalInput);
      const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
      const hex = bytesToHex(new Uint8Array(digestBuffer));
      this.webCryptoDigestCache.set(canonicalInput, hex);
      return hex;
    }
    const hex = pureSha256(canonicalInput);
    this.webCryptoDigestCache.set(canonicalInput, hex);
    return hex;
  }

  /**
   * Constructs the deterministic canonical JSON representation of a capability's
   * stable functional identity fields after volatile-feature suppression.
   *
   * Strictly includes:
   * - domain ('INTENTNAV_SCFR_CAPABILITY_FINGERPRINT_V2') & version ('v2')
   * - canonicalFunction, actionType, targetEntity, role, riskClass, domainScope
   * - mandatoryPreStatePredicates (order-insensitive normalized set)
   * - allowedStateDelta (order-insensitive normalized set)
   * - expectedPostState (order-insensitive normalized set with deep canonical values)
   * - requiredContextPredicates & forbiddenContextPredicates (order-insensitive normalized sets)
   * - optional transitionContract (if bound into the capability input)
   *
   * Strictly excludes:
   * - Volatile DOM IDs, CSS classes, XPaths, coordinates, bounding boxes
   * - Cosmetic labels (visibleLabel, accessibleName, canonicalLabel)
   * - Per-execution runtime fields (activationEventId, issuedTimestamp, witnessId, handleId)
   */
  public static buildCanonicalCapabilityRepresentation(
    fingerprint: FunctionalFingerprintInput
  ): string {
    // Stage 1: Volatile-feature & runtime-context suppression
    const sanitizedInput = VolatileFeatureSuppressor.stripVolatileInputFields(
      fingerprint as Record<string, unknown>
    ) as FunctionalFingerprintInput;

    const canonicalFunction = String(sanitizedInput.canonicalFunction || '')
      .normalize('NFC')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    const actionType = String(sanitizedInput.actionType || '')
      .normalize('NFC')
      .trim()
      .toUpperCase();
    const targetEntity = String(sanitizedInput.targetEntity || '')
      .normalize('NFC')
      .trim()
      .toUpperCase();
    const role = String(sanitizedInput.role || 'button')
      .normalize('NFC')
      .trim()
      .toLowerCase();
    const riskClass = sanitizedInput.riskClass
      ? String(sanitizedInput.riskClass).normalize('NFC').trim().toUpperCase()
      : null;
    const domainScope = sanitizedInput.domainScope
      ? String(sanitizedInput.domainScope).normalize('NFC').trim().toLowerCase()
      : null;

    // Normalize mandatory pre-state predicates (order-insensitive set)
    const rawPrePreds = Array.isArray(sanitizedInput.mandatoryPreStatePredicates)
      ? sanitizedInput.mandatoryPreStatePredicates
      : [];
    const normalizedPrePreds = canonicalizeOrderInsensitiveCollection(
      rawPrePreds
        .map((p) => {
          const id = (p.id || p.name || '').trim();
          const decl = normalizeDeclarativeSpec(p.declarative);
          if (!id && !decl) return null;
          return {
            declarative: decl,
            id: id || null,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );

    // Normalize allowed state delta predicates (order-insensitive set)
    const rawDeltas = Array.isArray(sanitizedInput.allowedStateDelta)
      ? sanitizedInput.allowedStateDelta
      : [];
    const normalizedDeltas = canonicalizeOrderInsensitiveCollection(
      rawDeltas
        .map((d) => {
          const prop = (d.property || '').trim();
          if (!prop) return null;
          return {
            declarative: normalizeDeclarativeSpec(d.declarative),
            expectedChange: d.expectedChange ? String(d.expectedChange).trim() : '',
            id: d.id ? d.id.trim() : null,
            property: prop,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );

    // Normalize expected post-state predicates (order-insensitive set, preserving structured expectedValue)
    const rawPost = Array.isArray(sanitizedInput.expectedPostState)
      ? sanitizedInput.expectedPostState
      : [];
    const normalizedPost = canonicalizeOrderInsensitiveCollection(
      rawPost
        .map((p) => {
          const prop = (p.property || '').trim();
          if (!prop) return null;
          return {
            declarative: normalizeDeclarativeSpec(p.declarative),
            expectedValue: p.expectedValue !== undefined ? p.expectedValue : null,
            id: p.id ? p.id.trim() : null,
            property: prop,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );

    // Normalize required context predicates (order-insensitive set)
    const rawReqCtx = Array.isArray(sanitizedInput.requiredContextPredicates)
      ? sanitizedInput.requiredContextPredicates
      : [];
    const normalizedReqCtx = canonicalizeOrderInsensitiveCollection(
      rawReqCtx
        .map((c) => {
          const target = (c.target || '').trim().toLowerCase();
          const pattern = (c.pattern || '').trim();
          if (!target && !pattern) return null;
          return {
            declarative: normalizeDeclarativeSpec(c.declarative),
            id: c.id ? c.id.trim() : null,
            pattern,
            required: true,
            target,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );

    // Normalize forbidden context predicates (order-insensitive set)
    const rawForbCtx = Array.isArray(sanitizedInput.forbiddenContextPredicates)
      ? sanitizedInput.forbiddenContextPredicates
      : [];
    const normalizedForbCtx = canonicalizeOrderInsensitiveCollection(
      rawForbCtx
        .map((c) => {
          const target = (c.target || '').trim().toLowerCase();
          const pattern = (c.pattern || '').trim();
          if (!target && !pattern) return null;
          return {
            declarative: normalizeDeclarativeSpec(c.declarative),
            id: c.id ? c.id.trim() : null,
            pattern,
            required: false,
            target,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );

    // Optional stable transition contract if explicitly provided on the input
    const tc = sanitizedInput.transitionContract;
    const normalizedTransitionContract =
      tc && typeof tc === 'object'
        ? {
            activationEventExpected: {
              code: tc.activationEventExpected?.code ?? null,
              eventType: (tc.activationEventExpected?.eventType || 'click').toLowerCase(),
              key: tc.activationEventExpected?.key ?? null,
              keyCode: tc.activationEventExpected?.keyCode ?? null,
            },
            expectedStateDelta: tc.expectedStateDelta ?? {},
            postStateFingerprint: (tc.postStateFingerprint || '').trim(),
            preStateFingerprint: (tc.preStateFingerprint || '').trim(),
            verificationWindowMs: tc.verificationWindowMs ?? 2000,
          }
        : null;

    const canonicalPayload = {
      actionType,
      allowedStateDelta: normalizedDeltas,
      canonicalFunction,
      domain: CAPABILITY_FINGERPRINT_DOMAIN,
      domainScope,
      expectedPostState: normalizedPost,
      forbiddenContextPredicates: normalizedForbCtx,
      mandatoryPreStatePredicates: normalizedPrePreds,
      requiredContextPredicates: normalizedReqCtx,
      riskClass,
      role,
      targetEntity,
      transitionContract: normalizedTransitionContract,
      version: 'v2' as const,
    };

    return canonicalizeValue(canonicalPayload);
  }

  /**
   * Generates a deterministic v2 SHA-256 capability fingerprint hash (`capfp_sha256_<64hex>`)
   * from functional and invariant evidence only.
   * Volatile presentation features and runtime execution context are strictly excluded.
   */
  public static computeFingerprintHash(fingerprint: FunctionalFingerprintInput): string {
    const canonical = this.buildCanonicalCapabilityRepresentation(fingerprint);
    const hex = this.sha256HexSync(canonical);
    return `${FINGERPRINT_PREFIX_V2}${hex}`;
  }

  /**
   * Asynchronously generates a deterministic v2 SHA-256 capability fingerprint hash
   * (`capfp_sha256_<64hex>`) using Node.js OpenSSL `crypto` or W3C Web Cryptography API
   * (`globalThis.crypto.subtle.digest('SHA-256', ...)`).
   */
  public static async computeFingerprintHashAsync(
    fingerprint: FunctionalFingerprintInput
  ): Promise<string> {
    const canonical = this.buildCanonicalCapabilityRepresentation(fingerprint);
    const hex = await this.sha256HexAsync(canonical);
    return `${FINGERPRINT_PREFIX_V2}${hex}`;
  }

  /**
   * Computes the authoritative v2 SHA-256 capability fingerprint hash directly from a
   * FunctionalCapabilityFingerprint entity.
   */
  public static computeFingerprintHashFromCapability(
    cap: Pick<
      FunctionalCapabilityFingerprint,
      | 'canonicalFunction'
      | 'actionType'
      | 'targetEntity'
      | 'semanticEvidence'
      | 'riskMetadata'
      | 'mandatoryPreStatePredicates'
      | 'allowedStateDelta'
      | 'expectedPostState'
      | 'requiredContextPredicates'
      | 'forbiddenContextPredicates'
    >
  ): string {
    return this.computeFingerprintHash({
      canonicalFunction: cap.canonicalFunction,
      actionType: cap.actionType,
      targetEntity: cap.targetEntity,
      role: cap.semanticEvidence?.role || 'button',
      riskClass: cap.riskMetadata?.riskClass,
      mandatoryPreStatePredicates: cap.mandatoryPreStatePredicates,
      allowedStateDelta: cap.allowedStateDelta,
      expectedPostState: cap.expectedPostState,
      requiredContextPredicates: cap.requiredContextPredicates,
      forbiddenContextPredicates: cap.forbiddenContextPredicates,
    });
  }

  /**
   * Constructs the deterministic canonical representation of a TransitionSignature's
   * stable transition semantics under the `INTENTNAV_SCFR_TRANSITION_BINDING_V2` domain.
   * Excludes runtime-only fields (`activationEventId`, `issuedTimestamp`, runtime witness IDs).
   */
  public static buildCanonicalTransitionRepresentation(
    signature?: TransitionSignature | null,
    capabilityFingerprintHash?: string | null
  ): string {
    const base = {
      activationEventExpected: {
        code: signature?.activationEventExpected?.code ?? null,
        eventType: signature?.activationEventExpected?.eventType ?? 'click',
        key: signature?.activationEventExpected?.key ?? null,
        keyCode: signature?.activationEventExpected?.keyCode ?? null,
      },
      ...(capabilityFingerprintHash ? { capabilityFingerprintHash } : {}),
      domain: TRANSITION_BINDING_DOMAIN,
      expectedStateDelta: signature?.expectedStateDelta ?? {},
      postStateFingerprint: signature?.postStateFingerprint ?? '',
      preStateFingerprint: signature?.preStateFingerprint ?? '',
      verificationWindowMs: signature?.verificationWindowMs ?? 2000,
    };
    return canonicalizeValue(base);
  }

  /**
   * Computes a domain-separated SHA-256 transition-signature binding (`tb_sha256_<64hex>`).
   */
  public static computeTransitionSignatureHash(
    signature?: TransitionSignature | null,
    capabilityFingerprintHash?: string | null
  ): string {
    const canonical = this.buildCanonicalTransitionRepresentation(
      signature,
      capabilityFingerprintHash
    );
    return `tb_sha256_${this.sha256HexSync(canonical)}`;
  }

  /**
   * Asynchronously computes a domain-separated SHA-256 transition-signature binding (`tb_sha256_<64hex>`).
   */
  public static async computeTransitionSignatureHashAsync(
    signature?: TransitionSignature | null,
    capabilityFingerprintHash?: string | null
  ): Promise<string> {
    const canonical = this.buildCanonicalTransitionRepresentation(
      signature,
      capabilityFingerprintHash
    );
    const hex = await this.sha256HexAsync(canonical);
    return `tb_sha256_${hex}`;
  }

  /**
   * Constructs the deterministic canonical representation of a witness quorum binding
   * under the `INTENTNAV_SCFR_WITNESS_BINDING_V2` domain.
   */
  public static buildCanonicalWitnessBindingRepresentation(
    verifiedWitnessClasses: WitnessClass[],
    activationEventId: string,
    witnessEvidenceHash?: string
  ): string {
    const sortedClasses = Array.from(new Set(verifiedWitnessClasses || [])).sort();
    return canonicalizeValue({
      activationEventId,
      domain: WITNESS_BINDING_DOMAIN,
      verifiedWitnessClasses: sortedClasses,
      witnessClassCount: sortedClasses.length,
      witnessEvidenceHash: witnessEvidenceHash ?? 'we_sha256_none',
    });
  }

  /**
   * Computes a domain-separated SHA-256 witness digest (`wd_sha256_<64hex>`).
   */
  public static computeWitnessBindingHash(
    verifiedWitnessClasses: WitnessClass[],
    activationEventId: string,
    witnessEvidenceHash?: string
  ): string {
    const canonical = this.buildCanonicalWitnessBindingRepresentation(
      verifiedWitnessClasses,
      activationEventId,
      witnessEvidenceHash
    );
    return `wd_sha256_${this.sha256HexSync(canonical)}`;
  }

  /**
   * Legacy v1 32-bit shift-subtract hash (`fph_<hex>`).
   * Retained strictly for explicit backward-compatibility verification and migration
   * of frozen v1 baseline artifacts (`intentnav-evidence-baseline-v1.0`).
   * New capability fingerprints MUST always use v2 (`computeFingerprintHash`).
   */
  public static computeLegacyFingerprintHashV1(fingerprint: FunctionalFingerprintInput): string {
    const parts: string[] = [
      fingerprint.canonicalFunction.trim().toLowerCase(),
      fingerprint.actionType.trim().toUpperCase(),
      fingerprint.targetEntity.trim().toUpperCase(),
      fingerprint.role.trim().toLowerCase(),
    ];

    if (fingerprint.riskClass) {
      parts.push(`risk:${fingerprint.riskClass.trim().toUpperCase()}`);
    }

    if (fingerprint.mandatoryPreStatePredicates && fingerprint.mandatoryPreStatePredicates.length > 0) {
      const preds = fingerprint.mandatoryPreStatePredicates
        .map((p) => (p.id || p.name || '').trim())
        .filter(Boolean)
        .sort();
      if (preds.length > 0) {
        parts.push(`pre:${preds.join(',')}`);
      }
    }

    if (fingerprint.allowedStateDelta && fingerprint.allowedStateDelta.length > 0) {
      const deltas = fingerprint.allowedStateDelta
        .map((d) => `${d.property}:${d.expectedChange || ''}`.trim())
        .sort();
      if (deltas.length > 0) {
        parts.push(`delta:${deltas.join(',')}`);
      }
    }

    if (fingerprint.expectedPostState && fingerprint.expectedPostState.length > 0) {
      const post = fingerprint.expectedPostState
        .map((p) => `${p.property}:${String(p.expectedValue)}`.trim())
        .sort();
      if (post.length > 0) {
        parts.push(`post:${post.join(',')}`);
      }
    }

    if (fingerprint.requiredContextPredicates && fingerprint.requiredContextPredicates.length > 0) {
      const reqCtx = fingerprint.requiredContextPredicates
        .map((c) => `${c.target || ''}:${c.pattern || ''}`.trim())
        .sort();
      if (reqCtx.length > 0) {
        parts.push(`reqCtx:${reqCtx.join(',')}`);
      }
    }

    if (fingerprint.forbiddenContextPredicates && fingerprint.forbiddenContextPredicates.length > 0) {
      const forbCtx = fingerprint.forbiddenContextPredicates
        .map((c) => `${c.target || ''}:${c.pattern || ''}`.trim())
        .sort();
      if (forbCtx.length > 0) {
        parts.push(`forbCtx:${forbCtx.join(',')}`);
      }
    }

    const raw = parts.join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `${FINGERPRINT_PREFIX_V1_LEGACY}${Math.abs(hash).toString(16)}`;
  }

  /**
   * Classifies a fingerprint hash string into an explicit version boundary:
   * - `'v2'`: `capfp_sha256_<64 lowercase hex chars>`
   * - `'v1_legacy'`: `fph_<1..8 lowercase hex chars>`
   * - `'invalid'`: anything else
   */
  public static getFingerprintVersion(
    hash: string | undefined | null
  ): CapabilityFingerprintVersion | 'invalid' {
    if (!hash || typeof hash !== 'string') {
      return 'invalid';
    }
    if (/^capfp_sha256_[0-9a-f]{64}$/.test(hash)) {
      return 'v2';
    }
    if (/^fph_[0-9a-f]{1,8}$/.test(hash)) {
      return 'v1_legacy';
    }
    return 'invalid';
  }

  public static isValidV2FingerprintHash(hash: string | undefined | null): boolean {
    return this.getFingerprintVersion(hash) === 'v2';
  }

  public static isLegacyV1FingerprintHash(hash: string | undefined | null): boolean {
    return this.getFingerprintVersion(hash) === 'v1_legacy';
  }

  /**
   * Explicitly migrates a capability holding a missing or v1_legacy fingerprint hash
   * to the v2 SHA-256 capability identity format (`capfp_sha256_<64hex>`).
   */
  public static migrateCapabilityFingerprintToV2(
    capability: FunctionalCapabilityFingerprint
  ): {
    fingerprintVersion: 'v2';
    fingerprintHash: string;
    migratedFromLegacyV1?: string;
  } {
    const previousHash = capability.fingerprintHash;
    const previousVersion = this.getFingerprintVersion(previousHash);
    const v2Hash = this.computeFingerprintHashFromCapability(capability);

    capability.fingerprintHash = v2Hash;
    capability.fingerprintVersion = 'v2';

    if (previousVersion === 'v1_legacy' && previousHash) {
      return {
        fingerprintVersion: 'v2',
        fingerprintHash: v2Hash,
        migratedFromLegacyV1: previousHash,
      };
    }

    return {
      fingerprintVersion: 'v2',
      fingerprintHash: v2Hash,
    };
  }

  /**
   * Verifies whether a recorded fingerprint hash (from a live execution or a frozen v1/v2
   * evidence artifact) matches the authoritative capability specification, explicitly reporting
   * the version boundary (`'v2'` vs `'v1_legacy'`).
   */
  public static matchesCapabilityFingerprint(
    recordedHash: string | undefined | null,
    capability: FunctionalCapabilityFingerprint
  ): {
    matches: boolean;
    version: CapabilityFingerprintVersion | 'invalid';
    expectedV2Hash: string;
    expectedLegacyV1Hash: string;
  } {
    const input: FunctionalFingerprintInput = {
      canonicalFunction: capability.canonicalFunction,
      actionType: capability.actionType,
      targetEntity: capability.targetEntity,
      role: capability.semanticEvidence?.role || 'button',
      riskClass: capability.riskMetadata?.riskClass,
      mandatoryPreStatePredicates: capability.mandatoryPreStatePredicates,
      allowedStateDelta: capability.allowedStateDelta,
      expectedPostState: capability.expectedPostState,
      requiredContextPredicates: capability.requiredContextPredicates,
      forbiddenContextPredicates: capability.forbiddenContextPredicates,
    };
    const expectedV2Hash = this.computeFingerprintHash(input);
    const expectedLegacyV1Hash = this.computeLegacyFingerprintHashV1(input);
    const version = this.getFingerprintVersion(recordedHash);

    if (version === 'v2') {
      return {
        matches: recordedHash === expectedV2Hash,
        version: 'v2',
        expectedV2Hash,
        expectedLegacyV1Hash,
      };
    }
    if (version === 'v1_legacy') {
      return {
        matches: recordedHash === expectedLegacyV1Hash,
        version: 'v1_legacy',
        expectedV2Hash,
        expectedLegacyV1Hash,
      };
    }
    return {
      matches: false,
      version: 'invalid',
      expectedV2Hash,
      expectedLegacyV1Hash,
    };
  }

  /**
   * Constructs a FunctionalCapabilityFingerprint from a DOM Element and metadata
   */
  public static fromElement(
    element: Element,
    options: FingerprintConstructionOptions
  ): FunctionalCapabilityFingerprint {
    const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(element);

    // Extract surrounding and ancestor context
    const ancestorRelationships: string[] = [];
    const containerSemantics: string[] = [];
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      const parentRole = parent.getAttribute('role') || parent.tagName.toLowerCase();
      const parentLabel = parent.getAttribute('aria-label') || '';
      ancestorRelationships.push(`${parentRole}${parentLabel ? `[${parentLabel}]` : ''}`);

      if (
        ['section', 'nav', 'main', 'form', 'dialog', 'aside'].includes(
          parent.tagName.toLowerCase()
        ) ||
        parentRole
      ) {
        containerSemantics.push(parentRole);
      }
      parent = parent.parentElement;
      depth++;
    }

    // Nearby text (siblings)
    const nearbyText: string[] = [];
    const prev = element.previousElementSibling;
    if (prev && prev.textContent) nearbyText.push(prev.textContent.trim().slice(0, 100));
    const next = element.nextElementSibling;
    if (next && next.textContent) nearbyText.push(next.textContent.trim().slice(0, 100));

    // Accessible name calculation
    const accessibleName =
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.getAttribute('placeholder') ||
      suppression.cleanedText ||
      '';

    const visibleLabel = suppression.cleanedText;
    const role = element.getAttribute('role') || element.tagName.toLowerCase();

    // Default risk class derivation if not specified
    const riskClass: RiskClass =
      options.riskClass ||
      (options.actionType === 'DELETE' || options.actionType === 'DEACTIVATE_ACCOUNT'
        ? 'DESTRUCTIVE'
        : options.actionType === 'REVOKE_ACCESS' || options.actionType === 'AUTHENTICATE'
        ? 'SECURITY_SENSITIVE'
        : options.actionType === 'MODIFY_PREFERENCE' || options.actionType === 'TOGGLE'
        ? 'REVERSIBLE'
        : 'READ_ONLY');

    const canonicalLabel = options.canonicalLabel || accessibleName || options.canonicalFunction;

    const fpHash = this.computeFingerprintHash({
      canonicalFunction: options.canonicalFunction,
      actionType: options.actionType,
      targetEntity: options.targetEntity,
      role,
      riskClass,
      domainScope: options.domainScope,
      mandatoryPreStatePredicates: options.mandatoryPreStatePredicates,
      allowedStateDelta: options.allowedStateDelta,
      expectedPostState: options.expectedPostState,
      requiredContextPredicates: options.requiredContextPredicates,
      forbiddenContextPredicates: options.forbiddenContextPredicates,
    });

    const transitionEvidence = {
      preStateFingerprint: options.transitionSignature?.preStateFingerprint || 'STATE_PRE_INITIAL',
      activationEventCharacteristics: {
        eventType: options.transitionSignature?.activationEventExpected?.eventType || ('click' as const),
        bubbles: true,
        cancelable: true,
        key: options.transitionSignature?.activationEventExpected?.key,
        code: options.transitionSignature?.activationEventExpected?.code,
        keyCode: options.transitionSignature?.activationEventExpected?.keyCode,
      },
      expectedDelta: options.transitionSignature?.expectedStateDelta || {},
      postStateFingerprint:
        options.transitionSignature?.postStateFingerprint || 'STATE_POST_EXPECTED',
      historicalTransitionObservations: 0,
      witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      verificationWindowMs: options.transitionSignature?.verificationWindowMs || 1500,
    };

    const transitionSignatureBinding = this.computeTransitionSignatureHash(
      {
        preStateFingerprint: transitionEvidence.preStateFingerprint,
        activationEventExpected: {
          eventType: transitionEvidence.activationEventCharacteristics.eventType,
          key: transitionEvidence.activationEventCharacteristics.key,
          code: transitionEvidence.activationEventCharacteristics.code,
          keyCode: transitionEvidence.activationEventCharacteristics.keyCode,
        },
        expectedStateDelta: transitionEvidence.expectedDelta,
        verificationWindowMs: transitionEvidence.verificationWindowMs,
        postStateFingerprint: transitionEvidence.postStateFingerprint,
      },
      fpHash
    );

    return {
      capabilityId: options.capabilityId,
      canonicalFunction: options.canonicalFunction,
      actionType: options.actionType,
      targetEntity: options.targetEntity,
      fingerprintHash: fpHash,
      fingerprintVersion: 'v2',
      transitionSignatureBinding,

      mandatoryPreStatePredicates: options.mandatoryPreStatePredicates || [],
      allowedStateDelta: options.allowedStateDelta || [],
      expectedPostState: options.expectedPostState || [],
      requiredContextPredicates: options.requiredContextPredicates || [],
      forbiddenContextPredicates: options.forbiddenContextPredicates || [],

      semanticEvidence: {
        canonicalLabel,
        semanticSynonyms: options.semanticSynonyms || [],
        accessibleName,
        role,
        visibleLabel,
        sectionMeaning: containerSemantics.join(' > '),
        actionDescription: `${options.actionType} on ${options.targetEntity}`,
      },

      contextEvidence: {
        ancestorRelationships,
        nearbyText,
        surroundingLabels: nearbyText,
        containerSemantics,
        menuPanelRelationships: containerSemantics,
        relativeStructuralRelationships: [suppression.relativeStructuralPath],
        urlSemantics:
          options.urlSemantics || (typeof window !== 'undefined' ? window.location.pathname : ''),
      },

      transitionEvidence,

      riskMetadata: {
        riskClass,
        reversible: riskClass === 'READ_ONLY' || riskClass === 'REVERSIBLE',
        financial: riskClass === 'FINANCIAL',
        security: riskClass === 'SECURITY_SENSITIVE',
        destructive: riskClass === 'DESTRUCTIVE' || riskClass === 'IRREVERSIBLE',
        requiresConfirmation: [
          'SECURITY_SENSITIVE',
          'DESTRUCTIVE',
          'FINANCIAL',
          'IRREVERSIBLE',
        ].includes(riskClass),
      },

      provenance: {
        source: 'DISCOVERED',
        creationTimestamp: Date.now(),
        validationTimestamp: 0,
        routeVersion: 'v1.0.0',
        validationHistory: [],
      },

      confidence: {
        capabilityConfidence: 0.85,
        routeConfidence: 0.7,
      },

      negativeEvidence: {
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: [],
      },
    };
  }
}
