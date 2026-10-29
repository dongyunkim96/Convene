import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { database, one, transaction, type DB } from './db.ts';
import type { User, Category } from '../types.ts';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
export function passwordMatches(password: string, stored: string) {
  const [salt, key] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
const userQuery = `SELECT u.id,u.email,u.name,u.role,p.category,p.company,p.title,p.interests,p.preferences,p.reference FROM users u JOIN profiles p ON p.user_id=u.id`;
export function getUser(db: DB, id: string) {
  return one<User>(db, userQuery + ' WHERE u.id=?', id);
}
export function currentUser(token?: string) {
  if (!token) return null;
  const db = database();
  const session = one<{ user_id: string }>(
    db,
    'SELECT user_id FROM auth_sessions WHERE hash=? AND expires>?',
    hash(token),
    Date.now(),
  );
  return session ? (getUser(db, session.user_id) ?? null) : null;
}
export function createAuth(cookies: Cookies, userId: string, secure: boolean) {
  const token = randomBytes(32).toString('hex');
  database()
    .prepare('INSERT INTO auth_sessions VALUES(?,?,?)')
    .run(hash(token), userId, Date.now() + 7 * 86400000);
  cookies.set('convene_session', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 7 * 86400,
  });
}
export function addUser(
  db: DB,
  input: {
    name: string;
    email: string;
    password: string;
    category: Category;
    company?: string;
    title?: string;
    interests?: string;
    preferences?: string;
    role?: string;
  },
) {
  return transaction(db, () => {
    const id = randomBytes(16).toString('hex');
    const reference = 'CV27-' + randomBytes(4).toString('hex').toUpperCase();
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(
      id,
      input.email.toLowerCase(),
      input.name,
      passwordHash(input.password),
      input.role ?? 'attendee',
    );
    db.prepare('INSERT INTO profiles VALUES(?,?,?,?,?,?,1,?)').run(
      id,
      input.category,
      input.company ?? '',
      input.title ?? '',
      input.interests ?? '',
      input.preferences ?? '',
      reference,
    );
    db.prepare('INSERT INTO passes VALUES(?,?)').run(id, randomBytes(32).toString('hex'));
    return id;
  });
}
