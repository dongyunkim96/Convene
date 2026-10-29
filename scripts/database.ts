import { openDatabase, migrate } from '../src/lib/server/db.ts';
import { seed } from '../src/lib/server/seed.ts';
const db = openDatabase();
migrate(db);
if (process.argv[2] === 'seed') seed(db);
db.close();
console.log(
  process.argv[2] === 'seed'
    ? 'Database migrated and seeded (existing data preserved).'
    : 'Migrations applied.',
);
