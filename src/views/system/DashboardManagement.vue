<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDashboards, createDashboard, updateDashboard, deleteDashboard } from '@/api/dashboards'
import { getCharts } from '@/api/charts'
import { getAllFilters } from '@/api/filters'
import type { Dashboard, ChartLayoutItem } from '@/types/dashboard'
import type { ChartDefinition } from '@/types/chart'
import type { FilterDefinition } from '@/types/filter'
import { GRID_COLS, ROW_HEIGHT_PX, MIN_W, MIN_H } from '@/config/grid'
const EDITOR_ROW_HEIGHT_PX = Math.max(1, Math.floor(ROW_HEIGHT_PX / 2))
const ROW_HEIGHT_PX_STR = `${EDITOR_ROW_HEIGHT_PX}px`

const loading = ref(false)
const dashboards = ref<Dashboard[]>([])
const charts = ref<ChartDefinition[]>([])
const availableFilters = ref<FilterDefinition[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogLoading = ref(false)

const form = reactive({
  id: 0,
  name: '',
  description: '',
  layout_config: [] as ChartLayoutItem[],
  filter_ids: [] as number[],
  is_published: false,
})

const selectedChart = ref(0)
const chartW = ref(6)
const chartH = ref(1)

// --- resize / drag state ---
const gridRef = ref<HTMLElement | null>(null)
const resizingIdx = ref(-1)
const resizeStart = { x: 0, y: 0, w: 0, h: 0 }
const draggingIdx = ref(-1)
const dragOffset = { x: 0, y: 0 }

function getRowHeight(): number {
  if (!gridRef.value) return EDITOR_ROW_HEIGHT_PX
  const style = getComputedStyle(gridRef.value)
  const h = parseInt(style.gridAutoRows) || parseInt(style.gridTemplateRows)
  return h > 0 ? h : EDITOR_ROW_HEIGHT_PX
}

async function fetchAll() {
  loading.value = true
  try {
    dashboards.value = await getDashboards()
    const chartRes = await getCharts({ page: 1, size: 100 })
    charts.value = chartRes.items
    availableFilters.value = await getAllFilters()
  } finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  form.id = 0
  form.name = ''
  form.description = ''
  form.layout_config = []
  form.filter_ids = []
  form.is_published = false
  dialogVisible.value = true
}

function openEdit(d: Dashboard) {
  isEdit.value = true
  form.id = d.id
  form.name = d.name
  form.description = d.description || ''
  form.layout_config = d.layout_config || []
  form.filter_ids = d.filter_ids || []
  form.is_published = d.is_published
  dialogVisible.value = true
}

function getChartTitle(cid: number) {
  return charts.value.find((c) => c.id === cid)?.title || `#${cid}`
}

function findNextPosition(w: number, h: number): { x: number; y: number } {
  const occupied = new Set<string>()
  for (const item of form.layout_config) {
    for (let r = item.y; r < item.y + item.h; r++) {
      for (let c = item.x; c < item.x + item.w; c++) {
        occupied.add(`${c},${r}`)
      }
    }
  }
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      let fits = true
      for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
          if (occupied.has(`${c},${r}`)) { fits = false; break }
        }
        if (!fits) break
      }
      if (fits) return { x, y }
    }
  }
  return { x: 0, y: form.layout_config.length }
}

function addChart() {
  if (selectedChart.value) {
    const pos = findNextPosition(chartW.value, chartH.value)
    form.layout_config.push({
      chart_id: selectedChart.value,
      x: pos.x, y: pos.y, w: chartW.value, h: chartH.value,
    })
    selectedChart.value = 0
  }
}

function removeChart(idx: number) {
  form.layout_config.splice(idx, 1)
}

function gridStyle(item: ChartLayoutItem) {
  return {
    gridColumn: `${item.x + 1} / span ${item.w}`,
    gridRow: `${item.y + 1} / span ${item.h}`,
  }
}

