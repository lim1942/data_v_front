import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const currentDashboardId = ref<number | null>(null)
  const globalFilterValues = reactive<Record<string, unknown>>({})
  const refreshCounter = ref(0)

  function setDashboard(id: number) {
    currentDashboardId.value = id
  }

  function setFilters(filters: Record<string, unknown>) {
    Object.keys(globalFilterValues).forEach((k) => delete globalFilterValues[k])
    Object.assign(globalFilterValues, filters)
  }

  function triggerRefresh() {
    refreshCounter.value++
  }

  return { currentDashboardId, globalFilterValues, refreshCounter, setDashboard, setFilters, triggerRefresh }
})
