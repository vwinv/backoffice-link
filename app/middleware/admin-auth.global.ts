export default defineNuxtRouteMiddleware(async (to) => {
  const isAdminRoute = to.path === '/admin' || to.path.startsWith('/admin/')
  if (!isAdminRoute) return

  const isLogin = to.path === '/admin/login'
  const auth = useAuth()

  await auth.ensureSession()

  if (isLogin) {
    if (auth.isAuthenticated.value) {
      return navigateTo('/admin')
    }
    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo({
      path: '/admin/login',
      query: { redirect: to.fullPath },
    })
  }
})
