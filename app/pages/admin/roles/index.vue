<script setup lang="ts">
import type { AdminPermissionModule, AdminRoleItem } from '~/composables/useAdminRoles'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const { listPermissions, listRoles, createRole, updateRole, deleteRole } = useAdminRoles()

const modules = ref<AdminPermissionModule[]>([])
const roles = ref<AdminRoleItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const saving = ref(false)
const showEditor = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  description: '',
  permissionKeys: [] as string[],
})

const canEditForm = computed(() =>
  hasPermission('roles.create') || hasPermission('roles.update'),
)

const editingRole = computed(() =>
  editingId.value ? roles.value.find(r => r.id === editingId.value) : null,
)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [permissionsRes, rolesRes] = await Promise.all([
      listPermissions(),
      listRoles(),
    ])
    modules.value = permissionsRes.modules
    roles.value = rolesRes
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Chargement impossible'
  }
  finally {
    loading.value = false
  }
}

function togglePermission(key: string) {
  const index = form.permissionKeys.indexOf(key)
  if (index >= 0) form.permissionKeys.splice(index, 1)
  else form.permissionKeys.push(key)
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.description = ''
  form.permissionKeys = []
  formError.value = null
}

function openCreate() {
  resetForm()
  showEditor.value = true
}

function startEdit(role: AdminRoleItem) {
  editingId.value = role.id
  form.name = role.name
  form.description = role.description || ''
  form.permissionKeys = [...role.permissionKeys]
  formError.value = null
  showEditor.value = true
}

function closeEditor() {
  if (saving.value) return
  showEditor.value = false
  resetForm()
}

async function onSave() {
  if (form.permissionKeys.length === 0) {
    formError.value = 'Sélectionnez au moins une permission'
    return
  }
  saving.value = true
  formError.value = null
  try {
    if (editingId.value) {
      await updateRole(editingId.value, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        permissionKeys: form.permissionKeys,
      })
    }
    else {
      await createRole({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        permissionKeys: form.permissionKeys,
      })
    }
    showEditor.value = false
    resetForm()
    await load()
  }
  catch (err: unknown) {
    formError.value = err instanceof ApiError ? err.message : 'Enregistrement impossible'
  }
  finally {
    saving.value = false
  }
}

async function onDelete(role: AdminRoleItem) {
  if (role.isSystem) return
  if (!confirm(`Supprimer le rôle « ${role.name} » ?`)) return
  try {
    await deleteRole(role.id)
    if (editingId.value === role.id) closeEditor()
    await load()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Suppression impossible'
  }
}

await load()
</script>

