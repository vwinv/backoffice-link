export default defineNuxtRouteMiddleware(async (to) => {
  const isEspacePortal = to.path.startsWith('/espace_')
  const isEspaceLogin = to.path === '/espace/login'
  if (!isEspacePortal && !isEspaceLogin) return

  const auth = useEspaceAuth()
  await auth.ensureSession()

  if (isEspaceLogin) {
    if (auth.isAuthenticated.value) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
      if (redirect.startsWith('/espace_')) {
        return navigateTo(redirect)
      }
      try {
        const { listMine } = useEspace()
        const teams = await listMine()
        if (teams[0]?.espacePath) {
          return navigateTo(teams[0].espacePath)
        }
      }
      catch {
        // rester sur login si aucun espace
      }
    }
    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo({
      path: '/espace/login',
      query: { redirect: to.fullPath },
    })
  }
})
