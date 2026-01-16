import { z } from 'zod';
import { auth } from '~~/server/auth';
import { locations } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

const createLocationSchema = z.object({
  name: z.string().min(3),
  type: z.enum([
    'voting_center',
    'medical_facility',
    'conference_room',
    'auditorium',
    'training_center',
    'office',
    'other',
  ]),
  address: z.string(),
  parishId: z.string(),
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

  const body = await readValidatedBody(event, (b) =>
    createLocationSchema.parse(b),
  );

  try {
    const [location] = await db
      .insert(locations)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        type: body.type as any, // Cast to enum
        address: body.address,
        parishId: body.parishId,
        latitude: body.latitude,
        longitude: body.longitude,
        capacity: body.capacity,
        notes: body.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return location;
  } catch (error: any) {
    throw error;
  }
});
