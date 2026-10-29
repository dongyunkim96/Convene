# Verification evidence

Executed locally on October 29, 2026 using Node 24.22.1 on Windows and headless Chromium 1248. The application was run as a local SvelteKit server; no remote deployment is claimed.

**Story:** registration UI → validated SvelteKit action → SQLite user/profile/session records → session booking API → transactional reservations/waitlists → persistent attendee schedule and matching organizer views.

## Executed checks

| Boundary or check                   | Result           | Evidence                                                                                                                                                                      |
| ----------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict Svelte/TypeScript checks     | Passed           | `svelte-check found 0 errors and 0 warnings`                                                                                                                                  |
| Domain and database rules           | Passed           | 14 Vitest tests, including independent concurrent SQLite connections                                                                                                          |
| Production build                    | Passed           | Vite SSR/client build and Node adapter completed                                                                                                                              |
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
- Explicitly configured the production origin to match local HTTP on port 3000, preserving CSRF checks. Deployment requires the matching public APP_ORIGIN before building.

## Final production run

All **5 Playwright tests passed in 29.8 seconds** against the built Node application, including consent and invitation validation, valid VIP registration, and profile persistence. Strict checking reported **0 errors and 0 warnings**; Prettier formatting checks passed. The domain suite contains **14 passing tests**. Final desktop organizer and mobile pass screenshots were visually inspected. The production build completed successfully with the Node adapter.

## Limits of the evidence

Automated accessibility results are not a WCAG certification. Screen readers, real physical mobile cameras, Safari/Firefox, real venue scanning hardware, and deployed multi-instance behavior were not tested. Camera scanning is not shipped: manual organizer token entry is the verified scanner fallback. The QR is tested through actual image decoding. All check-in counts are event check-ins, not actual session attendance. No emails or push messages are sent.

The application is intended for local evaluation. HTTPS infrastructure, production identity hardening, and a persistent deployment database must be configured before a public launch; see README.
