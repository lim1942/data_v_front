<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCharts, createChart, updateChart, deleteChart } from '@/api/charts'
import type { ChartDefinition } from '@/types/chart'

const loading = ref(false)
const charts = ref<ChartDefinition[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogLoading = ref(false)

const templateHint = `/**
 * 完整的 Vue 3 Composition API 组件代码。
 *
 * 必须返回 { setup() { ... } } 对象，setup() 返回渲染函数。
 *
 * 可用全局变量（已注入沙箱）:
 *   vue      - Vue 所有 API (ref, computed, watch, onMounted, onUnmounted, inject, h, nextTick...)
 *   axios    - 已配置认证拦截器的 axios 实例 (baseURL: /api/v1)
 *   echarts  - ECharts 库
 *   getEChartsTheme() - 返回当前主题名 ('custom-dark' 或 'custom-light')
 *   utils    - { mergeOptions, colors }
 *
 * 依赖注入:
 *   inject('filters')  - 仪表板全局筛选器值 (reactive 对象)
 *   inject('chartId')  - 当前图表 ID
 *
 * 筛选器响应式: watch(() => filters.xxx, handler) 监听特定 key
 * 只有使用了该筛选器的图表才会响应变更，其他图表不受影响。
 */

const { ref, onMounted, onUnmounted, inject, watch, h } = vue

return {
  setup() {
    const filters = inject('filters', {})
    const chartRef = ref(null)
    let chartInstance = null

    // 硬编码示例数据（或通过 axios 获取）
    const data = [
      { name: 'A', value: 120 },
      { name: 'B', value: 200 },
      { name: 'C', value: 150 },
    ]

    function filterData() {
      // 示例：按 region 过滤
      const region = filters.region
      if (region && region !== 'all') {
        return data.filter(d => d.code === region)
      }
      return data
    }

    function render() {
      if (!chartRef.value) return
      if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value, getEChartsTheme())
      }
      const d = filterData()
      chartInstance.setOption({
        xAxis: { type: 'category', data: d.map(i => i.name) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: d.map(i => i.value) }],
      })
    }

    onMounted(() => render())
    onUnmounted(() => chartInstance?.dispose())

    // 只监听 region 筛选器
    watch(() => filters.region, () => render())

    return () => h('div', { ref: chartRef, style: 'width:100%;height:100%' })
  }
}`

const codeTemplateHint = `/**
 * 进阶示例：带 loading/error 状态、axios 取数
 */
const { ref, onMounted, onUnmounted, inject, watch, h, nextTick } = vue

return {
  setup() {
    const filters = inject('filters', {})
    const chartId = inject('chartId')
    const loading = ref(false)
    const error = ref(null)
    const data = ref([])
    const chartRef = ref(null)
    let chartInstance = null

    async function fetchData() {
      loading.value = true
      error.value = null
      try {
        // 从后端 API 获取数据
        // const res = await axios.get('/some-endpoint', {
        //   params: { region: filters.region, chart_id: chartId }
        // })
        // data.value = res.data

        // 硬编码演示数据:
        data.value = [
          { name: 'A', value: 120 }, { name: 'B', value: 200 },
        ]
      } catch (e) { error.value = e }
      finally { loading.value = false }
    }

    function render() {
      if (!chartRef.value || !data.value.length) return
      if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value, getEChartsTheme())
      }
      chartInstance.setOption({
        xAxis: { type: 'category', data: data.value.map(d => d.name) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: data.value.map(d => d.value) }],
      })
    }

    onMounted(async () => {
      await fetchData()
      await nextTick()
      render()
    })

    onUnmounted(() => chartInstance?.dispose())

    watch(() => filters.region, async () => {
      await fetchData()
      await nextTick()
      render()
    })

    return () => {
      if (loading.value) return h('div', { style: 'min-height:200px' })
      if (error.value) return h('div', { style: 'color:red' }, error.value.message)
      return h('div', { ref: chartRef, style: 'width:100%;height:100%' })
    }
  }
}`

const form = reactive({
  id: 0,
  title: '',
  component_code: '',
})

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
    id: 0, title: '', component_code: '',
  })
  dialogVisible.value = true
}

function openEdit(chart: ChartDefinition) {
  isEdit.value = true
  Object.assign(form, {
    id: chart.id,
    title: chart.title,
    component_code: chart.component_code || '',
  })
  dialogVisible.value = true
}

async function handleSave() {
  dialogLoading.value = true
  try {
    const data = {
      title: form.title,
      data_source: null,
      options_config: {},
      component_type: 'dynamic',
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
  <div class="page">
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
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.component_type === 'dynamic' ? 'success' : 'info'" size="small">
            {{ row.component_type === 'dynamic' ? '动态' : '传统' }}
          </el-tag>
        </template>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑图表' : '创建图表'" width="750px">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>

        <el-form-item label="Vue 组件代码" required>
          <el-input
            v-model="form.component_code" type="textarea" :rows="16"
            placeholder="const { ref, onMounted, h } = vue; return { setup() { ... return () => h(...) } }"
            class="code-editor"
          />
          <details class="form-hint-detail">
            <summary>查看代码模板 (基础示例)</summary>
            <pre class="code-template">{{ templateHint }}</pre>
          </details>
          <details class="form-hint-detail">
            <summary>查看代码模板 (进阶：axios + loading/error)</summary>
            <pre class="code-template">{{ codeTemplateHint }}</pre>
          </details>
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSave">保存</el-button>
      </template>
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

.code-editor :deep(textarea) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.form-hint-detail {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);

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
