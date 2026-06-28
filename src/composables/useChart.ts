import { ref, watch, type Component, type MaybeRef, unref } from 'vue'
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

// All globals injected into the sandbox
const SANDBOX = {
  vue,
  axios: api,
  echarts,
  getEChartsTheme,
  utils: { mergeOptions, colors: DEFAULT_COLORS },
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

/**
 * Compile stored component_code into a live Vue component.
 * Re-compiles whenever the code string changes.
 */
export function useDynamicVueComponent(code: MaybeRef<string>) {
  const component = ref<Component | null>(null)
  const error = ref<Error | null>(null)

  function tryCompile() {
    const c = unref(code)
    if (!c) {
      component.value = null
      error.value = null
      return
    }
    try {
      component.value = compileComponent(c)
      error.value = null
    } catch (e) {
      component.value = null
      error.value = e as Error
    }
  }

  tryCompile()

  watch(() => unref(code), tryCompile)

  return { component, error }
}
