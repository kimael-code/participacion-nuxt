import { and, count, desc, eq, like, or } from 'drizzle-orm';
import { events } from '~~/server/database/schema';
import { db } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const { companyId } = event.context.auth!;
  const query = getQuery(event);
  const q = String(query.q || '').trim();
  const activeOnly = query.activeOnly === 'true';

  const conditions = [eq(events.companyId, companyId)];

  if (q) {
    conditions.push(
      or(like(events.name, `%${q}%`), like(events.description, `%${q}%`)),
    );
  }

  if (activeOnly) {
    conditions.push(eq(events.isActive, true));
  }

  // Check if pagination is requested
  const isPaginated = query.page !== undefined || query.limit !== undefined;

  // Base query builder
  const buildQuery = () =>
    db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.eventDate));

  // Legacy mode: Return simple array if no pagination requested
  if (!isPaginated && !q) {
    const data = await buildQuery();
    return data.map((e) => ({
      ...e,
      date: e.eventDate,
      active: e.isActive,
    }));
  }

  // Pagination Logic
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(events)
    .where(and(...conditions));

  const total = Number(totalResult?.count || 0);

  // Get paginated data
  const data = await buildQuery().limit(limit).offset(offset);

  return {
    data: data.map((e) => ({
      ...e,
      date: e.eventDate,
      active: e.isActive,
    })),
    total,
    page,
    limit,
  };
});
