<script setup lang="ts">
definePageMeta({
  layout: 'espace',
})

const route = useRoute()
const { t, locale } = useI18n()
const {
  getMembers,
  addMember,
  removeMember,
  cancelInvite,
  checkoutSeats,
  confirmSeats,
} = useEspace()

const slug = computed(() => String(route.params.slug || ''))

const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const data = ref<Awaited<ReturnType<typeof getMembers>> | null>(null)

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  jobTitle: '',
  role: 'MEMBER',
})
const submitting = ref(false)
const createModalOpen = ref(false)

const additionalSeats = ref(1)
const seatsPaying = ref(false)
const seatsModalOpen = ref(false)

const seatPurchase = computed(() => data.value?.seatPurchase ?? null)

const seatsPreviewAmount = computed(() => {
  const price = seatPurchase.value?.pricePerSeat
  if (!price) return 0
  return Math.round(price * Math.max(1, additionalSeats.value || 1))
})

const newSeatsTotal = computed(() => {
  const current = seatPurchase.value?.purchasedSeats ?? data.value?.seats.max ?? 0
  return current + Math.max(1, additionalSeats.value || 1)
})

const seatsMaxAddable = computed(() => {
  const purchase = seatPurchase.value
  if (!purchase) return 100
  if (purchase.maxSeats > 0) {
    return Math.max(1, purchase.maxSeats - purchase.purchasedSeats)
  }
  return 100
})

function openSeatsModal() {
  additionalSeats.value = 1
  seatsModalOpen.value = true
}

function closeSeatsModal() {
  if (seatsPaying.value) return
  seatsModalOpen.value = false
}

function onSeatsBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) closeSeatsModal()
}

function openCreateModal() {
  createModalOpen.value = true
}

function closeCreateModal() {
  if (submitting.value) return
  createModalOpen.value = false
}

function onCreateBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) closeCreateModal()
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    data.value = await getMembers(slug.value)
  }
  catch (error: unknown) {
    data.value = null
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.members.loadError')
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  await maybeConfirmSeatUpgrade()
})
watch(slug, async () => {
  await load()
  await maybeConfirmSeatUpgrade()
})

async function maybeConfirmSeatUpgrade() {
  if (route.query.seatUpgrade !== '1') return
  const tokenFromQuery = typeof route.query.token === 'string'
    ? route.query.token
    : typeof route.query.invoiceToken === 'string'
      ? route.query.invoiceToken
      : ''
  const stored = import.meta.client
    ? sessionStorage.getItem(`seatUpgradeToken:${slug.value}`)
    : null
  const token = tokenFromQuery || stored
  if (!token) return

  try {
    await confirmSeats(slug.value, token)
    successMessage.value = t('espace.members.seatsOk')
    if (import.meta.client) {
      sessionStorage.removeItem(`seatUpgradeToken:${slug.value}`)
    }
    await load()
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.members.confirmPayError')
  }
  finally {
    await navigateTo({ path: route.path, query: {} }, { replace: true })
  }
}

async function onCreate() {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await addMember(slug.value, {
      email: form.email.trim(),
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
      role: form.role,
    })
    form.email = ''
    form.firstName = ''
    form.lastName = ''
    form.jobTitle = ''
    form.role = 'MEMBER'
    successMessage.value = t('espace.members.inviteOk')
    createModalOpen.value = false
    await load()
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.members.createError')
  }
  finally {
    submitting.value = false
  }
}

async function onRemove(memberId: string) {
  if (!confirm(t('espace.members.removeConfirm'))) return
  try {
    await removeMember(slug.value, memberId)
    await load()
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.members.removeError')
  }
}

async function onCancelInvite(inviteId: string) {
  try {
    await cancelInvite(slug.value, inviteId)
    await load()
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.members.cancelError')
  }
}

async function onBuySeats() {
  if (!seatPurchase.value?.canPurchaseSeats) return
  seatsPaying.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const result = await checkoutSeats(
      slug.value,
      Math.max(1, additionalSeats.value || 1),
    )
    if (result.paidImmediately) {
      successMessage.value = t('espace.members.seatsOk')
      seatsModalOpen.value = false
      await load()
      return
    }
    if (result.invoiceToken && import.meta.client) {
      sessionStorage.setItem(
        `seatUpgradeToken:${slug.value}`,
        result.invoiceToken,
      )
    }
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }
    throw new Error(t('espace.members.payUnavailable'))
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.members.payError')
  }
  finally {
    seatsPaying.value = false
  }
}

