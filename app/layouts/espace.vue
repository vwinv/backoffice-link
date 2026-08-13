<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const auth = useEspaceAuth()
const { listMine } = useEspace()
const { brand, setBrand, setFromTeam } = useEspaceTeamBrand()

const slug = computed(() => {
  const raw = route.params.slug
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : ''
})

const basePath = computed(() => (slug.value ? `/espace_${slug.value}` : '/'))

const nav = computed(() => [
  { to: basePath.value, label: t('espace.nav.dashboard'), exact: true },
  { to: `${basePath.value}/membres`, label: t('espace.nav.members'), exact: false },
  { to: `${basePath.value}/factures`, label: t('espace.nav.invoices'), exact: false },
])

function isActive(item: { to: string, exact: boolean }) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

async function loadBrand() {
  if (!slug.value || !auth.isAuthenticated.value) {
    setBrand(null)
    return
  }
  try {
    const teams = await listMine()
    const found = teams.find(team => team.slug === slug.value)
    if (found) {
      setFromTeam(found)
    }
    else if (brand.value?.slug !== slug.value) {
      setBrand(null)
    }
  }
  catch {
    if (brand.value?.slug !== slug.value) {
      setBrand(null)
    }
  }
}

watch(
  [slug, () => auth.isAuthenticated.value],
  () => {
    loadBrand()
  },
  { immediate: true },
)
</script>

<template>
  <div class="espace-layout">
    <header class="top">
      <div class="top-inner">
        <NuxtLink
          :to="basePath"
          class="brand"
        >
          <img
            src="/images/icone.png"
            alt="DropOne"
            width="40"
            height="40"
            class="dropone-logo"
          >
          <span>{{ brand?.slug === slug ? brand.name : $t('espace.brandFallback') }}</span>
        </NuxtLink>

        <nav
          v-if="slug"
          class="nav"
        >
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item) }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="actions">
          <LocaleSwitcher />
          <span class="user">{{ auth.displayName }}</span>
          <button
            type="button"
            class="logout"
            @click="auth.logout()"
          >
            {{ $t('espace.logout') }}
          </button>
        </div>
      </div>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.espace-layout {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 40% at 0% 0%, var(--do-blue-glow), transparent 55%),
    linear-gradient(180deg, #f7f8fc 0%, #ffffff 40%);
  color: var(--do-ink);
  font-family: var(--do-font);
}

.top {
  border-bottom: 1px solid var(--do-line);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.top-inner {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 10px 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.dropone-logo {
  border-radius: 10px;
}

.nav {
  display: flex;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
}

.nav-link {
  padding: 8px 12px;
  border-radius: 10px;
  color: var(--do-muted);
  font-weight: 600;
  font-size: 0.92rem;
}

.nav-link.active,
.nav-link:hover {
  color: var(--do-ink);
  background: var(--do-surface-soft);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user {
  font-size: 0.88rem;
  color: var(--do-muted);
  font-weight: 600;
}

.logout {
  border: 1px solid var(--do-line);
  background: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.main {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
}

@media (max-width: 720px) {
  .user {
    display: none;
  }
}
</style>
