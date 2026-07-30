<template>
  <div class="layout-admin">
    <aside class="sidebar">
      <NuxtLink to="/" class="brand">DropOne</NuxtLink>
      <nav>
        <NuxtLink to="/admin">Dashboard</NuxtLink>
      </nav>
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
  background: #f7f7f8;
  color: #0c0d10;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #0c0d10;
  color: #fff;
}

.brand {
  font-weight: 800;
  font-size: 1.25rem;
  color: #fff;
  text-decoration: none;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

nav a {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
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
