import { z } from 'zod';
import { auth } from '~~/server/auth';
import {
  administrativeUnits,
  companies,
  userCompanies,
} from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const createCompanySchema = z.object({
  name: z.string().min(3),
  rif: z.string().optional(),
  logo: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // TODO: Add strict RBAC check if only system admins can create companies
  // For now, any authenticated user can create a company and becomes its admin

  const body = await readValidatedBody(event, (b) =>
    createCompanySchema.parse(b),
  );

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Create Company
      const [newCompany] = await tx
        .insert(companies)
        .values({
          id: crypto.randomUUID(),
          name: body.name,
          rif: body.rif,
          logo: body.logo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 2. Associate User as Admin
      await tx.insert(userCompanies).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        companyId: newCompany.id,
        role: 'admin',
        createdAt: new Date(),
      });

      // 3. Create Default Administrative Unit (Optional but helpful)
      await tx.insert(administrativeUnits).values({
        id: crypto.randomUUID(),
        name: 'General',
        companyId: newCompany.id,
        description: 'Unidad administrativa por defecto',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newCompany;
    });

    return result;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Duplicate RIF or Name',
      });
    }
    throw error;
  }
});
