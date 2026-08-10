<template>
  <section id="accueil" class="hero">
    <div class="glow" aria-hidden="true" />
    <div class="container grid">
      <div class="copy reveal">
        <span class="badge">La carte de visite nouvelle génération</span>
        <h1>
          Connectez-vous. Partagez.
          <span>Marquez les esprits.</span>
        </h1>
        <p>
          Drop One réinvente la façon dont vous partagez vos informations et
          développez votre réseau.
        </p>
        <div class="actions">
          <a class="btn btn-primary" href="#telecharger">
            Créer ma carte
            <span aria-hidden="true">→</span>
          </a>
          <a class="btn btn-outline" href="#fonctionnalites">
            <span class="play" aria-hidden="true">▶</span>
            Voir une démo
          </a>
        </div>
        <div class="social-proof">
          <div class="avatars" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <p>Plus de 2 000 personnes nous font déjà confiance.</p>
        </div>
      </div>

      <div class="visual reveal">
        <div class="visual-block">
          <img
            src="/images/IMG_1382.PNG"
            alt="Aperçu de l'application DropOne sur mobile"
            class="phones"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: calc(100dvh - 88px);
  padding: 24px 48px 8px;
  box-sizing: border-box;
}

.glow {
  position: absolute;
  inset: -10% auto auto -8%;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--do-blue-glow), transparent 68%);
  pointer-events: none;
}

.grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.78fr) minmax(420px, 1.45fr);
  gap: 20px;
  align-items: center;
  width: 100%;
}

.copy h1 {
  margin: 18px 0 0;
  font-size: clamp(2.35rem, 4.8vw, 3.7rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.copy h1 span {
  color: var(--do-blue);
}

.copy > p {
  margin: 18px 0 0;
  max-width: 38ch;
  color: var(--do-muted);
  font-size: 1.05rem;
  line-height: 1.65;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.actions .btn {
  border-radius: 999px;
  min-height: 54px;
  padding-inline: 24px;
}

.play {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.58rem;
}

.social-proof {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
}

.avatars {
  display: flex;
}

.avatars span {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-left: -10px;
  background: linear-gradient(135deg, #9ec0ff, #0a6bff);
}

.avatars span:first-child {
  margin-left: 0;
}

.avatars span:nth-child(2) {
  background: linear-gradient(135deg, #ffd28a, #ff9f43);
}

.avatars span:nth-child(3) {
  background: linear-gradient(135deg, #a8f0c6, #22c55e);
}

.avatars span:nth-child(4) {
  background: linear-gradient(135deg, #d7c7ff, #7c5cff);
}

.social-proof p {
  margin: 0;
  color: var(--do-muted);
  font-size: 0.92rem;
  font-weight: 600;
}

.visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.visual-block {
  width: 100%;
  padding: 16px 10px 12px;
  border-radius: 36px;
  background: #f8f9fa;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(12, 13, 16, 0.06);
}

.phones {
  width: 100%;
  height: auto;
  max-height: min(82vh, 820px);
  object-fit: contain;
  border-radius: 24px;
  display: block;
  transform: scale(1.06);
  transform-origin: center center;
}

@media (max-width: 960px) {
  .hero {
    min-height: calc(100dvh - 88px);
    padding: 20px 20px 12px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .visual {
    order: -1;
  }

  .visual-block {
    border-radius: 28px;
    padding: 14px 8px 10px;
  }

  .phones {
    max-height: min(52vh, 520px);
    transform: scale(1.04);
  }
}
</style>
