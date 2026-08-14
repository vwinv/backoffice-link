<script setup lang="ts">
import type { EspaceInvoice, EspaceInvoicesParty } from '~/composables/useEspace'

definePageMeta({
  layout: 'espace',
})

const route = useRoute()
const { t, locale } = useI18n()
const { getInvoices, payInvoice, confirmInvoicePayment } = useEspace()

const slug = computed(() => String(route.params.slug || ''))
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const paying = ref(false)
const party = ref<EspaceInvoicesParty | null>(null)
const upcoming = ref<EspaceInvoice[]>([])
const invoices = ref<EspaceInvoice[]>([])

const viewerOpen = ref(false)
const selected = ref<EspaceInvoice | null>(null)
const autoPrint = ref(false)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getInvoices(slug.value)
    party.value = result.party ?? null
    upcoming.value = result.upcoming ?? []
    invoices.value = result.items ?? []
  }
  catch (error: unknown) {
    party.value = null
    upcoming.value = []
    invoices.value = []
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.invoices.loadError')
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  await maybeConfirmPayment()
})
watch(slug, async () => {
  await load()
  await maybeConfirmPayment()
})

async function maybeConfirmPayment() {
  if (route.query.invoicePay !== '1') return
  const stored = import.meta.client
    ? sessionStorage.getItem(`invoicePayToken:${slug.value}`)
    : null
  const tokenFromQuery = typeof route.query.token === 'string'
    ? route.query.token
    : typeof route.query.invoiceToken === 'string'
      ? route.query.invoiceToken
      : ''
  const token = tokenFromQuery || stored
  if (!token) {
    await navigateTo({ path: route.path, query: {} }, { replace: true })
    return
  }

  try {
    await confirmInvoicePayment(slug.value, token)
    successMessage.value = t('espace.invoices.payConfirmOk')
    if (import.meta.client) {
      sessionStorage.removeItem(`invoicePayToken:${slug.value}`)
    }
    await load()
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.invoices.payConfirmError')
  }
  finally {
    await navigateTo({ path: route.path, query: {} }, { replace: true })
  }
}

