<script setup lang="ts">
import { ElDialog, ElDivider } from 'element-plus'
import cyclonedxLogo from '@/assets/images/cyclonedx-logo.svg'

declare const __APP_VERSION__: string
const appVersion = __APP_VERSION__

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    width="480px"
    :append-to-body="true"
    :show-close="true"
    :close-on-click-modal="true"
    class="about-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <span class="about-dialog__header-title">About</span>
    </template>

    <div class="about-dialog__content">
      <!-- Logo and title -->
      <div class="about-dialog__hero">
        <img :src="cyclonedxLogo" alt="CycloneDX" class="about-dialog__logo" />
        <div class="about-dialog__title-group">
          <h2 class="about-dialog__title">BOM Studio</h2>
          <span class="about-dialog__version">v{{ appVersion }}</span>
        </div>
      </div>

      <ElDivider />

      <!-- Description -->
      <p class="about-dialog__description">
        A visual editor for creating, editing, and validating CycloneDX Software Bills of Materials (SBOMs). Supports CycloneDX specification versions 1.4 through 1.7.
      </p>

      <!-- Privacy notice -->
      <div class="about-dialog__privacy">
        <h3 class="about-dialog__section-heading">Privacy by Design</h3>
        <p class="about-dialog__privacy-text">
          BOM Studio runs entirely in your browser. No data is collected, transmitted, or stored on any server. All work is kept in your browser's session storage and is cleared when the tab closes. Files are opened from and saved to your local machine only.
        </p>
      </div>

      <ElDivider />

      <!-- Links -->
      <div class="about-dialog__links">
        <div class="about-dialog__link-row">
          <span class="about-dialog__link-label">Website</span>
          <a
            href="https://cyclonedx.studio"
            target="_blank"
            rel="noopener noreferrer"
            class="about-dialog__link"
          >cyclonedx.studio</a>
        </div>
        <div class="about-dialog__link-row">
          <span class="about-dialog__link-label">Source</span>
          <a
            href="https://github.com/CycloneDX/cyclonedx-bom-studio"
            target="_blank"
            rel="noopener noreferrer"
            class="about-dialog__link"
          >github.com/CycloneDX/cyclonedx-bom-studio</a>
        </div>
        <div class="about-dialog__link-row">
          <span class="about-dialog__link-label">License</span>
          <span class="about-dialog__link-value">Apache-2.0</span>
        </div>
      </div>

      <ElDivider />

      <!-- Footer -->
      <p class="about-dialog__footer-text">
        &copy; OWASP Foundation. All Rights Reserved.
      </p>
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins' as *;

.about-dialog {
  &__header-title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    color: $text-primary;
  }

  &__content {
    padding: 0 $space-2;
  }

  &__hero {
    display: flex;
    align-items: center;
    gap: $space-5;
    padding: $space-2 0 $space-3;
  }

  &__logo {
    height: 36px;
    width: auto;
    flex-shrink: 0;
  }

  &__title-group {
    display: flex;
    align-items: baseline;
    gap: $space-3;
  }

  &__title {
    font-size: $text-2xl;
    font-weight: $weight-bold;
    color: $text-primary;
    margin: 0;
  }

  &__version {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-tertiary;
    font-family: $font-mono;
  }

  &__description {
    font-size: $text-sm;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0 0 $space-4;
  }

  &__privacy {
    margin-bottom: $space-2;
  }

  &__section-heading {
    font-size: $text-sm;
    font-weight: $weight-semibold;
    color: $text-primary;
    margin: 0 0 $space-2;
  }

  &__privacy-text {
    font-size: $text-sm;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0;
  }

  &__links {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__link-row {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__link-label {
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: $text-tertiary;
    min-width: 64px;
    flex-shrink: 0;
  }

  &__link {
    font-size: $text-sm;
    color: $blue-400;
    text-decoration: none;
    transition: color $transition-base;

    &:hover {
      color: $blue-300;
      text-decoration: underline;
    }
  }

  &__link-value {
    font-size: $text-sm;
    color: $text-secondary;
  }

  &__footer-text {
    font-size: $text-xs;
    color: $text-tertiary;
    line-height: 1.5;
    margin: 0;
    text-align: center;
  }
}

:deep(.el-dialog) {
  border-radius: $radius-lg;
  background-color: $bg-surface;
  border: 1px solid $border-default;
}

:deep(.el-dialog__header) {
  padding: $space-4 $space-5;
  border-bottom: 1px solid $border-subtle;
  margin-right: 0;
}

:deep(.el-dialog__body) {
  padding: $space-4 $space-5 $space-5;
}

:deep(.el-divider) {
  margin: $space-4 0;
  border-top-color: $border-subtle;
}
</style>
