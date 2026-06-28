import api from './index'
import type { Dashboard } from '@/types/dashboard'

export function getDashboards() {
  return api.get<Dashboard[]>('/dashboards').then((r) => r.data)
}

export function getDashboard(id: number) {
  return api.get<Dashboard>(`/dashboards/${id}`).then((r) => r.data)
}

export function createDashboard(data: Record<string, unknown>) {
  return api.post<Dashboard>('/dashboards', data).then((r) => r.data)
}

export function updateDashboard(id: number, data: Record<string, unknown>) {
  return api.put<Dashboard>(`/dashboards/${id}`, data).then((r) => r.data)
}

export function deleteDashboard(id: number) {
  return api.delete(`/dashboards/${id}`)
}
