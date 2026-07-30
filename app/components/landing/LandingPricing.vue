<script setup lang="ts">
const plans = [
  {
    name: 'Gratuit',
    subtitle: 'Pour découvrir Drop One',
    price: '0',
    unit: 'FCFA/mois',
    cta: 'Commencer maintenant',
    tone: 'free',
    features: [
      '1 carte personnelle',
      'Partage via QR Code',
      'Suivi des vues basique',
      'Stockage limité',
    ],
  },
  {
    name: 'Drop One Premium',
    subtitle: 'Pour plus de fonctionnalités',
    price: '5 000',
    unit: 'FCFA/mois',
    cta: 'Essayez premium',
    tone: 'premium',
    features: [
      '1 carte personnelle',
      'Partage via QR Code',
      'Suivi des vues basique',
      'Stockage limité',
    ],
  },
  {
    name: 'Drop One Premium Pro équipe',
    subtitle: 'Pour plus de fonctionnalités',
    price: '10 000',
    unit: 'FCFA/mois',
    cta: 'Essayer Pro',
    tone: 'pro',
    features: [
      '1 carte personnelle',
      'Partage via QR Code',
      'Suivi des vues basique',
      'Stockage limité',
    ],
  },
] as const
</script>

<template>
  <section id="tarifs" class="pricing">
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
              d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"
            />
          </svg>
          Nos tarifs
        </span>
        <h2 class="title">
          Choisissez l’offre qui vous correspond le mieux
        </h2>
      </div>

      <div class="grid">
        <article
          v-for="(plan, index) in plans"
          :key="plan.name"
          class="plan"
          :class="plan.tone"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <div class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
              />
            </svg>
          </div>

          <h3>{{ plan.name }}</h3>
          <p class="subtitle">{{ plan.subtitle }}</p>

          <p class="price">
            <strong>{{ plan.price }}</strong>
            <span>{{ plan.unit }}</span>
          </p>

          <ul>
            <li v-for="feature in plan.features" :key="feature">
              <span class="check" aria-hidden="true">✓</span>
              {{ feature }}
            </li>
          </ul>

          <a class="cta" href="#telecharger">{{ plan.cta }}</a>
        </article>
      </div>

      <p class="note">
        Tous les prix incluent les taxes. Annulez à tout moment.
      </p>
    </div>
  </section>
</template>

<style scoped>
.pricing {
  padding: 0 12px 48px;
  background: #fff;
}

.panel {
  width: 100%;
  padding: clamp(40px, 5vw, 64px) clamp(20px, 3vw, 48px) 40px;
  border-radius: 36px;
  background: #000;
  border: 1px solid rgba(10, 107, 255, 0.55);
  box-shadow:
    0 0 0 1px rgba(10, 107, 255, 0.12),
    0 12px 40px rgba(10, 107, 255, 0.18),
    0 28px 64px rgba(12, 13, 16, 0.2);
}

.intro {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 48px;
}

.badge {
  margin-inline: auto;
  background: #fff;
  color: var(--do-blue);
  border: 1px solid #cfe0ff;
}

.badge-icon {
  flex-shrink: 0;
}

.title {
  margin: 18px 0 0;
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 240px));
  justify-content: center;
  gap: 28px 16px;
  align-items: stretch;
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px 16px 34px;
  border-radius: 20px;
  background: #fff;
  color: var(--do-ink);
}

.plan.premium {
  box-shadow: 0 0 0 2px #ffc400, 0 8px 24px rgba(255, 196, 0, 0.4);
}

.plan.pro {
  box-shadow: 0 0 0 2px var(--do-blue), 0 8px 24px rgba(10, 107, 255, 0.35);
}

.icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--do-blue-soft);
  color: var(--do-blue);
}

.plan.premium .icon {
  background: #ffc400;
  color: #111;
}

.plan.pro .icon {
  background: #111;
  color: #fff;
}

.icon svg {
  width: 18px;
  height: 18px;
}

h3 {
  margin: 12px 0 0;
  font-size: 1.05rem;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--do-muted);
  font-size: 0.82rem;
  line-height: 1.35;
}

.price {
  margin: 14px 0 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}

.price strong {
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.price span {
  color: var(--do-muted);
  font-weight: 600;
  font-size: 0.8rem;
}

ul {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  flex: 1;
}

li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--do-muted);
  line-height: 1.35;
  font-size: 0.8rem;
}

.check {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.62rem;
  font-weight: 800;
}

.plan.premium .check {
  background: #fff4cc;
  color: #b88600;
}

.plan.pro .check {
  background: #ececef;
  color: #111;
}

.cta {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--do-blue);
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
  text-align: center;
  box-shadow: 0 8px 18px rgba(10, 107, 255, 0.3);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.plan.premium .cta {
  background: #ffc400;
  color: #111;
  box-shadow: 0 8px 18px rgba(255, 196, 0, 0.35);
}

.note {
  margin: 40px 0 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
}

@media (max-width: 960px) {
  .pricing {
    padding: 0 10px 40px;
  }

  .panel {
    border-radius: 28px;
    padding: 36px 16px 32px;
  }

  .grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 220px));
    gap: 32px 14px;
  }

  .note {
    margin-top: 36px;
  }
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: minmax(0, 260px);
  }
}
</style>