function startResize(idx: number, e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  const item = form.layout_config[idx]
  resizingIdx.value = idx
  resizeStart.x = e.clientX
  resizeStart.y = e.clientY
  resizeStart.w = item.w
  resizeStart.h = item.h
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', stopResize)
}

function onResizeMove(e: MouseEvent) {
  if (resizingIdx.value < 0 || !gridRef.value) return
  const colW = gridRef.value.clientWidth / GRID_COLS
  const rowH = getRowHeight()
  const dx = e.clientX - resizeStart.x
  const dy = e.clientY - resizeStart.y
  const item = form.layout_config[resizingIdx.value]

  let newW = Math.max(MIN_W, Math.min(GRID_COLS - item.x, resizeStart.w + Math.round(dx / colW)))
  let newH = Math.max(MIN_H, Math.min(GRID_COLS, resizeStart.h + Math.round(dy / rowH)))

  // Shrink to avoid overlapping any other item
  while (newW > MIN_W && hasOverlap(resizingIdx.value, item.x, item.y, newW, newH)) {
    newW--
  }
  while (newH > MIN_H && hasOverlap(resizingIdx.value, item.x, item.y, newW, newH)) {
    newH--
  }

  item.w = newW
  item.h = newH
}

function stopResize() {
  resizingIdx.value = -1
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', stopResize)
}

// --- drag logic ---
function hasOverlap(skipIdx: number, x: number, y: number, w: number, h: number): boolean {
  for (let i = 0; i < form.layout_config.length; i++) {
    if (i === skipIdx) continue
    const item = form.layout_config[i]
    if (x < item.x + item.w && x + w > item.x && y < item.y + item.h && y + h > item.y) {
      return true
    }
  }
  return false
}

function startDrag(idx: number, e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('.layout-grid-item__handle')) return

  e.preventDefault()
  if (!gridRef.value) return

  const item = form.layout_config[idx]
  const gridRect = gridRef.value.getBoundingClientRect()
  const colW = gridRect.width / GRID_COLS
  const rowH = getRowHeight()

  draggingIdx.value = idx
  dragOffset.x = (e.clientX - gridRect.left) - item.x * colW
  dragOffset.y = (e.clientY - gridRect.top) - item.y * rowH

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDrag)
}

function onDragMove(e: MouseEvent) {
  if (draggingIdx.value < 0 || !gridRef.value) return

  const item = form.layout_config[draggingIdx.value]
  const gridRect = gridRef.value.getBoundingClientRect()
  const colW = gridRect.width / GRID_COLS
  const rowH = getRowHeight()

  const itemPxX = e.clientX - gridRect.left - dragOffset.x
  const itemPxY = e.clientY - gridRect.top - dragOffset.y

  const newX = Math.max(0, Math.min(GRID_COLS - item.w, Math.round(itemPxX / colW)))
  const newY = Math.max(0, Math.round(itemPxY / rowH))

  if (!hasOverlap(draggingIdx.value, newX, newY, item.w, item.h)) {
    item.x = newX
    item.y = newY
  }
}

function stopDrag() {
  draggingIdx.value = -1
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
})

async function handleSave() {
  dialogLoading.value = true
  try {
    const data = {
      name: form.name,
      description: form.description,
      layout_config: form.layout_config,
      filter_ids: form.filter_ids,
      is_published: form.is_published,
    }
    if (isEdit.value) {
      await updateDashboard(form.id, data)
      ElMessage.success('仪表板更新成功')
    } else {
      await createDashboard(data)
      ElMessage.success('仪表板创建成功')
    }
    dialogVisible.value = false
    await fetchAll()
  } finally { dialogLoading.value = false }
}

async function handleDelete(d: Dashboard) {
  await ElMessageBox.confirm(`确定要删除仪表板"${d.name}"吗？`, '确认操作', { type: 'warning' })
  await deleteDashboard(d.id)
  ElMessage.success('仪表板已删除')
  await fetchAll()
}

