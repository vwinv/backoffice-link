export type ClientSubscriptionSummary = {
  id: string
  status: string
  billingPeriod: string
  currentPeriodEnd: string | null
  offerTitle: string | null
  offerSlug: string | null
  audience: string | null
}

export type AppClient = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  authProvider: string
  createdAt: string
  updatedAt: string
  isPremium: boolean
  subscription: ClientSubscriptionSummary | null
  cardsCount: number
  teamsCount: number
  ownedTeamsCount: number
}

export type AppClientDetail = AppClient & {
  stripeCustomerId: string | null
  cards: Array<{
    id: string
    slug: string
    kind: string
    firstName: string
    lastName: string
    jobTitle: string | null
    company: string | null
    isPublic: boolean
    isActive: boolean
    createdAt: string
  }>
  subscriptions: Array<{
    id: string
    status: string
    billingPeriod: string
    currentPeriodEnd: string | null
    createdAt: string
    offer: { id: string, title: string, slug: string, audience: string } | null
    plan: { id: string, name: string, slug: string } | null
  }>
  teams: Array<{
    id: string
    name: string
    slug: string
    isActive: boolean
    role: string
  }>
  ownedTeams: Array<{
    id: string
    name: string
    slug: string
    isActive: boolean
    membersCount: number
  }>
  stats: {
    cardsCount: number
    teamsCount: number
    ownedTeamsCount: number
    contactsCount: number
    sharesCount: number
    viewsCount: number
  }
}

export type AppClientsListResponse = {
  data: AppClient[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type UpdateAppClientPayload = {
  isActive?: boolean
  firstName?: string
  lastName?: string
  phone?: string | null
}

export function useAdminClients() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function listClients(query: {
    search?: string
    isActive?: '' | 'true' | 'false'
    isPremium?: '' | 'true' | 'false'
    page?: number
    limit?: number
  } = {}) {
    const params = new URLSearchParams()
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.isActive === 'true' || query.isActive === 'false') {
      params.set('isActive', query.isActive)
    }
    if (query.isPremium === 'true' || query.isPremium === 'false') {
      params.set('isPremium', query.isPremium)
    }
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return apiFetch<AppClientsListResponse>(
      `/admin/clients${qs ? `?${qs}` : ''}`,
      { token: token.value },
    )
  }

  async function getClient(id: string) {
    return apiFetch<AppClientDetail>(`/admin/clients/${id}`, {
      token: token.value,
    })
  }

  async function updateClient(id: string, body: UpdateAppClientPayload) {
    return apiFetch<AppClient>(`/admin/clients/${id}`, {
      method: 'PATCH',
      token: token.value,
      body,
    })
  }

  return {
    listClients,
    getClient,
    updateClient,
  }
}
