<script setup lang="ts">
import type { AppClientDetail } from '~/composables/useAdminClients'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const { hasPermission } = useAuth()
const { getClient, updateClient } = useAdminClients()
const { deleteSubscription } = useAdminSubscriptions()

const canUpdateSubscription = computed(
  () => hasPermission('subscriptions.update') || hasPermission('*'),
)
const canDeleteSubscription = computed(
  () => hasPermission('subscriptions.delete') || hasPermission('*'),
)

const detail = ref<AppClientDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref(false)
const deletingSubId = ref<string | null>(null)
const savedFlash = ref(false)

const clientId = computed(() => String(route.params.id || ''))

const initials = computed(() => {
  if (!detail.value) return '?'
  const a = detail.value.firstName?.[0] || ''
  const b = detail.value.lastName?.[0] || ''
  return (a + b || detail.value.email[0] || '?').toUpperCase()
})

const publicCardBase = 'https://api.dropone.pro/cards'

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await getClient(clientId.value)
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Client introuvable'
    detail.value = null
  }
  finally {
    loading.value = false
  }
}

function fullName(client: AppClientDetail) {
  return `${client.firstName} ${client.lastName}`.trim() || client.email
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function formatShortDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

function cardLabel(kind: string) {
  if (kind === 'PROFESSIONAL') return 'Professionnelle'
  if (kind === 'MEMBER') return 'Membre équipe'
  return 'Personnelle'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    TRIAL: 'Essai',
    ACTIVE: 'Actif',
    CANCELLED: 'Annulé',
    EXPIRED: 'Expiré',
    PAST_DUE: 'Impayé',
  }
  return map[status] || status
}

function billingLabel(period: string) {
  const map: Record<string, string> = {
    MONTHLY: 'Mensuel',
    YEARLY: 'Annuel',
    LIFETIME: 'À vie',
  }
  return map[period] || period
}

function authLabel(provider: string) {
  const map: Record<string, string> = {
    LOCAL: 'Email / mot de passe',
    GOOGLE: 'Google',
    APPLE: 'Apple',
  }
  return map[provider] || provider
}

function teamRoleLabel(role: string) {
  const map: Record<string, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Admin',
    MEMBER: 'Membre',
  }
  return map[role] || role
}

function flashSaved() {
  savedFlash.value = true
  setTimeout(() => {
    savedFlash.value = false
  }, 2200)
}

async function toggleActive() {
  if (!detail.value || !hasPermission('clients.update')) return
  busy.value = true
  error.value = null
  try {
    await updateClient(detail.value.id, {
      isActive: !detail.value.isActive,
    })
    await load()
    flashSaved()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Modification impossible'
  }
  finally {
    busy.value = false
  }
}

async function onDeleteSubscription(sub: {
  id: string
  offerTitle?: string | null
  offer?: { title: string } | null
  plan?: { name: string } | null
}) {
  const title = sub.offer?.title || sub.plan?.name || sub.offerTitle || 'cet abonnement'
  if (!confirm(`Supprimer l’abonnement « ${title} » ?`)) return

  deletingSubId.value = sub.id
  error.value = null
  try {
    await deleteSubscription(sub.id)
    await load()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Suppression impossible'
  }
  finally {
    deletingSubId.value = null
  }
}

await load()
</script>

