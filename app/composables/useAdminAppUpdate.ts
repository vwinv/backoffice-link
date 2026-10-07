export type AppUpdateConfig = {
  latestVersion: string
  minVersion: string
  iosStoreUrl: string
  androidStoreUrl: string
  message: string
  updatedAt?: string
}

export function useAdminAppUpdate() {
  const { apiFetch } = useApi()
  const { token } = useAuth()

  function getConfig() {
    return apiFetch<AppUpdateConfig>('/admin/app-update', {
      token: token.value,
    })
  }

  function updateConfig(body: Partial<AppUpdateConfig>) {
    return apiFetch<AppUpdateConfig>('/admin/app-update', {
      method: 'PATCH',
      token: token.value,
      body,
    })
  }

  return {
    getConfig,
    updateConfig,
  }
}
