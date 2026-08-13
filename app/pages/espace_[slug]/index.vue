<script setup lang="ts">
definePageMeta({
  layout: 'espace',
})

const route = useRoute()
const { t } = useI18n()
const { getDashboard } = useEspace()
const { setFromTeam } = useEspaceTeamBrand()

const slug = computed(() => String(route.params.slug || ''))

const loading = ref(true)
const errorMessage = ref('')
const dashboard = ref<Awaited<ReturnType<typeof getDashboard>> | null>(null)

const statsOpen = ref(false)
const selectedMemberId = ref<string | null>(null)

function openMemberStats(memberId: string) {
  selectedMemberId.value = memberId
  statsOpen.value = true
}

function closeMemberStats() {
  statsOpen.value = false
  selectedMemberId.value = null
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    dashboard.value = await getDashboard(slug.value)
    setFromTeam(dashboard.value.team)
  }
  catch (error: unknown) {
    dashboard.value = null
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

function formatSeats(used: number, max: number) {
  if (max < 0) return `${used} / ∞`
  return `${used} / ${max}`
}

function memberName(user: { firstName: string, lastName: string, email: string }) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email
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

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.panel-head a {
  color: var(--do-blue);
  font-weight: 700;
  font-size: 0.9rem;
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
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
