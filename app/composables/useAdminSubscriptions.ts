export type SubscriptionOfferFilter = {
  id: string
  title: string
  slug: string
  audience: string
}

export type AdminSubscriptionItem = {
  id: string
  status: string
  billingPeriod: string
  currentPeriodEnd: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  paymentProvider: 'stripe' | 'paydunya' | null
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    fullName: string
  } | null
  team: {
    id: string
    name: string
    slug: string
  } | null
  offer: {
    id: string
    title: string
    slug: string
    audience: string
  } | null
  plan: {
    id: string
    name: string
    slug: string
  } | null
  price: {
    id: string
    billingType: string
    amount: number
    currency: string
    label: string | null
  } | null
}

export type AdminSubscriptionsListResponse = {
  data: AdminSubscriptionItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type AdminSubscriptionsStats = {
  generatedAt: string
  totals: {
    total: number
    active: number
    trial: number
    cancelled: number
    expired: number
    pastDue: number
    paying: number
    newLast30Days: number
  }
  billing: {
    monthly: number
    yearly: number
  }
  revenue: {
    currency: string
    total: number
    active: number
  }
  byOffer: Array<{
    offerId: string
    title: string
    slug: string
    subscriptionsCount: number
    activeCount: number
    revenue: number
  }>
  byStatus: Array<{
    status: string
    label: string
    count: number
  }>
}

export function useAdminSubscriptions() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function getStats() {
    return apiFetch<AdminSubscriptionsStats>('/admin/subscriptions/stats', {
      token: token.value,
    })
  }

  async function listOffers() {
    return apiFetch<SubscriptionOfferFilter[]>('/admin/subscriptions/offers', {
      token: token.value,
    })
  }

  async function listSubscriptions(query: {
    search?: string
    status?: string
    offerId?: string
    page?: number
    limit?: number
  } = {}) {
    const params = new URLSearchParams()
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.status) params.set('status', query.status)
    if (query.offerId) params.set('offerId', query.offerId)
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return apiFetch<AdminSubscriptionsListResponse>(
      `/admin/subscriptions${qs ? `?${qs}` : ''}`,
      { token: token.value },
    )
  }

  return {
    getStats,
    listOffers,
    listSubscriptions,
  }
}
