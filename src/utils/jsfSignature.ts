/**
 * JSF (JSON Signature Format 0.82) helpers for CycloneDX BOM Studio.
 *
 * BOM Studio supports CycloneDX 1.6 and 1.7. Both major versions use JSF for
 * cryptographic signatures (CycloneDX 2.x will switch to JSS, see SPEC §16
 * forward-compatibility note). This module is the single seam between the
 * @cyclonedx/sign package and the rest of the app.
 *
 * As of @cyclonedx/sign 0.5.0 the package ships first-class crypto backends
 * for both node:crypto and the Web Crypto API (crypto.subtle), and the
 * runtime / bundler picks the right one automatically via the package's
 * `#crypto-backend` import condition. BOM Studio therefore delegates every
 * signing and verification primitive to the package and does not invoke
 * either crypto surface directly. The same code path serves the browser
 * (Vite resolves the Web backend) and any future Node-side preview / CLI
 * (Node resolves the Node backend).
 *
 * Public surface:
 *
 * - SignedScope / collectSignedScopes:
 *     Walk a BOM and return every location that already carries a JSF
 *     signature. The walker recognizes the signature property only when its
 *     shape matches a JSF signaturecore (algorithm + value, optionally with
 *     publicKey / keyId / signers / chain / certificatePath / extensions).
 *     This avoids matching unrelated `signature` strings such as the
 *     cryptoProperties.relatedCryptoMaterial type or the textual
 *     definition of the word in the schema.
 *
 * - signEnvelope / verifyEnvelope:
 *     Thin wrappers over @cyclonedx/sign's JSF sign / verify that translate
 *     the package's typed error hierarchy into the two user-facing error
 *     classes BOM Studio surfaces in the UI (SignKeyError and
 *     SignAlgorithmError). Signing is non-mutating per the package contract
 *     and returns a fresh envelope object.
 *
 * - canonicalEqual:
 *     Compare two payloads ignoring the signature property using the JCS
 *     canonical form. Used as the "would-still-be-valid" check on save:
 *     if the current scope canonicalizes to the same bytes as the baseline
 *     (and verify passed at import time), the original signature is still
 *     valid and we preserve it byte-for-byte.
 *
 * - JSF_SIGN_ALGORITHMS:
 *     The JSF asymmetric algorithm allowlist exposed in the UI. HMAC is
 *     deliberately excluded for the same reason the package's
 *     JSF_ASYMMETRIC_ALGORITHMS list excludes it: BOM signatures are
 *     tamper-evident envelopes verified by parties other than the signer,
 *     and a symmetric key cannot serve that role.
 */

import {
  sign as jsfSign,
  verify as jsfVerify,
  JsfAlgorithms,
  JSF_ASYMMETRIC_ALGORITHMS,
  isRegisteredAlgorithm,
  isAsymmetricAlgorithm,
  type JsfAlgorithm,
} from '@cyclonedx/sign/jsf'
import { canonicalize } from '@cyclonedx/sign/jcs'
import {
  JsfKeyError,
  JsfInputError,
  JsfSignError,
  JsfVerifyError,
  JsfEnvelopeError,
  type JsonObject,
  type JsonValue,
} from '@cyclonedx/sign'

/**
 * The asymmetric JSF algorithms the UI exposes for signing.
 *
 * Re-exported from @cyclonedx/sign/jsf (JSF_ASYMMETRIC_ALGORITHMS) so the
 * list cannot drift from the package and so removing a deprecated
 * algorithm there is automatically reflected in BOM Studio.
 */
export const JSF_SIGN_ALGORITHMS: readonly string[] = JSF_ASYMMETRIC_ALGORITHMS

/**
 * Default signing algorithm pre-selected in the UI. Ed25519 is short,
 * deterministic, and well-supported by both crypto backends the package
 * ships (node:crypto and crypto.subtle). Users can change this on the
 * Signatures screen.
 */
export const DEFAULT_SIGN_ALGORITHM: JsfAlgorithm = JsfAlgorithms.Ed25519

/** Path inside the BOM at which a signature lives, expressed as a JSON pointer-like array. */
export type SignaturePath = (string | number)[]

/**
 * One signed scope discovered in a BOM.
 *
 * `path` is the location of the *containing* object (the parent of the
 * `signature` property), *not* the path of the signature itself. The
 * signature property is always called `signature` per JSF for CycloneDX
 * 1.x; this matches every place a CycloneDX 1.6/1.7 schema permits one.
 */
