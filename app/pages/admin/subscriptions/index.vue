<script setup lang="ts">
import type {
  AdminSubscriptionItem,
  AdminSubscriptionsStats,
  SubscriptionOfferFilter,
} from '~/composables/useAdminSubscriptions'

definePageMeta({
  layout: 'admin',
})

const { getStats, listOffers, listSubscriptions } = useAdminSubscriptions()

const search = ref('')
const status = ref('')
const offerId = ref('')
const page = ref(1)
const limit = 20

const stats = ref<AdminSubscriptionsStats | null>(null)
const offers = ref<SubscriptionOfferFilter[]>([])
const items = ref<AdminSubscriptionItem[]>([])
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })
const loading = ref(false)
const statsLoading = ref(true)
const error = ref<string | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await getStats()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError
      ? err.message
      : 'Impossible de charger les statistiques'
  }
  finally {
    statsLoading.value = false
  }
}

async function loadList() {
  loading.value = true
  error.value = null
  try {
    const response = await listSubscriptions({
      search: search.value,
      status: status.value || undefined,
      offerId: offerId.value || undefined,
      page: page.value,
      limit,
    })
    items.value = response.data
    meta.value = response.meta
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError
      ? err.message
      : 'Impossible de charger les abonnements'
  }
  finally {
    loading.value = false
  }
}

async function loadOffers() {
  try {
    offers.value = await listOffers()
  }
  catch {
    offers.value = []
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadList()
  }, 300)
}

function onFilterChange() {
  page.value = 1
  loadList()
}

function goToPage(next: number) {
  if (next < 1 || next > meta.value.totalPages) return
  page.value = next
  loadList()
}

