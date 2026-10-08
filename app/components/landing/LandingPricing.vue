<script setup lang="ts">
type OfferAudience = 'PERSONAL' | 'TEAM'
type BillingType = 'MONTHLY' | 'YEARLY' | 'LIFETIME'

type PublicOfferPrice = {
  id: string
  billingType: BillingType
  priceLabel?: string | null
  priceAmount: number
  pricePerSeat?: number | null
  currency: string
  discountPercent?: number | null
  badgeLabel?: string | null
  isPopular: boolean
  sortOrder: number
}

type PublicOffer = {
  id: string
  title: string
  slug: string
  subtitle?: string | null
  audience: OfferAudience
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
  prices: PublicOfferPrice[]
}

type LandingPlan = {
  key: string
  name: string
  subtitle: string
  price: string
  unit: string
  seatNote: string | null
  badge: string | null
  cta: string
  tone: 'free' | 'premium' | 'pro'
  features: string[]
}

const { t } = useI18n()
const { apiFetch } = useApi()

const { data, pending } = await useAsyncData('landing-offers', async () => {
  try {
    const items = await apiFetch<PublicOffer[]>('/subscriptions/offers')
    return { items: Array.isArray(items) ? items : [], failed: false }
  }
  catch {
    return { items: [] as PublicOffer[], failed: true }
  }
})

function formatAmount(value: number) {
  const rounded = Math.round(Number.isFinite(value) ? value : 0)
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
    .format(rounded)
    .replace(/\u00a0/g, ' ')
    .replace(/\u202f/g, ' ')
}

