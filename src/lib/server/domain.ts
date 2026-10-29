import { all, one, transaction, type DB } from './db.ts';
import { getUser } from './auth.ts';
import type { Session, User } from '../types.ts';
export class DomainError extends Error {
  constructor(
    message: string,
    public conflictSlug?: string,
  ) {
    super(message);
  }
}
const base = `SELECT s.*,sp.name speaker,sp.id "speakerId",sp.title "speakerTitle",sp.initials,sp.color,
 (SELECT COUNT(*) FROM reservations r WHERE r.session_id=s.id) confirmed,
 (SELECT COUNT(*) FROM waitlist w WHERE w.session_id=s.id) waiting,
 CASE WHEN EXISTS(SELECT 1 FROM reservations WHERE session_id=s.id AND user_id=?) THEN 'reserved' WHEN EXISTS(SELECT 1 FROM waitlist WHERE session_id=s.id AND user_id=?) THEN 'waitlisted' ELSE NULL END state,
 (SELECT COUNT(*) FROM waitlist w WHERE w.session_id=s.id AND w.id<=(SELECT id FROM waitlist WHERE session_id=s.id AND user_id=?)) position
 FROM sessions s JOIN session_speakers ss ON ss.session_id=s.id JOIN speakers sp ON sp.id=ss.speaker_id`;
export async function sessions(db: DB, userId = '') {
  return await all<Session>(db, base + ' ORDER BY s.start,s.id', userId, userId, userId);
}
export async function session(db: DB, id: number, userId = '') {
  return await one<Session>(db, base + ' WHERE s.id=?', userId, userId, userId, id);
}
export async function conflict(db: DB, userId: string, s: Session) {
  return await one<{
    title: string;
    slug: string;
  }>(
    db,
    `SELECT s.title,s.slug FROM sessions s JOIN reservations r ON r.session_id=s.id WHERE r.user_id=? AND s.id<>? AND s.start<? AND ?<s."end" LIMIT 1`,
    userId,
    s.id,
    s.end,
    s.start,
  );
}
function eligible(user: User, s: Session) {
  return s.access === 'all' || user.category === 'vip';
}
async function record(db: DB, userId: string, id: number, kind: string) {
  await db
    .prepare('INSERT INTO transitions(user_id,session_id,kind) VALUES(?,?,?)')
    .run(userId, id, kind);
}
export async function promote(db: DB, id: number) {
  const s = await session(db, id);
  if (!s) return;
  let available = s.capacity - s.confirmed;
  for (const w of await all<{
    id: number;
    user_id: string;
  }>(db, 'SELECT * FROM waitlist WHERE session_id=? ORDER BY id', id)) {
    if (available <= 0) break;
    const user = await getUser(db, w.user_id);
    if (!user || !eligible(user, s) || (await conflict(db, user.id, s))) continue;
    await db.prepare('DELETE FROM waitlist WHERE id=?').run(w.id);
    await db.prepare('INSERT INTO reservations(user_id,session_id) VALUES(?,?)').run(user.id, id);
    await record(db, user.id, id, 'Promoted from waitlist');
    available--;
  }
}
export async function book(db: DB, userId: string, id: number) {
  return await transaction(db, async () => {
    const user = await getUser(db, userId);
    const s = await session(db, id, userId);
    if (!user || !s)
      throw new DomainError('This session is unavailable. Return to the session catalog.');
    if (!eligible(user, s))
      throw new DomainError(
        'VIP access required. This session is reserved for invited VIP attendees.',
      );
    if (s.state === 'reserved') return { message: 'Your seat is already reserved.' };
    if (s.confirmed >= s.capacity) {
      if (s.state === 'waitlisted') return { message: 'You are already on this waitlist.' };
      await db.prepare('INSERT INTO waitlist(user_id,session_id) VALUES(?,?)').run(userId, id);
      await record(db, userId, id, 'Joined waitlist');
      return { message: 'You joined the waitlist. This is not a confirmed seat.' };
    }
    const c = await conflict(db, userId, s);
    if (c)
      throw new DomainError(
        `This overlaps with “${c.title}”. Review that reservation before reserving this session.`,
        c.slug,
      );
    await db.prepare('DELETE FROM waitlist WHERE user_id=? AND session_id=?').run(userId, id);
    await db.prepare('INSERT INTO reservations(user_id,session_id) VALUES(?,?)').run(userId, id);
    await record(db, userId, id, 'Reserved');
    return { message: 'Seat reserved. Your schedule is up to date.' };
  });
}
export async function cancel(db: DB, userId: string, id: number) {
  return await transaction(db, async () => {
    const reserved = (
      await db.prepare('DELETE FROM reservations WHERE user_id=? AND session_id=?').run(userId, id)
    ).changes;
    const waiting = (
      await db.prepare('DELETE FROM waitlist WHERE user_id=? AND session_id=?').run(userId, id)
    ).changes;
    if (reserved || waiting)
      await record(db, userId, id, reserved ? 'Cancelled reservation' : 'Left waitlist');
    if (reserved) {
      await promote(db, id);
      /* Removing a conflict can also make another waitlist eligible. */ for (const w of await all<{
        session_id: number;
      }>(db, 'SELECT session_id FROM waitlist WHERE user_id=?', userId))
        await promote(db, w.session_id);
    }
    return {
      message: reserved
        ? 'Reservation cancelled. Your seat may be offered to someone on the waitlist.'
        : 'You are no longer on this waitlist.',
    };
  });
}
export async function setCapacity(db: DB, organizer: User, id: number, capacity: number) {
  if (organizer.role !== 'organizer') throw new DomainError('Organizer access required.');
  return await transaction(db, async () => {
    const s = await session(db, id);
    if (!s) throw new DomainError('Session not found.');
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > 10000)
      throw new DomainError('Enter a capacity between 0 and 10,000.');
    if (capacity < s.confirmed)
      throw new DomainError(
        `Capacity must be at least ${s.confirmed}, the current confirmed count.`,
      );
    await db.prepare('UPDATE sessions SET capacity=? WHERE id=?').run(capacity, id);
    await promote(db, id);
    return { message: 'Capacity updated. Eligible waitlisted attendees have been promoted.' };
  });
}
export async function checkin(db: DB, organizer: User, token: string) {
  if (organizer.role !== 'organizer') throw new DomainError('Organizer access required.');
  return await transaction(db, async () => {
    const p = await one<{
      user_id: string;
    }>(db, 'SELECT user_id FROM passes WHERE token=?', token);
    if (!p) throw new DomainError('Invalid pass. Check the token and try again.');
    const existing = await one<{
      checked_at: string;
    }>(db, 'SELECT checked_at FROM checkins WHERE user_id=?', p.user_id);
    const user = (await getUser(db, p.user_id))!;
    if (existing)
      return { message: 'Already checked in', name: user.name, reference: user.reference };
    await db
      .prepare('INSERT INTO checkins(user_id,organizer_id) VALUES(?,?)')
      .run(user.id, organizer.id);
    return { message: 'Valid pass — checked in', name: user.name, reference: user.reference };
  });
}
export function csvCell(value: unknown) {
  const s = String(value ?? '');
  return '"' + (/^[\s]*[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
}
