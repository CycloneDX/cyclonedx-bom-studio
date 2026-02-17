<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { VNetworkGraph, defineConfigs } from 'v-network-graph'
import { ForceLayout } from 'v-network-graph/lib/force-layout'
import { useBomStore } from '@/stores/bomStore'
import type { VNetworkGraphInstance } from 'v-network-graph'
import type { NodeMeta } from '@/composables/useDependencyFilter'
import { getNodeColor } from '@/composables/useDependencyFilter'

const props = defineProps<{
  filteredNodeIds: Set<string>
  nodeMeta: Record<string, NodeMeta>
  dependedUponCount: Record<string, number>
  maxDepCount: number
  activeLegendTypes: string[]
}>()

defineExpose({ fitToContents })

const { t } = useI18n()
const bomStore = useBomStore()
const graphRef = ref<VNetworkGraphInstance>()

const formatType = (type: string): string =>
  type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// --- Build v-network-graph nodes ---
const graphNodes = computed(() => {
  const n: Record<string, { name: string; type: string; depCount: number; color: string; size: number }> = {}
  const allNodeIds = new Set<string>()

  bomStore.bom.dependencies.forEach((d: any) => {
    if (d.ref) allNodeIds.add(d.ref)
    if (d.dependsOn) d.dependsOn.forEach((ref: string) => allNodeIds.add(ref))
    if (d.provides) d.provides.forEach((ref: string) => allNodeIds.add(ref))
  })

  allNodeIds.forEach(id => {
    if (!props.filteredNodeIds.has(id)) return
    const meta = props.nodeMeta[id]
    if (!meta) return
    const dc = props.dependedUponCount[id] || 0
    const size = 16 + (dc / props.maxDepCount) * 30

    n[id] = {
      name: meta.name,
      type: meta.type,
      depCount: dc,
      color: getNodeColor(meta.type),
      size
    }
  })
  return n
})

// --- Build v-network-graph edges ---
const graphEdges = computed(() => {
  const e: Record<string, { source: string; target: string }> = {}
  let idx = 0

  bomStore.bom.dependencies.forEach((d: any) => {
    if (!d.ref || !props.filteredNodeIds.has(d.ref)) return
    if (!graphNodes.value[d.ref]) return

    if (d.dependsOn) {
      d.dependsOn.forEach((dep: string) => {
        if (props.filteredNodeIds.has(dep) && graphNodes.value[dep]) {
          e[`e${idx++}`] = { source: d.ref, target: dep }
        }
      })
    }
  })
  return e
})

// --- Layouts ---
const layouts = ref({ nodes: {} as Record<string, { x: number; y: number }> })

// --- Config ---
const configs = computed(() => defineConfigs({
  view: {
    panEnabled: true,
    zoomEnabled: true,
    minZoomLevel: 0.1,
    maxZoomLevel: 10,
    autoPanAndZoomOnLoad: 'fit-content' as const,
    fitContentMargin: '8%',
    layoutHandler: new ForceLayout({
      positionFixedByDrag: true,
      positionFixedByClickWithAltKey: true,
      createSimulation: (d3: any, nodes: any[], edges: any[]) => {
        return d3.forceSimulation(nodes)
          .force('edge', d3.forceLink(edges).id((d: any) => d.id).distance(120).strength(0.4))
          .force('charge', d3.forceManyBody().strength(-400))
          .force('center', d3.forceCenter().strength(0.05))
          .force('collide', d3.forceCollide().radius((d: any) => {
            const node = graphNodes.value[d.id]
            return node ? node.size + 10 : 30
          }))
          .alphaMin(0.001)
      }
    })
  },
  node: {
    normal: {
      type: 'circle' as const,
      radius: (node: any) => node.size || 20,
      color: (node: any) => node.color || '#6e7681',
      strokeWidth: 2,
      strokeColor: (node: any) => node.color || '#6e7681'
    },
    hover: {
      color: (node: any) => node.color || '#6e7681',
      strokeWidth: 3,
      strokeColor: '#e6edf3'
    },
    label: {
      visible: true,
      text: 'name' as const,
      fontSize: 11,
      color: '#b1bac4',
      direction: 'south' as const,
      directionAutoAdjustment: true
    },
    draggable: true,
    focusring: {
      visible: true,
      width: 2,
      padding: 3,
      color: '#58a6ff'
    }
  },
  edge: {
    normal: {
      color: '#3d444d',
      width: 1.5
    },
    hover: {
      color: '#58a6ff',
      width: 2.5
    },
    marker: {
      target: {
        type: 'arrow' as const,
        width: 5,
        height: 5
      }
    }
  }
}))

// --- Actions ---
function fitToContents() {
  nextTick(() => {
    graphRef.value?.fitToContents({ margin: '8%' })
  })
}

// Fit after data changes — shallow signature avoids deep comparison of 2800+ objects
const graphDataSignature = computed(() =>
  `${Object.keys(graphNodes.value).length}|${Object.keys(graphEdges.value).length}`
)

watch(graphDataSignature, async () => {
  await nextTick()
  setTimeout(() => {
    graphRef.value?.fitToContents({ margin: '8%' })
  }, 600)
})

const hasData = computed(() => Object.keys(graphNodes.value).length > 0)
const hasDependencies = computed(() => bomStore.bom.dependencies.length > 0)
</script>

<template>
  <div class="dep-graph">
    <!-- Graph -->
    <div class="dep-graph__canvas-wrap" v-if="hasDependencies">
      <v-network-graph
        ref="graphRef"
        class="dep-graph__graph"
        :nodes="graphNodes"
        :edges="graphEdges"
        v-model:layouts="layouts"
        :configs="configs"
      />
    </div>
    <div v-else class="dep-graph__empty">
      {{ t('dependencies.noGraphData') }}
    </div>

    <!-- Legend -->
    <div v-if="hasData" class="dep-graph__legend">
      <span class="dep-graph__legend-hint">Larger nodes = more dependents</span>
      <span class="dep-graph__legend-sep">|</span>
      <span
        v-for="t in activeLegendTypes"
        :key="t"
        class="dep-graph__legend-item"
      >
        <span class="dep-graph__legend-dot" :style="{ backgroundColor: getNodeColor(t) }" />
        {{ formatType(t) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.dep-graph {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &__canvas-wrap {
    flex: 1;
    min-height: 500px;
    background: $bg-surface;
    border: 1px solid $border-default;
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__graph {
    width: 100%;
    height: 500px;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $text-tertiary;
    font-size: $text-sm;
  }

  &__legend {
    display: flex;
    align-items: center;
    gap: $space-3;
    font-size: $text-xs;
    color: $text-tertiary;
    flex-wrap: wrap;
  }

  &__legend-hint {
    font-style: italic;
  }

  &__legend-sep {
    color: $grey-600;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: $space-1;
  }

  &__legend-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }
}
</style>