function memberName(user: { firstName: string, lastName: string, email: string }) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email
}

function formatAmount(amount: number, currency = 'FCFA') {
  const tag = locale.value === 'en' ? 'en-US' : 'fr-FR'
  return `${amount.toLocaleString(tag)} ${currency}`
}
</script>

<template>
  <div>
    <header class="hero">
      <div>
        <h1>{{ $t('espace.members.title') }}</h1>
        <p class="lead">
          {{ $t('espace.members.lead') }}
        </p>
      </div>
      <div class="hero-actions">
        <p
          v-if="data"
          class="seat"
        >
          {{ $t('espace.dashboard.seats', {
            used: `${data.seats.used} / ${
              seatPurchase
                ? seatPurchase.purchasedSeats
                : (data.seats.max < 0 ? '∞' : data.seats.max)
            }`,
          }) }}
        </p>
        <button
          type="button"
          class="seats-open-btn"
          @click="openCreateModal"
        >
          {{ $t('espace.members.createMember') }}
        </button>
        <button
          v-if="seatPurchase?.canPurchaseSeats"
          type="button"
          class="seats-open-btn secondary"
          @click="openSeatsModal"
        >
          {{ $t('espace.members.increaseSeats') }}
        </button>
      </div>
    </header>

    <p
      v-if="errorMessage"
      class="banner error"
    >
      {{ errorMessage }}
    </p>
    <p
      v-if="successMessage"
      class="banner ok"
    >
      {{ successMessage }}
    </p>

    <Teleport to="body">
      <div
        v-if="createModalOpen"
        class="modal-backdrop"
        @click="onCreateBackdrop"
      >
        <div
          class="modal modal-wide"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('espace.members.createMember')"
        >
          <div class="modal-head">
            <h2>{{ $t('espace.members.createMember') }}</h2>
            <button
              type="button"
              class="modal-close"
              :aria-label="$t('espace.invoices.close')"
              :disabled="submitting"
              @click="closeCreateModal"
            >
              ×
            </button>
          </div>
          <form
            class="form"
            @submit.prevent="onCreate"
          >
            <label>
              <span>{{ $t('espace.members.email') }}</span>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="membre@entreprise.com"
              >
            </label>
            <label>
              <span>{{ $t('espace.members.firstName') }}</span>
              <input
                v-model="form.firstName"
                type="text"
                placeholder="Awa"
              >
            </label>
            <label>
              <span>{{ $t('espace.members.lastName') }}</span>
              <input
                v-model="form.lastName"
                type="text"
                placeholder="Diop"
              >
            </label>
            <label>
              <span>{{ $t('espace.members.jobTitle') }}</span>
              <input
                v-model="form.jobTitle"
                type="text"
                placeholder="Commerciale"
              >
            </label>
            <label>
              <span>{{ $t('espace.members.role') }}</span>
              <select v-model="form.role">
                <option value="MEMBER">
                  {{ $t('espace.members.roleMember') }}
                </option>
                <option value="ADMIN">
                  {{ $t('espace.members.roleAdmin') }}
                </option>
              </select>
            </label>
            <button
              type="submit"
              :disabled="submitting || (data ? !data.seats.canAddMember : false)"
            >
              {{ submitting ? $t('espace.members.sending') : $t('espace.members.createInvite') }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="seatsModalOpen && seatPurchase"
        class="modal-backdrop"
        @click="onSeatsBackdrop"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('espace.members.increaseSeats')"
        >
          <div class="modal-head">
            <h2>{{ $t('espace.members.increaseSeats') }}</h2>
            <button
              type="button"
              class="modal-close"
              :aria-label="$t('espace.invoices.close')"
              :disabled="seatsPaying"
              @click="closeSeatsModal"
            >
              ×
            </button>
          </div>
          <p class="seats-lead">
            {{ seatPurchase.offerTitle || $t('espace.brandFallback') }} ·
            {{ formatAmount(seatPurchase.pricePerSeat || 0, seatPurchase.currency) }}
            / utilisateur supplémentaire
          </p>
          <div class="seats-form">
            <label>
              <span>{{ $t('espace.members.seatsToAdd') }}</span>
              <input
                v-model.number="additionalSeats"
                type="number"
                min="1"
                :max="seatsMaxAddable"
              >
            </label>
            <div class="seats-summary">
              <p>
                {{ $t('espace.members.currentSeats') }}:
                <strong>{{ seatPurchase.purchasedSeats }}</strong>
              </p>
              <p>
                {{ $t('espace.members.afterPurchase') }}:
                <strong>{{ newSeatsTotal }}</strong>
              </p>
              <p class="amount">
                {{ $t('espace.members.payNow') }}:
                <strong>{{ formatAmount(seatsPreviewAmount, seatPurchase.currency) }}</strong>
              </p>
            </div>
            <button
              type="button"
              class="pay-btn"
              :disabled="seatsPaying || additionalSeats < 1"
              @click="onBuySeats"
            >
              {{ seatsPaying ? $t('espace.members.redirecting') : $t('espace.members.payIncrease') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <p
      v-if="loading"
      class="state"
    >
      {{ $t('espace.members.loading') }}
    </p>

    <template v-else-if="data">
      <section class="panel">
        <h2>{{ $t('espace.members.active') }}</h2>
        <div class="list">
          <div
            v-for="member in data.members"
            :key="member.id"
            class="row"
          >
            <div>
              <strong>{{ memberName(member.user) }}</strong>
              <span>{{ member.user.email }} · {{ member.role }}</span>
            </div>
            <button
              v-if="member.role !== 'OWNER'"
              type="button"
              class="ghost"
              @click="onRemove(member.id)"
            >
              {{ $t('espace.members.remove') }}
            </button>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>{{ $t('espace.members.pending') }}</h2>
        <p
          v-if="!data.pendingInvites.length"
          class="empty"
        >
          {{ $t('espace.members.pendingEmpty') }}
        </p>
        <div
          v-else
          class="list"
        >
          <div
            v-for="invite in data.pendingInvites"
            :key="invite.id"
            class="row"
          >
            <div>
              <strong>{{ invite.email }}</strong>
              <span>{{ invite.role }} · {{ $t('espace.members.waiting') }}</span>
            </div>
            <button
              type="button"
              class="ghost"
              @click="onCancelInvite(invite.id)"
            >
              {{ $t('espace.members.cancel') }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.03em;
}

.lead {
  margin: 8px 0 0;
  color: var(--do-muted);
}

.seat {
  margin: 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-weight: 700;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.seats-open-btn {
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  background: var(--do-ink);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.seats-open-btn.secondary {
  background: #fff;
  color: var(--do-ink);
  border: 1px solid #ECF0FB;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(12, 13, 16, 0.45);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal {
  width: min(440px, 100%);
  background: #fff;
  border: 1px solid #ECF0FB;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 20px 50px rgba(12, 13, 16, 0.18);
}

.modal-wide {
  width: min(560px, 100%);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.modal-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: 1px solid #ECF0FB;
  border-radius: 10px;
  background: #fff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: var(--do-muted);
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.banner {
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 600;
  margin: 0 0 14px;
}

.banner.error {
  background: #fff1f1;
  color: #b42318;
}

.banner.ok {
  background: #ecfdf3;
  color: #027a48;
}

.panel {
  background: #fff;
  border: 1px solid #ECF0FB;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 16px;
}

.panel h2 {
  margin: 0 0 14px;
  font-size: 1.05rem;
}

.seats-lead {
  margin: 0 0 16px;
  color: var(--do-muted);
  font-weight: 600;
  font-size: 0.92rem;
}

.seats-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.seats-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.seats-form input {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--do-line);
  padding: 0 12px;
  font: inherit;
}

.seats-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: #f8faff;
  border: 1px solid #ECF0FB;
}

.seats-summary p {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.9rem;
}

.seats-summary .amount {
  color: var(--do-ink);
  font-size: 1rem;
}

.pay-btn {
  min-height: 46px;
  border: 0;
  border-radius: 12px;
  padding: 0 18px;
  background: var(--do-blue);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.pay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.form input,
.form select,
.form button {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--do-line);
  padding: 0 12px;
  font: inherit;
}

.form button {
  grid-column: 1 / -1;
  border: 0;
  background: var(--do-ink);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--do-line);
}

.row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.row strong {
  display: block;
}

.row span {
  color: var(--do-muted);
  font-size: 0.88rem;
}

.ghost {
  border: 1px solid var(--do-line);
  background: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.empty,
.state {
  color: var(--do-muted);
  font-weight: 600;
}

@media (max-width: 720px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
