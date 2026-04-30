import { describe, it, expect } from 'vitest'
import {
  collectSignedScopes,
  getAtPath,
  setAtPath,
  canonicalEqual,
} from '@/utils/jsfSignature'

/**
 * Tests for the JSF signature utility module.
 *
 * Scope: pure helpers that do not invoke @cyclonedx/sign's sign() or
 * verify(). Sign / verify exercises live in the integration spec for
 * signatureStore (which mocks the package via vi.mock) and in
 * end-to-end tests run by the user against the example signed SBOM
 * from issue #123.
 */

describe('collectSignedScopes', () => {
  it('returns an empty array for an unsigned BOM', () => {
    const bom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      components: [{ type: 'library', name: 'foo' }],
    }
    expect(collectSignedScopes(bom)).toEqual([])
  })

  it('detects a root-level JSF signaturecore', () => {
    const bom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      signature: { algorithm: 'RS512', value: 'abc' },
    }
    const scopes = collectSignedScopes(bom)
    expect(scopes).toHaveLength(1)
    expect(scopes[0]?.path).toEqual([])
    expect(scopes[0]?.label).toBe('BOM root')
    expect(scopes[0]?.mode).toBe('single')
    expect(scopes[0]?.algorithm).toBe('RS512')
  })

  it('detects multi-mode (signers array) at root', () => {
    const bom = {
      signature: {
        signers: [
          { algorithm: 'ES256', value: 'a' },
          { algorithm: 'RS256', value: 'b' },
        ],
      },
    }
    const scopes = collectSignedScopes(bom)
    expect(scopes).toHaveLength(1)
    expect(scopes[0]?.mode).toBe('multi')
    expect(scopes[0]?.algorithm).toBe('ES256')
  })

  it('detects chain mode at root', () => {
    const bom = {
      signature: {
        chain: [
          { algorithm: 'ES256', value: 'a' },
          { algorithm: 'RS256', value: 'b' },
        ],
      },
    }
    const scopes = collectSignedScopes(bom)
    expect(scopes).toHaveLength(1)
    expect(scopes[0]?.mode).toBe('chain')
  })

  it('detects nested signatures inside declarations.affirmation.signatories', () => {
    const bom = {
      declarations: {
        affirmation: {
          signatories: [
            {
              name: 'Alice',
              signature: { algorithm: 'Ed25519', value: 'aaa' },
            },
            {
              name: 'Bob',
              signature: { algorithm: 'Ed25519', value: 'bbb' },
            },
          ],
        },
      },
    }
    const scopes = collectSignedScopes(bom)
    expect(scopes).toHaveLength(2)
    expect(scopes[0]?.label).toBe('Signatory #1')
    expect(scopes[1]?.label).toBe('Signatory #2')
    expect(scopes[0]?.path).toEqual([
      'declarations', 'affirmation', 'signatories', 0,
    ])
  })

  it('does NOT match string-valued "signature" properties (crypto enum text)', () => {
    // The CycloneDX schema describes the crypto-asset relatedCryptoMaterial
    // type "signature" as a textual definition. Real BOMs put the string
    // "signature" as an enum value, not as a JSF signaturecore object.
    const bom = {
      components: [{
        type: 'cryptographic-asset',
        cryptoProperties: {
          relatedCryptoMaterial: { type: 'signature' },
        },
      }],
    }
    expect(collectSignedScopes(bom)).toEqual([])
  })

  it('reports the embedded key flag', () => {
    const withKey = { signature: { algorithm: 'RS512', value: 'a', publicKey: { kty: 'RSA' } } }
    const withoutKey = { signature: { algorithm: 'RS512', value: 'a' } }
    expect(collectSignedScopes(withKey)[0]?.hasEmbeddedKey).toBe(true)
    expect(collectSignedScopes(withoutKey)[0]?.hasEmbeddedKey).toBe(false)
  })
})

describe('getAtPath / setAtPath', () => {
  it('round-trips through nested paths', () => {
    const obj: any = { a: { b: [{ c: 1 }, { c: 2 }] } }
    expect(getAtPath(obj, ['a', 'b', 1, 'c'])).toBe(2)
    setAtPath(obj, ['a', 'b', 0, 'c'], 99)
    expect(obj.a.b[0].c).toBe(99)
  })

  it('returns undefined for missing segments', () => {
    expect(getAtPath({ a: 1 }, ['b', 'c'])).toBeUndefined()
  })

  it('throws on root replacement attempt', () => {
    expect(() => setAtPath({}, [], 'x')).toThrow(/cannot replace the root/)
  })
})

describe('canonicalEqual', () => {
  it('returns true for property-order-equivalent payloads (signature ignored)', () => {
    const a = { b: 2, a: 1, signature: { algorithm: 'X', value: 'old' } }
    const b = { a: 1, b: 2, signature: { algorithm: 'Y', value: 'new' } }
    expect(canonicalEqual(a, b)).toBe(true)
  })

  it('returns false when a non-signature field differs', () => {
    const a = { name: 'foo', signature: { algorithm: 'X', value: '1' } }
    const b = { name: 'bar', signature: { algorithm: 'X', value: '1' } }
    expect(canonicalEqual(a, b)).toBe(false)
  })

  it('returns false when an array element is reordered', () => {
    // JCS canonicalizes object keys by sorting but preserves array order,
    // so a different array order changes the canonical bytes.
    const a = { components: [{ name: 'a' }, { name: 'b' }] }
    const b = { components: [{ name: 'b' }, { name: 'a' }] }
    expect(canonicalEqual(a, b)).toBe(false)
  })
})
