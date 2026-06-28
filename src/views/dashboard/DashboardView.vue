<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject, h, defineComponent, resolveComponent, provide, type Component, type Ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { getDashboard } from '@/api/dashboards'
import { getChartsByIds } from '@/api/charts'
import type { Dashboard, ChartLayoutItem } from '@/types/dashboard'
import type { ChartDefinition } from '@/types/chart'
import GlobalFilters from '@/components/layout/GlobalFilters.vue'
import ChartGridItem from './components/ChartGridItem.vue'
import { GRID_COLS, ROW_HEIGHT_PX } from '@/config/grid'
const ROW_HEIGHT_PX_STR = `${ROW_HEIGHT_PX}px`

const route = useRoute()
const dashboardId = computed(() => Number(route.params.id as string))

const dashboard = ref<Dashboard | null>(null)
const charts = ref<Map<number, ChartDefinition>>(new Map())
const loading = ref(false)
const refreshKey = ref(0)

const filterValues = reactive<Record<string, unknown>>({})

// Provide filters via dependency injection so chart components can inject them
provide('filters', filterValues)
provide('refreshKey', refreshKey)

// Toolbar content via provide/inject
const toolbarCenterComp = inject<{ value: Component | null }>('toolbarCenterComp')!
const dynamicTitle = inject<Ref<string>>('dynamicTitle')!

const ToolbarContent = defineComponent({
  name: 'DashboardToolbarContent',
  setup() {
    return () => {
      const children: any[] = []
      if (dashboard.value?.global_filters?.length) {
        children.push(h(GlobalFilters, {
          filters: dashboard.value.global_filters,
          modelValue: { ...filterValues },
          'onUpdate:modelValue': (v: Record<string, unknown>) => {
            Object.keys(filterValues).forEach(k => delete filterValues[k])
            Object.assign(filterValues, v)
          }
        }))
      }
      children.push(h(resolveComponent('el-button'), { icon: Refresh as any, circle: true, onClick: emitRefresh }))
      return children
    }
  }
})

onMounted(() => {
  toolbarCenterComp.value = ToolbarContent
})

onUnmounted(() => {
  toolbarCenterComp.value = null
  dynamicTitle.value = ''
})

watch(dashboardId, () => {
  loadDashboard()
}, { immediate: true })

async function loadDashboard() {
  loading.value = true
  charts.value = new Map()
  try {
    const id = dashboardId.value
    if (!id) return
    dashboard.value = await getDashboard(id)
    dynamicTitle.value = dashboard.value.name
    // Clear old filter values and set defaults
    for (const k of Object.keys(filterValues)) {
      delete filterValues[k]
    }
    for (const f of dashboard.value.global_filters) {
      filterValues[f.key] = f.default_value
    }
    // Load chart definitions in one batch request
    const chartIds = dashboard.value.layout_config.map((l: ChartLayoutItem) => l.chart_id)
    const uniqueIds = [...new Set(chartIds)]
    if (uniqueIds.length) {
      try {
        const chartList = await getChartsByIds(uniqueIds)
        for (const chart of chartList) {
          charts.value.set(chart.id, chart)
        }
      } catch { /* silently ignore */ }
    }
  } catch {
    dashboard.value = null
  } finally { loading.value = false }
}


function gridStyle(item: ChartLayoutItem) {
  return {
    gridColumn: `${item.x + 1} / span ${item.w}`,
    gridRow: `${item.y + 1} / span ${item.h}`,
  }
}

function emitRefresh() {
  refreshKey.value++
}
</script>

<template>
  <div class="dashboard-page">
    <div v-loading="loading" class="chart-grid">
      <div
        v-for="item in dashboard?.layout_config || []"
        :key="`${item.chart_id}-${refreshKey}`"
        :style="gridStyle(item)"
        class="grid-item"
      >
        <ChartGridItem
          :chart-id="item.chart_id"
          :chart-def="charts.get(item.chart_id) || null"
          :refresh-trigger="refreshKey"
        />
      </div>

      <div v-if="!loading && (!dashboard?.layout_config?.length)" class="empty-state">
        <el-empty description="此仪表板为空">
          <el-button type="primary" @click="$router.push('/system/dashboards')">编辑仪表板</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  max-width: 100%;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(v-bind(GRID_COLS), 1fr);
  grid-auto-rows: v-bind(ROW_HEIGHT_PX_STR);
  gap: 3px;
  min-height: 200px;
}

.grid-item {
  min-height: 0;
  height: 100%;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 3px 0;
}
</style>
