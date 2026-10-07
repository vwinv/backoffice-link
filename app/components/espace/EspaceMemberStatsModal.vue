<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import type { EspaceMemberAnalytics } from '~/composables/useEspace'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
)

const props = defineProps<{
  open: boolean
  slug: string
  memberId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { getMemberAnalytics } = useEspace()
const { baseURL } = useApi()

const days = ref(30)
const loading = ref(false)
const errorMessage = ref('')
const detail = ref<EspaceMemberAnalytics | null>(null)

const DO_BLUE = '#0a6bff'
const DO_INK = '#0c0d10'
const DO_MUTED = '#5b616e'
const SOURCE_COLORS: Record<string, string> = {
  qr: '#0a6bff',
  share: '#34C759',
  link: '#FF9500',
  app: '#5AC8FA',
  other: '#5b616e',
}

const sourceLabels: Record<string, string> = {
  qr: 'QR code',
  share: 'Partage',
  link: 'Lien',
  app: 'App',
  other: 'Autre',
}

const memberName = computed(() => {
  const user = detail.value?.member.user
  if (!user) return ''
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email
})

const initials = computed(() => {
  const user = detail.value?.member.user
  if (!user) return '?'
  const a = user.firstName?.[0] ?? ''
  const b = user.lastName?.[0] ?? ''
  const value = `${a}${b}`.trim()
  return value || user.email.slice(0, 2).toUpperCase()
})

const avatarUrl = computed(() => {
  const url = detail.value?.member.user.avatarUrl?.trim()
  if (!url) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (url.startsWith('/')) {
    const origin = baseURL.replace(/\/api\/v1\/?$/, '')
    return `${origin}${url}`
  }
  return url
})

const changePositive = computed(
  () => (detail.value?.analytics.viewsChangePercent ?? 0) >= 0,
)

const viewsLineData = computed(() => {
  const series = detail.value?.analytics.viewsSeries ?? []
  return {
    labels: series.map(point => point.label),
    datasets: [
      {
        label: 'Vues',
        data: series.map(point => point.count),
        borderColor: DO_BLUE,
        backgroundColor: 'rgba(10, 107, 255, 0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: days.value <= 7 ? 4 : 0,
        pointHoverRadius: 5,
        borderWidth: 2.5,
      },
    ],
  }
})

const viewsLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: DO_INK,
      titleFont: { family: 'Plus Jakarta Sans', weight: 700 as const },
      bodyFont: { family: 'Plus Jakarta Sans' },
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: DO_MUTED,
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 10,
        font: { family: 'Plus Jakarta Sans', size: 11 },
      },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(236, 240, 251, 1)' },
      ticks: {
        color: DO_MUTED,
        precision: 0,
        font: { family: 'Plus Jakarta Sans', size: 11 },
      },
      border: { display: false },
    },
  },
}

const comparisonBarData = computed(() => {
  const a = detail.value?.analytics
  return {
    labels: ['Vues', 'Uniques', 'Partages', 'Sauvegardes'],
    datasets: [
      {
        label: 'Total',
        data: [
          a?.views ?? 0,
          a?.uniqueVisitors ?? 0,
          a?.shares ?? 0,
          a?.saved ?? 0,
        ],
        backgroundColor: ['#0a6bff', '#34C759', '#FF9500', '#AF52DE'],
        borderRadius: 10,
        maxBarThickness: 48,
      },
    ],
  }
})

const comparisonBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: DO_INK,
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: DO_MUTED,
        font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 as const },
      },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(236, 240, 251, 1)' },
      ticks: {
        color: DO_MUTED,
        precision: 0,
        font: { family: 'Plus Jakarta Sans', size: 11 },
      },
      border: { display: false },
    },
  },
}

