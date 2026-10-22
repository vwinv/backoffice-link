<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const { displayName } = useAuth()
const { stats, loading, error, fetchStats } = useAdminDashboard()

await useAsyncData('admin-dashboard', async () => {
  try {
    await fetchStats(true)
  }
  catch {
    // error déjà renseigné dans le composable
  }
  return true
})

function formatNumber(value: number | undefined) {
  if (value == null) return '-'
  return new Intl.NumberFormat('fr-FR').format(value)
}

function formatMoney(value: number | undefined, currency = 'FCFA') {
  if (value == null) return '-'
  return `${new Intl.NumberFormat('fr-FR').format(value)} ${currency}`
}

function formatDate(iso: string | undefined) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const overview = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    {
      label: 'CA abonnements',
      valueLabel: formatMoney(s.revenue.total, s.revenue.currency),
      hint: `${formatMoney(s.revenue.active, s.revenue.currency)} en cours`,
    },
    {
      label: 'Utilisateurs',
      valueLabel: formatNumber(s.users.total),
      hint: `+${s.users.newLast7Days} cette semaine`,
    },
    {
      label: 'Abonnements actifs',
      valueLabel: formatNumber(s.subscriptions.active),
      hint: `${s.subscriptions.paying} payants`,
    },
    {
      label: 'Vues de cartes',
      valueLabel: formatNumber(s.engagement.cardViews),
      hint: `+${s.engagement.cardViewsLast7Days} / 7 j`,
    },
  ]
})

const topOffers = computed(() => stats.value?.revenue.byOffer.slice(0, 5) ?? [])
</script>

