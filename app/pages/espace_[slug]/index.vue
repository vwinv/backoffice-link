<script setup lang="ts">
import type { EspaceVisitorsPayload } from '~/composables/useEspace'

definePageMeta({
  layout: 'espace',
})

const route = useRoute()
const { t, locale } = useI18n()
const { getDashboard, getVisitors } = useEspace()
const { setFromTeam } = useEspaceTeamBrand()
const { baseURL } = useApi()

const slug = computed(() => String(route.params.slug || ''))

const loading = ref(true)
const errorMessage = ref('')
const dashboard = ref<Awaited<ReturnType<typeof getDashboard>> | null>(null)

const statsOpen = ref(false)
const selectedMemberId = ref<string | null>(null)

const visitorFilter = ref<'all' | 'dropone' | 'guest'>('all')
const visitorsLoading = ref(false)
const visitorsError = ref('')
const visitorsLocked = ref(false)
const visitorsPayload = ref<EspaceVisitorsPayload | null>(null)

function openMemberStats(memberId: string) {
  selectedMemberId.value = memberId
  statsOpen.value = true
}

function closeMemberStats() {
  statsOpen.value = false
  selectedMemberId.value = null
}

async function loadVisitors() {
  if (!slug.value) return
  visitorsLoading.value = true
  visitorsError.value = ''
  visitorsLocked.value = false
  try {
    visitorsPayload.value = await getVisitors(slug.value, visitorFilter.value)
  }
  catch (error: unknown) {
    visitorsPayload.value = null
    if (error instanceof ApiError && error.statusCode === 403) {
      visitorsLocked.value = true
      visitorsError.value = t('espace.dashboard.visitorsLocked')
    }
    else {
      visitorsError.value = error instanceof ApiError
        ? error.message
        : t('espace.dashboard.visitorsLoadError')
    }
  }
  finally {
    visitorsLoading.value = false
  }
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    dashboard.value = await getDashboard(slug.value)
    setFromTeam(dashboard.value.team)
    await loadVisitors()
  }
  catch (error: unknown) {
    dashboard.value = null
    visitorsPayload.value = null
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.dashboard.loadError')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
watch(slug, load)
watch(visitorFilter, loadVisitors)

function formatSeats(used: number, max: number) {
  if (max < 0) return `${used} / ∞`
  return `${used} / ${max}`
}

function memberName(user: { firstName: string, lastName: string, email: string }) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email
}

function resolveAvatar(url: string | null) {
  if (!url?.trim()) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (url.startsWith('/')) {
    const origin = baseURL.replace(/\/api\/v1\/?$/, '')
    return `${origin}${url}`
  }
  return url
}

function formatViewedAt(iso: string) {
  try {
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  }
  catch {
    return iso
  }
}
</script>

