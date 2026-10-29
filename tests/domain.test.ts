import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Worker } from 'node:worker_threads';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, migrate, one, type DB } from '../src/lib/server/db.ts';
import { seed } from '../src/lib/server/seed.ts';
import { addUser, getUser, passwordHash, passwordMatches } from '../src/lib/server/auth.ts';
import { book, cancel, session, setCapacity, checkin, csvCell } from '../src/lib/server/domain.ts';
import { overlaps } from '../src/lib/event.ts';
describe('transactional conference domain', () => {
  let db: DB;
  let alex: string;
  let casey: string;
  let organizer: string;
  let visitor: string;
  beforeEach(() => {
    db = openDatabase(':memory:');
    migrate(db);
    seed(db);
    alex = one<{ id: string }>(db, "SELECT id FROM users WHERE email='alex@convene.demo'")!.id;
    casey = one<{ id: string }>(db, "SELECT id FROM users WHERE email='casey@convene.demo'")!.id;
    organizer = one<{ id: string }>(db, "SELECT id FROM users WHERE role='organizer'")!.id;
    visitor = addUser(db, {
      name: 'Test Attendee',
      email: 'test@example.com',
      password: 'TestPassword2027!',
      category: 'general',
    });
  });
  afterEach(() => db.close());
  it('rejects overlapping confirmed reservations with a useful link', () => {
    expect(() => book(db, alex, 2)).toThrow('overlaps');
    try {
      book(db, alex, 2);
    } catch (e) {
      expect(e).toHaveProperty('conflictSlug', 'building-software-that-lasts');
    }
  });
  it('permits half-open back-to-back intervals', () => {
    expect(overlaps({ start: '09:00', end: '11:00' }, { start: '11:00', end: '12:00' })).toBe(
      false,
    );
    expect(overlaps({ start: '09:00', end: '11:15' }, { start: '11:00', end: '12:00' })).toBe(true);
    db.prepare('UPDATE sessions SET start=?,end=? WHERE id=2').run(
      session(db, 1)!.end,
      '2027-05-20T15:00:00.000Z',
    );
    expect(() => book(db, alex, 2)).not.toThrow();
  });
  it('treats repeated reservations idempotently', () => {
    book(db, visitor, 1);
    book(db, visitor, 1);
    expect(
      one<{ n: number }>(
        db,
        'SELECT COUNT(*) n FROM reservations WHERE user_id=? AND session_id=1',
        visitor,
      )?.n,
    ).toBe(1);
  });
  it('enforces VIP access and does not treat speaker as VIP', () => {
    expect(() => book(db, visitor, 12)).toThrow('VIP access required');
    const vip = one<{ id: string }>(db, "SELECT id FROM users WHERE email='vip@convene.demo'")!.id;
    expect(() => book(db, vip, 12)).not.toThrow();
    const speaker = one<{ id: string }>(
      db,
      "SELECT id FROM users WHERE email='speaker@convene.demo'",
    )!.id;
    expect(() => book(db, speaker, 12)).toThrow('VIP access required');
  });
  it('cancels only the authenticated attendee reservation and updates capacity', () => {
    book(db, visitor, 1);
    const before = session(db, 1)!.confirmed;
    cancel(db, visitor, 1);
    expect(session(db, 1)!.confirmed).toBe(before - 1);
    expect(session(db, 1, alex)!.state).toBe('reserved');
  });
  it('keeps FIFO waitlist ordering, with no duplicate waitlist entries', () => {
    book(db, alex, 6);
    book(db, visitor, 6);
    book(db, alex, 6);
    expect(session(db, 6, alex)!.position).toBe(1);
    expect(session(db, 6, visitor)!.position).toBe(2);
    cancel(db, casey, 6);
    expect(session(db, 6, alex)!.state).toBe('reserved');
    expect(session(db, 6, visitor)!.position).toBe(1);
  });
  it('skips a conflicting candidate without removing their waitlist entry', () => {
    book(db, alex, 6);
    book(db, visitor, 6);
    book(db, alex, 5);
    cancel(db, casey, 6);
    expect(session(db, 6, alex)!.state).toBe('waitlisted');
    expect(session(db, 6, visitor)!.state).toBe('reserved');
    expect(session(db, 6)!.confirmed).toBe(1);
  });
  it('waitlist entries never block a confirmed reservation', () => {
    book(db, visitor, 6);
    expect(() => book(db, visitor, 5)).not.toThrow();
  });
  it('promotes after a capacity increase and rejects reductions below confirmed count', () => {
    book(db, visitor, 6);
    setCapacity(db, getUser(db, organizer)!, 6, 2);
    expect(session(db, 6, visitor)!.state).toBe('reserved');
    expect(() => setCapacity(db, getUser(db, organizer)!, 6, 1)).toThrow('at least 2');
    expect(session(db, 6)!.capacity).toBe(2);
  });
  it('rejects unauthorized capacity and check-in mutations', () => {
    expect(() => setCapacity(db, getUser(db, alex)!, 1, 100)).toThrow('Organizer access required');
    expect(() => checkin(db, getUser(db, alex)!, 'x')).toThrow('Organizer access required');
  });
  it('validates an opaque token and makes duplicate check-in idempotent', () => {
    const token = one<{ token: string }>(
      db,
      'SELECT token FROM passes WHERE user_id=?',
      alex,
    )!.token;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(() => checkin(db, getUser(db, organizer)!, 'invalid')).toThrow('Invalid pass');
    expect(checkin(db, getUser(db, organizer)!, token).message).toContain('Valid pass');
    expect(checkin(db, getUser(db, organizer)!, token).message).toBe('Already checked in');
    expect(one<{ n: number }>(db, 'SELECT COUNT(*) n FROM checkins')!.n).toBe(1);
  });
  it('escapes spreadsheet formula prefixes and quoted values', () => {
    expect(csvCell('=SUM(1,2)')).toBe('"\'=SUM(1,2)"');
    expect(csvCell('  +1')).toBe('"\'  +1"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
  it('hashes passwords with independent salts', () => {
    const a = passwordHash('secret');
    const b = passwordHash('secret');
    expect(a).not.toBe(b);
    expect(passwordMatches('secret', a)).toBe(true);
    expect(passwordMatches('other', a)).toBe(false);
  });
  it('uses an independent SQLite connection in each concurrent writer and never overbooks', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'convene-test-'));
    const path = join(directory, 'race.sqlite');
    const file = openDatabase(path);
    migrate(file);
    seed(file);
    const ids = [1, 2, 3, 4].map((i) =>
      addUser(file, {
        name: 'Racer ' + i,
        email: `racer${i}@test.com`,
        password: 'TestPassword2027!',
        category: 'general',
      }),
    );
    file.prepare('UPDATE sessions SET capacity=1 WHERE id=10').run();
    file.close();
    try {
      const attempts = ids.map(
        (id) =>
          new Promise<boolean>((resolve, reject) => {
            const worker = new Worker(
              `const {parentPort,workerData}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(workerData.path);db.exec('PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON;');try{db.exec('BEGIN IMMEDIATE');db.prepare('INSERT INTO reservations(user_id,session_id) VALUES(?,10)').run(workerData.id);db.exec('COMMIT');parentPort.postMessage(true);}catch{try{db.exec('ROLLBACK');}catch{}parentPort.postMessage(false);}finally{db.close();}`,
              { eval: true, workerData: { path, id } },
            );
            worker.once('message', resolve);
            worker.once('error', reject);
          }),
      );
      expect((await Promise.all(attempts)).filter(Boolean)).toHaveLength(1);
      const verify = openDatabase(path);
      expect(session(verify, 10)!.confirmed).toBe(1);
      verify.close();
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
