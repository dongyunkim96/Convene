import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, afterEach, expect, it } from 'vitest';
const sql = readFileSync('migrations/001_postgres.sql', 'utf8');
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(sql);
  await db.exec(`
    INSERT INTO events VALUES(1,'Test','America/New_York','2027-05-20','2027-05-21');
    INSERT INTO users VALUES('a','a@test.example','A','hash','attendee'),('b','b@test.example','B','hash','attendee');
    INSERT INTO profiles VALUES('a','general','','','','',1,'A'),('b','vip','','','','',1,'B');
    INSERT INTO sessions VALUES
    (1,1,'one','One','Description','[]','Engineering','','2027-05-20T13:00:00.000Z','2027-05-20T14:00:00.000Z','Room','Talk','Foundational',1,'all'),
    (2,1,'two','Two','Description','[]','Engineering','','2027-05-20T14:00:00.000Z','2027-05-20T15:00:00.000Z','Room','Talk','Foundational',5,'all'),
    (3,1,'three','Three','Description','[]','Engineering','','2027-05-20T13:30:00.000Z','2027-05-20T14:30:00.000Z','Room','Talk','Foundational',5,'all'),
    (4,1,'vip','VIP','Description','[]','Engineering','','2027-05-21T13:00:00.000Z','2027-05-21T14:00:00.000Z','Room','Talk','Foundational',5,'vip');
  `);
}, 30000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec('BEGIN');
});
afterEach(async () => {
  await db.exec('ROLLBACK');
});
it('runs PostgreSQL migrations repeatedly without deleting existing records', async () => {
  await db.exec(sql);
  expect((await db.query<{ n: number }>('SELECT count(*)::integer n FROM users')).rows[0].n).toBe(
    2,
  );
});
it('rejects overbooking in the database itself', async () => {
  await db.query("INSERT INTO reservations(user_id,session_id) VALUES('a',1)");
  await expect(
    db.query("INSERT INTO reservations(user_id,session_id) VALUES('b',1)"),
  ).rejects.toThrow('Session is full');
});
it('allows adjacent times and rejects overlaps in the database itself', async () => {
  await db.query("INSERT INTO reservations(user_id,session_id) VALUES('a',1)");
  await db.query("INSERT INTO reservations(user_id,session_id) VALUES('a',2)");
  await expect(
    db.query("INSERT INTO reservations(user_id,session_id) VALUES('a',3)"),
  ).rejects.toThrow('overlaps');
});
it('enforces VIP eligibility in PostgreSQL', async () => {
  await db.query("INSERT INTO reservations(user_id,session_id) VALUES('b',4)");
  await expect(
    db.query("INSERT INTO reservations(user_id,session_id) VALUES('a',4)"),
  ).rejects.toThrow('VIP access required');
});
it('rejects capacity decreases below confirmed counts in PostgreSQL', async () => {
  await db.query("INSERT INTO reservations(user_id,session_id) VALUES('a',1)");
  await expect(db.query('UPDATE sessions SET capacity=0 WHERE id=1')).rejects.toThrow(
    'Capacity cannot be below',
  );
});
it('enforces case-insensitive email uniqueness in PostgreSQL', async () => {
  await expect(
    db.query("INSERT INTO users VALUES('c','A@test.example','C','hash','attendee')"),
  ).rejects.toThrow('duplicate key');
});
it('stores millisecond session expirations without integer overflow', async () => {
  await db.query('INSERT INTO auth_sessions VALUES($1,$2,$3)', [
    'token',
    'a',
    Date.now() + 604800000,
  ]);
  expect((await db.query('SELECT * FROM auth_sessions')).rows).toHaveLength(1);
});
