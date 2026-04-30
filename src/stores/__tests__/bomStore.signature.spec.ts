import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBomStore } from '@/stores/bomStore'

/**
 * Regression test for issue #123:
 *
 *   "Signature property stripped from JSON source when importing signed
 *    SBOMs" — reported against BOM Studio 0.9.1 with the example signed
 *    SBOM from cyclonedx.org/use-cases/authenticity-verification/.
 *
 * The fix is in bomStore.loadBom: when the imported BOM carries any JSF
 * signature, the store skips lossy normalizations (deep-trim, bom-ref
 * synthesis, component count slice, metadata destructure) and threads the
 * root `signature` property through to `bom.value`. This test pins that
 * behavior so a future change cannot silently regress the bug.
 */

describe('bomStore signature preservation (issue #123)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('preserves a root-level signature on import', () => {
    const bomStore = useBomStore()
    const signed = {
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      serialNumber: 'urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79',
      version: 1,
      components: [{
        type: 'library',
        name: 'tomcat-catalina',
        version: '9.0.14',
      }],
      signature: {
        algorithm: 'RS512',
        publicKey: { kty: 'RSA', n: 'qOSWb…', e: 'AQAB' },
        value: 'HGIX_…',
      },
    }
    bomStore.loadBom(signed)
    expect(bomStore.bom.signature).toBeDefined()
    expect(bomStore.bom.signature.algorithm).toBe('RS512')
    expect(bomStore.bom.signature.value).toBe('HGIX_…')
    expect(bomStore.bom.signature.publicKey.kty).toBe('RSA')
  })

  it('threads the signature through bomForExport', () => {
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      components: [{ type: 'library', name: 'foo', version: '1.0.0' }],
      signature: { algorithm: 'Ed25519', value: 'sig' },
    })
    expect(bomStore.bomForExport.signature).toBeDefined()
    expect(bomStore.bomForExport.signature.algorithm).toBe('Ed25519')
  })

  it('does not synthesize bom-refs into components on signed imports', () => {
    // bom-ref synthesis would alter the canonical form and invalidate
    // the signature even on a no-op save.
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      components: [{ type: 'library', name: 'foo' }], // no bom-ref
      signature: { algorithm: 'Ed25519', value: 'sig' },
    })
    expect(bomStore.bom.components[0]['bom-ref']).toBeUndefined()
  })

  it('still synthesizes bom-refs on UNsigned imports', () => {
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      components: [{ type: 'library', name: 'foo' }], // no bom-ref
    })
    // unsigned BOMs still get the historical default for editor ergonomics
    expect(bomStore.bom.components[0]['bom-ref']).toBeTypeOf('string')
  })

  it('does not deep-trim string values on signed imports', () => {
    const bomStore = useBomStore()
    // A value with trailing whitespace would be canonicalized as-is by
    // JCS. If we trimmed, the canonical bytes would diverge from the
    // bytes the original signature was generated against.
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      serialNumber: 'urn:uuid:abc  ',
      components: [{ type: 'library', name: 'foo ' }],
      signature: { algorithm: 'Ed25519', value: 'sig' },
    })
    expect(bomStore.bom.serialNumber).toBe('urn:uuid:abc  ')
    expect(bomStore.bom.components[0].name).toBe('foo ')
  })

  it('keeps metadata accessible (as {}) when the signed source has none', () => {
    // Repro of the dashboard crash seen on the cyclonedx.org sample
    // (sig.cdx.json): no metadata block in the source, but the
    // dashboard reads bomStore.bom.metadata.timestamp. The store now
    // populates metadata as {} for editor ergonomics; the export path
    // strips it again so the canonical form matches the source.
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      components: [{ type: 'library', name: 'tomcat' }],
      signature: { algorithm: 'RS512', value: 'sig' },
    })
    expect(bomStore.bom.metadata).toEqual({})
    // Dashboard read does not throw.
    expect(bomStore.bom.metadata.timestamp).toBeUndefined()
  })

  it('strips editor-added empty root keys on signed export so canonical bytes match source', () => {
    // sig.cdx.json has only bomFormat / specVersion / serialNumber /
    // version / components / signature. No metadata, services,
    // dependencies, formulation, etc. The store synthesizes those for
    // editor convenience; the signed export path must drop the empty
    // ones so a no-op save round-trips byte-faithfully.
    const bomStore = useBomStore()
    const source = {
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      serialNumber: 'urn:uuid:abc',
      version: 1,
      components: [{ type: 'library', name: 'foo' }],
      signature: { algorithm: 'Ed25519', value: 'sig' },
    }
    bomStore.loadBom(source)
    const exported = bomStore.bomForExport
    expect(Object.keys(exported).sort()).toEqual([
      'bomFormat', 'components', 'serialNumber', 'signature',
      'specVersion', 'version',
    ])
    // Empty editor scaffolding should not appear in the export.
    expect(exported.metadata).toBeUndefined()
    expect(exported.services).toBeUndefined()
    expect(exported.dependencies).toBeUndefined()
    expect(exported.formulation).toBeUndefined()
    expect(exported.declarations).toBeUndefined()
    expect(exported.properties).toBeUndefined()
    expect(exported.annotations).toBeUndefined()
    expect(exported.compositions).toBeUndefined()
    expect(exported.externalReferences).toBeUndefined()
    expect(exported.vulnerabilities).toBeUndefined()
    expect(exported.citations).toBeUndefined()
  })

  it('preserves root keys that ARE in the source even when their value looks empty', () => {
    // If the signed source carried an explicit `services: []`, that
    // empty array IS part of the canonical form the signature was
    // generated against. The export must not drop it.
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      services: [],
      components: [{ type: 'library', name: 'foo' }],
      signature: { algorithm: 'Ed25519', value: 'sig' },
    })
    expect(bomStore.bomForExport.services).toEqual([])
  })
})
