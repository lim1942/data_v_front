import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, RoleBrief, UserPermissions } from '@/types/user'
import { login as loginApi, getCurrentUser } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('access_token') || '')
  const refreshToken = ref(localStorage.getItem('refresh_token') || '')
  const currentUser = ref<User | null>(null)

  const isLoggedIn = computed(() => !!accessToken.value)
  const userRoles = computed<RoleBrief[]>(() => currentUser.value?.roles || [])

  const permissions = computed<UserPermissions>(() => {
    return currentUser.value?.permissions || {}
  })

  function isAdmin(): boolean {
    return userRoles.value.some((r) => r.name === '管理员')
  }

  function hasPermission(path: string, requiredLevel: 'r' | 'rw' = 'r'): boolean {
    if (isAdmin()) return true

    const keys = path.split('.')
    let current: unknown = permissions.value
    for (const key of keys) {
      if (current == null || typeof current !== 'object') return false
      current = (current as Record<string, unknown>)[key]
    }

    if (current === undefined || current === null) return false
    if (typeof current === 'boolean') return current
    if (current === 'rw') return true
    if (current === 'r') return requiredLevel === 'r'

    return false
  }

  async function login(username: string, password: string) {
    const data = await loginApi({ username, password })
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    await fetchCurrentUser()
  }

  async function fetchCurrentUser() {
    currentUser.value = await getCurrentUser()
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    currentUser.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  return {
    accessToken,
    refreshToken,
    currentUser,
    isLoggedIn,
    userRoles,
    permissions,
    isAdmin,
    hasPermission,
    login,
    fetchCurrentUser,
    logout,
  }
})
