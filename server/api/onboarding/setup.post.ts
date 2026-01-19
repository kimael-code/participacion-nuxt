import { eq } from 'drizzle-orm';
import { auth } from '../../auth';
import * as schema from '../../database/schema';
import { db } from '../../utils/db';
import { seedDemoData } from '../../utils/demo-seeder';

export default defineEventHandler(async (event) => {
  // 1. Get Session
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const userId = session.user.id;
  const userName = session.user.name || 'Usuario';

  // 2. Double-check if user already has a company (Idempotency)
  // We check the user_companies link
  const existingLink = await db.query.userCompanies.findFirst({
    where: eq(schema.userCompanies.userId, userId),
  });

  if (existingLink) {
    return {
      success: true,
      message: 'Already setup',
      companyId: existingLink.companyId,
    };
  }

  // 2.5 Ensure "admin" role exists in roles table
  await db
    .insert(schema.roles)
    .values({
      id: 'role-admin',
      name: 'Administrador',
      slug: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  // 3. Create "Demo Company"
  const companyId = `demo-comp-${userId}-${Date.now()}`;
  const companyName = `Demo - ${userName}`;

  await db.insert(schema.companies).values({
    id: companyId,
    name: companyName,
    rif: `J-DEMO-${Date.now().toString().slice(-8)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Assign User as Admin
  await db.insert(schema.userCompanies).values({
    id: `link-${userId}-${companyId}`,
    userId: userId,
    companyId: companyId,
    role: 'admin',
    createdAt: new Date(),
  });

  // Update User Role globally if needed (optional depending on your model)
  // In your schema, user.role is global. Let's make them 'admin' so they pass permission checks.
  await db
    .update(schema.users)
    .set({ role: 'admin' })
    .where(eq(schema.users.id, userId));

  // 5. Seed Data
  try {
    await seedDemoData(companyId);
  } catch (e) {
    console.error('Seeding failed:', e);
    // We don't fail the request, user just gets empty company
  }

  return {
    success: true,
    companyId,
    message: 'Demo environment created successfully',
  };
});