const sourcesDoughnutData = computed(() => {
  const sources = detail.value?.analytics.sources ?? []
  return {
    labels: sources.map((source) => {
      const key = source.key === 'nfc' ? 'other' : source.key
      return sourceLabels[key] || key
    }),
    datasets: [
      {
        data: sources.map(source => source.count),
        backgroundColor: sources.map((source) => {
          const key = source.key === 'nfc' ? 'other' : source.key
          return SOURCE_COLORS[key] || '#5b616e'
        }),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }
})

const sourcesTotal = computed(() =>
  (detail.value?.analytics.sources ?? []).reduce(
    (sum, source) => sum + source.count,
    0,
  ),
)

const sourcesDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: 'circle' as const,
        color: DO_MUTED,
        font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 as const },
        padding: 14,
      },
    },
    tooltip: {
      backgroundColor: DO_INK,
      padding: 12,
      cornerRadius: 10,
    },
  },
}

function sparklineData(values: number[], color: string) {
  return {
    labels: values.map((_, index) => String(index + 1)),
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: `${color}22`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }
}

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { display: false },
    y: { display: false },
  },
  elements: { line: { borderJoinStyle: 'round' as const } },
}

async function load() {
  if (!props.open || !props.memberId || !props.slug) return
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getMemberAnalytics(
      props.slug,
      props.memberId,
      days.value,
    )
  }
  catch (error: unknown) {
    detail.value = null
    errorMessage.value = error instanceof ApiError
      ? error.message
      : 'Impossible de charger les statistiques'
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.memberId, props.slug, days.value] as const,
  ([isOpen]) => {
    if (isOpen) load()
    else {
      detail.value = null
      errorMessage.value = ''
    }
  },
)

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="backdrop"
      @click="onBackdropClick"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-stats-title"
      >
        <header class="modal-head">
          <div class="identity">
            <span class="avatar">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="memberName"
              >
              <span v-else>{{ initials }}</span>
            </span>
            <div>
              <p class="eyebrow">
                Statistiques membre
              </p>
              <h2 id="member-stats-title">
                {{ memberName || 'Chargement…' }}
              </h2>
              <p
                v-if="detail"
                class="sub"
              >
                {{ detail.member.user.email }} - {{ detail.member.role }}
              </p>
            </div>
          </div>

          <div class="head-actions">
            <div class="period">
              <button
                type="button"
                :class="{ active: days === 7 }"
                @click="days = 7"
              >
                7 jours
              </button>
              <button
                type="button"
                :class="{ active: days === 30 }"
                @click="days = 30"
              >
                30 jours
              </button>
            </div>
            <button
              type="button"
              class="close"
              aria-label="Fermer"
              @click="emit('close')"
            >
              ×
            </button>
          </div>
        </header>

        <p
          v-if="loading"
          class="state"
        >
          Chargement…
        </p>
        <p
          v-else-if="errorMessage"
          class="state error"
        >
          {{ errorMessage }}
        </p>
        <template v-else-if="detail">
          <section class="hero-stats">
            <div>
              <p class="label">
                Vues totales
              </p>
              <p class="big">
                {{ detail.analytics.views }}
              </p>
              <p
                class="change"
                :class="{ up: changePositive, down: !changePositive }"
              >
                {{ changePositive ? '↑' : '↓' }}
                {{ changePositive ? '+' : '' }}{{ detail.analytics.viewsChangePercent }}%
                vs période préc.
              </p>
            </div>
            <p class="period-views">
              {{ detail.analytics.periodViews }} vues sur {{ detail.analytics.periodDays }} jours
            </p>
          </section>

          <section class="metrics">
            <div class="metric">
              <div class="metric-top">
                <span class="metric-label">Personnes uniques</span>
                <strong>{{ detail.analytics.uniqueVisitors }}</strong>
              </div>
              <div class="spark">
                <Line
                  :data="sparklineData(detail.analytics.sparklines.uniqueVisitors, '#34C759')"
                  :options="sparklineOptions"
                />
              </div>
            </div>
            <div class="metric">
              <div class="metric-top">
                <span class="metric-label">Partages</span>
                <strong>{{ detail.analytics.shares }}</strong>
              </div>
              <div class="spark">
                <Line
                  :data="sparklineData(detail.analytics.sparklines.shares, '#FF9500')"
                  :options="sparklineOptions"
                />
              </div>
            </div>
            <div class="metric">
              <div class="metric-top">
                <span class="metric-label">Sauvegardes</span>
                <strong>{{ detail.analytics.saved }}</strong>
              </div>
              <div class="spark">
                <Line
                  :data="sparklineData(detail.analytics.sparklines.saved, '#AF52DE')"
                  :options="sparklineOptions"
                />
              </div>
            </div>
            <div class="metric">
              <div class="metric-top">
                <span class="metric-label">Cartes</span>
                <strong>{{ detail.cards.length }}</strong>
              </div>
              <div class="spark">
                <Line
                  :data="sparklineData(detail.analytics.sparklines.views, '#0a6bff')"
                  :options="sparklineOptions"
                />
              </div>
            </div>
          </section>

          <section class="charts-grid">
            <div class="chart-card wide">
              <h3>Évolution des vues</h3>
              <div class="chart-wrap tall">
                <Line
                  :data="viewsLineData"
                  :options="viewsLineOptions"
                />
              </div>
            </div>

            <div class="chart-card">
              <h3>Comparaison des indicateurs</h3>
              <div class="chart-wrap">
                <Bar
                  :data="comparisonBarData"
                  :options="comparisonBarOptions"
                />
              </div>
            </div>

            <div class="chart-card">
              <h3>Sources de découverte</h3>
              <div class="donut-wrap">
                <Doughnut
                  :data="sourcesDoughnutData"
                  :options="sourcesDoughnutOptions"
                />
                <div class="donut-center">
                  <p class="donut-value">
                    {{ sourcesTotal }}
                  </p>
                  <p class="donut-label">
                    Total
                  </p>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(12, 13, 16, 0.5);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal {
  width: min(1100px, 96vw);
  max-height: min(94vh, 980px);
  overflow: auto;
  background: #fff;
  border-radius: 24px;
  border: 1px solid #ECF0FB;
  box-shadow: 0 28px 80px rgba(12, 13, 16, 0.22);
  padding: 24px 26px 28px;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--do-muted);
  font-weight: 700;
}