function pickPrice(offer: PublicOffer): PublicOfferPrice | null {
  const prices = [...(offer.prices ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )
  return (
    prices.find(price => price.billingType === 'MONTHLY')
    ?? prices.find(price => price.billingType === 'YEARLY')
    ?? prices.find(price => price.isPopular)
    ?? prices[0]
    ?? null
  )
}

function isPerSeat(price: PublicOfferPrice) {
  return price.pricePerSeat != null && price.pricePerSeat > 0
}

function displayAmount(price: PublicOfferPrice | null) {
  if (!price || price.priceAmount <= 0) return '0'
  return formatAmount(price.priceAmount)
}

function displayUnit(price: PublicOfferPrice | null) {
  if (!price || price.priceAmount <= 0) {
    return t('landing.pricing.unit.free')
  }
  if (price.billingType === 'YEARLY') {
    return t('landing.pricing.unit.yearly')
  }
  if (price.billingType === 'LIFETIME') {
    return t('landing.pricing.unit.lifetime')
  }
  return t('landing.pricing.unit.monthly')
}

function displaySeatNote(price: PublicOfferPrice | null) {
  if (!price || !isPerSeat(price)) return null
  const amount = formatAmount(price.pricePerSeat ?? 0)
  if (price.billingType === 'YEARLY') {
    return t('landing.pricing.seat.yearly', { amount })
  }
  if (price.billingType === 'LIFETIME') {
    return t('landing.pricing.seat.lifetime', { amount })
  }
  return t('landing.pricing.seat.monthly', { amount })
}

function planTone(index: number, total: number): LandingPlan['tone'] {
  if (total <= 1) return 'premium'
  if (index === 0) return 'free'
  if (total >= 3 && index === total - 1) return 'pro'
  return 'premium'
}

function offerFeatures(offer: PublicOffer) {
  const features: string[] = []

  if (offer.audience === 'TEAM') {
    if (offer.maxTeamMembers > 0) {
      features.push(t('landing.pricing.features.teamLimit', { n: offer.maxTeamMembers }))
    }
    else {
      features.push(t('landing.pricing.features.teamSeats', { n: Math.max(offer.minSeats, 1) }))
    }
    features.push(t('landing.pricing.features.enterpriseDashboard'))
  }
  else {
    features.push(t('landing.pricing.features.personalCard'))
  }

  features.push(t('landing.pricing.features.share'))

  if (offer.maxShares < 0) {
    features.push(t('landing.pricing.features.sharesUnlimited'))
  }
  else if (offer.maxShares > 0) {
    features.push(t('landing.pricing.features.shares', { n: offer.maxShares }))
  }

  if (offer.canCustomize) {
    features.push(t('landing.pricing.features.customize'))
  }
  if (offer.hasWallet) {
    features.push(t('landing.pricing.features.wallet'))
  }
  if (offer.hasAnalytics) {
    features.push(t('landing.pricing.features.analytics'))
  }
  if (offer.hasVisitorInsights) {
    features.push(t('landing.pricing.features.visitors'))
  }
  if (offer.hasSocialLinks) {
    features.push(t('landing.pricing.features.social'))
  }
  // if (offer.hasPortfolio) {
  //   features.push(t('landing.pricing.features.portfolio'))
  // }
  if (offer.maxAiScans < 0) {
    features.push(t('landing.pricing.features.aiUnlimited'))
  }
  else if (offer.maxAiScans > 0) {
    features.push(t('landing.pricing.features.aiScans', { n: offer.maxAiScans }))
  }

  return features
}

const plans = computed<LandingPlan[]>(() => {
  const offers = data.value?.items ?? []
  return offers.map((offer, index) => {
    const price = pickPrice(offer)
    const isFree = !price || price.priceAmount <= 0
    return {
      key: offer.id,
      name: offer.title,
      subtitle: offer.subtitle?.trim() || '',
      price: displayAmount(price),
      unit: displayUnit(price),
      seatNote: displaySeatNote(price),
      badge: price?.badgeLabel?.trim()
        || (price?.isPopular ? t('landing.pricing.popular') : null),
      cta: isFree
        ? t('landing.pricing.ctaFree')
        : t('landing.pricing.cta'),
      tone: planTone(index, offers.length),
      features: offerFeatures(offer),
    }
  })
})

const loadFailed = computed(() => data.value?.failed === true)
const isEmpty = computed(() => !pending.value && !loadFailed.value && plans.value.length === 0)
</script>

<template>
  <section
    id="tarifs"
    class="pricing"
  >
    <div class="panel reveal">
      <div class="intro">
        <span class="badge">
          <svg
            class="badge-icon"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"
            />
          </svg>
          {{ $t('landing.pricing.badge') }}
        </span>
        <h2 class="title">
          {{ $t('landing.pricing.title') }}
        </h2>
      </div>

      <div
        v-if="pending"
        class="grid"
        aria-busy="true"
        :aria-label="$t('landing.pricing.loading')"
      >
        <article
          v-for="index in 3"
          :key="`skeleton-${index}`"
          class="plan skeleton"
        >
          <div class="icon" />
          <div class="skel-line skel-title" />
          <div class="skel-line skel-sub" />
          <div class="skel-line skel-price" />
        </article>
      </div>

      <p
        v-else-if="loadFailed"
        class="status"
      >
        {{ $t('landing.pricing.error') }}
      </p>

      <p
        v-else-if="isEmpty"
        class="status"
      >
        {{ $t('landing.pricing.empty') }}
      </p>

      <div
        v-else
        class="grid"
      >
        <article
          v-for="(plan, index) in plans"
          :key="plan.key"
          class="plan"
          :class="plan.tone"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <div
            class="icon"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
            >
              <path
                fill="currentColor"
                d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
              />
            </svg>
          </div>

          <p
            v-if="plan.badge && plan.tone !== 'free'"
            class="popular"
          >
            {{ plan.badge }}
          </p>

          <h3>{{ plan.name }}</h3>
          <p
            v-if="plan.subtitle"
            class="subtitle"
          >
            {{ plan.subtitle }}
          </p>

          <p class="price">
            <strong>{{ plan.price }}</strong>
            <span>{{ plan.unit }}</span>
          </p>
          <p
            v-if="plan.seatNote"
            class="seat-note"
          >
            {{ plan.seatNote }}
          </p>

          <ul>
            <li
              v-for="feature in plan.features"
              :key="feature"
            >
              <span
                class="check"
                aria-hidden="true"
              >✓</span>
              {{ feature }}
            </li>
          </ul>

          <a
            class="cta"
            href="#telecharger"
          >{{ plan.cta }}</a>
        </article>
      </div>

      <p class="note">
        {{ $t('landing.pricing.note') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.pricing {
  padding: 0 12px 48px;
  background: #fff;
}

.panel {
  width: 100%;
  padding: clamp(40px, 5vw, 64px) clamp(20px, 3vw, 48px) 40px;
  border-radius: 36px;
  background: #000;
  border: 1px solid rgba(10, 107, 255, 0.55);
  box-shadow:
    0 0 0 1px rgba(10, 107, 255, 0.12),
    0 12px 40px rgba(10, 107, 255, 0.18),
    0 28px 64px rgba(12, 13, 16, 0.2);
}

.intro {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 48px;
}

.badge {
  margin-inline: auto;
  background: #fff;
  color: var(--do-blue);
  border: 1px solid #cfe0ff;
}

.badge-icon {
  flex-shrink: 0;
}

.title {
  margin: 18px 0 0;
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 240px));
  justify-content: center;
  gap: 28px 16px;
  align-items: stretch;
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 18px 16px 34px;
  border-radius: 20px;
  background: #fff;
  color: var(--do-ink);
}

.plan.premium {
  box-shadow: 0 0 0 2px #ffc400, 0 8px 24px rgba(255, 196, 0, 0.4);
}

.plan.pro {
  box-shadow: 0 0 0 2px var(--do-blue), 0 8px 24px rgba(10, 107, 255, 0.35);
}

.icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--do-blue-soft);
  color: var(--do-blue);
}

