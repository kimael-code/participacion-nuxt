import { eq } from 'drizzle-orm';
import { auth } from '../../auth';
import { users } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const userId = session.user.id;

  // Fetch user role and permissions
  const userWithPermissions = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      roleData: {
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!userWithPermissions) {
    console.warn(`[Permissions] User ${userId} not found in DB`);
    return {
      role: 'user',
      permissions: [],
    };
  }

  // Fallback to raw role string if relation is missing
  const roleSlug =
    userWithPermissions.roleData?.slug || userWithPermissions.role || 'user';

  const perms =
    userWithPermissions.roleData?.rolePermissions?.map(
      (rp) => rp.permission.slug,
    ) || [];

  console.log(`[Permissions] User ${userId} has role: ${roleSlug}`);

  return {
    role: roleSlug,
    permissions: perms,
  };
});
