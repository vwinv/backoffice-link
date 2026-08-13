<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { t } = useI18n()
const auth = useEspaceAuth()
const route = useRoute()
const { listMine } = useEspace()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const submitting = ref(false)

async function onSubmit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : ''
    if (redirect.startsWith('/espace_')) {
      await navigateTo(redirect)
      return
    }
    const teams = await listMine()
    if (teams[0]?.espacePath) {
      await navigateTo(teams[0].espacePath)
      return
    }
    errorMessage.value = t('espace.login.noTeam')
  }
  catch (error: unknown) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message
    }
    else if (error instanceof Error) {
      errorMessage.value = error.message
    }
    else {
      errorMessage.value = t('espace.login.failed')
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="lang">
      <LocaleSwitcher />
    </div>
    <div class="login-card">
      <div class="brand">
        <img
          src="/images/icone.png"
          alt="DropOne"
          width="72"
          height="72"
          class="logo"
        >
        <span class="eyebrow">{{ $t('espace.login.eyebrow') }}</span>
      </div>

      <h1>{{ $t('espace.login.title') }}</h1>
      <p class="lead">
        {{ $t('espace.login.lead') }}
      </p>

      <form
        class="form"
        @submit.prevent="onSubmit"
      >
        <label class="field">
          <span>{{ $t('espace.login.email') }}</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            placeholder="vous@entreprise.com"
          >
        </label>

        <label class="field">
          <span>{{ $t('espace.login.password') }}</span>
          <div class="password-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              minlength="6"
              placeholder="••••••••"
            >
            <button
              type="button"
              class="toggle-password"
              :aria-label="showPassword ? $t('espace.login.hidePassword') : $t('espace.login.showPassword')"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="!showPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line
                  x1="1"
                  y1="1"
                  x2="23"
                  y2="23"
                />
              </svg>
            </button>
          </div>
        </label>

        <p
          v-if="errorMessage"
          class="error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <button
          class="submit"
          type="submit"
          :disabled="submitting"
        >
          {{ submitting ? $t('espace.login.submitting') : $t('espace.login.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(10, 107, 255, 0.16), transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 100%, rgba(10, 107, 255, 0.1), transparent 50%),
    #f4f6fb;
  color: #0c0d10;
  font-family: var(--do-font);
}

.lang {
  position: absolute;
  top: 20px;
  right: 20px;
}

.login-card {
  width: min(100%, 420px);
  padding: 36px 32px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid #e5e5ea;
  box-shadow: 0 24px 60px rgba(12, 13, 16, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
}

.logo {
  height: 72px;
  width: 72px;
  display: block;
  border-radius: 18px;
  object-fit: cover;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0a6bff;
}

h1 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.lead {
  margin: 0 0 28px;
  color: #5b616e;
  line-height: 1.5;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

.field input {
  min-height: 48px;
  width: 100%;
  padding: 0 14px;
  border: 1px solid #e5e5ea;
  border-radius: 12px;
  background: #fafbfc;
  font: inherit;
  font-weight: 500;
  color: inherit;
  outline: none;
}

.password-wrap {
  position: relative;
}

.password-wrap input {
  padding-right: 48px;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #5b616e;
  cursor: pointer;
}

.field input:focus {
  border-color: #0a6bff;
  box-shadow: 0 0 0 3px rgba(10, 107, 255, 0.15);
  background: #fff;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff1f1;
  color: #b42318;
  font-size: 0.875rem;
  font-weight: 600;
}

.submit {
  margin-top: 8px;
  min-height: 52px;
  border: 0;
  border-radius: 14px;
  background: #0a6bff;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
