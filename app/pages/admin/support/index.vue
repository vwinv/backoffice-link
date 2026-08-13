<script setup lang="ts">
import type {
  SupportStats,
  SupportTicketDetail,
  SupportTicketListItem,
} from '~/composables/useAdminSupport'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const { getStats, listTickets, getTicket, replyTicket } = useAdminSupport()

const search = ref('')
const status = ref('')
const page = ref(1)
const limit = 20

const stats = ref<SupportStats | null>(null)
const items = ref<SupportTicketListItem[]>([])
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })
const loading = ref(false)
const error = ref<string | null>(null)

const showDetail = ref(false)
const detail = ref<SupportTicketDetail | null>(null)
const detailLoading = ref(false)
const replyBody = ref('')
const replySaving = ref(false)
const replyError = ref<string | null>(null)
const replyFlash = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const canReply = computed(
  () => hasPermission('support.reply') || hasPermission('*'),
)

async function loadStats() {
  try {
    stats.value = await getStats()
  }
  catch {
    stats.value = null
  }
}

async function loadList() {
  loading.value = true
  error.value = null
  try {
    const response = await listTickets({
      search: search.value,
      status: status.value || undefined,
      page: page.value,
      limit,
    })
    items.value = response.data
    meta.value = response.meta
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Chargement impossible'
  }
  finally {
    loading.value = false
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

async function openTicket(item: SupportTicketListItem) {
  showDetail.value = true
  detail.value = null
  replyBody.value = ''
  replyError.value = null
  replyFlash.value = false
  detailLoading.value = true
  try {
    detail.value = await getTicket(item.id)
  }
  catch (err: unknown) {
    replyError.value = err instanceof ApiError ? err.message : 'Ticket introuvable'
  }
  finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  if (replySaving.value) return
  showDetail.value = false
  detail.value = null
}

async function onReply() {
  if (!detail.value || !canReply.value) return
  if (replyBody.value.trim().length < 5) {
    replyError.value = 'Réponse trop courte'
    return
  }
  replySaving.value = true
  replyError.value = null
  replyFlash.value = false
  try {
    await replyTicket(detail.value.id, replyBody.value.trim())
    detail.value = await getTicket(detail.value.id)
    replyBody.value = ''
    replyFlash.value = true
    await Promise.all([loadList(), loadStats()])
  }
  catch (err: unknown) {
    replyError.value = err instanceof ApiError ? err.message : 'Envoi impossible'
  }
  finally {
    replySaving.value = false
  }
}

function statusLabel(value: string) {
  if (value === 'OPEN') return 'Ouvert'
  if (value === 'REPLIED') return 'Répondu'
  if (value === 'CLOSED') return 'Clôturé'
  return value
}

function statusClass(value: string) {
  if (value === 'OPEN') return 'warn'
  if (value === 'REPLIED') return 'ok'
  return 'off'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

await Promise.all([loadStats(), loadList()])
</script>

<template>
  <section class="support-page">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Relation client
        </p>
        <h1>Support</h1>
        <p class="lead">
          Tickets provenant du formulaire de la landing. Répondez par e-mail ; le client clôture via le lien.
        </p>
      </div>
    </header>

    <p
      v-if="error"
      class="banner-error"
      role="alert"
    >
      {{ error }}
    </p>

    <div
      v-if="stats"
      class="stats-grid"
    >
      <article class="stat-card">
        <span>Ouverts</span>
        <strong>{{ stats.open }}</strong>
      </article>
      <article class="stat-card">
        <span>Répondus</span>
        <strong>{{ stats.replied }}</strong>
      </article>
      <article class="stat-card">
        <span>Clôturés</span>
        <strong>{{ stats.closed }}</strong>
      </article>
      <article class="stat-card">
        <span>Total</span>
        <strong>{{ stats.total }}</strong>
      </article>
    </div>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher nom, e-mail, téléphone…"
        @input="onSearchInput"
      >
      <select
        v-model="status"
        @change="onFilterChange"
      >
        <option value="">
          Tous les statuts
        </option>
        <option value="OPEN">
          Ouverts
        </option>
        <option value="REPLIED">
          Répondus
        </option>
        <option value="CLOSED">
          Clôturés
        </option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Message</th>
            <th>Statut</th>
            <th>Réponses</th>
            <th>Créé</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td
              colspan="6"
              class="empty"
            >
              Chargement…
            </td>
          </tr>
          <tr v-else-if="!loading && items.length === 0">
            <td
              colspan="6"
              class="empty"
            >
              Aucun ticket.
            </td>
          </tr>
          <tr
            v-for="item in items"
            :key="item.id"
          >
            <td>
              <div class="cell-main">
                <strong>{{ item.fullName }}</strong>
                <small>{{ item.email }}</small>
                <small v-if="item.phone">{{ item.phone }}</small>
              </div>
            </td>
            <td class="preview">
              {{ item.messagePreview }}
            </td>
            <td>
              <span
                class="pill"
                :class="statusClass(item.status)"
              >{{ statusLabel(item.status) }}</span>
            </td>
            <td>{{ item.repliesCount }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <button
                type="button"
                class="ghost"
                @click="openTicket(item)"
              >
                Ouvrir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="meta.totalPages > 1"
      class="pager"
    >
      <button
        type="button"
        class="ghost"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        Précédent
      </button>
      <span>{{ page }} / {{ meta.totalPages }}</span>
      <button
        type="button"
        class="ghost"
        :disabled="page >= meta.totalPages"
        @click="goToPage(page + 1)"
      >
        Suivant
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="showDetail"
        class="modal-backdrop"
        @click.self="closeDetail"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
        >
          <header class="modal-head">
            <h2>Ticket support</h2>
            <button
              type="button"
              class="modal-close"
              @click="closeDetail"
            >
              ×
            </button>
          </header>

          <div
            v-if="detailLoading"
            class="modal-body muted"
          >
            Chargement…
          </div>
          <div
            v-else-if="detail"
            class="modal-body"
          >
            <div class="ticket-meta">
              <div>
                <strong>{{ detail.fullName }}</strong>
                <p>{{ detail.email }}</p>
                <p v-if="detail.phone">
                  {{ detail.phone }}
                </p>
              </div>
              <span
                class="pill"
                :class="statusClass(detail.status)"
              >{{ statusLabel(detail.status) }}</span>
            </div>

            <section class="bubble inbound">
              <header>Message initial · {{ formatDate(detail.createdAt) }}</header>
              <p>{{ detail.message }}</p>
            </section>

            <section
              v-for="reply in detail.replies"
              :key="reply.id"
              class="bubble outbound"
            >
              <header>
                Réponse
                <template v-if="reply.sentBy">
                  · {{ reply.sentBy.name }}
                </template>
                · {{ formatDate(reply.createdAt) }}
              </header>
              <p>{{ reply.body }}</p>
            </section>

            <form
              v-if="detail.status !== 'CLOSED' && canReply"
              class="reply-form"
              @submit.prevent="onReply"
            >
              <p
                v-if="replyError"
                class="banner-error"
              >
                {{ replyError }}
              </p>
              <p
                v-if="replyFlash"
                class="flash"
              >
                Réponse envoyée par e-mail.
              </p>
              <label>
                <span>Votre réponse (envoyée par e-mail)</span>
                <textarea
                  v-model="replyBody"
                  rows="5"
                  required
                  minlength="5"
                  placeholder="Expliquez la solution au client…"
                />
              </label>
              <p class="hint">
                Un lien « Si nous avons répondu à votre problème, cliquez ici pour clôturer le ticket » sera ajouté automatiquement.
              </p>
              <div class="modal-actions">
                <button
                  type="button"
                  class="ghost"
                  :disabled="replySaving"
                  @click="closeDetail"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  class="primary"
                  :disabled="replySaving"
                >
                  {{ replySaving ? 'Envoi…' : 'Envoyer la réponse' }}
                </button>
              </div>
            </form>
            <p
              v-else-if="detail.status === 'CLOSED'"
              class="hint"
            >
              Ticket clôturé le {{ formatDate(detail.closedAt) }}.
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.support-page {
  display: grid;
  gap: 1.1rem;
}

.hero,
.table-wrap,
.stat-card,
.filters {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
}

.hero {
  padding: 1.1rem 1.2rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--do-muted);
}

.hero h1 {
  margin: 0;
  font-size: 1.75rem;
}

.lead {
  margin: 0.4rem 0 0;
  color: var(--do-muted);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.stat-card {
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.25rem;
}

.stat-card span {
  color: var(--do-muted);
  font-size: 0.85rem;
}

.stat-card strong {
  font-size: 1.4rem;
}

.filters {
  display: flex;
  gap: 0.65rem;
  padding: 0.85rem;
}

.filters input,
.filters select {
  border: 1px solid var(--do-line);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font: inherit;
}

.filters input {
  flex: 1;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

th,
td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--do-line);
  vertical-align: top;
}

th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--do-muted);
  background: var(--do-surface-soft);
}

.cell-main {
  display: grid;
  gap: 0.15rem;
}

.cell-main small,
.preview,
.muted,
.hint {
  color: var(--do-muted);
}

.preview {
  max-width: 320px;
}

.empty {
  text-align: center;
  color: var(--do-muted);
  padding: 28px;
}

.pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.pill.warn {
  background: #fff7ed;
  color: #c2410c;
}

.pill.ok {
  background: #eff8ff;
  color: #175cd3;
}

.pill.off {
  background: #f2f4f7;
  color: #475467;
}

.ghost,
.primary {
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0.5rem 0.85rem;
  font: inherit;
  cursor: pointer;
}

.ghost {
  background: transparent;
  border-color: color-mix(in srgb, var(--do-ink) 14%, transparent);
}

.primary {
  background: var(--do-ink);
  color: #fff;
}

.pager {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
}

.banner-error {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #fef3f2;
  color: #b42318;
}

.flash {
  margin: 0;
  color: #027a48;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 45%);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 50;
}

.modal {
  width: min(720px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 16px;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid var(--do-line);
  position: sticky;
  top: 0;
  background: #fff;
}

.modal-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  border: 0;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
}

.modal-body {
  display: grid;
  gap: 0.9rem;
  padding: 1.1rem;
}

.ticket-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.ticket-meta p {
  margin: 0.2rem 0 0;
  color: var(--do-muted);
}

.bubble {
  border-radius: 12px;
  padding: 0.85rem 1rem;
}

.bubble header {
  font-size: 0.78rem;
  color: var(--do-muted);
  margin-bottom: 0.45rem;
}

.bubble p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.45;
}

.bubble.inbound {
  background: var(--do-surface-soft);
}

.bubble.outbound {
  background: #eef4ff;
}

.reply-form {
  display: grid;
  gap: 0.7rem;
  border-top: 1px solid var(--do-line);
  padding-top: 0.85rem;
}

.reply-form label {
  display: grid;
  gap: 0.35rem;
}

.reply-form span {
  font-size: 0.85rem;
  color: var(--do-muted);
}

textarea {
  border: 1px solid var(--do-line);
  border-radius: 10px;
  padding: 0.7rem;
  font: inherit;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters {
    flex-direction: column;
  }
}
</style>
