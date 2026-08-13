<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const available = computed(() =>
  locales.value.map((item) => {
    const code = typeof item === 'string' ? item : item.code
    return {
      code,
      label: code === 'fr' ? 'FR' : 'EN',
    }
  }),
)

async function switchTo(code: string) {
  if (code === locale.value) return
  await setLocale(code as 'fr' | 'en')
}
</script>

<template>
  <div
    class="switcher"
    role="group"
    :aria-label="$t('locale.switch')"
  >
    <button
      v-for="item in available"
      :key="item.code"
      type="button"
      class="opt"
      :class="{ active: locale === item.code }"
      :aria-pressed="locale === item.code"
      @click="switchTo(item.code)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.switcher {
  display: inline-flex;
  align-items: center;
  border: 1px solid #ECF0FB;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.opt {
  min-width: 40px;
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--do-muted, #5b616e);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.opt + .opt {
  border-left: 1px solid #ECF0FB;
}

.opt.active {
  background: #f4f6fb;
  color: var(--do-ink, #0c0d10);
}

.opt:hover:not(.active) {
  color: var(--do-ink, #0c0d10);
}
</style>
