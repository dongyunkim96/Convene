# Vercel build configuration

The initial repository used `adapter-node`, producing `build/` for a standalone Node process. Vercel could not find its required output and fell back to expecting a `public` directory (`STATIC_BUILD_NO_OUT_DIR`). Creating an empty public directory or serving the Node build as static files does not deploy the SvelteKit backend.

The repository now has explicit Vercel configuration:

- `vercel.json` selects SvelteKit and `npm run deploy:vercel` (database initialization followed by the Vercel build).
- Vite selects `@sveltejs/adapter-vercel` for Vercel or `--mode vercel`, producing `.vercel/output/config.json`, static assets, and server functions.
- Ordinary local builds retain `adapter-node`, so the tested local application and production E2E server keep working.
- Node and the function runtime are pinned to 24.x instead of an open-ended engine range.
- The local HTTP origin is not baked into Vercel builds. Preview and production requests use their actual origin, preserving CSRF validation.
- Generated `.vercel/` output and local environment files are ignored by Git.

## Vercel project settings

- Framework preset: **SvelteKit** (framework ID `sveltekit-1`).
- Root Directory: repository root.
- Build command: `npm run deploy:vercel`.
- Install command: `npm ci --include=dev --legacy-peer-deps`.
- Output Directory: **no override**. Do not enter `public` or `build`.
- Node.js: **24.x**.

Run `npm run build:vercel` locally to verify Build Output API artifacts. `npm run build` still produces the standalone local server. Build output generation is separate from runtime/database readiness.

## Hosted database

Connect Neon to the project and configure **DATABASE_URL** for Production and Preview. The application uses PostgreSQL when this variable is present. The deployment command applies repeatable migrations and initializes the fictional conference and demo accounts without replacing existing attendee activity. No local copy of the connection string is required. See [PostgreSQL setup and transaction policy](POSTGRES.md).

SQLite remains the local development default, and the Vercel runtime refuses to fall back to it. Do not place the hosted database in `/tmp` or recreate it per request. Build and runtime evidence are recorded separately in the verification documentation.

References: [SvelteKit Vercel adapter](https://svelte.dev/docs/kit/adapter-vercel), [Vercel SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).
