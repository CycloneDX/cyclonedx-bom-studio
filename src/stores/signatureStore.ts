/**
 * Signature store.
 *
 * Owns the JSF signature lifecycle for the active BOM:
 *
 *   1. On import, captures every signed scope and a deep-frozen baseline
 *      copy of each scope's payload so we can later detect "unchanged".
 *      Also stashes the original signature property by reference so a
 *      preserved scope can be reassembled byte-faithfully on save.
 *
 *   2. While the user edits, the store does not need to be told what
 *      changed. At save time it walks the current BOM, recomputes the
 *      JCS canonical form of each scope (signature stripped), and
 *      compares against the baseline. Equal canonical bytes → preserve.
 *      Different bytes → resign with the configured key, or block save
 *      and surface a clear prompt if no key is configured.
 *
 *   3. Provides UI state: configured signing key (PEM), chosen
 *      algorithm, sign-root-at-save toggle, last-import verify result,
 *      and per-scope status for the Signatures view.
 *
 * The store is intentionally Pinia-only; the heavy crypto and JCS work
 * lives in src/utils/jsfSignature.ts so that anything else that wants to
 * sign or verify (tests, future CLI, Node-side previews) can do so
 * without going through Pinia.
 *
 * Trust note: verify() at import time uses the publicKey embedded in the
 * envelope. That establishes "this signature is internally consistent
 * with its declared key", not "this signer is trusted". The UI labels
 * verification results accordingly. Trust validation (X.509 chains,
 * pinned JWK fingerprints, etc.) is out of scope for the BOM editor and
 * is documented as such in SPEC.md.
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { canonicalize } from '@cyclonedx/sign/jcs'
import type { JsonValue } from '@cyclonedx/sign'
import {
  collectSignedScopes,
  getAtPath,
  setAtPath,
  signEnvelope,
  verifyEnvelope,
  DEFAULT_SIGN_ALGORITHM,
  type SignedScope,
} from '@/utils/jsfSignature'

export type ScopeStatus =
  | 'preserved-valid' // baseline matches and verify was true at import
  | 'preserved-unverified' // baseline matches but verify was unknown / failed at import
  | 'dirty-unsigned' // baseline differs and no key is configured to resign
  | 'dirty-resigned' // baseline differs but a key is configured (will resign on save)
  | 'unknown'

export interface ScopeRecord {
  /** Stable id for table keys. */
  id: string
  scope: SignedScope
  /**
   * Canonical bytes of the payload as it was at import time, with the
   * signature property stripped. Used to detect "still unchanged".
   */
  baselineCanonical: Uint8Array
  /**
   * The original signature property as imported. Held by reference so
   * preserved scopes round-trip byte-for-byte without re-encoding.
   */
  originalSignature: unknown
  /** Verify result captured at import time. */
  importVerify: { valid: boolean; error?: string }
}

/**
 * One scope that was resigned (or freshly signed) by `applyForSave`.
 *
 * Returned alongside the export draft so the caller can write the new
 * signature back into the in-memory BOM (via bomStore) and commit it
 * to the signature store's records (via `commitResigned`). Without
 * those two follow-ups, the status bar and the JSON Source view stay
 * stale on the import-time baseline until the user reloads the file.
 */
export interface ResignedScope {
  /** Path to the parent of the signature property. Empty array = root. */
  path: (string | number)[]
  /** The freshly-signed envelope (payload + new `signature` property). */
  signedEnvelope: Record<string, unknown>
  /** True when no record existed before (sign-root-at-save path). */
  isNew: boolean
}

