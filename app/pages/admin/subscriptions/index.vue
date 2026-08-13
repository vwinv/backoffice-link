<script setup lang="ts">
import type { AppClient } from '~/composables/useAdminClients'
import type {
  AdminSubscriptionItem,
  AdminSubscriptionsStats,
  SubscriptionOfferFilter,
  SubscriptionOfferPrice,
} from '~/composables/useAdminSubscriptions'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const { getStats, listOffers, listSubscriptions, createSubscription } = useAdminSubscriptions()
const { listClients } = useAdminClients()

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

const showCreate = ref(false)
const creating = ref(false)
const formError = ref<string | null>(null)
const clientQuery = ref('')
const clientResults = ref<AppClient[]>([])
const clientSearching = ref(false)
const selectedClient = ref<AppClient | null>(null)

const form = reactive({
  offerId: '',
  offerPriceId: '',
  status: 'ACTIVE' as 'ACTIVE' | 'TRIAL',
  purchasedSeats: 1,
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
let clientSearchTimer: ReturnType<typeof setTimeout> | null = null

const canCreate = computed(() => hasPermission('subscriptions.create'))

const selectedOffer = computed(() =>
  offers.value.find(item => item.id === form.offerId) ?? null,
)

const selectedPrices = computed(() => selectedOffer.value?.prices ?? [])

const isTeamOffer = computed(() => selectedOffer.value?.audience === 'TEAM')

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

function resetCreateForm() {
  form.offerId = offers.value.find(item => (item.prices?.length ?? 0) > 0)?.id ?? ''
  form.offerPriceId = selectedPrices.value[0]?.id ?? ''
  form.status = 'ACTIVE'
  form.purchasedSeats = Math.max(1, selectedOffer.value?.minSeats ?? 1)
  clientQuery.value = ''
  clientResults.value = []
  selectedClient.value = null
  formError.value = null
}

function openCreate() {
  resetCreateForm()
  onOfferChange()
  showCreate.value = true
}

function closeCreate() {
  if (creating.value) return
  showCreate.value = false
  formError.value = null
}

function onOfferChange() {
  const prices = selectedPrices.value
  form.offerPriceId = prices[0]?.id ?? ''
  form.purchasedSeats = Math.max(1, selectedOffer.value?.minSeats ?? 1)
}

function onClientSearchInput() {
  if (clientSearchTimer) clearTimeout(clientSearchTimer)
  clientSearchTimer = setTimeout(() => {
    searchClients()
  }, 250)
}

async function searchClients() {
  const q = clientQuery.value.trim()
  if (q.length < 2) {
    clientResults.value = []
    return
  }
  clientSearching.value = true
  try {
    const response = await listClients({ search: q, isActive: 'true', limit: 8 })
    clientResults.value = response.data
  }
  catch {
    clientResults.value = []
  }
  finally {
    clientSearching.value = false
  }
}

function selectClient(client: AppClient) {
  selectedClient.value = client
  clientQuery.value = ''
  clientResults.value = []
}

function clientLabel(client: AppClient) {
  return `${client.firstName} ${client.lastName}`.trim() || client.email
}

function priceLabel(price: SubscriptionOfferPrice) {
  const period
    = price.billingType === 'YEARLY'
      ? 'Annuel'
      : price.billingType === 'LIFETIME'
        ? 'À vie'
        : 'Mensuel'
  const amount = new Intl.NumberFormat('fr-FR').format(price.amount)
  return `${price.label || period} · ${amount} ${price.currency}`
}

async function onCreate() {
  if (!selectedClient.value || !form.offerId || !form.offerPriceId) {
    formError.value = 'Choisissez un client, une offre et un tarif.'
    return
  }
  creating.value = true
  formError.value = null
  try {
    await createSubscription({
      userId: selectedClient.value.id,
      offerId: form.offerId,
      offerPriceId: form.offerPriceId,
      status: form.status,
      purchasedSeats: isTeamOffer.value ? form.purchasedSeats : undefined,
    })
    showCreate.value = false
    page.value = 1
    await Promise.all([loadStats(), loadList()])
  }
  catch (err: unknown) {
    formError.value = err instanceof ApiError ? err.message : 'Création impossible'
  }
  finally {
    creating.value = false
  }
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
      <div v-if="canCreate" class="hero-actions">
        <button type="button" class="primary" @click="openCreate">
          Nouvel abonnement
        </button>
      </div>
    </header>

    <Teleport to="body">
      <div
        v-if="showCreate"
        class="modal-backdrop"
        @click.self="closeCreate"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-sub-title"
        >
          <header class="modal-head">
            <h2 id="create-sub-title">Nouvel abonnement</h2>
            <button type="button" class="modal-close" aria-label="Fermer" @click="closeCreate">×</button>
          </header>
          <form class="modal-body" @submit.prevent="onCreate">
            <p v-if="formError" class="banner-error" role="alert">{{ formError }}</p>

            <label class="full">
              <span>Client</span>
              <div v-if="selectedClient" class="selected-client">
                <strong>{{ clientLabel(selectedClient) }}</strong>
                <small>{{ selectedClient.email }}</small>
                <button type="button" class="btn-ghost" @click="selectedClient = null">
                  Changer
                </button>
              </div>
              <template v-else>
                <input
                  v-model="clientQuery"
                  type="search"
                  placeholder="Rechercher par nom ou e-mail…"
                  autocomplete="off"
                  @input="onClientSearchInput"
                >
                <p v-if="clientSearching" class="hint">Recherche…</p>
                <ul v-else-if="clientResults.length" class="client-results">
                  <li
                    v-for="client in clientResults"
                    :key="client.id"
                  >
                    <button type="button" @click="selectClient(client)">
                      <strong>{{ clientLabel(client) }}</strong>
                      <small>{{ client.email }}</small>
                    </button>
                  </li>
                </ul>
                <p v-else-if="clientQuery.trim().length >= 2" class="hint">
                  Aucun client trouvé.
                </p>
              </template>
            </label>

            <div class="create-grid">
              <label>
                <span>Offre</span>
                <select v-model="form.offerId" required @change="onOfferChange">
                  <option value="" disabled>Choisir une offre</option>
                  <option
                    v-for="offer in offers.filter(item => (item.prices?.length ?? 0) > 0)"
                    :key="offer.id"
                    :value="offer.id"
                  >
                    {{ offer.title }}
                    {{ offer.audience === 'TEAM' ? '· Pro' : '· Perso' }}
                  </option>
                </select>
              </label>
              <label>
                <span>Tarif</span>
                <select v-model="form.offerPriceId" required :disabled="!selectedPrices.length">
                  <option
                    v-for="price in selectedPrices"
                    :key="price.id"
                    :value="price.id"
                  >
                    {{ priceLabel(price) }}
                  </option>
                </select>
              </label>
              <label>
                <span>Statut</span>
                <select v-model="form.status">
                  <option value="ACTIVE">Actif</option>
                  <option value="TRIAL">Essai</option>
                </select>
              </label>
              <label v-if="isTeamOffer">
                <span>Sièges</span>
                <input
                  v-model.number="form.purchasedSeats"
                  type="number"
                  :min="selectedOffer?.minSeats || 1"
                  required
                >
              </label>
            </div>

            <p class="hint">
              L’abonnement en cours du client (s’il existe) sera annulé et
              remplacé. Une offre pro lui permettra de créer son équipe dans l’app.
            </p>

            <footer class="modal-actions">
              <button type="button" class="btn-ghost" :disabled="creating" @click="closeCreate">
                Annuler
              </button>
              <button class="primary" type="submit" :disabled="creating || !selectedClient">
                {{ creating ? 'Création…' : 'Créer l’abonnement' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>

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
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  background: linear-gradient(135deg, rgba(10, 107, 255, 0.1), transparent 55%), var(--do-surface);
}
.hero-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.primary, .btn-ghost {
  min-height: 34px; padding: 0 14px; border-radius: 8px; font-weight: 700;
  cursor: pointer; font-size: 0.875rem;
}
.btn-ghost { border: 1.5px solid var(--do-line); background: #fff; }
.primary { border: 0; background: var(--do-blue); color: #fff; }
.primary:disabled, .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
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

.modal-backdrop {
  position: fixed; inset: 0; z-index: 80;
  display: grid; place-items: center; padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}
.modal {
  width: min(560px, 100%);
  max-height: min(90vh, 720px);
  overflow: auto;
  border-radius: 16px;
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--do-line);
}
.modal-head h2 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.modal-close {
  width: 32px; height: 32px; border: 0; border-radius: 8px;
  background: transparent; font-size: 1.4rem; line-height: 1; cursor: pointer; color: var(--do-muted);
}
.modal-close:hover { background: var(--do-surface-soft); color: inherit; }
.modal-body { padding: 18px; display: grid; gap: 14px; }
.create-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
label { display: grid; gap: 6px; font-size: 0.85rem; font-weight: 600; }
label.full { grid-column: 1 / -1; }
.hint { margin: 0; color: var(--do-muted); font-size: 0.8rem; font-weight: 500; }
.selected-client {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 12px; border-radius: 10px;
  background: var(--do-surface-soft); border: 1px solid var(--do-line);
}
.selected-client strong { display: block; }
.selected-client small { color: var(--do-muted); }
.client-results {
  margin: 0; padding: 0; list-style: none;
  border: 1.5px solid var(--do-line); border-radius: 10px; overflow: hidden;
}
.client-results button {
  width: 100%; text-align: left; padding: 10px 12px; border: 0;
  background: #fff; cursor: pointer; display: grid; gap: 2px;
}
.client-results button:hover { background: var(--do-surface-soft); }
.client-results strong { display: block; }
.client-results small { color: var(--do-muted); }

@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .panels { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .stats-grid, .filters, .create-grid { grid-template-columns: 1fr; }
}
</style>
