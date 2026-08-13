<script setup lang="ts">
const route = useRoute()
const token = computed(() => String(route.params.token || ''))

const { apiFetch } = useApi()

const status = ref<'loading' | 'ok' | 'already' | 'error'>('loading')

async function closeTicket() {
  if (!token.value) {
    status.value = 'error'
    return
  }

  try {
    const result = await apiFetch<{
      alreadyClosed: boolean
      ticketId: string
      closedAt: string | null
    }>(`/support/tickets/close/${encodeURIComponent(token.value)}`, {
      method: 'POST',
    })
    status.value = result.alreadyClosed ? 'already' : 'ok'
  }
  catch {
    status.value = 'error'
  }
}

onMounted(() => {
  closeTicket()
})
</script>

<template>
  <div class="close-page">
    <div class="card">
      <img
        src="/images/icone.png"
        alt="DropOne"
        width="64"
        height="64"
      >
      <template v-if="status === 'loading'">
        <p class="eyebrow">
          DropOne Support
        </p>
        <h1>Clôture en cours…</h1>
      </template>
      <template v-else-if="status === 'ok' || status === 'already'">
        <p class="eyebrow">
          DropOne Support
        </p>
        <h1>Votre ticket a été clôturé</h1>
        <p class="lead">
          DropOne vous remercie.
        </p>
        <p class="sub">
          {{
            status === 'already'
              ? 'Ce ticket était déjà clôturé. Merci encore pour votre confiance.'
              : 'Nous sommes ravis d’avoir pu vous aider. À bientôt sur DropOne.'
          }}
        </p>
      </template>
      <template v-else>
        <p class="eyebrow">
          DropOne Support
        </p>
        <h1>Lien invalide</h1>
        <p class="lead error">
          Impossible de clôturer ce ticket.
        </p>
        <p class="sub">
          Le lien est invalide ou a expiré. Contactez-nous via le support du site si besoin.
        </p>
      </template>
      <NuxtLink
        to="/"
        class="home"
      >
        Retour à l’accueil
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.close-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(ellipse 70% 45% at 50% 0%, var(--do-blue-glow), transparent 55%),
    linear-gradient(180deg, #f7f8fc 0%, #ffffff 55%);
  font-family: var(--do-font);
  color: var(--do-ink);
}

.card {
  width: min(440px, 100%);
  text-align: center;
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  border-radius: var(--do-radius-lg);
  box-shadow: var(--do-shadow);
  padding: 36px 28px;
}

.eyebrow {
  margin: 18px 0 8px;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--do-muted);
}

h1 {
  margin: 0;
  font-size: 1.55rem;
  line-height: 1.25;
}

.lead {
  margin: 12px 0 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--do-ink);
}

.lead.error {
  color: #b42318;
}

.sub {
  margin: 10px 0 0;
  color: var(--do-muted);
  line-height: 1.5;
}

.home {
  display: inline-flex;
  margin-top: 24px;
  padding: 0.7rem 1.1rem;
  border-radius: 12px;
  background: var(--do-ink);
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}
</style>
