<script setup lang="ts">
const { user, displayName, logout, hasPermission } = useAuth()
</script>

<template>
  <div class="layout-admin">
    <aside class="sidebar">
      <div class="sidebar-top">
        <NuxtLink to="/admin" class="brand" aria-label="DropOne Admin">
          <img
            src="/images/icone.png"
            alt="DropOne"
            width="88"
            height="88"
          >
        </NuxtLink>
        <nav>
          <NuxtLink v-if="hasPermission('dashboard.view') || hasPermission('*')" to="/admin">
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('backoffice_users.view') || hasPermission('*')"
            to="/admin/users"
          >
            Utilisateurs
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('roles.view') || hasPermission('*')"
            to="/admin/roles"
          >
            Rôles
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('clients.view') || hasPermission('*')"
            to="/admin/clients"
          >
            Clients
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('subscriptions.view') || hasPermission('*')"
            to="/admin/offers"
          >
            Offres
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('subscriptions.view') || hasPermission('*')"
            to="/admin/subscriptions"
          >
            Abonnements
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('notifications.view') || hasPermission('*')"
            to="/admin/notifications"
          >
            Notifications
          </NuxtLink>
          <NuxtLink
            v-if="hasPermission('support.view') || hasPermission('*')"
            to="/admin/support"
          >
            Support
          </NuxtLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div v-if="user" class="user">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-email">{{ user.email }}</span>
        </div>
        <button type="button" class="logout" @click="logout()">
          Déconnexion
        </button>
      </div>
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout-admin {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 45% at 100% 0%, var(--do-blue-glow), transparent 55%),
    var(--do-surface-soft);
  color: var(--do-ink);
  font-family: var(--do-font);
}

.sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(10, 107, 255, 0.22), transparent 42%),
    var(--do-ink);
  color: #fff;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.brand img {
  height: 88px;
  width: 88px;
  display: block;
  border-radius: 18px;
  object-fit: cover;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

nav a {
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  padding: 10px 12px;
  border-radius: var(--do-radius-sm);
  font-weight: 600;
  transition: background 0.15s ease, color 0.15s ease;
}

nav a:hover {
  background: rgba(10, 107, 255, 0.18);
  color: #fff;
}

nav a.router-link-active {
  background: var(--do-blue);
  color: #fff;
  box-shadow: 0 10px 24px rgba(10, 107, 255, 0.35);
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 700;
}

.user-email {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  word-break: break-all;
}

.logout {
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: transparent;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.logout:hover {
  background: rgba(10, 107, 255, 0.18);
  border-color: rgba(10, 107, 255, 0.45);
}

.content {
  padding: 32px;
}

@media (max-width: 768px) {
  .layout-admin {
    grid-template-columns: 1fr;
  }
}
</style>
