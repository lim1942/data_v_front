<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, provide, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCharts, createChart, updateChart, deleteChart } from '@/api/charts'
import type { ChartDefinition } from '@/types/chart'
import { useDynamicVueComponent } from '@/composables/useChart'
import { useThemeStore } from '@/stores/theme'
import { ROW_HEIGHT_PX, GRID_COLS } from '@/config/grid'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const charts = ref<ChartDefinition[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogLoading = ref(false)

// Preview state
const themeStore = useThemeStore()
const previewCode = ref('')
const previewKey = ref(0)
provide('chartId', 0)
provide('themeMode', computed(() => themeStore.mode))

// Preview size controls
// Measure the real dashboard content-area width and divide by GRID_COLS
// so that 1 column in the preview matches 1 column on the dashboard visually.
const pageRef = ref<HTMLElement | null>(null)
const contentWidth = ref(window.innerWidth)
let _resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const contentArea = pageRef.value?.closest('.content-area') as HTMLElement | null
  if (contentArea) {
    _resizeObserver = new ResizeObserver((entries) => {
      contentWidth.value = entries[0].contentRect.width
    })
    _resizeObserver.observe(contentArea)
    contentWidth.value = contentArea.clientWidth
  }
})

onUnmounted(() => {
  _resizeObserver?.disconnect()
  _resizeObserver = null
})

const colWidth = computed(() => (contentWidth.value - 8) / GRID_COLS) // subtract content-area padding (4px×2)

const previewW = ref(8)
const previewH = ref(8)
const previewGridStyle = computed(() => ({
  width: `${previewW.value * colWidth.value}px`,
  height: `${previewH.value * ROW_HEIGHT_PX}px`,
}))

function handlePreview() {
  previewCode.value = form.component_code
  previewKey.value++
}

const templateHint = `/**
 * 可用全局变量（已注入沙箱）:
 *   vue         - Vue 所有 API (ref, computed, watch, onMounted, onUnmounted, inject, h, nextTick...)
 *   axios       - 已配置认证拦截器的 axios 实例 (baseURL: /api/v1)
 *   echarts     - ECharts 库
 *   getEChartsTheme()    - 返回当前主题名 ('custom-dark' 或 'custom-light')
 *   themeColors()        - 返回主题感知颜色 token 对象 ($.cardBg, $.titleColor, $.legendColor ...)
 *   useChartLifecycle()  - 返回 { chartRef, renderChart }，自动管理 ECharts 生命周期
 *   cardStyle($, extra?) - 返回卡片 CSS 样式字符串
 *   chartAreaStyle()     - 返回图表区域 CSS 样式字符串
 *   utils       - { mergeOptions, colors }
 */

const { onMounted, h } = vue

const DATA = [
  { name: '证件问题', value: 31.9 },
  { name: '评分过低', value: 18.9 },
  { name: '人脸不匹配', value: 17.6 },
  { name: '逾期记录', value: 15.7 },
  { name: '征信不良', value: 9.8 },
  { name: '其他', value: 6.1 }
]

return {
  setup() {
    const $ = themeColors()
    const { chartRef, renderChart } = useChartLifecycle()

    onMounted(() => {
      renderChart({
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { orient: 'vertical', right: 8, top: 20, textStyle: { fontSize: 11, color: $.legendColor } },
        series: [{
          type: 'pie',
          radius: ['38%', '68%'],
          center: ['36%', '53%'],
          avoidLabelOverlap: true,
          label: { formatter: '{d}%' },
          data: DATA,
          color: ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E8684A', '#6DC8EC']
        }]
      })
    })

    return () => h('div', { style: cardStyle($) }, [
      h('div', { style: \`font-size:14px;font-weight:700;color:\${$.titleColor};margin:2px 0 4px 4px;\` }, 'KYC失败原因分布（近30日）'),
      h('div', { ref: chartRef, style: chartAreaStyle() })
    ])
  }
}`

const COMPONENT_TYPE_OPTIONS = [
  { value: 'dynamic', label: 'Dynamic - 自定义代码' },
  { value: 'template1', label: 'Template 1' },
  { value: 'template2', label: 'Template 2' },
]

const form = reactive({
  id: 0,
  title: '',
  component_type: 'dynamic' as string,
  component_code: '',
})

// Dynamic component compilation (must be after form so componentType can reference form.component_type)
const componentType = computed(() => form.component_type || 'dynamic')
provide('componentType', componentType)
const { component: DynamicComp, error: compileError } = useDynamicVueComponent(previewCode, form.component_type)

async function fetchCharts() {
  loading.value = true
  try {
    const res = await getCharts({ page: page.value, size: pageSize.value, search: search.value })
    charts.value = res.items
    total.value = res.total
  } finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  Object.assign(form, {
    id: 0, title: '', component_type: 'dynamic', component_code: '',
  })
  previewCode.value = ''
  previewKey.value++
  dialogVisible.value = true
}

async function openEdit(chart: ChartDefinition) {
  isEdit.value = true
  Object.assign(form, {
    id: chart.id,
    title: chart.title,
    component_type: chart.component_type || 'dynamic',
    component_code: chart.component_code || '',
  })
  dialogVisible.value = true
  await nextTick()
  previewCode.value = form.component_code
  previewKey.value++
}

async function handleSave() {
  dialogLoading.value = true
  try {
    const data = {
      title: form.title,
      component_type: form.component_type,
      component_code: form.component_code,
    }
    if (isEdit.value) {
      await updateChart(form.id, data)
      ElMessage.success('图表更新成功')
    } else {
      await createChart(data)
      ElMessage.success('图表创建成功')
    }
    dialogVisible.value = false
    await fetchCharts()
  } catch {
    ElMessage.error('保存失败，请检查组件代码格式')
  } finally { dialogLoading.value = false }
}

