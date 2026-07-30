<template>
  <section id="a-propos" class="mission">
    <div class="panel reveal">
      <div class="grid">
        <div class="copy">
          <span class="badge">
            <svg
              class="badge-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13m8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"
              />
            </svg>
            À propos de nous
          </span>

          <h2 class="title">
            <span class="accent">Notre</span> mission
          </h2>

          <p class="lead">
            Chez Drop One, nous croyons que chaque connexion peut ouvrir la
            porte à de grandes opportunités. Notre mission est de vous offrir
            l’outil le plus simple et puissant pour partager, connecter,
            impacter.
          </p>

          <a class="btn btn-primary cta" href="#contact">
            En savoir plus sur nous
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="visual">
          <img
            src="/images/IMG_1384.PNG"
            alt="Mission Drop One — partage, réseau, statistiques et témoignage"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mission {
  padding: 0 12px 48px;
  background: #fff;
}

.panel {
  width: 100%;
  padding: clamp(28px, 4vw, 48px);
  border-radius: 36px;
  border: none;
  background: #fff;
  box-shadow:
    0 2px 8px rgba(12, 13, 16, 0.06),
    0 12px 32px rgba(12, 13, 16, 0.1),
    0 28px 64px rgba(12, 13, 16, 0.08);
}

.grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.92fr) minmax(340px, 1.2fr);
  gap: clamp(28px, 4vw, 56px);
  align-items: center;
}

.badge-icon {
  flex-shrink: 0;
}

.title {
  margin: 18px 0 0;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--do-ink);
}

.title .accent {
  color: var(--do-blue);
}

.lead {
  margin: 22px 0 0;
  max-width: 36ch;
  color: var(--do-muted);
  font-size: 1.05rem;
  line-height: 1.7;
}

.cta {
  margin-top: 32px;
  border-radius: 999px;
  min-height: 54px;
  padding-inline: 26px;
}

.visual img {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 960px) {
  .mission {
    padding: 0 10px 40px;
  }

  .panel {
    border-radius: 28px;
    padding: 24px;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .visual {
    order: -1;
  }

  .lead {
    max-width: none;
  }
}
</style>
