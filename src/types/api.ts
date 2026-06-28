export interface ApiResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}
