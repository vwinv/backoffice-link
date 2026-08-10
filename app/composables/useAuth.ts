export type AdminRole = 'USER' | 'ADMIN'

export type AdminUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  role: AdminRole
  adminRole?: { id: string, name: string } | null
  permissions?: string[]
}

type AuthResponse = {
  accessToken: string
  user: AdminUser
}

const TOKEN_COOKIE = 'dropone_admin_token'

export function useAuth() {
  const { apiFetch } = useApi()
  const token = useCookie<string | null>(TOKEN_COOKIE, {
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 24 * 7,
  })
  const user = useState<AdminUser | null>('admin-user', () => null)
  const ready = useState('admin-auth-ready', () => false)
  const loading = useState('admin-auth-loading', () => false)

  const isAuthenticated = computed(() => {
    if (!token.value || !user.value) return false
    return Boolean(user.value.adminRole) || user.value.role === 'ADMIN' || hasPermission('*')
  })

  const permissions = computed(() => user.value?.permissions ?? [])

  const displayName = computed(() => {
    if (!user.value) return ''
    const name = `${user.value.firstName} ${user.value.lastName}`.trim()
    return name || user.value.email
  })

  function hasPermission(permission: string) {
    const list = user.value?.permissions ?? []
    return list.includes('*') || list.includes(permission)
  }

  function setSession(accessToken: string, nextUser: AdminUser) {
    token.value = accessToken
    user.value = nextUser
  }

  function clearSession() {
    token.value = null
    user.value = null
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const response = await apiFetch<AuthResponse>('/auth/admin/login', {
        method: 'POST',
        body: { email, password },
      })
      const canAccess =
        Boolean(response.user.adminRole) ||
        response.user.role === 'ADMIN' ||
        (response.user.permissions ?? []).includes('*')
      if (!canAccess) {
        clearSession()
        throw new Error('Accès réservé aux utilisateurs du backoffice')
      }
      setSession(response.accessToken, response.user)
      return response.user
    }
    finally {
      loading.value = false
      ready.value = true
    }
  }

  async function fetchMe() {
    if (!token.value) {
      user.value = null
      ready.value = true
      return null
    }

    loading.value = true
    try {
      const me = await apiFetch<AdminUser>('/auth/admin/me', {
        token: token.value,
      })
      user.value = me
      return me
    }
    catch {
      clearSession()
      return null
    }
    finally {
      loading.value = false
      ready.value = true
    }
  }

  async function ensureSession() {
    if (ready.value && isAuthenticated.value) {
      return user.value
    }
    return fetchMe()
  }

  async function logout() {
    clearSession()
    ready.value = true
    await navigateTo('/admin/login')
  }

  return {
    token,
    user,
    ready,
    loading,
    isAuthenticated,
    permissions,
    displayName,
    hasPermission,
    login,
    fetchMe,
    ensureSession,
    logout,
    clearSession,
  }
}