.plan.premium .icon {
  background: #ffc400;
  color: #111;
}

.plan.pro .icon {
  background: #111;
  color: #fff;
}

.icon svg {
  width: 18px;
  height: 18px;
}

.popular {
  margin: 10px 0 0;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.plan.premium .popular {
  background: #fff4cc;
  color: #8a6a00;
}

.plan.pro .popular {
  background: #ececef;
  color: #111;
}

h3 {
  margin: 10px 0 0;
  font-size: 1.05rem;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 2px 0 0;
  color: var(--do-muted);
  font-size: 0.82rem;
  line-height: 1.3;
}

.price {
  margin: 10px 0 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}

.price strong {
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.price span {
  color: var(--do-muted);
  font-weight: 600;
  font-size: 0.8rem;
}

.seat-note {
  margin: 4px 0 0;
  color: var(--do-muted);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.35;
}

ul {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
  flex: 0 0 auto;
}

li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--do-muted);
  line-height: 1.3;
  font-size: 0.8rem;
}

.check {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.62rem;
  font-weight: 800;
}

.plan.premium .check {
  background: #fff4cc;
  color: #b88600;
}

.plan.pro .check {
  background: #ececef;
  color: #111;
}

.cta {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--do-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
  text-align: center;
  box-shadow: 0 8px 18px rgba(10, 107, 255, 0.3);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.plan.premium .cta {
  background: #ffc400;
  color: #111;
  box-shadow: 0 8px 18px rgba(255, 196, 0, 0.35);
}

.note {
  margin: 40px 0 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
}

.status {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
}

.plan.skeleton {
  min-height: 220px;
  pointer-events: none;
}

.skel-line {
  border-radius: 8px;
  background: linear-gradient(90deg, #ececef 25%, #f6f6f8 50%, #ececef 75%);
  background-size: 200% 100%;
  animation: pulse 1.2s ease-in-out infinite;
}

.skel-title {
  margin-top: 12px;
  height: 18px;
  width: 72%;
}

.skel-sub {
  margin-top: 8px;
  height: 12px;
  width: 90%;
}

.skel-price {
  margin-top: 16px;
  height: 28px;
  width: 48%;
}

@keyframes pulse {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@media (max-width: 960px) {
  .pricing {
    padding: 0 10px 40px;
  }

  .panel {
    border-radius: 28px;
    padding: 36px 16px 32px;
  }

  .grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 220px));
    gap: 32px 14px;
  }

  .note {
    margin-top: 36px;
  }
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: minmax(0, 260px);
  }
}
</style>