<template>
  <section class="dashboard">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Tableau de bord
        </p>
        <h1>
          Bienvenue{{ displayName ? `, ${displayName}` : '' }}
        </h1>
        <p class="lead">
          Vue d’ensemble de la plateforme DropOne.
        </p>
      </div>
      <div class="hero-meta">
        <button
          type="button"
          class="refresh"
          :disabled="loading"
          @click="fetchStats(true)"
        >
          {{ loading ? 'Actualisation…' : 'Actualiser' }}
        </button>
        <p v-if="stats?.generatedAt" class="updated">
          Mis à jour {{ formatDate(stats.generatedAt) }}
        </p>
      </div>
    </header>

    <p v-if="error" class="banner-error" role="alert">
      {{ error }}
    </p>

    <div v-if="loading && !stats" class="loading">
      Chargement des statistiques…
    </div>

    <template v-else-if="stats">
      <div class="overview">
        <article
          v-for="item in overview"
          :key="item.label"
          class="stat"
        >
          <p class="stat-label">
            {{ item.label }}
          </p>
          <p class="stat-value">
            {{ item.valueLabel }}
          </p>
          <p class="stat-hint">
            {{ item.hint }}
          </p>
        </article>
      </div>

      <div v-if="stats.charts" class="charts">
        <section class="chart-panel chart-panel--wide">
          <div class="chart-head">
            <h2>Activité (30 jours)</h2>
            <p>Vues, partages et nouveaux utilisateurs</p>
          </div>
          <AdminActivityChart :series="stats.charts.activity30d" />
        </section>

        <section class="chart-panel chart-panel--wide revenue-panel">
          <div class="chart-head">
            <h2>Offres les plus rentables</h2>
            <p>
              Classement par chiffre d’affaires (hors essais) -
              total {{ formatMoney(stats.revenue.total, stats.revenue.currency) }}
            </p>
          </div>

          <div class="revenue-grid">
            <AdminRevenueChart
              v-if="stats.charts.revenueByOffer.labels.length > 0"
              :series="stats.charts.revenueByOffer"
            />
            <p v-else class="empty-revenue">
              Aucun revenu d’abonnement pour le moment.
            </p>

            <div class="offer-rank">
              <article
                v-for="(offer, index) in topOffers"
                :key="offer.offerId"
                class="offer-row"
              >
                <span class="rank">{{ index + 1 }}</span>
                <div class="offer-meta">
                  <strong>{{ offer.title }}</strong>
                  <small>
                    {{ offer.subscriptionsCount }} abo -
                    actif {{ formatMoney(offer.activeRevenue, stats.revenue.currency) }}
                  </small>
                </div>
                <strong class="offer-amount">
                  {{ formatMoney(offer.revenue, stats.revenue.currency) }}
                </strong>
              </article>
              <p v-if="topOffers.length === 0" class="empty-revenue">
                Pas encore d’offres payantes.
              </p>
            </div>
          </div>
        </section>

        <div class="charts-split">
          <section class="chart-panel chart-panel--equal">
            <div class="chart-head">
              <h2>Types de cartes</h2>
              <p>Répartition perso / pro / membre</p>
            </div>
            <AdminDoughnutChart
              :series="stats.charts.cardsByKind"
              :colors="['#0a6bff', '#ffc400', '#0c0d10']"
            />
          </section>

          <section class="chart-panel chart-panel--equal">
            <div class="chart-head">
              <h2>Abonnements</h2>
              <p>Répartition par statut</p>
            </div>
            <AdminDoughnutChart
              :series="stats.charts.subscriptionsByStatus"
              :colors="['#0a6bff', '#ffc400', '#e84545', '#5b616e', '#85aeff']"
            />
          </section>
        </div>
      </div>

      <div class="panels">
        <section class="panel">
          <h2>Utilisateurs</h2>
          <dl>
            <div>
              <dt>Total</dt>
              <dd>{{ formatNumber(stats.users.total) }}</dd>
            </div>
            <div>
              <dt>Actifs</dt>
              <dd>{{ formatNumber(stats.users.active) }}</dd>
            </div>
            <div>
              <dt>Admins</dt>
              <dd>{{ formatNumber(stats.users.admins) }}</dd>
            </div>
            <div>
              <dt>Nouveaux (7 j)</dt>
              <dd>{{ formatNumber(stats.users.newLast7Days) }}</dd>
            </div>
            <div>
              <dt>Nouveaux (30 j)</dt>
              <dd>{{ formatNumber(stats.users.newLast30Days) }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <h2>Cartes</h2>
          <dl>
            <div>
              <dt>Total</dt>
              <dd>{{ formatNumber(stats.cards.total) }}</dd>
            </div>
            <div>
              <dt>Actives</dt>
              <dd>{{ formatNumber(stats.cards.active) }}</dd>
            </div>
            <div>
              <dt>Publiques</dt>
              <dd>{{ formatNumber(stats.cards.public) }}</dd>
            </div>
            <div>
              <dt>Personnelles</dt>
              <dd>{{ formatNumber(stats.cards.personal) }}</dd>
            </div>
            <div>
              <dt>Professionnelles</dt>
              <dd>{{ formatNumber(stats.cards.professional) }}</dd>
            </div>
            <div>
              <dt>Membres équipe</dt>
              <dd>{{ formatNumber(stats.cards.member) }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <h2>Abonnements & équipes</h2>
          <dl>
            <div>
              <dt>Équipes</dt>
              <dd>{{ formatNumber(stats.teams.total) }}</dd>
            </div>
            <div>
              <dt>Actifs</dt>
              <dd>{{ formatNumber(stats.subscriptions.active) }}</dd>
            </div>
            <div>
              <dt>Essai</dt>
              <dd>{{ formatNumber(stats.subscriptions.trial) }}</dd>
            </div>
            <div>
              <dt>En retard</dt>
              <dd>{{ formatNumber(stats.subscriptions.pastDue) }}</dd>
            </div>
            <div>
              <dt>Annulés</dt>
              <dd>{{ formatNumber(stats.subscriptions.cancelled) }}</dd>
            </div>
            <div>
              <dt>Expirés</dt>
              <dd>{{ formatNumber(stats.subscriptions.expired) }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <h2>Engagement</h2>
          <dl>
            <div>
              <dt>Vues</dt>
              <dd>{{ formatNumber(stats.engagement.cardViews) }}</dd>
            </div>
            <div>
              <dt>Vues (7 j)</dt>
              <dd>{{ formatNumber(stats.engagement.cardViewsLast7Days) }}</dd>
            </div>
            <div>
              <dt>Partages</dt>
              <dd>{{ formatNumber(stats.engagement.shares) }}</dd>
            </div>
            <div>
              <dt>Partages (7 j)</dt>
              <dd>{{ formatNumber(stats.engagement.sharesLast7Days) }}</dd>
            </div>
            <div>
              <dt>Contacts</dt>
              <dd>{{ formatNumber(stats.engagement.contacts) }}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{{ formatNumber(stats.engagement.walletSaves) }}</dd>
            </div>
            <div>
              <dt>Scans IA</dt>
              <dd>{{ formatNumber(stats.engagement.aiScans) }}</dd>
            </div>
            <div>
              <dt>Scans IA (7 j)</dt>
              <dd>{{ formatNumber(stats.engagement.aiScansLast7Days) }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1100px;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding: 22px 24px;
  border-radius: var(--do-radius);
  background:
    linear-gradient(135deg, rgba(10, 107, 255, 0.1), transparent 55%),
    var(--do-surface);
  border: 1px solid var(--do-line);
  box-shadow: var(--do-shadow);
}

.eyebrow {
  margin: 0 0 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0 8px;
  font-size: clamp(1.6rem, 2vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--do-ink);
}

.lead {
  margin: 0;
  color: var(--do-muted);
}

.hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.refresh {
  min-height: 40px;
  padding: 0 16px;
  border: 1.5px solid var(--do-line);
  border-radius: 12px;
  background: var(--do-surface);
  color: var(--do-ink);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.refresh:hover:not(:disabled) {
  border-color: var(--do-blue);
  color: var(--do-blue);
  background: var(--do-blue-soft);
}

.refresh:disabled {
  opacity: 0.6;
  cursor: wait;
}

.updated {
  margin: 0;
  font-size: 0.8rem;
  color: var(--do-muted);
}

.banner-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--do-radius-sm);
  background: #fff1f1;
  color: #b42318;
  font-weight: 600;
}

.loading {
  color: var(--do-muted);
}

.overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat {
  position: relative;
  overflow: hidden;
  padding: 20px 18px;
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1px solid var(--do-line);
  box-shadow: var(--do-shadow);
}

.stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--do-blue), var(--do-gold));
}

