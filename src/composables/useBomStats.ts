import { computed } from 'vue'
import { useBomStore } from '@/stores/bomStore'

export interface ComponentTypeStat {
  type: string
  count: number
  percentage: number
}

export interface DependencyStat {
  totalDependencies: number
  componentsWithNoDeps: number
  mostDependedUpon: { name: string; count: number } | null
  topDependedUpon: Array<{ ref: string; name: string; count: number }>
  avgDepsPerComponent: number
  maxDepsOnSingle: number
  maxDepsComponent: string | null
  circularDeps: Array<{ from: string; to: string }>
  totalUniqueEdges: number
  leafComponents: number
  rootComponents: number
}

export interface ExternalRefStat {
  totalRefs: number
  byType: { type: string; count: number }[]
  bomLinks: number
  plainRefs: number
  internalBomLinks: number
  externalBomLinks: number
}

export interface EndpointStat {
  totalEndpoints: number
  uniqueDomains: string[]
}

export function useBomStats() {
  const bomStore = useBomStore()

  // --- Component Stats ---
  const componentCount = computed(() => bomStore.bom.components.length)

  const componentsByType = computed<ComponentTypeStat[]>(() => {
    const counts: Record<string, number> = {}
    const components = bomStore.bom.components as any[]
    components.forEach(c => {
      const type = c.type || 'unknown'
      counts[type] = (counts[type] || 0) + 1
    })
    const total = components.length || 1
    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
  })

  // --- Service Stats ---
  const serviceCount = computed(() => bomStore.bom.services.length)

  const endpointStats = computed<EndpointStat>(() => {
    const services = bomStore.bom.services as any[]
    const allEndpoints: string[] = []
    const domains = new Set<string>()

    services.forEach(s => {
      if (s.endpoints && Array.isArray(s.endpoints)) {
        s.endpoints.forEach((ep: string) => {
          allEndpoints.push(ep)
          try {
            const url = new URL(ep)
            domains.add(url.hostname)
          } catch {
            // Not a valid URL, skip
          }
        })
      }
    })

    return {
      totalEndpoints: allEndpoints.length,
      uniqueDomains: Array.from(domains).sort()
    }
  })

  // --- Dependency Stats ---
  const dependencyStats = computed<DependencyStat>(() => {
    const deps = bomStore.bom.dependencies as any[]
    const components = bomStore.bom.components as any[]

    // Build adjacency for analysis
    const dependedUponCount: Record<string, number> = {}
    const adjacency = new Map<string, Set<string>>()

    deps.forEach(d => {
      if (!d.ref) return
      const depsList = (d.dependsOn && Array.isArray(d.dependsOn)) ? d.dependsOn : []
      adjacency.set(d.ref, new Set(depsList))
      depsList.forEach((ref: string) => {
        dependedUponCount[ref] = (dependedUponCount[ref] || 0) + 1
      })
    })

    // Helper: resolve bom-ref to component name
    const refToName = (ref: string): string => {
      const comp = components.find((c: any) => c['bom-ref'] === ref)
      return comp ? (comp.name || ref) : ref
    }

    // Top 5 most depended-upon
    const topDependedUpon = Object.entries(dependedUponCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ref, count]) => ({ ref, name: refToName(ref), count }))

    const mostDependedUpon = topDependedUpon.length > 0
      ? { name: topDependedUpon[0]!.name, count: topDependedUpon[0]!.count }
      : null

    // Circular dependency detection (direct cycles: A→B and B→A)
    const circularDeps: Array<{ from: string; to: string }> = []
    const seenPairs = new Set<string>()
    adjacency.forEach((targets, source) => {
      targets.forEach(target => {
        const reverseTargets = adjacency.get(target)
        if (reverseTargets?.has(source)) {
          const key = [source, target].sort().join('|')
          if (!seenPairs.has(key)) {
            seenPairs.add(key)
            circularDeps.push({ from: refToName(source), to: refToName(target) })
          }
        }
      })
    })

    // Components with no dependency entry at all
    const referencedRefs = new Set<string>()
    deps.forEach(d => { if (d.ref) referencedRefs.add(d.ref) })
    const componentsWithNoDeps = components.filter(
      (c: any) => !referencedRefs.has(c['bom-ref'])
    ).length

    // Total unique edges
    let totalUniqueEdges = 0
    adjacency.forEach(targets => { totalUniqueEdges += targets.size })

    // Max deps on a single component
    let maxDepsOnSingle = 0
    let maxDepsComponent: string | null = null
    adjacency.forEach((targets, source) => {
      if (targets.size > maxDepsOnSingle) {
        maxDepsOnSingle = targets.size
        maxDepsComponent = refToName(source)
      }
    })

    // Leaf components (have a dep entry but depend on nothing)
    const leafComponents = deps.filter(d => !d.dependsOn || d.dependsOn.length === 0).length

    // Root components (not depended upon by anything but have deps themselves)
    const allDepTargets = new Set<string>()
    adjacency.forEach(targets => targets.forEach(t => allDepTargets.add(t)))
    const rootComponents = deps.filter(d => d.ref && !allDepTargets.has(d.ref)).length

    const totalDepsCount = deps.reduce(
      (sum: number, d: any) => sum + (d.dependsOn?.length || 0), 0
    )

    return {
      totalDependencies: deps.length,
      componentsWithNoDeps,
      mostDependedUpon,
      topDependedUpon,
      avgDepsPerComponent: deps.length > 0 ? Math.round((totalDepsCount / deps.length) * 10) / 10 : 0,
      maxDepsOnSingle,
      maxDepsComponent,
      circularDeps,
      totalUniqueEdges,
      leafComponents,
      rootComponents
    }
  })

  // --- External Reference Stats ---
  const externalRefStats = computed<ExternalRefStat>(() => {
    const refs = bomStore.bom.externalReferences as any[]
    const byTypeMap: Record<string, number> = {}
    let bomLinks = 0
    let plainRefs = 0
    let internalBomLinks = 0
    let externalBomLinks = 0

    const serialNumber = bomStore.bom.serialNumber || ''

    refs.forEach(r => {
      const type = r.type || 'other'
      byTypeMap[type] = (byTypeMap[type] || 0) + 1

      const url = r.url || ''
      if (url.startsWith('urn:cdx:')) {
        bomLinks++
        // Internal if the URN contains the BOM's own serial number
        const urnUuid = url.replace('urn:cdx:', '').split('/')[0]
        const bomUuid = serialNumber.replace('urn:uuid:', '')
        if (urnUuid === bomUuid) {
          internalBomLinks++
        } else {
          externalBomLinks++
        }
      } else {
        plainRefs++
      }
    })

    return {
      totalRefs: refs.length,
      byType: Object.entries(byTypeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      bomLinks,
      plainRefs,
      internalBomLinks,
      externalBomLinks
    }
  })

  // --- Annotation Stats ---
  const annotationCount = computed(() => (bomStore.bom.annotations || []).length)

  const annotationsByType = computed(() => {
    const annotations = bomStore.bom.annotations || []
    const counts: Record<string, number> = {}
    annotations.forEach((a: any) => {
      const ann = a.annotator
      if (!ann) { counts['unknown'] = (counts['unknown'] || 0) + 1; return }
      if (ann.organization) counts['organization'] = (counts['organization'] || 0) + 1
      else if (ann.individual) counts['individual'] = (counts['individual'] || 0) + 1
      else if (ann.component) counts['component'] = (counts['component'] || 0) + 1
      else if (ann.service) counts['service'] = (counts['service'] || 0) + 1
      else counts['unknown'] = (counts['unknown'] || 0) + 1
    })
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  })

  // --- Composition Stats ---
  const compositionCount = computed(() => bomStore.bom.compositions.length)

  // --- Properties Stats ---
  const propertyCount = computed(() => (bomStore.bom.properties || []).length)

  // --- Overall summary ---
  const bomSummary = computed(() => ({
    hasMetadata: !!(bomStore.bom.metadata.timestamp || bomStore.bom.metadata.authors?.length),
    hasComponents: bomStore.bom.components.length > 0,
    hasServices: bomStore.bom.services.length > 0,
    hasDependencies: bomStore.bom.dependencies.length > 0,
    hasExternalRefs: bomStore.bom.externalReferences.length > 0,
    hasAnnotations: (bomStore.bom.annotations || []).length > 0,
    hasCompositions: bomStore.bom.compositions.length > 0,
    hasProperties: (bomStore.bom.properties || []).length > 0,
    specVersion: bomStore.bom.specVersion,
    bomFormat: bomStore.bom.bomFormat
  }))

  return {
    componentCount,
    componentsByType,
    serviceCount,
    endpointStats,
    dependencyStats,
    externalRefStats,
    annotationCount,
    annotationsByType,
    compositionCount,
    propertyCount,
    bomSummary
  }
}
