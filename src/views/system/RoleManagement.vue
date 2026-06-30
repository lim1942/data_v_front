<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleUsers,
  assignRoleUsers,
  getRoleDashboards,
  assignRoleDashboards,
} from '@/api/roles'
import { getUsers } from '@/api/users'
import { getDashboards } from '@/api/dashboards'
import type { Role } from '@/types/role'
import type { Dashboard } from '@/types/dashboard'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const roles = ref<Role[]>([])
const userOptions = ref<Array<{ id: number; username: string; email: string | null; is_active: boolean }>>([])
const dashboardOptions = ref<Dashboard[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogLoading = ref(false)
const relationLoading = ref(false)

const form = reactive({
  id: 0,
  name: '',
  description: '',
  permissions: {} as Record<string, unknown>,
  user_ids: [] as number[],
  dashboard_ids: [] as number[],
})

const roleDashboardCanEditMap = ref<Record<number, boolean>>({})

interface RolePermissionSystem {
  users?: 'r' | 'rw'
  roles?: 'r' | 'rw'
  dashboards?: 'r' | 'rw'
  charts?: 'r' | 'rw'
}

interface RolePermissions {
  system?: RolePermissionSystem
  dashboards?: {
    edit?: boolean
  }
}

interface PermissionTreeState {
  system: {
    users: boolean
    roles: boolean
    dashboards: boolean
    charts: boolean
  }
  dashboards: {
    edit: boolean
  }
}

const permissionTree = reactive<PermissionTreeState>({
  system: { users: false, roles: false, dashboards: false, charts: false },
  dashboards: { edit: false },
})

async function fetchRoles() {
  loading.value = true
  try {
    const [roleList, usersRes, dashboards] = await Promise.all([
      getRoles(),
      getUsers({ page: 1, size: 100 }),
      getDashboards(),
    ])
    roles.value = roleList
    userOptions.value = usersRes.items.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      is_active: u.is_active,
    }))
    dashboardOptions.value = dashboards
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  form.id = 0
  form.name = ''
  form.description = ''
  form.user_ids = []
  form.dashboard_ids = []
  roleDashboardCanEditMap.value = {}
  permissionTree.system = { users: false, roles: false, dashboards: false, charts: false }
  permissionTree.dashboards = { edit: false }
  dialogVisible.value = true
}

async function openEdit(role: Role) {
  isEdit.value = true
  form.id = role.id
  form.name = role.name
  form.description = role.description || ''

  const perms = (role.permissions || {}) as RolePermissions
  permissionTree.system = {
    users: perms?.system?.users === 'rw',
    roles: perms?.system?.roles === 'rw',
    dashboards: perms?.system?.dashboards === 'rw',
    charts: perms?.system?.charts === 'rw',
  }
  permissionTree.dashboards = { edit: perms?.dashboards?.edit || false }

  relationLoading.value = true
  try {
    const [roleUsers, roleDashboards] = await Promise.all([
      getRoleUsers(role.id),
      getRoleDashboards(role.id),
    ])
    form.user_ids = roleUsers.map((u) => u.id)
    form.dashboard_ids = roleDashboards.filter((d) => d.can_view).map((d) => d.dashboard_id)
    roleDashboardCanEditMap.value = roleDashboards.reduce<Record<number, boolean>>((acc, item) => {
      acc[item.dashboard_id] = item.can_edit
      return acc
    }, {})
  } finally {
    relationLoading.value = false
  }

  dialogVisible.value = true
}

function buildPermissions(): Record<string, unknown> {
  const sysPerms: Record<string, string> = {}
  for (const [key, val] of Object.entries(permissionTree.system)) {
    sysPerms[key] = val ? 'rw' : 'r'
  }
  return {
    system: sysPerms,
    dashboards: { edit: permissionTree.dashboards.edit },
  }
}

async function handleSave() {
  dialogLoading.value = true
  try {
    const data = {
      name: form.name,
      description: form.description,
      permissions: buildPermissions(),
    }
    let roleId = form.id

    if (isEdit.value) {
      await updateRole(roleId, data)
      ElMessage.success('角色更新成功')
    } else {
      const created = await createRole(data)
      roleId = created.id
      ElMessage.success('角色创建成功')
    }

    await Promise.all([
      assignRoleUsers(roleId, form.user_ids),
      assignRoleDashboards(
        roleId,
        form.dashboard_ids.map((dashboard_id) => ({
          dashboard_id,
          can_view: true,
          can_edit: roleDashboardCanEditMap.value[dashboard_id] || false,
        })),
      ),
    ])

    dialogVisible.value = false
    await fetchRoles()
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(role: Role) {
  await ElMessageBox.confirm(`确定要删除角色"${role.name}"吗？`, '确认操作', { type: 'warning' })
  await deleteRole(role.id)
  ElMessage.success('角色已删除')
  await fetchRoles()
}

onMounted(fetchRoles)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <el-button v-permission:rw="'system.roles'" type="primary" @click="openCreate">添加角色</el-button>
    </div>

    <el-table :data="roles" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.updated_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-permission:rw="'system.roles'" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission:rw="'system.roles'" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 角色表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '创建角色'" width="100vw" top="0vh" :close-on-press-escape="false">
      <div class="dialog-content">
        <el-form :model="form" label-position="top">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-divider>系统权限</el-divider>
          <div class="perm-grid">
            <div v-for="(_, key) in permissionTree.system" :key="key" class="perm-item">
              <span>{{ { users: '用户', roles: '角色', dashboards: '仪表板', charts: '图表' }[key] }}</span>
              <el-switch v-model="(permissionTree.system as Record<string, boolean>)[key]" />
            </div>
          </div>
          <el-divider>仪表板权限</el-divider>
          <div class="perm-item">
            <span>可编辑仪表板</span>
            <el-switch v-model="permissionTree.dashboards.edit" />
          </div>

          <el-divider>角色成员</el-divider>
          <el-form-item label="该角色包含的用户">
            <el-select v-model="form.user_ids" multiple filterable style="width: 100%" :loading="relationLoading">
              <el-option
                v-for="u in userOptions"
                :key="u.id"
                :value="u.id"
                :label="u.email ? `${u.username} (${u.email})` : u.username"
              />
            </el-select>
          </el-form-item>

          <el-divider>可见仪表板</el-divider>
          <el-form-item label="该角色可查看的仪表板">
            <el-select v-model="form.dashboard_ids" multiple filterable style="width: 100%" :loading="relationLoading">
              <el-option v-for="d in dashboardOptions" :key="d.id" :value="d.id" :label="d.name" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
// Fill viewport without overflow
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
  overflow-y: auto;
  padding: 20px 24px;
}

.dialog-content {
  max-width: 720px;
  margin: 0 auto;
}

.page { max-width: 1000px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.perm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.perm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);

  span {
    font-size: 14px;
    color: var(--color-text-primary);
  }
}
</style>
