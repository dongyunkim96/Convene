import type { RequestEvent } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { requireUser } from '#lib/server/guards.ts';
import { database, one } from '#lib/server/db.ts';
export const load = async ({ locals }: RequestEvent) => {
  const user = requireUser(locals);
  const pass = (await one<{
    token: string;
  }>(database(), 'SELECT token FROM passes WHERE user_id=?', user.id))!;
  return {
    qr: await QRCode.toDataURL(pass.token, { width: 320, margin: 4, errorCorrectionLevel: 'M' }),
    token: pass.token,
    checked: !!(await one(database(), 'SELECT user_id FROM checkins WHERE user_id=?', user.id)),
  };
};