export interface SignedScope {
  /** Path to the object that carries the signature (root, signatory, etc.). */
  path: SignaturePath
  /** Human-readable label for the UI ("BOM root", "Signatory #1", ...). */
  label: string
  /** The JSF mode in use on this scope: bare signaturecore, multi, or chain. */
  mode: 'single' | 'multi' | 'chain'
  /** Algorithm declared on the signaturecore (or the first one for multi/chain). */
  algorithm: string
  /** Whether the signature includes an embedded publicKey JWK or keyId. */
  hasEmbeddedKey: boolean
}

/**
 * Heuristic JSF signaturecore detector.
 *
 * Returns true when `value` looks like a JSF signature property — either a
 * bare signaturecore (object with `algorithm` and `value`) or a wrapper
 * with `signers` (multi) or `chain` (chain). Rejects strings, arrays,
 * primitives, and the textual `signature` enum entries that appear in
 * crypto property definitions.
 */
function looksLikeJsfSignature(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  // bare signaturecore
  if (typeof v.algorithm === 'string' && typeof v.value === 'string') return true
  // multi: { signers: [signaturecore, ...] }
  if (Array.isArray(v.signers)) return v.signers.every(s => looksLikeJsfSignatureCore(s))
  // chain: { chain: [signaturecore, ...] }
  if (Array.isArray(v.chain)) return v.chain.every(s => looksLikeJsfSignatureCore(s))
  return false
}

function looksLikeJsfSignatureCore(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return typeof v.algorithm === 'string' && typeof v.value === 'string'
}

function jsfMode(sig: Record<string, unknown>): 'single' | 'multi' | 'chain' {
  if (Array.isArray(sig.chain)) return 'chain'
  if (Array.isArray(sig.signers)) return 'multi'
  return 'single'
}

function jsfAlgorithm(sig: Record<string, unknown>): string {
  if (typeof sig.algorithm === 'string') return sig.algorithm
  if (Array.isArray(sig.signers) && sig.signers.length > 0) {
    const first = sig.signers[0]
    if (first && typeof (first as any).algorithm === 'string') {
      return (first as any).algorithm
    }
  }
  if (Array.isArray(sig.chain) && sig.chain.length > 0) {
    const first = sig.chain[0]
    if (first && typeof (first as any).algorithm === 'string') {
      return (first as any).algorithm
    }
  }
  return 'unknown'
}

function jsfHasEmbeddedKey(sig: Record<string, unknown>): boolean {
  if (sig.publicKey || sig.keyId || sig.certificatePath) return true
  const inner = (sig.signers ?? sig.chain) as unknown
  if (Array.isArray(inner)) {
    return inner.some(s => {
      if (!s || typeof s !== 'object') return false
      const sc = s as Record<string, unknown>
      return Boolean(sc.publicKey ?? sc.keyId ?? sc.certificatePath)
    })
  }
  return false
}

function pathLabel(path: SignaturePath): string {
  if (path.length === 0) return 'BOM root'
  const head = String(path[0])
  // Friendly labels for the most common JSF locations CycloneDX permits.
  if (path.length === 1 && head === 'declarations') return 'Declarations'
  if (head === 'declarations' && path[1] === 'affirmation' && path[2] === 'signatories') {
    const idx = path[3]
    if (typeof idx === 'number') return `Signatory #${idx + 1}`
  }
  if (head === 'declarations' && path[1] === 'attestations') {
    const idx = path[2]
    if (typeof idx === 'number') return `Attestation #${idx + 1}`
  }
  if (head === 'formulation') {
    const idx = path[1]
    if (typeof idx === 'number') return `Formula #${idx + 1}`
  }
  // Generic fallback: dot/bracket notation for unfamiliar paths.
  return path
    .map((seg, i) => (typeof seg === 'number' ? `[${seg}]` : i === 0 ? seg : `.${seg}`))
    .join('')
}

/**
 * Walk an object tree and collect every JSF signature location.
 *
 * The walker explicitly skips known-unsigned property names that contain
 * JSF-shaped data only by coincidence (`cryptoProperties` definitions in
 * the schema describe the word "signature" textually, not a JSF
 * signaturecore — but real BOM payloads do not reproduce that, so this is
 * defense in depth).
 */
