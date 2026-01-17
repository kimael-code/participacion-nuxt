import { z } from 'zod';
import { employees } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const createEmployeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  cedula: z.string().min(6),
  administrativeUnitId: z.string().optional(),
  locationId: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // Auth and companyId provided by middleware
  const { companyId } = event.context.auth!;

  const body = await readValidatedBody(event, (b) =>
    createEmployeeSchema.parse(b),
  );

  const [employee] = await db
    .insert(employees)
    .values({
      id: crypto.randomUUID(),
      firstName: body.firstName,
      lastName: body.lastName,
      cedula: body.cedula,
      administrativeUnitId: body.administrativeUnitId,
      locationId: body.locationId,
      companyId: companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return employee;
});
