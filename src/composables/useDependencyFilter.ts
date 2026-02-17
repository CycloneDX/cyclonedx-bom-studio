import { computed, ref } from 'vue'
import { useBomStore } from '@/stores/bomStore'

export interface NodeMeta {
  bomRef: string
  name: string
  type: string
  group: string
  supplier: string
  version: string
  isService: boolean
}

export const typeColorMap: Record<string, string> = {
  library: '#58a6ff',
  framework: '#a371f7',
  application: '#3fb950',
  container: '#db6d28',
  service: '#d29922',
  'operating-system': '#f85149',
  'cryptographic-asset': '#79c0ff',
  device: '#f778ba',
  firmware: '#ff9bce',
  platform: '#39d353',
  file: '#8b949e',
  data: '#56d364',
  'machine-learning-model': '#bc8cff',
  unknown: '#6e7681',
}

export const getNodeColor = (type: string): string => typeColorMap[type] || '#6e7681'

export const formatType = (type: string): string =>
  type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export function useDependencyFilter() {
  const bomStore = useBomStore()

  // --- Filter state (shared reactive refs) ---
  const filterType = ref<string>('')
  const filterGroup = ref<string>('')
  const filterName = ref<string>('')
  const filterSupplier = ref<string>('')
  const showServices = ref(true)

  // --- Node metadata lookup ---
  const nodeMeta = computed(() => {
    const map: Record<string, NodeMeta> = {}
    bomStore.bom.components.forEach((c: any) => {
      map[c['bom-ref']] = {
        bomRef: c['bom-ref'],
        name: c.name || c['bom-ref'].substring(0, 8),
        type: c.type || 'unknown',
        group: c.group || '',
        supplier: c.supplier?.name || c.manufacturer?.name || '',
        version: c.version || '',
        isService: false
      }
    })
    bomStore.bom.services.forEach((s: any) => {
      map[s['bom-ref']] = {
        bomRef: s['bom-ref'],
        name: s.name || s['bom-ref'].substring(0, 8),
        type: 'service',
        group: s.group || '',
        supplier: s.provider?.name || '',
        version: s.version || '',
        isService: true
      }
    })
    return map
  })

  // --- Available filter options ---
  const availableTypes = computed(() => {
    const types = new Set<string>()
    Object.values(nodeMeta.value).forEach(m => types.add(m.type))
    return Array.from(types).sort()
  })

  const availableGroups = computed(() => {
    const groups = new Set<string>()
    Object.values(nodeMeta.value).forEach(m => { if (m.group) groups.add(m.group) })
    return Array.from(groups).sort()
  })

  const availableSuppliers = computed(() => {
    const suppliers = new Set<string>()
    Object.values(nodeMeta.value).forEach(m => { if (m.supplier) suppliers.add(m.supplier) })
    return Array.from(suppliers).sort()
  })

  // --- Filtered node IDs ---
  const filteredNodeIds = computed(() => {
    const nameFilter = filterName.value.toLowerCase()
    return new Set(
      Object.entries(nodeMeta.value)
        .filter(([_, m]) => {
          if (!showServices.value && m.isService) return false
          if (filterType.value && m.type !== filterType.value) return false
          if (filterGroup.value && m.group !== filterGroup.value) return false
          if (filterSupplier.value && m.supplier !== filterSupplier.value) return false
          if (nameFilter && !m.name.toLowerCase().includes(nameFilter)) return false
          return true
        })
        .map(([id]) => id)
    )
  })

  // --- Depended-upon counts ---
  const dependedUponCount = computed(() => {
    const counts: Record<string, number> = {}
    bomStore.bom.dependencies.forEach((d: any) => {
      if (d.dependsOn) {
        d.dependsOn.forEach((ref: string) => {
          counts[ref] = (counts[ref] || 0) + 1
        })
      }
    })
    return counts
  })

  const maxDepCount = computed(() => Math.max(...Object.values(dependedUponCount.value), 1))

  // --- Adjacency map ---
  const adjacency = computed(() => {
    const adj: Record<string, string[]> = {}
    bomStore.bom.dependencies.forEach((d: any) => {
      if (d.ref) {
        adj[d.ref] = d.dependsOn || []
      }
    })
    return adj
  })

  // --- Reverse adjacency map (who depends on each node) ---
  const reverseAdjacency = computed(() => {
    const rev: Record<string, string[]> = {}
    Object.entries(adjacency.value).forEach(([ref, deps]) => {
      deps.forEach(dep => {
        if (!rev[dep]) rev[dep] = []
        rev[dep].push(ref)
      })
    })
    return rev
  })

  // --- Active legend types (types currently visible after filter) ---
  const activeLegendTypes = computed(() => {
    const types = new Set<string>()
    filteredNodeIds.value.forEach(id => {
      const meta = nodeMeta.value[id]
      if (meta) types.add(meta.type)
    })
    return Array.from(types).sort()
  })

  const hasAnyFilters = computed(() =>
    filterType.value !== '' ||
    filterGroup.value !== '' ||
    filterName.value !== '' ||
    filterSupplier.value !== ''
  )

  const resetFilters = () => {
    filterType.value = ''
    filterGroup.value = ''
    filterName.value = ''
    filterSupplier.value = ''
    showServices.value = true
  }

  // --- Full component/service info lookup for detail cards ---
  const getFullComponentInfo = (bomRef: string): Record<string, any> | null => {
    const comp = bomStore.bom.components.find((c: any) => c['bom-ref'] === bomRef)
    if (comp) return comp
    const svc = bomStore.bom.services.find((s: any) => s['bom-ref'] === bomRef)
    if (svc) return svc
    return null
  }

  return {
    // Filter state
    filterType,
    filterGroup,
    filterName,
    filterSupplier,
    showServices,
    // Computed data
    nodeMeta,
    availableTypes,
    availableGroups,
    availableSuppliers,
    filteredNodeIds,
    dependedUponCount,
    maxDepCount,
    adjacency,
    reverseAdjacency,
    activeLegendTypes,
    hasAnyFilters,
    // Actions
    resetFilters,
    getFullComponentInfo
  }
}
