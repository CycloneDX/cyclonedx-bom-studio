import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBomStore } from '@/stores/bomStore'

/**
 * Regression test for issue #146:
 *
 *   "Metadata Distribution Constraints Removed by Saving JSON" — reported
 *    against BOM Studio 0.9.1. The user added a metadata.distributionConstraints
 *    field via the JSON Source editor (BOM validated), clicked Save, and
 *    the field was silently removed from the saved JSON.
 *
 * Root cause was an enumerated whitelist in bomStore.loadBom that only
 * copied a fixed set of metadata properties, dropping every CycloneDX
 * 1.6 / 1.7 field BOM Studio did not have a dedicated editor for. The
 * fix swaps the construction to spread-then-override so unknown spec
 * fields pass through and the named overrides only normalize the
 * subset the editor needs to dereference safely.
 *
 * These tests pin the pass-through contract for both the metadata
 * block (the specific regression) and the BOM root (same anti-pattern,
 * same fix, latent for any future spec field).
 */

describe('bomStore pass-through (issue #146)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('preserves metadata.distributionConstraints on import', () => {
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      version: 1,
      metadata: {
        timestamp: '2026-04-22T22:00:00Z',
        distributionConstraints: { tlp: 'AMBER_AND_STRICT' },
      },
      components: [],
    })
    expect((bomStore.bom.metadata as any).distributionConstraints).toEqual({ tlp: 'AMBER_AND_STRICT' })
  })

  it('threads metadata.distributionConstraints through bomForExport', () => {
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      version: 1,
      metadata: {
        timestamp: '2026-04-22T22:00:00Z',
        distributionConstraints: { tlp: 'AMBER_AND_STRICT' },
      },
      components: [{ type: 'library', name: 'foo', version: '1.0.0' }],
    })
    expect((bomStore.bomForExport.metadata as any).distributionConstraints).toEqual({ tlp: 'AMBER_AND_STRICT' })
  })

  it('preserves arbitrary unknown metadata properties', () => {
    // Generic guard so the pass-through contract is enforced for any
    // CycloneDX 1.7 (or future 1.8+) field BOM Studio does not yet
    // surface in a dedicated editor.
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      version: 1,
      metadata: {
        timestamp: '2026-04-22T22:00:00Z',
        manufacture: { name: 'Acme' }, // 1.6 deprecated alias
        somethingNew17: { foo: 'bar' },
      },
      components: [],
    })
    const meta = bomStore.bom.metadata as any
    expect(meta.manufacture).toEqual({ name: 'Acme' })
    expect(meta.somethingNew17).toEqual({ foo: 'bar' })
  })

  it('still normalizes editor-required metadata fields when missing', () => {
    // The pass-through default must not skip the defaults the editor
    // surfaces depend on (an empty array for licenses, an empty
    // tools.components list, etc.). Otherwise the Vue templates blow
    // up on the first read of `bom.metadata.licenses[0]`.
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      version: 1,
      metadata: {},
      components: [],
    })
    const meta = bomStore.bom.metadata as any
    expect(meta.timestamp).toBe('')
    expect(meta.authors).toEqual([])
    expect(meta.lifecycles).toEqual([])
    expect(meta.tools).toEqual({ components: [], services: [] })
    expect(meta.licenses).toEqual([])
    expect(meta.properties).toEqual([])
  })

  it('preserves arbitrary unknown root properties', () => {
    // Same anti-pattern at the root level: the closed enumeration
    // would silently drop $schema and any vendor or future-spec root
    // key. The pass-through default fixes that.
    const bomStore = useBomStore()
    bomStore.loadBom({
      $schema: 'http://cyclonedx.org/schema/bom-1.7.schema.json',
      bomFormat: 'CycloneDX',
      specVersion: '1.7',
      version: 1,
      components: [],
      vendorRootKey: { tag: 'preserve me' },
    })
    const bom = bomStore.bom as any
    expect(bom.$schema).toBe('http://cyclonedx.org/schema/bom-1.7.schema.json')
    expect(bom.vendorRootKey).toEqual({ tag: 'preserve me' })
  })

  it('still enforces bomFormat = "CycloneDX"', () => {
    // Regression guard: the spread comes first, but the bomFormat
    // override after the spread must still win. A malformed wire
    // value should be replaced.
    const bomStore = useBomStore()
    bomStore.loadBom({
      bomFormat: 'NotCycloneDX',
      specVersion: '1.7',
      version: 1,
      components: [],
    } as any)
    expect(bomStore.bom.bomFormat).toBe('CycloneDX')
  })
})