h2 {
  margin: 2px 0 0;
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}

.sub {
  margin: 4px 0 0;
  color: var(--do-muted);
  font-size: 0.9rem;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.period {
  display: flex;
  gap: 8px;
}

.period button {
  border: 1px solid #ECF0FB;
  background: #fff;
  border-radius: 999px;
  padding: 9px 16px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--do-muted);
}

.period button.active {
  background: var(--do-ink);
  border-color: var(--do-ink);
  color: #fff;
}

.close {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 12px;
  background: var(--do-surface-soft);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--do-muted);
}

.state {
  color: var(--do-muted);
  font-weight: 600;
  padding: 40px 0;
  text-align: center;
}

.state.error {
  color: #b42318;
}

.hero-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
  padding: 16px 18px;
  border: 1px solid #ECF0FB;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8faff 0%, #fff 100%);
}

.label {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.big {
  margin: 6px 0;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
}

.change {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}

.change.up {
  color: #027a48;
}

.change.down {
  color: #b42318;
}

.period-views {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.92rem;
  font-weight: 600;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  border: 1px solid #ECF0FB;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 118px;
}

.metric-top {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  color: var(--do-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.metric strong {
  font-size: 1.5rem;
  letter-spacing: -0.03em;
}

.spark {
  height: 42px;
  margin-top: auto;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
}

.chart-card {
  border: 1px solid #ECF0FB;
  border-radius: 18px;
  padding: 16px;
  background: #fff;
}

.chart-card.wide {
  grid-column: 1 / -1;
}

h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.chart-wrap {
  height: 240px;
  width: 100%;
}

.chart-wrap.tall {
  height: 300px;
}

.donut-wrap {
  position: relative;
  height: 260px;
  width: 100%;
}

.donut-center {
  position: absolute;
  inset: 0 0 56px;
  display: grid;
  place-content: center;
  pointer-events: none;
  text-align: center;
}

.donut-value {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.donut-label {
  margin: 4px 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--do-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 900px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .big {
    font-size: 2.4rem;
  }
}

@media (max-width: 560px) {
  .modal {
    padding: 16px;
  }

  .metrics {
    grid-template-columns: 1fr;
  }

  .chart-wrap,
  .chart-wrap.tall,
  .donut-wrap {
    height: 220px;
  }
}
</style>
