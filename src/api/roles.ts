import api from './index'
import type { Role } from '@/types/role'

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
