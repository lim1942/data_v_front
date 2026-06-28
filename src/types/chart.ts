export interface ChartDefinition {
  id: number
  title: string
  data_source: string | null
  options_config: Record<string, unknown>
  component_type: 'legacy' | 'dynamic'
  component_code: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}
