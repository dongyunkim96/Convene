import { spawnSync } from 'node:child_process';
if (!/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL || '')) {
  console.error('Connect the Neon DATABASE_URL to this Vercel environment before deploying.');
  process.exit(1);
}
// Migrations and the demo seed are idempotent and protected by the same database writer lock.
for (const args of [
  ['--import', 'tsx', 'scripts/database.ts', 'seed'],
  ['node_modules/vite/bin/vite.js', 'build', '--mode', 'vercel'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
}
