import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '~~/server/auth';
import { locations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const updateLocationSchema = z.object({
  name: z.string().min(3).optional(),
  type: z
    .enum([
      'voting_center',
      'medical_facility',
      'conference_room',
      'auditorium',
      'training_center',
      'office',
      'other',
    ])
    .optional(),
  address: z.string().optional(),
  parishId: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  capacity: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID required' });
  }

  const body = await readValidatedBody(event, (b) =>
    updateLocationSchema.parse(b),
  );

  const [updated] = await db
    .update(locations)
    .set({
      ...body,
      // explicit cast for type if present
      type: body.type ? (body.type as any) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(locations.id, id))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Location not found' });
  }

  return updated;
});
