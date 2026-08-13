export type SupportTicketStatus = 'OPEN' | 'REPLIED' | 'CLOSED'

export type SupportTicketListItem = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  messagePreview: string
  status: SupportTicketStatus
  repliesCount: number
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SupportTicketDetail = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  message: string
  status: SupportTicketStatus
  closedAt: string | null
  createdAt: string
  updatedAt: string
  replies: Array<{
    id: string
    body: string
    createdAt: string
    sentBy: { id: string, email: string, name: string } | null
  }>
}

export type SupportTicketsListResponse = {
  data: SupportTicketListItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type SupportStats = {
  open: number
  replied: number
  closed: number
  total: number
}

export function useAdminSupport() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function getStats() {
    return apiFetch<SupportStats>('/admin/support/stats', {
      token: token.value,
    })
  }

  async function listTickets(query: {
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
    return apiFetch<SupportTicketsListResponse>(
      `/admin/support/tickets${qs ? `?${qs}` : ''}`,
      { token: token.value },
    )
  }

  async function getTicket(id: string) {
    return apiFetch<SupportTicketDetail>(`/admin/support/tickets/${id}`, {
      token: token.value,
    })
  }

  async function replyTicket(id: string, body: string) {
    return apiFetch<{
      replyId: string
      ticketId: string
      status: SupportTicketStatus
      emailedTo: string
    }>(`/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      token: token.value,
      body: { body },
    })
  }

  return {
    getStats,
    listTickets,
    getTicket,
    replyTicket,
  }
}
