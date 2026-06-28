import api from './index'
import type { User } from '@/types/user'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export function getUsers(params: Record<string, unknown>) {
  return api.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data)
}

export function createUser(data: Record<string, unknown>) {
  return api.post<User>('/users', data).then((r) => r.data)
}

export function updateUser(id: number, data: Record<string, unknown>) {
  return api.put<User>(`/users/${id}`, data).then((r) => r.data)
}

export function deleteUser(id: number) {
  return api.delete(`/users/${id}`)
}

export function getUserRoles(id: number) {
  return api.get<{ id: number; name: string }[]>(`/users/${id}/roles`).then((r) => r.data)
}

export function assignUserRoles(id: number, role_ids: number[]) {
  return api.put(`/users/${id}/roles`, { role_ids })
}
