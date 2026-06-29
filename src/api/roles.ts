import api from './index'
import type { Role } from '@/types/role'

export interface RoleUserItem {
  id: number
  username: string
  email: string | null
  is_active: boolean
}

export interface RoleDashboardItem {
  dashboard_id: number
  can_view: boolean
  can_edit: boolean
}

export function getRoles() {
  return api.get<Role[]>('/roles').then((r) => r.data)
}

export function createRole(data: Record<string, unknown>) {
  return api.post<Role>('/roles', data).then((r) => r.data)
}

export function updateRole(id: number, data: Record<string, unknown>) {
  return api.put<Role>(`/roles/${id}`, data).then((r) => r.data)
}

export function deleteRole(id: number) {
  return api.delete(`/roles/${id}`)
}

export function getRoleUsers(id: number) {
  return api.get<RoleUserItem[]>(`/roles/${id}/users`).then((r) => r.data)
}

export function assignRoleUsers(id: number, user_ids: number[]) {
  return api.put(`/roles/${id}/users`, { user_ids })
}

export function getRoleDashboards(id: number) {
  return api.get<RoleDashboardItem[]>(`/roles/${id}/dashboards`).then((r) => r.data)
}

export function assignRoleDashboards(
  id: number,
  dashboards: Array<{ dashboard_id: number; can_view: boolean; can_edit: boolean }>,
) {
  return api.put(`/roles/${id}/dashboards`, { dashboards })
}
