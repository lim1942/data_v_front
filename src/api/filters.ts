import api from './index'
import type { FilterDefinition } from '@/types/filter'

export function getFilters(params: Record<string, unknown>) {
  return api.get<{ items: FilterDefinition[]; total: number }>('/filters', { params }).then(r => r.data)
}

export function getAllFilters() {
  return api.get<FilterDefinition[]>('/filters/options/all').then(r => r.data)
}

export function createFilter(data: Record<string, unknown>) {
  return api.post<FilterDefinition>('/filters', data).then(r => r.data)
}

export function updateFilter(id: number, data: Record<string, unknown>) {
  return api.put<FilterDefinition>(`/filters/${id}`, data).then(r => r.data)
}

export function deleteFilter(id: number) {
  return api.delete(`/filters/${id}`)
}
