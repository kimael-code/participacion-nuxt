export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  // If path starts with /dashboard and there is no session, redirect to login
  if (to.path.startsWith('/dashboard') && !session.value) {
    return navigateTo('/login');
  }

  // If path is root, login or register and there IS a session, redirect to dashboard
  const authRoutes = ['/login', '/register', '/'];
  if (authRoutes.includes(to.path) && session.value) {
    return navigateTo('/dashboard');
  }
});
