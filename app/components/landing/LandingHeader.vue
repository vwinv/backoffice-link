<script setup lang="ts">
const { t } = useI18n()
const open = ref(false)

const links = computed(() => [
  { href: '#accueil', label: t('landing.nav.home') },
  { href: '#fonctionnalites', label: t('landing.nav.features') },
  { href: '#tarifs', label: t('landing.nav.pricing') },
  { href: '#contact', label: t('landing.nav.contact') },
])

function close() {
  open.value = false
}
</script>

<template>
  <header class="header">
    <div class="container bar">
      <a
        href="#accueil"
        class="brand"
        @click="close"
      >
        <img
          src="/images/logo.png"
          alt="DropOne"
          width="200"
          height="54"
        >
      </a>

      <nav
        class="nav desktop"
        :aria-label="$t('landing.nav.main')"
      >
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="right desktop">
        <LocaleSwitcher />
        <a
          class="btn btn-primary download"
          href="#telecharger"
        >
          {{ $t('landing.nav.download') }}
        </a>
      </div>

      <div class="mobile-tools">
        <LocaleSwitcher />
        <button
          class="menu-btn"
          type="button"
          :aria-expanded="open"
          :aria-label="$t('landing.nav.menu')"
          @click="open = !open"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>

    <div
      v-if="open"
      class="mobile-panel"
    >
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        @click="close"
      >
        {{ link.label }}
      </a>
      <a
        class="btn btn-primary"
        href="#telecharger"
        @click="close"
      >
        {{ $t('landing.nav.download') }}
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 229, 234, 0.8);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88px;
  gap: 20px;
}

.brand img {
  height: 52px;
  width: auto;
}

.nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav a {
  color: var(--do-muted);
  font-weight: 600;
  font-size: 0.95rem;
}

.nav a:hover {
  color: var(--do-blue);
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.download {
  min-height: 46px;
  padding-inline: 18px;
  font-size: 0.92rem;
}

.mobile-tools {
  display: none;
  align-items: center;
  gap: 8px;
}

.menu-btn {
  display: flex;
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  padding: 10px;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.menu-btn span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--do-ink);
  border-radius: 2px;
}

.mobile-panel {
  display: none;
  flex-direction: column;
  gap: 14px;
  padding: 8px 20px 20px;
  border-top: 1px solid var(--do-line);
  background: #fff;
}

.mobile-panel a {
  font-weight: 600;
  color: var(--do-ink);
}

@media (max-width: 900px) {
  .desktop {
    display: none;
  }

  .mobile-tools,
  .mobile-panel {
    display: flex;
  }
}
</style>
