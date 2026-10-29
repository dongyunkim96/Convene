import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pg, { type PoolClient } from 'pg';
type Row = Record<string, unknown>;
type Context = {
  db: DB;
  client?: PoolClient;
};
const context = new AsyncLocalStorage<Context>();
// Query text is trusted application SQL; values are always bound separately.
export function postgresQuery(sql: string) {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:\"\"|[^"])*"|\?/g, (token) =>
    token === '?' ? '$' + ++index : token,
  );
}
export class DB {
  readonly dialect: 'sqlite' | 'postgres';
  private sqlite?: DatabaseSync;
  private pool?: pg.Pool;
  private tail: Promise<unknown> = Promise.resolve();
  constructor(path: string) {
    this.dialect = /^postgres(?:ql)?:\/\//.test(path) ? 'postgres' : 'sqlite';
    if (this.dialect === 'postgres') {
      this.pool = new pg.Pool({
        connectionString: path,
        max: 4,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 15000,
      });
      this.pool.on('error', () => console.error('PostgreSQL idle connection failed.'));
    } else {
      if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
      this.sqlite = new DatabaseSync(path);
      this.sqlite.exec(
        'PRAGMA foreign_keys=ON; PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL;',
      );
    }
  }
  private async exclusive<T>(work: () => Promise<T> | T): Promise<T> {
    const next = this.tail.then(work, work);
    this.tail = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
  private async execute(sql: string, values: SQLInputValue[] = []) {
    if (this.pool) {
      const scoped = context.getStore();
      const client = scoped?.db === this ? scoped.client : undefined;
      const result = await (client ?? this.pool).query(postgresQuery(sql), values);
      const rows = (result.rows ?? []).map((row: Row) => {
        for (const key of ['confirmed', 'waiting', 'position', 'n']) {
          if (typeof row[key] === 'string' && /^\d+$/.test(row[key] as string))
            row[key] = Number(row[key]);
        }
        return row;
      });
      return { rows, changes: result.rowCount ?? 0 };
    }
    const work = () => {
      const statement = this.sqlite!.prepare(sql);
      if (statement.columns().length)
        return { rows: statement.all(...values) as Row[], changes: 0 };
      return { rows: [] as Row[], changes: Number(statement.run(...values).changes) };
    };
    return context.getStore()?.db === this ? work() : this.exclusive(work);
  }
  prepare(sql: string) {
    return {
      run: async (...values: SQLInputValue[]) => ({
        changes: (await this.execute(sql, values)).changes,
      }),
      get: async (...values: SQLInputValue[]) => (await this.execute(sql, values)).rows[0],
      all: async (...values: SQLInputValue[]) => (await this.execute(sql, values)).rows,
    };
  }
  async exec(sql: string) {
    if (this.pool) {
      const scoped = context.getStore();
      await (scoped?.db === this && scoped.client ? scoped.client : this.pool).query(sql);
    } else if (context.getStore()?.db === this) this.sqlite!.exec(sql);
    else await this.exclusive(() => this.sqlite!.exec(sql));
  }
  async transaction<T>(work: () => Promise<T> | T): Promise<T> {
    if (context.getStore()?.db === this) return work();
    if (!this.pool)
      return this.exclusive(() =>
        context.run({ db: this }, async () => {
          this.sqlite!.exec('BEGIN IMMEDIATE');
          try {
            const result = await work();
            this.sqlite!.exec('COMMIT');
            return result;
          } catch (error) {
            this.sqlite!.exec('ROLLBACK');
            throw error;
          }
        }),
      );
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // One cross-instance writer lock protects this small conference's booking invariants.
      await client.query('SELECT pg_advisory_xact_lock(119015, 2027)');
      const result = await context.run({ db: this, client }, work);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async close() {
    if (this.pool) await this.pool.end();
    else {
      await this.tail;
      this.sqlite!.close();
    }
  }
}
export function openDatabase(
  path = process.env.DATABASE_URL || process.env.DATABASE_PATH || './data/convene.sqlite',
) {
  return new DB(path);
}
export async function migrate(db: DB) {
  const file =
    db.dialect === 'postgres' ? 'migrations/001_postgres.sql' : 'migrations/001_initial.sql';
  await transaction(db, () => db.exec(readFileSync(resolve(file), 'utf8')));
}
export async function all<T>(db: DB, sql: string, ...params: SQLInputValue[]): Promise<T[]> {
  return (await db.prepare(sql).all(...params)) as T[];
}
export async function one<T>(
  db: DB,
  sql: string,
  ...params: SQLInputValue[]
): Promise<T | undefined> {
  return (await db.prepare(sql).get(...params)) as T | undefined;
}
export function transaction<T>(db: DB, work: () => Promise<T> | T): Promise<T> {
  return db.transaction(work);
}
let connection: DB | undefined;
export function database() {
  if (process.env.VERCEL === '1' && !process.env.DATABASE_URL)
    throw new Error('DATABASE_URL must be connected before deploying CONVENE.');
  return (connection ??= openDatabase());
}
