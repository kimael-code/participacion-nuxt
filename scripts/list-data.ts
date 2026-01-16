import { companies, users } from '../server/database/schema';
import { db } from '../server/utils/db';

async function main() {
  const allUsers = await db.select().from(users);
  const allCompanies = await db.select().from(companies);

  console.log('--- USERS ---');
  allUsers.forEach((u) => console.log(`${u.id}: ${u.name} (${u.email})`));

  console.log('\n--- COMPANIES ---');
  allCompanies.forEach((c) => console.log(`${c.id}: ${c.name} (${c.rif})`));
}

main().catch(console.error);
