<template>
  <section
    id="modeles"
    class="models"
  >
    <div class="panel reveal">
      <img
        src="/images/IMG_1381.PNG"
        :alt="$t('landing.models.alt')"
        class="shot"
      >
    </div>
  </section>
</template>

<style scoped>
.models {
  padding: 0 12px 48px;
  background: #fff;
}

.panel {
  width: 100%;
  overflow: hidden;
  border-radius: 36px;
  background: #000;
  box-shadow:
    0 2px 8px rgba(12, 13, 16, 0.06),
    0 12px 32px rgba(12, 13, 16, 0.12),
    0 28px 64px rgba(12, 13, 16, 0.1);
}

.shot {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 720px) {
  .models {
    padding: 0 10px 40px;
  }

  .panel {
    border-radius: 28px;
  }
}
</style>
