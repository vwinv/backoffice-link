type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    use_fedcm_for_prompt?: boolean
  }) => void
  prompt: (
    momentListener?: (notification: GooglePromptNotification) => void,
  ) => void
  cancel: () => void
}

type AppleAuthorization = {
  id_token?: string
  code?: string
}

type AppleSignInSuccessDetail = {
  authorization?: AppleAuthorization
  user?: {
    email?: string
    name?: {
      firstName?: string
      lastName?: string
    }
  }
}

type AppleIDAuth = {
  init: (config: {
    clientId: string
    scope: string
    redirectURI: string
    usePopup: boolean
    state?: string
  }) => void
  signIn: () => Promise<AppleSignInSuccessDetail>
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } }
    AppleID?: { auth?: AppleIDAuth }
  }
}

function loadScript(src: string, id: string): Promise<void> {
  if (import.meta.server) return Promise.resolve()
  if (document.getElementById(id)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Impossible de charger ${src}`))
    document.head.appendChild(script)
  })
}

export function useEspaceSocialLogin() {
  const config = useRuntimeConfig()

  const googleClientId = computed(() =>
    String(config.public.googleClientId || '').trim(),
  )
  const appleClientId = computed(() =>
    String(config.public.appleClientId || '').trim(),
  )
  const appleRedirectUri = computed(() => {
    const configured = String(config.public.appleRedirectUri || '').trim()
    if (configured) return configured
    if (import.meta.client) {
      return `${window.location.origin}/espace/login`
    }
    return ''
  })

  const googleReady = computed(() => googleClientId.value.length > 0)
  const appleReady = computed(
    () => appleClientId.value.length > 0 && appleRedirectUri.value.length > 0,
  )

  async function ensureGoogle() {
    if (!googleReady.value) {
      throw new Error('Google OAuth non configuré')
    }
    await loadScript('https://accounts.google.com/gsi/client', 'google-gsi')
    if (!window.google?.accounts?.id) {
      throw new Error('SDK Google indisponible')
    }
  }

  async function ensureApple() {
    if (!appleReady.value) {
      throw new Error('Apple OAuth non configuré')
    }
    await loadScript(
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/fr_FR/appleid.auth.js',
      'apple-auth',
    )
    if (!window.AppleID?.auth) {
      throw new Error('SDK Apple indisponible')
    }
    window.AppleID.auth.init({
      clientId: appleClientId.value,
      scope: 'name email',
      redirectURI: appleRedirectUri.value,
      usePopup: true,
    })
  }

  /** Bouton custom : One Tap / FedCM via prompt(). */
  async function signInWithGoogle(): Promise<string> {
    await ensureGoogle()

    return new Promise((resolve, reject) => {
      let settled = false

      const finish = (error?: Error, token?: string) => {
        if (settled) return
        settled = true
        try {
          window.google?.accounts?.id?.cancel()
        }
        catch {
          // ignore
        }
        if (error) reject(error)
        else if (token) resolve(token)
        else reject(new Error('Connexion Google annulée'))
      }

      window.google!.accounts!.id!.initialize({
        client_id: googleClientId.value,
        callback: (response) => {
          const token = response.credential?.trim()
          if (!token) {
            finish(new Error('Connexion Google incomplete'))
            return
          }
          finish(undefined, token)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      })

      window.google!.accounts!.id!.prompt((notification) => {
        if (settled) return
        if (notification.isDismissedMoment()) {
          finish(new Error('Connexion Google annulée'))
          return
        }
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const reason
            = notification.getNotDisplayedReason?.()
              || notification.getSkippedReason?.()
              || 'unavailable'
          finish(
            new Error(
              `Connexion Google indisponible (${reason}). Autorisez les cookies tiers ou réessayez.`,
            ),
          )
        }
      })
    })
  }

  async function signInWithApple(): Promise<{
    idToken: string
    firstName?: string
    lastName?: string
  }> {
    await ensureApple()
    const result = await window.AppleID!.auth!.signIn()
    const idToken = result.authorization?.id_token?.trim()
    if (!idToken) {
      throw new Error('Connexion Apple annulée ou incomplete')
    }
    return {
      idToken,
      firstName: result.user?.name?.firstName,
      lastName: result.user?.name?.lastName,
    }
  }

  return {
    googleReady,
    appleReady,
    signInWithGoogle,
    signInWithApple,
  }
}
