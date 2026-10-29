# Vercel build configuration

The initial repository used `adapter-node`, producing `build/` for a standalone Node process. Vercel could not find its required output and fell back to expecting a `public` directory (`STATIC_BUILD_NO_OUT_DIR`). Creating an empty public directory or serving the Node build as static files does not deploy the SvelteKit backend.

The repository now has explicit Vercel configuration:

- `vercel.json` selects SvelteKit and `npm run build:vercel`.
- Vite selects `@sveltejs/adapter-vercel` for Vercel or `--mode vercel`, producing `.vercel/output/config.json`, static assets, and server functions.
- Ordinary local builds retain `adapter-node`, so the tested local application and production E2E server keep working.
- Node and the function runtime are pinned to 24.x instead of an open-ended engine range.
- The local HTTP origin is not baked into Vercel builds. Preview and production requests use their actual origin, preserving CSRF validation.
- Generated `.vercel/` output and local environment files are ignored by Git.

## Vercel project settings

- Framework preset: **SvelteKit** (framework ID `sveltekit-1`).
- Root Directory: repository root.
- Build command: `npm run build:vercel`.
- Install command: `npm ci --include=dev --legacy-peer-deps`.
- Output Directory: **no override**. Do not enter `public` or `build`.
- Node.js: **24.x**.

Run `npm run build:vercel` locally to verify Build Output API artifacts. `npm run build` still produces the standalone local server. Build output generation is separate from runtime/database readiness.

## Database prerequisite remains

The application currently uses Node's local SQLite driver. Vercel functions cannot use this local file as durable shared storage. At the time of this fix, the connected Vercel project had no database environment variables. An external transactional database and a corresponding application migration are still required for deployed registration, authentication, reservations, waitlists, and check-in.

This change fixes the missing output directory error; it does not claim that deploying the current SQLite application produces a working multi-user hosted service. Do not place the database in `/tmp`, recreate it per request, or treat an in-memory database as a production solution. The existing local application remains functional.

References: [SvelteKit Vercel adapter](https://svelte.dev/docs/kit/adapter-vercel), [Vercel SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).
