<script setup lang="ts">
const { t } = useI18n()
const open = ref(false)
const sending = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
})

const { apiFetch } = useApi()

function toggle() {
  open.value = !open.value
  if (open.value) {
    error.value = null
    success.value = false
  }
}

function close() {
  if (sending.value) return
  open.value = false
}

async function onSubmit() {
  sending.value = true
  error.value = null
  success.value = false
  try {
    await apiFetch('/support/tickets', {
      method: 'POST',
      body: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      },
    })
    success.value = true
    form.firstName = ''
    form.lastName = ''
    form.email = ''
    form.phone = ''
    form.message = ''
  }
  catch (err: unknown) {
    error.value = err instanceof ApiError ? err.message : t('landing.support.error')
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="support-fab-root">
    <button
      type="button"
      class="fab"
      :aria-expanded="open"
      aria-controls="support-panel"
      :aria-label="$t('landing.support.open')"
      @click="toggle"
    >
      <svg
        v-if="!open"
        viewBox="0 0 24 24"
        width="26"
        height="26"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M12 3c-4.97 0-9 3.58-9 8 0 2.54 1.29 4.8 3.3 6.3V21l3.45-1.9c.72.2 1.47.3 2.25.3 4.97 0 9-3.58 9-8s-4.03-8-9-8zm1 12h-2v-2h2v2zm0-4h-2V7h2v4z"
        />
      </svg>
      <span
        v-else
        class="fab-close"
        aria-hidden="true"
      >×</span>
    </button>

    <aside
      v-if="open"
      id="support-panel"
      class="panel"
      role="dialog"
      :aria-label="$t('landing.support.dialog')"
    >
      <header>
        <h2>{{ $t('landing.support.title') }}</h2>
        <p>{{ $t('landing.support.lead') }}</p>
      </header>

      <form
        v-if="!success"
        @submit.prevent="onSubmit"
      >
        <p
          v-if="error"
          class="err"
          role="alert"
        >
          {{ error }}
        </p>
        <div class="row">
          <label>
            <span>{{ $t('landing.support.firstName') }}</span>
            <input
              v-model="form.firstName"
              required
              autocomplete="given-name"
            >
          </label>
          <label>
            <span>{{ $t('landing.support.lastName') }}</span>
            <input
              v-model="form.lastName"
              required
              autocomplete="family-name"
            >
          </label>
        </div>
        <label>
          <span>{{ $t('landing.support.email') }}</span>
          <input
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
          >
        </label>
        <label>
          <span>{{ $t('landing.support.phone') }}</span>
          <input
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            :placeholder="$t('landing.support.phoneOptional')"
          >
        </label>
        <label>
          <span>{{ $t('landing.support.message') }}</span>
          <textarea
            v-model="form.message"
            required
            minlength="10"
            rows="4"
            :placeholder="$t('landing.support.messagePlaceholder')"
          />
        </label>
        <button
          type="submit"
          class="submit"
          :disabled="sending"
        >
          {{ sending ? $t('landing.support.sending') : $t('landing.support.send') }}
        </button>
      </form>

      <div
        v-else
        class="done"
      >
        <p>{{ $t('landing.support.done') }}</p>
        <button
          type="button"
          class="submit"
          @click="close"
        >
          {{ $t('landing.support.close') }}
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.support-fab-root {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.fab {
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  background: var(--do-ink);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(12, 13, 16, 0.22);
  display: grid;
  place-items: center;
}

.fab:hover {
  background: #1a1b20;
}

.fab-close {
  font-size: 28px;
  line-height: 1;
}

.panel {
  width: min(360px, calc(100vw - 32px));
  background: #fff;
  border: 1px solid var(--do-line);
  border-radius: 18px;
  box-shadow: var(--do-shadow);
  padding: 16px;
}

.panel header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.panel header p {
  margin: 6px 0 0;
  color: var(--do-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}

.panel form,
.done {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

label {
  display: grid;
  gap: 4px;
}

label span {
  font-size: 0.78rem;
  color: var(--do-muted);
}

input,
textarea {
  border: 1px solid var(--do-line);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  font: inherit;
  width: 100%;
}

textarea {
  resize: vertical;
}

.submit {
  border: 0;
  border-radius: 10px;
  background: var(--do-blue);
  color: #fff;
  font: inherit;
  font-weight: 600;
  padding: 0.7rem 0.9rem;
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.err {
  margin: 0;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  background: #fef3f2;
  color: #b42318;
  font-size: 0.88rem;
}

.done p {
  margin: 0;
  line-height: 1.45;
}

@media (max-width: 480px) {
  .support-fab-root {
    right: 14px;
    bottom: 14px;
  }
}
</style>
