export interface UserPermissions {
  system?: {
    users?: 'r' | 'rw'
    roles?: 'r' | 'rw'
    dashboards?: 'r' | 'rw'
    charts?: 'r' | 'rw'
    filters?: 'r' | 'rw'
  }
  dashboards?: {
    edit?: boolean
  }
}

export interface User {
  id: number
  username: string
  email: string | null
  avatar: string | null
  is_active: boolean
  theme_preference: string
  roles: RoleBrief[]
  permissions: UserPermissions
  created_at: string
  updated_at: string
}

export interface RoleBrief {
  id: number
  name: string
}
