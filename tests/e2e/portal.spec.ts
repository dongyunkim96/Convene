import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
const unique = () => `attendee-${Date.now()}-${Math.random().toString(16).slice(2)}@test.example`;
async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel(/^Email address/).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Convene2027!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/(my-schedule|admin)$/);
}
async function register(page: Page, email: string) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('First name').fill('Taylor');
  await page.getByLabel('Last name').fill('River');
  await page.getByLabel(/^Email address/).fill(email);
  await page.getByLabel('Create a password').fill('Convene2027!');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Engineering', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('checkbox', { name: /I understand/ }).check();
  await page.getByRole('button', { name: 'Confirm registration' }).click();
  await expect(page).toHaveURL(/my-schedule\?welcome/);
}
test('complete attendee → conflict → waitlist promotion → organizer → QR journey', async ({
  page,
  browser,
}) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  const email = unique();
  await register(page, email);
  await page.goto('/sessions');
  await page.getByLabel('Search sessions', { exact: true }).fill('software');
  await expect(
    page.getByRole('heading', { name: 'Building software that lasts', exact: true }),
  ).toBeVisible();
  await page.locator('#track').selectOption('Engineering');
  await expect(page).toHaveURL(/track=Engineering/);
  await page
    .getByRole('heading', { name: 'Building software that lasts', exact: true })
    .getByRole('link')
    .click();
  await expect(page).toHaveURL(/sessions\/building-software-that-lasts/);
  await page.getByRole('button', { name: 'Reserve seat', exact: true }).click();
  await expect(page.getByText('Seat reserved. Your schedule is up to date.')).toBeVisible();
  await page.getByRole('link', { name: 'Back to sessions', exact: true }).click();
  await expect(page.getByLabel('Search sessions', { exact: true })).toHaveValue('software');
  await page.goto('/my-schedule');
  await expect(
    page.getByRole('heading', { name: 'Building software that lasts', exact: true }),
  ).toBeVisible();
  await page.goto('/sessions/beyond-the-ai-prototype');
  await page.getByRole('button', { name: 'Reserve seat', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('overlaps');
  await expect(page.getByRole('link', { name: 'Review conflicting reservation' })).toBeVisible();
  await page.goto('/sessions/your-data-deserves-better');
  await page.getByRole('button', { name: 'Join waitlist', exact: true }).click();
  await expect(
    page.getByText('You joined the waitlist. This is not a confirmed seat.'),
  ).toBeVisible();
  const holderContext = await browser.newContext();
  const holder = await holderContext.newPage();
  await signIn(holder, 'casey@convene.demo');
  await holder.goto('/sessions/your-data-deserves-better');
  await holder.getByRole('button', { name: 'Cancel reservation', exact: true }).click();
  await holder.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(holder.getByText('Reservation cancelled.', { exact: false })).toBeVisible();
  await page.goto('/my-schedule');
  await expect(
    page.getByRole('heading', { name: 'Your data deserves better', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('A place opened up!')).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your data deserves better', exact: true }),
  ).toBeVisible();
  const ics = await page.request.get('/my-schedule/calendar');
  expect(await ics.text()).toContain('UID:convene-2027-6@convene.demo');
  const denied = await page.request.get('/admin');
  expect(denied.status()).toBe(403);
  const mutation = await page.request.post('/admin/sessions/1', {
    form: { capacity: '999' },
    headers: { Origin: new URL(page.url()).origin },
  });
  expect(mutation.status()).toBe(403);
  await page.goto('/my-pass');
  const image = page.getByRole('img', { name: /Scannable conference pass/ });
  const src = (await image.getAttribute('src'))!;
  const png = PNG.sync.read(Buffer.from(src.split(',')[1], 'base64'));
  const qr = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  expect(qr?.data).toMatch(/^[a-f0-9]{64}$/);
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, 'organizer@convene.demo');
  await admin.getByLabel('Search attendees', { exact: true }).fill(email);
  const row = admin.getByRole('row').filter({ hasText: email });
  await expect(row).toContainText('2 reserved sessions');
  await admin.getByLabel('Pass token', { exact: true }).fill(qr!.data);
  await admin.getByRole('button', { name: 'Verify & check in' }).click();
  await expect(admin.getByRole('status')).toContainText('Valid pass — checked in');
  await admin.getByRole('button', { name: 'Verify & check in' }).click();
  await expect(admin.getByRole('status')).toContainText('Already checked in');
  expect(consoleErrors).toEqual([]);
  // Restore the full-session fixture through the second attendee's own account.
  await page.goto('/sessions/your-data-deserves-better');
  await page.getByRole('button', { name: 'Cancel reservation', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByText('Reservation cancelled.', { exact: false })).toBeVisible();
  await holder.reload();
  await holder.getByRole('button', { name: 'Reserve seat', exact: true }).click();
  await expect(holder.getByText('Seat reserved. Your schedule is up to date.')).toBeVisible();
  await holderContext.close();
  await adminContext.close();
});
test('mobile registration, booking, schedule, pass, and filter sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page, unique());
  await page.goto('/sessions');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page
    .getByLabel('Track', { exact: true })
    .filter({ visible: true })
    .selectOption('Engineering');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/track=Engineering/);
  await page
    .getByRole('heading', { name: 'Building software that lasts', exact: true })
    .getByRole('link')
    .click();
  await expect(page).toHaveURL(/sessions\/building-software-that-lasts/);
  await page.getByRole('button', { name: 'Reserve seat', exact: true }).click();
  await expect(page.getByText('Seat reserved. Your schedule is up to date.')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Your conference' })
    .getByRole('link', { name: 'My Schedule' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Building software that lasts', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Your conference' })
    .getByRole('link', { name: 'My Pass' })
    .click();
  await expect(page.getByRole('img', { name: /Scannable conference pass/ })).toBeVisible();
});
test('accessibility, responsive layouts, keyboard, errors, and screenshots', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const path of ['/', '/register', '/sessions', '/speakers', '/login']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(
        results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ),
    ).toEqual([]);
  }
  for (const width of [360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });
    await page.goto('/sessions');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/sessions-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await signIn(page, 'alex@convene.demo');
  for (const path of ['/my-schedule', '/my-pass', '/profile']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([]);
    await page.screenshot({ path: `artifacts/${path.slice(1)}-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `artifacts/${path.slice(1)}-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  await page.goto('/sessions/building-software-that-lasts');
  await page.getByRole('button', { name: 'Cancel reservation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep my place' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Cancel reservation', exact: true })).toBeFocused();
  await page.goto('/missing');
  await expect(page.getByRole('heading', { name: 'A little off the agenda.' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('simultaneous final-seat requests use the server capacity rule', async ({ browser }) => {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);
  const [a, b, admin] = await Promise.all(contexts.map((c) => c.newPage()));
  await signIn(a, 'alex@convene.demo');
  await signIn(b, 'casey@convene.demo');
  await signIn(admin, 'organizer@convene.demo');
  const origin = new URL(a.url()).origin;
  for (const attendee of [a, b]) {
    expect(
      (
        await attendee.request.post('/api/booking', {
          data: { id: 10, action: 'cancel' },
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(200);
  }
  await admin.goto('/admin/sessions/10');
  await admin.getByLabel('Session capacity').fill('1');
  await admin.getByRole('button', { name: 'Save capacity' }).click();
  await expect(admin.getByRole('status')).toContainText('Capacity updated');
  await admin.reload();
  await expect(
    admin.locator('.metric').filter({ hasText: 'Capacity' }).locator('strong'),
  ).toHaveText('1');
  const responses = await Promise.all(
    [a, b].map((p) =>
      p.request.post('/api/booking', {
        data: { id: 10, action: 'book' },
        headers: { Origin: origin },
      }),
    ),
  );
  expect(responses.map((r) => r.status())).toEqual([200, 200]);
  const messages = await Promise.all(responses.map((r) => r.json()));
  expect(messages.filter((m) => m.message.startsWith('Seat reserved'))).toHaveLength(1);
  expect(messages.filter((m) => m.message.startsWith('You joined the waitlist'))).toHaveLength(1);
  await admin.reload();
  await expect(admin.locator('tbody tr')).toHaveCount(2);
  await expect(admin.locator('tbody')).toContainText('Confirmed');
  await expect(admin.locator('tbody')).toContainText('Waitlisted');
  await admin.getByLabel('Session capacity').fill('0');
  await admin.getByRole('button', { name: 'Save capacity' }).click();
  await expect(admin.getByRole('status')).toContainText('at least 1');
  const forged = await a.request.post('/api/booking', {
    data: { id: 12, action: 'book' },
    headers: { Origin: origin },
  });
  expect(forged.status()).toBe(409);
  expect((await forged.json()).message).toContain('VIP access required');
  const csrf = await a.request.post('/api/booking', {
    data: { id: 13, action: 'book' },
    headers: { Origin: 'https://untrusted.example' },
  });
  expect(csrf.status()).toBe(403);
  const results = await new AxeBuilder({ page: admin })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await admin.screenshot({ path: 'artifacts/admin-session-desktop.png', fullPage: true });
  await admin.goto('/admin');
  await admin.screenshot({ path: 'artifacts/admin-desktop.png', fullPage: true });
  await admin.setViewportSize({ width: 390, height: 844 });
  expect(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await admin.screenshot({ path: 'artifacts/admin-mobile.png', fullPage: true });
  // Restore shared demo fixtures when explicitly testing a hosted demo.
  for (const attendee of [a, b]) {
    const cancelled = await attendee.request.post('/api/booking', {
      data: { id: 10, action: 'cancel' },
      headers: { Origin: origin },
    });
    expect(cancelled.status()).toBe(200);
  }
  await admin.goto('/admin/sessions/10');
  await admin.getByLabel('Session capacity').fill('2');
  await admin.getByRole('button', { name: 'Save capacity' }).click();
  await expect(admin.getByRole('status')).toContainText('Capacity updated');
  for (const c of contexts) await c.close();
});
test('registration validates consent and invitation codes; profile edits persist', async ({
  page,
}) => {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.getByRole('radio', { name: /VIP attendee/ }).check();
  await page.getByLabel('Invitation code').fill('NOT-AN-INVITATION');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('First name').fill('Invited');
  await page.getByLabel('Last name').fill('Guest');
  await page.getByLabel(/^Email address/).fill(unique());
  await page.getByLabel('Create a password').fill('Convene2027!');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm registration' }).click();
  await expect(page.getByRole('alert')).toContainText('agree to the registration terms');
  await page.getByRole('checkbox', { name: /I understand/ }).check();
  await page.getByRole('button', { name: 'Confirm registration' }).click();
  await expect(page.getByRole('alert')).toContainText('valid invitation code');
  await page.getByRole('alert').getByRole('link').click();
  await page.getByLabel('Invitation code').fill('CONVENE-VIP');
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm registration' }).click();
  await expect(page).toHaveURL(/my-schedule\?welcome/);
  await page.goto('/sessions/the-small-team-advantage');
  await page.getByRole('button', { name: 'Reserve seat', exact: true }).click();
  await expect(page.getByText('Seat reserved. Your schedule is up to date.')).toBeVisible();
  await page.goto('/profile');
  await page.getByLabel('Company (optional)').fill('Fictional Studio');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('profile has been updated');
  await page.reload();
  await expect(page.getByLabel('Company (optional)')).toHaveValue('Fictional Studio');
});