function formatAmount(amount: number, currency: string) {
  const tag = locale.value === 'en' ? 'en-US' : 'fr-FR'
  return `${amount.toLocaleString(tag)} ${currency}`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const tag = locale.value === 'en' ? 'en-US' : 'fr-FR'
  return new Date(value).toLocaleDateString(tag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function statusLabel(status: string) {
  if (status === 'PAID') return t('espace.invoices.statusPaid')
  if (status === 'PENDING') return t('espace.invoices.statusPending')
  if (status === 'FAILED') return t('espace.invoices.statusFailed')
  if (status === 'REFUNDED') return t('espace.invoices.statusRefunded')
  return status
}

function daysUntilDue(dueAt: string | null) {
  if (!dueAt) return null
  const due = new Date(dueAt)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

function dueHint(dueAt: string | null) {
  const days = daysUntilDue(dueAt)
  if (days == null) return ''
  if (days < 0) return t('espace.invoices.overdue', { days: Math.abs(days) })
  if (days === 0) return t('espace.invoices.today')
  return t('espace.invoices.inDays', { days })
}

function openInvoice(invoice: EspaceInvoice, print = false) {
  selected.value = invoice
  autoPrint.value = print
  viewerOpen.value = true
  if (print) {
    nextTick(() => {
      window.print()
      autoPrint.value = false
    })
  }
}

function closeViewer() {
  viewerOpen.value = false
  selected.value = null
  autoPrint.value = false
}

async function onPay(invoice: EspaceInvoice) {
  if (!invoice.canPay && invoice.status !== 'PENDING') return
  paying.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const result = await payInvoice(slug.value, invoice.id)
    if (result.paidImmediately) {
      successMessage.value = t('espace.invoices.payOk')
      closeViewer()
      await load()
      return
    }
    if (result.invoiceToken && import.meta.client) {
      sessionStorage.setItem(
        `invoicePayToken:${slug.value}`,
        result.invoiceToken,
      )
    }
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }
    throw new Error(t('espace.invoices.payError'))
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('espace.invoices.payError')
  }
  finally {
    paying.value = false
  }
}
</script>

<template>
  <div>
    <header class="hero">
      <h1>{{ $t('espace.invoices.title') }}</h1>
      <p class="lead">
        {{ $t('espace.invoices.lead') }}
      </p>
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
    <p
      v-if="paying"
      class="banner ok"
    >
      {{ $t('espace.invoices.payPreparing') }}
    </p>

    <p
      v-if="loading"
      class="state"
    >
      {{ $t('espace.invoices.loading') }}
    </p>
    <template v-else>
      <section class="panel">
        <h2>{{ $t('espace.invoices.upcoming') }}</h2>
        <p
          v-if="!upcoming.length"
          class="empty"
        >
          {{ $t('espace.invoices.upcomingEmpty') }}
        </p>
        <div
          v-else
          class="table-wrap"
        >
          <table>
            <thead>
              <tr>
                <th>{{ $t('espace.invoices.number') }}</th>
                <th>{{ $t('espace.invoices.due') }}</th>
                <th>{{ $t('espace.invoices.description') }}</th>
                <th>{{ $t('espace.invoices.seats') }}</th>
                <th>{{ $t('espace.invoices.amount') }}</th>
                <th>{{ $t('espace.invoices.status') }}</th>
                <th class="col-actions" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in upcoming"
                :key="invoice.id"
              >
                <td>{{ invoice.number }}</td>
                <td>
                  <div class="due">
                    <strong>{{ formatDate(invoice.dueAt) }}</strong>
                    <span v-if="daysUntilDue(invoice.dueAt) != null">
                      {{ dueHint(invoice.dueAt) }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="desc">
                    <span>{{ invoice.description || $t('espace.invoices.renewal') }}</span>
                    <ul
                      v-if="invoice.lines?.length"
                      class="lines"
                    >
                      <li
                        v-for="(line, index) in invoice.lines"
                        :key="`${invoice.id}-${index}`"
                      >
                        {{ line.label }} :
                        {{ formatAmount(line.amount, invoice.currency) }}
                      </li>
                    </ul>
                  </div>
                </td>
                <td>{{ invoice.seats ?? '-' }}</td>
                <td>{{ formatAmount(invoice.amount, invoice.currency) }}</td>
                <td>
                  <span
                    class="status"
                    data-status="PENDING"
                  >{{ statusLabel(invoice.status) }}</span>
                </td>
                <td class="col-actions">
                  <EspaceInvoiceActions
                    :can-pay="invoice.canPay !== false"
                    @open="openInvoice(invoice)"
                    @print="openInvoice(invoice, true)"
                    @pay="onPay(invoice)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2>{{ $t('espace.invoices.history') }}</h2>
        <p
          v-if="!invoices.length"
          class="empty"
        >
          {{ $t('espace.invoices.historyEmpty') }}
        </p>
        <div
          v-else
          class="table-wrap"
        >
          <table>
            <thead>
              <tr>
                <th>{{ $t('espace.invoices.number') }}</th>
                <th>{{ $t('espace.invoices.date') }}</th>
                <th>{{ $t('espace.invoices.description') }}</th>
                <th>{{ $t('espace.invoices.seats') }}</th>
                <th>{{ $t('espace.invoices.amount') }}</th>
                <th>{{ $t('espace.invoices.status') }}</th>
                <th class="col-actions" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in invoices"
                :key="invoice.id"
              >
                <td>{{ invoice.number }}</td>
                <td>{{ formatDate(invoice.paidAt || invoice.createdAt) }}</td>
                <td>
                  <div class="desc">
                    <span>{{ invoice.description || $t('espace.invoices.subscription') }}</span>
                    <ul
                      v-if="invoice.lines?.length"
                      class="lines"
                    >
                      <li
                        v-for="(line, index) in invoice.lines"
                        :key="`${invoice.id}-${index}`"
                      >
                        {{ line.label }} :
                        {{ formatAmount(line.amount, invoice.currency) }}
                      </li>
                    </ul>
                  </div>
                </td>
                <td>{{ invoice.seats ?? '-' }}</td>
                <td>{{ formatAmount(invoice.amount, invoice.currency) }}</td>
                <td>
                  <span
                    class="status"
                    :data-status="invoice.status"
                  >{{ statusLabel(invoice.status) }}</span>
                </td>
                <td class="col-actions">
                  <EspaceInvoiceActions
                    :can-pay="!!invoice.canPay"
                    @open="openInvoice(invoice)"
                    @print="openInvoice(invoice, true)"
                    @pay="onPay(invoice)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <EspaceInvoiceDocument
      v-if="viewerOpen && selected"
      :invoice="selected"
      :party="party"
      @close="closeViewer"
      @print="autoPrint = true"
      @pay="onPay(selected)"
    />
  </div>
</template>

<style scoped>
.hero {
  margin-bottom: 20px;
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

.state {
  color: var(--do-muted);
  font-weight: 600;
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

.empty {
  margin: 0;
  color: var(--do-muted);
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
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

.col-actions {
  width: 56px;
  text-align: right;
}

.due {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.due span {
  color: var(--do-muted);
  font-size: 0.82rem;
}

.desc {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lines {
  margin: 0;
  padding-left: 16px;
  color: var(--do-muted);
  font-size: 0.85rem;
}

.status {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--do-surface-soft);
}

.status[data-status='PAID'] {
  background: #ecfdf3;
  color: #027a48;
}

.status[data-status='PENDING'] {
  background: #fff8eb;
  color: #b54708;
}

.status[data-status='FAILED'] {
  background: #fff1f1;
  color: #b42318;
}

@media print {
  .hero,
  .panel,
  .banner,
  .state {
    display: none !important;
  }
}
</style>
