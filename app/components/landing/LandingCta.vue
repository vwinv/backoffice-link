<template>
  <section
    id="telecharger"
    class="cta-wrap"
  >
    <div class="banner reveal">
      <div class="copy">
        <h2>{{ $t('landing.cta.title') }}</h2>
        <p>
          {{ $t('landing.cta.text') }}
        </p>
      </div>

      <div
        class="divider"
        aria-hidden="true"
      />

      <div class="download">
        <p class="label">
          {{ $t('landing.cta.label') }}
        </p>
        <div class="stores">
          <a
            class="store"
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="$t('landing.cta.appStore')"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"
              />
            </svg>
            App Store
          </a>
          <a
            class="store"
            href="https://play.google.com/store/apps/details?id=com.mega.dropone"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="$t('landing.cta.playStore')"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path
                fill="#34A853"
                d="M3.1 20.9 13.2 12 3.1 3.1v17.8z"
              />
              <path
                fill="#4285F4"
                d="m13.2 12 2.7-2.7 4.6 2.6c.7.4.7 1.1 0 1.5l-4.6 2.6-2.7-2.7z"
              />
              <path
                fill="#FBBC04"
                d="M3.1 20.9c.3.5.8.6 1.4.3L15.9 14.7 13.2 12z"
              />
              <path
                fill="#EA4335"
                d="M15.9 9.3 4.5 2.8c-.6-.3-1.1-.2-1.4.3L13.2 12z"
              />
            </svg>
            PLAY STORE
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-wrap {
  padding: 0 12px 48px;
  background: #fff;
}

.banner {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto minmax(240px, 0.85fr);
  align-items: center;
  gap: clamp(20px, 3vw, 36px);
  width: 100%;
  padding: clamp(28px, 4vw, 40px) clamp(24px, 4vw, 44px);
  border-radius: 28px;
  background: var(--do-blue);
  color: #fff;
  box-shadow:
    0 10px 28px rgba(10, 107, 255, 0.28),
    0 24px 56px rgba(10, 107, 255, 0.22);
}

.copy {
  max-width: 620px;
}

h2 {
  margin: 0;
  font-size: clamp(1.45rem, 2.8vw, 2rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.copy p {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 1rem;
  line-height: 1.55;
}

.divider {
  width: 1px;
  height: 72px;
  background: rgba(255, 255, 255, 0.55);
}

.download {
  display: grid;
  gap: 14px;
  justify-items: start;
}

.label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}

.stores {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.store {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 12px;
  background: #0c0d10;
  color: #fff;
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.store:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
}

@media (max-width: 900px) {
  .cta-wrap {
    padding: 0 10px 40px;
  }

  .banner {
    grid-template-columns: 1fr;
    gap: 22px;
    border-radius: 24px;
  }

  .divider {
    width: 100%;
    height: 1px;
  }
}
</style>
