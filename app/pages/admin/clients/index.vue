<script setup lang="ts">
import type { AppClient } from '~/composables/useAdminClients'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const { listClients, updateClient } = useAdminClients()

const search = ref('')
const isActive = ref<'' | 'true' | 'false'>('')
const isPremium = ref<'' | 'true' | 'false'>('')
const page = ref(1)
const limit = 20

const clients = ref<AppClient[]>([])
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })
const loading = ref(false)
const error = ref<string | null>(null)
const actionBusyId = ref<string | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadClients() {
  loading.value = true
  error.value = null
  try {
    const response = await listClients({
      search: search.value,
      isActive: isActive.value,
      isPremium: isPremium.value,
      page: page.value,
      limit,
    })
    clients.value = response.data
    meta.value = response.meta
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError
      ? err.message
      : 'Impossible de charger les clients'
  }
  finally {
    loading.value = false
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadClients()
  }, 300)
}

function onFilterChange() {
  page.value = 1
  loadClients()
}

function goToPage(next: number) {
  if (next < 1 || next > meta.value.totalPages) return
  page.value = next
  loadClients()
}

function fullName(client: AppClient) {
  return `${client.firstName} ${client.lastName}`.trim() || client.email
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

async function toggleActive(client: AppClient) {
  if (!hasPermission('clients.update')) return
  actionBusyId.value = client.id
  try {
    const updated = await updateClient(client.id, { isActive: !client.isActive })
    const index = clients.value.findIndex(item => item.id === client.id)
    if (index >= 0) {
      clients.value[index] = {
        ...clients.value[index],
        ...updated,
      }
    }
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Action impossible'
  }
  finally {
    actionBusyId.value = null
  }
}

await loadClients()
</script>

<template>
  <section class="clients-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Application</p>
        <h1>Clients</h1>
        <p class="lead">
          {{ meta.total }} utilisateur{{ meta.total > 1 ? 's' : '' }} de l’app DropOne.
        </p>
      </div>
    </header>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher par nom, email ou téléphone…"
        @input="onSearchInput"
      >
      <select v-model="isActive" @change="onFilterChange">
        <option value="">Tous les statuts</option>
        <option value="true">Actifs</option>
        <option value="false">Inactifs</option>
      </select>
      <select v-model="isPremium" @change="onFilterChange">
        <option value="">Tous les abonnements</option>
        <option value="true">Premium</option>
        <option value="false">Gratuit</option>
      </select>
    </div>

    <p v-if="error" class="banner-error" role="alert">{{ error }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Abonnement</th>
            <th>Cartes</th>
            <th>Statut</th>
            <th>Inscrit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && clients.length === 0">
            <td colspan="6" class="empty">Chargement…</td>
          </tr>
          <tr v-else-if="clients.length === 0">
            <td colspan="6" class="empty">Aucun client trouvé.</td>
          </tr>
          <tr v-for="item in clients" :key="item.id">
            <td>
              <div class="user-cell">
                <span class="avatar">
                  <img
                    v-if="item.avatarUrl"
                    :src="item.avatarUrl"
                    :alt="fullName(item)"
                  >
                  <template v-else>{{ (item.firstName?.[0] || '?').toUpperCase() }}</template>
                </span>
                <span>
                  <strong>{{ fullName(item) }}</strong>
                  <small>{{ item.email }}</small>
                </span>
              </div>
            </td>
            <td>
              <span
                class="badge"
                :class="item.isPremium ? 'badge-premium' : 'badge-free'"
              >
                {{ item.isPremium
                  ? (item.subscription?.offerTitle || 'Premium')
                  : 'Gratuit' }}
              </span>
            </td>
            <td>
              <span class="count">{{ item.cardsCount }}</span>
            </td>
            <td>
              <span class="badge" :class="item.isActive ? 'badge-active' : 'badge-inactive'">
                {{ item.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <div class="actions">
                <NuxtLink :to="`/admin/clients/${item.id}`" class="btn-link">Voir</NuxtLink>
                <button
                  v-if="hasPermission('clients.update')"
                  type="button"
                  class="btn-ghost"
                  :disabled="actionBusyId === item.id"
                  @click="toggleActive(item)"
                >
                  {{ item.isActive ? 'Désactiver' : 'Réactiver' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="meta.totalPages > 1" class="pager">
      <button type="button" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">Précédent</button>
      <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>
      <button type="button" :disabled="page >= meta.totalPages || loading" @click="goToPage(page + 1)">Suivant</button>
    </div>
  </section>
</template>

<style scoped>
.clients-page { display: flex; flex-direction: column; gap: 18px; width: 100%; }
.hero, .table-wrap {
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
.filters { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 12px; }
input, select {
  min-height: 40px; padding: 0 12px; border: 1.5px solid var(--do-line);
  border-radius: 10px; font: inherit; background: #fff;
}
.banner-error { margin: 0; padding: 12px; border-radius: 12px; background: #fff1f1; color: #b42318; font-weight: 600; }
table { width: 100%; border-collapse: collapse; min-width: 860px; }
th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--do-line); }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--do-muted); background: var(--do-surface-soft); }
.empty { text-align: center; color: var(--do-muted); padding: 28px; }
.user-cell { display: flex; gap: 12px; align-items: center; }
.user-cell strong { display: block; }
.user-cell small { color: var(--do-muted); }
.avatar {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
  background: var(--do-blue); color: #fff; font-weight: 800; overflow: hidden; flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.badge { display: inline-flex; min-height: 26px; padding: 0 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge-premium { background: #fff6e8; color: #9a6700; }
.badge-free { background: #f1f2f4; color: #5b616e; }
.badge-active { background: #e8f8ef; color: #1b7a45; }
.badge-inactive { background: #f1f2f4; color: #5b616e; }
.count { font-weight: 700; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-link, .btn-ghost, .pager button {
  min-height: 32px; padding: 0 12px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; cursor: pointer;
}
.btn-link { display: inline-flex; align-items: center; background: var(--do-blue-soft); color: var(--do-blue); text-decoration: none; }
.btn-ghost, .pager button { border: 1.5px solid var(--do-line); background: #fff; }
.btn-ghost:disabled, .pager button:disabled { opacity: 0.45; cursor: not-allowed; }
.pager { display: flex; justify-content: center; gap: 16px; align-items: center; }
@media (max-width: 900px) {
  .filters { grid-template-columns: 1fr; }
}
</style>
