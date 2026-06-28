<script setup lang="ts">
import { ref, provide, type Component } from 'vue'
import SidebarMenu from './SidebarMenu.vue'
import TopToolbar from './TopToolbar.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toolbarCenterComp = ref<Component | null>(null)
provide('toolbarCenterComp', toolbarCenterComp)

const dynamicTitle = ref<string>('')
provide('dynamicTitle', dynamicTitle)
</script>

<template>
  <div class="app-layout">
    <SidebarMenu :collapsed="sidebarCollapsed" />
    <div class="main-area" :class="{ expanded: sidebarCollapsed }">
      <TopToolbar @toggle-sidebar="toggleSidebar" />
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left var(--transition-smooth);
  min-width: 0;

  &.expanded {
    margin-left: 0;
  }
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  background: var(--color-bg-page);
}
</style>
