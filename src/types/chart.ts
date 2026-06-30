export interface ChartDefinition {
  id: number
  title: string
  component_type: 'dynamic' | 'template1' | 'template2'
  component_code: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}
