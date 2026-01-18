import { and, count, eq, like, or } from 'drizzle-orm';
import { auth } from '../../auth';
import { companies, userCompanies } from '../../database/schema';
import { db } from '../../utils/db';

/**
 * GET /api/companies
 * Obtener empresas del usuario autenticado
 */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado',
    });
  }

  const query = getQuery(event);
  const q = String(query.q || '').trim();

  // Check if pagination is requested
  const isPaginated = query.page !== undefined || query.limit !== undefined;

  // Base query
  const baseQuery = db
    .select({
      id: companies.id,
      name: companies.name,
      rif: companies.rif,
      logo: companies.logo,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
    })
    .from(companies)
    .innerJoin(userCompanies, eq(companies.id, userCompanies.companyId))
    .where(eq(userCompanies.userId, session.user.id));

  // If not paginated and no search, return simple array (legacy mode for switcher)
  if (!isPaginated && !q) {
    return await baseQuery;
  }

  // --- Pagination Logic ---
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const offset = (page - 1) * limit;

  // Conditions
  const conditions = [eq(userCompanies.userId, session.user.id)];
  if (q) {
    conditions.push(
      or(like(companies.name, `%${q}%`), like(companies.rif, `%${q}%`)),
    );
  }

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(companies)
    .innerJoin(userCompanies, eq(companies.id, userCompanies.companyId))
    .where(and(...conditions));

  const total = Number(totalResult?.count || 0);

  // Get data
  const data = await db
    .select({
      id: companies.id,
      name: companies.name,
      rif: companies.rif,
      logo: companies.logo,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt,
    })
    .from(companies)
    .innerJoin(userCompanies, eq(companies.id, userCompanies.companyId))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  return {
    data,
    total,
    page,
    limit,
  };
});
