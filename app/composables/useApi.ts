export type ApiErrorBody = {
  message?: string | string[]
  statusCode?: number
  error?: string
}

export class ApiError extends Error {
  statusCode: number
  body: ApiErrorBody | null

  constructor(statusCode: number, message: string, body: ApiErrorBody | null = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.body = body
  }
}

function messageFromBody(body: ApiErrorBody | null, fallback: string): string {
  if (!body?.message) return fallback
  return Array.isArray(body.message) ? body.message.join(', ') : body.message
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = String(config.public.apiBaseUrl || '').replace(/\/+$/, '')

  async function apiFetch<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: unknown
      token?: string | null
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`
    }

    try {
      return await $fetch<T>(path, {
        baseURL,
        method: options.method ?? 'GET',
        body: options.body as Record<string, unknown> | undefined,
        headers,
      })
    }
    catch (error: unknown) {
      const fetchError = error as {
        statusCode?: number
        status?: number
        data?: ApiErrorBody
        message?: string
      }
      const statusCode = fetchError.statusCode ?? fetchError.status ?? 500
      const body = fetchError.data ?? null
      throw new ApiError(
        statusCode,
        messageFromBody(body, fetchError.message || 'Erreur réseau'),
        body,
      )
    }
  }

  return { apiFetch, baseURL }
}
