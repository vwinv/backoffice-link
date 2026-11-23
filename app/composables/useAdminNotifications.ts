export type NotificationAudience = 'ALL' | 'PREMIUM' | 'FREE' | 'USER_IDS'
export type NotificationCampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED'
export type NotificationRecurrence = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

export type NotificationCampaign = {
  id: string
  title: string
  body: string
  titleEn: string | null
  bodyEn: string | null
  audience: NotificationAudience
  userIds: string[]
  status: NotificationCampaignStatus
  targetCount: number
  deliveredCount: number
  readCount: number
  pushAttempted: number
  errorMessage: string | null
  scheduledAt: string | null
  recurrence: NotificationRecurrence
  recurrenceEndsAt: string | null
  maxOccurrences: number | null
  occurrenceCount: number
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
  scheduled?: number
  delivered: number
  unread: number
  pushTokens: number
}

export type CreateNotificationPayload = {
  title: string
  body: string
  titleEn?: string
  bodyEn?: string
  audience: NotificationAudience
  userIds?: string[]
  scheduledAt?: string
  recurrence?: NotificationRecurrence
  recurrenceEndsAt?: string
  maxOccurrences?: number
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

  async function cancelCampaign(id: string) {
    return apiFetch<NotificationCampaign>(`/admin/notifications/${id}/cancel`, {
      method: 'POST',
      token: token.value,
    })
  }

  return {
    getStats,
    listCampaigns,
    sendCampaign,
    cancelCampaign,
  }
}