onMounted(fetchAll)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <el-button v-permission:rw="'system.dashboards'" type="primary" @click="openCreate">添加仪表板</el-button>
    </div>

    <el-table :data="dashboards" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" width="200" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="图表数" width="80">
        <template #default="{ row }">{{ row.layout_config?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_published ? 'success' : 'info'" size="small">
            {{ row.is_published ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-permission:rw="'system.dashboards'" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission:rw="'system.dashboards'" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑仪表板' : '创建仪表板'" width="780px">
      <el-form :model="form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="名称" required>
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发布">
              <el-switch v-model="form.is_published" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider>图表布局</el-divider>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
          <el-select v-model="selectedChart" placeholder="选择图表" style="flex: 1; min-width: 160px;" filterable>
            <el-option v-for="c in charts" :key="c.id" :label="c.title" :value="c.id" />
          </el-select>
          <el-input-number v-model="chartW" :min="MIN_W" :max="GRID_COLS" size="small" style="width: 100px" />
          <span style="font-size: 13px;">宽</span>
          <el-input-number v-model="chartH" :min="MIN_H" :max="GRID_COLS" size="small" style="width: 100px" />
          <span style="font-size: 13px;">高</span>
          <el-button type="primary" @click="addChart" :disabled="!selectedChart">添加</el-button>
        </div>
        <div v-if="form.layout_config.length" ref="gridRef" class="layout-grid">
          <div
            v-for="(item, idx) in form.layout_config"
            :key="idx"
            :style="gridStyle(item)"
            class="layout-grid-item"
            :class="{ 'layout-grid-item--resizing': resizingIdx === idx, 'layout-grid-item--dragging': draggingIdx === idx }"
            @mousedown="startDrag(idx, $event)"
          >
            <div class="layout-grid-item__header">
              <span class="layout-grid-item__title">{{ getChartTitle(item.chart_id) }}</span>
              <el-button size="small" type="danger" :icon="null" circle @click="removeChart(idx)">
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
              </el-button>
            </div>
            <div class="layout-grid-item__meta">{{ item.w }}×{{ item.h }}</div>
            <div class="layout-grid-item__handle" @mousedown="startResize(idx, $event)">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M8 2v6H2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            </div>
          </div>
        </div>
        <div v-else class="layout-empty">暂无图表，请从上方选择一个图表添加</div>

        <el-divider>全局过滤器</el-divider>
        <el-select v-model="form.filter_ids" multiple placeholder="选择过滤器" style="width: 100%">
          <el-option v-for="f in availableFilters" :key="f.id" :label="`${f.label} (${f.key})`" :value="f.id" />
        </el-select>
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

.layout-grid {
  display: grid;
  grid-template-columns: repeat(v-bind(GRID_COLS), 1fr);
  grid-auto-rows: v-bind(ROW_HEIGHT_PX_STR);
  gap: 4px;
  padding: 8px;
  background: var(--color-border-light);
  border-radius: var(--radius-sm);
  min-height: 120px;
  position: relative;
  user-select: none;
}

.layout-grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-accent-light);
  border-radius: 4px;
  overflow: hidden;
  min-height: 0;
  color: var(--color-text-primary);

  transition: box-shadow 0.15s, opacity 0.15s;

  &--resizing {
    z-index: 5 !important;
    opacity: 0.9;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    border-color: var(--color-accent);
    border-width: 2px;
  }

  &--dragging {
    z-index: 4;
    opacity: 0.85;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    cursor: grabbing;
  }

  &:not(&--dragging) {
    cursor: grab;
  }
}

.layout-grid-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.layout-grid-item__title {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.layout-grid-item__meta {
  font-size: 11px;
  color: var(--color-text-muted);
}

.layout-grid-item__handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: var(--color-accent-light);
  opacity: 0.7;
  transition: opacity 0.15s;

  &:hover { opacity: 1; }
}

.layout-empty {
  text-align: center;
  padding: 32px 24px;
  color: var(--color-text-muted);
  background: var(--color-border-light);
  border-radius: 4px;
  font-size: 13px;
}
</style>
