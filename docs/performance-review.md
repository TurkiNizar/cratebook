# MVP performance review

Reviewed: 2026-09-13

This review covers Cratebook's current MVP routes and the production-like local build.
The measurements below are short lab checks, not real-user field data. They should be
repeated after material UI, dependency, image-provider, or hosting changes.

## Findings and implemented limits

- Collection, wishlist, and each shared-profile section now request and render at most
  24 records at a time. Each query asks for one look-ahead row to decide whether a
  **Next** link is needed, then removes that row before rendering.
- Pagination is server-rendered and URL-based. Collection filters and independent
  shared collection/wishlist page positions are preserved without adding client-side
  state or JavaScript.
- Invalid page values fall back to page 1, and empty out-of-range pages redirect to the
  first valid page instead of showing a misleading empty-crate state.
- Cover art uses `next/image`, fixed square geometry, responsive source sizes, lazy
  loading in grids, and a seven-day optimizer cache. Detail-page covers are preloaded.
- The main data routes remain Server Components with route-level loading states. Public
  profile and record queries run in parallel, and no third-party browser scripts or
  remote web fonts are loaded.
- Advanced edit controls stay off list routes. Catalogue results and exact-edition
  results already use bounded provider pagination.

## Production-build lab check

The optimized Next.js 16.3.4 webpack build was served with `next start`. Headless
Chromium loaded the public landing route in fresh contexts with the browser cache
disabled. Each profile was sampled once after the server was ready.

| Profile          |   Viewport | Requests | Transfer |    FCP |    LCP | CLS |
| ---------------- | ---------: | -------: | -------: | -----: | -----: | --: |
| Desktop Chromium | 1440 × 900 |       13 |   158 KB | 164 ms | 164 ms |   0 |
| Mobile Chromium  |  390 × 844 |       13 |   158 KB |  48 ms |  48 ms |   0 |

Local timing is useful for regression detection but does not represent production
network latency or device CPU. Cratebook does not yet collect analytics or Web Vitals,
consistent with the MVP plan. Before a wider launch, add privacy-conscious field
monitoring and use its p75 Core Web Vitals alongside repeatable hosted Lighthouse runs.

## Verification

- Formatting, lint, TypeScript, 215 unit/component tests, and the production build pass.
- All 331 database schema, authorization, privacy, and mutation assertions pass.
- Authenticated desktop Chromium and Android Chrome journeys pass, including collection,
  wishlist, public sharing, navigation, responsive overflow, and axe checks. Account
  deletion also passes when the local server-only key is supplied to its test process.
- The mobile production-build screenshot has no visible overflow or layout breakage;
  automated inspection found meaningful body content and no framework error overlay.

The next release review should include hosted performance sampling after deployment and
field monitoring once the privacy-conscious analytics decision is implemented.
