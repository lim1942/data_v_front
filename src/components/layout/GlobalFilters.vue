<script setup lang="ts">
import type { FilterConfig } from '@/types/dashboard'

const props = defineProps<{
  filters: FilterConfig[]
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function setFilter(key: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="global-filters">
    <div v-for="filter in filters" :key="filter.key" class="filter-item">
      <label>{{ filter.label }}</label>
      <el-select
        v-if="filter.type === 'select'"
        :model-value="modelValue[filter.key] ?? filter.default_value"
        size="small"
        style="width: 140px"
        @update:model-value="(v: unknown) => setFilter(filter.key, v)"
      >
        <el-option
          v-for="opt in filter.options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-date-picker
        v-else-if="filter.type === 'date_range'"
        :model-value="modelValue[filter.key] ?? filter.default_value"
        type="daterange"
        range-separator="~"
        start-placeholder="开始"
        end-placeholder="结束"
        size="small"
        style="width: 240px"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @update:model-value="(v: unknown) => setFilter(filter.key, v)"
      />
      <el-date-picker
        v-else-if="filter.type === 'date'"
        :model-value="modelValue[filter.key] ?? filter.default_value"
        type="date"
        placeholder="选择日期"
        size="small"
        style="width: 160px"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @update:model-value="(v: unknown) => setFilter(filter.key, v)"
      />
      <el-input
        v-else
        :model-value="modelValue[filter.key] ?? filter.default_value"
        size="small"
        style="width: 140px"
        @update:model-value="(v: unknown) => setFilter(filter.key, v)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.global-filters {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;

  label {
    font-size: 13px;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }
}
</style>
