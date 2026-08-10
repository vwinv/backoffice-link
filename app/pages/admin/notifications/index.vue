<script setup lang="ts">
import type {
  NotificationAudience,
  NotificationCampaign,
  NotificationStats,
} from '~/composables/useAdminNotifications'
import type { AppClient } from '~/composables/useAdminClients'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const { getStats, listCampaigns, sendCampaign } = useAdminNotifications()
const { listClients } = useAdminClients()

const search = ref('')
const status = ref('')
const page = ref(1)
const limit = 20

const stats = ref<NotificationStats | null>(null)
const campaigns = ref<NotificationCampaign[]>([])
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })
const loading = ref(false)
const statsLoading = ref(true)
const error = ref<string | null>(null)

const showCompose = ref(false)
const sending = ref(false)
const formError = ref<string | null>(null)
const form = reactive({
  title: '',
  body: '',
  audience: 'ALL' as NotificationAudience,
})

const selectedClients = ref<AppClient[]>([])
const clientSearch = ref('')
const clientResults = ref<AppClient[]>([])
const clientSearching = ref(false)
let clientSearchTimer: ReturnType<typeof setTimeout> | null = null
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

async function loadCampaigns() {
  loading.value = true
  error.value = null
  try {
    const response = await listCampaigns({
      search: search.value,
      status: status.value || undefined,
      page: page.value,
      limit,
    })
    campaigns.value = response.data
    meta.value = response.meta
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError
      ? err.message
      : 'Impossible de charger les campagnes'
  }
  finally {
    loading.value = false
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadCampaigns()
  }, 300)
}

function onFilterChange() {
  page.value = 1
  loadCampaigns()
}

function goToPage(next: number) {
  if (next < 1 || next > meta.value.totalPages) return
  page.value = next
  loadCampaigns()
}

function openCompose() {
  form.title = ''
  form.body = ''
  form.audience = 'ALL'
  formError.value = null
  selectedClients.value = []
  clientSearch.value = ''
  clientResults.value = []
  showCompose.value = true
}

function closeCompose() {
  if (sending.value) return
  showCompose.value = false
}

function onClientSearchInput() {
  if (clientSearchTimer) clearTimeout(clientSearchTimer)
  clientSearchTimer = setTimeout(async () => {
    const q = clientSearch.value.trim()
    if (q.length < 2) {
      clientResults.value = []
      return
    }
    clientSearching.value = true
    try {
      const response = await listClients({ search: q, page: 1, limit: 8 })
      const selectedIds = new Set(selectedClients.value.map(c => c.id))
      clientResults.value = response.data.filter(c => !selectedIds.has(c.id))
    }
    catch {
      clientResults.value = []
    }
    finally {
      clientSearching.value = false
    }
  }, 250)
}

function addClient(client: AppClient) {
  if (selectedClients.value.some(c => c.id === client.id)) return
  selectedClients.value.push(client)
  clientResults.value = clientResults.value.filter(c => c.id !== client.id)
  clientSearch.value = ''
}

function removeClient(id: string) {
  selectedClients.value = selectedClients.value.filter(c => c.id !== id)
}

function fullName(client: AppClient) {
  return `${client.firstName} ${client.lastName}`.trim() || client.email
}

function formatNumber(value: number | undefined) {
  if (value == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(value)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function audienceLabel(value: string) {
  const map: Record<string, string> = {
    ALL: 'Tous les clients',
    PREMIUM: 'Clients premium',
    FREE: 'Clients gratuits',
    USER_IDS: 'Clients ciblés',
  }
  return map[value] || value
}

function statusLabel(value: string) {
  const map: Record<string, string> = {
    DRAFT: 'Brouillon',
    SENDING: 'Envoi…',
    SENT: 'Envoyée',
    FAILED: 'Échec',
  }
  return map[value] || value
}

function statusClass(value: string) {
  if (value === 'SENT') return 'badge-ok'
  if (value === 'SENDING') return 'badge-trial'
  if (value === 'FAILED') return 'badge-danger'
  return 'badge-off'
}

const overviewCards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Campagnes', value: formatNumber(s.campaigns), hint: `${s.sent} envoyées` },
    { label: 'Livrées (inbox)', value: formatNumber(s.delivered), hint: `${s.unread} non lues` },
    { label: 'Échecs', value: formatNumber(s.failed), hint: 'Campagnes en erreur' },
    { label: 'Tokens push', value: formatNumber(s.pushTokens), hint: 'Appareils enregistrés' },
  ]
})

