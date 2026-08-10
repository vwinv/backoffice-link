export type ChartSeries = {
  labels: string[]
  values: number[]
}

export type ActivitySeries = {
  labels: string[]
  users: number[]
  cards: number[]
  views: number[]
  shares: number[]
}

export type OfferRevenue = {
  offerId: string
  title: string
  slug: string
  subscriptionsCount: number
  revenue: number
  activeRevenue: number
}

export type DashboardStats = {
  generatedAt: string
  users: {
    total: number
    active: number
    admins: number
    newLast7Days: number
    newLast30Days: number
  }
  cards: {
    total: number
    active: number
    public: number
    personal: number
    professional: number
    member: number
  }
  teams: {
    total: number
  }
  subscriptions: {
    active: number
    trial: number
    cancelled: number
    expired: number
    pastDue: number
    paying: number
  }
  revenue: {
    currency: string
    total: number
    active: number
    byOffer: OfferRevenue[]
  }
  engagement: {
    cardViews: number
    cardViewsLast7Days: number
    shares: number
    sharesLast7Days: number
    contacts: number
    walletSaves: number
    cardSaves: number
    aiScans: number
    aiScansLast7Days: number
  }
  charts: {
    activity30d: ActivitySeries
    cardsByKind: ChartSeries
    subscriptionsByStatus: ChartSeries
    revenueByOffer: ChartSeries
  }
}

export function useAdminDashboard() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  const stats = useState<DashboardStats | null>('admin-dashboard-stats', () => null)
  const loading = useState('admin-dashboard-loading', () => false)
  const error = useState<string | null>('admin-dashboard-error', () => null)

  async function fetchStats(force = false) {
    if (!force && stats.value && !error.value) {
      return stats.value
    }

    loading.value = true
    error.value = null
    try {
      const data = await apiFetch<DashboardStats>('/admin/dashboard', {
        token: token.value,
      })
      stats.value = data
      return data
    }
    catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Impossible de charger les statistiques'
      error.value = message
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}
