import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Worker } from 'node:worker_threads';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, migrate, one, postgresQuery, type DB } from '../src/lib/server/db.ts';
import { seed } from '../src/lib/server/seed.ts';
import { addUser, getUser, passwordHash, passwordMatches } from '../src/lib/server/auth.ts';
import { book, cancel, session, setCapacity, checkin, csvCell } from '../src/lib/server/domain.ts';
import { overlaps } from '../src/lib/event.ts';

describe('transactional conference domain', () => {
  let db: DB, alex: string, casey: string, organizer: string, visitor: string;
  beforeEach(async () => {
    db = openDatabase(':memory:');
    await migrate(db);
    await seed(db);
    alex = (await one<{ id: string }>(db, "SELECT id FROM users WHERE email='alex@convene.demo'"))!
      .id;
    casey = (await one<{ id: string }>(
      db,
      "SELECT id FROM users WHERE email='casey@convene.demo'",
    ))!.id;
    organizer = (await one<{ id: string }>(db, "SELECT id FROM users WHERE role='organizer'"))!.id;
    visitor = await addUser(db, {
      name: 'Test Attendee',
      email: 'test@example.com',
      password: 'TestPassword2027!',
      category: 'general',
    });
  });
  afterEach(() => db.close());
  it('rejects overlapping reservations with a useful link', async () => {
    await expect(book(db, alex, 2)).rejects.toMatchObject({
      conflictSlug: 'building-software-that-lasts',
    });
  });
  it('permits back-to-back intervals', async () => {
    expect(overlaps({ start: '09:00', end: '11:00' }, { start: '11:00', end: '12:00' })).toBe(
      false,
    );
    expect(overlaps({ start: '09:00', end: '11:15' }, { start: '11:00', end: '12:00' })).toBe(true);
    await db
      .prepare('UPDATE sessions SET start=?,"end"=? WHERE id=2')
      .run((await session(db, 1))!.end, '2027-05-20T15:00:00.000Z');
    await expect(book(db, alex, 2)).resolves.toHaveProperty('message');
  });
  it('makes repeated reservations idempotent', async () => {
    await book(db, visitor, 1);
    await book(db, visitor, 1);
    expect(
      (await one<{ n: number }>(
        db,
        'SELECT COUNT(*) n FROM reservations WHERE user_id=? AND session_id=1',
        visitor,
      ))!.n,
    ).toBe(1);
  });
  it('enforces VIP access including for speakers', async () => {
    await expect(book(db, visitor, 12)).rejects.toThrow('VIP access required');
    const vip = (await one<{ id: string }>(
      db,
      "SELECT id FROM users WHERE email='vip@convene.demo'",
    ))!.id;
    await expect(book(db, vip, 12)).resolves.toHaveProperty('message');
    const speaker = (await one<{ id: string }>(
      db,
      "SELECT id FROM users WHERE email='speaker@convene.demo'",
    ))!.id;
    await expect(book(db, speaker, 12)).rejects.toThrow('VIP access required');
  });
  it('cancels only the authenticated attendee seat', async () => {
    await book(db, visitor, 1);
    const before = (await session(db, 1))!.confirmed;
    await cancel(db, visitor, 1);
    expect((await session(db, 1))!.confirmed).toBe(before - 1);
    expect((await session(db, 1, alex))!.state).toBe('reserved');
  });
  it('maintains FIFO ordering and prevents duplicate waitlists', async () => {
    await book(db, alex, 6);
    await book(db, visitor, 6);
    await book(db, alex, 6);
    expect((await session(db, 6, alex))!.position).toBe(1);
    expect((await session(db, 6, visitor))!.position).toBe(2);
    await cancel(db, casey, 6);
    expect((await session(db, 6, alex))!.state).toBe('reserved');
    expect((await session(db, 6, visitor))!.position).toBe(1);
  });
  it('skips conflicting candidates without deleting their entries', async () => {
    await book(db, alex, 6);
    await book(db, visitor, 6);
    await book(db, alex, 5);
    await cancel(db, casey, 6);
    expect((await session(db, 6, alex))!.state).toBe('waitlisted');
    expect((await session(db, 6, visitor))!.state).toBe('reserved');
    expect((await session(db, 6))!.confirmed).toBe(1);
  });
  it('does not let a waitlist block a reservation', async () => {
    await book(db, visitor, 6);
    await expect(book(db, visitor, 5)).resolves.toHaveProperty('message');
  });
  it('promotes after capacity increases and rejects unsafe decreases', async () => {
    await book(db, visitor, 6);
    const admin = (await getUser(db, organizer))!;
    await setCapacity(db, admin, 6, 2);
    expect((await session(db, 6, visitor))!.state).toBe('reserved');
    await expect(setCapacity(db, admin, 6, 1)).rejects.toThrow('at least 2');
    expect((await session(db, 6))!.capacity).toBe(2);
  });
  it('rejects unauthorized capacity and check-in mutations', async () => {
    const attendee = (await getUser(db, alex))!;
    await expect(setCapacity(db, attendee, 1, 100)).rejects.toThrow('Organizer access required');
    await expect(checkin(db, attendee, 'x')).rejects.toThrow('Organizer access required');
  });
  it('validates pass tokens and makes check-in idempotent', async () => {
    const token = (await one<{ token: string }>(
      db,
      'SELECT token FROM passes WHERE user_id=?',
      alex,
    ))!.token;
    const admin = (await getUser(db, organizer))!;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    await expect(checkin(db, admin, 'invalid')).rejects.toThrow('Invalid pass');
    expect((await checkin(db, admin, token)).message).toContain('Valid pass');
    expect((await checkin(db, admin, token)).message).toBe('Already checked in');
    expect((await one<{ n: number }>(db, 'SELECT COUNT(*) n FROM checkins'))!.n).toBe(1);
  });
  it('escapes spreadsheet formulas and quotes', () => {
    expect(csvCell('=SUM(1,2)')).toBe('"\'=SUM(1,2)"');
    expect(csvCell('  +1')).toBe('"\'  +1"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
  it('hashes passwords with independent salts', () => {
    const a = passwordHash('secret'),
      b = passwordHash('secret');
    expect(a).not.toBe(b);
    expect(passwordMatches('secret', a)).toBe(true);
    expect(passwordMatches('other', a)).toBe(false);
  });
  it('serializes simultaneous application reservations for the final seat', async () => {
    await db.prepare('UPDATE sessions SET capacity=1 WHERE id=10').run();
    await Promise.all([book(db, alex, 10), book(db, visitor, 10)]);
    expect((await session(db, 10))!.confirmed).toBe(1);
    expect((await session(db, 10))!.waiting).toBe(1);
  });
  it('seeds repeatedly without losing attendee activity', async () => {
    await book(db, visitor, 1);
    await seed(db);
    expect((await session(db, 1, visitor))!.state).toBe('reserved');
    expect((await one<{ n: number }>(db, 'SELECT COUNT(*) n FROM users'))!.n).toBe(6);
  });
  it('binds PostgreSQL placeholders without changing quoted question marks', () => {
    expect(postgresQuery('SELECT \'?\', "?", name FROM users WHERE id=? AND email=?')).toBe(
      'SELECT \'?\', "?", name FROM users WHERE id=$1 AND email=$2',
    );
  });
  it('never overbooks through independent SQLite writer connections', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'convene-test-')),
      path = join(directory, 'race.sqlite');
    const file = openDatabase(path);
    await migrate(file);
    await seed(file);
    const ids: string[] = [];
    for (let i = 1; i <= 4; i++)
      ids.push(
        await addUser(file, {
          name: 'Racer ' + i,
          email: 'racer' + i + '@test.com',
          password: 'TestPassword2027!',
          category: 'general',
        }),
      );
    await file.prepare('UPDATE sessions SET capacity=1 WHERE id=10').run();
    await file.close();
    try {
      const attempts = ids.map(
        (id) =>
          new Promise<boolean>((resolve, reject) => {
            const worker = new Worker(
              "const {parentPort,workerData}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(workerData.path);db.exec('PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON;');try{db.exec('BEGIN IMMEDIATE');db.prepare('INSERT INTO reservations(user_id,session_id) VALUES(?,10)').run(workerData.id);db.exec('COMMIT');parentPort.postMessage(true);}catch{try{db.exec('ROLLBACK');}catch{}parentPort.postMessage(false);}finally{db.close();}",
              { eval: true, workerData: { path, id } },
            );
            worker.once('message', resolve);
            worker.once('error', reject);
          }),
      );
      expect((await Promise.all(attempts)).filter(Boolean)).toHaveLength(1);
      const verify = openDatabase(path);
      expect((await session(verify, 10))!.confirmed).toBe(1);
      await verify.close();
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