.stat-label {
  margin: 0 0 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--do-muted);
}

.stat-value {
  margin: 0 0 6px;
  font-size: clamp(1.25rem, 2vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.15;
  color: var(--do-ink);
  word-break: break-word;
}

.stat-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--do-blue);
  font-weight: 700;
}

.revenue-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
  align-items: stretch;
}

.offer-rank {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.offer-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--do-surface-soft);
  border: 1px solid var(--do-line);
}

.rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--do-blue);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
}

.offer-meta {
  min-width: 0;
}

.offer-meta strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
}

.offer-meta small {
  display: block;
  margin-top: 2px;
  color: var(--do-muted);
  font-size: 0.78rem;
}

.offer-amount {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--do-ink);
  white-space: nowrap;
}

.empty-revenue {
  margin: 0;
  color: var(--do-muted);
  padding: 24px 0;
}

.charts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.charts-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.chart-panel {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}

.chart-panel--equal {
  min-height: 360px;
}

.chart-panel--wide {
  width: 100%;
}

.chart-head {
  margin-bottom: 12px;
}

.chart-head h2 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--do-ink);
}

.chart-head p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--do-muted);
}

.panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  padding: 22px 20px;
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}

.panel h2 {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--do-ink);
  padding-bottom: 12px;
  border-bottom: 2px solid var(--do-blue-soft);
}

.panel dl {
  margin: 0;
  display: grid;
  gap: 10px;
}

.panel dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--do-line);
}

.panel dl > div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.panel dt {
  color: var(--do-muted);
  font-size: 0.9rem;
}

.panel dd {
  margin: 0;
  font-weight: 800;
  color: var(--do-ink);
}

@media (max-width: 960px) {
  .overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-split,
  .revenue-grid {
    grid-template-columns: 1fr;
  }

  .panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .overview {
    grid-template-columns: 1fr;
  }

  .hero-meta {
    align-items: flex-start;
  }
}
</style>
