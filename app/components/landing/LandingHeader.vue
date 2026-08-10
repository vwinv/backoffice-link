<script setup lang="ts">
const open = ref(false)

const links = [
  { href: '#accueil', label: 'Accueil' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#contact', label: 'Nous contacter' },
]

function close() {
  open.value = false
}
</script>

<template>
  <header class="header">
    <div class="container bar">
      <a href="#accueil" class="brand" @click="close">
        <img src="/images/logo.png" alt="DropOne" width="200" height="54" />
      </a>

      <nav class="nav desktop" aria-label="Navigation principale">
        <a v-for="link in links" :key="link.href" :href="link.href">
          {{ link.label }}
        </a>
      </nav>

      <a class="btn btn-primary download desktop" href="#telecharger">
        Télécharger l'application
      </a>

      <button
        class="menu-btn"
        type="button"
        :aria-expanded="open"
        aria-label="Menu"
        @click="open = !open"
      >
        <span />
        <span />
        <span />
      </button>
    </div>

    <div v-if="open" class="mobile-panel">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        @click="close"
      >
        {{ link.label }}
      </a>
      <a class="btn btn-primary" href="#telecharger" @click="close">
        Télécharger l'application
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

.download {
  min-height: 46px;
  padding-inline: 18px;
  font-size: 0.92rem;
}

.menu-btn {
  display: none;
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

  .menu-btn,
  .mobile-panel {
    display: flex;
  }
}
</style>
