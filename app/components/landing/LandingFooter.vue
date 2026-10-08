<script setup lang="ts">
const { t } = useI18n()

const links = computed(() => [
  { href: '#a-propos', label: t('landing.footer.about') },
  { href: '#fonctionnalites', label: t('landing.footer.features') },
  { href: '#tarifs', label: t('landing.footer.pricing') },
  { href: '#contact', label: t('landing.footer.contact') },
])

const socials = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/19SJf1ecJQ/?mibextid=wwXIfr',
    path: 'M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@megasn57',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/_mega_sn',
    path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  },
]
</script>

<template>
  <footer
    id="contact"
    class="footer"
  >
    <div class="inner">
      <div class="socials">
        <span>{{ $t('landing.footer.socials') }}</span>
        <div class="icons">
          <a
            v-for="social in socials"
            :key="social.label"
            :href="social.href"
            :aria-label="social.label"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                :d="social.path"
              />
            </svg>
          </a>
        </div>
      </div>

      <div class="row">
        <nav :aria-label="$t('landing.footer.nav')">
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
          >
            {{ link.label }}
          </a>
          <NuxtLink to="/policy">
            {{ $t('landing.footer.privacy') }}
          </NuxtLink>
        </nav>

        <a
          class="btn btn-primary download"
          href="#telecharger"
        >
          {{ $t('landing.footer.download') }}
        </a>
      </div>

      <div
        class="line"
        aria-hidden="true"
      />

      <p class="copy">
        <a
          href="https://www.mega-sn.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Copyright © {{ new Date().getFullYear() }} • MEGA
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin: 0 12px 0;
  padding: 36px clamp(24px, 5vw, 64px) 28px;
  border-radius: 36px 36px 0 0;
  background: #000;
  color: #fff;
}

.inner {
  width: min(100%, var(--do-container));
  margin-inline: auto;
}

.socials {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 28px;
  font-size: 0.92rem;
  font-weight: 500;
}

.icons {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icons a {
  display: grid;
  place-items: center;
  color: #fff;
  opacity: 0.92;
  transition: opacity 0.2s ease;
}

.icons a:hover {
  opacity: 1;
}

.row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 22px 28px;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 22px 28px;
}

nav a {
  color: #fff;
  font-weight: 600;
  font-size: 0.98rem;
}

nav a:hover {
  opacity: 0.8;
}

.download {
  border-radius: 999px;
  min-height: 48px;
  padding-inline: 22px;
}

.line {
  margin: 26px 0 18px;
  height: 1px;
  background: rgba(255, 255, 255, 0.18);
}

.copy {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
}

.copy a {
  color: inherit;
}

.copy a:hover {
  color: #fff;
}

@media (max-width: 860px) {
  .footer {
    margin: 0 10px 0;
    border-radius: 28px 28px 0 0;
    padding: 28px 18px 22px;
  }

  .socials,
  .row {
    justify-content: flex-start;
  }

  .row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