function formatNumber(value: number | undefined) {
  if (value == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(value)
}

function formatMoney(value: number | undefined, currency = 'FCFA') {
  if (value == null) return '—'
  return `${new Intl.NumberFormat('fr-FR').format(value)} ${currency}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

function statusLabel(value: string) {
  const map: Record<string, string> = {
    TRIAL: 'Essai',
    ACTIVE: 'Actif',
    CANCELLED: 'Annulé',
    EXPIRED: 'Expiré',
    PAST_DUE: 'Impayé',
  }
  return map[value] || value
}

function statusClass(value: string) {
  if (value === 'ACTIVE') return 'badge-ok'
  if (value === 'TRIAL') return 'badge-trial'
  if (value === 'PAST_DUE') return 'badge-warn'
  if (value === 'CANCELLED' || value === 'EXPIRED') return 'badge-off'
  return 'badge-off'
}

function billingLabel(value: string) {
  const map: Record<string, string> = {
    MONTHLY: 'Mensuel',
    YEARLY: 'Annuel',
    LIFETIME: 'À vie',
  }
  return map[value] || value
}

function subscriberLabel(item: AdminSubscriptionItem) {
  if (item.user) return item.user.fullName
  if (item.team) return item.team.name
  return '—'
}

function subscriberSub(item: AdminSubscriptionItem) {
  if (item.user) return item.user.email
  if (item.team) return `Équipe · /${item.team.slug}`
  return ''
}

const overviewCards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    {
      label: 'CA total',
      value: formatMoney(s.revenue.total, s.revenue.currency),
      hint: `${formatMoney(s.revenue.active, s.revenue.currency)} en cours`,
    },
    {
      label: 'Abonnements actifs',
      value: formatNumber(s.totals.active),
      hint: `${s.totals.paying} payants · ${s.totals.trial} en essai`,
    },
    {
      label: 'Total',
      value: formatNumber(s.totals.total),
      hint: `+${s.totals.newLast30Days} sur 30 j`,
    },
    {
      label: 'Périodicité',
      value: `${formatNumber(s.billing.monthly)} / ${formatNumber(s.billing.yearly)}`,
      hint: 'Mensuel / annuel (en cours)',
    },
  ]
})

await Promise.all([loadStats(), loadOffers(), loadList()])
</script>

<template>
  <section class="subs-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Monétisation</p>
        <h1>Abonnements</h1>
        <p class="lead">
          Statistiques et liste des abonnements premium DropOne.
        </p>
      </div>
    </header>

    <p v-if="error" class="banner-error" role="alert">{{ error }}</p>

    <div class="stats-grid">
      <article
        v-for="card in overviewCards"
        :key="card.label"
        class="stat-card"
      >
        <span class="stat-label">{{ card.label }}</span>
        <strong>{{ statsLoading ? '…' : card.value }}</strong>
        <small>{{ card.hint }}</small>
      </article>
    </div>

    <div v-if="stats" class="panels">
      <section class="panel">
        <h2>Par statut</h2>
        <ul class="status-list">
          <li v-for="item in stats.byStatus" :key="item.status">
            <span class="badge" :class="statusClass(item.status)">{{ item.label }}</span>
            <strong>{{ formatNumber(item.count) }}</strong>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Par offre</h2>
        <div v-if="stats.byOffer.length" class="offer-list">
          <article
            v-for="offer in stats.byOffer"
            :key="offer.offerId"
            class="offer-row"
          >
            <div>
              <strong>{{ offer.title }}</strong>
              <small>
                {{ offer.activeCount }} en cours · {{ offer.subscriptionsCount }} au total
              </small>
            </div>
            <span class="offer-revenue">
              {{ formatMoney(offer.revenue, stats.revenue.currency) }}
            </span>
          </article>
        </div>
        <p v-else class="muted">Aucune offre avec abonnement.</p>
      </section>
    </div>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher client, équipe ou offre…"
        @input="onSearchInput"
      >
      <select v-model="status" @change="onFilterChange">
        <option value="">Tous les statuts</option>
        <option value="ACTIVE">Actifs</option>
        <option value="TRIAL">Essai</option>
        <option value="PAST_DUE">Impayés</option>
        <option value="CANCELLED">Annulés</option>
        <option value="EXPIRED">Expirés</option>
      </select>
      <select v-model="offerId" @change="onFilterChange">
        <option value="">Toutes les offres</option>
        <option
          v-for="offer in offers"
          :key="offer.id"
          :value="offer.id"
        >
          {{ offer.title }}
        </option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Abonné</th>
            <th>Offre</th>
            <th>Statut</th>
            <th>Période</th>
            <th>Prix</th>
            <th>Fin</th>
            <th>Créé</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td colspan="7" class="empty">Chargement…</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="7" class="empty">Aucun abonnement trouvé.</td>
          </tr>
          <tr v-for="item in items" :key="item.id">
            <td>
              <div class="user-cell">
                <span class="avatar">
                  <img
                    v-if="item.user?.avatarUrl"
                    :src="item.user.avatarUrl"
                    :alt="subscriberLabel(item)"
                  >
                  <template v-else>
                    {{ (subscriberLabel(item)[0] || '?').toUpperCase() }}
                  </template>
                </span>
                <span>
                  <strong>
                    <NuxtLink
                      v-if="item.user"
                      :to="`/admin/clients/${item.user.id}`"
                      class="name-link"
                    >
                      {{ subscriberLabel(item) }}
                    </NuxtLink>
                    <template v-else>{{ subscriberLabel(item) }}</template>
                  </strong>
                  <small>{{ subscriberSub(item) }}</small>
                </span>
              </div>
            </td>
            <td>
              <strong>{{ item.offer?.title || item.plan?.name || '—' }}</strong>
            </td>
            <td>
              <span class="badge" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td>{{ billingLabel(item.billingPeriod) }}</td>
            <td>
              <template v-if="item.price">
                {{ formatMoney(item.price.amount, item.price.currency) }}
              </template>
              <template v-else>—</template>
            </td>
            <td>{{ formatDate(item.currentPeriodEnd) }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="meta.totalPages > 1" class="pager">
      <button type="button" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">
        Précédent
      </button>
      <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <button
        type="button"
        :disabled="page >= meta.totalPages || loading"
        @click="goToPage(page + 1)"
      >
        Suivant
      </button>
    </div>
  </section>
</template>

<style scoped>
.subs-page { display: flex; flex-direction: column; gap: 18px; width: 100%; }
.hero, .stat-card, .panel, .table-wrap {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}
.hero {
  padding: 22px 24px;
  background: linear-gradient(135deg, rgba(10, 107, 255, 0.1), transparent 55%), var(--do-surface);
}
.eyebrow {
  margin: 0; display: inline-flex; padding: 6px 12px; border-radius: 999px;
  background: var(--do-blue-soft); color: var(--do-blue);
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
}
h1 { margin: 12px 0 8px; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; }
.lead { margin: 0; color: var(--do-muted); }
.banner-error {
  margin: 0; padding: 12px; border-radius: 12px;
  background: #fff1f1; color: #b42318; font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  padding: 18px 20px;
  display: grid;
  gap: 6px;
}
.stat-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--do-muted);
}
.stat-card strong {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.stat-card small { color: var(--do-muted); }

.panels {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 12px;
}
.panel { padding: 18px 20px; display: grid; gap: 12px; align-content: start; }
.panel h2 { margin: 0; font-size: 1rem; font-weight: 800; }
.status-list {
  margin: 0; padding: 0; list-style: none;
  display: grid; gap: 10px;
}
.status-list li {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; padding: 10px 12px;
  border-radius: 12px; background: var(--do-surface-soft); border: 1px solid var(--do-line);
}
.offer-list { display: grid; gap: 8px; }
.offer-row {
  display: flex; justify-content: space-between; gap: 12px; align-items: center;
  padding: 12px 14px; border-radius: 12px;
  background: var(--do-surface-soft); border: 1px solid var(--do-line);
}
.offer-row strong { display: block; }
.offer-row small { color: var(--do-muted); }
.offer-revenue { font-weight: 800; white-space: nowrap; }

.filters { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 12px; }
input, select {
  min-height: 40px; padding: 0 12px; border: 1.5px solid var(--do-line);
  border-radius: 10px; font: inherit; background: #fff;
}

table { width: 100%; border-collapse: collapse; min-width: 960px; }
th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--do-line); }
th {
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--do-muted); background: var(--do-surface-soft);
}
.empty { text-align: center; color: var(--do-muted); padding: 28px; }
.user-cell { display: flex; gap: 12px; align-items: center; }
.user-cell strong { display: block; }
.user-cell small { color: var(--do-muted); }
.name-link { color: inherit; text-decoration: none; }
.name-link:hover { color: var(--do-blue); }
.avatar {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
  background: var(--do-blue); color: #fff; font-weight: 800; overflow: hidden; flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

.badge {
  display: inline-flex; min-height: 26px; padding: 0 10px; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700;
}
.badge-ok { background: #e8f8ef; color: #1b7a45; }
.badge-trial { background: var(--do-blue-soft); color: var(--do-blue); }
.badge-warn { background: #fff6e8; color: #9a6700; }
.badge-off { background: #f1f2f4; color: #5b616e; }

.pager { display: flex; justify-content: center; gap: 16px; align-items: center; }
.pager button {
  min-height: 32px; padding: 0 12px; border-radius: 8px; font-weight: 700;
  font-size: 0.875rem; cursor: pointer; border: 1.5px solid var(--do-line); background: #fff;
}
.pager button:disabled { opacity: 0.45; cursor: not-allowed; }
.muted { margin: 0; color: var(--do-muted); }

@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .panels { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .stats-grid, .filters { grid-template-columns: 1fr; }
}
</style>
