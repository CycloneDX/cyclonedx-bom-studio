<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElIcon, ElBadge, ElTooltip } from 'element-plus'
import {
  Odometer,
  Document,
  InfoFilled,
  Box,
  Connection,
  Share,
  Link,
  Collection,
  ChatDotRound,
  Stamp,
  List,
  DArrowLeft,
  DArrowRight,
} from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useUiStore } from '@/stores/uiStore'
import { useSpecVersionGating } from '@/composables/useSpecVersionGating'

const { t } = useI18n()
const router = useRouter()
const bomStore = useBomStore()
const uiStore = useUiStore()
const { supportsCitations } = useSpecVersionGating()

const isCollapsed = computed(() => uiStore.sidebarCollapsed)

const navItems = computed(() => [
  {
    id: 'dashboard',
    label: t('nav.dashboard'),
    icon: Odometer,
    path: '/dashboard',
    badge: null as number | null,
  },
  {
    id: 'bom-identity',
    label: t('nav.bomIdentity'),
    icon: Document,
    path: '/bom-identity',
    badge: null as number | null,
  },
  {
    id: 'metadata',
    label: t('nav.metadata'),
    icon: InfoFilled,
    path: '/metadata',
    badge: null as number | null,
  },
  {
    id: 'components',
    label: t('nav.components'),
    icon: Box,
    path: '/components',
    badge: bomStore.componentCount,
  },
  {
    id: 'services',
    label: t('nav.services'),
    icon: Connection,
    path: '/services',
    badge: bomStore.serviceCount,
  },
  {
    id: 'dependencies',
    label: t('nav.dependencies'),
    icon: Share,
    path: '/dependencies',
    badge: bomStore.bom.dependencies.length,
  },
  {
    id: 'external-references',
    label: t('nav.externalReferences'),
    icon: Link,
    path: '/external-references',
    badge: bomStore.bom.externalReferences.length,
  },
  {
    id: 'compositions',
    label: t('nav.compositions'),
    icon: Collection,
    path: '/compositions',
    badge: bomStore.bom.compositions.length,
  },
  {
    id: 'annotations',
    label: t('nav.annotations'),
    icon: ChatDotRound,
    path: '/annotations',
    badge: (bomStore.bom.annotations || []).length,
  },
  ...(supportsCitations.value ? [{
    id: 'citations',
    label: t('nav.citations'),
    icon: Stamp,
    path: '/citations',
    badge: bomStore.citationCount,
  }] : []),
])

const footerItems = computed(() => [
  {
    id: 'properties',
    label: t('nav.properties'),
    icon: List,
    path: '/properties',
    badge: null as number | null,
  },
  {
    id: 'json-source',
    label: t('nav.jsonSource'),
    icon: Document,
    path: '/json-source',
    badge: null as number | null,
  },
])

const isActive = (path: string): boolean => {
  return router.currentRoute.value.path === path
}

const handleNavigate = (path: string) => {
  router.push(path)
}

const toggleSidebar = () => {
  uiStore.toggleSidebar()
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar-collapsed': isCollapsed }"
  >
    <!-- Toggle button -->
    <div class="sidebar-header">
      <el-tooltip
        :content="isCollapsed ? t('shared.expand') : t('shared.collapse')"
        placement="right"
      >
        <button class="toggle-btn" @click="toggleSidebar">
          <el-icon>
            <DArrowRight v-if="isCollapsed" />
            <DArrowLeft v-else />
          </el-icon>
        </button>
      </el-tooltip>
    </div>

    <!-- Main navigation -->
    <nav class="nav-section">
      <div
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ 'nav-item-active': isActive(item.path) }"
        @click="handleNavigate(item.path)"
      >
        <el-tooltip
          v-if="isCollapsed"
          :content="item.label"
          placement="right"
        >
          <div class="nav-item-content">
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
            <el-badge
              v-if="item.badge !== null && !isCollapsed"
              :value="item.badge"
              class="nav-badge"
            />
          </div>
        </el-tooltip>

        <template v-else>
          <div class="nav-item-content">
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="nav-label">{{ item.label }}</span>
            <el-badge
              v-if="item.badge !== null"
              :value="item.badge"
              class="nav-badge"
            />
          </div>
        </template>
      </div>
    </nav>

    <!-- Footer navigation -->
    <nav class="nav-section nav-footer">
      <div
        v-for="item in footerItems"
        :key="item.id"
        class="nav-item"
        :class="{ 'nav-item-active': isActive(item.path) }"
        @click="handleNavigate(item.path)"
      >
        <el-tooltip
          v-if="isCollapsed"
          :content="item.label"
          placement="right"
        >
          <div class="nav-item-content">
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
          </div>
        </el-tooltip>

        <template v-else>
          <div class="nav-item-content">
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="nav-label">{{ item.label }}</span>
          </div>
        </template>
      </div>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins' as *;

.sidebar {
  width: $sidebar-width;
  background: $bg-sidebar;
  border-right: 1px solid $border-default;
  display: flex;
  flex-direction: column;
  transition: width $transition-base;
  overflow: hidden;
  z-index: $z-sticky;

  &.sidebar-collapsed {
    width: $sidebar-collapsed;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: $space-2 $space-2;
  border-bottom: 1px solid $border-default;

  .sidebar-collapsed & {
    justify-content: center;
  }
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: $space-1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-tertiary;
  border-radius: $radius-sm;
  transition: color $transition-base;

  &:hover {
    color: $text-primary;
  }

  :deep(.el-icon) {
    font-size: $text-sm;
  }
}

.nav-section {
  flex: 1;
  overflow-y: auto;
  padding: $space-3 0;
  @include custom-scrollbar;
}

.nav-footer {
  margin-top: auto;
  border-top: 1px solid $border-default;
  padding: $space-3 0;
  flex: 0 0 auto;
}

.nav-item {
  padding: $space-2 $space-3;
  cursor: pointer;
  transition: background $transition-base;
  display: flex;
  align-items: center;
  position: relative;

  &:hover {
    background: $bg-hover;
  }

  &.nav-item-active {
    background: $bg-active;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: $accent-primary;
    }

    .nav-icon {
      color: $accent-primary;
    }

    .nav-label {
      color: $text-primary;
      font-weight: $weight-semibold;
    }
  }
}

.nav-item-content {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
  min-width: 0;
}

.nav-icon {
  flex: 0 0 auto;
  font-size: $text-lg;
  color: $text-secondary;
  transition: color $transition-base;
}

.nav-label {
  flex: 1;
  font-size: $text-sm;
  color: $text-secondary;
  transition: color $transition-base;
  @include text-truncate;

  .sidebar-collapsed & {
    display: none;
  }
}

.nav-badge {
  flex: 0 0 auto;

  :deep(.el-badge__content) {
    background-color: $accent-primary;
    color: #ffffff;
    font-size: $text-2xs;
    padding: $space-1 $space-2;
    border-radius: $radius-full;
  }
}

:deep(.el-icon) {
  vertical-align: middle;
}
</style>
