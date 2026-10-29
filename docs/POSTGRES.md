# Neon PostgreSQL on Vercel

The application now supports Neon/PostgreSQL for hosted operation and SQLite for self-contained local development. Database connections are initialized lazily. No database credentials are required in the local checkout when using the Vercel-only workflow.

## Vercel-only credentials

1. Connect Neon to the `convene` project through Vercel Storage.
2. Ensure **DATABASE_URL** is present for Production and Preview. Its value must be the PostgreSQL connection URL from Neon, including its SSL settings. Never commit this URL or send it through chat.
3. Push the application changes. `vercel.json` runs `npm run deploy:vercel`.
4. The deployment build validates the environment variable, runs migrations and the demo seed, and builds with the Vercel adapter. A missing URL or a failed initialization fails the build with a useful error rather than publishing an uninitialized application.

No local `.env.local` is required for this workflow. Environment-variable introspection was unavailable to the connected Vercel tool, so connection validity is verified by the actual deployment build. Build logs never print the connection string.

## Persistence and migration behavior

`migrations/001_postgres.sql` creates tables, indexes, and database guards without dropping existing records. Migration writes and the seed use the same PostgreSQL advisory transaction lock as booking writes. Initialization is atomic; repeated or concurrent deployments preserve registrations, authentication sessions, reservations, waitlists, passes, check-ins, and transition history. Seeding an existing event refreshes fictional session descriptions and outcomes only.

The first initialization creates the fictional program and the five documented demo accounts. The organizer demo account is intentionally public for portfolio evaluation. Do not use these demo credentials with real attendees or private production data.

Existing records in a local SQLite file are not automatically copied to Neon. Local and hosted databases are separate. This migration initializes the new hosted database and preserves any records already stored there.

## Transactions and connection management

The server uses `pg.Pool` with at most four connections per process, finite idle/connect timeouts, and the connection URL's SSL configuration. Each transaction acquires one pool client and uses it for every statement until commit or rollback. AsyncLocalStorage scopes the client to its asynchronous operation; no attendee identity is stored in shared module state.

For this small conference, PostgreSQL advisory lock `(119015,2027)` serializes writers across server instances. Conflict checks, final-seat counts, FIFO promotions, capacity changes, and check-in therefore operate on a consistent database state. Database triggers independently reject overbooking, ineligible VIP reservations, schedule overlap, and reductions below confirmed capacity. Back-to-back sessions remain permitted. The lock deliberately favors correctness over high-volume write throughput.

SQLite remains available when DATABASE_URL is absent locally. Its async adapter serializes a transaction's work and prevents other local requests from reading its uncommitted changes. Vercel explicitly requires DATABASE_URL and never falls back to an ephemeral SQLite file.

## Verification

- Domain tests exercise the async SQLite path, concurrent application bookings, independent SQLite writers, repeatable seeding, and all booking/access/check-in rules.
- Embedded real PostgreSQL (PGlite) tests execute the actual PostgreSQL migration and database triggers, including repeated migration, capacity, VIP access, overlap, email uniqueness, and millisecond session-expiry storage. They do not establish cloud connectivity.
- The actual Vercel build verifies Neon connectivity and initialization using its environment variables.
- Browser tests verify the local application. Hosted smoke tests, when executed, are reported separately; local passes alone do not claim Neon end-to-end validation.

References: [node-postgres transactions](https://node-postgres.com/features/transactions), [Neon connection pooling](https://neon.com/docs/connect/connection-pooling).
