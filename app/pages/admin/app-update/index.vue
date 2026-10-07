<script setup lang="ts">
import type { AppUpdateConfig } from '~/composables/useAdminAppUpdate'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const { getConfig, updateConfig } = useAdminAppUpdate()

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const updatedAt = ref<string | null>(null)

const form = reactive({
  latestVersion: '',
  minVersion: '',
  iosStoreUrl: '',
  androidStoreUrl: '',
  message: '',
})

const canUpdate = computed(
  () => hasPermission('app_update.update') || hasPermission('*'),
)

function formatDate(iso: string | undefined | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function applyConfig(config: AppUpdateConfig) {
  form.latestVersion = config.latestVersion ?? ''
  form.minVersion = config.minVersion ?? ''
  form.iosStoreUrl = config.iosStoreUrl ?? ''
  form.androidStoreUrl = config.androidStoreUrl ?? ''
  form.message = config.message ?? ''
  updatedAt.value = config.updatedAt ?? null
}

async function load() {
  loading.value = true
  error.value = null
  try {
    applyConfig(await getConfig())
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Chargement impossible'
  }
  finally {
    loading.value = false
  }
}

async function onSave() {
  if (!canUpdate.value) return
  saving.value = true
  error.value = null
  success.value = null
  try {
    const saved = await updateConfig({
      latestVersion: form.latestVersion.trim(),
      minVersion: form.minVersion.trim(),
      iosStoreUrl: form.iosStoreUrl.trim(),
      androidStoreUrl: form.androidStoreUrl.trim(),
      message: form.message.trim(),
    })
    applyConfig(saved)
    success.value = 'Configuration enregistrée. Les apps la prendront en compte au prochain démarrage.'
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Enregistrement impossible'
  }
  finally {
    saving.value = false
  }
}

await load()
</script>

<template>
  <section class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Application mobile
        </p>
        <h1>
          Mise à jour
        </h1>
        <p class="lead">
          Définissez la dernière version et la version minimale. Les utilisateurs
          voient un dialog au démarrage de l’app.
        </p>
      </div>
      <p
        v-if="updatedAt"
        class="updated"
      >
        Dernière modif. {{ formatDate(updatedAt) }}
      </p>
    </header>

    <p
      v-if="error"
      class="banner-error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-if="success"
      class="banner-ok"
      role="status"
    >
      {{ success }}
    </p>

    <div
      v-if="loading"
      class="loading"
    >
      Chargement…
    </div>

    <form
      v-else
      class="card"
      @submit.prevent="onSave"
    >
      <div class="grid">
        <label class="field">
          <span class="field-label">Dernière version <small>prompt soft</small></span>
          <input
            v-model="form.latestVersion"
            type="text"
            inputmode="decimal"
            placeholder="Ex. 1.0.1"
            :disabled="!canUpdate"
          >
          <small class="hint">
            Si la version installée est inférieure → « Mise à jour disponible » (peut ignorer).
          </small>
        </label>

        <label class="field">
          <span class="field-label">Version minimale <small>prompt forcé</small></span>
          <input
            v-model="form.minVersion"
            type="text"
            inputmode="decimal"
            placeholder="Ex. 1.0.0"
            :disabled="!canUpdate"
          >
          <small class="hint">
            Si la version installée est inférieure → mise à jour obligatoire.
          </small>
        </label>
      </div>

      <label class="field">
        <span class="field-label">Message (optionnel)</span>
        <textarea
          v-model="form.message"
          rows="3"
          maxlength="500"
          placeholder="Une nouvelle version de DropOne est disponible."
          :disabled="!canUpdate"
        />
      </label>

      <div class="grid">
        <label class="field">
          <span class="field-label">Lien App Store</span>
          <input
            v-model="form.iosStoreUrl"
            type="url"
            placeholder="https://apps.apple.com/app/id…"
            :disabled="!canUpdate"
          >
        </label>

        <label class="field">
          <span class="field-label">Lien Play Store</span>
          <input
            v-model="form.androidStoreUrl"
            type="url"
            placeholder="https://play.google.com/store/apps/details?id=com.mega.dropone"
            :disabled="!canUpdate"
          >
        </label>
      </div>

      <div class="actions">
        <button
          type="submit"
          class="primary"
          :disabled="!canUpdate || saving"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <p
          v-if="!canUpdate"
          class="hint"
        >
          Permission « Modifier la config de mise à jour app » requise.
        </p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
  max-width: 820px;
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}
.eyebrow {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--do-blue);
}
.hero h1 {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
}
.lead {
  margin: 8px 0 0;
  color: var(--do-muted);
  line-height: 1.45;
  max-width: 52ch;
}
.updated {
  margin: 0;
  font-size: 0.82rem;
  color: var(--do-muted);
  white-space: nowrap;
}
.banner-error,
.banner-ok {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 600;
}
.banner-error {
  background: #fff1f1;
  color: #b42318;
  border: 1px solid #f3c1c1;
}
.banner-ok {
  background: #e8f8ef;
  color: #1b7a45;
  border: 1px solid #b7e4c7;
}
.loading {
  color: var(--do-muted);
}
.card {
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 16px;
  border: 1.5px solid var(--do-line);
  background: #fff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.field {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.field-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}
.field-label small {
  font-weight: 600;
  color: var(--do-muted);
}
.field input,
.field textarea {
  width: 100%;
  min-height: 44px;
  padding: 12px 14px;
  border: 1.5px solid var(--do-line);
  border-radius: 12px;
  font: inherit;
  background: #fff;
  color: var(--do-ink);
}
.field textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.45;
}
.hint {
  color: var(--do-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}
.primary {
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: var(--do-blue);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .hero {
    flex-direction: column;
  }
}
</style>
