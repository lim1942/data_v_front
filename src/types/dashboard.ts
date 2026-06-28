export interface Dashboard {
  id: number
  name: string
  description: string | null
  layout_config: ChartLayoutItem[]
  global_filters: FilterConfig[]
  filter_ids?: number[] | null
  is_published: boolean
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface ChartLayoutItem {
  chart_id: number
  x: number
  y: number
  w: number
  h: number
}

export interface FilterConfig {
  key: string
  label: string
  type: 'date_range' | 'date' | 'select' | 'input'
  default_value: unknown
  options?: { label: string; value: string }[]
}
