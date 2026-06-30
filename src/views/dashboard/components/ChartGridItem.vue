<script setup lang="ts">
import { computed, provide } from 'vue'
import type { ChartDefinition } from '@/types/chart'
import { useDynamicVueComponent } from '@/composables/useChart'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  chartId: number
  chartDef: ChartDefinition | null
  refreshTrigger: number
}>()

const themeStore = useThemeStore()

// Provide chartId, theme mode and component type so dynamic components can inject them
provide('chartId', props.chartId)
provide('themeMode', computed(() => themeStore.mode))
const componentType = computed(() => props.chartDef?.component_type || 'dynamic')
provide('componentType', componentType)

// Compile stored component_code into a live Vue component
const code = computed(() => props.chartDef?.component_code || '')
const { component: DynamicComp, error: compileError } = useDynamicVueComponent(code, componentType)
</script>

<template>
  <div class="chart-card">
    <!-- <div class="chart-card-header">
      <span class="chart-card-title">{{ chartDef?.title || `图表 #${chartId}` }}</span>
    </div> -->
    <div class="chart-card-body">
      <component
        v-if="DynamicComp"
        :is="DynamicComp"
        :key="`${chartId}-${themeStore.mode}-${refreshTrigger}`"
      />
      <div v-else-if="compileError" class="chart-state">
        <span>图表编译错误: {{ compileError.message }}</span>
      </div>
      <div v-else-if="!chartDef" class="chart-state">
        <span>图表 #{{ chartId }} 未找到</span>
      </div>
      <div v-else class="chart-state">
        <span>图表"{{ chartDef.title }}"未配置组件代码</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  width: 100%;
  height: 100%;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
    border-color: var(--color-accent);
  }
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 6px;
  border-bottom: 1px solid var(--color-border-light, rgba(128, 128, 128, 0.15));
}

.chart-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.chart-card-body {
  flex: 1;
  padding: 0;
  min-height: 0;

  > * {
    width: 100%;
    height: 100%;
  }
}

.chart-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
