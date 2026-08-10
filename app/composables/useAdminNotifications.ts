export type NotificationAudience = 'ALL' | 'PREMIUM' | 'FREE' | 'USER_IDS'
export type NotificationCampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED'

export type NotificationCampaign = {
  id: string
  title: string
  body: string
  audience: NotificationAudience
  userIds: string[]
  status: NotificationCampaignStatus
  targetCount: number
  deliveredCount: number
  readCount: number
  pushAttempted: number
  errorMessage: string | null
  createdAt: string
  sentAt: string | null
  updatedAt: string
  createdBy: {
    id: string
    email: string
    name: string
  } | null
}

export type NotificationCampaignsListResponse = {
  data: NotificationCampaign[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type NotificationStats = {
  campaigns: number
  sent: number
  failed: number
  delivered: number
  unread: number
  pushTokens: number
}

export type CreateNotificationPayload = {
  title: string
  body: string
  audience: NotificationAudience
  userIds?: string[]
}

export function useAdminNotifications() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function getStats() {
    return apiFetch<NotificationStats>('/admin/notifications/stats', {
      token: token.value,
    })
  }

  async function listCampaigns(query: {
    search?: string
    status?: string
    page?: number
    limit?: number
  } = {}) {
    const params = new URLSearchParams()
    if (query.search?.trim()) params.set('search', query.search.trim())
    if (query.status) params.set('status', query.status)
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return apiFetch<NotificationCampaignsListResponse>(
      `/admin/notifications${qs ? `?${qs}` : ''}`,
      { token: token.value },
    )
  }

  async function sendCampaign(body: CreateNotificationPayload) {
    return apiFetch<NotificationCampaign>('/admin/notifications', {
      method: 'POST',
      token: token.value,
      body,
    })
  }

  return {
    getStats,
    listCampaigns,
    sendCampaign,
  }
}
