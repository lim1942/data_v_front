<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFilters, createFilter, updateFilter, deleteFilter } from '@/api/filters'
import type { FilterDefinition } from '@/types/filter'

const loading = ref(false)
const filters = ref<FilterDefinition[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogLoading = ref(false)

const form = reactive({
  id: 0,
  key: '',
  label: '',
  type: 'select' as string,
  default_value: '',
  options: '[]',
})

const showOptions = computed(() => form.type === 'select')

async function fetchFilters() {
  loading.value = true
  try {
    const res = await getFilters({ page: page.value, size: pageSize.value, search: search.value })
    filters.value = res.items
    total.value = res.total
  } finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  Object.assign(form, { id: 0, key: '', label: '', type: 'select', default_value: '', options: '[]' })
  dialogVisible.value = true
}

function openEdit(f: FilterDefinition) {
  isEdit.value = true
  Object.assign(form, {
    id: f.id,
    key: f.key,
    label: f.label,
    type: f.type,
    default_value: f.default_value != null ? String(f.default_value) : '',
    options: JSON.stringify(f.options || [], null, 2),
  })
  dialogVisible.value = true
}

async function handleSave() {
  dialogLoading.value = true
  try {
    const type = form.type
    const options = type === 'select' ? JSON.parse(form.options) : null
    const data = {
      key: form.key,
      label: form.label,
      type,
      default_value: form.default_value || (type === 'input' ? '' : null),
      options,
    }
    if (isEdit.value) {
      await updateFilter(form.id, data)
      ElMessage.success('过滤器更新成功')
    } else {
      await createFilter(data)
      ElMessage.success('过滤器创建成功')
    }
    dialogVisible.value = false
    await fetchFilters()
  } catch {
    ElMessage.error('JSON 格式不正确')
  } finally { dialogLoading.value = false }
}

async function handleDelete(f: FilterDefinition) {
  await ElMessageBox.confirm(`确定要删除过滤器"${f.label}"吗？`, '确认操作', { type: 'warning' })
  await deleteFilter(f.id)
  ElMessage.success('过滤器已删除')
  await fetchFilters()
}

onMounted(fetchFilters)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <el-button v-permission:rw="'system.filters'" type="primary" @click="openCreate">添加过滤器</el-button>
    </div>

    <div class="page-toolbar">
      <el-input v-model="search" placeholder="搜索过滤器..." style="width: 240px" clearable @change="fetchFilters" />
    </div>

    <el-table :data="filters" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="key" label="标识" width="140" />
      <el-table-column prop="label" label="名称" width="140" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ { date_range: '日期范围', date: '单日期', select: '下拉框', input: '文本框' }[row.type] || row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="default_value" label="默认值" width="120" />
      <el-table-column label="选项数" width="80">
        <template #default="{ row }">{{ row.options?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-permission:rw="'system.filters'" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission:rw="'system.filters'" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" class="pagination" @change="fetchFilters"
    />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑过滤器' : '创建过滤器'" width="520px">
      <el-form :model="form" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标识 (key)" required>
              <el-input v-model="form.key" placeholder="如: date_range" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称 (label)" required>
              <el-input v-model="form.label" placeholder="如: 日期范围" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型" required>
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="下拉框" value="select" />
                <el-option label="日期范围" value="date_range" />
                <el-option label="单日期" value="date" />
                <el-option label="文本框" value="input" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认值">
              <el-input v-model="form.default_value" placeholder="默认值" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="showOptions" label="选项列表 (JSON)">
          <el-input v-model="form.options" type="textarea" :rows="4" placeholder='[{"label":"全部","value":"all"},{"label":"华东","value":"east"}]' />
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
</style>
