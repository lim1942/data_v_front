import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const vPermission: Directive<HTMLElement, string, string> = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const path = binding.value
    if (!path) return

    const level = (binding.arg as 'r' | 'rw') || 'r'

    if (!authStore.hasPermission(path, level)) {
      el.remove()
    }
  },
}
