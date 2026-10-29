import { openDatabase, migrate } from '../src/lib/server/db.ts';
import { seed } from '../src/lib/server/seed.ts';
const db = openDatabase();
try {
  await migrate(db);
  if (process.argv[2] === 'seed') await seed(db);
  console.log(
    process.argv[2] === 'seed'
      ? 'Database migrated and seeded (existing data preserved).'
      : 'Migrations applied.',
  );
} catch (error) {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : 'INITIALIZATION_ERROR';
  console.error(
    `Database initialization failed (${code}). Check the DATABASE_URL connection, access permissions, and migration compatibility.`,
  );
  process.exitCode = 1;
} finally {
  await db.close();
}
