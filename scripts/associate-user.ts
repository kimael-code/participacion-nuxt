import { userCompanies } from '../server/database/schema';
import { db } from '../server/utils/db';

async function main() {
  const userId = 'DaVgIZLc2wJiBNugs7DwEq7uLJF3Z5Zi';
  const companyId = '358f7890-ac88-4a57-8873-4774dcf66f3b';

  console.log(`Associating user ${userId} to company ${companyId}...`);

  try {
    const result = await db
      .insert(userCompanies)
      .values({
        id: crypto.randomUUID(),
        userId: userId,
        companyId: companyId,
        role: 'admin',
        createdAt: new Date(),
      })
      .returning();

    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
