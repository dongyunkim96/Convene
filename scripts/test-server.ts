import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { openDatabase, migrate } from '../src/lib/server/db.ts';
import { seed } from '../src/lib/server/seed.ts';
delete process.env.DATABASE_URL;
process.env.DATABASE_PATH = './data/e2e-' + randomUUID() + '.sqlite';
const db = openDatabase();
await migrate(db);
await seed(db);
await db.close();
const child = spawn(process.execPath, ['build/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, HOST: '127.0.0.1', PORT: '3000' },
});
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
child.on('exit', (code) => process.exit(code ?? 0));