<template>
  <section class="roles-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Rôles & permissions</h1>
        <p class="lead">
          Créez des rôles et attribuez des accès aux modules du backoffice.
        </p>
      </div>
      <button
        v-if="hasPermission('roles.create')"
        type="button"
        class="primary"
        @click="openCreate"
      >
        Nouveau rôle
      </button>
    </header>

    <p v-if="error" class="banner-error" role="alert">{{ error }}</p>
    <p v-if="loading" class="muted">Chargement…</p>

    <div v-else class="roles-list">
      <article
        v-for="role in roles"
        :key="role.id"
        class="role-card"
      >
        <div>
          <h2>{{ role.name }}</h2>
          <p>{{ role.description || 'Sans description' }}</p>
          <small>
            {{ role.permissionKeys.length }} permission(s) ·
            {{ role.usersCount }} utilisateur(s)
            <template v-if="role.isSystem"> · système</template>
          </small>
        </div>
        <div class="role-actions">
          <button
            v-if="hasPermission('roles.update')"
            type="button"
            class="ghost"
            @click="startEdit(role)"
          >
            Modifier
          </button>
          <button
            v-if="hasPermission('roles.delete') && !role.isSystem"
            type="button"
            class="ghost danger"
            @click="onDelete(role)"
          >
            Supprimer
          </button>
        </div>
      </article>
      <p v-if="roles.length === 0" class="muted empty">Aucun rôle pour le moment.</p>
    </div>

    <Teleport to="body">
      <div
        v-if="showEditor && canEditForm"
        class="modal-backdrop"
        @click.self="closeEditor"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-editor-title"
        >
          <header class="modal-head">
            <h2 id="role-editor-title">
              {{ editingId ? 'Modifier le rôle' : 'Créer un rôle' }}
            </h2>
            <button type="button" class="modal-close" aria-label="Fermer" @click="closeEditor">×</button>
          </header>
          <form class="modal-body" @submit.prevent="onSave">
            <p v-if="formError" class="banner-error" role="alert">{{ formError }}</p>
            <label>
              <span>Nom</span>
              <input
                v-model="form.name"
                required
                minlength="2"
                :disabled="!!editingRole?.isSystem"
              >
            </label>
            <label>
              <span>Description</span>
              <input v-model="form.description" placeholder="Optionnel">
            </label>

            <div
              v-for="module in modules"
              :key="module.key"
              class="module-block"
            >
              <h3>{{ module.label }}</h3>
              <label
                v-for="permission in module.permissions"
                :key="permission.key"
                class="check"
              >
                <input
                  type="checkbox"
                  :checked="form.permissionKeys.includes(permission.key)"
                  @change="togglePermission(permission.key)"
                >
                <span>{{ permission.label }}</span>
              </label>
            </div>

            <footer class="modal-actions">
              <button type="button" class="ghost" :disabled="saving" @click="closeEditor">
                Annuler
              </button>
              <button class="primary" type="submit" :disabled="saving">
                {{ saving ? 'Enregistrement…' : (editingId ? 'Enregistrer' : 'Créer le rôle') }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.roles-page { display: flex; flex-direction: column; gap: 18px; max-width: 1100px; }
.hero, .role-card {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}
.hero {
  display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; padding: 22px 24px;
  background: linear-gradient(135deg, rgba(10, 107, 255, 0.1), transparent 55%), var(--do-surface);
}
.eyebrow {
  margin: 0; display: inline-flex; padding: 6px 12px; border-radius: 999px;
  background: var(--do-blue-soft); color: var(--do-blue);
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
}
h1 { margin: 12px 0 8px; font-size: 1.8rem; font-weight: 800; }
.lead, .muted { color: var(--do-muted); }
.empty { margin: 0; padding: 24px; text-align: center; }
.banner-error { margin: 0; padding: 12px; border-radius: 12px; background: #fff1f1; color: #b42318; font-weight: 600; }
.roles-list { display: grid; gap: 12px; }
.role-card { padding: 16px; display: flex; justify-content: space-between; gap: 12px; }
.role-card h2 { margin: 0 0 6px; font-size: 1.05rem; font-weight: 800; }
.role-card p { margin: 0 0 6px; color: var(--do-muted); }
.role-card small { color: var(--do-muted); }
.role-actions { display: flex; flex-direction: column; gap: 8px; }

.modal-backdrop {
  position: fixed; inset: 0; z-index: 80;
  display: grid; place-items: center; padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}
.modal {
  width: min(560px, 100%);
  max-height: min(90vh, 760px);
  overflow: auto;
  border-radius: 16px;
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
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
.modal-close:hover { background: var(--do-surface-soft); color: inherit; }
.modal-body { padding: 18px; display: grid; gap: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

label { display: grid; gap: 6px; font-size: 0.85rem; font-weight: 600; }
input[type="text"], input:not([type]), input[type="search"] {
  min-height: 40px; padding: 0 12px; border: 1.5px solid var(--do-line); border-radius: 10px; font: inherit;
}
.module-block {
  padding: 12px; border-radius: 12px; background: var(--do-surface-soft); border: 1px solid var(--do-line);
  display: grid; gap: 8px;
}
.module-block h3 { margin: 0; font-size: 0.9rem; font-weight: 800; color: var(--do-blue); }
.check { display: flex; align-items: center; gap: 10px; font-weight: 600; }
.primary, .ghost {
  min-height: 32px; padding: 0 12px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.875rem;
}
.hero .primary { min-height: 34px; padding: 0 14px; line-height: 1; }
.primary { border: 0; background: var(--do-blue); color: #fff; }
.ghost { border: 1.5px solid var(--do-line); background: #fff; }
.danger { color: #b42318; border-color: #f3c1c1; }
</style>
