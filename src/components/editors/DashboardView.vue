<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElCard, ElDialog, ElEmpty, ElProgress, ElTag } from 'element-plus'
import InfoTip from '@/components/shared/InfoTip.vue'
import ViewSpinner from '@/components/shared/ViewSpinner.vue'
import {
  Box,
  Connection,
  Share,
  Link,
  ChatDotRound,
  List,
  Collection,
  InfoFilled,
} from '@element-plus/icons-vue'
import { useBomStats } from '@/composables/useBomStats'
import { useBomStore } from '@/stores/bomStore'
import { useSpecVersionGating, COMPONENT_TYPES_BY_VERSION, versionAtLeast } from '@/composables/useSpecVersionGating'
import { useViewLoading, useViewLoadingAsync } from '@/composables/useViewLoading'

await useViewLoadingAsync()
const { ready } = useViewLoading()

const { t } = useI18n()
const bomStore = useBomStore()
const { specVersion } = useSpecVersionGating()
const {
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
  bomSummary,
} = useBomStats()

// Type label formatting
const formatType = (type: string): string => {
  return type
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// All component types (including 0-count ones) for the current spec version
const allComponentTypeStats = computed(() => {
  const existingMap = new Map(componentsByType.value.map(t => [t.type, t]))
  const total = componentCount.value || 1
  return COMPONENT_TYPES_BY_VERSION
    .filter(ct => versionAtLeast(specVersion.value, ct.minVersion))
    .map(ct => {
      const existing = existingMap.get(ct.value)
      return {
        type: ct.value,
        count: existing?.count || 0,
        percentage: existing?.percentage || 0
      }
    })
    .sort((a, b) => a.type.localeCompare(b.type))
})

// Color for component type badges
const typeColors: Record<string, string> = {
  library: '#58a6ff',
  framework: '#a371f7',
  application: '#3fb950',
  container: '#db6d28',
  'operating-system': '#f85149',
  device: '#d29922',
  firmware: '#f778ba',
  file: '#8b949e',
  'cryptographic-asset': '#79c0ff',
  data: '#56d364',
  'machine-learning-model': '#ff9bce',
  platform: '#39d353',
}

const getTypeColor = (type: string): string => typeColors[type] || '#8b949e'

// Chart-like bar width for type distribution
const maxTypeCount = computed(() => {
  return allComponentTypeStats.value.length > 0
    ? Math.max(...allComponentTypeStats.value.map(t => t.count), 1)
    : 1
})

// External ref type color
const refTypeColors: Record<string, string> = {
  website: '#58a6ff',
  vcs: '#a371f7',
  'issue-tracker': '#f85149',
  documentation: '#3fb950',
  distribution: '#db6d28',
  license: '#d29922',
  'build-system': '#79c0ff',
  'release-notes': '#f778ba',
  advisories: '#ff9bce',
  other: '#8b949e',
}

const getRefTypeColor = (type: string): string => refTypeColors[type] || '#8b949e'

// Metadata display
const metadataTimestamp = computed(() => {
  const ts = bomStore.bom.metadata?.timestamp
  if (!ts) return null
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
})

// Circular dependency modal
const showCircularDepsModal = ref(false)

const authorCount = computed(() => (bomStore.bom.metadata?.authors || []).length)
const toolCount = computed(() => {
  const tools = bomStore.bom.metadata?.tools
  if (!tools) return 0
  return (tools.components?.length || 0) + (tools.services?.length || 0)
})
</script>

<template>
  <div class="dashboard">
    <ViewSpinner v-if="!ready" />
    <template v-if="ready">
      <!-- Header -->
      <div class="dashboard__header">
        <h1 class="dashboard__title">{{ t('dashboard.title') }}</h1>
        <div class="dashboard__meta">
          <span class="dashboard__meta-item">
            {{ bomSummary.bomFormat }} {{ bomSummary.specVersion }}
          </span>
          <span v-if="metadataTimestamp" class="dashboard__meta-item">
            Created {{ metadataTimestamp }}
          </span>
        </div>
      </div>

      <!-- Summary Cards Row -->
      <div class="dashboard__stats-row">
      <div class="dashboard__stat-card dashboard__stat-card--blue">
        <div class="dashboard__stat-icon">
          <el-icon :size="22"><Box /></el-icon>
        </div>
        <div class="dashboard__stat-body">
          <span class="dashboard__stat-value">{{ componentCount }}</span>
          <span class="dashboard__stat-label">{{ t('dashboard.components') }}</span>
        </div>
      </div>

      <div class="dashboard__stat-card dashboard__stat-card--green">
        <div class="dashboard__stat-icon">
          <el-icon :size="22"><Connection /></el-icon>
        </div>
        <div class="dashboard__stat-body">
          <span class="dashboard__stat-value">{{ serviceCount }}</span>
          <span class="dashboard__stat-label">{{ t('dashboard.services') }}</span>
        </div>
      </div>

      <div class="dashboard__stat-card dashboard__stat-card--amber">
        <div class="dashboard__stat-icon">
          <el-icon :size="22"><Share /></el-icon>
        </div>
        <div class="dashboard__stat-body">
          <span class="dashboard__stat-value">{{ dependencyStats.totalDependencies }}</span>
          <span class="dashboard__stat-label">{{ t('dashboard.dependencies') }}</span>
        </div>
      </div>

      <div class="dashboard__stat-card dashboard__stat-card--purple">
        <div class="dashboard__stat-icon">
          <el-icon :size="22"><Link /></el-icon>
        </div>
        <div class="dashboard__stat-body">
          <span class="dashboard__stat-value">{{ externalRefStats.totalRefs }}</span>
          <span class="dashboard__stat-label">{{ t('dashboard.externalReferences') }}</span>
        </div>
      </div>

      <div class="dashboard__stat-card dashboard__stat-card--teal">
        <div class="dashboard__stat-icon">
          <el-icon :size="22"><ChatDotRound /></el-icon>
        </div>
        <div class="dashboard__stat-body">
          <span class="dashboard__stat-value">{{ annotationCount }}</span>
          <span class="dashboard__stat-label">{{ t('dashboard.annotations') }}</span>
        </div>
      </div>
    </div>

    <!-- Detail Panels -->
    <div class="dashboard__grid">
      <!-- Component Breakdown -->
      <ElCard class="dashboard__panel">
        <template #header>
          <div class="dashboard__panel-header">
            <el-icon class="dashboard__panel-icon"><Box /></el-icon>
            <span>{{ t('dashboard.componentTypes') }}</span>
          </div>
        </template>
        <div v-if="allComponentTypeStats.length > 0" class="dashboard__type-list">
          <div
            v-for="item in allComponentTypeStats"
            :key="item.type"
            class="dashboard__type-row"
          >
            <div class="dashboard__type-label">
              <span
                class="dashboard__type-dot"
                :style="{ backgroundColor: getTypeColor(item.type) }"
              />
              <span>{{ formatType(item.type) }}</span>
            </div>
            <div class="dashboard__type-bar-wrap">
              <div
                class="dashboard__type-bar"
                :style="{
                  width: `${(item.count / maxTypeCount) * 100}%`,
                  backgroundColor: getTypeColor(item.type)
                }"
              />
            </div>
            <span class="dashboard__type-count">{{ item.count }}</span>
            <span class="dashboard__type-pct">{{ item.percentage }}%</span>
          </div>
        </div>
        <ElEmpty v-else :description="t('dashboard.noComponents')" :image-size="48" />
      </ElCard>

      <!-- Dependency Analysis -->
      <ElCard class="dashboard__panel">
        <template #header>
          <div class="dashboard__panel-header">
            <el-icon class="dashboard__panel-icon"><Share /></el-icon>
            <span>{{ t('dashboard.dependencyAnalysis') }}</span>
          </div>
        </template>
        <div v-if="dependencyStats.totalDependencies > 0" class="dashboard__detail-list">
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">
              {{ t('dashboard.dependencyEntries') }}
              <InfoTip content="Number of components or services that have declared their dependencies in this BOM" />
            </span>
            <span class="dashboard__detail-value">{{ dependencyStats.totalDependencies }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">
              {{ t('dashboard.uniqueEdges') }}
              <InfoTip content="Total number of distinct dependency relationships across all entries" />
            </span>
            <span class="dashboard__detail-value">{{ dependencyStats.totalUniqueEdges }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">
              {{ t('dashboard.avgDepsPerComponent') }}
              <InfoTip content="Average number of direct dependencies declared per dependency entry" />
            </span>
            <span class="dashboard__detail-value">{{ dependencyStats.avgDepsPerComponent }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">
              {{ t('dashboard.orphanedComponents') }}
              <InfoTip content="Components that exist in the BOM but are not referenced in any dependency entry" />
            </span>
            <span class="dashboard__detail-value" :class="{ 'dashboard__detail-value--warn': dependencyStats.componentsWithNoDeps > 0 }">
              {{ dependencyStats.componentsWithNoDeps }}
            </span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">
              {{ t('dashboard.circularDependencies') }}
              <InfoTip content="Pairs of components that depend on each other, forming a cycle (A depends on B and B depends on A)" />
            </span>
            <span
              v-if="dependencyStats.circularDeps.length > 0"
              class="dashboard__detail-value dashboard__detail-value--warn dashboard__detail-value--clickable"
              @click="showCircularDepsModal = true"
            >
              {{ dependencyStats.circularDeps.length }}
            </span>
            <span v-else class="dashboard__detail-value dashboard__detail-value--good">0</span>
          </div>

          <!-- Top depended upon -->
          <div v-if="dependencyStats.topDependedUpon.length > 0" class="dashboard__dep-section">
            <div class="dashboard__dep-section-header">{{ t('dashboard.mostDependedUpon') }}</div>
            <div
              v-for="(item, idx) in dependencyStats.topDependedUpon"
              :key="item.ref"
              class="dashboard__top-dep-row"
            >
              <span class="dashboard__top-dep-rank">{{ idx + 1 }}</span>
              <span class="dashboard__top-dep-name">{{ item.name }}</span>
              <div class="dashboard__top-dep-bar-wrap">
                <div
                  class="dashboard__top-dep-bar"
                  :style="{ width: `${(item.count / (dependencyStats.topDependedUpon[0]?.count || 1)) * 100}%` }"
                />
              </div>
              <span class="dashboard__top-dep-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
        <ElEmpty v-else :description="t('dependencies.noDependencies')" :image-size="48" />
      </ElCard>

      <!-- Circular Dependencies Modal -->
      <ElDialog
        v-model="showCircularDepsModal"
        :title="t('dashboard.circularDependencies')"
        width="520px"
        :append-to-body="true"
      >
        <div class="circular-deps-modal">
          <div class="circular-deps-modal__list">
            <div
              v-for="(cycle, idx) in dependencyStats.circularDeps"
              :key="idx"
              class="circular-deps-modal__item"
            >
              <span class="circular-deps-modal__index">{{ idx + 1 }}</span>
              <span class="circular-deps-modal__from">{{ cycle.from }}</span>
              <span class="circular-deps-modal__arrow">&#8644;</span>
              <span class="circular-deps-modal__to">{{ cycle.to }}</span>
            </div>
          </div>
          <div class="circular-deps-modal__funfact">
            <div class="circular-deps-modal__funfact-label">Did you know?</div>
            <p class="circular-deps-modal__funfact-text">
              The "Cyclone" in CycloneDX is inspired by circular dependencies &mdash;
              the tangled webs of components that depend on each other in loops, creating
              a swirling vortex of complexity in the software supply chain. Just like a
              real cyclone, these dependency cycles can spiral into build failures,
              version conflicts, and maintenance headaches that are notoriously difficult
              to untangle.
            </p>
          </div>
        </div>
      </ElDialog>

      <!-- Services & Endpoints -->
      <ElCard class="dashboard__panel">
        <template #header>
          <div class="dashboard__panel-header">
            <el-icon class="dashboard__panel-icon"><Connection /></el-icon>
            <span>{{ t('dashboard.services') }}</span>
          </div>
        </template>
        <div v-if="serviceCount > 0" class="dashboard__detail-list">
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.totalServices') }}</span>
            <span class="dashboard__detail-value">{{ serviceCount }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.totalEndpoints') }}</span>
            <span class="dashboard__detail-value">{{ endpointStats.totalEndpoints }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.uniqueDomains') }}</span>
            <span class="dashboard__detail-value">{{ endpointStats.uniqueDomains.length }}</span>
          </div>
          <div v-if="endpointStats.uniqueDomains.length > 0" class="dashboard__domain-list">
            <ElTag
              v-for="domain in endpointStats.uniqueDomains"
              :key="domain"
              size="small"
              class="dashboard__domain-tag"
            >
              {{ domain }}
            </ElTag>
          </div>
        </div>
        <ElEmpty v-else :description="t('dashboard.noServices')" :image-size="48" />
      </ElCard>

      <!-- External References Breakdown -->
      <ElCard class="dashboard__panel">
        <template #header>
          <div class="dashboard__panel-header">
            <el-icon class="dashboard__panel-icon"><Link /></el-icon>
            <span>{{ t('dashboard.externalReferences') }}</span>
          </div>
        </template>
        <div v-if="externalRefStats.totalRefs > 0" class="dashboard__detail-list">
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.plainReferences') }}</span>
            <span class="dashboard__detail-value">{{ externalRefStats.plainRefs }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.bomLinkReferences') }}</span>
            <span class="dashboard__detail-value">{{ externalRefStats.bomLinks }}</span>
          </div>
          <div v-if="externalRefStats.bomLinks > 0" class="dashboard__detail-row dashboard__detail-row--indent">
            <span class="dashboard__detail-label">{{ t('dashboard.internalBomLinks') }}</span>
            <span class="dashboard__detail-value">{{ externalRefStats.internalBomLinks }}</span>
          </div>
          <div v-if="externalRefStats.bomLinks > 0" class="dashboard__detail-row dashboard__detail-row--indent">
            <span class="dashboard__detail-label">{{ t('dashboard.externalBomLinks') }}</span>
            <span class="dashboard__detail-value">{{ externalRefStats.externalBomLinks }}</span>
          </div>
          <div v-if="externalRefStats.byType.length > 0" class="dashboard__ref-types">
            <div class="dashboard__ref-type-header">{{ t('dashboard.byType') }}</div>
            <div
              v-for="rt in externalRefStats.byType"
              :key="rt.type"
              class="dashboard__type-row"
            >
              <div class="dashboard__type-label">
                <span
                  class="dashboard__type-dot"
                  :style="{ backgroundColor: getRefTypeColor(rt.type) }"
                />
                <span>{{ formatType(rt.type) }}</span>
              </div>
              <span class="dashboard__type-count">{{ rt.count }}</span>
            </div>
          </div>
        </div>
        <ElEmpty v-else :description="t('dashboard.noExternalReferences')" :image-size="48" />
      </ElCard>

      <!-- Annotations -->
      <ElCard class="dashboard__panel">
        <template #header>
          <div class="dashboard__panel-header">
            <el-icon class="dashboard__panel-icon"><ChatDotRound /></el-icon>
            <span>{{ t('dashboard.annotations') }}</span>
          </div>
        </template>
        <div v-if="annotationCount > 0" class="dashboard__detail-list">
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.totalAnnotations') }}</span>
            <span class="dashboard__detail-value">{{ annotationCount }}</span>
          </div>
          <div
            v-for="at in annotationsByType"
            :key="at.type"
            class="dashboard__detail-row"
          >
            <span class="dashboard__detail-label">By {{ formatType(at.type) }}</span>
            <span class="dashboard__detail-value">{{ at.count }}</span>
          </div>
        </div>
        <ElEmpty v-else :description="t('dashboard.noAnnotations')" :image-size="48" />
      </ElCard>

      <!-- BOM Metadata & Completeness -->
      <ElCard class="dashboard__panel">
        <template #header>
          <div class="dashboard__panel-header">
            <el-icon class="dashboard__panel-icon"><InfoFilled /></el-icon>
            <span>{{ t('dashboard.bomMetadata') }}</span>
          </div>
        </template>
        <div class="dashboard__detail-list">
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.authors') }}</span>
            <span class="dashboard__detail-value">{{ authorCount }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.tools') }}</span>
            <span class="dashboard__detail-value">{{ toolCount }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.compositions') }}</span>
            <span class="dashboard__detail-value">{{ compositionCount }}</span>
          </div>
          <div class="dashboard__detail-row">
            <span class="dashboard__detail-label">{{ t('dashboard.properties') }}</span>
            <span class="dashboard__detail-value">{{ propertyCount }}</span>
          </div>

          <!-- Section presence indicators -->
          <div class="dashboard__presence-grid">
            <div class="dashboard__presence-item" :class="{ 'dashboard__presence-item--active': bomSummary.hasComponents }">
              <span class="dashboard__presence-dot" />
              {{ t('dashboard.components') }}
            </div>
            <div class="dashboard__presence-item" :class="{ 'dashboard__presence-item--active': bomSummary.hasServices }">
              <span class="dashboard__presence-dot" />
              {{ t('dashboard.services') }}
            </div>
            <div class="dashboard__presence-item" :class="{ 'dashboard__presence-item--active': bomSummary.hasDependencies }">
              <span class="dashboard__presence-dot" />
              {{ t('dashboard.dependencies') }}
            </div>
            <div class="dashboard__presence-item" :class="{ 'dashboard__presence-item--active': bomSummary.hasExternalRefs }">
              <span class="dashboard__presence-dot" />
              {{ t('dashboard.externalReferences') }}
            </div>
            <div class="dashboard__presence-item" :class="{ 'dashboard__presence-item--active': bomSummary.hasAnnotations }">
              <span class="dashboard__presence-dot" />
              {{ t('dashboard.annotations') }}
            </div>
            <div class="dashboard__presence-item" :class="{ 'dashboard__presence-item--active': bomSummary.hasCompositions }">
              <span class="dashboard__presence-dot" />
              {{ t('dashboard.compositions') }}
            </div>
          </div>
        </div>
      </ElCard>
    </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins' as *;

.dashboard {
  width: 100%;
  max-width: 1400px;

  &__header {
    margin-bottom: $space-6;
  }

  &__title {
    font-size: $text-2xl;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0 0 $space-1 0;
  }

  &__meta {
    display: flex;
    gap: $space-4;
    color: $text-tertiary;
    font-size: $text-sm;
  }

  &__meta-item {
    &::before {
      content: '';
    }
  }

  // === Summary stat cards ===
  &__stats-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: $space-4;
    margin-bottom: $space-6;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__stat-card {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-4 $space-5;
    background: $bg-surface;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
    border-left: 3px solid transparent;
    transition: box-shadow $transition-base;

    &:hover {
      box-shadow: $shadow-md;
    }

    &--blue { border-left-color: $chart-blue; }
    &--green { border-left-color: $chart-green; }
    &--amber { border-left-color: $chart-amber; }
    &--purple { border-left-color: $chart-purple; }
    &--teal { border-left-color: $chart-teal; }
    &--red { border-left-color: $chart-red; }
  }

  &__stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: rgba($accent-primary, 0.1);
    color: $text-secondary;
    flex-shrink: 0;
  }

  &__stat-card--blue &__stat-icon { background: rgba($chart-blue, 0.1); color: $chart-blue; }
  &__stat-card--green &__stat-icon { background: rgba($chart-green, 0.1); color: $chart-green; }
  &__stat-card--amber &__stat-icon { background: rgba($chart-amber, 0.1); color: $chart-amber; }
  &__stat-card--purple &__stat-icon { background: rgba($chart-purple, 0.1); color: $chart-purple; }
  &__stat-card--teal &__stat-icon { background: rgba($chart-teal, 0.1); color: $chart-teal; }

  &__stat-body {
    display: flex;
    flex-direction: column;
  }

  &__stat-value {
    font-size: $text-2xl;
    font-weight: $weight-bold;
    color: $text-primary;
    line-height: 1.2;
  }

  &__stat-label {
    font-size: $text-xs;
    color: $text-tertiary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // === Panel grid ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $space-4;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }

  &__panel {
    :deep(.el-card__header) {
      padding: $space-3 $space-4;
      border-bottom: 1px solid $border-default;
      background: $bg-elevated;
    }

    :deep(.el-card__body) {
      padding: $space-4;
      background: $bg-surface;
    }
  }

  &__panel-header {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-sm;
    font-weight: $weight-semibold;
    color: $text-primary;
  }

  &__panel-icon {
    color: $text-tertiary;
  }

  // === Type distribution bars ===
  &__type-list {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__type-row {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__type-label {
    display: flex;
    align-items: center;
    gap: $space-2;
    min-width: 140px;
    font-size: $text-sm;
    color: $text-secondary;
  }

  &__type-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }

  &__type-bar-wrap {
    flex: 1;
    height: 6px;
    background: $bg-input;
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__type-bar {
    height: 100%;
    border-radius: $radius-full;
    transition: width $transition-slow;
    min-width: 2px;
  }

  &__type-count {
    font-size: $text-sm;
    font-weight: $weight-semibold;
    color: $text-primary;
    min-width: 28px;
    text-align: right;
  }

  &__type-pct {
    font-size: $text-xs;
    color: $text-tertiary;
    min-width: 36px;
    text-align: right;
  }

  // === Detail key-value list ===
  &__detail-list {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  &__detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $space-2 0;
    border-bottom: 1px solid rgba($border-default, 0.4);

    &:last-child {
      border-bottom: none;
    }

    &--indent {
      padding-left: $space-4;
    }
  }

  &__detail-label {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: $text-sm;
    color: $text-secondary;
  }

  &__detail-value {
    font-size: $text-sm;
    font-weight: $weight-semibold;
    color: $text-primary;
    display: flex;
    align-items: center;
    gap: $space-2;

    &--warn {
      color: $amber-500;
    }

    &--accent {
      color: $accent-primary;
    }

    &--good {
      color: $green-500;
    }

    &--clickable {
      cursor: pointer;
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 3px;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  &__inline-tag {
    margin-left: $space-1;
  }

  // === Dependency section ===
  &__dep-section-header {
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $text-tertiary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: $space-3;
    padding-top: $space-3;
    border-top: 1px solid rgba($border-default, 0.4);
    margin-bottom: $space-1;
  }

  &__dep-section {
    margin-top: $space-1;
  }

  &__top-dep-row {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-1 0;
  }

  &__top-dep-rank {
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $text-tertiary;
    min-width: 16px;
    text-align: center;
  }

  &__top-dep-name {
    font-size: $text-sm;
    color: $text-secondary;
    min-width: 120px;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__top-dep-bar-wrap {
    flex: 1;
    height: 5px;
    background: $bg-input;
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__top-dep-bar {
    height: 100%;
    border-radius: $radius-full;
    background: $chart-amber;
    transition: width $transition-slow;
    min-width: 2px;
  }

  &__top-dep-count {
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $text-primary;
    min-width: 20px;
    text-align: right;
  }

  // === Domain tags ===
  &__domain-list {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    margin-top: $space-2;
    padding-top: $space-2;
    border-top: 1px solid rgba($border-default, 0.4);
  }

  &__domain-tag {
    font-size: $text-xs;
  }

  // === Ref type breakdown ===
  &__ref-types {
    margin-top: $space-3;
    padding-top: $space-3;
    border-top: 1px solid rgba($border-default, 0.4);
  }

  &__ref-type-header {
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $text-tertiary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $space-2;
  }

  // === Presence indicators ===
  &__presence-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $space-2;
    margin-top: $space-3;
    padding-top: $space-3;
    border-top: 1px solid rgba($border-default, 0.4);
  }

  &__presence-item {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $text-xs;
    color: $text-disabled;
    padding: $space-1;

    &--active {
      color: $text-secondary;
    }
  }

  &__presence-dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-full;
    background: $grey-600;
    flex-shrink: 0;

    .dashboard__presence-item--active & {
      background: $green-500;
    }
  }
}

// Circular deps modal (not scoped to .dashboard since ElDialog uses append-to-body)
.circular-deps-modal {
  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    margin-bottom: $space-4;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-2 $space-3;
    background: $bg-elevated;
    border: 1px solid $border-default;
    border-radius: $radius-md;
  }

  &__index {
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $text-tertiary;
    min-width: 20px;
    text-align: center;
  }

  &__from,
  &__to {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-primary;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__arrow {
    font-size: $text-lg;
    color: $amber-500;
    flex-shrink: 0;
  }

  &__funfact {
    padding: $space-3 $space-4;
    background: rgba($accent-primary, 0.06);
    border: 1px solid rgba($accent-primary, 0.15);
    border-radius: $radius-md;
  }

  &__funfact-label {
    font-size: $text-xs;
    font-weight: $weight-semibold;
    color: $accent-primary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $space-2;
  }

  &__funfact-text {
    font-size: $text-sm;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0;
  }
}
</style>