async function handleDelete(chart: ChartDefinition) {
  await ElMessageBox.confirm(`确定要删除图表"${chart.title}"吗？`, '确认操作', { type: 'warning' })
  await deleteChart(chart.id)
  ElMessage.success('图表已删除')
  await fetchCharts()
}

onMounted(() => {
  fetchCharts()
})
</script>

<template>
  <div ref="pageRef" class="page">
    <div class="page-header">
      <el-button v-permission:rw="'system.charts'" type="primary" @click="openCreate">添加图表</el-button>
    </div>

    <div class="page-toolbar">
      <el-input v-model="search" placeholder="搜索图表..." style="width: 240px" clearable @change="fetchCharts" />
    </div>

    <el-table :data="charts" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" width="180" />
      <el-table-column label="组件代码" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.component_code" style="font-size: 12px; color: var(--color-text-muted);">
            {{ row.component_code.length }} 字符
          </span>
          <span v-else style="color: var(--color-text-muted); font-size: 12px;">未配置</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="130">
        <template #default="{ row }">
          <el-tag :type="row.component_type === 'dynamic' ? 'success' : row.component_type === 'template1' ? 'warning' : 'info'" size="small">
            {{ row.component_type}}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-permission:rw="'system.charts'" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission:rw="'system.charts'" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" class="pagination" @change="fetchCharts"
    />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑图表' : '创建图表'" width="100vw" top="0vh" :close-on-press-escape="false">
      <div class="editor-layout">
        <div class="editor-left">
          <el-form :model="form" label-position="top" class="editor-form">
            <el-form-item label="标题" required>
              <el-input v-model="form.title" />
            </el-form-item>

            <el-form-item label="组件类型" required>
              <el-select v-model="form.component_type" style="width: 100%">
                <el-option v-for="opt in COMPONENT_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="Vue 组件代码" required class="code-form-item">
              <el-input
                v-model="form.component_code" type="textarea" :rows="8"
                placeholder="const { ref, onMounted, h } = vue; return { setup() { ... return () => h(...) } }"
                class="code-editor"
              />
              <details class="form-hint-detail">
                <summary>查看代码模板</summary>
                <pre class="code-template">{{ templateHint }}</pre>
              </details>
            </el-form-item>
          </el-form>
          <div class="editor-left-footer">
            <el-button @click="dialogVisible = false" size="small">取消</el-button>
            <el-button size="small" type="primary" :loading="dialogLoading" @click="handleSave">保存</el-button>
          </div>
        </div>
        <div class="editor-right">
          <div class="preview-canvas">
            <div class="preview-wrapper" :style="previewGridStyle">
              <component
                v-if="DynamicComp"
                :is="DynamicComp"
                :key="`preview-${themeStore.mode}-${previewKey}`"
              />
              <div v-else-if="compileError" class="preview-state error">
                <span>编译错误: {{ compileError.message }}</span>
              </div>
              <div v-else-if="!form.component_code" class="preview-state">
                <span>请在左侧输入组件代码，然后点击"预览"查看效果</span>
              </div>
              <div v-else class="preview-state">
                <span>点击"预览"查看图表效果</span>
              </div>
            </div>
          </div>
          <div class="preview-toolbar">
            <span class="preview-toolbar__label">宽</span>
            <el-input-number v-model="previewW" :min="1" :max="24" size="small" controls-position="right" style="width: 80px" @change="handlePreview" />
            <span class="preview-toolbar__label">高</span>
            <el-input-number v-model="previewH" :min="1" :max="24" size="small" controls-position="right" style="width: 80px" @change="handlePreview" />
            <span class="preview-toolbar__unit">(列 × 行)</span>
            <el-button type="warning" size="small" @click="handlePreview" style="margin-left: auto;">预览</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page { max-width: 1200px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.page-toolbar { margin-bottom: 16px; }
.pagination { margin-top: 16px; justify-content: flex-end; }

// Split editor layout — fill viewport without overflow
:deep(.el-dialog) {
  margin: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

:deep(.el-dialog__header) {
  flex-shrink: 0;
}

:deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 16px 20px;
}

.editor-layout {
  display: flex;
  height: 100%;
  gap: 0;
}

.editor-left {
  flex: 4;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 16px;

  .editor-form {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  // Make the code form item fill remaining space
  :deep(.code-form-item) {
    flex: 1;
    display: flex;
    flex-direction: column;

    .el-form-item__content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }

  // Make textarea wrapper + textarea fill available height
  :deep(.code-form-item .el-textarea) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.code-form-item .el-textarea__inner) {
    flex: 1;
    resize: none;
  }
}

.editor-left-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  margin-top: 12px;
  flex-shrink: 0;
}

.editor-right {
  flex: 6;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  padding-left: 16px;
}

.preview-canvas {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.preview-wrapper {
  position: relative;

  > * {
    width: 100%;
    height: 100%;
  }
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-light, rgba(128,128,128,0.15));
  margin-top: 8px;
  flex-shrink: 0;

  &__label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  &__unit {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-left: 4px;
  }
}

.preview-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 14px;

  &.error {
    color: var(--el-color-danger);
  }
}

.code-editor :deep(textarea) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.form-hint-detail {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;

  summary {
    cursor: pointer;
    user-select: none;
    &:hover { color: var(--color-accent); }
  }
}

.code-template {
  margin-top: 8px;
  padding: 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  color: var(--color-text-muted);
}

</style>
