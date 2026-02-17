import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { deepTrimStrings, isValidSpecVersion, MAX_COMPONENT_COUNT } from '@/utils/sanitize'

export const useBomStore = defineStore('bom', () => {
  // State
  const bom = ref<any>({
    bomFormat: 'CycloneDX',
    specVersion: '1.7',
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

  // Getters
  const componentCount = computed(() => bom.value.components.length)
  const serviceCount = computed(() => bom.value.services.length)
  const citationCount = computed(() => bom.value.citations.length)
  const isModified = computed(() => modified.value)
  const bomForExport = computed(() => {
    const result: any = { ...bom.value }
    // Clean empty arrays and nulls
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
      specVersion: '1.7',
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
  }

  // Minimum supported spec version
  const MINIMUM_SPEC_VERSION = '1.6'
  const TARGET_SPEC_VERSION = '1.7'

  function loadBom(json: any): { converted: boolean; originalVersion: string } | undefined {
    if (!json || typeof json !== 'object') return

    // Deep-trim all string values in the incoming BOM
    const sanitized = deepTrimStrings(json)

    // Validate spec version, default to target if invalid
    const originalVersion = isValidSpecVersion(sanitized.specVersion) ? sanitized.specVersion : TARGET_SPEC_VERSION

    // Always upgrade to target version — app only supports 1.6+
    const specVersion = TARGET_SPEC_VERSION
    const converted = originalVersion !== TARGET_SPEC_VERSION

    // Enforce component count limit to prevent DoS
    const components = Array.isArray(sanitized.components) ? sanitized.components.slice(0, MAX_COMPONENT_COUNT) : []
    const services = Array.isArray(sanitized.services) ? sanitized.services.slice(0, MAX_COMPONENT_COUNT) : []

    bom.value = {
      bomFormat: 'CycloneDX', // Always enforce correct format
      specVersion,
      serialNumber: sanitized.serialNumber || `urn:uuid:${uuidv4()}`,
      version: typeof sanitized.version === 'number' && Number.isFinite(sanitized.version) ? Math.max(1, Math.floor(sanitized.version)) : 1,
      metadata: {
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
      components: components.map((c: any) => ({ 'bom-ref': c['bom-ref'] || uuidv4(), ...c })),
      services: services.map((s: any) => ({ 'bom-ref': s['bom-ref'] || uuidv4(), ...s })),
      dependencies: Array.isArray(sanitized.dependencies) ? sanitized.dependencies : [],
      externalReferences: Array.isArray(sanitized.externalReferences) ? sanitized.externalReferences : [],
      compositions: Array.isArray(sanitized.compositions) ? sanitized.compositions : [],
      vulnerabilities: Array.isArray(sanitized.vulnerabilities) ? sanitized.vulnerabilities : [],
      formulation: sanitized.formulation || { formulas: [] },
      annotations: Array.isArray(sanitized.annotations) ? sanitized.annotations : [],
      citations: Array.isArray(sanitized.citations) ? sanitized.citations : [],
      declarations: sanitized.declarations || {},
      properties: Array.isArray(sanitized.properties) ? sanitized.properties : []
    }
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

  return {
    bom, modified, fileName,
    componentCount, serviceCount, citationCount, isModified, bomForExport,
    createNewBom, loadBom, addComponent, removeComponent,
    addService, removeService, addDependency, removeDependency,
    addCitation, removeCitation,
    markModified, markSaved, regenerateSerialNumber
  }
})
