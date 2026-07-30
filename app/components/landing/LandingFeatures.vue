<script setup lang="ts">
const features = [
  {
    title: 'Cartes disponibles personnalisables',
    text: 'Créer une carte à votre image avec vos informations, liens et réseaux sociaux.',
    tone: 'light',
    icon: 'card',
  },
  {
    title: 'Partage instantané',
    text: 'Partagez votre carte via QR code, NFC, lien ou même Apple Wallet.',
    tone: 'dark',
    icon: 'grid',
  },
  {
    title: 'Suivi des visites',
    text: 'Sachez qui consulte votre carte, quand et comment. Ne manquez aucune opportunité.',
    tone: 'light',
    icon: 'eye',
  },
  {
    title: 'Gestion de contacts',
    text: 'Enregistrer et retrouver facilement tous vos contacts au même endroit.',
    tone: 'blue',
    icon: 'people',
  },
  {
    title: 'Statistiques avancées',
    text: 'Analysez vos performances et comprenez votre impact réel sur votre réseau.',
    tone: 'light',
    icon: 'chart',
  },
] as const
</script>

<template>
  <section id="fonctionnalites" class="features">
    <div class="panel reveal">
      <div class="intro">
        <span class="badge">
          <svg
            class="badge-icon"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"
            />
          </svg>
          Fonctionnalités clés
        </span>

        <h2 class="title">
          Tout ce dont vous avez besoin
          <span class="accent">pour créer des connexions durables</span>
        </h2>

        <p class="lead">
          Des fonctionnalités qui rendent votre expérience Drop One fluide.
        </p>
      </div>

      <div class="grid">
        <article
          v-for="(feature, index) in features"
          :key="feature.title"
          class="card"
          :class="feature.tone"
          :style="{ transitionDelay: `${index * 70}ms` }"
        >
          <div class="icon" aria-hidden="true">
            <svg v-if="feature.icon === 'card'" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m0 14H4v-6h16v6m0-10H4V6h16v2"
              />
            </svg>
            <svg v-else-if="feature.icon === 'grid'" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"
              />
            </svg>
            <svg v-else-if="feature.icon === 'eye'" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"
              />
            </svg>
            <svg v-else-if="feature.icon === 'people'" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13m8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"
              />
            </svg>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 0 12px 48px;
  background: #fff;
}

.panel {
  width: 100%;
  padding: clamp(36px, 5vw, 64px) clamp(20px, 3vw, 40px);
  border-radius: 36px;
  background: #fff;
  box-shadow:
    0 2px 8px rgba(12, 13, 16, 0.06),
    0 12px 32px rgba(12, 13, 16, 0.1),
    0 28px 64px rgba(12, 13, 16, 0.08);
}

.intro {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 44px;
}

.badge {
  margin-inline: auto;
}

.badge-icon {
  flex-shrink: 0;
}

.title {
  margin: 18px 0 0;
  font-size: clamp(1.85rem, 3.6vw, 2.75rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--do-ink);
}

.title .accent {
  display: block;
  color: var(--do-blue);
}

.lead {
  margin: 16px auto 0;
  max-width: 46ch;
  color: var(--do-muted);
  font-size: 1.02rem;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 280px;
  padding: 28px 18px 24px;
  border-radius: 28px;
  background: #f4f6fb;
}

.icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e8f0ff;
  color: var(--do-blue);
}

.icon svg {
  width: 26px;
  height: 26px;
}

.card h3 {
  margin: 22px 0 12px;
  font-size: 1.12rem;
  line-height: 1.3;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.card p {
  margin: 0;
  color: var(--do-muted);
  line-height: 1.55;
  font-size: 0.92rem;
}

.card.dark {
  background: #0a0a0b;
  color: #fff;
}

.card.dark .icon {
  background: #fff;
  color: var(--do-blue);
}

.card.dark p {
  color: rgba(255, 255, 255, 0.78);
}

.card.blue {
  background: var(--do-blue);
  color: #fff;
}

.card.blue .icon {
  background: #fff;
  color: var(--do-blue);
}

.card.blue p {
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .features {
    padding: 0 10px 40px;
  }

  .panel {
    border-radius: 28px;
    padding: 32px 16px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .card {
    min-height: 0;
  }

  .title .accent {
    display: inline;
  }
}
</style>
