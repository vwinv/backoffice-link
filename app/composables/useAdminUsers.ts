export type BackofficeRoleSummary = {
  id: string
  name: string
  isSystem?: boolean
}

export type BackofficeUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  role: string
  isActive: boolean
  authProvider: string
  createdAt: string
  updatedAt: string
  adminRole: BackofficeRoleSummary | null
  permissions?: string[]
}

export type BackofficeUsersListResponse = {
  data: BackofficeUser[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type CreateBackofficeUserPayload = {
  email: string
  firstName: string
  lastName: string
  password: string
  adminRoleId: string
  phone?: string
}

export type UpdateBackofficeUserPayload = {
  adminRoleId?: string
  isActive?: boolean
  firstName?: string
  lastName?: string
  phone?: string | null
  password?: string
}

export function useAdminUsers() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function listUsers(query: {
    search?: string
    isActive?: '' | 'true' | 'false'
    page?: number
    limit?: number
  } = {}) {
    const params = new URLSearchParams()
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.isActive === 'true' || query.isActive === 'false') {
      params.set('isActive', query.isActive)
    }
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return apiFetch<BackofficeUsersListResponse>(
      `/admin/users${qs ? `?${qs}` : ''}`,
      { token: token.value },
    )
  }

  async function getUser(id: string) {
    return apiFetch<BackofficeUser>(`/admin/users/${id}`, {
      token: token.value,
    })
  }

  async function createUser(body: CreateBackofficeUserPayload) {
    return apiFetch<BackofficeUser>('/admin/users', {
      method: 'POST',
      token: token.value,
      body,
    })
  }

  async function updateUser(id: string, body: UpdateBackofficeUserPayload) {
    return apiFetch<BackofficeUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      token: token.value,
      body,
    })
  }

  return {
    listUsers,
    getUser,
    createUser,
    updateUser,
  }
}
