# Verification evidence

Executed on October 29, 2026 using Node 24.22.1 on Windows and headless Chromium 1248. Local verification used SQLite. Hosted verification used the actual Vercel production application and Neon PostgreSQL; the Vercel adapter build ran on Vercel's Linux infrastructure.

**Story:** registration UI → validated SvelteKit action → database user/profile/session records → session booking API → transactional reservations/waitlists → persistent attendee schedule and matching organizer views.

## Executed checks

| Boundary or check                   | Result           | Evidence                                                                                                                                                                      |
| ----------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict Svelte/TypeScript checks     | Passed           | `svelte-check found 0 errors and 0 warnings`                                                                                                                                  |
| Domain and database rules           | Passed           | 24 Vitest tests: 17 domain/SQLite tests and 7 real embedded PostgreSQL migration/trigger tests                                                                                |
| Production build                    | Passed           | Local Node adapter build and hosted Linux Vercel adapter build completed                                                                                                      |
| Main desktop flow                   | Passed           | New general registration, combined search/track filter, reserved seat, schedule, conflict warning/link, full-session waitlist                                                 |
| Multi-account promotion             | Passed           | Casey cancels in another authenticated browser context; waiting attendee becomes confirmed, including after reload                                                            |
| Organizer consistency               | Passed           | Attendee search displays matching two-session schedule; attendee GET and POST to organizer resources return 403                                                               |
| QR flow                             | Passed           | jsQR decoded the generated PNG, decoded data matched the opaque-token format, organizer verification checked in the attendee, repeat verification returned already checked in |
| Mobile core journey                 | Passed           | 390px registration, native filter dialog, session reservation, schedule, and pass                                                                                             |
| Concurrent final-seat HTTP requests | Passed           | Two authenticated contexts requested one seat; one reservation and one waitlist entry were created                                                                            |
| Capacity/access/CSRF                | Passed           | Reduction below confirmed count rejected, forged VIP reservation rejected, cross-origin JSON mutation rejected                                                                |
| Accessibility automation            | Passed           | Axe checks for WCAG A/AA rules on overview, registration, sessions, speakers, sign-in, schedule, pass, profile, and organizer session management                              |
| Keyboard                            | Passed           | Skip link reaches main; cancellation dialog focuses its safe action; Escape closes and returns focus                                                                          |
| Responsive overflow                 | Passed           | Home and sessions at 360, 390, 768, 1280, and 1440; attendee account screens and organizer dashboard at 390                                                                   |
| Browser runtime errors              | Passed           | No captured page errors during desktop core flow and page/keyboard sweeps                                                                                                     |
| Screenshot inspection               | Completed        | Desktop homepage and mobile pass/overview reviewed; captures include all requested overview/session widths and attendee/organizer screens                                     |
| Lint                                | Not configured   | Strict compiler diagnostics and production build used; no lint pass is claimed                                                                                                |
| Dependency audit                    | Advisory remains | Low-severity build-tool dependency advisory, described in README; no compatible registry patch available at verification time                                                 |

## Fixes found during verification

- Corrected the initial seed insert's SQL parameter count; rolled-back seed left no partial event data.
- Migrated configuration, generated TypeScript configuration, hook types, imports, and error calls to SvelteKit 3 APIs.
- Replaced the deprecated icon package with `@lucide/svelte`.
- Avoided early registration and booking interactions before hydration is ready.
- Fixed rapid search/filter return-state loss by carrying current filter state and cancelling the pending debounce on component teardown.
- Fixed the mobile header's horizontal overflow at 390px.
- Improved mobile pass sizing so its QR is easier to reveal above the bottom navigation.
- Corrected test locators to distinguish hidden mobile filters, required-field label suffixes, and asynchronous client navigation.
- Isolated E2E records from the interactive dev database.
- Explicitly configured the standalone local origin for port 3000. Vercel uses each request's actual origin, preserving CSRF checks without a local-origin override.
- Prevented editing the organizer capacity field before hydration, which could overwrite an early edit. The hosted concurrency test now reloads and verifies the stored capacity before racing requests, and restores shared demo fixtures afterward.

## Final production run

All **5 local Playwright tests passed** against the built Node application after the PostgreSQL migration. The same **5 tests passed in 36.7 seconds against [the hosted production application](https://convene-coral-six.vercel.app)** at application commit `29f276e`. These exercise registration, reload persistence, conflict handling, cancellation and waitlist promotion, QR image decoding, organizer check-in, mobile layouts, accessibility, profile edits, VIP validation, and simultaneous final-seat requests. The concurrency test verifies a stored capacity of one, one confirmed reservation, one waitlist entry, and rejection of a capacity reduction below the confirmed count.

Strict checking reported **0 errors and 0 warnings**; formatting checks passed. The domain/database suite contains **24 passing tests**. The Vercel deployment reached **READY**, and its build log confirmed `Database migrated and seeded (existing data preserved).` Initialization and runtime used the existing Vercel `DATABASE_URL`; no local secret file or additional key entry was required. Desktop organizer and mobile pass screenshots were visually inspected during local verification; hosted runs also captured responsive screenshots.

## Limits of the evidence

Automated accessibility results are not a WCAG certification. Screen readers, real physical mobile cameras, Safari/Firefox, real venue scanning hardware, and deployed multi-instance behavior were not tested. Camera scanning is not shipped: manual organizer token entry is the verified scanner fallback. The QR is tested through actual image decoding. All check-in counts are event check-ins, not actual session attendance. No emails or push messages are sent.

The hosted application is a portfolio demo using HTTPS and persistent Neon storage. Public organizer credentials and reusable invitation codes remain intentional demo features; see README and the PostgreSQL deployment notes.
