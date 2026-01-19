export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  // 1. Unauthenticated users trying to access dashboard -> Login
  if (to.path.startsWith('/dashboard') && !session.value) {
    return navigateTo('/login');
  }

  // 2. Authenticated users
  if (session.value) {
    // Skip if already on onboarding OR navigating FROM onboarding (just completed setup)
    if (to.path === '/onboarding') return;

    // Check if user needs onboarding (no company)
    // Only check if trying to access dashboard
    if (to.path.startsWith('/dashboard')) {
      try {
        const { role } = await $fetch('/api/auth/permissions', {
          headers: useRequestHeaders(['cookie']) as any,
        }).catch(() => ({ role: 'guest' }));

        // If role is not 'admin', redirect to onboarding
        if (role !== 'admin') {
          return navigateTo('/onboarding');
        }
      } catch (e) {
        // Fallback - allow navigation
      }
    }

    // 3. Authenticated user visiting auth pages -> Dashboard
    const authRoutes = ['/login', '/register', '/'];
    if (authRoutes.includes(to.path)) {
      return navigateTo('/dashboard');
    }
  }
});
