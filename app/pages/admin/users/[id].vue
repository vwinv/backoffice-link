<script setup lang="ts">
import type { BackofficeUser } from '~/composables/useAdminUsers'
import type { AdminPermissionModule, AdminRoleItem } from '~/composables/useAdminRoles'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const { user: currentUser, hasPermission } = useAuth()
const { getUser, updateUser } = useAdminUsers()
const { listRoles, listPermissions } = useAdminRoles()

const detail = ref<BackofficeUser | null>(null)
const roles = ref<AdminRoleItem[]>([])
const permissionModules = ref<AdminPermissionModule[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref(false)
const savedFlash = ref(false)
const selectedRoleId = ref('')

const userId = computed(() => String(route.params.id || ''))
const isSelf = computed(() => detail.value?.id === currentUser.value?.id)

const initials = computed(() => {
  if (!detail.value) return '?'
  const a = detail.value.firstName?.[0] || ''
  const b = detail.value.lastName?.[0] || ''
  return (a + b || detail.value.email[0] || '?').toUpperCase()
})

const selectedRole = computed(() =>
  roles.value.find(r => r.id === selectedRoleId.value) || null,
)

const roleDirty = computed(() =>
  !!detail.value
  && selectedRoleId.value
  && selectedRoleId.value !== (detail.value.adminRole?.id || ''),
)

const permissionLabelByKey = computed(() => {
  const map = new Map<string, { label: string, moduleLabel: string, moduleKey: string }>()
  for (const mod of permissionModules.value) {
    for (const p of mod.permissions) {
      map.set(p.key, { label: p.label, moduleLabel: mod.label, moduleKey: mod.key })
    }
  }
  return map
})

const groupedPermissions = computed(() => {
  const keys = detail.value?.permissions || []
  if (keys.includes('*')) {
    return [{
      key: 'all',
      label: 'Accès complet',
      items: [{ key: '*', label: 'Toutes les permissions' }],
    }]
  }

  const groups = new Map<string, { key: string, label: string, items: { key: string, label: string }[] }>()

  for (const key of keys) {
    const meta = permissionLabelByKey.value.get(key)
    const moduleKey = meta?.moduleKey || key.split('.')[0] || 'autres'
    const moduleLabel = meta?.moduleLabel || moduleKey
    if (!groups.has(moduleKey)) {
      groups.set(moduleKey, { key: moduleKey, label: moduleLabel, items: [] })
    }
    groups.get(moduleKey)!.items.push({
      key,
      label: meta?.label || key,
    })
  }

  return [...groups.values()]
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [user, roleList, permissionsRes] = await Promise.all([
      getUser(userId.value),
      listRoles().catch(() => [] as AdminRoleItem[]),
      listPermissions().catch(() => ({ modules: [] as AdminPermissionModule[] })),
    ])
    detail.value = user
    roles.value = roleList
    permissionModules.value = permissionsRes.modules
    selectedRoleId.value = user.adminRole?.id || ''
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Utilisateur introuvable'
    detail.value = null
  }
  finally {
    loading.value = false
  }
}

function fullName(user: BackofficeUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.email
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

function flashSaved() {
  savedFlash.value = true
  setTimeout(() => {
    savedFlash.value = false
  }, 2200)
}

async function saveRole() {
  if (!detail.value || isSelf.value || !selectedRoleId.value || !roleDirty.value) return
  busy.value = true
  error.value = null
  try {
    detail.value = await updateUser(detail.value.id, {
      adminRoleId: selectedRoleId.value,
    })
    flashSaved()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Modification impossible'
  }
  finally {
    busy.value = false
  }
}

async function toggleActive() {
  if (!detail.value || isSelf.value) return
  busy.value = true
  error.value = null
  try {
    detail.value = await updateUser(detail.value.id, {
      isActive: !detail.value.isActive,
    })
    flashSaved()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Modification impossible'
  }
  finally {
    busy.value = false
  }
}

await load()
</script>

<template>
  <section class="detail-page">
    <NuxtLink to="/admin/users" class="back">
      <span aria-hidden="true">←</span>
      Utilisateurs
    </NuxtLink>

    <p v-if="error" class="banner-error" role="alert">{{ error }}</p>

    <div v-if="loading" class="skeleton-wrap">
      <div class="skeleton hero-skel" />
      <div class="skeleton panel-skel" />
      <div class="skeleton panel-skel" />
    </div>

    <template v-else-if="detail">
      <header class="hero">
        <div class="hero-main">
          <div class="avatar" :class="{ inactive: !detail.isActive }" aria-hidden="true">
            <img
              v-if="detail.avatarUrl"
              :src="detail.avatarUrl"
              :alt="fullName(detail)"
            >
            <span v-else>{{ initials }}</span>
          </div>
          <div class="identity">
            <p class="eyebrow">Fiche utilisateur</p>
            <h1>{{ fullName(detail) }}</h1>
            <a class="email" :href="`mailto:${detail.email}`">{{ detail.email }}</a>
            <div class="tags">
              <span class="badge badge-role">
                {{ detail.adminRole?.name || 'Admin legacy' }}
              </span>
              <span class="badge" :class="detail.isActive ? 'badge-ok' : 'badge-off'">
                {{ detail.isActive ? 'Actif' : 'Inactif' }}
              </span>
              <span v-if="isSelf" class="badge badge-you">Vous</span>
              <span v-if="savedFlash" class="badge badge-saved">Enregistré</span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <button
            v-if="hasPermission('backoffice_users.update')"
            type="button"
            class="ghost"
            :class="{ danger: detail.isActive }"
            :disabled="busy || isSelf"
            :title="isSelf ? 'Vous ne pouvez pas désactiver votre propre compte' : undefined"
            @click="toggleActive"
          >
            {{ detail.isActive ? 'Désactiver' : 'Réactiver' }}
          </button>
        </div>
      </header>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Téléphone</span>
          <strong>{{ detail.phone || '—' }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Authentification</span>
          <strong>{{ detail.authProvider }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Créé le</span>
          <strong>{{ formatShortDate(detail.createdAt) }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Mis à jour</span>
          <strong>{{ formatDate(detail.updatedAt) }}</strong>
        </div>
      </div>

      <section v-if="hasPermission('backoffice_users.update')" class="panel">
        <div class="panel-head">
          <div>
            <h2>Rôle backoffice</h2>
            <p class="panel-lead">
              Détermine les modules et actions accessibles dans l’admin.
            </p>
          </div>
        </div>

        <div class="role-row">
          <label class="field">
            <span>Rôle assigné</span>
            <select v-model="selectedRoleId" :disabled="isSelf || busy">
              <option disabled value="">Choisir un rôle</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}{{ role.isSystem ? ' (système)' : '' }}
              </option>
            </select>
          </label>
          <button
            type="button"
            class="primary"
            :disabled="busy || isSelf || !roleDirty"
            @click="saveRole"
          >
            {{ busy ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>

        <p v-if="selectedRole?.description" class="role-hint">
          {{ selectedRole.description }}
        </p>
        <p v-else-if="isSelf" class="role-hint warn">
          Vous ne pouvez pas modifier votre propre rôle.
        </p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Permissions effectives</h2>
            <p class="panel-lead">
              Accès hérités du rôle
              <strong>{{ detail.adminRole?.name || 'Admin legacy' }}</strong>.
            </p>
          </div>
          <span class="count">
            {{ (detail.permissions || []).includes('*')
              ? 'Illimité'
              : `${(detail.permissions || []).length} permission(s)` }}
          </span>
        </div>

        <div v-if="groupedPermissions.length" class="perm-groups">
          <div
            v-for="group in groupedPermissions"
            :key="group.key"
            class="perm-group"
          >
            <h3>{{ group.label }}</h3>
            <ul>
              <li v-for="item in group.items" :key="item.key">
                {{ item.label }}
              </li>
            </ul>
          </div>
        </div>
        <p v-else class="muted">Aucune permission listée pour cet utilisateur.</p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: none;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: var(--do-blue);
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
}
.back:hover { opacity: 0.85; }

.banner-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff1f1;
  color: #b42318;
  font-weight: 600;
}

.skeleton-wrap { display: grid; gap: 14px; }
.skeleton {
  border-radius: var(--do-radius);
  background: linear-gradient(90deg, #eef1f6 25%, #f7f8fb 50%, #eef1f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}
.hero-skel { height: 148px; }
.panel-skel { height: 120px; }
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.hero, .panel, .meta-grid {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(10, 107, 255, 0.12), transparent 50%),
    var(--do-surface);
}

.hero-main {
  display: flex;
  gap: 18px;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.avatar {
  flex-shrink: 0;
  width: 76px;
  height: 76px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--do-blue);
  color: #fff;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 24px rgba(10, 107, 255, 0.28);
}
.avatar.inactive {
  background: #9aa3b2;
  box-shadow: none;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.identity { min-width: 0; }
.eyebrow {
  margin: 0 0 6px;
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
h1 {
  margin: 0 0 4px;
  font-size: clamp(1.45rem, 2.4vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.email {
  color: var(--do-muted);
  text-decoration: none;
  font-weight: 600;
  word-break: break-all;
}
.email:hover { color: var(--do-blue); }

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.badge-role { background: var(--do-blue-soft); color: var(--do-blue); }
.badge-ok { background: #e8f8ef; color: #1b7a45; }
.badge-off { background: #f1f2f4; color: #5b616e; }
.badge-you { background: #fff6e8; color: #9a6700; }
.badge-saved { background: #e8f8ef; color: #1b7a45; animation: fadeIn 0.2s ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: none; }
}

.hero-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  overflow: hidden;
}
.meta-item {
  padding: 16px 18px;
  display: grid;
  gap: 6px;
  border-right: 1px solid var(--do-line);
}
.meta-item:last-child { border-right: 0; }
.meta-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--do-muted);
}
.meta-item strong {
  font-size: 0.95rem;
  font-weight: 700;
  word-break: break-word;
}

.panel { padding: 22px 24px; display: grid; gap: 16px; }
.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.panel h2 {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 800;
}
.panel-lead {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.9rem;
  max-width: 48ch;
}
.panel-lead strong { color: var(--do-ink); }
.count {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--do-surface-soft);
  border: 1px solid var(--do-line);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--do-muted);
  white-space: nowrap;
}

.role-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.field {
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 220px;
  font-size: 0.85rem;
  font-weight: 600;
}
select {
  min-height: 40px;
  padding: 0 12px;
  border: 1.5px solid var(--do-line);
  border-radius: 10px;
  font: inherit;
  background: #fff;
  width: 100%;
}
.role-hint {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--do-surface-soft);
  color: var(--do-muted);
  font-size: 0.9rem;
  border: 1px solid var(--do-line);
}
.role-hint.warn {
  background: #fff6e8;
  border-color: #f0d9a8;
  color: #9a6700;
}

.perm-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.perm-group {
  padding: 14px;
  border-radius: 14px;
  background: var(--do-surface-soft);
  border: 1px solid var(--do-line);
}
.perm-group h3 {
  margin: 0 0 10px;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--do-blue);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.perm-group ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
.perm-group li {
  position: relative;
  padding-left: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--do-ink);
}
.perm-group li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--do-blue);
}

.primary, .ghost {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  line-height: 1;
}
.primary {
  border: 0;
  background: var(--do-blue);
  color: #fff;
}
.primary:disabled,
.ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ghost {
  border: 1.5px solid var(--do-line);
  background: #fff;
}
.ghost.danger {
  color: #b42318;
  border-color: #f3c1c1;
  background: #fff8f8;
}
.muted { margin: 0; color: var(--do-muted); }

@media (max-width: 800px) {
  .meta-grid { grid-template-columns: 1fr 1fr; }
  .meta-item:nth-child(2n) { border-right: 0; }
  .meta-item:nth-child(-n+2) { border-bottom: 1px solid var(--do-line); }
  .hero-main { align-items: flex-start; }
}
@media (max-width: 520px) {
  .meta-grid { grid-template-columns: 1fr; }
  .meta-item { border-right: 0; border-bottom: 1px solid var(--do-line); }
  .meta-item:last-child { border-bottom: 0; }
  .avatar { width: 64px; height: 64px; border-radius: 16px; font-size: 1.2rem; }
}
</style>
