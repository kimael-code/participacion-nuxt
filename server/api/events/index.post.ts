import { z } from 'zod';
import { events } from '../../database/schema';
import { db } from '../../utils/db';

const createEventSchema = z.object({
  name: z.string().min(3),
  date: z.coerce.date(),
  type: z.enum(['voting', 'medical', 'training', 'other']).default('voting'),
  active: z.boolean().default(false),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Auth and companyId provided by middleware
    const { companyId } = event.context.auth!;

    const body = await readValidatedBody(event, (b) =>
      createEventSchema.parse(b),
    );

    console.log(
      `[Events] Creating new event for company ${companyId}:`,
      body.name,
    );

    const [newEvent] = await db
      .insert(events)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        eventDate: new Date(body.date),
        type: body.type,
        isActive: body.active,
        description: body.description,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`[Events] Event created successfully: ${newEvent.id}`);

    return {
      ...newEvent,
      date: newEvent.eventDate,
      active: newEvent.isActive,
    };
  } catch (error: any) {
    console.error('[Events] Failed to create event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error interno al crear el evento',
    });
  }
});
