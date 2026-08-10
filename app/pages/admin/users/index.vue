<script setup lang="ts">
import type { BackofficeUser } from '~/composables/useAdminUsers'
import type { AdminRoleItem } from '~/composables/useAdminRoles'

definePageMeta({
  layout: 'admin',
})

const { user: currentUser, hasPermission } = useAuth()
const { listUsers, createUser, updateUser } = useAdminUsers()
const { listRoles } = useAdminRoles()

const search = ref('')
const isActive = ref<'' | 'true' | 'false'>('')
const page = ref(1)
const limit = 20

const users = ref<BackofficeUser[]>([])
const roles = ref<AdminRoleItem[]>([])
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })
const loading = ref(false)
const error = ref<string | null>(null)
const actionBusyId = ref<string | null>(null)
const showCreate = ref(false)
const creating = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  adminRoleId: '',
  phone: '',
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const response = await listUsers({
      search: search.value,
      isActive: isActive.value,
      page: page.value,
      limit,
    })
    users.value = response.data
    meta.value = response.meta
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError
      ? err.message
      : 'Impossible de charger les utilisateurs'
  }
  finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    roles.value = await listRoles()
    if (!form.adminRoleId && roles.value[0]) {
      form.adminRoleId = roles.value[0].id
    }
  }
  catch {
    // silencieux si pas la permission roles.view
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 300)
}

function onFilterChange() {
  page.value = 1
  loadUsers()
}

function goToPage(next: number) {
  if (next < 1 || next > meta.value.totalPages) return
  page.value = next
  loadUsers()
}

