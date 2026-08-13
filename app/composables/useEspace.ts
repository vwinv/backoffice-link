export type EspaceMemberStats = {
  memberId: string
  role: string
  joinedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
  }
  stats: {
    cards: number
    views: number
    shares: number
    saves: number
  }
}

export type EspaceDashboard = {
  team: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
    brandColor: string | null
    ownerId: string
    createdAt: string
  }
  myRole: string
  seats: {
    used: number
    max: number
    canAddMember: boolean
  }
  subscription: {
    id: string
    status: string
    billingPeriod: string
    purchasedSeats: number | null
    currentPeriodEnd: string | null
    offer: { title: string, slug: string, audience: string } | null
    offerPrice: {
      billingType: string
      priceAmount: number
      pricePerSeat: number | null
      currency: string
    } | null
  } | null
  totals: {
    views: number
    shares: number
    saves: number
    cards: number
  }
  pendingInvites: number
  invoicesCount: number
  members: EspaceMemberStats[]
  espacePath: string
}

export type EspaceInvoice = {
  id: string
  number: string
  amount: number
  currency: string
  status: string
  description: string | null
  offerSlug: string | null
  billingType: string | null
  seats: number | null
  provider: string | null
  lines: Array<{
    label: string
    amount: number
    seats?: number | null
    kind?: string
  }>
  dueAt: string | null
  paidAt: string | null
  createdAt: string
  canPay?: boolean
}

export type EspaceInvoicesParty = {
  team: { id: string, name: string, slug: string, logoUrl: string | null }
  client: { name: string, email: string, phone: string | null } | null
  issuer: { name: string, legalName: string, email: string, website: string }
}

export type EspaceMemberAnalytics = {
  member: {
    memberId: string
    role: string
    joinedAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      avatarUrl: string | null
    }
  }
  cards: Array<{
    id: string
    slug: string
    name: string
    jobTitle: string | null
    avatarUrl: string | null
  }>
  analytics: {
    views: number
    shares: number
    saved: number
    uniqueVisitors: number
    periodDays: number
    periodViews: number
    previousPeriodViews: number
    viewsChangePercent: number
    viewsSeries: Array<{ date: string, label: string, count: number }>
    sources: Array<{ key: string, count: number, percent: number }>
    sparklines: {
      views: number[]
      uniqueVisitors: number[]
      saved: number[]
      shares: number[]
    }
  }
}

export type EspaceMembersPayload = {
  members: Array<{
    id: string
    role: string
    joinedAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      avatarUrl: string | null
    }
  }>
  pendingInvites: Array<{
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    jobTitle: string | null
    role: string
    createdAt: string
  }>
  seats: {
    used: number
    max: number
    canAddMember: boolean
  }
  team?: {
    id: string
    name: string
    slug: string
  }
  seatPurchase?: {
    subscriptionId: string
    offerTitle: string | null
    offerSlug: string | null
    billingType: string | null
    currency: string
    pricePerSeat: number | null
    minSeats: number
    purchasedSeats: number
    maxSeats: number
    canPurchaseSeats: boolean
  } | null
}

export function useEspace() {
  const auth = useEspaceAuth()
  const { apiFetch } = useApi()

  function token() {
    return auth.token.value
  }

  function getDashboard(slug: string) {
    return apiFetch<EspaceDashboard>(`/espace/${encodeURIComponent(slug)}`, {
      token: token(),
    })
  }

  function getMembers(slug: string) {
    return apiFetch<EspaceMembersPayload>(
      `/espace/${encodeURIComponent(slug)}/members`,
      { token: token() },
    )
  }

  function addMember(
    slug: string,
    body: {
      email: string
      firstName?: string
      lastName?: string
      jobTitle?: string
      role?: string
    },
  ) {
    return apiFetch(`/espace/${encodeURIComponent(slug)}/members`, {
      method: 'POST',
      token: token(),
      body,
    })
  }

  function removeMember(slug: string, memberId: string) {
    return apiFetch(
      `/espace/${encodeURIComponent(slug)}/members/${encodeURIComponent(memberId)}`,
      { method: 'DELETE', token: token() },
    )
  }

  function cancelInvite(slug: string, inviteId: string) {
    return apiFetch(
      `/espace/${encodeURIComponent(slug)}/invitations/${encodeURIComponent(inviteId)}`,
      { method: 'DELETE', token: token() },
    )
  }

  function getInvoices(slug: string) {
    return apiFetch<{
      party: EspaceInvoicesParty
      upcoming: EspaceInvoice[]
      items: EspaceInvoice[]
    }>(
      `/espace/${encodeURIComponent(slug)}/invoices`,
      { token: token() },
    )
  }

  function payInvoice(slug: string, invoiceId: string) {
    return apiFetch<{
      paidImmediately: boolean
      amountFcfa: number
      checkoutUrl: string | null
      invoiceToken: string | null
      paymentInvoiceId: string
    }>(`/espace/${encodeURIComponent(slug)}/invoices/${encodeURIComponent(invoiceId)}/pay`, {
      method: 'POST',
      token: token(),
    })
  }

  function confirmInvoicePayment(slug: string, invoiceToken: string) {
    return apiFetch(`/espace/${encodeURIComponent(slug)}/invoices/confirm`, {
      method: 'POST',
      token: token(),
      body: { invoiceToken },
    })
  }

  function getMemberAnalytics(slug: string, memberId: string, days = 30) {
    return apiFetch<EspaceMemberAnalytics>(
      `/espace/${encodeURIComponent(slug)}/members/${encodeURIComponent(memberId)}/analytics?days=${days}`,
      { token: token() },
    )
  }

  function checkoutSeats(slug: string, additionalSeats: number) {
    return apiFetch<{
      paidImmediately: boolean
      amountFcfa: number
      additionalSeats: number
      newSeatsTotal: number
      pricePerSeat?: number
      currency?: string
      checkoutUrl: string | null
      invoiceToken: string | null
    }>(`/espace/${encodeURIComponent(slug)}/seats/checkout`, {
      method: 'POST',
      token: token(),
      body: { additionalSeats },
    })
  }

  function confirmSeats(slug: string, invoiceToken: string) {
    return apiFetch(`/espace/${encodeURIComponent(slug)}/seats/confirm`, {
      method: 'POST',
      token: token(),
      body: { invoiceToken },
    })
  }

  function listMine() {
    return apiFetch<Array<{
      id: string
      name: string
      slug: string
      logoUrl: string | null
      brandColor: string | null
      espacePath: string
    }>>('/espace', { token: token() })
  }

  return {
    getDashboard,
    getMembers,
    addMember,
    removeMember,
    cancelInvite,
    getInvoices,
    payInvoice,
    confirmInvoicePayment,
    getMemberAnalytics,
    checkoutSeats,
    confirmSeats,
    listMine,
  }
}
