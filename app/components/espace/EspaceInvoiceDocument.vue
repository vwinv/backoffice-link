<script setup lang="ts">
import type { EspaceInvoice } from '~/composables/useEspace'

const { t, locale } = useI18n()

const props = defineProps<{
  invoice: EspaceInvoice
  party: {
    team: { id: string, name: string, slug: string, logoUrl: string | null }
    client: { name: string, email: string, phone: string | null } | null
    issuer: { name: string, legalName: string, email: string, website: string }
  } | null
}>()

const emit = defineEmits<{
  close: []
  print: []
  pay: []
}>()

function formatAmount(amount: number, currency: string) {
  const tag = locale.value === 'en' ? 'en-US' : 'fr-FR'
  return `${amount.toLocaleString(tag)} ${currency}`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const tag = locale.value === 'en' ? 'en-US' : 'fr-FR'
  return new Date(value).toLocaleDateString(tag, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function statusLabel(status: string) {
  if (status === 'PAID') return t('espace.invoices.statusPaid')
  if (status === 'PENDING') return t('espace.invoices.statusPay')
  if (status === 'FAILED') return t('espace.invoices.statusFailed')
  if (status === 'REFUNDED') return t('espace.invoices.statusRefunded')
  return status
}

const lines = computed(() => {
  if (props.invoice.lines?.length) return props.invoice.lines
  return [
    {
      label: props.invoice.description || t('espace.invoices.subscription'),
      amount: props.invoice.amount,
      seats: props.invoice.seats,
    },
  ]
})

function onBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) emit('close')
}

function onPrint() {
  emit('print')
  nextTick(() => window.print())
}
</script>

