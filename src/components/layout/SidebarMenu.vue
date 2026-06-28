<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDashboards } from '@/api/dashboards'
import type { Dashboard } from '@/types/dashboard'
import { Monitor, Setting } from '@element-plus/icons-vue'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const dashboards = ref<Dashboard[]>([])

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/dashboard/')) return path
  return path
})

const showSystemMenu = computed(() =>
  authStore.hasPermission('system.users', 'rw') ||
  authStore.hasPermission('system.roles', 'rw') ||
  authStore.hasPermission('system.charts', 'rw') ||
  authStore.hasPermission('system.dashboards', 'rw')
)

function navigate(path: string) {
  router.push(path)
}

onMounted(async () => {
  try {
    dashboards.value = await getDashboards()
  } catch { /* ignore */ }
})
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-logo">
      <span class="logo-icon">◆</span>
      <span v-show="!collapsed" class="logo-text">DataBoard</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      background-color="transparent"
      :text-color="'var(--color-sidebar-text)'"
      :active-text-color="'var(--color-sidebar-text-active)'"
    >
      <el-sub-menu index="dashboards">
        <template #title>
          <el-icon><Monitor /></el-icon>
          <span>仪表板</span>
        </template>
        <el-menu-item
          v-for="d in dashboards"
          :key="d.id"
          :index="`/dashboard/${d.id}`"
          @click="navigate(`/dashboard/${d.id}`)"
        >
          {{ d.name }}
        </el-menu-item>
        <el-menu-item v-if="!dashboards.length" index="dashboards-empty" disabled>
          暂无仪表板
        </el-menu-item>
      </el-sub-menu>

      <el-sub-menu v-if="showSystemMenu" index="system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </template>
        <el-menu-item v-if="authStore.hasPermission('system.users', 'rw')" index="/system/users" @click="navigate('/system/users')">用户管理</el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('system.roles', 'rw')" index="/system/roles" @click="navigate('/system/roles')">角色管理</el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('system.charts', 'rw')" index="/system/charts" @click="navigate('/system/charts')">图表管理</el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('system.dashboards', 'rw')" index="/system/dashboards" @click="navigate('/system/dashboards')">仪表板管理</el-menu-item>
        <el-menu-item v-if="authStore.hasPermission('system.filters', 'rw')" index="/system/filters" @click="navigate('/system/filters')">过滤器管理</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: linear-gradient(180deg, var(--color-sidebar-gradient-start) 0%, var(--color-sidebar-gradient-end) 100%);
  border-right: 1px solid var(--color-sidebar-border);
  transition: width var(--transition-smooth);
  z-index: 100;
  overflow: hidden;

  &.collapsed {
    width: 0;
  }
}

.sidebar-logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;

  .logo-icon {
    font-size: 22px;
    color: var(--color-sidebar-text-active);
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-sidebar-logo);
    white-space: nowrap;
  }
}

:deep(.el-menu) {
  border-right: none !important;
  background: transparent !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  &:hover {
    background: var(--color-sidebar-hover) !important;
  }
}

:deep(.el-menu-item.is-active) {
  background: var(--color-sidebar-active-bg) !important;
  border-right: 2px solid var(--color-sidebar-active-border);
}
</style>