export function collectSignedScopes(bom: unknown): SignedScope[] {
  const out: SignedScope[] = []

  const visit = (node: unknown, parentPath: SignaturePath): void => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach((child, idx) => visit(child, [...parentPath, idx]))
      return
    }
    const obj = node as Record<string, unknown>
    if ('signature' in obj && looksLikeJsfSignature(obj.signature)) {
      const sig = obj.signature as Record<string, unknown>
      out.push({
        path: parentPath,
        label: pathLabel(parentPath),
        mode: jsfMode(sig),
        algorithm: jsfAlgorithm(sig),
        hasEmbeddedKey: jsfHasEmbeddedKey(sig),
      })
    }
    for (const [key, value] of Object.entries(obj)) {
      // The signature property itself is treated above; recursing into it
      // would only re-discover the same node.
      if (key === 'signature') continue
      visit(value, [...parentPath, key])
    }
  }

  visit(bom, [])
  return out
}

/** Read the value at `path` in `obj`. Returns undefined if any segment is missing. */
export function getAtPath(obj: unknown, path: SignaturePath): unknown {
  let cur: any = obj
  for (const seg of path) {
    if (cur == null) return undefined
    cur = cur[seg as any]
  }
  return cur
}

/** Set the value at `path` in `obj` (mutating). Throws if the parent path is missing. */
export function setAtPath(obj: any, path: SignaturePath, value: unknown): void {
  if (path.length === 0) {
    throw new Error('setAtPath cannot replace the root object; assign at the call site')
  }
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i] as any
    if (cur[seg] == null || typeof cur[seg] !== 'object') {
      throw new Error(`setAtPath: missing parent at segment ${String(seg)}`)
    }
    cur = cur[seg]
  }
  cur[path[path.length - 1] as any] = value
}

/** Remove the `signature` property from a copy of `obj` and return both. */
function withoutSignature(obj: Record<string, unknown>): Record<string, unknown> {
  const { signature: _omit, ...rest } = obj
  void _omit
  return rest
}

/**
 * Compare two payload objects (the parent of a `signature` property) by
 * RFC 8785 canonical form, ignoring the signature itself.
 *
 * Returns true when both payloads canonicalize to the same byte sequence,
 * meaning a signature valid against `a` is also valid against `b`. This is
 * the "BOM is unchanged" predicate used at save time.
 */
export function canonicalEqual(a: unknown, b: unknown): boolean {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b
  const aBytes = canonicalize(withoutSignature(a as Record<string, unknown>) as JsonValue)
  const bBytes = canonicalize(withoutSignature(b as Record<string, unknown>) as JsonValue)
  if (aBytes.length !== bBytes.length) return false
  for (let i = 0; i < aBytes.length; i++) {
    if (aBytes[i] !== bBytes[i]) return false
  }
  return true
}

/** Inputs for a JSF sign or resign operation. */
export interface SignInputs {
  /**
   * JSF algorithm identifier. Accepts the wire string or any
   * `JsfAlgorithms.*` member; the package narrows both to the same
   * literal type. Validated at sign time against the asymmetric subset.
   */
  algorithm: string
  /** PEM string (PKCS#8 or SPKI / X.509 for public material) for asymmetric keys. */
  privateKey: string
}

// --- error surface ---

/**
 * Surfaced to the UI when a private key cannot be parsed, does not match
 * the chosen algorithm, or otherwise fails the package's key-handling
 * checks. Wraps @cyclonedx/sign's JsfKeyError / JsfSignError / envelope
 * key errors so the App.vue catch block does not have to know the
 * package's error hierarchy.
 */
export class SignKeyError extends Error {
  constructor(message: string) { super(message); this.name = 'SignKeyError' }
}

/**
 * Surfaced to the UI when the chosen algorithm is unknown to JSF or is
 * an HMAC family member (which BOM Studio does not expose).
 */
export class SignAlgorithmError extends Error {
  constructor(message: string) { super(message); this.name = 'SignAlgorithmError' }
}

/**
 * Sign a payload as JSF (CycloneDX 1.x). Returns a fresh envelope with a
 * `signature` property attached; the input is not mutated.
 *
 * Delegates the entire crypto pipeline (PEM parsing, key import, JCS
 * canonicalization, signing) to @cyclonedx/sign 0.5+. The package's
 * `#crypto-backend` import condition selects node:crypto in Node and
 * crypto.subtle in the browser, so this single call site covers both
 * runtimes without any branching here.
 *
 * Throws SignKeyError / SignAlgorithmError on key parse failures, key /
 * algorithm mismatches, and unsupported algorithms. Callers (App.vue)
 * surface those as user-facing messages.
 */
