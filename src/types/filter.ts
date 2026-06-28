export interface FilterDefinition {
  id: number
  key: string
  label: string
  type: 'date_range' | 'date' | 'select' | 'input'
  default_value: unknown
  options: { label: string; value: string }[] | null
  created_by: number | null
  created_at: string
  updated_at: string
}
