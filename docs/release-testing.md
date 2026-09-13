# MVP release test report

Tested: 2026-09-13

This report records the Milestone 4 release gate for the invited-collector MVP. The
authenticated and destructive journeys used a clean local Supabase stack. Hosted
production checks were read-only and did not create, edit, or delete production data.

## Outcome

The release gate passes. During the first production-build browser run, two gaps were
found and corrected:

- the documented authenticated browser command did not reliably supply the local
  server-only Supabase key, so account-deletion coverage failed before reaching the
  Admin API;
- collection, wishlist, and public-profile loading grids exposed an `aria-label` on a
  roleless `div`, which axe reported as a serious ARIA violation during a production
  route transition.

`npm run e2e:release` now reads the running local Supabase URL and keys without printing
them, refuses non-local Supabase hosts, builds the optimized application, and runs the
full authenticated Playwright matrix against `next start`. Loading copy remains in a
polite busy region while decorative record-card skeletons are hidden from assistive
technology.

## Automated verification

The final release pass completed:

- Prettier formatting check;
- ESLint;
- TypeScript without emitting files;
- 52 Vitest files with 231 unit and component tests;
- optimized Next.js 16.3.4 webpack build;
- clean application of all 18 Supabase migrations;
- 22 pgTAP files with 339 database assertions;
- generated database type parity after Prettier normalization;
- Supabase schema lint with no errors;
- 36 executed Playwright cases across desktop Chromium, Firefox, WebKit, Android
  Chrome, and iPhone Safari, with 9 intentional project-scoped skips;
- npm registry advisory scan with 0 vulnerabilities.

The browser matrix covers passwordless sign-in through local Mailpit, onboarding,
collection and wishlist maintenance, album-first catalogue entry and manual recovery,
artwork behavior, search and filtering, public sharing and private-field exclusion,
CSV and JSON downloads, cancellable destructive actions, permanent account deletion,
responsive overflow, installability, defensive headers, and WCAG A/AA axe checks.

## Manual read-only smoke check

The current production site at `https://cratebook.vercel.app` was inspected in Chrome:

- the landing page rendered its complete desktop layout and primary actions without a
  framework error overlay or blank state;
- opening `/collection` while signed out redirected to the passwordless sign-in page;
- an unknown `/u/[username]` route resolved to the same unavailable-profile state used
  for private or missing profiles and displayed no collection details.

The hosted authenticated catalogue journey remains deferred at the owner's earlier
direction, and the pull-request Preview magic-link check remains open. Neither check
was claimed as part of this release-test result, and no hosted data or external service
configuration was changed.

## Release follow-up

The next Milestone 4 task is to deploy the verified commit and document production
operations. That task should confirm the deployment health, migration parity, public
routes, rollback procedure, and operational ownership without mutating collector data.