export const useSignatureStore = defineStore('signature', () => {
  // --- configured signing key ---
  const privateKeyPem = ref<string>('')
  const algorithm = ref<string>(String(DEFAULT_SIGN_ALGORITHM))
  /** When the loaded BOM has no signatures, attach a root signature on save. */
  const signRootAtSave = ref<boolean>(false)

  /** Records keyed by stable id. Built fresh on every loadBom. */
  const records = ref<ScopeRecord[]>([])

  /** Was any signature observed in the most recently loaded BOM? */
  const importedHadSignatures = computed(() => records.value.length > 0)

  /** Whether a private key has been configured. */
  const hasSigningKey = computed(() => privateKeyPem.value.trim().length > 0)

  // --- public API ---

  /**
   * Capture baselines for every signed scope in `bom`. Must be called
   * with the BOM exactly as it arrived from disk, before any user edit
   * and before any sanitization that might alter canonical form.
   */
  async function captureBaseline(bom: unknown): Promise<void> {
    const scopes = collectSignedScopes(bom)
    const next: ScopeRecord[] = []
    for (let i = 0; i < scopes.length; i++) {
      const scope = scopes[i]!
      const payload = getAtPath(bom, scope.path)
      if (!payload || typeof payload !== 'object') continue
      // The package's verify() returns a structured result. We treat
      // anything other than valid:true as "unverified" — the envelope
      // is still preserved, just labeled as such in the UI.
      const result = await verifyEnvelope(payload)
      const { signature: originalSignature, ...withoutSig } = payload as any
      const baselineCanonical = canonicalBytesOf(withoutSig)
      next.push({
        id: `${i}:${scope.path.join('/')}`,
        scope,
        baselineCanonical,
        originalSignature,
        importVerify: { valid: result.valid, error: result.error },
      })
    }
    records.value = next
  }

  /**
   * Drop all baseline state. Called by bomStore.createNewBom and any
   * other path that replaces the BOM with one we did not import.
   */
  function clear(): void {
    records.value = []
  }

  /** True if any scope's current canonical form differs from baseline. */
  function isAnyDirty(currentBom: unknown): boolean {
    return records.value.some(rec => !scopeStillMatches(currentBom, rec))
  }

  /**
   * Apply the preserve-or-resign rules to `bomForExport` and return a
   * BOM ready to write. Does not mutate `bomForExport`.
   *
   * Behavior:
   *
   * - For every recorded scope: if the canonical form still matches
   *   baseline, restore the original signature property by reference.
   *   Otherwise resign using the configured key.
   *
   * - If `signRootAtSave` is true and the imported BOM had no
   *   signatures, sign the whole BOM at save.
   *
   * Returns the draft alongside a list of every scope that was resigned
   * (or freshly signed). Callers that want the in-memory BOM and the
   * status bar to reflect the just-written file should pass the
   * `resigned` list to `commitResigned` and to bomStore's signature
   * write-back helper after the download succeeds.
   *
   * Throws SignatureSaveBlocked when a resign is required and no key
   * is configured. Callers must surface the error to the user.
   */
  async function applyForSave(bomForExport: unknown): Promise<{
    draft: any
    resigned: ResignedScope[]
  }> {
    // JSON round-trip rather than structuredClone: bomForExport is a
    // Vue reactive proxy and structuredClone refuses to clone proxies
    // backed by reactive arrays ("DataCloneError: ... [object Array]
    // could not be cloned"). The output of this function is destined
    // for JSON.stringify anyway, so the round-trip is lossless for
    // our purposes and side-steps the proxy issue cleanly.
    const draft = JSON.parse(JSON.stringify(bomForExport))
    const resigned: ResignedScope[] = []

    for (const rec of records.value) {
      const current = getAtPath(draft, rec.scope.path)
      if (!current || typeof current !== 'object') continue

      if (scopeStillMatches(draft, rec)) {
        // Unchanged AND was valid at import (or unverified and the user
        // chose to keep it). Round-trip the original signature exactly.
        ;(current as any).signature = rec.originalSignature
        continue
      }

      // Changed. Resign with the configured key, or block.
      if (!hasSigningKey.value) {
        throw new SignatureSaveBlocked(
          rec.scope.label,
          rec.importVerify.valid
            ? 'modified-resign-required'
            : 'invalid-resign-required',
        )
      }
      const { signature: _omit, ...payload } = current as Record<string, unknown>
      void _omit
      const signed = await signEnvelope(payload, {
        algorithm: algorithm.value,
        privateKey: privateKeyPem.value,
      })
      if (rec.scope.path.length === 0) {
        // Root scope: setAtPath refuses to replace the root, so attach
        // the new signature directly to the draft. The non-signature
        // fields were not edited (we know this because we built `signed`
        // from `payload`, which is `current` minus its signature).
        ;(draft as any).signature = (signed as any).signature
      } else {
        setAtPath(draft, rec.scope.path, signed)
      }
      resigned.push({
        path: rec.scope.path,
        signedEnvelope: signed as Record<string, unknown>,
        isNew: false,
      })
    }

    // Optional root signature for previously-unsigned BOMs.
    if (
      signRootAtSave.value
      && records.value.length === 0
      && !((draft as any) && (draft as any).signature)
    ) {
      if (!hasSigningKey.value) {
        throw new SignatureSaveBlocked('BOM root', 'root-sign-no-key')
      }
      const signed = await signEnvelope(draft, {
        algorithm: algorithm.value,
        privateKey: privateKeyPem.value,
      })
      // Assign instead of replacing the whole draft so the export
      // retains its identity for the caller's downstream usage.
      ;(draft as any).signature = (signed as any).signature
      resigned.push({
        path: [],
        signedEnvelope: signed as Record<string, unknown>,
        isNew: true,
      })
    }

    return { draft, resigned }
  }

  /**
   * Refresh the in-memory records to match the just-written file.
   *
   * Called by the save flow after `applyForSave` returned and the
   * download succeeded. For each resigned scope:
   *
   * - Existing record: replace `originalSignature` with the new
   *   signature, recompute `baselineCanonical` from the new payload,
   *   and re-run verifyEnvelope so `importVerify.valid` reflects the
   *   freshly-produced envelope (effectively `true` for any signer
   *   that returned successfully).
   *
   * - Sign-root-at-save (no prior record): append a new record at the
   *   root path so the status bar transitions from "no signatures" to
   *   "Signed (1)" without requiring a reload from disk.
   *
   * Without this refresh, the status bar would keep reading the
   * import-time baseline and continue to claim "0/1 ok" after a
   * successful save.
   */
  async function commitResigned(resigned: ResignedScope[]): Promise<void> {
    if (resigned.length === 0) return
    const next = [...records.value]
    for (const { path, signedEnvelope, isNew } of resigned) {
      const { signature: newSignature, ...withoutSig } = signedEnvelope
      const baselineCanonical = canonicalBytesOf(withoutSig)
      const verify = await verifyEnvelope(signedEnvelope)
      const importVerify = { valid: verify.valid, error: verify.error }

      if (isNew) {
        const sig = newSignature as Record<string, unknown>
        const algorithmName = typeof sig?.algorithm === 'string' ? sig.algorithm : algorithm.value
        next.push({
          id: `${next.length}:${path.join('/')}`,
          scope: {
            path,
            label: path.length === 0 ? 'BOM root' : path.join('/'),
            mode: 'single',
            algorithm: algorithmName,
            hasEmbeddedKey: Boolean(sig?.publicKey ?? sig?.keyId ?? sig?.certificatePath),
          },
          baselineCanonical,
          originalSignature: newSignature,
          importVerify,
        })
        continue
      }

      const idx = next.findIndex(r => samePath(r.scope.path, path))
      if (idx === -1) continue
      const prev = next[idx]!
      const sig = newSignature as Record<string, unknown> | undefined
      next[idx] = {
        ...prev,
        baselineCanonical,
        originalSignature: newSignature,
        importVerify,
        scope: {
          ...prev.scope,
          algorithm: typeof sig?.algorithm === 'string' ? sig.algorithm : prev.scope.algorithm,
          hasEmbeddedKey: Boolean(sig?.publicKey ?? sig?.keyId ?? sig?.certificatePath),
        },
      }
    }
    records.value = next
  }

  function samePath(a: (string | number)[], b: (string | number)[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
    return true
  }

  /**
   * Convenience: status to display per scope based on the current BOM.
   */
  function statusFor(rec: ScopeRecord, currentBom: unknown): ScopeStatus {
    const matches = scopeStillMatches(currentBom, rec)
    if (matches) {
      return rec.importVerify.valid ? 'preserved-valid' : 'preserved-unverified'
    }
    return hasSigningKey.value ? 'dirty-resigned' : 'dirty-unsigned'
  }

  function scopeStillMatches(currentBom: unknown, rec: ScopeRecord): boolean {
    const cur = getAtPath(currentBom, rec.scope.path)
    if (!cur || typeof cur !== 'object') return false
    const { signature: _omit, ...withoutSig } = cur as any
    void _omit
    const curBytes = canonicalBytesOf(withoutSig)
    if (curBytes.length !== rec.baselineCanonical.length) return false
    for (let i = 0; i < curBytes.length; i++) {
      if (curBytes[i] !== rec.baselineCanonical[i]) return false
    }
    return true
  }

  return {
    privateKeyPem,
    algorithm,
    signRootAtSave,
    records,
    importedHadSignatures,
    hasSigningKey,
    captureBaseline,
    clear,
    isAnyDirty,
    applyForSave,
    commitResigned,
    statusFor,
  }
})

/**
 * Thrown by applyForSave when resign is required but no signing key is
 * configured. The UI catches this and prompts the user to either
 * configure a key or strip signatures and save unsigned.
 */
export type SignatureSaveBlockedReason =
  | 'modified-resign-required'
  | 'invalid-resign-required'
  | 'root-sign-no-key'

export class SignatureSaveBlocked extends Error {
  // Plain field declarations rather than constructor parameter properties:
  // tsconfig's `erasableSyntaxOnly` rejects the parameter-property form
  // because it requires runtime emit (assignment in the constructor body),
  // which is not type-erasable.
  readonly scopeLabel: string
  readonly reason: SignatureSaveBlockedReason

  constructor(scopeLabel: string, reason: SignatureSaveBlockedReason) {
    super(`Signature save blocked at ${scopeLabel}: ${reason}`)
    this.name = 'SignatureSaveBlocked'
    this.scopeLabel = scopeLabel
    this.reason = reason
  }
}

// --- internal helpers (kept module-private; tests import via the store) ---

function canonicalBytesOf(payload: unknown): Uint8Array {
  // The package's canonicalize() requires JsonValue. Callers in this
  // store always pass the BOM-stripped payload (an object after
  // signature removal), so the cast is safe at runtime; the JsonValue
  // shape is structurally compatible with the BOM JSON we hold here.
  return canonicalize(payload as JsonValue)
}