function fullName(user: BackofficeUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

function openCreate() {
  formError.value = null
  showCreate.value = true
}

function closeCreate() {
  if (creating.value) return
  showCreate.value = false
  formError.value = null
}

function resetForm() {
  form.email = ''
  form.firstName = ''
  form.lastName = ''
  form.password = ''
  form.phone = ''
  if (roles.value[0]) form.adminRoleId = roles.value[0].id
}

async function toggleActive(user: BackofficeUser) {
  if (user.id === currentUser.value?.id || !hasPermission('backoffice_users.update')) return
  actionBusyId.value = user.id
  try {
    const updated = await updateUser(user.id, { isActive: !user.isActive })
    const index = users.value.findIndex(item => item.id === user.id)
    if (index >= 0) users.value[index] = updated
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Action impossible'
  }
  finally {
    actionBusyId.value = null
  }
}

async function onCreate() {
  creating.value = true
  formError.value = null
  try {
    await createUser({
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      password: form.password,
      adminRoleId: form.adminRoleId,
      phone: form.phone.trim() || undefined,
    })
    showCreate.value = false
    resetForm()
    await loadUsers()
  }
  catch (err: unknown) {
    formError.value = err instanceof ApiError ? err.message : 'Création impossible'
  }
  finally {
    creating.value = false
  }
}

await Promise.all([loadUsers(), loadRoles()])
</script>

<template>
  <section class="users-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Utilisateurs backoffice</h1>
        <p class="lead">
          {{ meta.total }} compte{{ meta.total > 1 ? 's' : '' }} avec accès admin.
        </p>
      </div>
      <div class="hero-actions">
        <button
          v-if="hasPermission('backoffice_users.create')"
          type="button"
          class="primary"
          @click="openCreate"
        >
          Nouvel utilisateur
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
          aria-labelledby="create-user-title"
        >
          <header class="modal-head">
            <h2 id="create-user-title">Nouvel utilisateur</h2>
            <button type="button" class="modal-close" aria-label="Fermer" @click="closeCreate">×</button>
          </header>
          <form class="modal-body" @submit.prevent="onCreate">
            <p v-if="formError" class="banner-error" role="alert">{{ formError }}</p>
            <div class="create-grid">
              <label>
                <span>Prénom</span>
                <input v-model="form.firstName" required minlength="2" autocomplete="given-name">
              </label>
              <label>
                <span>Nom</span>
                <input v-model="form.lastName" required minlength="2" autocomplete="family-name">
              </label>
              <label>
                <span>Email</span>
                <input v-model="form.email" type="email" required autocomplete="email">
              </label>
              <label>
                <span>Mot de passe</span>
                <input v-model="form.password" type="password" required minlength="6" autocomplete="new-password">
              </label>
              <label>
                <span>Rôle</span>
                <select v-model="form.adminRoleId" required>
                  <option
                    v-for="role in roles"
                    :key="role.id"
                    :value="role.id"
                  >
                    {{ role.name }}
                  </option>
                </select>
              </label>
              <label>
                <span>Téléphone</span>
                <input v-model="form.phone" type="tel" autocomplete="tel">
              </label>
            </div>
            <footer class="modal-actions">
              <button type="button" class="btn-ghost" :disabled="creating" @click="closeCreate">
                Annuler
              </button>
              <button class="primary" type="submit" :disabled="creating">
                {{ creating ? 'Création…' : 'Créer' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher par nom ou email…"
        @input="onSearchInput"
      >
      <select v-model="isActive" @change="onFilterChange">
        <option value="">Tous les statuts</option>
        <option value="true">Actifs</option>
        <option value="false">Inactifs</option>
      </select>
    </div>

    <p v-if="error" class="banner-error" role="alert">{{ error }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Rôle backoffice</th>
            <th>Statut</th>
            <th>Créé</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && users.length === 0">
            <td colspan="5" class="empty">Chargement…</td>
          </tr>
          <tr v-else-if="users.length === 0">
            <td colspan="5" class="empty">Aucun utilisateur backoffice.</td>
          </tr>
          <tr v-for="item in users" :key="item.id">
            <td>
              <div class="user-cell">
                <span class="avatar">{{ (item.firstName?.[0] || '?').toUpperCase() }}</span>
                <span>
                  <strong>{{ fullName(item) }}</strong>
                  <small>{{ item.email }}</small>
                </span>
              </div>
            </td>
            <td>
              <span class="badge badge-role">
                {{ item.adminRole?.name || 'Admin legacy' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="item.isActive ? 'badge-active' : 'badge-inactive'">
                {{ item.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <div class="actions">
                <NuxtLink :to="`/admin/users/${item.id}`" class="btn-link">Voir</NuxtLink>
                <button
                  v-if="hasPermission('backoffice_users.update')"
                  type="button"
                  class="btn-ghost"
                  :disabled="actionBusyId === item.id || item.id === currentUser?.id"
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
.users-page { display: flex; flex-direction: column; gap: 18px; max-width: 1100px; }
.hero, .table-wrap {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}
.hero {
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
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
.hero-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.primary, .btn-ghost, .btn-link, .pager button {
  min-height: 32px; padding: 0 12px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.875rem;
}
.btn-ghost, .pager button { border: 1.5px solid var(--do-line); background: #fff; }
.primary { border: 0; background: var(--do-blue); color: #fff; }
.hero-actions .primary { min-height: 34px; padding: 0 14px; line-height: 1; }

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
input, select {
  min-height: 40px; padding: 0 12px; border: 1.5px solid var(--do-line);
  border-radius: 10px; font: inherit; background: #fff;
}
.filters { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
.banner-error { margin: 0; padding: 12px; border-radius: 12px; background: #fff1f1; color: #b42318; font-weight: 600; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--do-line); }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--do-muted); background: var(--do-surface-soft); }
.empty { text-align: center; color: var(--do-muted); padding: 28px; }
.user-cell { display: flex; gap: 12px; align-items: center; }
.user-cell strong { display: block; }
.user-cell small { color: var(--do-muted); }
.avatar {
  width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
  background: var(--do-blue); color: #fff; font-weight: 800;
}
.badge { display: inline-flex; min-height: 26px; padding: 0 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge-role { background: var(--do-blue-soft); color: var(--do-blue); }
.badge-active { background: #e8f8ef; color: #1b7a45; }
.badge-inactive { background: #f1f2f4; color: #5b616e; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-link { display: inline-flex; align-items: center; background: var(--do-blue-soft); color: var(--do-blue); text-decoration: none; }
.btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
.pager { display: flex; justify-content: center; gap: 16px; align-items: center; }
@media (max-width: 800px) {
  .create-grid, .filters { grid-template-columns: 1fr; }
}
</style>
