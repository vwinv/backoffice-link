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

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, '')
  if (!trimmed) return trimmed
  if (/\/api\/v\d+$/i.test(trimmed)) return trimmed
  return `${trimmed}/api/v1`
}

function humanizeApiError(
  statusCode: number,
  body: ApiErrorBody | string | null,
  fallback: string,
): string {
  const raw =
    typeof body === 'string'
      ? body
      : messageFromBody(body, fallback)

  if (/cannot\s+(get|post|put|patch|delete)\s+\//i.test(raw)) {
    if (statusCode === 404) {
      return 'Service introuvable. Vérifiez la configuration de l’API.'
    }
    return 'Connexion impossible pour le moment. Réessayez plus tard.'
  }

  if (statusCode === 401) return raw || 'E-mail ou mot de passe incorrect'
  if (statusCode === 403) {
    return raw || 'Accès réservé aux utilisateurs du backoffice'
  }

  return raw || fallback
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = normalizeApiBaseUrl(String(config.public.apiBaseUrl || ''))

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
        data?: ApiErrorBody | string
        message?: string
      }
      const statusCode = fetchError.statusCode ?? fetchError.status ?? 500
      const data = fetchError.data
      const body = data && typeof data === 'object' ? data : null
      throw new ApiError(
        statusCode,
        humanizeApiError(
          statusCode,
          body ?? (typeof data === 'string' ? data : null),
          fetchError.message || 'Erreur réseau',
        ),
        body,
      )
    }
  }

  return { apiFetch, baseURL }
}