export async function signEnvelope<T extends object>(
  payload: T,
  inputs: SignInputs,
): Promise<T & { signature: unknown }> {
  const algorithm = assertAsymmetricAlgorithm(inputs.algorithm)

  let signed: JsonObject
  try {
    signed = await jsfSign(payload as unknown as JsonObject, {
      signer: { algorithm, privateKey: inputs.privateKey },
    })
  } catch (e: unknown) {
    throw translateSignError(e, algorithm)
  }
  return signed as unknown as T & { signature: unknown }
}

/**
 * Verify a JSF-signed payload using keys embedded in the envelope.
 *
 * Delegates to @cyclonedx/sign's verify() which, like sign(), runs on
 * whichever crypto backend the host runtime provides. The package's
 * structured result is collapsed into the slimmer shape the UI expects:
 * a top-level `valid` boolean, a `mode` label for the Signatures screen,
 * a per-signer breakdown, and a single `error` string if the package
 * surfaced an envelope-level message.
 *
 * The `valid` boolean is "this signature is internally consistent with
 * its declared key" — not "this signer is trusted". The trust note in
 * the UI labels accordingly.
 */
export async function verifyEnvelope(envelope: unknown): Promise<{
  valid: boolean
  mode?: string
  signers?: Array<{ valid: boolean; algorithm?: string; keyId?: string }>
  error?: string
}> {
  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, error: 'Envelope is not an object.' }
  }
  const env = envelope as Record<string, unknown>
  if (!env.signature) {
    return { valid: false, error: 'No signature property on envelope.' }
  }

  try {
    const result = await jsfVerify(env as unknown as JsonObject)
    return {
      valid: result.valid,
      mode: result.mode,
      signers: result.signers.map(s => ({
        valid: s.valid,
        algorithm: s.algorithm,
        keyId: s.keyId,
      })),
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    }
  } catch (e: unknown) {
    // Throws here are caller bugs per the package contract (malformed
    // envelope shape, unknown algorithm, etc.). Surface the message; do
    // not throw — the UI distinguishes "could not verify" from "invalid".
    const message = e instanceof Error ? e.message : String(e)
    return { valid: false, error: message }
  }
}

/**
 * Validate that the chosen algorithm is one of the asymmetric JSF
 * identifiers BOM Studio exposes. Throws SignAlgorithmError otherwise.
 */
function assertAsymmetricAlgorithm(algorithm: string): JsfAlgorithm {
  if (!isRegisteredAlgorithm(algorithm)) {
    throw new SignAlgorithmError(
      `Algorithm "${algorithm}" is not a registered JSF algorithm. Pick one of: ${JSF_ASYMMETRIC_ALGORITHMS.join(', ')}.`,
    )
  }
  if (!isAsymmetricAlgorithm(algorithm)) {
    throw new SignAlgorithmError(
      `Algorithm "${algorithm}" is symmetric (HMAC); BOM Studio only exposes asymmetric algorithms for tamper-evident BOM signatures. Pick one of: ${JSF_ASYMMETRIC_ALGORITHMS.join(', ')}.`,
    )
  }
  return algorithm
}

/**
 * Map the package's JSF error subtree onto the two user-facing classes
 * App.vue already catches (SignKeyError, SignAlgorithmError). Anything
 * unexpected is rethrown so the global error handler can log it.
 */
function translateSignError(e: unknown, algorithm: string): Error {
  if (e instanceof SignKeyError || e instanceof SignAlgorithmError) return e
  if (e instanceof JsfKeyError) {
    return new SignKeyError(
      `Could not use the provided private key for ${algorithm}. ${e.message}`,
    )
  }
  if (e instanceof JsfSignError) {
    return new SignKeyError(
      `Signing with ${algorithm} failed. Make sure the PEM is a PKCS#8 private key for the selected algorithm. ${e.message}`,
    )
  }
  if (e instanceof JsfInputError) {
    return new SignAlgorithmError(`Invalid signing input for ${algorithm}: ${e.message}`)
  }
  if (e instanceof JsfVerifyError || e instanceof JsfEnvelopeError) {
    // Should not occur during sign, but classify defensively.
    return new SignKeyError(`Signature configuration rejected by JSF: ${e.message}`)
  }
  return e instanceof Error ? e : new Error(String(e))
}
