import { z } from 'zod';
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
  // Auth provided by middleware

  const body = await readValidatedBody(event, (b) =>
    createLocationSchema.parse(b),
  );

  const [location] = await db
    .insert(locations)
    .values({
      id: crypto.randomUUID(),
      name: body.name,
      type: body.type as any,
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
});
