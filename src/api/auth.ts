/** Auth endpoints: login, refresh, logout. */
import { request } from './client'
import type { AuthResponse, LoginRequest } from './types'

export function login(body: LoginRequest, signal?: AbortSignal): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    json: body,
    signal,
    _skipAuthRefresh: true,
  })
}

export function refresh(signal?: AbortSignal): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/refresh', {
    method: 'POST',
    signal,
    _skipAuthRefresh: true,
  })
}

export function logout(signal?: AbortSignal): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/logout', {
    method: 'POST',
    signal,
    _skipAuthRefresh: true,
  })
}
