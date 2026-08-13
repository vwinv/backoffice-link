export type AdminOfferPrice = {
  id: string
  billingType: 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string
  priceLabel: string | null
  priceAmount: number
  pricePerSeat: number | null
  currency: string
  discountPercent: number | null
  badgeLabel: string | null
  isPopular: boolean
  sortOrder: number
  isActive: boolean
  stripePriceId: string | null
}

export type AdminOffer = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  audience: 'PERSONAL' | 'TEAM' | string
  canCustomize: boolean
  maxTeamMembers: number
  minSeats: number
  hasPortfolio: boolean
  hasWallet: boolean
  hasAnalytics: boolean
  hasVisitorInsights: boolean
  hasSocialLinks: boolean
  maxAiScans: number
  maxShares: number
  sortOrder: number
  isActive: boolean
  listedInApp: boolean
  isFreeOffer: boolean
  subscriptionsCount: number
  createdAt: string
  updatedAt: string
  prices: AdminOfferPrice[]
}

export type AdminOfferPayload = {
  title: string
  slug: string
  subtitle?: string | null
  audience: string
  canCustomize: boolean
  maxTeamMembers: number
  minSeats: number
  hasPortfolio: boolean
  hasWallet: boolean
  hasAnalytics: boolean
  hasVisitorInsights: boolean
  hasSocialLinks: boolean
  maxAiScans: number
  maxShares: number
  sortOrder: number
  isActive: boolean
  listedInApp: boolean
}

export type AdminOfferPricePayload = {
  billingType: string
  priceAmount: number
  pricePerSeat?: number | null
  priceLabel?: string | null
  currency?: string
  discountPercent?: number | null
  badgeLabel?: string | null
  isPopular?: boolean
  sortOrder?: number
  isActive?: boolean
  stripePriceId?: string | null
}

export function useAdminOffers() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  async function listOffers() {
    return apiFetch<AdminOffer[]>('/admin/offers', { token: token.value })
  }

  async function getOffer(id: string) {
    return apiFetch<AdminOffer>(`/admin/offers/${id}`, { token: token.value })
  }

  async function createOffer(body: AdminOfferPayload & { prices?: AdminOfferPricePayload[] }) {
    return apiFetch<AdminOffer>('/admin/offers', {
      method: 'POST',
      token: token.value,
      body,
    })
  }

  async function updateOffer(id: string, body: Partial<AdminOfferPayload>) {
    return apiFetch<AdminOffer>(`/admin/offers/${id}`, {
      method: 'PATCH',
      token: token.value,
      body,
    })
  }

  async function deleteOffer(id: string) {
    return apiFetch<{ id: string, softDeleted: boolean }>(`/admin/offers/${id}`, {
      method: 'DELETE',
      token: token.value,
    })
  }

  async function createPrice(offerId: string, body: AdminOfferPricePayload) {
    return apiFetch<AdminOfferPrice>(`/admin/offers/${offerId}/prices`, {
      method: 'POST',
      token: token.value,
      body,
    })
  }

  async function updatePrice(
    offerId: string,
    priceId: string,
    body: Partial<AdminOfferPricePayload>,
  ) {
    return apiFetch<AdminOfferPrice>(
      `/admin/offers/${offerId}/prices/${priceId}`,
      {
        method: 'PATCH',
        token: token.value,
        body,
      },
    )
  }

  async function deletePrice(offerId: string, priceId: string) {
    return apiFetch<{
      id: string
      deleted: boolean
      detachedSubscriptions: number
    }>(
      `/admin/offers/${offerId}/prices/${priceId}`,
      {
        method: 'DELETE',
        token: token.value,
      },
    )
  }

  return {
    listOffers,
    getOffer,
    createOffer,
    updateOffer,
    deleteOffer,
    createPrice,
    updatePrice,
    deletePrice,
  }
}