<template>
  <section class="detail-page">
    <NuxtLink to="/admin/clients" class="back">
      <span aria-hidden="true">←</span>
      Clients
    </NuxtLink>

    <p v-if="error" class="banner-error" role="alert">{{ error }}</p>

    <div v-if="loading" class="skeleton-wrap">
      <div class="skeleton hero-skel" />
      <div class="skeleton meta-skel" />
      <div class="grid-skel">
        <div class="skeleton panel-skel" />
        <div class="skeleton panel-skel" />
      </div>
    </div>

    <template v-else-if="detail">
      <header class="hero">
        <div class="hero-main">
          <div class="avatar" :class="{ inactive: !detail.isActive }" aria-hidden="true">
            <img v-if="detail.avatarUrl" :src="detail.avatarUrl" :alt="fullName(detail)">
            <span v-else>{{ initials }}</span>
          </div>
          <div class="identity">
            <p class="eyebrow">Fiche client</p>
            <h1>{{ fullName(detail) }}</h1>
            <a class="email" :href="`mailto:${detail.email}`">{{ detail.email }}</a>
            <div class="tags">
              <span class="badge" :class="detail.isPremium ? 'badge-premium' : 'badge-free'">
                {{ detail.isPremium
                  ? (detail.subscription?.offerTitle || 'Premium')
                  : 'Gratuit' }}
              </span>
              <span class="badge" :class="detail.isActive ? 'badge-ok' : 'badge-off'">
                {{ detail.isActive ? 'Compte actif' : 'Compte inactif' }}
              </span>
              <span class="badge badge-auth">{{ authLabel(detail.authProvider) }}</span>
              <span v-if="savedFlash" class="badge badge-saved">Enregistré</span>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <button
            v-if="hasPermission('clients.update')"
            type="button"
            class="ghost"
            :class="{ danger: detail.isActive }"
            :disabled="busy"
            @click="toggleActive"
          >
            {{ detail.isActive ? 'Désactiver' : 'Réactiver' }}
          </button>
        </div>
      </header>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Téléphone</span>
          <strong>{{ detail.phone || '-' }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Cartes</span>
          <strong>{{ detail.stats.cardsCount }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Contacts</span>
          <strong>{{ detail.stats.contactsCount }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Vues</span>
          <strong>{{ detail.stats.viewsCount }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Partages</span>
          <strong>{{ detail.stats.sharesCount }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">Équipes</span>
          <strong>{{ detail.stats.ownedTeamsCount + detail.stats.teamsCount }}</strong>
        </div>
      </div>

      <div class="layout">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Compte</h2>
              <p class="panel-lead">Informations du profil app.</p>
            </div>
          </div>
          <dl class="info-list">
            <div>
              <dt>Prénom</dt>
              <dd>{{ detail.firstName || '-' }}</dd>
            </div>
            <div>
              <dt>Nom</dt>
              <dd>{{ detail.lastName || '-' }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a :href="`mailto:${detail.email}`">{{ detail.email }}</a>
              </dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>{{ detail.phone || '-' }}</dd>
            </div>
            <div>
              <dt>Inscription</dt>
              <dd>{{ formatDate(detail.createdAt) }}</dd>
            </div>
            <div>
              <dt>Dernière mise à jour</dt>
              <dd>{{ formatDate(detail.updatedAt) }}</dd>
            </div>
            <div v-if="detail.stripeCustomerId">
              <dt>Stripe</dt>
              <dd class="mono">{{ detail.stripeCustomerId }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Abonnement</h2>
              <p class="panel-lead">Offre en cours et historique.</p>
            </div>
          </div>

          <div v-if="detail.subscription" class="sub-active">
            <div class="sub-active-top">
              <strong>{{ detail.subscription.offerTitle }}</strong>
              <span class="badge badge-premium">
                {{ statusLabel(detail.subscription.status) }}
              </span>
            </div>
            <p>
              {{ billingLabel(detail.subscription.billingPeriod) }}
              <template v-if="detail.subscription.currentPeriodEnd">
                - fin le {{ formatShortDate(detail.subscription.currentPeriodEnd) }}
              </template>
            </p>
            <div v-if="canUpdateSubscription || canDeleteSubscription" class="sub-actions">
              <NuxtLink
                v-if="canUpdateSubscription"
                class="ghost sub-edit"
                :to="`/admin/subscriptions?edit=${detail.subscription.id}`"
              >
                Modifier l’abonnement
              </NuxtLink>
              <button
                v-if="canDeleteSubscription"
                type="button"
                class="ghost danger"
                :disabled="deletingSubId === detail.subscription.id"
                @click="onDeleteSubscription(detail.subscription)"
              >
                {{ deletingSubId === detail.subscription.id ? 'Suppression…' : 'Supprimer' }}
              </button>
            </div>
          </div>
          <div v-else class="sub-empty">
            <strong>Offre gratuite</strong>
            <p>Aucune offre premium active sur ce compte.</p>
          </div>

          <div v-if="detail.subscriptions.length" class="list">
            <p class="list-title">Historique</p>
            <article
              v-for="sub in detail.subscriptions"
              :key="sub.id"
              class="list-row"
            >
              <div>
                <strong>{{ sub.offer?.title || sub.plan?.name || 'Abonnement' }}</strong>
                <small>
                  {{ statusLabel(sub.status) }} - {{ billingLabel(sub.billingPeriod) }}
                  - {{ formatShortDate(sub.createdAt) }}
                </small>
              </div>
              <div class="row-actions">
                <NuxtLink
                  v-if="canUpdateSubscription"
                  class="ghost"
                  :to="`/admin/subscriptions?edit=${sub.id}`"
                >
                  Modifier
                </NuxtLink>
                <button
                  v-if="canDeleteSubscription"
                  type="button"
                  class="ghost danger"
                  :disabled="deletingSubId === sub.id"
                  @click="onDeleteSubscription(sub)"
                >
                  {{ deletingSubId === sub.id ? '…' : 'Supprimer' }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="panel panel-wide">
          <div class="panel-head">
            <div>
              <h2>Cartes de visite</h2>
              <p class="panel-lead">Cartes actives liées à ce client.</p>
            </div>
            <span class="count">{{ detail.cards.length }}</span>
          </div>

          <div v-if="detail.cards.length" class="cards-grid">
            <article
              v-for="card in detail.cards"
              :key="card.id"
              class="card-item"
            >
              <div class="card-item-top">
                <span class="badge badge-kind">{{ cardLabel(card.kind) }}</span>
                <span class="badge" :class="card.isPublic ? 'badge-ok' : 'badge-off'">
                  {{ card.isPublic ? 'Publique' : 'Privée' }}
                </span>
              </div>
              <h3>{{ card.firstName }} {{ card.lastName }}</h3>
              <p>
                {{ card.jobTitle || 'Sans poste' }}
                <template v-if="card.company"> - {{ card.company }}</template>
              </p>
              <div class="card-item-foot">
                <small>/{{ card.slug }}</small>
                <a
                  class="card-link"
                  :href="`${publicCardBase}/${card.slug}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir
                </a>
              </div>
            </article>
          </div>
          <p v-else class="muted">Aucune carte active.</p>
        </section>

        <section class="panel panel-wide">
          <div class="panel-head">
            <div>
              <h2>Équipes</h2>
              <p class="panel-lead">Équipes possédées et memberships.</p>
            </div>
          </div>

          <div v-if="detail.ownedTeams.length || detail.teams.length" class="list">
            <article
              v-for="team in detail.ownedTeams"
              :key="`own-${team.id}`"
              class="list-row"
            >
              <div>
                <strong>{{ team.name }}</strong>
                <small>
                  Propriétaire - {{ team.membersCount }} membre(s) - /{{ team.slug }}
                </small>
              </div>
              <span class="badge" :class="team.isActive ? 'badge-ok' : 'badge-off'">
                {{ team.isActive ? 'Active' : 'Inactive' }}
              </span>
            </article>
            <article
              v-for="team in detail.teams"
              :key="`mem-${team.id}`"
              class="list-row"
            >
              <div>
                <strong>{{ team.name }}</strong>
                <small>{{ teamRoleLabel(team.role) }} - /{{ team.slug }}</small>
              </div>
              <span class="badge" :class="team.isActive ? 'badge-ok' : 'badge-off'">
                {{ team.isActive ? 'Active' : 'Inactive' }}
              </span>
            </article>
          </div>
          <p v-else class="muted">Aucune équipe associée.</p>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
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

.banner-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff1f1;
  color: #b42318;
  font-weight: 600;
}

.skeleton-wrap { display: grid; gap: 14px; }
.grid-skel { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.skeleton {
  border-radius: var(--do-radius);
  background: linear-gradient(90deg, #eef1f6 25%, #f7f8fb 50%, #eef1f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}
.hero-skel { height: 148px; }
.meta-skel { height: 88px; }
.panel-skel { height: 220px; }
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
  width: 80px;
  height: 80px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--do-blue);
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(10, 107, 255, 0.28);
}
.avatar.inactive {
  background: #9aa3b2;
  box-shadow: none;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

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
  font-size: clamp(1.5rem, 2.5vw, 1.95rem);
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
.badge-premium { background: #fff6e8; color: #9a6700; }
.badge-free, .badge-off, .badge-auth { background: #f1f2f4; color: #5b616e; }
.badge-ok { background: #e8f8ef; color: #1b7a45; }
.badge-saved { background: #e8f8ef; color: #1b7a45; }
.badge-kind { background: var(--do-blue-soft); color: var(--do-blue); }

.ghost {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1.5px solid var(--do-line);
  background: #fff;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}
.ghost.danger {
  color: #b42318;
  border-color: #f3c1c1;
  background: #fff8f8;
}
.ghost:disabled { opacity: 0.45; cursor: not-allowed; }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
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
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.panel {
  padding: 22px 24px;
  display: grid;
  gap: 14px;
  align-content: start;
}
.panel-wide { grid-column: 1 / -1; }
.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
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
}
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
}

.info-list {
  margin: 0;
  display: grid;
  gap: 0;
}
.info-list > div {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--do-line);
}
.info-list > div:last-child { border-bottom: 0; }
.info-list dt {
  color: var(--do-muted);
  font-size: 0.82rem;
  font-weight: 700;
}
.info-list dd {
  margin: 0;
  font-weight: 600;
  word-break: break-word;
}
.info-list a {
  color: var(--do-blue);
  text-decoration: none;
  font-weight: 700;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
}

.sub-active, .sub-empty {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--do-line);
}
.sub-active {
  background: #fff6e8;
  border-color: #f0d9a8;
}
.sub-empty { background: var(--do-surface-soft); }
.sub-active-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}
.sub-active p, .sub-empty p {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.9rem;
}
.sub-edit { margin-top: 0; display: inline-flex; text-decoration: none; }
.sub-actions, .row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}
.list-row .row-actions { margin-top: 0; }
.sub-active p { color: #9a6700; }
.sub-empty strong, .sub-active strong { display: block; }

.list { display: grid; gap: 8px; }
.list-title {
  margin: 4px 0 0;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--do-muted);
}
.list-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--do-surface-soft);
  border: 1px solid var(--do-line);
}
.list-row strong { display: block; }
.list-row small { color: var(--do-muted); }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.card-item {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background: var(--do-surface-soft);
  border: 1px solid var(--do-line);
}
.card-item-top { display: flex; gap: 8px; flex-wrap: wrap; }
.card-item h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}
.card-item p {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.9rem;
}
.card-item-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.card-item-foot small { color: var(--do-muted); }
.card-link {
  color: var(--do-blue);
  font-weight: 700;
  font-size: 0.85rem;
  text-decoration: none;
}
.muted { margin: 0; color: var(--do-muted); }

@media (max-width: 1000px) {
  .meta-grid { grid-template-columns: repeat(3, 1fr); }
  .meta-item:nth-child(3n) { border-right: 0; }
  .meta-item:nth-child(-n+3) { border-bottom: 1px solid var(--do-line); }
  .layout { grid-template-columns: 1fr; }
  .grid-skel { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .meta-grid { grid-template-columns: 1fr 1fr; }
  .meta-item { border-right: 1px solid var(--do-line); border-bottom: 1px solid var(--do-line); }
  .meta-item:nth-child(2n) { border-right: 0; }
  .info-list > div { grid-template-columns: 1fr; gap: 4px; }
  .avatar { width: 64px; height: 64px; border-radius: 16px; font-size: 1.2rem; }
}
</style>
