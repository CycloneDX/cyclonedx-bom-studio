<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElPopover } from 'element-plus'
import { useBomStore } from '@/stores/bomStore'
import type { NodeMeta } from '@/composables/useDependencyFilter'
import { getNodeColor, formatType } from '@/composables/useDependencyFilter'

const props = defineProps<{
  filteredNodeIds: Set<string>
  nodeMeta: Record<string, NodeMeta>
  adjacency: Record<string, string[]>
  reverseAdjacency: Record<string, string[]>
  getFullComponentInfo: (bomRef: string) => Record<string, any> | null
}>()

defineExpose({ resetView })

const { t } = useI18n()
const bomStore = useBomStore()
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// Pan/zoom state
const viewBox = ref({ x: 0, y: 0, w: 1200, h: 800 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const scale = ref(1)

// Collapsed state
const collapsedNodes = ref<Set<string>>(new Set())

const toggleNode = (id: string) => {
  const s = new Set(collapsedNodes.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  collapsedNodes.value = s
}

// Active detail popover
const activePopover = ref<string | null>(null)
const popoverPosition = ref({ x: 0, y: 0 })

const showDetail = (id: string, event: MouseEvent) => {
  event.stopPropagation()
  activePopover.value = activePopover.value === id ? null : id
}

const hideDetail = () => {
  activePopover.value = null
}

// Computed detail info
const detailInfo = computed(() => {
  if (!activePopover.value) return null
  const fullInfo = props.getFullComponentInfo(activePopover.value)
  const meta = props.nodeMeta[activePopover.value]
  if (!fullInfo && !meta) return null

  const deps = props.adjacency[activePopover.value] || []
  const dependedOnBy = props.reverseAdjacency[activePopover.value] || []

  return {
    bomRef: activePopover.value,
    name: meta?.name || activePopover.value.substring(0, 12),
    type: meta?.type || 'unknown',
    group: fullInfo?.group || meta?.group || '',
    version: fullInfo?.version || meta?.version || '',
    supplier: fullInfo?.supplier?.name || fullInfo?.manufacturer?.name || fullInfo?.provider?.name || meta?.supplier || '',
    description: fullInfo?.description || '',
    purl: fullInfo?.purl || '',
    cpe: fullInfo?.cpe || '',
    licenses: (fullInfo?.licenses || []).map((l: any) => l.license?.id || l.license?.name || l.expression || 'Unknown').filter(Boolean),
    scope: fullInfo?.scope || '',
    hashes: (fullInfo?.hashes || []).length,
    externalReferences: (fullInfo?.externalReferences || []).length,
    dependsOn: deps.map(d => props.nodeMeta[d]?.name || d.substring(0, 12)),
    dependedOnBy: dependedOnBy.map(d => props.nodeMeta[d]?.name || d.substring(0, 12)),
    isService: meta?.isService || false
  }
})

// Find root nodes (not depended on by anything)
const rootNodes = computed(() => {
  const allDeps = new Set<string>()
  Object.values(props.adjacency).forEach(deps => {
    deps.forEach(d => allDeps.add(d))
  })
  const allRefs = Object.keys(props.adjacency)
  const roots = allRefs.filter(ref =>
    !allDeps.has(ref) && props.filteredNodeIds.has(ref)
  )
  if (roots.length > 0) return roots
  // Fallback: any filtered nodes that have adjacency entries
  return allRefs.filter(ref => props.filteredNodeIds.has(ref))
})

// Layout constants
const NODE_W = 220
const NODE_H = 40
const H_GAP = 50
const V_GAP = 12
const INDENT = NODE_W + H_GAP

// Build tree layout
const treeData = computed(() => {
  const visited = new Set<string>()
  const nodes: {
    id: string; name: string; type: string; x: number; y: number
    depth: number; parentId: string | null; hasChildren: boolean; isCollapsed: boolean
    childCount: number
  }[] = []
  const edges: { from: string; to: string }[] = []
  let yPos = 30

  const walk = (id: string, depth: number, parentId: string | null) => {
    if (visited.has(id)) return
    if (!props.filteredNodeIds.has(id)) return
    visited.add(id)

    const meta = props.nodeMeta[id]
    if (!meta) return

    const allChildren = props.adjacency[id] || []
    const filteredChildren = allChildren.filter(c => props.filteredNodeIds.has(c))
    const isCollapsed = collapsedNodes.value.has(id)

    nodes.push({
      id,
      name: meta.name,
      type: meta.type,
      x: 30 + depth * INDENT,
      y: yPos,
      depth,
      parentId,
      hasChildren: filteredChildren.length > 0,
      isCollapsed,
      childCount: filteredChildren.length
    })

    if (parentId) {
      edges.push({ from: parentId, to: id })
    }

    yPos += NODE_H + V_GAP

    if (!isCollapsed) {
      filteredChildren.forEach(childId => {
        walk(childId, depth + 1, id)
      })
    }
  }

  rootNodes.value.forEach(root => walk(root, 0, null))

  // Also walk orphans in the filtered set
  Object.keys(props.adjacency).forEach(ref => {
    if (!visited.has(ref) && props.filteredNodeIds.has(ref)) {
      walk(ref, 0, null)
    }
  })

  return { nodes, edges, totalHeight: yPos + 30 }
})

// Compute edge paths
const edgePaths = computed(() => {
  const nodeMap: Record<string, { x: number; y: number }> = {}
  treeData.value.nodes.forEach(n => {
    nodeMap[n.id] = { x: n.x, y: n.y }
  })

  return treeData.value.edges
    .filter(e => nodeMap[e.from] && nodeMap[e.to])
    .map(e => {
      const from = nodeMap[e.from]!
      const to = nodeMap[e.to]!
      const x1 = from.x + NODE_W
      const y1 = from.y + NODE_H / 2
      const x2 = to.x
      const y2 = to.y + NODE_H / 2
      const midX = x1 + (x2 - x1) / 2
      return {
        path: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
        from: e.from,
        to: e.to
      }
    })
})

// Auto-fit viewbox
watch([treeData], () => {
  const maxX = Math.max(
    ...treeData.value.nodes.map(n => n.x + NODE_W + 40),
    800
  )
  viewBox.value = { x: 0, y: 0, w: maxX, h: treeData.value.totalHeight }
}, { immediate: true })

// Pan handlers
const onMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  hideDetail()
  isPanning.value = true
  panStart.value = { x: e.clientX, y: e.clientY }
}

const onMouseMove = (e: MouseEvent) => {
  if (!isPanning.value) return
  const dx = (e.clientX - panStart.value.x) / scale.value
  const dy = (e.clientY - panStart.value.y) / scale.value
  viewBox.value = {
    ...viewBox.value,
    x: viewBox.value.x - dx,
    y: viewBox.value.y - dy
  }
  panStart.value = { x: e.clientX, y: e.clientY }
}

const onMouseUp = () => { isPanning.value = false }

const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  const factor = e.deltaY > 0 ? 1.1 : 0.9
  const newW = viewBox.value.w * factor
  const newH = viewBox.value.h * factor
  const dx = (viewBox.value.w - newW) / 2
  const dy = (viewBox.value.h - newH) / 2
  viewBox.value = {
    x: viewBox.value.x + dx,
    y: viewBox.value.y + dy,
    w: newW,
    h: newH
  }
  scale.value /= factor
}

function resetView() {
  const maxX = Math.max(...treeData.value.nodes.map(n => n.x + NODE_W + 40), 800)
  viewBox.value = { x: 0, y: 0, w: maxX, h: treeData.value.totalHeight }
  scale.value = 1
}

const expandAll = () => {
  collapsedNodes.value = new Set()
}

const collapseAll = () => {
  const s = new Set<string>()
  treeData.value.nodes.forEach(n => {
    if (n.hasChildren) s.add(n.id)
  })
  // Need to rebuild from adjacency to get all parents
  Object.entries(props.adjacency).forEach(([ref, deps]) => {
    if (deps.length > 0 && props.filteredNodeIds.has(ref)) s.add(ref)
  })
  collapsedNodes.value = s
}
</script>

<template>
  <div class="dep-tree" ref="containerRef">
    <div class="dep-tree__controls">
      <button class="dep-tree__btn" @click="resetView" :title="t('dependencies.resetView')">{{ t('dependencies.resetView') }}</button>
      <button class="dep-tree__btn" @click="expandAll" :title="t('dependencies.expandAll')">{{ t('dependencies.expandAll') }}</button>
      <button class="dep-tree__btn" @click="collapseAll" :title="t('dependencies.collapseAll')">{{ t('dependencies.collapseAll') }}</button>
      <span class="dep-tree__hint">{{ t('dependencies.treeHint') }}</span>
    </div>

    <svg
      ref="svgRef"
      class="dep-tree__svg"
      :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`"
      preserveAspectRatio="xMidYMid meet"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @wheel.prevent="onWheel"
    >
      <defs>
        <marker id="tree-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#3d444d" />
        </marker>
      </defs>

      <!-- Edges -->
      <path
        v-for="(edge, i) in edgePaths"
        :key="'e' + i"
        :d="edge.path"
        fill="none"
        stroke="#3d444d"
        stroke-width="1.5"
        marker-end="url(#tree-arrow)"
      />

      <!-- Nodes -->
      <g
        v-for="node in treeData.nodes"
        :key="node.id"
        class="dep-tree__node"
        :transform="`translate(${node.x}, ${node.y})`"
      >
        <!-- Node rect background -->
        <rect
          :width="NODE_W"
          :height="NODE_H"
          rx="4"
          ry="4"
          :fill="node.isCollapsed ? '#21262d' : '#161b22'"
          :stroke="getNodeColor(node.type)"
          stroke-width="1.5"
          class="dep-tree__node-rect"
          @click.stop="toggleNode(node.id)"
          @contextmenu.prevent="showDetail(node.id, $event)"
        />
        <!-- Type indicator bar -->
        <rect
          x="0" y="0" width="4" :height="NODE_H"
          rx="2"
          :fill="getNodeColor(node.type)"
          @click.stop="toggleNode(node.id)"
        />
        <!-- Type label -->
        <text
          :x="12"
          :y="13"
          fill="#6e7681"
          font-size="9"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          {{ formatType(node.type) }}
        </text>
        <!-- Name text -->
        <text
          :x="12"
          :y="NODE_H / 2 + 7"
          dominant-baseline="middle"
          fill="#e6edf3"
          font-size="12"
          font-weight="500"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          @click.stop="toggleNode(node.id)"
        >
          {{ node.name.length > 24 ? node.name.substring(0, 22) + '…' : node.name }}
        </text>
        <!-- Child count badge -->
        <g v-if="node.hasChildren" :transform="`translate(${NODE_W - 36}, ${NODE_H / 2 - 8})`">
          <rect
            width="28" height="16" rx="8" ry="8"
            :fill="node.isCollapsed ? getNodeColor(node.type) : '#30363d'"
            opacity="0.8"
          />
          <text
            x="14" y="12"
            text-anchor="middle"
            :fill="node.isCollapsed ? '#fff' : '#8b949e'"
            font-size="9"
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            {{ node.isCollapsed ? '+' + node.childCount : '−' }}
          </text>
        </g>
        <!-- Info icon (click for popover) -->
        <g
          :transform="`translate(${NODE_W - 8}, 4)`"
          class="dep-tree__info-icon"
          @click.stop="showDetail(node.id, $event)"
        >
          <circle r="6" fill="transparent" />
          <text
            text-anchor="middle"
            dominant-baseline="central"
            fill="#6e7681"
            font-size="10"
            font-weight="bold"
          >i</text>
        </g>
      </g>
    </svg>

    <!-- Detail popover (rendered in DOM, positioned absolutely) -->
    <Teleport to="body">
      <div
        v-if="detailInfo"
        class="dep-tree-popover"
        @click.stop
      >
        <div class="dep-tree-popover__header">
          <span
            class="dep-tree-popover__type-dot"
            :style="{ backgroundColor: getNodeColor(detailInfo.type) }"
          />
          <span class="dep-tree-popover__name">{{ detailInfo.name }}</span>
          <span class="dep-tree-popover__type-badge">{{ formatType(detailInfo.type) }}</span>
          <button class="dep-tree-popover__close" @click="hideDetail">&times;</button>
        </div>

        <div class="dep-tree-popover__body">
          <div v-if="detailInfo.version" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.version') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.version }}</span>
          </div>
          <div v-if="detailInfo.group" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.group') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.group }}</span>
          </div>
          <div v-if="detailInfo.supplier" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ detailInfo.isService ? t('common.provider') : t('common.supplier') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.supplier }}</span>
          </div>
          <div v-if="detailInfo.scope" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.scope') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.scope }}</span>
          </div>
          <div v-if="detailInfo.purl" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.purl') }}</span>
            <span class="dep-tree-popover__value dep-tree-popover__value--mono">{{ detailInfo.purl }}</span>
          </div>
          <div v-if="detailInfo.cpe" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.cpe') }}</span>
            <span class="dep-tree-popover__value dep-tree-popover__value--mono">{{ detailInfo.cpe }}</span>
          </div>
          <div v-if="detailInfo.licenses.length > 0" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.licenses') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.licenses.join(', ') }}</span>
          </div>
          <div v-if="detailInfo.description" class="dep-tree-popover__row dep-tree-popover__row--full">
            <span class="dep-tree-popover__label">{{ t('common.description') }}</span>
            <span class="dep-tree-popover__value dep-tree-popover__value--desc">{{ detailInfo.description }}</span>
          </div>
          <div v-if="detailInfo.hashes > 0" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.hashes') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.hashes }}</span>
          </div>
          <div v-if="detailInfo.externalReferences > 0" class="dep-tree-popover__row">
            <span class="dep-tree-popover__label">{{ t('common.externalReferences') }}</span>
            <span class="dep-tree-popover__value">{{ detailInfo.externalReferences }}</span>
          </div>

          <!-- Dependency relationships -->
          <div v-if="detailInfo.dependsOn.length > 0" class="dep-tree-popover__section">
            <span class="dep-tree-popover__section-title">Depends On ({{ detailInfo.dependsOn.length }})</span>
            <div class="dep-tree-popover__dep-list">
              <span v-for="dep in detailInfo.dependsOn" :key="dep" class="dep-tree-popover__dep-tag">{{ dep }}</span>
            </div>
          </div>
          <div v-if="detailInfo.dependedOnBy.length > 0" class="dep-tree-popover__section">
            <span class="dep-tree-popover__section-title">Depended On By ({{ detailInfo.dependedOnBy.length }})</span>
            <div class="dep-tree-popover__dep-list">
              <span v-for="dep in detailInfo.dependedOnBy" :key="dep" class="dep-tree-popover__dep-tag">{{ dep }}</span>
            </div>
          </div>
        </div>

        <div class="dep-tree-popover__footer">
          <span class="dep-tree-popover__bom-ref">{{ detailInfo.bomRef }}</span>
        </div>
      </div>
    </Teleport>

    <div v-if="treeData.nodes.length === 0" class="dep-tree__empty">
      {{ t('dependencies.noDataToVisualize') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;

.dep-tree {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__controls {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 0;
    margin-bottom: $space-2;
    flex-wrap: wrap;
  }

  &__btn {
    padding: $space-1 $space-3;
    background: $bg-elevated;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    color: $text-secondary;
    font-size: $text-xs;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      color: $text-primary;
      border-color: $accent-primary;
    }
  }

  &__hint {
    font-size: $text-xs;
    color: $text-tertiary;
    margin-left: $space-2;
  }

  &__svg {
    flex: 1;
    min-height: 400px;
    background: $bg-surface;
    border: 1px solid $border-default;
    border-radius: $radius-md;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  &__node {
    cursor: pointer;

    &:hover .dep-tree__node-rect {
      stroke-width: 2.5;
      filter: drop-shadow(0 0 4px rgba(88, 166, 255, 0.2));
    }
  }

  &__info-icon {
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
    }
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $text-tertiary;
    font-size: $text-sm;
  }
}
</style>

<style lang="scss">
@use '@/assets/styles/tokens' as *;

/* Popover rendered via teleport — unscoped */
.dep-tree-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background: $bg-elevated;
  border: 1px solid $border-default;
  border-radius: $radius-lg;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);

  &__header {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-3 $space-4;
    border-bottom: 1px solid $border-default;
    background: $bg-input;
    border-radius: $radius-lg $radius-lg 0 0;
  }

  &__type-dot {
    width: 10px;
    height: 10px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }

  &__name {
    font-size: $text-sm;
    font-weight: $weight-semibold;
    color: $text-primary;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__type-badge {
    font-size: 10px;
    color: $text-tertiary;
    background: $bg-surface;
    padding: 2px 8px;
    border-radius: $radius-full;
    white-space: nowrap;
  }

  &__close {
    background: none;
    border: none;
    color: $text-tertiary;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;

    &:hover {
      color: $text-primary;
    }
  }

  &__body {
    padding: $space-3 $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__row {
    display: flex;
    align-items: flex-start;
    gap: $space-3;

    &--full {
      flex-direction: column;
      gap: $space-1;
    }
  }

  &__label {
    font-size: 11px;
    color: $text-tertiary;
    min-width: 80px;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.6;
  }

  &__value {
    font-size: $text-xs;
    color: $text-secondary;
    word-break: break-word;
    line-height: 1.5;

    &--mono {
      font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
      font-size: 11px;
      color: $blue-400;
    }

    &--desc {
      font-size: 11px;
      color: $text-tertiary;
      line-height: 1.5;
      max-height: 80px;
      overflow-y: auto;
    }
  }

  &__section {
    margin-top: $space-2;
    padding-top: $space-2;
    border-top: 1px solid $border-default;
  }

  &__section-title {
    font-size: 11px;
    color: $text-tertiary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: $space-1;
    display: block;
  }

  &__dep-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: $space-1;
  }

  &__dep-tag {
    font-size: 10px;
    color: $text-secondary;
    background: $bg-surface;
    border: 1px solid $border-default;
    padding: 2px 8px;
    border-radius: $radius-sm;
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__footer {
    padding: $space-2 $space-4;
    border-top: 1px solid $border-default;
    background: $bg-input;
    border-radius: 0 0 $radius-lg $radius-lg;
  }

  &__bom-ref {
    font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
    font-size: 10px;
    color: $text-tertiary;
    word-break: break-all;
  }
}
</style>
