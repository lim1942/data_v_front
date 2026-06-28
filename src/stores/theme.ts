import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('light')

  function initTheme() {
    const stored = localStorage.getItem('app-theme')
    if (stored === 'light' || stored === 'dark') {
      mode.value = stored
    } else {
      mode.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    applyTheme()
  }

  function toggleTheme() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
    applyTheme()
    persistTheme()
  }

  function setTheme(newMode: ThemeMode) {
    mode.value = newMode
    applyTheme()
    persistTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', mode.value)
    if (mode.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function persistTheme() {
    localStorage.setItem('app-theme', mode.value)
  }

  return { mode, initTheme, toggleTheme, setTheme, applyTheme }
})
