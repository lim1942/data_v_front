export interface Role {
  id: number
  name: string
  description: string | null
  permissions: Record<string, unknown>
  created_at: string
  updated_at: string
}
