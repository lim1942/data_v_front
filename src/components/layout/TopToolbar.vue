<script setup lang="ts">
import { computed, inject, type Component, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { Fold, Sunny, Moon, SwitchButton, UserFilled } from '@element-plus/icons-vue'

defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const toolbarCenterComp = inject<Component | null>('toolbarCenterComp', null)
const dynamicTitle = inject<Ref<string>>('dynamicTitle', null)

interface BreadcrumbItem {
  title: string
  path?: string
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []
  const path = route.path

  if (path === '/dashboards') {
    items.push({ title: '仪表板' })
  } else if (path.startsWith('/dashboard/')) {
    items.push({ title: '仪表板', path: '/dashboards' })
    items.push({ title: dynamicTitle?.value || (route.meta.title as string) || '仪表板视图' })
  } else if (path.startsWith('/system/')) {
    items.push({ title: '系统管理' })
    const title = route.meta.title as string
    if (title) items.push({ title })
  }

  return items
})
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <el-button text @click="$emit('toggle-sidebar')">
        <el-icon :size="20"><Fold /></el-icon>
      </el-button>
      <el-breadcrumb v-if="breadcrumbs.length" class="toolbar-breadcrumb" separator="/">
        <el-breadcrumb-item
          v-for="(item, idx) in breadcrumbs"
          :key="idx"
          :to="item.path ? { path: item.path } : undefined"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="toolbar-center">
      <component :is="toolbarCenterComp" v-if="toolbarCenterComp" />
    </div>
    <div class="toolbar-right">
      <el-button text :circle="true" @click="themeStore.toggleTheme()">
        <el-icon :size="18">
          <Sunny v-if="themeStore.mode === 'dark'" />
          <Moon v-else />
        </el-icon>
      </el-button>
      <el-dropdown trigger="click" @command="handleLogout">
        <span class="user-avatar">
          <el-avatar :size="32" :src="authStore.currentUser?.avatar || undefined">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <span class="username">{{ authStore.currentUser?.username || '用户' }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.toolbar {
  position: sticky;
  top: 0;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: var(--color-bg-toolbar);
  backdrop-filter: var(--backdrop-blur);
  border-bottom: 1px solid var(--color-border);
  z-index: 90;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.toolbar-breadcrumb {
  :deep(.el-breadcrumb__inner) {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);

    &.is-link {
      color: var(--color-text-secondary);
      font-weight: 400;

      &:hover {
        color: var(--color-accent);
      }
    }
  }

  :deep(.el-breadcrumb__separator) {
    color: var(--color-text-muted);
    font-weight: 400;
  }
}

.toolbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 24px;
  min-width: 0;
  overflow: hidden;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-border-light);
  }

  .username {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: 500;
  }
}
</style>
