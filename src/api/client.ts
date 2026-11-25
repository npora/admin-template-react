import { apiPrefix } from '../config/app'
import { createClient, isRequestError } from '@npora/request/core'
import { retryPlugin } from '@npora/request/plugins/retry'
import type { Session } from '../auth/types'

interface ApiResponse<T> {
  code: number | string
  message: string
  data: T
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: number | string
  readonly retryAt: number

  constructor(message: string, status: number, code?: number | string, retryAt = 0) {
    super(message)
    this.status = status
    this.code = code
    this.retryAt = retryAt
  }
}

const client = createClient({
  baseURL: apiPrefix,
  allowAbsoluteUrls: false,
  timeout: 10_000,
  totalTimeout: 30_000,
  fetchOptions: { credentials: 'same-origin', cache: 'no-store' }
}).use(
  retryPlugin({
    retries: 2,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    retryOnTimeout: false,
    respectRetryAfter: true,
    jitter: true,
    maxElapsedTime: 15_000
  })
)

export async function request<T>(
  path: string,
  {
    token,
    signal,
    json,
    method,
    query
  }: {
    token?: string
    signal?: AbortSignal
    json?: object
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    query?: Record<string, string | number>
  } = {}
): Promise<T> {
  const config = {
    signal,
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  }
  try {
    const send = {
      GET: client.get.bind(client),
      POST: client.post.bind(client),
      PUT: client.put.bind(client),
      DELETE: client.delete.bind(client)
    }[method ?? (json ? 'POST' : 'GET')]
    const response = await send<ApiResponse<T>>(path, { ...config, json })
    if (response?.code === 0 && 'data' in response) return response.data
    throw new ApiError(response?.message || '服务器返回的数据格式异常。', 200, response?.code)
  } catch (error) {
    if (!isRequestError<Partial<ApiResponse<T>>>(error) || !error.status) throw error
    const retry = error.response?.headers.get('Retry-After')?.trim()
    const retryAt =
      retry && /^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry ?? '')
    throw new ApiError(
      typeof error.data?.message === 'string' ? error.data.message : '请求失败，请稍后重试。',
      error.status,
      error.data?.code,
      retryAt || 0
    )
  }
}

export const api = {
  login: (json: { username: string; password: string; totpCode?: string; rememberMe: boolean }) =>
    request<{ accessToken: string; expiresAt?: number }>('/auth/login', { json }),
  resetPassword: (
    json: { username: string; totpCode: string; newPassword: string },
    signal: AbortSignal
  ) => request<null>('/auth/password/reset', { json, signal }),
  async session(token: string, signal?: AbortSignal): Promise<Session> {
    try {
      return await request('/auth/session', { token, signal })
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      const [user, routes] = await Promise.all([
        request<Session['user']>('/auth/user', { token, signal }),
        request<Session['routes']>('/auth/routes', { token, signal })
      ])
      return { user, routes }
    }
  },
  logout: (token: string) =>
    request('/auth/logout', { token, method: 'POST', signal: AbortSignal.timeout(5000) })
}
