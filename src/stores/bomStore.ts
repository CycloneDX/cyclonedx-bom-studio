import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { deepTrimStrings, MAX_COMPONENT_COUNT } from '@/utils/sanitize'
import { DEFAULT_SPEC_VERSION, isSupportedSpecVersion } from '@/utils/specVersions'
import { collectSignedScopes } from '@/utils/jsfSignature'

/**
 * True if a value carries no information: null/undefined/empty string,
 * an empty array, or an object whose every value is itself deeply
 * empty. Used by the signed-BOM export path to drop editor-added
 * scaffolding (e.g. `metadata: {}`, `formulation: { formulas: [] }`,
 * `tools: { components: [], services: [] }`) without re-running the
 * generic `clean()` recursion, which would mutate canonical bytes
 * inside fields that DID exist on disk.
 */
function isDeeplyEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.every(isDeeplyEmpty)
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).every(isDeeplyEmpty)
  }
  return false
}

export const useBomStore = defineStore('bom', () => {
  // State
  const bom = ref<any>({
    bomFormat: 'CycloneDX',
    specVersion: DEFAULT_SPEC_VERSION,
    serialNumber: `urn:uuid:${uuidv4()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      authors: [],
      supplier: null,
      manufacturer: null,
      component: null,
      lifecycles: [],
      tools: { components: [], services: [] },
      licenses: [],
      properties: []
    },
    components: [],
    services: [],
    dependencies: [],
    externalReferences: [],
    compositions: [],
    vulnerabilities: [],
    formulation: { formulas: [] },
    annotations: [],
    citations: [],
    declarations: {},
    properties: []
  })

  const modified = ref(false)
  const fileName = ref('')

  /**
   * For signed imports, the set of root keys that were present in the
   * original on-disk JSON. Used by `bomForExport` to keep canonical
   * bytes stable: the editor populates `metadata: {}`, `services: []`,
   * etc. for ergonomics, but those phantoms must not appear in the
   * saved JSON if they were absent from the file the signature was
   * generated against. Empty for unsigned BOMs.
   */
  const originalRootKeys = ref<Set<string> | null>(null)

  // Getters
  const componentCount = computed(() => bom.value.components.length)
  const serviceCount = computed(() => bom.value.services.length)
  const citationCount = computed(() => bom.value.citations.length)
  const isModified = computed(() => modified.value)
  const bomForExport = computed(() => {
    const result: any = { ...bom.value }
    // Signed BOMs: skip empty-stripping. Empty arrays / null / '' would
    // change the JCS canonical form and invalidate signatures that were
    // valid on disk. We additionally drop any root key that is empty
    // (object with 0 keys, empty array, '', null) AND was not present
    // in the original imported JSON. This restores byte-faithful round-
    // trip when the user did not edit the BOM, while still letting
    // editors look up `bom.metadata`, `bom.services`, etc. without
    // needing optional chaining everywhere.
    if (collectSignedScopes(result).length > 0) {
      if (originalRootKeys.value) {
        const orig = originalRootKeys.value
        for (const [k, v] of Object.entries(result)) {
          if (orig.has(k)) continue
          if (isDeeplyEmpty(v)) delete result[k]
        }
      }
      return result
    }
    const clean = (obj: any): any => {
      if (Array.isArray(obj)) return obj.length > 0 ? obj.map(clean) : undefined
      if (obj && typeof obj === 'object') {
        const cleaned: any = {}
        for (const [k, v] of Object.entries(obj)) {
          const val = clean(v)
          if (val !== undefined && val !== null && val !== '') cleaned[k] = val
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined
      }
      return obj
    }
    return clean(result) || {}
  })

  // Actions
  function createNewBom() {
    bom.value = {
      bomFormat: 'CycloneDX',
      specVersion: DEFAULT_SPEC_VERSION,
      serialNumber: `urn:uuid:${uuidv4()}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        authors: [],
        supplier: null,
        manufacturer: null,
        component: null,
        lifecycles: [],
        tools: {
          components: [{ type: 'application', name: 'CycloneDX BOM Studio', version: '1.0.0', manufacturer: { name: 'CycloneDX' } }],
          services: []
        },
        licenses: [],
        properties: []
      },
      components: [],
      services: [],
      dependencies: [],
      externalReferences: [],
      compositions: [],
      vulnerabilities: [],
      formulation: { formulas: [] },
      annotations: [],
      citations: [],
      declarations: {},
      properties: []
    }
    modified.value = false
    fileName.value = ''
    originalRootKeys.value = null
  }

  function loadBom(json: any): { converted: boolean; originalVersion: string } | undefined {
    if (!json || typeof json !== 'object') return

    // Detect JSF signatures BEFORE any sanitization. If the incoming BOM
    // is signed at any scope, deep-trim and other lossy normalizations
    // would alter the canonical form and invalidate signatures that were
    // valid on disk. We bypass deep-trim, bom-ref synthesis, and the
    // component-count slice for signed BOMs so unedited imports round-
    // trip byte-faithfully and the original signatures stay verifiable.
    // See issue #123.
    const signedScopes = collectSignedScopes(json)
    const isSigned = signedScopes.length > 0

    // Deep-trim only when there are no signatures to protect. Whitespace
    // hygiene is a quality-of-life feature and yields to integrity.
    const sanitized = isSigned ? json : deepTrimStrings(json)

    // Capture whatever was on the wire, normalized to a string for reporting.
    const incomingVersion = typeof sanitized.specVersion === 'string'
      ? sanitized.specVersion
      : (sanitized.specVersion != null ? String(sanitized.specVersion) : '')
    const originalVersion = incomingVersion || DEFAULT_SPEC_VERSION

    // Preserve the incoming spec version when it is one BOM Studio supports
    // (1.6 or 1.7); otherwise convert to the latest supported version so the
    // file can still be edited. This is what lets save round-trip a 1.6 BOM
    // back as 1.6.
    const specVersion = isSupportedSpecVersion(incomingVersion)
      ? incomingVersion
      : DEFAULT_SPEC_VERSION
    const converted = !isSupportedSpecVersion(incomingVersion)

    // Enforce component count limit to prevent DoS. For signed BOMs, the
    // slice would alter the canonical form and break the signature; we
    // preserve the array verbatim. The DoS guard upstream is MAX_FILE_SIZE.
    const components = Array.isArray(sanitized.components)
      ? (isSigned ? sanitized.components : sanitized.components.slice(0, MAX_COMPONENT_COUNT))
      : []
    const services = Array.isArray(sanitized.services)
      ? (isSigned ? sanitized.services : sanitized.services.slice(0, MAX_COMPONENT_COUNT))
      : []

    bom.value = {
      bomFormat: 'CycloneDX', // Always enforce correct format
      specVersion,
      serialNumber: sanitized.serialNumber || `urn:uuid:${uuidv4()}`,
      version: typeof sanitized.version === 'number' && Number.isFinite(sanitized.version) ? Math.max(1, Math.floor(sanitized.version)) : 1,
      // For signed imports, keep the metadata block byte-faithful when
      // it exists, and provide an empty object when it doesn't so that
      // editor consumers can read `bom.metadata.X` safely. The empty
      // object is later stripped on export when it was not part of the
      // original root key set (see bomForExport above).
      metadata: isSigned
        ? (sanitized.metadata ?? {})
        : {
          timestamp: sanitized.metadata?.timestamp || '',
          authors: Array.isArray(sanitized.metadata?.authors) ? sanitized.metadata.authors : [],
          supplier: sanitized.metadata?.supplier || null,
          manufacturer: sanitized.metadata?.manufacturer || null,
          component: sanitized.metadata?.component || null,
          lifecycles: Array.isArray(sanitized.metadata?.lifecycles) ? sanitized.metadata.lifecycles : [],
          tools: sanitized.metadata?.tools || { components: [], services: [] },
          licenses: Array.isArray(sanitized.metadata?.licenses) ? sanitized.metadata.licenses : [],
          properties: Array.isArray(sanitized.metadata?.properties) ? sanitized.metadata.properties : []
        },
      // For signed BOMs do not synthesize bom-refs; that would alter
      // the canonical form of the components array.
      components: isSigned
        ? components
        : components.map((c: any) => ({ 'bom-ref': c['bom-ref'] || uuidv4(), ...c })),
      services: isSigned
        ? services
        : services.map((s: any) => ({ 'bom-ref': s['bom-ref'] || uuidv4(), ...s })),
      dependencies: Array.isArray(sanitized.dependencies) ? sanitized.dependencies : [],
      externalReferences: Array.isArray(sanitized.externalReferences) ? sanitized.externalReferences : [],
      compositions: Array.isArray(sanitized.compositions) ? sanitized.compositions : [],
      vulnerabilities: Array.isArray(sanitized.vulnerabilities) ? sanitized.vulnerabilities : [],
      formulation: sanitized.formulation || { formulas: [] },
      annotations: Array.isArray(sanitized.annotations) ? sanitized.annotations : [],
      citations: Array.isArray(sanitized.citations) ? sanitized.citations : [],
      declarations: sanitized.declarations || {},
      properties: Array.isArray(sanitized.properties) ? sanitized.properties : [],
      // Preserve any root-level JSF signature attached to the imported
      // BOM. Issue #123: prior versions silently dropped this on import,
      // which produced an unsigned export on a no-op save.
      ...(sanitized.signature !== undefined ? { signature: sanitized.signature } : {})
    }
    // Snapshot which root keys the source actually carried so that
    // `bomForExport` can drop empty editor-added phantoms (e.g. a
    // synthetic `metadata: {}` for a source that had none) and keep
    // canonical bytes stable for unedited signed imports.
    originalRootKeys.value = isSigned
      ? new Set(Object.keys(sanitized).filter(k => k !== '$schema'))
      : null
    modified.value = false
    return { converted, originalVersion }
  }

  function addComponent(comp?: any) {
    const newComp = comp || { type: 'library', name: '', version: '', 'bom-ref': uuidv4(), group: '', description: '', licenses: [], hashes: [], externalReferences: [], properties: [] }
    bom.value.components.push(newComp)
    modified.value = true
  }

  function removeComponent(index: number) {
    bom.value.components.splice(index, 1)
    modified.value = true
  }

  function addService(svc?: any) {
    const newSvc = svc || { name: '', 'bom-ref': uuidv4(), endpoints: [], description: '', properties: [] }
    bom.value.services.push(newSvc)
    modified.value = true
  }

  function removeService(index: number) {
    bom.value.services.splice(index, 1)
    modified.value = true
  }

  function addDependency() {
    bom.value.dependencies.push({ ref: '', dependsOn: [], provides: [] })
    modified.value = true
  }

  function removeDependency(index: number) {
    bom.value.dependencies.splice(index, 1)
    modified.value = true
  }

  function addCitation(citation?: any) {
    const newCitation = citation || {
      'bom-ref': uuidv4(),
      timestamp: new Date().toISOString(),
      pointers: [],
      attributedTo: '',
      process: '',
      note: ''
    }
    bom.value.citations.push(newCitation)
    modified.value = true
  }

  function removeCitation(index: number) {
    bom.value.citations.splice(index, 1)
    modified.value = true
  }

  function markModified() { modified.value = true }
  function markSaved() { modified.value = false }
  function regenerateSerialNumber() { bom.value.serialNumber = `urn:uuid:${uuidv4()}`; modified.value = true }

  /**
   * Write fresh signature properties back into the in-memory BOM at the
   * given paths. Called by the save flow after a successful resign so
   * the in-memory state, the JSON Source view, and `bomForExport` all
   * reflect the just-written file. Without this, the next round of
   * `bomForExport` would still emit the stale signature (forcing a
   * needless resign) and the JSON Source panel would lie to the user
   * until they reloaded the file from disk.
   *
   * Each entry is `{ path, signature }`:
   *   - `path` = empty array for the BOM root, otherwise the
   *     pointer-style path to the parent of the signature property.
   *   - `signature` is the freshly-produced JSF signaturecore.
   *
   * If `signature` is set, originalRootKeys is widened to include
   * `signature` so a subsequent save does not strip the new key as
   * "phantom editor scaffolding".
   */
  function applySignaturesAtPaths(
    updates: ReadonlyArray<{ path: (string | number)[]; signature: unknown }>,
  ): void {
    if (updates.length === 0) return
    for (const { path, signature } of updates) {
      if (path.length === 0) {
        bom.value.signature = signature
        continue
      }
      let cur: any = bom.value
      for (let i = 0; i < path.length - 1; i++) {
        const seg = path[i] as any
        if (cur == null || typeof cur !== 'object') return
        cur = cur[seg]
      }
      if (cur == null || typeof cur !== 'object') continue
      const last = path[path.length - 1] as any
      if (cur[last] == null || typeof cur[last] !== 'object') continue
      cur[last].signature = signature
    }
    if (originalRootKeys.value && !originalRootKeys.value.has('signature')) {
      const next = new Set(originalRootKeys.value)
      next.add('signature')
      originalRootKeys.value = next
    }
  }

  return {
    bom, modified, fileName,
    componentCount, serviceCount, citationCount, isModified, bomForExport,
    createNewBom, loadBom, addComponent, removeComponent,
    addService, removeService, addDependency, removeDependency,
    addCitation, removeCitation,
    markModified, markSaved, regenerateSerialNumber,
    applySignaturesAtPaths,
  }
})