async function onSend() {
  formError.value = null
  if (form.audience === 'USER_IDS' && selectedClients.value.length === 0) {
    formError.value = 'Ajoutez au moins un client ciblé'
    return
  }
  sending.value = true
  try {
    await sendCampaign({
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      userIds: form.audience === 'USER_IDS'
        ? selectedClients.value.map(c => c.id)
        : undefined,
    })
    showCompose.value = false
    await Promise.all([loadStats(), loadCampaigns()])
  }
  catch (err: unknown) {
    formError.value = err instanceof ApiError ? err.message : 'Envoi impossible'
  }
  finally {
    sending.value = false
  }
}

await Promise.all([loadStats(), loadCampaigns()])
</script>

<template>
  <section class="notif-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Engagement</p>
        <h1>Notifications</h1>
        <p class="lead">
          Envoyez des messages ciblés aux utilisateurs de l’app.
        </p>
      </div>
      <button
        v-if="hasPermission('notifications.send')"
        type="button"
        class="primary"
        @click="openCompose"
      >
        Nouvelle notification
      </button>
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

    <div class="filters">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher une campagne…"
        @input="onSearchInput"
      >
      <select v-model="status" @change="onFilterChange">
        <option value="">Tous les statuts</option>
        <option value="SENT">Envoyées</option>
        <option value="FAILED">Échecs</option>
        <option value="SENDING">En cours</option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Campagne</th>
            <th>Audience</th>
            <th>Statut</th>
            <th>Cibles</th>
            <th>Livrées</th>
            <th>Lues</th>
            <th>Envoyée</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && campaigns.length === 0">
            <td colspan="7" class="empty">Chargement…</td>
          </tr>
          <tr v-else-if="campaigns.length === 0">
            <td colspan="7" class="empty">Aucune campagne pour le moment.</td>
          </tr>
          <tr v-for="item in campaigns" :key="item.id">
            <td>
              <strong>{{ item.title }}</strong>
              <small class="body-preview">{{ item.body }}</small>
            </td>
            <td>{{ audienceLabel(item.audience) }}</td>
            <td>
              <span class="badge" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td>{{ formatNumber(item.targetCount) }}</td>
            <td>{{ formatNumber(item.deliveredCount) }}</td>
            <td>{{ formatNumber(item.readCount) }}</td>
            <td>{{ formatDate(item.sentAt || item.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="meta.totalPages > 1" class="pager">
      <button type="button" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">Précédent</button>
      <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <button type="button" :disabled="page >= meta.totalPages || loading" @click="goToPage(page + 1)">Suivant</button>
    </div>

    <Teleport to="body">
      <div
        v-if="showCompose"
        class="modal-backdrop"
        @click.self="closeCompose"
      >
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="notif-title">
          <header class="modal-head">
            <h2 id="notif-title">Nouvelle notification</h2>
            <button type="button" class="modal-close" aria-label="Fermer" @click="closeCompose">×</button>
          </header>
          <form class="modal-body" @submit.prevent="onSend">
            <p v-if="formError" class="banner-error" role="alert">{{ formError }}</p>

            <label>
              <span>Titre</span>
              <input v-model="form.title" required minlength="2" maxlength="120" placeholder="Ex. Nouvelle offre Premium">
            </label>

            <label>
              <span>Message</span>
              <textarea
                v-model="form.body"
                required
                minlength="2"
                maxlength="1000"
                rows="4"
                placeholder="Texte affiché dans l’app…"
              />
            </label>

            <fieldset class="audience">
              <legend>Audience</legend>
              <label class="radio">
                <input v-model="form.audience" type="radio" value="ALL">
                <span>Tous les clients actifs</span>
              </label>
              <label class="radio">
                <input v-model="form.audience" type="radio" value="PREMIUM">
                <span>Clients premium</span>
              </label>
              <label class="radio">
                <input v-model="form.audience" type="radio" value="FREE">
                <span>Clients gratuits</span>
              </label>
              <label class="radio">
                <input v-model="form.audience" type="radio" value="USER_IDS">
                <span>Clients ciblés</span>
              </label>
            </fieldset>

            <div v-if="form.audience === 'USER_IDS'" class="target-box">
              <label>
                <span>Rechercher un client</span>
                <input
                  v-model="clientSearch"
                  type="search"
                  placeholder="Nom ou email…"
                  @input="onClientSearchInput"
                >
              </label>
              <div v-if="clientSearching" class="muted">Recherche…</div>
              <ul v-else-if="clientResults.length" class="client-results">
                <li v-for="client in clientResults" :key="client.id">
                  <button type="button" @click="addClient(client)">
                    <strong>{{ fullName(client) }}</strong>
                    <small>{{ client.email }}</small>
                  </button>
                </li>
              </ul>
              <div v-if="selectedClients.length" class="chips">
                <span
                  v-for="client in selectedClients"
                  :key="client.id"
                  class="chip"
                >
                  {{ fullName(client) }}
                  <button type="button" aria-label="Retirer" @click="removeClient(client.id)">×</button>
                </span>
              </div>
            </div>

            <p class="hint">
              Livraison immédiate dans l’inbox app. Le push FCM sera branché ensuite
              ({{ stats?.pushTokens ?? 0 }} token(s) déjà enregistrés).
            </p>

            <footer class="modal-actions">
              <button type="button" class="ghost" :disabled="sending" @click="closeCompose">Annuler</button>
              <button type="submit" class="primary" :disabled="sending">
                {{ sending ? 'Envoi…' : 'Envoyer' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.notif-page { display: flex; flex-direction: column; gap: 18px; width: 100%; }
.hero, .stat-card, .table-wrap {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}
.hero {
  display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap;
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
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { padding: 18px 20px; display: grid; gap: 6px; }
.stat-label {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--do-muted);
}
.stat-card strong { font-size: 1.35rem; font-weight: 800; }
.stat-card small { color: var(--do-muted); }
.filters { display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; }
input, select, textarea {
  min-height: 40px; padding: 10px 12px; border: 1.5px solid var(--do-line);
  border-radius: 10px; font: inherit; background: #fff; width: 100%;
}
textarea { min-height: 110px; resize: vertical; }
table { width: 100%; border-collapse: collapse; min-width: 900px; }
th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--do-line); vertical-align: top; }
th {
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--do-muted); background: var(--do-surface-soft);
}
td strong { display: block; }
.body-preview {
  display: block; margin-top: 4px; color: var(--do-muted);
  max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.empty { text-align: center; color: var(--do-muted); padding: 28px; }
.badge {
  display: inline-flex; min-height: 26px; padding: 0 10px; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700;
}
.badge-ok { background: #e8f8ef; color: #1b7a45; }
.badge-trial { background: var(--do-blue-soft); color: var(--do-blue); }
.badge-danger { background: #fff1f1; color: #b42318; }
.badge-off { background: #f1f2f4; color: #5b616e; }
.primary, .ghost, .pager button {
  min-height: 34px; padding: 0 14px; border-radius: 8px; font-weight: 700;
  font-size: 0.875rem; cursor: pointer; line-height: 1;
}
.primary { border: 0; background: var(--do-blue); color: #fff; }
.ghost, .pager button { border: 1.5px solid var(--do-line); background: #fff; }
.primary:disabled, .ghost:disabled, .pager button:disabled { opacity: 0.45; cursor: not-allowed; }
.pager { display: flex; justify-content: center; gap: 16px; align-items: center; }

.modal-backdrop {
  position: fixed; inset: 0; z-index: 80;
  display: grid; place-items: center; padding: 20px;
  background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px);
}
.modal {
  width: min(560px, 100%); max-height: min(90vh, 780px); overflow: auto;
  border-radius: 16px; background: var(--do-surface);
  border: 1.5px solid var(--do-line); box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--do-line);
  position: sticky; top: 0; background: var(--do-surface); z-index: 1;
}
.modal-head h2 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.modal-close {
  width: 32px; height: 32px; border: 0; border-radius: 8px;
  background: transparent; font-size: 1.4rem; line-height: 1; cursor: pointer; color: var(--do-muted);
}
.modal-body { padding: 18px; display: grid; gap: 14px; }
label { display: grid; gap: 6px; font-size: 0.85rem; font-weight: 600; }
.audience {
  margin: 0; padding: 12px; border-radius: 12px; border: 1px solid var(--do-line);
  display: grid; gap: 8px;
}
.audience legend { padding: 0 4px; font-weight: 800; font-size: 0.85rem; }
.radio { display: flex; align-items: center; gap: 10px; font-weight: 600; }
.target-box { display: grid; gap: 10px; }
.client-results { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.client-results button {
  width: 100%; text-align: left; border: 1px solid var(--do-line); border-radius: 10px;
  background: var(--do-surface-soft); padding: 10px 12px; cursor: pointer;
}
.client-results strong { display: block; }
.client-results small { color: var(--do-muted); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 28px; padding: 0 8px 0 10px; border-radius: 999px;
  background: var(--do-blue-soft); color: var(--do-blue); font-size: 0.8rem; font-weight: 700;
}
.chip button {
  border: 0; background: transparent; cursor: pointer; color: inherit; font-size: 1rem; line-height: 1;
}
.hint { margin: 0; color: var(--do-muted); font-size: 0.85rem; }
.muted { color: var(--do-muted); font-size: 0.85rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

@media (max-width: 1000px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .stats-grid, .filters { grid-template-columns: 1fr; }
}
</style>
