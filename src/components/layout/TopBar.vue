<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElDivider, ElIcon, ElTooltip, ElSelect, ElOption } from 'element-plus'
import {
  Plus,
  FolderOpened,
  Download,
  CircleCheck,
} from '@element-plus/icons-vue'
import { useUiStore } from '@/stores/uiStore'
import { AVAILABLE_LOCALES } from '@/i18n'
import cyclonedxLogo from '@/assets/images/cyclonedx-logo.svg'

declare const __APP_VERSION__: string
const appVersion = __APP_VERSION__

const { t } = useI18n()
const uiStore = useUiStore()

defineEmits<{
  newBom: []
  openBom: []
  saveBom: []
  validateBom: []
}>()

const currentLocale = computed({
  get: () => uiStore.locale,
  set: (value) => uiStore.setLocale(value),
})

</script>

<template>
  <header class="topbar">
    <!-- Left section: CycloneDX Logo + BOM Studio -->
    <div class="topbar-section topbar-left">
      <div class="app-header">
        <a href="https://cyclonedx.org" target="_blank" rel="noopener noreferrer" class="app-logo-link">
          <img :src="cyclonedxLogo" alt="CycloneDX" class="app-logo" />
        </a>
        <span class="app-subtitle">BOM Studio <span class="app-version">v{{ appVersion }}</span></span>
      </div>
    </div>

    <!-- Center section: Action buttons -->
    <div class="topbar-section topbar-center">
      <el-tooltip :content="t('topbar.newBom')" placement="bottom">
        <el-button
          text
          size="small"
          :icon="Plus"
          @click="$emit('newBom')"
        />
      </el-tooltip>

      <el-tooltip :content="t('topbar.openBom')" placement="bottom">
        <el-button
          text
          size="small"
          :icon="FolderOpened"
          @click="$emit('openBom')"
        />
      </el-tooltip>

      <el-tooltip :content="t('topbar.saveBom')" placement="bottom">
        <el-button
          text
          size="small"
          :icon="Download"
          @click="$emit('saveBom')"
        />
      </el-tooltip>

      <el-divider direction="vertical" />

      <el-tooltip :content="t('topbar.validate')" placement="bottom">
        <el-button
          text
          size="small"
          :icon="CircleCheck"
          @click="$emit('validateBom')"
        />
      </el-tooltip>
    </div>

    <!-- Right section: Mode and language -->
    <div class="topbar-section topbar-right">
      <ElSelect v-model="currentLocale" class="locale-select" size="small">
        <ElOption
          v-for="locale in AVAILABLE_LOCALES"
          :key="locale.code"
          :label="locale.nativeName"
          :value="locale.code"
        />
      </ElSelect>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins' as *;

.topbar {
  height: $topbar-height;
  background: $bg-sidebar;
  border-bottom: 1px solid $border-default;
  @include flex-row($gap: $space-4);
  align-items: center;
  padding: 0 $space-6;
  z-index: $z-sticky;
}

.topbar-section {
  @include flex-row($gap: $space-4);
  align-items: center;
}

.topbar-left {
  flex: 0 0 auto;
}

.topbar-center {
  flex: 1;
  justify-content: center;
}

.topbar-right {
  flex: 0 0 auto;
}

.app-header {
  @include flex-row($gap: $space-3);
  align-items: center;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
}

.app-logo-link {
  display: flex;
  align-items: center;
  transition: opacity $transition-base;

  &:hover {
    opacity: 0.8;
  }
}

.app-logo {
  height: 28px;
  width: auto;
}

.app-subtitle {
  font-size: $text-lg;
  font-weight: $weight-medium;
  color: #ffffff;
  white-space: nowrap;
  border-left: 1px solid $border-default;
  padding-left: $space-3;

  @media (max-width: 768px) {
    display: none;
  }
}

.app-version {
  font-size: $text-sm;
  color: #ffffff;
  font-weight: $weight-normal;
}

:deep(.el-button) {
  color: $text-primary;
  transition: color $transition-base, background $transition-base;

  &:hover {
    color: $accent-primary;
    background: $bg-hover;
  }
}

:deep(.el-divider--vertical) {
  margin: 0 $space-2;
  background-color: $border-default;
  height: 24px;
}

.locale-select {
  width: 160px;

  :deep(.el-input__wrapper) {
    background-color: $bg-input;
    border-color: $border-default;
  }

  :deep(.el-input__inner) {
    color: $text-primary;
    font-size: $text-sm;
  }
}
</style>
