# Security and privacy review

Reviewed: 2026-09-14

This review covers the MVP application boundary, Supabase schema and permissions,
public sharing, exports, account deletion, catalogue access, browser defenses, and
committed configuration. It does not authorize or modify hosted production data.

## Outcome

The reviewed MVP is suitable for the invited-collector release after three issues
found during the review were corrected:

- direct reads of `profiles` are now owner-only; anonymous and other authenticated
  visitors must use the narrow `get_public_*` projections;
- authentication callback destinations are parsed as same-origin URLs, including
  rejection of backslash and encoded-separator redirect variants;
- every application route now sends defensive browser headers for framing, MIME
  sniffing, referrers, browser capabilities, transport security, opener isolation,
  and a compatible baseline Content Security Policy.

## Data and trust boundaries

- Supabase Auth establishes the user identity through a Google ID-token exchange or
  email magic link. Server Actions and private route
  handlers call `auth.getUser()` again at the mutation or export boundary rather
  than relying only on the protected layout or proxy.
- User-owned tables have RLS enabled and ownership policies. Mutating RPCs derive the
  owner from `auth.uid()`, use an empty fixed `search_path`, and grant execution only
  to `authenticated`. Cross-user and anonymous database tests cover reads and writes.
- Public pages read only security-definer functions with explicit return columns.
  Collection prices, sellers, conditions, private notes, tags, target prices,
  catalogue identifiers, and raw provenance are absent from those function schemas.
- Complete CSV and JSON exports require a validated user and use private, no-store,
  `nosniff` responses. CSV formula-like values are escaped before download.
- The only service-level credential is `SUPABASE_SECRET_KEY`. It is read from a
  `server-only` admin module solely for deletion and is never prefixed with
  `NEXT_PUBLIC_`. Local environment files are ignored by Git.
- Account deletion requires the exact typed confirmation and deletes the current Auth
  user through the Admin API. Database cascades remove the profile and all owned
  release, collection, wishlist, and tag rows. The MVP accepts no uploads; before an
  upload feature is introduced, owned Storage objects must be deleted first.

## Input, output, and external services

- Dynamic UUIDs, usernames, URL paging/filter values, form fields, currency values,
  catalogue entity types, provider identifiers, and artwork URLs are validated or
  normalized before use. Database queries use the Supabase client rather than string
  concatenation.
- React renders user-authored text without raw HTML injection. No use of
  `dangerouslySetInnerHTML`, `eval`, or browser-side secret access was found.
- Catalogue traffic is server-only and restricted to fixed MusicBrainz and Cover Art
  Archive HTTPS endpoints. Requests have bounded inputs, timeouts, retries, response
  sizes, caching, coalescing, and provider-respecting throttling. Search always has a
  manual fallback.
- Google Identity Services provides a popup credential with a cryptographic nonce;
  Supabase validates the ID token and creates or links the identity. Cratebook asks
  only for basic identity data. Magic-link delivery remains handled by Supabase Auth,
  including its provider-side abuse controls. Cratebook does not expose a generic
  email or network proxy endpoint.

## Browser and deployment defenses

All routes receive:

- `Content-Security-Policy` limiting base URLs, form destinations, frames, and object
  embedding without forcing every route into dynamic nonce rendering;
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` against clickjacking;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- restrictive camera, geolocation, and microphone permissions for the current MVP;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`, which retains opener
  isolation for unrelated cross-origin documents while allowing the Google sign-in
  popup to complete;
- two-year HTTPS-only transport policy and disabled DNS prefetching;
- no framework-identifying `X-Powered-By` header.

Vercel terminates HTTPS and Supabase cookies provide the session controls used by the
official SSR client. Server Actions additionally receive Next.js same-origin checks.

## Verification and residual work

The review is enforced by unit tests for redirect parsing and header configuration,
route-handler tests for the callback, pgTAP tests for direct grants, RLS, RPC
projections, account deletion, and cross-user isolation, plus the existing component
and browser privacy journeys. A clean migration reset is required before the database
suite so tests exercise the final privilege state.

The registry-backed dependency advisory query was not run in this workspace because
external transmission of the dependency manifest was not authorized. Dependencies
remain exactly pinned in `package-lock.json`; the full release-test task should run an
approved advisory scan and record its result before public release. Rate-limit and
authentication abuse telemetry remain provider/platform operational concerns because
the MVP has no application analytics or durable rate-limit store.

The baseline CSP intentionally omits `script-src` and `style-src`. A nonce-based strict
CSP would force dynamic rendering across matching routes in the current Next.js
version, conflicting with the deliberately static public shell. Revisit a strict
script policy alongside a measured rendering and caching plan rather than adding
`unsafe-inline` as a nominal control.
