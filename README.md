# CONVENE

For Vercel, connect Neon as **DATABASE_URL** and see [deployment settings](docs/VERCEL.md) and [PostgreSQL setup](docs/POSTGRES.md). The deployment initializes the database using Vercel's environment variables; no local secret file is required.

A complete fictional two-day technology conference and attendee portal, built with Svelte 5, SvelteKit 3, TypeScript 6, Tailwind CSS 4, PostgreSQL for hosting, and SQLite for self-contained local development. All interface content is in English. There is no affiliation with RainFocus, Zscaler, or any other referenced business.

## Run locally

**Use Node 24.x.** Older Node versions cannot run the built-in SQLite driver and current toolchain. This workspace's default Node was 20; development and validation used the desktop app's bundled Node 24.22.1.

```sh
npm ci --legacy-peer-deps
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:5173. `--legacy-peer-deps` works around an npm 11 optional-peer resolution crash observed with the current Vite plugin/testing toolchain. The compatible direct dependencies and exact transitive versions are recorded in package-lock.json.

The database defaults to `data/convene.sqlite`. To choose another location, set `DATABASE_PATH` in your shell, or in `.env` for Vite. Database CLI commands read shell environment variables; Node 24 users may also run `node --env-file=.env --import tsx scripts/database.ts seed`. `.env.example` contains no credentials. Migrations are repeatable, and seeding preserves registrations and bookings. Re-seeding updates the fictional session descriptions and outcomes but does not reset user activity. A new database path creates a clean demo.

### Windows / Codex bundled runtime

If your normal `node --version` is below 24, put the available Node 24 executable first on PATH and invoke npm through that executable (some Windows npm shims still select their colocated older Node):

```powershell
$runtimeNode = 'C:\Users\hiu03\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $runtimeNode node_modules/tsx/dist/cli.mjs scripts/database.ts seed
& $runtimeNode node_modules/vite/bin/vite.js dev --host 127.0.0.1
```

The path above is specific to the original development machine. A standard Node 24 installation uses the normal npm commands.

## Demo access

Go to `/login`, click an account to populate the fields, and select **Sign in**. All seeded accounts use **Convene2027!**.

| Account     | Email                  | Purpose                                                           |
| ----------- | ---------------------- | ----------------------------------------------------------------- |
| General     | alex@convene.demo      | Has a seat in “Building software that lasts”                      |
| VIP         | vip@convene.demo       | Can reserve the invited VIP sessions                              |
| Speaker     | speaker@convene.demo   | Speaker category; no organizer or VIP privileges                  |
| Organizer   | organizer@convene.demo | Protected dashboard, capacity changes, CSV, and pass verification |
| Seat holder | casey@convene.demo     | Holds the only seat in “Your data deserves better”                |

New general registrations require no invitation. VIP and speaker registration require server-validated demo codes **CONVENE-VIP** and **CONVENE-SPEAKER** respectively. Selecting a category never grants organizer access. These reusable codes and public demo credentials are intended for local evaluation, not public production use.

### Try the connected flow

1. Register a new general attendee. Explore sessions and reserve “Building software that lasts.”
2. Try “Beyond the AI prototype.” Its overlap is explained with a link to your existing reservation.
3. Join the full “Your data deserves better” session’s waitlist.
4. In a separate browser profile/context, sign in as Casey and cancel that session. Confirm explicitly.
5. Return to your schedule or refresh: the waitlist promotion appears as a confirmed reservation and in-app notice.
6. Open My Pass. Its PNG QR encodes only a random token. The manual fallback reveals that same token.
7. Sign in as organizer in another browser context. Find the attendee, verify matching reservations, paste the pass token, and check in. Repeating the verification returns “Already checked in.”

Use separate browser profiles or private windows for independent accounts; tabs in one profile share their authentication cookie.

## Implemented experience

- Editorial overview, 24 detailed sessions across two days/four tracks/four rooms, and 12 fictional speakers.
- Four-step registration with validation, review, private preferences, invitation validation, and session authentication.
- Combined title/description/speaker search, day/track/speaker/availability/level filters, URL persistence, active chips, and a mobile filter dialog.
- Server-enforced reservations, conflicts, capacity, cancellations, FIFO waitlists, and in-app promotion history.
- Day-based personal agenda, native print layout, and a UTC-based `.ics` export with stable identifiers.
- Opaque QR pass, PNG download, print layout, and authorized idempotent event check-in.
- Protected organizer metrics, attendee search and schedules, reservation records, waitlist records, safe capacity editing, transition history, and formula-escaped CSV.
- Keyboard navigation, skip link, native modal focus containment/restoration, safe-area mobile navigation, reduced-motion styles, and responsive layouts.

## Architecture

`src/routes` contains server loads/actions, API endpoints, and Svelte pages. Shared components are in `src/lib/components`. `src/lib/server/domain.ts` holds the async booking, promotion, capacity, and verification rules. `db.ts` owns a PostgreSQL pool or local SQLite connection; per-transaction clients are scoped with AsyncLocalStorage. `auth.ts` resolves database-backed sessions from an HttpOnly cookie. The SQL files in `migrations/` define relational constraints, indexes, and database capacity/access guards.

The schema models users, attendee profiles, conference events, speakers, sessions, session-speaker relationships, reservations, waitlist entries, passes, check-ins, invitation codes, authentication sessions, and reservation transitions. Preferences and emails never appear in public session or speaker data.

Authentication follows the session-token approach described in the official SvelteKit authentication guide: cryptographically random bearer tokens, SHA-256 token hashes in the database, seven-day expiry, HttpOnly/SameSite=Lax cookies, and Secure cookies on HTTPS. Passwords use Node's maintained `scrypt` implementation with random salts and timing-safe verification. Authentication and organizer authorization are checked on the server for every protected load/action/endpoint. Form actions use framework protections; all mutation requests additionally require a matching Origin, including JSON booking calls. This local implementation does not include public-service account recovery, email verification, MFA, or rate limiting.

### Booking and waitlist rules

- Hosted mutations use a dedicated PostgreSQL transaction client and a cross-instance advisory writer lock. Local mutations use `BEGIN IMMEDIATE` and a serialized SQLite connection. Database guards independently prevent overbooking.
- One active reservation and one waitlist record per attendee/session are enforced by unique constraints. Repeated booking and cancellation requests are safe.
- Confirmed sessions overlap when `A.start < B.end && B.start < A.end`. Back-to-back sessions are permitted. Existing reservations are never silently replaced.
- Only invited VIP profiles can reserve VIP sessions. Speaker is a separate category, not elevated authorization.
- Full sessions accept eligible waitlist entries, ordered by monotonically increasing insertion ID. Waitlists occupy no seats and do not block reservations.
- Cancellation and capacity increases promote the earliest eligible nonconflicting attendee inside the same transaction. Skipped conflicting entries stay in line. Cancelling a conflicting reservation also rechecks that attendee's waitlists.
- Capacity cannot fall below the current confirmed reservation count. Promotions and cancellations are recorded in transition history.
- Cancelling from the browser requires confirmation. Counts refresh after mutations, navigation, or the organizer's visible **Refresh data** control. There is no background live-update channel.

### Timezone and deterministic demo

The event is May 20–21, 2027, in **America/New_York**, which is EDT (UTC−4) on those dates. All session timestamps are stored as UTC ISO strings and all event times are formatted with the explicit event timezone. Calendar exports use UTC timestamps, not the browser's local timezone. Event identifiers remain stable across exports. The homepage's first/next reserved session is based on the program's chronological order, equivalent to a fixed pre-event demo time; it never becomes empty because today's date changes. No real-time “live now” or countdown is simulated. Check-in and activity history timestamps are actual mutation times.

## Checks and tests

```sh
npm run check
npm run format:check
npm test
npx playwright install chromium  # only if not already installed
npm run test:e2e
npm run build
npm start
```

The Vitest suite tests conflicts, boundary times, duplicates, VIP restrictions, cancellations, FIFO ordering, skipped conflicting candidates, capacity adjustments, authorization, QR validation, idempotent check-in, password hashing, CSV escaping, and independent concurrent SQLite writers.

`test:e2e` builds the application first. Playwright starts its own production server on port 3000 and creates a unique disposable database under ignored `data/`. The dev database is not modified. E2E tests cover registration, invitation and consent validation, profile persistence, filtering and return-state preservation, reservations, conflicts, two-context cancellation/promotion, persistence, organizer matching records, unauthorized mutations, real QR decoding with jsQR, check-in, mobile flows, concurrent final-seat HTTP requests, CSRF, keyboard focus, automated axe checks, and screenshots at 360/390/768/1280/1440 widths. Tests can target an already running **disposable** app with `TEST_BASE_URL`; this disables automatic server setup. Do not point that option at production.

Screenshots are written to ignored `artifacts/`, failure traces to `test-results/`, and the HTML report to `playwright-report/`. Automated accessibility results do not establish full WCAG conformance or replace testing with assistive technologies.

See [research and applied design decisions](docs/RESEARCH.md) and [verification evidence](docs/VERIFICATION.md).

## Deployment and limits

**Vercel:** connect Neon and set DATABASE_URL for the target environments. `npm run deploy:vercel` initializes the database and generates the Vercel functions. No credentials need to be stored locally. The Vercel adapter uses the request's real origin for both preview and production. See [PostgreSQL setup](docs/POSTGRES.md).

**Standalone local server:** use Node 24.x, run `npm run build`, then `npm start`. The default origin is http://127.0.0.1:3000. For a standalone server at another origin, set APP_ORIGIN before building. If using SQLite, retain its database/WAL/SHM files on persistent disk. Hosted serverless operation requires PostgreSQL and never falls back to ephemeral SQLite. Local SQLite records are not automatically uploaded to Neon.

The organizer scanner provides a tested manual token fallback; camera capture is intentionally not implemented. The QR itself is real and is decoded in E2E verification. There are no payments, sent emails, push notifications, session-attendance scans, automatic calendar updates, account recovery, or external integrations. In-app promotion notices remain visible as recent history. Email/category changes are not exposed through profile editing.

At implementation time npm audit reported a low-severity prototype-poisoning advisory in the build-time `deepmerge` dependency used by the Svelte Vite plugin ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)); npm's suggested framework downgrade is incompatible with this project. The registry's latest deepmerge was 4.3.1, with no current patch offered. No untrusted user configuration is merged by this application. Recheck upstream before a public production deployment.
