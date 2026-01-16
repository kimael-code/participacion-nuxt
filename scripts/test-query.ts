import { eq } from 'drizzle-orm';
import { companies, userCompanies } from '../server/database/schema';
import { db } from '../server/utils/db';

async function main() {
  const userId = 'DaVgIZLc2wJiBNugs7DwEq7uLJF3Z5Zi';

  console.log(`Fetching companies for user ${userId}...`);

  try {
    const userCompaniesData = await db
      .select({
        id: companies.id,
        name: companies.name,
        rif: companies.rif,
      })
      .from(companies)
      .innerJoin(userCompanies, eq(companies.id, userCompanies.companyId))
      .where(eq(userCompanies.userId, userId));

    console.log('Result:', userCompaniesData);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
