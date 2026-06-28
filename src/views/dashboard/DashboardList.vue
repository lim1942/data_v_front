<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataAnalysis } from '@element-plus/icons-vue'
import { getDashboards } from '@/api/dashboards'
import type { Dashboard } from '@/types/dashboard'

const router = useRouter()
const loading = ref(false)
const dashboards = ref<Dashboard[]>([])

async function fetchDashboards() {
  loading.value = true
  try {
    dashboards.value = await getDashboards()
    // Redirect to the first dashboard if available
    if (dashboards.value.length > 0) {
      router.replace(`/dashboard/${dashboards.value[0].id}`)
    }
  } finally { loading.value = false }
}

function goTo(id: number) {
  router.push(`/dashboard/${id}`)
}

onMounted(fetchDashboards)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <span class="subtitle">共 {{ dashboards.length }} 个</span>
    </div>

    <div v-loading="loading" class="dashboard-grid">
      <div v-for="d in dashboards" :key="d.id" class="dashboard-card" @click="goTo(d.id)">
        <div class="card-icon">
          <el-icon :size="32"><DataAnalysis /></el-icon>
        </div>
        <div class="card-body">
          <h3>{{ d.name }}</h3>
          <p>{{ d.description || '暂无描述' }}</p>
          <div class="card-meta">
            <el-tag size="small" :type="d.is_published ? 'success' : 'info'">
              {{ d.is_published ? '已发布' : '草稿' }}
            </el-tag>
            <span>{{ d.layout_config?.length || 0 }} 个图表</span>
          </div>
        </div>
      </div>

      <div v-if="!loading && dashboards.length === 0" class="empty-state">
        <el-empty description="暂无可用仪表板">
          <el-button type="primary" @click="router.push('/system/dashboards')">管理仪表板</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page { max-width: 1200px; }

.page-header {
  margin-bottom: 24px;

  .subtitle {
    margin-top: 4px;
    font-size: 14px;
    color: var(--color-text-secondary);
    display: block;
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.dashboard-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  cursor: pointer;
  transition: all var(--transition-smooth);
  display: flex;
  gap: 16px;

  &:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
    border-color: var(--color-accent);
  }
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-cyan));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;

  h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }

  p {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

.empty-state { grid-column: 1 / -1; padding: 60px 0; }
</style>
