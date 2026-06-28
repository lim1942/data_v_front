<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, createUser, updateUser, deleteUser, getUserRoles, assignUserRoles } from '@/api/users'
import { getRoles } from '@/api/roles'
import type { User } from '@/types/user'
import type { Role } from '@/types/role'

const loading = ref(false)
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const search = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogLoading = ref(false)

const roleDialogVisible = ref(false)
const selectedRoles = ref<number[]>([])
const editingUserId = ref<number | null>(null)

const form = reactive({
  id: 0,
  username: '',
  password: '',
  email: '',
  is_active: true,
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers({ page: page.value, size: pageSize.value, search: search.value })
    users.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  roles.value = await getRoles()
}

function openCreate() {
  isEdit.value = false
  form.id = 0
  form.username = ''
  form.password = ''
  form.email = ''
  form.is_active = true
  dialogVisible.value = true
}

function openEdit(user: User) {
  isEdit.value = true
  form.id = user.id
  form.username = user.username
  form.password = ''
  form.email = user.email || ''
  form.is_active = user.is_active
  dialogVisible.value = true
}

async function handleSave() {
  dialogLoading.value = true
  try {
    const data = { ...form, password: form.password || undefined }
    if (isEdit.value) {
      if (!data.password) delete data.password
      await updateUser(form.id, data)
      ElMessage.success('用户更新成功')
    } else {
      await createUser(data)
      ElMessage.success('用户创建成功')
    }
    dialogVisible.value = false
    await fetchUsers()
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(user: User) {
  await ElMessageBox.confirm(`确定要删除用户"${user.username}"吗？`, '确认操作', { type: 'warning' })
  await deleteUser(user.id)
  ElMessage.success('用户已删除')
  await fetchUsers()
}

async function openRoleDialog(user: User) {
  editingUserId.value = user.id
  const currentRoles = await getUserRoles(user.id)
  selectedRoles.value = currentRoles.map((r: { id: number }) => r.id)
  roleDialogVisible.value = true
}

async function handleSaveRoles() {
  if (editingUserId.value) {
    await assignUserRoles(editingUserId.value, selectedRoles.value)
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
    await fetchUsers()
  }
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <el-button v-permission:rw="'system.users'" type="primary" @click="openCreate">添加用户</el-button>
    </div>

    <div class="page-toolbar">
      <el-input v-model="search" placeholder="搜索..." style="width: 240px" clearable @change="fetchUsers" />
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="角色">
        <template #default="{ row }">
          <el-tag v-for="role in row.roles" :key="role.id" size="small" style="margin-right: 4px">
            {{ role.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
            {{ row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button v-permission:rw="'system.users'" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-permission:rw="'system.users'" size="small" type="warning" @click="openRoleDialog(row)">分配角色</el-button>
          <el-button v-permission:rw="'system.users'" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      class="pagination"
      @change="fetchUsers"
    />

    <!-- 用户表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '创建用户'" width="480px">
      <el-form :model="form" label-position="top">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item :label="isEdit ? '密码（留空保持不变）' : '密码'" :required="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 角色分配对话框 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="420px">
      <el-checkbox-group v-model="selectedRoles">
        <div v-for="role in roles" :key="role.id" style="margin: 8px 0">
          <el-checkbox :value="role.id">{{ role.name }}</el-checkbox>
          <span style="color: var(--color-text-secondary); font-size: 13px; margin-left: 8px">
            {{ role.description }}
          </span>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page { max-width: 1200px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-toolbar { margin-bottom: 16px; }

.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