<template>
  <div>
    <p
      v-if="loading"
      class="state"
    >
      {{ $t('espace.dashboard.loading') }}
    </p>
    <p
      v-else-if="errorMessage"
      class="state error"
    >
      {{ errorMessage }}
    </p>
    <template v-else-if="dashboard">
      <header class="hero">
        <div class="hero-main">
          <EspaceTeamMark
            :name="dashboard.team.name"
            :logo-url="dashboard.team.logoUrl"
            :brand-color="dashboard.team.brandColor"
            :size="72"
          />
          <div>
            <p class="eyebrow">
              {{ dashboard.espacePath }}
            </p>
            <h1>{{ dashboard.team.name }}</h1>
            <p class="lead">
              {{
                dashboard.subscription?.offer?.title
                  ? $t('espace.dashboard.offer', { title: dashboard.subscription.offer.title })
                  : $t('espace.dashboard.fallbackLead')
              }}
            </p>
          </div>
        </div>
        <div class="seat-pill">
          {{ $t('espace.dashboard.seats', { used: formatSeats(dashboard.seats.used, dashboard.seats.max) }) }}
        </div>
      </header>

      <section class="kpis">
        <div class="kpi">
          <span>{{ $t('espace.dashboard.views') }}</span>
          <strong>{{ dashboard.totals.views }}</strong>
        </div>
        <div class="kpi">
          <span>{{ $t('espace.dashboard.shares') }}</span>
          <strong>{{ dashboard.totals.shares }}</strong>
        </div>
        <div class="kpi">
          <span>{{ $t('espace.dashboard.saves') }}</span>
          <strong>{{ dashboard.totals.saves }}</strong>
        </div>
        <div class="kpi">
          <span>{{ $t('espace.dashboard.cards') }}</span>
          <strong>{{ dashboard.totals.cards }}</strong>
        </div>
      </section>

      <section class="panel visitors-panel">
        <div class="panel-head">
          <div>
            <h2>{{ $t('espace.dashboard.visitors') }}</h2>
            <p class="panel-lead">
              {{ $t('espace.dashboard.visitorsLead') }}
            </p>
          </div>
          <div class="visitor-filters">
            <button
              v-for="option in ([
                ['all', 'visitorsFilterAll'],
                ['dropone', 'visitorsFilterDropOne'],
                ['guest', 'visitorsFilterGuest'],
              ] as const)"
              :key="option[0]"
              type="button"
              class="filter-chip"
              :class="{ active: visitorFilter === option[0] }"
              :disabled="visitorsLoading || visitorsLocked"
              @click="visitorFilter = option[0]"
            >
              {{ $t(`espace.dashboard.${option[1]}`) }}
            </button>
          </div>
        </div>

        <div
          v-if="visitorsPayload"
          class="visitor-summary"
        >
          <div>
            <span>{{ $t('espace.dashboard.views') }}</span>
            <strong>{{ visitorsPayload.summary.views }}</strong>
          </div>
          <div>
            <span>{{ $t('espace.dashboard.visitorsUnique') }}</span>
            <strong>{{ visitorsPayload.summary.uniqueVisitors }}</strong>
          </div>
          <div>
            <span>{{ $t('espace.dashboard.visitorsDropOne') }}</span>
            <strong>{{ visitorsPayload.summary.dropOneCount }}</strong>
          </div>
          <div>
            <span>{{ $t('espace.dashboard.visitorsGuest') }}</span>
            <strong>{{ visitorsPayload.summary.guestCount }}</strong>
          </div>
        </div>

        <p
          v-if="visitorsLoading"
          class="state soft"
        >
          {{ $t('espace.dashboard.loading') }}
        </p>
        <p
          v-else-if="visitorsError"
          class="state soft"
          :class="{ error: !visitorsLocked }"
        >
          {{ visitorsError }}
        </p>
        <p
          v-else-if="!visitorsPayload?.visitors.length"
          class="state soft"
        >
          {{ $t('espace.dashboard.visitorsEmpty') }}
        </p>
        <ul
          v-else
          class="visitor-list"
        >
          <li
            v-for="visitor in visitorsPayload.visitors"
            :key="visitor.id"
            class="visitor-row"
          >
            <div
              class="visitor-avatar"
              aria-hidden="true"
            >
              <img
                v-if="resolveAvatar(visitor.avatarUrl)"
                :src="resolveAvatar(visitor.avatarUrl)!"
                alt=""
              >
              <span v-else>{{ visitor.initials }}</span>
            </div>
            <div class="visitor-main">
              <div class="visitor-top">
                <strong>{{ visitor.displayName }}</strong>
                <span
                  class="badge"
                  :class="visitor.isDropOneUser ? 'dropone' : 'guest'"
                >
                  {{
                    visitor.isDropOneUser
                      ? $t('espace.dashboard.visitorsDropOne')
                      : $t('espace.dashboard.visitorsGuest')
                  }}
                </span>
              </div>
              <p
                v-if="visitor.subtitle"
                class="visitor-sub"
              >
                {{ visitor.subtitle }}
              </p>
              <p class="visitor-meta">
                <span>{{ formatViewedAt(visitor.viewedAt) }}</span>
                <span v-if="visitor.card">
                  · {{ $t('espace.dashboard.visitorsCardOf', { name: visitor.card.ownerName }) }}
                </span>
                <span v-if="visitor.deviceLabel">
                  · {{ visitor.deviceLabel }}
                </span>
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>{{ $t('espace.dashboard.statsByMember') }}</h2>
          <NuxtLink :to="`${dashboard.espacePath}/membres`">
            {{ $t('espace.dashboard.manageMembers') }}
          </NuxtLink>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ $t('espace.dashboard.member') }}</th>
                <th>{{ $t('espace.dashboard.role') }}</th>
                <th>{{ $t('espace.dashboard.views') }}</th>
                <th>{{ $t('espace.dashboard.shares') }}</th>
                <th>{{ $t('espace.dashboard.saves') }}</th>
                <th class="col-action">
                  {{ $t('espace.dashboard.see') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in dashboard.members"
                :key="row.memberId"
              >
                <td>
                  <div class="member">
                    <strong>{{ memberName(row.user) }}</strong>
                    <span>{{ row.user.email }}</span>
                  </div>
                </td>
                <td>{{ row.role }}</td>
                <td>{{ row.stats.views }}</td>
                <td>{{ row.stats.shares }}</td>
                <td>{{ row.stats.saves }}</td>
                <td class="col-action">
                  <button
                    type="button"
                    class="view-btn"
                    :aria-label="$t('espace.dashboard.seeStats', { name: memberName(row.user) })"
                    @click="openMemberStats(row.memberId)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <EspaceMemberStatsModal
        :open="statsOpen"
        :slug="slug"
        :member-id="selectedMemberId"
        @close="closeMemberStats"
      />
    </template>
  </div>
</template>

<style scoped>
.state {
  color: var(--do-muted);
  font-weight: 600;
}

.state.error {
  color: #b42318;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--do-muted);
  font-weight: 700;
}

h1 {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  letter-spacing: -0.03em;
}

.lead {
  margin: 8px 0 0;
  color: var(--do-muted);
}

.seat-pill {
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-weight: 700;
  font-size: 0.88rem;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.kpi {
  background: var(--do-surface);
  border: 1px solid #ECF0FB;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi span {
  color: var(--do-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.kpi strong {
  font-size: 1.55rem;
  letter-spacing: -0.03em;
}

.panel {
  background: var(--do-surface);
  border: 1px solid #ECF0FB;
  border-radius: 18px;
  padding: 18px;
}

.visitors-panel {
  margin-bottom: 22px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.panel-lead {
  margin: 4px 0 0;
  color: var(--do-muted);
  font-size: 0.88rem;
}

.panel-head a {
  color: var(--do-blue);
  font-weight: 700;
  font-size: 0.9rem;
}

.visitor-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid #ECF0FB;
  background: #fff;
  color: var(--do-muted);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.filter-chip.active {
  background: var(--do-blue-soft);
  color: var(--do-blue);
  border-color: transparent;
}

.filter-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.visitor-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.visitor-summary div {
  background: #F7F9FF;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.visitor-summary span {
  color: var(--do-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.visitor-summary strong {
  font-size: 1.2rem;
  letter-spacing: -0.02em;
}

.state.soft {
  margin: 8px 0 0;
}

.visitor-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.visitor-row {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--do-line);
}

.visitor-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.visitor-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.82rem;
  overflow: hidden;
  flex-shrink: 0;
}

.visitor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visitor-main {
  min-width: 0;
  flex: 1;
}

.visitor-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.visitor-top strong {
  font-size: 0.95rem;
}

.badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
}

.badge.dropone {
  background: #E6F9F3;
  color: #1B7A45;
}

.badge.guest {
  background: #F2F2F7;
  color: #5B616E;
}

.visitor-sub,
.visitor-meta {
  margin: 3px 0 0;
  color: var(--do-muted);
  font-size: 0.84rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid var(--do-line);
  font-size: 0.92rem;
}

th {
  color: var(--do-muted);
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.member {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member span {
  color: var(--do-muted);
  font-size: 0.85rem;
}

.col-action {
  width: 64px;
  text-align: center;
}

.view-btn {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #ECF0FB;
  border-radius: 10px;
  background: #fff;
  color: var(--do-blue);
  cursor: pointer;
}

.view-btn:hover {
  background: var(--do-blue-soft);
}

@media (max-width: 800px) {
  .kpis,
  .visitor-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
