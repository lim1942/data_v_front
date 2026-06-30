import { ref, shallowRef, watch, computed, type Component, type MaybeRef, unref , h, onMounted, onUnmounted} from 'vue'
import * as echarts from 'echarts'
import * as vue from 'vue'
import api from '@/api/index'
import { useThemeStore } from '@/stores/theme'

function getEChartsTheme(): string {
  const store = useThemeStore()
  return store.mode === 'dark' ? 'custom-dark' : 'custom-light'
}

function mergeOptions(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  return { ...base, ...override }
}

const DEFAULT_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666',
  '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
]

// Generic theme-aware color tokens for dynamic chart components
function themeColors() {
  const isDark = getEChartsTheme() === 'custom-dark'
  return {
    isDark,
    cardBg: isDark ? '#161f31' : '#fff',
    cardBorder: isDark ? '#2a3a56' : '#e9eef5',
    titleColor: isDark ? '#d8e2f1' : '#24344f',
    textColor: isDark ? '#a8b9d3' : '#60708b',
    valueColor: isDark ? '#edf3ff' : '#1e3352',
    subColor: isDark ? '#94a6c4' : '#7d8da6',
    mutedColor: isDark ? '#8ea2c3' : '#9aa7bd',
    axisColor: isDark ? '#9eb1cf' : '#6f7f99',
    splitColor: isDark ? '#2a3b58' : '#edf1f7',
    legendColor: isDark ? '#9eb1cf' : '#6f7f99',
    tableColor: isDark ? '#b2c2db' : '#4e5f7c',
    headColor: isDark ? '#8fa4c4' : '#8594ad',
    lineColor: isDark ? '#283750' : '#edf1f7',
    rowColor: isDark ? '#24344d' : '#f3f6fa',
    strongColor: isDark ? '#e6eefb' : '#24344f',
    bodyColor: isDark ? '#9eb1cf' : '#556987',
    rateColor: isDark ? '#b7c7df' : '#5d6f8f',
    arrowColor: isDark ? '#8097bb' : '#8aa0c4',
    headBg: isDark ? '#161f31' : '#fff',
    gradientBg: isDark
      ? 'linear-gradient(180deg,#1a2438 0%,#151f31 100%)'
      : 'linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)',
  }
}

// Generic ECharts lifecycle hook for dynamic chart components.
// - getContainer: optional function that returns the DOM element to mount the chart on.
//   When omitted, chartRef is used (the element with ref="chartRef").
function useChartLifecycle(getContainer?: () => HTMLElement | null) {
  const { ref, onUnmounted } = vue
  const chartRef = ref(null)
  let chart: echarts.ECharts | null = null

  function renderChart(option: echarts.EChartsOption) {
    const el = getContainer ? getContainer() : chartRef.value
    if (!el) return
    if (!chart) chart = echarts.init(el as HTMLElement, getEChartsTheme())
    chart.setOption(option)
  }

  onUnmounted(() => chart?.dispose())

  return { chartRef, renderChart, getChart: () => chart }
}

// Generic style helpers for dynamic chart components.
// cardStyle returns the base card style string.
// Pass extra to append additional CSS properties.
function cardStyle($: ReturnType<typeof themeColors>, extra?: string) {
  return `height:100%;width:100%;background:${$.cardBg};border:1px solid ${$.cardBorder};border-radius:8px;padding:10px 12px;box-sizing:border-box;` + (extra ? extra : '')
}

function chartAreaStyle() {
  return 'height:calc(100% - 26px);width:100%;'
}

// All globals injected into the sandbox
const SANDBOX = {
  h,
  ref,
  onMounted,
  onUnmounted,
  vue,
  axios: api,
  echarts,
  getEChartsTheme,
  utils: { mergeOptions, colors: DEFAULT_COLORS },
  themeColors,
  useChartLifecycle,
  cardStyle,
  chartAreaStyle,
}

const GLOBAL_NAMES = Object.keys(SANDBOX)

function compileComponent(code: string): Component | null {
  if (!code) return null
  const factory = new Function(
    ...GLOBAL_NAMES,
    `"use strict";\n${code}`,
  )
  const result = factory(...Object.values(SANDBOX))
  if (!result || typeof result !== 'object') {
    throw new Error('组件代码必须返回一个组件选项对象 (return { ... })')
  }
  return result as Component
}

function compileComponentTemplate1(code: string): Component | null {
  if (!code) return null

  const options = code
  const factory = new Function(
    ...GLOBAL_NAMES,
    `"use strict";\n

return {
  setup() {
    const $ = themeColors()
    const { chartRef, renderChart } = useChartLifecycle()

    onMounted(() => {
      renderChart(${options})
    })

    return () => h('div', {ref: chartRef,  style: cardStyle($) })
  }
}`,
  )
  const result = factory(...Object.values(SANDBOX))
  if (!result || typeof result !== 'object') {
    throw new Error('组件代码必须返回一个组件选项对象 (return { ... })')
  }
  return result as Component
}


/**
 * Compile stored component_code into a live Vue component.
 * Re-compiles whenever the code string changes.
 */
export function useDynamicVueComponent(code: MaybeRef<string>, componentType?: MaybeRef<string>) {
  const component = shallowRef<Component | null>(null)
  const error = ref<Error | null>(null)
  const currentType = computed(() => unref(componentType) || 'dynamic')

  function tryCompile() {
    const c = unref(code)
    if (!c) {
      component.value = null
      error.value = null
      return
    }
    try {
      if (currentType.value=='template1'){
          component.value = compileComponentTemplate1(c)
          error.value = null
      }else{
          component.value = compileComponent(c)
          error.value = null
      }

    } catch (e) {
      component.value = null
      error.value = e as Error
    }
  }

  tryCompile()

  watch([() => unref(code), currentType], tryCompile)

  return { component, error }
}
