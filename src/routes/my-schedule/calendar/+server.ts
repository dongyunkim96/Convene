import type { RequestEvent } from '@sveltejs/kit';
import { requireUser } from '#lib/server/guards.ts';
import { database } from '#lib/server/db.ts';
import { sessions } from '#lib/server/domain.ts';
const escape = (s: string) =>
  s.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
const stamp = (s: string) => s.replaceAll(/[-:]/g, '').replace(/\.\d{3}/, '');
export const GET = ({ locals }: RequestEvent) => {
  const user = requireUser(locals);
  const rows = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CONVENE//Attendee Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const s of sessions(database(), user.id).filter((s) => s.state === 'reserved'))
    rows.push(
      'BEGIN:VEVENT',
      `UID:convene-2027-${s.id}@convene.demo`,
      'DTSTAMP:20261029T120000Z',
      `DTSTART:${stamp(s.start)}`,
      `DTEND:${stamp(s.end)}`,
      `SUMMARY:${escape(s.title)}`,
      `LOCATION:${escape(s.room)}`,
      `DESCRIPTION:${escape('CONVENE · America/New_York. ' + s.description)}`,
      'END:VEVENT',
    );
  rows.push('END:VCALENDAR');
  const folded = rows.flatMap((row) => {
    const out: string[] = [];
    let line = '';
    for (const char of row) {
      if (Buffer.byteLength(line + char) > 73) {
        out.push(line);
        line = ' ' + char;
      } else line += char;
    }
    out.push(line);
    return out;
  });
  return new Response(folded.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="convene-agenda.ics"',
      'Cache-Control': 'private, no-store',
    },
  });
};
