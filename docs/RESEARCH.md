# Research and design decisions

Reviewed on October 29, 2026. Public page text and official documentation were accessed with the web research tool. No paid libraries, signed-in product screens, or inaccessible interaction recordings were inspected. The artwork, identity, speakers, and conference copy in CONVENE are original fictional content.

## Product references actually reviewed

| Reference                                                                                                                                          | Specific observation                                                                                                          | Applied decision                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [RainFocus / Zscaler case study](https://www.rainfocus.com/resources/case-studies/creating-cross-functional-value-and-simplifying-complex-events/) | Registration needs differ by attendee category; reporting connects registration and on-site records.                          | Separate category from organizer authorization. Use the same relational records in attendee and organizer views.                      |
| [RainFocus homepage](https://www.rainfocus.com/)                                                                                                   | Positions event experiences around customer data and coordinated workflows.                                                   | Connect registration, reservation, and check-in while labeling these as distinct measurements.                                        |
| [Sched session registration](https://support.sched.com/knowledge/session-registration)                                                             | Event registration precedes session selection. Capacity labels, waitlists, and double-booking controls are explicit concepts. | Separate registration from reserved seats. Show availability before sign-in. Block confirmed conflicts and explain waitlist status.   |
| [Sessionize features](https://sessionize.com/features)                                                                                             | Treats speakers, sessions, and event scheduling as related capabilities.                                                      | Model speakers separately and link them to sessions; allow speaker filtering and discovery.                                           |
| [Sessionize schedule builder](https://sessionize.com/playbook/features-detailed/schedule-builder)                                                  | Sessions have dates, rooms, and time slots; large organizer grids benefit from large screens.                                 | Use chronological cards for discovery and a readable mobile agenda rather than a compressed calendar grid.                            |
| [Luma](https://lu.ma/) → luma.com                                                                                                                  | Public landing copy is concise and event-focused.                                                                             | Keep the overview focused on the gathering, practical details, and clear next actions. No claims about its private registration flow. |

## Visual references and access limitations

- [Mobbin](https://mobbin.com/): public homepage and library description reviewed. Gated app screens were not inspected. Its focus on interface patterns informed treating the task flow as a first-class design concern, not copying a particular screen.
- [Lapa Ninja](https://www.lapa.ninja/): public directory categories and landing-page collection reviewed. Used as a broad reference for editorial hierarchy; no individual site layout was reproduced.
- [Eventbrite](https://www.eventbrite.com/): unavailable to the research tool (HTTP 429).
- [Awwwards](https://www.awwwards.com/): request timed out.
- [Pageflows](https://www.pageflows.com/): unavailable to the tool. No recordings or signed-in flows claimed.

These access limits informed reliance on accessible Sched and Sessionize documentation for detailed workflows. The visual direction is an original interpretation: warm paper, navy type, indigo actions, an abstract meeting-of-shapes graphic, muted track colors, generous spacing, and practical status labels. Initials-based speaker artwork avoids fabricated photographs.

## Technical references actually reviewed

- [Svelte overview](https://svelte.dev/docs/svelte/overview): component/runes documentation; use `$state` and `$derived` and reserve effects for URL synchronization.
- [SvelteKit introduction](https://svelte.dev/docs/kit), [form actions](https://svelte.dev/docs/kit/form-actions), and [auth](https://svelte.dev/docs/kit/auth): server loads, progressively enhanced mutations, cookie-backed sessions, and authorization on the server.
- [SvelteKit 3 migration guide](https://svelte.dev/docs/kit/migrating-to-sveltekit-3): verified the current configuration location, `#lib` imports, TypeScript 6 requirement, updated navigation APIs, and minimum Node version.
- [Tailwind SvelteKit integration](https://tailwindcss.com/docs/installation/framework-guides/sveltekit) and [Vite integration](https://tailwindcss.com/docs/installation/using-vite): Tailwind 4 Vite plugin and stylesheet import.
- [Vite guide](https://vite.dev/guide/): verified the runtime/toolchain requirements against npm package metadata before installation.
- [WAI forms tutorial](https://www.w3.org/WAI/tutorials/forms/): explicit labels, grouped choices, manageable steps, and useful validation feedback.
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/): visible focus, keyboard access, readable status communication, and touch target considerations. Automated checks are evidence, not a conformance certification.
- [node-qrcode](https://github.com/soldair/node-qrcode): server-generated QR PNGs with configurable margins and correction level.
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) and [node-sqlite3](https://github.com/TryGhost/node-sqlite3): alternatives reviewed. Selected the built-in Node 24 SQLite driver to keep local setup self-contained without native addon compilation.

Compatibility was checked using npm metadata: Kit 3.1 requires Svelte 5.57.1+, Vite 8.0.12+, TypeScript 6, plugin 7, and Node 22.17+. The project uses Node 24+, Kit 3.1, Svelte 5, Vite 8, and Tailwind 4; exact installed versions are in package-lock.json.

## Core journeys

1. Choose category → provide details → optional preferences → review → registration and authenticated session.
2. Search/filter → inspect session → reserve → persistent personal schedule → matching organizer count.
3. Conflict → explanation with link to existing booking → explicit cancellation if desired → retry. No automatic replacement.
4. Full session → FIFO waitlist → another attendee cancels → eligible promotion → in-app notice and schedule.
5. Pass → opaque QR token → authorized organizer verification → idempotent event check-in.

Desktop uses clear header navigation. Mobile keeps Sessions, My Schedule, and My Pass reachable in a safe-area-aware bottom bar. Native modal dialogs contain focus, dismiss with Escape, and restore the invoking control. Session filter state lives in query parameters and is carried on the return link.
