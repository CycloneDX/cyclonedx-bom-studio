<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElIcon, ElDialog } from 'element-plus'
import {
  Check,
  Close,
} from '@element-plus/icons-vue'
import { useBomStore } from '@/stores/bomStore'
import { useValidationStore } from '@/stores/validationStore'
import InfoTip from '@/components/shared/InfoTip.vue'

const bomStore = useBomStore()
const validationStore = useValidationStore()

const hasErrors = computed(() => validationStore.errorCount > 0)
const hasWarnings = computed(() => validationStore.warningCount > 0)
const isValid = computed(() => validationStore.isValid)
const completenessScore = computed(() => validationStore.completenessScore)
const completenessStatus = computed(() => validationStore.completenessStatus)
const isModified = computed(() => bomStore.isModified)

const showErrorsModal = ref(false)

const completenessColor = computed(() => {
  if (completenessStatus.value === 'green') return '#22c55e'
  if (completenessStatus.value === 'amber') return '#f59e0b'
  return '#ef4444'
})

const validationStatusText = computed(() => {
  if (isValid.value) {
    return 'Valid'
  }
  if (hasErrors.value) {
    return `${validationStore.errorCount} Error${validationStore.errorCount !== 1 ? 's' : ''}`
  }
  return 'Warnings'
})

const statusIndicatorClass = computed(() => {
  if (isValid.value) return 'status-valid'
  if (hasErrors.value) return 'status-error'
  return 'status-warning'
})

const handleStatusClick = () => {
  if (!isValid.value) {
    showErrorsModal.value = true
  }
}
</script>

<template>
  <footer class="statusbar">
    <!-- Left: Validation status -->
    <div class="status-section status-left">
      <div
        class="status-item"
        :class="[statusIndicatorClass, { 'status-item--clickable': !isValid }]"
        @click="handleStatusClick"
      >
        <el-icon class="status-icon">
          <Check v-if="isValid" />
          <Close v-else />
        </el-icon>
        <span class="status-text">{{ validationStatusText }}</span>
      </div>
    </div>

    <!-- Center: Completeness -->
    <div class="status-section status-center">
      <div class="completeness-item">
        <span class="completeness-label">
          Completeness
          <InfoTip content="Scored across 12 equally weighted checks: supplier identified, all components named, all components versioned, component identity (CPE/PURL/SWID), dependencies documented, BOM authorship, timestamp, lifecycles, tools, component hashes, licences, and completeness assertions" />
        </span>
        <div class="completeness-bar">
          <div
            class="completeness-fill"
            :style="{ width: `${completenessScore}%`, backgroundColor: completenessColor }"
          />
        </div>
        <span class="completeness-text">{{ Math.round(completenessScore) }}%</span>
      </div>
    </div>

    <!-- Right: Modified/Saved + Version -->
    <div class="status-section status-right">
      <div class="status-item">
        <span
          class="status-badge"
          :class="{ modified: isModified, saved: !isModified }"
        >
          {{ isModified ? 'Modified' : 'Saved' }}
        </span>
      </div>
      <div class="status-item">
        <span class="version-text">CycloneDX {{ bomStore.bom.specVersion }}</span>
      </div>
    </div>
  </footer>

  <!-- Validation Errors Modal -->
  <ElDialog
    v-model="showErrorsModal"
    title="Validation Issues"
    width="640px"
    class="validation-errors-dialog"
    :close-on-click-modal="true"
  >
    <div class="validation-errors">
      <p class="validation-errors__summary">
        Found <strong>{{ validationStore.errorCount }}</strong> issue{{ validationStore.errorCount !== 1 ? 's' : '' }}
        based on the CycloneDX {{ bomStore.bom.specVersion }} schema.
      </p>
      <ul class="validation-errors__list">
        <li
          v-for="(error, index) in validationStore.errors"
          :key="index"
          class="validation-errors__item"
        >
          <el-icon class="validation-errors__icon"><Close /></el-icon>
          <span class="validation-errors__message">{{ error.message }}</span>
        </li>
      </ul>
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/tokens' as *;
@use '@/assets/styles/mixins' as *;

.statusbar {
  height: $statusbar-height;
  background: $bg-sidebar;
  border-top: 1px solid $border-default;
  @include flex-row($gap: $space-4);
  align-items: center;
  padding: 0 $space-4;
  font-size: $text-xs;
  z-index: $z-sticky;
}

.status-section {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.status-left {
  flex: 0 0 auto;
}

.status-center {
  flex: 1;
  justify-content: center;
}

.status-right {
  flex: 0 0 auto;
}

.status-item {
  @include flex-row($gap: $space-2);
  align-items: center;
  white-space: nowrap;

  &--clickable {
    cursor: pointer;
    padding: 2px $space-2;
    border-radius: $radius-sm;
    transition: background-color $transition-base;

    &:hover {
      background-color: rgba($red-500, 0.1);
    }
  }
}

.status-icon {
  font-size: $text-sm;
  flex: 0 0 auto;
}

.status-text {
  color: $text-secondary;
  font-size: $text-xs;
  font-weight: $weight-medium;
}

.status-valid {
  .status-icon {
    color: $green-500;
  }

  .status-text {
    color: $green-500;
  }
}

.status-error {
  .status-icon {
    color: $red-500;
  }

  .status-text {
    color: $red-500;
  }
}

.status-warning {
  .status-icon {
    color: $amber-500;
  }

  .status-text {
    color: $amber-500;
  }
}

.completeness-item {
  @include flex-row($gap: $space-2);
  align-items: center;
  width: 200px;
}

.completeness-label {
  flex: 0 0 auto;
  color: $text-secondary;
  font-weight: $weight-medium;
}

.completeness-bar {
  flex: 1;
  height: 4px;
  background: $bg-elevated;
  border-radius: $radius-full;
  overflow: hidden;
}

.completeness-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width $transition-base;
}

.completeness-text {
  flex: 0 0 auto;
  color: $text-tertiary;
  font-weight: $weight-semibold;
  min-width: 40px;
  text-align: right;
}

.status-badge {
  padding: $space-1 $space-2;
  border-radius: $radius-md;
  font-size: $text-2xs;
  font-weight: $weight-semibold;
  display: inline-block;

  &.modified {
    background: rgba($amber-500, 0.15);
    color: $amber-500;
  }

  &.saved {
    background: rgba($green-500, 0.15);
    color: $green-500;
  }
}

.version-text {
  color: $text-tertiary;
  font-size: $text-2xs;
  font-weight: $weight-medium;
}

:deep(.el-icon) {
  vertical-align: middle;
}

// Validation errors modal content
.validation-errors {
  &__summary {
    font-size: $text-sm;
    color: $text-secondary;
    margin: 0 0 $space-4;

    strong {
      color: $red-500;
    }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    padding: $space-2 $space-3;
    background-color: rgba($red-500, 0.06);
    border-radius: $radius-sm;
    border-left: 3px solid $red-500;
  }

  &__icon {
    color: $red-500;
    flex-shrink: 0;
    margin-top: 2px;
    font-size: $text-sm;
  }

  &__message {
    font-size: $text-sm;
    color: $text-primary;
    line-height: 1.5;
    word-break: break-word;
  }
}

@media (max-width: 768px) {
  .completeness-item {
    width: auto;
  }

  .completeness-bar {
    display: none;
  }

  .status-center {
    flex: 0 0 auto;
  }
}
</style>
