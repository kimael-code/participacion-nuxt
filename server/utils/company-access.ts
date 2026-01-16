import { and, eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { auth } from '../auth';
import { userCompanies } from '../database/schema';
import { db } from './db';

/**
 * Verificar que el usuario tiene acceso a la empresa
 */
export async function verifyCompanyAccess(
  event: H3Event,
  companyId: string,
): Promise<boolean> {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) return false;

  const access = await db
    .select()
    .from(userCompanies)
    .where(
      and(
        eq(userCompanies.userId, session.user.id),
        eq(userCompanies.companyId, companyId),
      ),
    )
    .limit(1);

  return access.length > 0;
}

/**
 * Require company access (throw error if not authorized)
 */
export async function requireCompanyAccess(
  event: H3Event,
  companyId: string,
): Promise<void> {
  const hasAccess = await verifyCompanyAccess(event, companyId);

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: 'No tienes acceso a esta empresa',
    });
  }
}
