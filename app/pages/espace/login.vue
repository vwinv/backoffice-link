<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { t } = useI18n()
const auth = useEspaceAuth()
const route = useRoute()
const { listMine } = useEspace()
const social = useEspaceSocialLogin()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const submitting = ref(false)
const oauthSubmitting = ref(false)

function setError(error: unknown) {
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

function isOAuthCancelled(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /popup_closed|user.*cancel|annul|dismissed/i.test(message)
}

async function redirectAfterAuth() {
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

async function onSubmit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    await redirectAfterAuth()
  }
  catch (error: unknown) {
    setError(error)
  }
  finally {
    submitting.value = false
  }
}

async function onGoogleClick() {
  if (oauthSubmitting.value || submitting.value) return
  errorMessage.value = ''
  oauthSubmitting.value = true
  try {
    const idToken = await social.signInWithGoogle()
    await auth.loginWithGoogle(idToken)
    await redirectAfterAuth()
  }
  catch (error: unknown) {
    if (isOAuthCancelled(error)) {
      errorMessage.value = ''
      return
    }
    setError(error)
  }
  finally {
    oauthSubmitting.value = false
  }
}

async function onAppleClick() {
  if (oauthSubmitting.value || submitting.value) return
  errorMessage.value = ''
  oauthSubmitting.value = true
  try {
    const result = await social.signInWithApple()
    await auth.loginWithApple(
      result.idToken,
      result.firstName,
      result.lastName,
    )
    await redirectAfterAuth()
  }
  catch (error: unknown) {
    if (isOAuthCancelled(error)) {
      errorMessage.value = ''
      return
    }
    setError(error)
  }
  finally {
    oauthSubmitting.value = false
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

      <div
        v-if="social.googleReady || social.appleReady"
        class="social"
      >
        <button
          v-if="social.googleReady"
          type="button"
          class="social-btn google-btn"
          :disabled="oauthSubmitting || submitting"
          @click="onGoogleClick"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7 12.9 19.6C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l.1.1 6.3 5.2C39.2 37 44 32.5 44 24c0-1.3-.1-2.5-.4-3.5z"
            />
          </svg>
          <span>{{
            oauthSubmitting
              ? $t('espace.login.oauthSubmitting')
              : $t('espace.login.google')
          }}</span>
        </button>

        <button
          v-if="social.appleReady"
          type="button"
          class="social-btn apple-btn"
          :disabled="oauthSubmitting || submitting"
          @click="onAppleClick"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M16.365 1.43c0 1.14-.43 2.2-1.2 3.03-.84.9-2.23 1.6-3.4 1.5-.15-1.1.4-2.27 1.18-3.13.85-.95 2.32-1.64 3.42-1.4zM20.5 17.2c-.58 1.34-.86 1.93-1.61 3.11-1.05 1.63-2.53 3.66-4.37 3.68-1.63.03-2.05-1.06-4.27-1.05-2.22.01-2.68 1.08-4.31 1.05-1.84-.03-3.25-1.85-4.3-3.48C-.1 17.3-.9 13.4.9 10.7c1.13-1.73 2.92-2.74 4.6-2.74 1.72 0 2.8 1.06 4.22 1.06 1.38 0 2.22-1.07 4.24-1.07 1.5 0 3.09.82 4.2 2.23-3.7 2.03-3.1 7.32.34 6.99z"
            />
          </svg>
          <span>{{
            oauthSubmitting
              ? $t('espace.login.oauthSubmitting')
              : $t('espace.login.apple')
          }}</span>
        </button>

        <div class="divider">
          <span>{{ $t('espace.login.or') }}</span>
        </div>
      </div>

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
          :disabled="submitting || oauthSubmitting"
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

.social {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}

.social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  width: 100%;
  border-radius: 14px;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.social-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.google-btn {
  border: 1px solid #e5e5ea;
  background: #fff;
  color: #0c0d10;
}

.google-btn:hover:not(:disabled) {
  background: #fafbfc;
}

.apple-btn {
  border: 0;
  background: #000;
  color: #fff;
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin: 8px 0 4px;
  color: #8e8e93;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.divider::before,
.divider::after {
  content: '';
  height: 1px;
  background: #e5e5ea;
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
