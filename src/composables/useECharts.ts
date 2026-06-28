import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useThemeStore } from '@/stores/theme'

export function useECharts() {
  const containerRef = ref<HTMLElement | null>(null)
  const chartInstance = ref<echarts.ECharts | null>(null)
  const themeStore = useThemeStore()

  function initChart() {
    if (!containerRef.value) return
    chartInstance.value = echarts.init(
      containerRef.value,
      themeStore.mode === 'dark' ? 'custom-dark' : 'custom-light',
    )
  }

  function setOption(option: echarts.EChartsOption, notMerge = false) {
    chartInstance.value?.setOption(option, { notMerge })
  }

  function resize() {
    chartInstance.value?.resize()
  }

  function dispose() {
    chartInstance.value?.dispose()
    chartInstance.value = null
  }

  // Re-init on theme change
  watch(() => themeStore.mode, () => {
    if (chartInstance.value) {
      dispose()
      initChart()
    }
  })

  let resizeObserver: ResizeObserver | null = null
  let lastW = 0
  let lastH = 0

  onMounted(() => {
    initChart()
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      lastW = rect.width
      lastH = rect.height

      resizeObserver = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect
        if (!r || (r.width === lastW && r.height === lastH)) return
        lastW = r.width
        lastH = r.height
        resize()
      })
      resizeObserver.observe(containerRef.value)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    dispose()
  })

  return { containerRef, chartInstance, initChart, setOption, resize, dispose }
}
