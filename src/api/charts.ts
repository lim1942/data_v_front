import api from './index'
import type { ChartDefinition } from '@/types/chart'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export function getCharts(params: Record<string, unknown>) {
  return api.get<PaginatedResponse<ChartDefinition>>('/charts', { params }).then((r) => r.data)
}

export function createChart(data: Record<string, unknown>) {
  return api.post<ChartDefinition>('/charts', data).then((r) => r.data)
}

export function updateChart(id: number, data: Record<string, unknown>) {
  return api.put<ChartDefinition>(`/charts/${id}`, data).then((r) => r.data)
}

export function getChart(id: number) {
  return api.get<ChartDefinition>(`/charts/${id}`).then((r) => r.data)
}

export function deleteChart(id: number) {
  return api.delete(`/charts/${id}`)
}
