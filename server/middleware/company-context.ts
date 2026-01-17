import { auth } from '../auth';
import { getUserCompanyId } from '../utils/auth';

/**
 * Global middleware for company context
 *
 * Automatically handles authentication and company verification for protected routes.
 * Stores session, user, and companyId in event.context.auth for use in endpoints.
 *
 * Routes that require company context:
 * - /api/employees
 * - /api/units
 * - /api/events
 * - /api/locations
 * - /api/participations
 * - /api/dashboard
 * - /api/listings
 * - /api/reports
 *
 * Excluded routes (handle their own auth):
 * - /api/auth/* - Authentication endpoints
 * - /api/geographic/* - Public geographic catalogs
 * - /api/companies - User's companies (different logic)
 * - /api/bulk-import - Receives companyId in body
 */
export default defineEventHandler(async (event) => {
  const path = event.path;

  // Lista de rutas que requieren company context
  const requiresCompany = [
    '/api/employees',
    '/api/units',
    '/api/events',
    '/api/locations',
    '/api/participations',
    '/api/dashboard',
    '/api/listings',
    '/api/reports',
  ];

  // Skip middleware si no es una ruta protegida o si es una ruta excluida específicamente
  if (
    !requiresCompany.some((route) => path.startsWith(route)) ||
    path.startsWith('/api/dashboard/stats')
  ) {
    return;
  }

  // Verificar autenticación
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Obtener companyId del usuario
  const companyId = await getUserCompanyId(session.user.id, event);
  if (!companyId) {
    throw createError({
      statusCode: 403,
      message: 'No company access',
    });
  }

  // Guardar en context para que los endpoints lo usen
  event.context.auth = {
    session: session.session,
    user: session.user,
    companyId,
  } as any;
});
