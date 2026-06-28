import api from './index'
import type { LoginRequest, TokenResponse } from '@/types/api'
import type { User } from '@/types/user'

export function login(data: LoginRequest) {
  return api.post<TokenResponse>('/auth/login', data).then((r) => r.data)
}

export function refreshToken(refresh_token: string) {
  return api.post<TokenResponse>('/auth/refresh', { refresh_token }).then((r) => r.data)
}

export function getCurrentUser() {
  return api.get<User>('/auth/me').then((r) => r.data)
}
