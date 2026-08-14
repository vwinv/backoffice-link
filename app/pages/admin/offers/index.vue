<script setup lang="ts">
import type { AdminOffer, AdminOfferPrice } from '~/composables/useAdminOffers'

definePageMeta({
  layout: 'admin',
})

const { hasPermission } = useAuth()
const {
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  createPrice,
  updatePrice,
  deletePrice,
} = useAdminOffers()

const offers = ref<AdminOffer[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showOfferModal = ref(false)
const editingOfferId = ref<string | null>(null)
const offerSaving = ref(false)
const offerFormError = ref<string | null>(null)

const showPriceModal = ref(false)
const editingPriceId = ref<string | null>(null)
const priceSaving = ref(false)
const priceFormError = ref<string | null>(null)

const offerForm = reactive({
  title: '',
  slug: '',
  subtitle: '',
  audience: 'PERSONAL',
  canCustomize: false,
  maxTeamMembers: 0,
  minSeats: 1,
  hasPortfolio: false,
  hasWallet: false,
  hasAnalytics: false,
  hasVisitorInsights: false,
  hasSocialLinks: false,
  maxAiScans: 0,
  maxShares: 10,
  sortOrder: 0,
  isActive: true,
  listedInApp: true,
})

const priceForm = reactive({
  billingType: 'MONTHLY',
  priceAmount: 0,
  pricePerSeat: null as number | null,
  priceLabel: '',
  currency: 'FCFA',
  discountPercent: null as number | null,
  badgeLabel: '',
  isPopular: false,
  sortOrder: 1,
  isActive: true,
  stripePriceId: '',
})

const canCreate = computed(
  () => hasPermission('subscriptions.create') || hasPermission('*'),
)
const canUpdate = computed(
  () => hasPermission('subscriptions.update') || hasPermission('*'),
)
const canDelete = computed(
  () => hasPermission('subscriptions.delete') || hasPermission('*'),
)

const editingOffer = computed(() =>
  editingOfferId.value
    ? offers.value.find(o => o.id === editingOfferId.value) ?? null
    : null,
)

const isFreeOffer = computed(() => editingOffer.value?.isFreeOffer === true)

async function load() {
  loading.value = true
  error.value = null
  try {
    offers.value = await listOffers()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Chargement impossible'
  }
  finally {
    loading.value = false
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function audienceLabel(audience: string) {
  return audience === 'TEAM' ? 'Équipe / Pro' : 'Personnel'
}

function formatQuota(value: number) {
  if (value < 0) return 'Illimité'
  return String(value)
}

function billingLabel(type: string) {
  if (type === 'YEARLY') return 'Annuel'
  if (type === 'LIFETIME') return 'À vie'
  return 'Mensuel'
}

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`
}

function resetOfferForm() {
  editingOfferId.value = null
  offerForm.title = ''
  offerForm.slug = ''
  offerForm.subtitle = ''
  offerForm.audience = 'PERSONAL'
  offerForm.canCustomize = false
  offerForm.maxTeamMembers = 0
  offerForm.minSeats = 1
  offerForm.hasPortfolio = false
  offerForm.hasWallet = false
  offerForm.hasAnalytics = false
  offerForm.hasVisitorInsights = false
  offerForm.hasSocialLinks = false
  offerForm.maxAiScans = 0
  offerForm.maxShares = 10
  offerForm.sortOrder = offers.value.length + 1
  offerForm.isActive = true
  offerForm.listedInApp = true
  offerFormError.value = null
}

function syncOfferForm(offer: AdminOffer) {
  editingOfferId.value = offer.id
  offerForm.title = offer.title
  offerForm.slug = offer.slug
  offerForm.subtitle = offer.subtitle || ''
  offerForm.audience = offer.audience
  offerForm.canCustomize = offer.canCustomize
  offerForm.maxTeamMembers = offer.maxTeamMembers
  offerForm.minSeats = offer.minSeats
  offerForm.hasPortfolio = offer.hasPortfolio
  offerForm.hasWallet = offer.hasWallet
  offerForm.hasAnalytics = offer.hasAnalytics
  offerForm.hasVisitorInsights = offer.hasVisitorInsights
  offerForm.hasSocialLinks = offer.hasSocialLinks
  offerForm.maxAiScans = offer.maxAiScans
  offerForm.maxShares = offer.maxShares
  offerForm.sortOrder = offer.sortOrder
  offerForm.isActive = offer.isActive
  offerForm.listedInApp = offer.listedInApp
  offerFormError.value = null
}

function openCreate() {
  resetOfferForm()
  showOfferModal.value = true
}

function openEdit(offer: AdminOffer) {
  syncOfferForm(offer)
  showOfferModal.value = true
}

function closeOfferModal(force = false) {
  if (!force && (offerSaving.value || priceSaving.value)) return
  showOfferModal.value = false
  resetOfferForm()
  closePriceModal(true)
}

function onTitleInput() {
  if (isFreeOffer.value) return
  if (!editingOfferId.value || offerForm.slug === slugify(offerForm.title.slice(0, -1))) {
    offerForm.slug = slugify(offerForm.title)
  }
}

async function onSaveOffer() {
  if (editingOfferId.value && !canUpdate.value) return
  if (!editingOfferId.value && !canCreate.value) return

  offerSaving.value = true
  offerFormError.value = null
  try {
    const payload = {
      title: offerForm.title.trim(),
      slug: offerForm.slug.trim() || slugify(offerForm.title),
      subtitle: offerForm.subtitle.trim() || null,
      audience: offerForm.audience,
      canCustomize: offerForm.canCustomize,
      maxTeamMembers: Number(offerForm.maxTeamMembers),
      minSeats: Number(offerForm.minSeats),
      hasPortfolio: offerForm.hasPortfolio,
      hasWallet: offerForm.hasWallet,
      hasAnalytics: offerForm.hasAnalytics,
      hasVisitorInsights: offerForm.hasVisitorInsights,
      hasSocialLinks: offerForm.hasSocialLinks,
      maxAiScans: Number(offerForm.maxAiScans),
      maxShares: Number(offerForm.maxShares),
      sortOrder: Number(offerForm.sortOrder),
      isActive: offerForm.isActive,
      listedInApp: offerForm.listedInApp,
    }

    if (editingOfferId.value) {
      const updated = await updateOffer(editingOfferId.value, payload)
      const index = offers.value.findIndex(o => o.id === updated.id)
      if (index >= 0) offers.value[index] = updated
      else await load()
    }
    else {
      await createOffer(payload)
      await load()
    }
    closeOfferModal(true)
  }
  catch (err: unknown) {
    offerFormError.value = err instanceof ApiError ? err.message : 'Enregistrement impossible'
  }
  finally {
    offerSaving.value = false
  }
}

async function onDelete(offer: AdminOffer) {
  if (offer.isFreeOffer || !canDelete.value) return
  if (!confirm(`Supprimer l’offre « ${offer.title} » ?`)) return
  try {
    await deleteOffer(offer.id)
    if (editingOfferId.value === offer.id) closeOfferModal()
    await load()
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : 'Suppression impossible'
  }
}

function resetPriceForm() {
  editingPriceId.value = null
  priceForm.billingType = 'MONTHLY'
  priceForm.priceAmount = 0
  priceForm.pricePerSeat = null
  priceForm.priceLabel = ''
  priceForm.currency = 'FCFA'
  priceForm.discountPercent = null
  priceForm.badgeLabel = ''
  priceForm.isPopular = false
  priceForm.sortOrder = (editingOffer.value?.prices.length || 0) + 1
  priceForm.isActive = true
  priceForm.stripePriceId = ''
  priceFormError.value = null
}

function openCreatePrice() {
  if (!editingOfferId.value || isFreeOffer.value) return
  resetPriceForm()
  showPriceModal.value = true
}

function openEditPrice(price: AdminOfferPrice) {
  editingPriceId.value = price.id
  priceForm.billingType = price.billingType
  priceForm.priceAmount = price.priceAmount
  priceForm.pricePerSeat = price.pricePerSeat
  priceForm.priceLabel = price.priceLabel || ''
  priceForm.currency = price.currency
  priceForm.discountPercent = price.discountPercent
  priceForm.badgeLabel = price.badgeLabel || ''
  priceForm.isPopular = price.isPopular
  priceForm.sortOrder = price.sortOrder
  priceForm.isActive = price.isActive
  priceForm.stripePriceId = price.stripePriceId || ''
  priceFormError.value = null
  showPriceModal.value = true
}

function closePriceModal(force = false) {
  if (!force && priceSaving.value) return
  showPriceModal.value = false
  resetPriceForm()
}

async function onSavePrice() {
  if (!editingOfferId.value) return
  priceSaving.value = true
  priceFormError.value = null

  const payload = {
    billingType: priceForm.billingType,
    priceAmount: Number(priceForm.priceAmount),
    pricePerSeat:
      priceForm.pricePerSeat == null ? null : Number(priceForm.pricePerSeat),
    priceLabel: priceForm.priceLabel.trim() || null,
    currency: priceForm.currency.trim() || 'FCFA',
    discountPercent:
      priceForm.discountPercent == null
        ? null
        : Number(priceForm.discountPercent),
    badgeLabel: priceForm.badgeLabel.trim() || null,
    isPopular: priceForm.isPopular,
    sortOrder: Number(priceForm.sortOrder),
    isActive: priceForm.isActive,
    stripePriceId: priceForm.stripePriceId.trim() || null,
  }

  try {
    if (editingPriceId.value) {
      await updatePrice(editingOfferId.value, editingPriceId.value, payload)
    }
    else {
      await createPrice(editingOfferId.value, payload)
    }
    await load()
    closeOfferModal(true)
  }
  catch (err: unknown) {
    priceFormError.value = err instanceof ApiError ? err.message : 'Tarif non enregistré'
  }
  finally {
    priceSaving.value = false
  }
}

async function onDeletePrice(price: AdminOfferPrice) {
  if (!editingOfferId.value || !canDelete.value) return
  if (!confirm(`Supprimer définitivement le tarif ${billingLabel(price.billingType)} ?`)) {
    return
  }
  try {
    await deletePrice(editingOfferId.value, price.id)
    await load()
    closeOfferModal(true)
  }
  catch (err: unknown) {
    offerFormError.value = err instanceof ApiError ? err.message : 'Suppression impossible'
  }
}

await load()
</script>

<template>
  <section class="offers-page">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Monétisation
        </p>
        <h1>Offres</h1>
        <p class="lead">
          Quotas, fonctionnalités et tarifs - y compris l’offre gratuite.
        </p>
      </div>
      <button
        v-if="canCreate"
        type="button"
        class="primary"
        @click="openCreate"
      >
        Nouvelle offre
      </button>
    </header>

    <p
      v-if="error"
      class="banner-error"
      role="alert"
    >
      {{ error }}
    </p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Offre</th>
            <th>Audience</th>
            <th>Partages</th>
            <th>Scans IA</th>
            <th>Tarifs</th>
            <th>Abo.</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && offers.length === 0">
            <td
              colspan="8"
              class="empty"
            >
              Chargement…
            </td>
          </tr>
          <tr v-else-if="!loading && offers.length === 0">
            <td
              colspan="8"
              class="empty"
            >
              Aucune offre.
            </td>
          </tr>
          <tr
            v-for="offer in offers"
            :key="offer.id"
          >
            <td>
              <div class="cell-main">
                <strong>{{ offer.title }}</strong>
                <small>
                  <code>{{ offer.slug }}</code>
                  <template v-if="offer.subtitle">
                    - {{ offer.subtitle }}
                  </template>
                </small>
              </div>
            </td>
            <td>{{ audienceLabel(offer.audience) }}</td>
            <td>{{ formatQuota(offer.maxShares) }}</td>
            <td>{{ formatQuota(offer.maxAiScans) }}</td>
            <td>{{ offer.prices.length }}</td>
            <td>{{ offer.subscriptionsCount }}</td>
            <td>
              <div class="status-stack">
                <span
                  v-if="offer.isFreeOffer"
                  class="pill free"
                >Gratuit</span>
                <span
                  class="pill"
                  :class="offer.isActive ? 'ok' : 'off'"
                >
                  {{ offer.isActive ? 'Active' : 'Inactive' }}
                </span>
                <span
                  v-if="!offer.listedInApp && !offer.isFreeOffer"
                  class="pill off"
                >Hors app</span>
              </div>
            </td>
            <td>
              <div class="row-actions">
                <button
                  v-if="canUpdate || canCreate"
                  type="button"
                  class="ghost"
                  @click="openEdit(offer)"
                >
                  Modifier
                </button>
                <button
                  v-if="canDelete && !offer.isFreeOffer"
                  type="button"
                  class="ghost danger"
                  @click="onDelete(offer)"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Popup offre -->
    <Teleport to="body">
      <div
        v-if="showOfferModal"
        class="modal-backdrop"
        @click.self="closeOfferModal"
      >
        <div
          class="modal modal-lg"
          role="dialog"
          aria-modal="true"
        >
          <header class="modal-head">
            <h2>
              {{ editingOfferId ? 'Modifier l’offre' : 'Nouvelle offre' }}
            </h2>
            <button
              type="button"
              class="modal-close"
              aria-label="Fermer"
              @click="closeOfferModal"
            >
              ×
            </button>
          </header>

          <form
            class="modal-body"
            @submit.prevent="onSaveOffer"
          >
            <p
              v-if="offerFormError"
              class="banner-error"
              role="alert"
            >
              {{ offerFormError }}
            </p>
            <p
              v-if="isFreeOffer"
              class="hint"
            >
              Offre gratuite : droits par défaut sans abonnement. Pas de tarifs.
            </p>

            <div class="grid-2">
              <label>
                <span>Titre</span>
                <input
                  v-model="offerForm.title"
                  required
                  minlength="2"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                  @input="onTitleInput"
                >
              </label>
              <label>
                <span>Slug</span>
                <input
                  v-model="offerForm.slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  :disabled="isFreeOffer || (editingOfferId ? !canUpdate : !canCreate)"
                >
              </label>
              <label class="full">
                <span>Sous-titre</span>
                <input
                  v-model="offerForm.subtitle"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
              </label>
              <label>
                <span>Audience</span>
                <select
                  v-model="offerForm.audience"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
                  <option value="PERSONAL">
                    Personnel
                  </option>
                  <option value="TEAM">
                    Équipe / Pro
                  </option>
                </select>
              </label>
              <label>
                <span>Ordre</span>
                <input
                  v-model.number="offerForm.sortOrder"
                  type="number"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
              </label>
              <label>
                <span>Max membres (−1 = ∞)</span>
                <input
                  v-model.number="offerForm.maxTeamMembers"
                  type="number"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
              </label>
              <label>
                <span>Min. sièges</span>
                <input
                  v-model.number="offerForm.minSeats"
                  type="number"
                  min="1"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
              </label>
              <label>
                <span>Max scans IA (−1 = ∞)</span>
                <input
                  v-model.number="offerForm.maxAiScans"
                  type="number"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
              </label>
              <label>
                <span>Max partages (−1 = ∞)</span>
                <input
                  v-model.number="offerForm.maxShares"
                  type="number"
                  :disabled="editingOfferId ? !canUpdate : !canCreate"
                >
              </label>
            </div>

            <div class="flags">
              <label class="check"><input
                v-model="offerForm.canCustomize"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Personnalisation</span></label>
              <label class="check"><input
                v-model="offerForm.hasPortfolio"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Portfolio</span></label>
              <label class="check"><input
                v-model="offerForm.hasWallet"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Wallet</span></label>
              <label class="check"><input
                v-model="offerForm.hasAnalytics"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Stats</span></label>
              <label class="check"><input
                v-model="offerForm.hasVisitorInsights"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Visiteurs</span></label>
              <label class="check"><input
                v-model="offerForm.hasSocialLinks"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Réseaux</span></label>
              <label class="check"><input
                v-model="offerForm.isActive"
                type="checkbox"
                :disabled="editingOfferId ? !canUpdate : !canCreate"
              ><span>Active</span></label>
              <label class="check"><input
                v-model="offerForm.listedInApp"
                type="checkbox"
                :disabled="isFreeOffer || (editingOfferId ? !canUpdate : !canCreate)"
              ><span>Visible dans l’app</span></label>
            </div>

            <div
              v-if="editingOfferId && !isFreeOffer"
              class="prices-block"
            >
              <div class="prices-head">
                <h3>Tarifs</h3>
                <button
                  v-if="canCreate"
                  type="button"
                  class="ghost"
                  @click="openCreatePrice"
                >
                  Ajouter un tarif
                </button>
              </div>
              <div class="prices-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Période</th>
                      <th>Prix</th>
                      <th>/ utilisateur +</th>
                      <th>Statut</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!editingOffer?.prices.length">
                      <td
                        colspan="5"
                        class="empty"
                      >
                        Aucun tarif.
                      </td>
                    </tr>
                    <tr
                      v-for="price in editingOffer?.prices || []"
                      :key="price.id"
                    >
                      <td>
                        <strong>{{ billingLabel(price.billingType) }}</strong>
                        <small v-if="price.priceLabel">{{ price.priceLabel }}</small>
                      </td>
                      <td>{{ formatMoney(price.priceAmount, price.currency) }}</td>
                      <td>
                        {{
                          price.pricePerSeat == null
                            ? '-'
                            : formatMoney(price.pricePerSeat, price.currency)
                        }}
                      </td>
                      <td>
                        <span
                          class="pill"
                          :class="price.isActive ? 'ok' : 'off'"
                        >
                          {{ price.isActive ? 'Actif' : 'Inactif' }}
                        </span>
                        <span
                          v-if="price.isPopular"
                          class="pill free"
                        >Populaire</span>
                      </td>
                      <td>
                        <div class="row-actions">
                          <button
                            v-if="canUpdate"
                            type="button"
                            class="ghost"
                            @click="openEditPrice(price)"
                          >
                            Modifier
                          </button>
                          <button
                            v-if="canDelete"
                            type="button"
                            class="ghost danger"
                            @click="onDeletePrice(price)"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="ghost"
                :disabled="offerSaving"
                @click="closeOfferModal"
              >
                Fermer
              </button>
              <button
                v-if="editingOfferId ? canUpdate : canCreate"
                type="submit"
                class="primary"
                :disabled="offerSaving"
              >
                {{ offerSaving ? 'Enregistrement…' : (editingOfferId ? 'Enregistrer' : 'Créer') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Popup tarif -->
    <Teleport to="body">
      <div
        v-if="showPriceModal"
        class="modal-backdrop nested"
        @click.self="closePriceModal"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
        >
          <header class="modal-head">
            <h2>{{ editingPriceId ? 'Modifier le tarif' : 'Nouveau tarif' }}</h2>
            <button
              type="button"
              class="modal-close"
              @click="closePriceModal"
            >
              ×
            </button>
          </header>
          <form
            class="modal-body"
            @submit.prevent="onSavePrice"
          >
            <p
              v-if="priceFormError"
              class="banner-error"
            >
              {{ priceFormError }}
            </p>
            <label>
              <span>Période</span>
              <select v-model="priceForm.billingType">
                <option value="MONTHLY">
                  Mensuel
                </option>
                <option value="YEARLY">
                  Annuel
                </option>
                <option value="LIFETIME">
                  À vie
                </option>
              </select>
            </label>
            <label>
              <span>Prix</span>
              <input
                v-model.number="priceForm.priceAmount"
                type="number"
                min="0"
                step="1"
                required
              >
            </label>
            <label>
              <span>Prix / utilisateur supplémentaire</span>
              <input
                v-model.number="priceForm.pricePerSeat"
                type="number"
                min="0"
                step="1"
                placeholder="ex. 1000 (au-delà des sièges inclus)"
              >
            </label>
            <label>
              <span>Libellé</span>
              <input
                v-model="priceForm.priceLabel"
                placeholder="ex. 10 000 FCFA + 1 000 / utilisateur supplémentaire"
              >
            </label>
            <div class="grid-2">
              <label>
                <span>Devise</span>
                <input v-model="priceForm.currency">
              </label>
              <label>
                <span>Remise %</span>
                <input
                  v-model.number="priceForm.discountPercent"
                  type="number"
                  min="0"
                >
              </label>
              <label>
                <span>Badge</span>
                <input
                  v-model="priceForm.badgeLabel"
                  placeholder="Populaire"
                >
              </label>
              <label>
                <span>Ordre</span>
                <input
                  v-model.number="priceForm.sortOrder"
                  type="number"
                >
              </label>
            </div>
            <label>
              <span>Stripe Price ID</span>
              <input v-model="priceForm.stripePriceId">
            </label>
            <div class="flags">
              <label class="check"><input
                v-model="priceForm.isPopular"
                type="checkbox"
              ><span>Populaire</span></label>
              <label class="check"><input
                v-model="priceForm.isActive"
                type="checkbox"
              ><span>Actif</span></label>
            </div>
            <div class="modal-actions">
              <button
                type="button"
                class="ghost"
                :disabled="priceSaving"
                @click="closePriceModal"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="primary"
                :disabled="priceSaving"
              >
                {{ priceSaving ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.offers-page {
  display: grid;
  gap: 1.25rem;
}

.hero,
.table-wrap {
  border-radius: var(--do-radius);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--do-muted);
}

.hero h1 {
  margin: 0;
  font-size: 1.75rem;
}

.lead {
  margin: 0.4rem 0 0;
  color: var(--do-muted);
  max-width: 40rem;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 920px;
}

th,
td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--do-line);
  vertical-align: top;
}

th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--do-muted);
  background: var(--do-surface-soft);
}

.cell-main {
  display: grid;
  gap: 0.2rem;
}

.cell-main small {
  color: var(--do-muted);
}

.cell-main code {
  font-size: 0.85em;
}

.empty {
  text-align: center;
  color: var(--do-muted);
  padding: 28px;
}

.status-stack,
.row-actions,
.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.pill.free {
  background: #ecfdf3;
  color: #027a48;
}

.pill.ok {
  background: #eff8ff;
  color: #175cd3;
}

.pill.off {
  background: #f2f4f7;
  color: #475467;
}

.primary,
.ghost {
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0.5rem 0.85rem;
  font: inherit;
  cursor: pointer;
  background: transparent;
}

.primary {
  background: var(--do-ink);
  color: #fff;
}

.ghost {
  border-color: color-mix(in srgb, var(--do-ink) 14%, transparent);
  color: var(--do-ink);
}

.ghost.danger {
  color: #b42318;
  border-color: color-mix(in srgb, #b42318 25%, transparent);
}

.banner-error {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #fef3f2;
  color: #b42318;
}

.hint {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: var(--do-surface-soft);
  color: var(--do-muted);
  font-size: 0.9rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 45%);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 50;
}

.modal-backdrop.nested {
  z-index: 60;
  background: rgb(15 23 42 / 55%);
}

.modal {
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 16px;
}

.modal-lg {
  width: min(820px, 100%);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--do-ink) 8%, transparent);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.modal-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  border: 0;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  display: grid;
  gap: 0.9rem;
  padding: 1.1rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.grid-2 .full {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 0.35rem;
}

label > span {
  font-size: 0.85rem;
  color: var(--do-muted);
}

input,
select {
  border: 1px solid color-mix(in srgb, var(--do-ink) 14%, transparent);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  font: inherit;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  grid-template-columns: none;
}

.prices-block {
  display: grid;
  gap: 0.65rem;
  padding-top: 0.35rem;
  border-top: 1px solid var(--do-line);
}

.prices-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.prices-head h3 {
  margin: 0;
  font-size: 1rem;
}

.prices-table-wrap {
  overflow: auto;
  border: 1px solid var(--do-line);
  border-radius: 12px;
}

.prices-table-wrap table {
  min-width: 640px;
}

.prices-table-wrap td small {
  display: block;
  color: var(--do-muted);
  margin-top: 0.15rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
