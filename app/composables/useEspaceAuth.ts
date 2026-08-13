export type EspaceUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  role: string
}

type AuthResponse = {
  accessToken: string
  user: EspaceUser
}

const TOKEN_COOKIE = 'dropone_espace_token'

export function useEspaceAuth() {
  const { apiFetch } = useApi()
  const token = useCookie<string | null>(TOKEN_COOKIE, {
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 24 * 14,
  })
  const user = useState<EspaceUser | null>('espace-user', () => null)
  const ready = useState('espace-auth-ready', () => false)
  const loading = useState('espace-auth-loading', () => false)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  const displayName = computed(() => {
    if (!user.value) return ''
    const name = `${user.value.firstName} ${user.value.lastName}`.trim()
    return name || user.value.email
  })

  function setSession(accessToken: string, nextUser: EspaceUser) {
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
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
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
      const me = await apiFetch<EspaceUser>('/auth/me', {
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
    await navigateTo('/espace/login')
  }

  return {
    token,
    user,
    ready,
    loading,
    isAuthenticated,
    displayName,
    login,
    fetchMe,
    ensureSession,
    logout,
    clearSession,
  }
}