<template>
  <Teleport to="body">
    <div
      class="backdrop"
      @click="onBackdrop"
    >
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-doc-title"
      >
        <div class="toolbar no-print">
          <button
            type="button"
            class="ghost"
            @click="emit('close')"
          >
            {{ $t('espace.invoices.close') }}
          </button>
          <div class="toolbar-actions">
            <button
              v-if="invoice.canPay"
              type="button"
              class="pay"
              @click="emit('pay')"
            >
              {{ $t('espace.invoices.pay') }}
            </button>
            <button
              type="button"
              class="primary"
              @click="onPrint"
            >
              {{ $t('espace.invoices.print') }}
            </button>
          </div>
        </div>

        <article
          id="invoice-print-root"
          class="invoice"
        >
          <header class="inv-head">
            <div class="brand">
              <img
                src="/images/icone.png"
                alt="DropOne"
                width="48"
                height="48"
              >
              <div>
                <p class="issuer-name">
                  {{ party?.issuer.legalName || 'Drop One' }}
                </p>
                <p class="muted">
                  {{ party?.issuer.email || 'billing@dropone.pro' }}
                </p>
                <p class="muted">
                  {{ party?.issuer.website || 'https://dropone.pro' }}
                </p>
              </div>
            </div>
            <div class="meta">
              <h1 id="invoice-doc-title">
                {{ $t('espace.invoices.invoice') }}
              </h1>
              <p><strong>{{ $t('espace.invoices.number') }}</strong> {{ invoice.number }}</p>
              <p><strong>{{ $t('espace.invoices.date') }}</strong> {{ formatDate(invoice.paidAt || invoice.createdAt) }}</p>
              <p v-if="invoice.dueAt">
                <strong>{{ $t('espace.invoices.due') }}</strong> {{ formatDate(invoice.dueAt) }}
              </p>
              <span
                class="badge"
                :data-status="invoice.status"
              >{{ statusLabel(invoice.status) }}</span>
            </div>
          </header>

          <section class="parties">
            <div>
              <p class="label">
                {{ $t('espace.invoices.issuer') }}
              </p>
              <p class="strong">
                {{ party?.issuer.legalName || 'Drop One' }}
              </p>
              <p class="muted">
                {{ $t('espace.invoices.issuerBlurb') }}
              </p>
            </div>
            <div>
              <p class="label">
                {{ $t('espace.invoices.client') }}
              </p>
              <p class="strong">
                {{ party?.team.name || 'Équipe' }}
              </p>
              <p
                v-if="party?.client"
                class="muted"
              >
                {{ party.client.name }} - {{ party.client.email }}
              </p>
              <p
                v-if="party?.client?.phone"
                class="muted"
              >
                {{ party.client.phone }}
              </p>
            </div>
          </section>

          <table class="lines-table">
            <thead>
              <tr>
                <th>{{ $t('espace.invoices.designation') }}</th>
                <th>{{ $t('espace.invoices.seats') }}</th>
                <th>{{ $t('espace.invoices.amount') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(line, index) in lines"
                :key="index"
              >
                <td>{{ line.label }}</td>
                <td>{{ line.seats ?? '-' }}</td>
                <td>{{ formatAmount(line.amount, invoice.currency) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            <span>{{ $t('espace.invoices.total') }}</span>
            <strong>{{ formatAmount(invoice.amount, invoice.currency) }}</strong>
          </div>

          <p class="footer-note">
            {{ $t('espace.invoices.footer') }}
          </p>
        </article>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(12, 13, 16, 0.5);
  display: grid;
  place-items: center;
  padding: 18px;
  overflow: auto;
}

.sheet {
  width: min(860px, 100%);
  background: #f4f6fb;
  border-radius: 18px;
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.ghost,
.primary,
.pay {
  min-height: 40px;
  border-radius: 10px;
  padding: 0 14px;
  font-weight: 700;
  cursor: pointer;
}

.ghost {
  border: 1px solid #ECF0FB;
  background: #fff;
}

.primary {
  border: 0;
  background: var(--do-ink);
  color: #fff;
}

.pay {
  border: 0;
  background: var(--do-blue);
  color: #fff;
}

.invoice {
  background: #fff;
  border: 1px solid #ECF0FB;
  border-radius: 14px;
  padding: 28px;
  color: #0c0d10;
  font-family: var(--do-font);
}

.inv-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.brand img {
  border-radius: 12px;
}

.issuer-name {
  margin: 0;
  font-weight: 800;
  font-size: 1.15rem;
}

.muted {
  margin: 2px 0 0;
  color: #5b616e;
  font-size: 0.88rem;
}

.meta h1 {
  margin: 0 0 8px;
  font-size: 1.8rem;
  letter-spacing: -0.03em;
}

.meta p {
  margin: 0 0 4px;
  font-size: 0.92rem;
}

.badge {
  display: inline-flex;
  margin-top: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: #f4f6fb;
}

.badge[data-status='PAID'] {
  background: #ecfdf3;
  color: #027a48;
}

.badge[data-status='PENDING'] {
  background: #fff8eb;
  color: #b54708;
}

.parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.label {
  margin: 0 0 6px;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5b616e;
  font-weight: 700;
}

.strong {
  margin: 0;
  font-weight: 800;
}

.lines-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
}

.lines-table th,
.lines-table td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid #ECF0FB;
  font-size: 0.92rem;
}

.lines-table th {
  color: #5b616e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px;
  border-radius: 12px;
  background: #f8faff;
  border: 1px solid #ECF0FB;
  font-size: 1.05rem;
}

.footer-note {
  margin: 18px 0 0;
  color: #5b616e;
  font-size: 0.85rem;
}

@media (max-width: 700px) {
  .parties {
    grid-template-columns: 1fr;
  }
}

@media print {
  .backdrop {
    position: static;
    background: #fff;
    padding: 0;
    display: block;
  }

  .sheet {
    width: 100%;
    background: #fff;
    padding: 0;
    border-radius: 0;
  }

  .no-print {
    display: none !important;
  }

  .invoice {
    border: 0;
    border-radius: 0;
    padding: 0;
  }
}
</style>
