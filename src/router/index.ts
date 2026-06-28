import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: '登录',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    redirect: '/dashboards',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboards',
        name: '仪表板列表',
        component: () => import('@/views/dashboard/DashboardList.vue'),
        meta: { title: '仪表板', icon: 'Monitor' },
      },
      {
        path: 'dashboard/:id',
        name: '仪表板视图',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        props: true,
        meta: { title: '仪表板', icon: 'DataAnalysis' },
      },
      {
        path: 'system/users',
        name: '用户管理',
        component: () => import('@/views/system/UserManagement.vue'),
        meta: { title: '用户管理', icon: 'User', permission: 'system.users' },
      },
      {
        path: 'system/roles',
        name: '角色管理',
        component: () => import('@/views/system/RoleManagement.vue'),
        meta: { title: '角色管理', icon: 'Setting', permission: 'system.roles' },
      },
      {
        path: 'system/charts',
        name: '图表管理',
        component: () => import('@/views/system/ChartManagement.vue'),
        meta: { title: '图表管理', icon: 'TrendCharts', permission: 'system.charts' },
      },
      {
        path: 'system/dashboards',
        name: '仪表板管理',
        component: () => import('@/views/system/DashboardManagement.vue'),
        meta: { title: '仪表板管理', icon: 'Grid', permission: 'system.dashboards' },
      },
      {
        path: 'system/filters',
        name: '过滤器管理',
        component: () => import('@/views/system/FilterManagement.vue'),
        meta: { title: '过滤器管理', icon: 'Filter', permission: 'system.filters' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  if (!to.meta.requiresAuth) {
    return next()
  }

  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) {
    return next({ name: '登录', query: { redirect: to.fullPath } })
  }

  // Dynamically import to avoid circular dependency
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  if (!authStore.currentUser) {
    try {
      await authStore.fetchCurrentUser()
    } catch {
      authStore.logout()
      return next({ name: '登录', query: { redirect: to.fullPath } })
    }
  }

  const permission = to.meta.permission as string | undefined
  if (permission && !authStore.hasPermission(permission)) {
    const { ElMessage } = await import('element-plus')
    ElMessage.warning('权限不足，无法访问该模块')
    return next({ name: '仪表板列表' })
  }

  next()
})

export default router
