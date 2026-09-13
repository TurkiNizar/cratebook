# Cratebook MVP Plan

> Living product specification, technical reference, and development tracker.
>
> Last updated: 2026-09-13
> Overall status: **In development**
> Current milestone: **Milestone 4 — Sharing, portability, and MVP release**

## How to use this document

This file is the source of truth for the MVP. Update it whenever scope, architecture,
or product decisions change, and after meaningful implementation work.

Status markers:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and verified
- `[-]` Deliberately deferred or removed from scope

When changing an agreed decision, update the relevant section and add a dated entry
to the Decision Log. When completing a milestone item, link the implementation file
or pull request in the item when useful.

## 1. Product vision

Cratebook is a personal vinyl companion that helps collectors answer three questions:

1. What records do I own?
2. What records am I looking for?
3. What is the personal story of each record?

The application should feel welcoming to a new collector without becoming limiting
as their knowledge grows. Precise pressing information is supported, but never
required for ordinary use.

### Product promise

> Know what you own, remember where it came from, and share what you are searching for.

### Guiding principles

- **Phone first:** optimize for use in a record shop and beside a turntable.
- **Fast capture:** an ordinary record should be addable in under 30 seconds.
- **Beginner friendly:** artist and title are enough to start.
- **Personal, not clinical:** memories, provenance, and personal notes matter.
- **Private by default:** purchase and storage information is not publicly exposed.
- **User-owned data:** collection data can be exported and deleted.
- **Progressive detail:** advanced pressing fields remain available but unobtrusive.
- **No catalogue lock-in:** manual entry always works, even if an external provider fails.

## 2. Target users and situations

### Primary user

A new or casual vinyl collector who wants a simple, attractive inventory and wishlist
without first learning specialist catalogue terminology.

### Secondary user

An experienced collector who wants optional release details, multiple copies, useful
filters, and portable data.

### Key situations

- **In a shop:** check whether a record is already owned or wanted.
- **After a purchase:** save the copy, price, condition, seller, and story quickly.
- **At home:** browse the collection, choose something to play, and edit details.
- **With friends:** share a collection, favorites, or wishlist through a link.
- **Before a gift:** inspect a friend's visible wishlist without seeing private data.

## 3. MVP goals and success criteria

### Goals

- Create and manage an owned vinyl collection.
- Create and manage a wishlist.
- Move a wishlist item into the collection without re-entering its information.
- Find owned and wanted records quickly on a phone.
- Share a controlled public view through a URL.
- Preserve acquisition details and personal notes privately.
- Allow manual entry and assisted catalogue search.
- Let users export their data.
- Provide an installable mobile-first web experience.

### Product success criteria

- A new user can create an account and add their first record without instructions.
- A basic record can be added in less than 30 seconds under normal conditions.
- An owned or wanted record can be found in a few seconds from a phone.
- A user can understand which information is public before sharing a profile.
- A wishlist record can be converted to an owned copy without data loss.
- The core collection remains usable when catalogue search returns no result.
- The primary journeys work at common phone widths and with keyboard navigation.

### Initial measurements

Analytics are not required for the first internal build. Before public release, define
privacy-conscious events for:

- First record added
- Wishlist item added
- Wishlist item moved to collection
- Collection search used
- Public profile shared
- Data exported

## 4. MVP scope

### 4.1 Account and profile

- Email magic-link authentication
- Unique username
- Display name
- Optional profile photo
- Optional short biography
- Profile visibility: private or public
- Shareable route such as `/u/username`
- Account deletion

Google and Apple login are deferred until demand justifies the setup and maintenance.

### 4.2 Collection

Each collection item represents a physical copy belonging to one user.

Required fields:

- Artist
- Album or release title

Quick optional fields:

- Cover image
- Format: LP, 7-inch, 10-inch, 12-inch, box set, or other
- Disc count
- New or used
- Media condition
- Sleeve condition
- Acquisition date
- Acquired from
- Price paid
- Currency
- Personal rating
- Favorite flag
- Personal notes or story
- User-defined tags

Advanced optional fields, collapsed by default:

- Original release year
- Edition release year
- Label
- Catalog number
- Country
- Edition or pressing description
- Reissue flag
- Vinyl color
- Barcode
- Matrix/runout information

The model must allow a user to own multiple physical copies of the same release.
A possible duplicate produces a warning, not an error.

### 4.3 Wishlist

- Artist and title
- Cover image
- Priority: Interested, Wanted, or Must-have
- Preferred edition or pressing notes
- Maximum price and currency
- Notes
- Public/private visibility
- One-action start of the **Move to collection** flow

Moving a wishlist item to the collection preserves its record metadata and notes,
then requests only relevant acquisition and copy details.

### 4.4 Adding records

Entry methods included in the MVP:

1. Search an external catalogue by artist, title, or catalogue identifier.
2. Select a search result and prefill known metadata and artwork.
3. Enter a record manually or continue manually when no result is suitable.

Barcode scanning is planned immediately after the MVP unless it proves inexpensive
and reliable during catalogue integration. A barcode identifies candidates; it must
not silently claim an exact pressing match.

External catalogue access must be isolated behind an internal provider interface so
that a provider can be changed or supplemented later. Provider licensing, attribution,
image usage, caching rules, and rate limits must be reviewed before implementation.

### 4.5 Search, browse, and filters

Search the user's collection and wishlist by:

- Artist
- Title
- Label
- Catalog number
- Tags
- Personal notes

Initial filtering and sorting:

- Owned or wishlist
- Favorite
- New or used
- Format
- Condition
- Recently acquired
- Artist name
- Title

### 4.6 Sharing and privacy

A public profile may show:

- Visible collection items
- Visible wishlist items
- Favorites
- Recent visible additions

Private by default and never included in public responses:

- Price paid
- Maximum wishlist price
- Purchase location or seller
- Private acquisition notes
- Physical storage location
- Account email and authentication data

Privacy controls:

- Entire profile public or private
- Each collection/wishlist item visible or private
- Public information presented in a preview before sharing
- Unlisted/private-link profiles are a post-MVP option

### 4.7 Data ownership

- Export collection and wishlist as CSV
- Export a complete user backup as JSON
- Delete account and associated personal data
- Document what uploaded images are removed during deletion

## 5. Phone-first experience

### Navigation

The default phone navigation uses a bottom bar:

```text
Collection       Wishlist       Add       Profile
```

The centered Add action opens:

```text
Search catalogue
Add manually
Scan barcode        (post-MVP unless promoted)
```

The collection is the signed-in landing screen; a separate dashboard is unnecessary.

### Interaction requirements

- Comfortable touch targets and one-handed primary actions
- No horizontal page scrolling at supported phone widths
- Forms use appropriate mobile keyboards and inputs
- Progressive disclosure for advanced fields
- Search remains easy to reach while browsing
- Loading, empty, offline, and error states are intentionally designed
- Cover images do not cause layout movement while loading
- Desktop layouts enhance the same journeys rather than introduce separate behavior

## 6. Screens and routes

Exact route names may change during implementation.

| Screen           | Suggested route         | Purpose                                        |
| ---------------- | ----------------------- | ---------------------------------------------- |
| Welcome/sign in  | `/` and `/sign-in`      | Explain the product and authenticate           |
| Collection       | `/collection`           | Browse, search, filter, and sort owned copies  |
| Add/search       | `/add`                  | Search a catalogue or choose manual entry      |
| Manual entry     | `/add/manual`           | Create an uncatalogued record and copy         |
| Record details   | `/collection/[id]`      | View a physical copy and its personal story    |
| Edit copy        | `/collection/[id]/edit` | Edit metadata and ownership details            |
| Wishlist         | `/wishlist`             | Browse and manage wanted records               |
| Wishlist details | `/wishlist/[id]`        | Edit priority, target price, and notes         |
| Public profile   | `/u/[username]`         | Share visible collection and wishlist data     |
| Settings         | `/settings`             | Profile, privacy, export, and account deletion |

## 7. Core user journeys and acceptance criteria

### Journey A: Add a record manually

1. User taps Add.
2. User chooses manual entry.
3. User enters artist and title.
4. User optionally adds copy information.
5. User saves and sees the record in their collection.

Acceptance criteria:

- Only artist and title are mandatory.
- Validation errors are specific and preserve entered values.
- Repeated submission cannot create accidental duplicate rows.
- A potential duplicate shows a non-blocking warning.

### Journey B: Add from catalogue search

1. User searches by artist/title.
2. Results show enough information to make a useful choice.
3. Selecting a result prefills metadata.
4. User adds personal copy information and saves.

Acceptance criteria:

- Search failure never blocks manual entry.
- External credentials remain server-side.
- Provider attribution and artwork rules are respected.
- The external provider identifier and raw source are traceable.

### Journey C: Use a wishlist

1. User adds a searched or manual record to the wishlist.
2. User assigns priority and optional target price.
3. After purchase, user moves it to the collection.

Acceptance criteria:

- Record metadata is not duplicated unnecessarily.
- Notes are preserved or explicitly assigned during conversion.
- The completed conversion does not leave a stale wishlist item.

### Journey D: Check a record in a shop

1. User opens the app on a phone.
2. User searches an artist or title.
3. Results clearly distinguish owned and wanted states.

Acceptance criteria:

- Search is reachable from the initial collection view.
- Common results appear quickly on a normal mobile connection.
- Empty results offer Add and Add to wishlist actions.

### Journey E: Share a profile

1. User enables their public profile.
2. User reviews what visitors can see.
3. User copies and sends the profile URL.
4. A signed-out visitor browses visible items.

Acceptance criteria:

- Private fields are excluded at the query/API level, not merely hidden with CSS.
- A private profile reveals no collection details.
- Public pages are readable without an account.

### Journey F: Export or delete data

Acceptance criteria:

- CSV is useful in ordinary spreadsheet software.
- JSON contains the user's complete portable domain data.
- Account deletion requires explicit confirmation.
- Deletion behavior for uploaded images and authentication data is tested.

## 8. Technical architecture

### Chosen stack

- **Language:** TypeScript
- **Application framework:** Next.js using the App Router
- **UI:** React, Tailwind CSS, and a small accessible component layer
- **Database:** PostgreSQL managed by Supabase
- **Authentication:** Supabase Auth with email magic links
- **File storage:** Supabase Storage
- **Authorization:** PostgreSQL Row-Level Security (RLS)
- **Web hosting:** Vercel
- **Database migrations:** Supabase CLI migrations committed to the repository
- **Unit/component testing:** Vitest and React Testing Library
- **End-to-end testing:** Playwright
- **Native packaging path:** Capacitor for iOS and Android after web validation

Use stable dependency versions available when implementation begins; pin versions in
the lockfile and record material framework migrations in the Decision Log.

### Why this stack

- Next.js supports the authenticated application and public share pages in one codebase.
- TypeScript provides safer domain modeling as collection metadata becomes richer.
- PostgreSQL naturally models users, releases, physical copies, wishlists, and tags.
- Supabase combines database, authentication, storage, and row-level authorization.
- A web-first interface is immediately accessible from shared links.
- Capacitor provides a path to app stores and native device APIs without rewriting the MVP.

### Progressive Web App strategy

The initial application is responsive and includes a valid web app manifest, icons,
theme colors, and standalone display configuration. Installability is part of the MVP.

Full offline synchronization is not part of the MVP. A later service worker can cache
the application shell and recent read-only collection data. Offline writes must not be
added until conflict resolution and sync feedback are deliberately designed.

### Mobile application strategy

After validating the web MVP:

1. Audit the web interface inside Capacitor on iOS and Android.
2. Add native projects and app icons/splash screens.
3. Replace web-only APIs with Capacitor plugins where necessary.
4. Add camera/barcode functionality and optional notifications.
5. Complete store privacy disclosures, signing, review, and release workflows.

This is a planned adaptation, not a zero-effort conversion. Core domain logic, UI,
validation, and backend services should remain reusable.

## 9. Data model

The collection and wishlist foundations below are implemented in committed Supabase
migrations. Public projections remain provisional until their milestone tasks are
implemented. Personal-copy photos are deferred until after the MVP.

### `profiles`

- `id` — UUID, references authenticated user
- `username` — unique, normalized for URLs
- `display_name`
- `bio`
- `avatar_path`
- `is_public` — defaults to false
- `created_at`, `updated_at`

### `artists`

- `id`
- `name`
- `normalized_name`
- `external_source`, `external_id` — nullable

### `releases`

Represents musical/release metadata shared by one user's physical copies and, later,
wishlist items. Rows are user-scoped so private collection metadata cannot be read by
another user; a future public view must expose an explicit safe projection.

- `id`
- `created_by` — authenticated user who owns this release row
- `title`
- `artist_display`
- `cover_url` or managed cover path
- `format`
- `disc_count`
- `original_year`
- `release_year`
- `label`
- `catalog_number`
- `country`
- `edition_description`
- `is_reissue`
- `vinyl_color`
- `barcode`
- `matrix_runout`
- `external_source`, `external_id`
- `external_entity_type` — `release_group` for album identity or `release` for an
  exact edition; null for manual records
- `source_data` — original catalogue payload for private provenance
- `created_at`, `updated_at`

Artist normalization can begin with display text and evolve into a many-to-many
`release_artists` table when compilation and collaboration requirements are clearer.

### `collection_items`

Represents one user's physical copy.

- `id`
- `user_id`
- `release_id`
- `entry_key` — per-user idempotency key for safe form retries
- `purchase_state` — new, used, or unknown
- `media_condition`
- `sleeve_condition`
- `acquired_on`
- `acquired_from`
- `price_paid_minor` — integer minor currency units
- `price_currency` — ISO currency code
- `rating`
- `is_favorite`
- `notes`
- `is_public` — defaults to false and requires an explicit owner opt-in
- `created_at`, `updated_at`

### `wishlist_items`

- `id`
- `user_id`
- `release_id`
- `entry_key` — per-user idempotency key for safe form retries
- `priority` — interested, wanted, or must_have
- `preferred_edition`
- `max_price_minor`
- `price_currency`
- `notes`
- `is_public`
- `created_at`, `updated_at`

Enforce one active wishlist item per user/release. A transaction or server-side function
should perform wishlist-to-collection conversion atomically.

### `tags` and `collection_item_tags`

- Tags belong to a user.
- Tag names are unique per user after normalization.
- The join table connects tags to physical copies.

### `collection_photos` (post-MVP, provisional)

- `id`
- `collection_item_id`
- `storage_path`
- `caption`
- `sort_order`
- `created_at`

## 10. Security and privacy requirements

- Enable RLS on every user-owned or sensitive table before exposing it to clients.
- Users can create, read, update, and delete only their own private data.
- Public queries expose only explicitly public profiles and items.
- Maintain a safe public projection that excludes all private fields.
- Never ship service-role or catalogue-provider secrets to the browser.
- Validate and authorize all mutations on the server/database boundary.
- Restrict upload MIME types and sizes; generate non-user-controlled storage paths.
- Sanitize or safely render all user-authored display text.
- Rate-limit sensitive or abuse-prone endpoints where appropriate.
- Keep dependency and secret scanning in the release checklist.
- Test authorization using two users plus a signed-out visitor.

## 11. Accessibility, performance, and compatibility

### Accessibility

- Meet WCAG 2.2 AA for primary journeys where practical.
- Visible keyboard focus and full keyboard operability
- Semantic form labels and error associations
- Sufficient color contrast
- Alternative text for meaningful user-uploaded images
- Motion reduction honored
- Screen-reader announcements for asynchronous results and errors

### Performance

- Optimize and size cover images for their display context.
- Paginate or progressively load growing collections.
- Index user, release, visibility, date, and normalized search fields appropriately.
- Avoid loading advanced edit controls on the collection grid.
- Measure primary public and authenticated pages before release.

### Initial compatibility target

- Current Safari on iOS
- Current Chrome on Android
- Current Safari, Chrome, Firefox, and Edge on desktop
- Graceful browser use when PWA installation is unavailable

## 12. Testing strategy

### Unit tests

- Validation and normalization
- Currency minor-unit conversion
- Visibility decisions
- Duplicate candidate logic
- Wishlist conversion rules
- Export formatting

### Component tests

- Record form required and optional fields
- Search/filter controls
- Empty, error, and loading states
- Privacy controls and preview
- Destructive-action confirmations

### Integration tests

- Supabase authentication session behavior
- Database RLS policies
- Storage upload permissions
- Catalogue provider adapter and failure fallback
- Atomic wishlist conversion

### End-to-end tests

- Sign in and complete onboarding
- Add, edit, find, and remove a manual record
- Add from catalogue search
- Add to wishlist and move to collection
- Enable sharing and view as a signed-out visitor
- Verify private data is absent from public responses
- Export CSV and JSON
- Delete an account
- Installability smoke check

## 13. Delivery milestones and progress

### Milestone 0 — Product definition

- [x] Establish product vision and guiding principles
- [x] Agree on mobile-first PWA direction
- [x] Select initial technical stack
- [x] Define MVP feature boundaries
- [x] Create living MVP plan and tracker
- [~] Confirm working product name and visual direction — Cratebook and warm analogue are provisional
- [x] Review and approve this MVP scope

Exit condition: the product scope, main journeys, and technical direction are approved.

### Milestone 1 — Foundation

- [x] Initialize Git repository and Next.js TypeScript application
- [x] Configure formatting, linting, tests, and environment validation
- [x] Establish responsive design tokens and application shell
- [x] Implement phone bottom navigation and desktop adaptation
- [x] Create Supabase project configuration and local migrations
- [x] Implement database foundation and generated types
- [x] Configure email magic-link authentication
- [x] Implement onboarding and profile editing
- [x] Add initial RLS policies and authorization tests
- [x] Create PWA manifest, icons, and metadata foundation
- [x] Establish GitHub Actions CI checks
- [x] Configure hosted Supabase and Vercel production deployment at
      `https://cratebook.vercel.app`
- [-] Verify automatic Vercel Preview deployment and authentication from a pull request —
  deferred until the next pull request and does not block Milestone 2

Exit condition: a user can authenticate, create a profile, navigate the responsive
application, and cannot access another user's private data.

### Milestone 2 — Collection

- [x] Implement release and physical-copy database tables, typed schema, constraints,
      indexes, owner-only RLS, and authorization tests
- [x] Implement atomic, idempotent manual record entry with validation, progressive
      release details, private defaults, and responsive browser coverage
- [x] Build responsive collection grid with intentional empty, loading, and error states
- [x] Build private record detail and release-metadata edit screens with responsive
      loading, not-found, success, validation, and error states
- [x] Add owner-only physical-copy deletion with explicit, cancellable confirmation
- [x] Add favorites, ratings, private notes, acquisition data, currency-aware prices,
      purchase state, and Goldmine media/sleeve conditions
- [x] Add reusable owner-scoped user tags with case-insensitive normalization,
      atomic record editing, RLS coverage, and responsive collection/detail display
- [x] Add owner-scoped collection search across release metadata, tags, and private
      notes, plus favorite, purchase-state, format, and condition filters and
      newest-added, recently-acquired, artist, and title sorting
- [x] Add owner-scoped, case-insensitive duplicate detection that collapses whitespace,
      warns before saving, links to an existing copy, and still permits another copy
- [-] Add personal-copy photo upload — deferred until after the MVP
- [x] Verify collection journeys on desktop Chromium, Firefox, and WebKit plus Android
      Chrome and iPhone Safari profiles, including responsive overflow coverage

Exit condition: users can reliably maintain and search a private collection using a phone.

### Milestone 3 — Wishlist and catalogue discovery

- [x] Implement wishlist tables and RLS policies with private defaults, same-owner
      release references, typed priorities, validation, indexes, and authorization tests
- [x] Build responsive wishlist list, detail, manual add, edit, and confirmed remove
      flows with loading, empty, success, not-found, and error states
- [x] Add validated priority, preferred edition, currency-aware target price, private
      notes, and explicit private-by-default visibility controls
- [x] Implement atomic, idempotent wishlist-to-collection conversion that reuses the
      release, collects copy-specific details, preserves editable notes, normalizes
      tags, removes the wish only on success, and keeps the new copy private
- [x] Select and document MusicBrainz releases as the first catalogue provider, with
      Cover Art Archive as the optional artwork companion
- [x] Review provider terms, attribution, image policy, caching, and limits in
      `docs/catalogue-provider.md`
- [x] Build a provider-neutral, server-only MusicBrainz adapter with validated and
      normalized release/cover responses, caching, request coalescing, throttling,
      bounded retries and timeouts, safe query construction, and typed failure states
- [x] Build responsive catalogue search, pressing-aware result cards, exact-release
      review with optional artwork attribution, and safe collection/wishlist prefills
- [x] Provide manual collection and wishlist fallbacks for missing results, invalid
      input, rate limits, malformed responses, upstream errors, and failed prefills
- [x] Store server-verified source identifiers, bounded provenance, and optional remote
      cover references while reusing owner-scoped releases without overwriting edits
- [x] Preserve selected catalogue artwork through collection and wishlist saves, and
      backfill a missing cover when an owner-scoped catalogue release is reused
- [x] Test ambiguous releases and external-service failure across provider, persistence,
      result-selection, review, and manual-recovery boundaries

#### Album-first catalogue revision

Product direction: Cratebook is a fast personal collection and wishlist, not a Discogs
replacement. The default discovery flow identifies a recognizable album; identifying
an exact physical pressing remains optional advanced detail.

- [x] Define a repeatable catalogue-quality fixture covering famous artists, common
      albums, less-common albums, punctuation/diacritics, partial titles, barcodes, and
      catalogue numbers; record current MusicBrainz release-search recall as the 4/14
      (28.6%) baseline in `catalogue-quality/`
- [x] Evaluate MusicBrainz release-group search and Apple iTunes album search against
      the catalogue-quality fixture, including API access, rate limits, attribution,
      durable metadata and image-reference rights, failure behavior, and future
      commercial use; select MusicBrainz release groups with Cover Art Archive before
      integration
- [x] Define the album-level data and provenance contract so a quick-added album never
      claims to identify the user's exact pressing; preserve existing exact-release
      records and determine whether a schema migration is required
- [x] Build provider-neutral album discovery with broader matching, pagination where
      supported, deterministic deduplication, typed failures, caching, throttling, and
      a permanent manual fallback
- [x] Replace the default pressing-heavy results with responsive, cover-first album
      cards showing one recognizable result per album and clear collection/wishlist
      actions
- [x] Implement collection and wishlist quick-add using only artist, album title,
      representative artwork, and known original year; keep format, pressing, copy,
      price, condition, and personal details optional and editable afterward
- [x] Retain exact MusicBrainz release selection as an optional **Choose a specific
      edition** path rather than a prerequisite for catalogue-assisted entry
- [x] Add an optional **Find album artwork** action to manual collection and wishlist
      entry, with validated suggestions, an explicit no-cover choice, clear source
      attribution, and no requirement to select an exact release
- [x] Preserve existing catalogue items and wishlist conversions across album-level and
      exact-release provenance, including duplicate warnings and cover behavior
- [x] Add provider, normalization, persistence, component, accessibility, and
      authenticated desktop/mobile browser coverage for quick add, insufficient
      results, ambiguous albums, missing artwork, invalid artwork, provider failure,
      manual recovery, and optional exact-edition selection
- [x] Update README usage guidance and catalogue-provider documentation, and verify
      that every required migration is deployed
- [-] Verify the complete authenticated album-first journey in production — deferred
  at the owner's direction after local desktop/mobile journey verification and a
  public production smoke check; no hosted catalogue data was modified

Exit condition: users can find and add a recognizable album to their collection or
wishlist in under 30 seconds without knowing its exact pressing; pressing details remain
optional, manual entry always works, and wishlist conversion requires no re-entry.

#### Pre-Milestone 4 UI and catalogue polish

This quality pass resolves observed navigation, loading, artwork, and control problems
before public sharing work begins. Preserve the album-first behavior and existing
catalogue provenance guarantees. Do not modify hosted production data while verifying
these changes; use local authenticated fixtures unless the owner separately authorizes
a production mutation.

Implementation decisions for this pass:

- Treat Add as one of four equal bottom-navigation destinations. Keep it visually
  prominent with a compact filled icon treatment and a visible **Add** label, but do not
  float it above or overlap the navigation bar.
- Use the built-in Next.js/Vercel image optimizer and its cache for remote Cover Art
  Archive images before considering managed copies in Supabase Storage. Retain remote
  source references and the existing broken-image fallback. Durable copied artwork is
  outside this pass unless cache verification demonstrates that it is necessary.
- Selecting artwork while editing changes the cover and its artwork attribution only.
  It must not silently replace or promote the record's manual, release-group, or exact-
  release catalogue identity, and it must not overwrite unrelated user edits.

- [x] Standardize secondary pill controls across collection, wishlist, catalogue,
      settings, forms, pagination, recovery states, and confirmation dialogs
  - Inventory button- and link-backed `.secondary-button` uses, including intentional
    responsive or full-width variants.
  - Establish one shared `inline-flex` contract with both-axis centering, predictable
    line height, consistent height/padding, centered wrapping, and phone-sized targets.
  - Make hover, focus-visible, active, disabled, and pending states consistent; review
    adjacent danger and primary controls without changing their semantic hierarchy.
  - Remove redundant page-specific alignment overrides.
  - Cover short and wrapped labels and representative actions such as **Add to
    wishlist**, **Choose a specific edition**, **Cancel**, and **Edit wish** in automated
    and desktop/mobile browser checks.

- [x] Replace the floating Add action with a clean, accessible four-item bottom
      navigation
  - Replace the asymmetric grid and negative vertical translation with four equal
    destinations: Collection, Wishlist, Add, and Profile.
  - Keep Add visually prominent with a compact filled plus icon and visible **Add** label
    while aligning its full target with the other tabs.
  - Add an accessible current-route treatment for all four destinations.
  - Verify keyboard access, touch targets, safe-area handling, content clearance, equal
    placement, and no overlap at narrow and desktop widths.

- [x] Remove the decorative-disc flash when navigating to catalogue search
  - Reproduce the transition under normal and throttled loading and confirm the route
    segment loading UI is the source.
  - Replace the skeleton's `.collection-cover` combination with a neutral primitive
    matching the final header, search form, and result-card geometry.
  - Prevent misleading empty content, an oversized disc, layout jumps, duplicate
    controls, and unwanted animation when reduced motion is requested.
  - Add loading-state component coverage and a desktop/mobile browser transition
    regression check from **Search the catalogue**.

- [x] Improve wishlist and collection artwork delivery with responsive Next.js/Vercel
      image optimization and caching
  - Remove the shared `ReleaseCover` component's `unoptimized` bypass after confirming
    the configured release and release-group Cover Art Archive URL patterns.
  - Configure responsive sizes deliberately, lazy-load grid images, prioritize only
    genuinely above-fold artwork, and retain fixed aspect ratios.
  - Preserve safe URL validation, alternative-text behavior, and deterministic
    missing/broken-image fallbacks.
  - Cover optimized rendering, both catalogue entity URL shapes, failures, responsive
    sizing, repeated-request caching, and throttled layout stability in automated and
    browser checks.
  - Update provider or setup documentation only if actual cache behavior changes it;
    do not introduce managed Supabase artwork copies during this task without evidence
    that the platform cache is insufficient.

- [x] Add album-artwork finding, replacement, and removal to collection record editing
  - Reuse the authenticated manual-entry artwork finder and initialize it from the
    record's current safe cover without changing typed artist/title values.
  - Define explicit keep, choose, replace, and remove states; never infer removal from a
    failed request or stale client selection.
  - Extend the owner-scoped atomic update boundary to validate and save `cover_url` and
    bounded artwork attribution while preserving metadata, copy details, tags, and the
    existing external source, entity type, external ID, and source identity.
  - Keep manual records manual and exact releases exact when representative artwork is
    chosen. If independent artwork attribution cannot satisfy existing constraints, add
    the smallest typed migration needed instead of weakening catalogue identity.
  - Test unsafe hosts, oversized provenance, cross-user access, atomic failure,
    select/replace/remove/provider-failure behavior, route revalidation, and authenticated
    desktop/mobile editing of a coverless item; regenerate database types after any
    migration.

- [x] Complete and document the pre-Milestone 4 polish verification
  - Run formatting, lint, type-check, focused and full unit/component tests, production
    build, database reset/tests/type comparison when schema changes, and authenticated
    Playwright coverage on supported desktop and mobile projects.
  - Check computed pill alignment, navigation geometry, catalogue transitions, throttled
    artwork loading, console errors, keyboard operation, reduced motion, and overflow.
  - Update README only for actual setup or usage changes and update checkboxes and the
    progress log only for completed, verified work.
  - Commit and push completed work without including unrelated files or modifying hosted
    production data.

Polish exit condition: secondary controls are consistently aligned and accessible; the
four bottom destinations do not overlap content; catalogue navigation has no decorative
disc flash; remote cover art uses verified responsive caching and resilient fallbacks;
and a user can add, replace, or remove collection artwork during editing without changing
the record's catalogue identity.

### Milestone 4 — Sharing, portability, and MVP release

- [x] Implement profile-level public/private control
- [x] Implement item-level visibility controls
- [x] Build public collection and wishlist profile
- [x] Add public-preview mode
- [x] Verify private-field exclusion at query/API level
- [x] Implement CSV export
- [x] Implement full JSON export
- [x] Implement account and image deletion flow
- [x] Finish installable PWA assets and behavior with stable app identity, collection-
      first launch, collection/wishlist/add shortcuts, complete any/maskable/Apple icon
      coverage, a native install prompt when available, accessible browser-specific
      fallback guidance, and explicit network-dependent MVP expectations
- [x] Complete accessibility review with WCAG 2.2 A/AA axe coverage across the
      primary signed-out and authenticated journeys, corrected color contrast,
      authenticated skip navigation, destructive-cancellation focus restoration,
      decorative preview isolation, and desktop/mobile browser verification
- [x] Complete performance review with bounded, server-rendered 24-record pagination
      for collection, wishlist, and independent public-profile sections; preserve
      filters without client state; document the optimized-build request, transfer,
      paint, and layout-shift baseline; and verify desktop/mobile production behavior
- [ ] Complete security and privacy review
- [ ] Run full automated and manual release tests
- [ ] Deploy production application and document operations

Exit condition: the MVP is secure, installable, shareable, portable, and usable by
invited collectors without developer assistance.

## 14. Explicitly outside the MVP

- Marketplace, payments, selling, and auctions
- Trades or loans between users
- Following system, activity feed, likes, and public comments
- Direct messages
- Automated market valuations
- Spotify, Apple Music, or listening-history integration
- Push notifications
- Complex offline writes and synchronization
- Guaranteed exact-pressing recognition
- AI-driven recommendations
- Social moderation system beyond basic public-profile safeguards
- Native App Store and Google Play release

These items require a scope decision before being promoted into an MVP milestone.

## 15. Post-MVP candidate backlog

- Barcode scanning with candidate confirmation
- Random-record picker (“What should I spin?”)
- Last-played date and play count
- Listening diary
- Collection statistics and private spend summaries
- Shelf, crate, or room location
- Lending tracker
- Private/unlisted sharing links
- Gift-friendly wishlist behavior
- Friends, reactions, and recommendations
- Collection imports from other services
- Enhanced exports and printable wishlist
- Offline read access to recent collection data
- Capacitor iOS and Android applications
- Camera-assisted cover or catalogue recognition
- Personal-copy photo uploads

## 16. Risks and mitigations

| Risk                                                       | Mitigation                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Exact editions confuse beginners                           | Require only artist/title and collapse advanced fields                 |
| Catalogue provider changes or becomes unavailable          | Provider adapter, manual entry, stored provenance, documented policies |
| Public pages leak sensitive purchase data                  | Safe public projections, RLS, signed-out and cross-user tests          |
| PWA is mistaken for a fully native app                     | Set expectations and validate Capacitor separately after MVP           |
| Offline writes create conflicts or data loss               | Defer writes until sync and conflict behavior is designed              |
| Duplicate shared release metadata becomes inconsistent     | Start with conservative normalization and preserve source identifiers  |
| Cover art rights or hotlinking restrictions cause problems | Review provider terms and support user-owned/manual images             |
| Rich metadata makes the add flow slow                      | Progressive disclosure and a strict under-30-second basic path         |

## 17. Open decisions

- [ ] Confirm **Cratebook** as the product name or choose another name.
- [ ] Select the visual personality: warm analogue, clean archival, or another direction.
- [x] Keep collection and wishlist items private by default, including when the profile
      is public; owners explicitly opt individual items into sharing.
- [x] Use Goldmine-compatible condition grades; beginner-facing guidance remains a UI task.
- [x] Use MusicBrainz releases as the first external catalogue provider, with Cover Art
      Archive as the artwork companion.
- [x] Reference Cover Art Archive thumbnails remotely for the MVP; do not copy them to
      Supabase Storage.
- [x] Make the default discovery experience album-first and keep exact pressing
      identification as an optional advanced path.
- [x] Allow representative album artwork in collection and wishlist browsing without
      claiming that it depicts the user's exact physical pressing.
- [x] Use MusicBrainz release groups with Cover Art Archive representative fronts for
      album discovery; do not integrate Apple iTunes artwork under its promotional-use
      terms.
- [x] Defer photos of a user's physical copy until after the MVP.
- [x] Accept uppercase ISO 4217-style currency codes and whole acquisition dates.
- [x] Keep Add as a non-overlapping, labelled destination in the four-item bottom
      navigation rather than a floating action that covers adjacent controls.
- [x] Use Next.js/Vercel image optimization and caching for remote Cover Art Archive
      references before introducing managed artwork copies in Supabase Storage.
- [x] Allow collection artwork to be changed independently during editing without
      changing the record's manual, album-level, or exact-release catalogue identity.
- [x] Keep public profiles out of search-engine indexes by default for the MVP; direct
      share links remain usable.

None of these decisions should block project scaffolding except where explicitly noted.

## 18. Definition of done

A feature is complete only when:

- Acceptance criteria are satisfied.
- Responsive phone and desktop states are implemented.
- Loading, empty, success, and error states are handled.
- Authorization and privacy implications are reviewed.
- Relevant automated tests pass.
- Accessibility is checked for the affected journey.
- No secrets or private fields are exposed to the client or public response.
- This progress tracker and relevant documentation are updated.

The MVP is complete when every Milestone 1–4 exit condition is met, remaining
limitations are documented, and a fresh user can complete all core journeys in the
production environment.

## 19. Decision log

| Date       | Decision                                                                                                                                     | Reason                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-09 | Build a mobile-first web application and installable PWA first                                                                               | Most usage is on phones, while links and public profiles should work without installation                                                                                                                         |
| 2026-09-09 | Plan Capacitor as the route to native stores after validation                                                                                | Reuses the web codebase while allowing later access to native APIs                                                                                                                                                |
| 2026-09-09 | Use Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel                                                                                  | One pragmatic stack covers UI, public pages, data, auth, storage, and deployment                                                                                                                                  |
| 2026-09-09 | Keep manual record entry as a permanent capability                                                                                           | External catalogues cannot reliably contain or identify every physical release                                                                                                                                    |
| 2026-09-09 | Model a release separately from a user's physical copy                                                                                       | Supports copy-specific condition, provenance, privacy, and multiple pressings                                                                                                                                     |
| 2026-09-09 | Keep social-network features outside the MVP                                                                                                 | Sharing through a URL validates social value without feed and moderation complexity                                                                                                                               |
| 2026-09-09 | Use Cratebook and a warm analogue visual language provisionally                                                                              | Establishes a coherent foundation without making the branding irreversible                                                                                                                                        |
| 2026-09-09 | Use Next.js's webpack production builder initially                                                                                           | Turbopack cannot create its internal CSS worker process in the development environment                                                                                                                            |
| 2026-09-09 | Defer hosted preview deployment without blocking collection work                                                                             | Local integration was verified while hosted Supabase and Vercel required owner setup                                                                                                                              |
| 2026-09-09 | Use one hosted Supabase project for initial Vercel environments                                                                              | This keeps the MVP setup simple; isolated staging data or database branches can come later                                                                                                                        |
| 2026-09-10 | Use `https://cratebook.vercel.app` as the initial production URL                                                                             | Hosted Supabase, Vercel deployment, authentication, and primary foundation flows are live                                                                                                                         |
| 2026-09-10 | Use Goldmine condition grades and ISO-style currency codes                                                                                   | Familiar record grading supports collectors, while three-letter codes avoid prematurely limiting currencies                                                                                                       |
| 2026-09-10 | Keep release rows user-scoped and collection items private by default                                                                        | Prevents private metadata leaks while allowing multiple copies and later wishlist reuse                                                                                                                           |
| 2026-09-10 | Delete a physical copy without deleting its shared release row                                                                               | Prevents removing edition metadata that another owned copy or future wishlist item may still reference                                                                                                            |
| 2026-09-10 | Convert prices using the entered currency's standard fraction digits                                                                         | Preserves accurate minor units for two-, zero-, and three-decimal currencies without floating-point writes                                                                                                        |
| 2026-09-10 | Normalize tags case-insensitively and limit each copy to 20 tags                                                                             | Reusable owner-scoped tags stay tidy and searchable while the comma-separated phone UI remains lightweight                                                                                                        |
| 2026-09-10 | Keep collection discovery state in validated URL parameters                                                                                  | Bookmarkable server-rendered controls pair with an owner-only search function for private fields                                                                                                                  |
| 2026-09-10 | Treat normalized artist and title matches as possible duplicates                                                                             | A private warning catches likely repeats while preserving intentional ownership of multiple physical copies                                                                                                       |
| 2026-09-10 | Defer personal-copy photos until after the MVP                                                                                               | Collection maintenance is complete without uploads, while storage lifecycle and account-deletion behavior can be designed together later                                                                          |
| 2026-09-10 | Reuse owner-scoped releases for one private-by-default wishlist item per user/release                                                        | Avoids duplicating metadata, preserves the existing privacy boundary, and prepares for atomic wishlist conversion                                                                                                 |
| 2026-09-10 | Remove unreferenced release rows when a wishlist item is deleted                                                                             | Prevents orphaned metadata while preserving releases still referenced by a physical copy                                                                                                                          |
| 2026-09-10 | Prefill wishlist notes during conversion, keep the new copy private, and do not infer price paid from the wishlist limit                     | Preserves the user's context while keeping acquisition facts explicit and maintaining the established private default                                                                                             |
| 2026-09-10 | Use MusicBrainz releases for catalogue metadata and Cover Art Archive for optional remotely referenced artwork                               | MusicBrainz provides pressing-aware CC0 core metadata without user credentials; the companion archive uses the same release identifiers                                                                           |
| 2026-09-10 | Persist bounded MusicBrainz provenance, credit its source, and keep catalogue search behind a rate-limited server adapter                    | Traceable user-owned records and a permanent manual path preserve usefulness without exposing an unrestricted proxy or provider coupling                                                                          |
| 2026-09-11 | Resolve the exact MusicBrainz release after selection and prefill only release-level facts                                                   | Avoids trusting stale search summaries and keeps condition, acquisition, price, rating, and personal notes explicit user-owned facts                                                                              |
| 2026-09-11 | Reuse an owner-scoped release for repeated catalogue selections without overwriting its existing metadata                                    | Preserves user edits, supports multiple physical copies, and lets collection and wishlist items share one traced MusicBrainz release                                                                              |
| 2026-09-11 | Carry validated Cover Art Archive references through catalogue saves and backfill only missing artwork on release reuse                      | Prevents transient repeat artwork requests from dropping a selected cover without overwriting an existing cover or other release edits                                                                            |
| 2026-09-12 | Make catalogue discovery album-first, use representative artwork, and keep exact pressing selection optional                                 | Cratebook prioritizes quick, recognizable collection and wishlist entry over Discogs-style edition cataloguing                                                                                                    |
| 2026-09-12 | Use MusicBrainz release groups with Cover Art Archive representative fronts for album-first discovery; do not integrate Apple iTunes artwork | Release groups recalled 14/14 fixture albums with artwork available for all matches, while Apple recalled 9/14 and its promotional-content terms do not fit durable personal collection artwork                   |
| 2026-09-12 | Persist catalogue identity as provider, entity type, and MBID; backfill existing MusicBrainz rows as exact releases                          | Release-group and release MBIDs belong to different namespaces, and explicit provenance prevents an album quick add from implying a specific pressing                                                             |
| 2026-09-12 | Scope catalogue release reuse by provider, entity type, and MBID while retaining the existing RPC signatures                                 | Deriving entity type from server-verified provenance prevents release-group/exact-release collisions without creating a breaking application/database deployment order                                            |
| 2026-09-12 | Scope optional exact-edition discovery to the selected album and keep album-level actions available throughout the path                      | Experienced collectors can compare pressing clues without turning exact identification into a prerequisite or losing the fast album-first fallback                                                                |
| 2026-09-12 | Let manual collection and wishlist entries optionally adopt validated release-group artwork without replacing user-entered names             | Representative art improves browsing without requiring edition identification; clearing stale selections and retaining an explicit no-cover path keeps manual entry authoritative                                 |
| 2026-09-12 | Defer the authenticated production album-first journey after local verification and a public production smoke check                          | The owner requested that the live magic-link and data-mutation check be skipped; no hosted catalogue data or external configuration should be changed for this closeout                                           |
| 2026-09-12 | Complete a focused UI and catalogue polish pass before beginning Milestone 4                                                                 | Observed control alignment, navigation overlap, loading flash, cover latency, and artwork maintenance issues affect the existing private collection journeys and should be resolved before adding public surfaces |
| 2026-09-12 | Make Add a labelled, non-overlapping fourth bottom-navigation tab                                                                            | Equal navigation destinations provide cleaner geometry, safe-area behavior, and accessibility than the negatively translated floating action                                                                      |
| 2026-09-12 | Enable Next.js/Vercel optimization for remote Cover Art Archive images before considering managed copies                                     | The existing shared image component bypasses an already configured optimizer; using the platform cache improves delivery without adding storage lifecycle and image-deletion obligations                          |
| 2026-09-12 | Keep editable artwork attribution separate from a record's catalogue identity                                                                | A representative cover can improve browsing, but selecting it must not turn a manual entry or exact pressing into a different catalogue entity                                                                    |
| 2026-09-13 | Keep every collection and wishlist item private until its owner explicitly makes that item visible                                           | A public profile should not retroactively expose an existing library; per-item opt-in matches Cratebook's private-by-default promise and keeps sharing understandable                                             |
| 2026-09-13 | Keep public profile pages out of search-engine indexes by default for the MVP                                                                | A deliberate link-sharing model is more consistent with private-by-default expectations; broader discoverability can be reconsidered after collectors understand the control                                      |
| 2026-09-13 | Use the real public-profile route for owner preview, including while the profile is private                                                  | One owner-aware safe projection keeps the preview identical to the visitor view while preserving private/missing equivalence for everyone else                                                                    |
| 2026-09-13 | Export collection and wishlist as separate UTF-8 CSV files with private details and spreadsheet-injection protection                         | Distinct schemas stay readable in ordinary spreadsheet software; full raw provenance belongs in the complete JSON backup, while formula-like user text must remain inert                                          |
| 2026-09-13 | Export complete domain backups as versioned JSON without managed authentication or session data                                              | Raw owner-scoped rows preserve private details, relationships, and catalogue provenance while keeping portability independent of Supabase Auth                                                                    |
| 2026-09-13 | Hard-delete the authenticated Supabase user through a server-only Admin API after typed confirmation                                         | Existing foreign-key cascades remove every owner-scoped domain row; the MVP owns no uploaded images, and future Storage objects must be removed before deleting their owner                                       |
| 2026-09-13 | Keep the installed MVP network-dependent, give it a stable root identity, and launch into the collection                                     | Installation should make the existing online companion easier to reach without implying offline support; a stable identity allows launch behavior to evolve without creating a duplicate installed app            |
| 2026-09-13 | Bound collection, wishlist, and public-profile lists to 24 records per server-rendered page                                                  | Keeps database responses, rendered DOM size, and image work predictable as crates grow while preserving shareable filter and page URLs without adding client-side state                                           |

## 20. Progress log

Add concise entries after meaningful work sessions. Detailed technical history belongs
in version control; this log records product-level progress and changes.

| Date       | Milestone | Progress                                                                                                                                                                                                                                                                                                                                                     | Next step                                                              |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 2026-09-09 | 0         | Created the initial product specification, architecture, scope, and tracker                                                                                                                                                                                                                                                                                  | Review scope and settle the first open design decisions                |
| 2026-09-09 | 1         | Built the responsive public experience, protected app shell, locally verified passwordless auth/onboarding, typed profile schema/RLS, PWA assets, and automated test foundation; 23 database tests pass                                                                                                                                                      | Connect a hosted Supabase project and complete profile settings and CI |
| 2026-09-09 | 1         | Closed Milestone 1 locally with profile/privacy editing and GitHub Actions gates for application, browser, and database checks                                                                                                                                                                                                                               | Begin Milestone 2 with release and physical-copy tables                |
| 2026-09-09 | 1         | Documented the exact hosted Supabase migration, Vercel Git deployment, environment variables, authentication redirects, and hosted smoke test                                                                                                                                                                                                                | Complete the external hosting checklist before inviting testers        |
| 2026-09-10 | 1         | Deployed hosted Supabase and Vercel production at `https://cratebook.vercel.app`; verified passwordless auth, onboarding, protected routes, collection access, profile editing, manifest, and PWA icons                                                                                                                                                      | Verify one pull-request Preview while Milestone 2 proceeds             |
| 2026-09-10 | 2         | Added typed release and physical-copy tables with validation, indexing, idempotency keys, private defaults, owner-only RLS, same-owner foreign keys, generated TypeScript types, and 44 collection database assertions                                                                                                                                       | Build manual record entry on the verified collection schema            |
| 2026-09-10 | 2         | Built phone-first manual entry with required artist/title, progressive edition fields, server validation, atomic idempotent persistence, saved-record confirmation, a real auth-to-entry browser journey, and deployed both Milestone 2 migrations to hosted Supabase                                                                                        | Build the collection grid/list and complete its empty and error states |
| 2026-09-10 | 2         | Built the newest-first responsive collection grid with resilient sparse metadata, generated cover placeholders, intentional empty/loading/error states, component coverage, and authenticated desktop and mobile browser verification                                                                                                                        | Build record detail and edit screens                                   |
| 2026-09-10 | 2         | Built private record detail and release-metadata edit routes with shared validated fields, ownership-safe lookups and updates, responsive loading/not-found/error states, and authenticated edit verification on desktop Chrome, Android Chrome, and iPhone Safari                                                                                           | Add deletion with confirmation                                         |
| 2026-09-10 | 2         | Added owner-only physical-copy deletion with an explicit cancellable confirmation, non-destructive shared-release handling, failure and success messaging, RLS coverage, and authenticated desktop and mobile browser verification                                                                                                                           | Add favorites, ratings, notes, acquisition data, and conditions        |
| 2026-09-10 | 2         | Added atomic personal-copy editing for favorites, ratings, private notes, purchase state, Goldmine conditions, acquisition provenance, dates, and currency-aware prices; surfaced details and favorites across private detail/grid views and verified desktop/mobile journeys                                                                                | Add user tags                                                          |
| 2026-09-10 | 2         | Added reusable owner-scoped tags with normalized uniqueness, same-owner foreign keys, RLS, atomic edit/clear behavior, validation, collection/detail chips, generated types, and database, component, desktop Chrome, Android Chrome, and iPhone Safari coverage                                                                                             | Add collection search, filters, and sorting                            |
| 2026-09-10 | 2         | Added owner-scoped collection search across release metadata, tags, and private notes; combined filters, URL sorting, no-result recovery, indexes, and database/component/desktop/mobile browser coverage                                                                                                                                                    | Add non-blocking duplicate detection                                   |
| 2026-09-10 | 2         | Added owner-scoped duplicate detection using case-insensitive artist/title equality with collapsed whitespace, an existing-copy review link, explicit add-another-copy confirmation, and database, component, desktop, and mobile browser coverage                                                                                                           | Decide whether personal-copy photos remain in the MVP                  |
| 2026-09-10 | 2         | Deferred personal-copy photos; completed the authenticated collection journey across desktop Chromium, Firefox, and WebKit plus Android Chrome and iPhone Safari, added overflow assertions and persistent cross-browser CI smoke coverage, and fixed a post-delete revalidation race                                                                        | Begin Milestone 3 with wishlist tables and owner-only RLS              |
| 2026-09-10 | 3         | Added the typed wishlist schema with private defaults, priority and target-price validation, one-item-per-release enforcement, same-owner release integrity, indexes, timestamps, least-privilege grants, owner-only RLS, generated TypeScript types, and 40 database assertions                                                                             | Build wishlist list, detail, add, edit, and remove flows               |
| 2026-09-10 | 3         | Built the responsive manual wishlist journey with atomic idempotent creation and editing, safe release cleanup on removal, priority, preferred edition, currency-aware target prices, private notes, visibility guidance, intentional route states, generated types, unit/component/database coverage, and authenticated desktop/mobile browser verification | Implement atomic wishlist-to-collection conversion                     |
| 2026-09-10 | 3         | Added atomic, idempotent wishlist-to-collection conversion with release reuse, editable note carryover, private copy defaults, acquisition details, normalized tags, rollback and authorization coverage, generated types, and authenticated desktop/mobile browser verification                                                                             | Select and document the external catalogue provider                    |
| 2026-09-10 | 3         | Selected MusicBrainz releases with Cover Art Archive artwork after reviewing licensing, attribution, image handling, caching, rate limits, failure behavior, provenance, and Discogs tradeoffs; chose remote artwork references and documented the server-only integration contract                                                                          | Build the server-side provider adapter                                 |
| 2026-09-10 | 3         | Built the provider-neutral, server-only MusicBrainz and Cover Art Archive adapter with validated normalized metadata, bounded provenance, safe Lucene queries, explicit cache lifetimes, in-flight coalescing, one-second request serialization, bounded retry/timeout behavior, typed failures, and focused automated coverage                              | Build catalogue search and result selection                            |
| 2026-09-11 | 3         | Built responsive server-rendered catalogue search with pressing-aware MusicBrainz results, exact-release review, optional Cover Art Archive display and attribution, safe collection/wishlist form prefills, loading/error/not-found states, and permanent manual fallbacks without adding provider credentials                                              | Store source identifiers, provenance, and remote cover references      |
| 2026-09-11 | 3         | Persisted server-verified MusicBrainz release IDs, bounded source snapshots, and optional Cover Art Archive references through atomic collection/wishlist mutations; reused matching owner-scoped releases without overwriting edits and surfaced safe artwork and source attribution in private browse/detail views                                         | Test ambiguous releases and external-service failure                   |
| 2026-09-11 | 3         | Applied the catalogue-provenance migration to production and completed Milestone 3 with explicit coverage for near-identical release choices, upstream timeouts and failures, missing artwork, exact-release review recovery, and permanent manual paths                                                                                                     | Begin Milestone 4 with public-profile privacy controls                 |
| 2026-09-11 | 3         | Fixed catalogue cover loss by carrying exact-release-validated Cover Art Archive references from review through collection and wishlist submission, avoiding repeat artwork fetches, and safely backfilling missing artwork when an owner-scoped catalogue release is reused; verified application and database coverage                                     | Begin Milestone 4 with public-profile privacy controls                 |
| 2026-09-12 | 3         | Reopened catalogue discovery around an agreed album-first product direction: representative cover artwork is sufficient for browsing, exact pressing identification becomes optional, and rapid collection/wishlist capture takes priority over Discogs-style completeness                                                                                   | Benchmark current recall and select the broader album/artwork source   |
| 2026-09-12 | 3         | Added a versioned 14-case catalogue-quality fixture, a rate-considerate repeatable benchmark runner, automated fixture/baseline validation, and the current exact-release MusicBrainz baseline: 4/14 albums recalled (28.6%), with no recall for less-common albums, partial titles, barcodes, or catalogue numbers                                          | Compare MusicBrainz release groups and a broader album/artwork source  |
| 2026-09-12 | 3         | Compared album sources against the fixture: MusicBrainz release groups recalled 14/14 with representative Cover Art Archive fronts available for every match; Apple iTunes recalled 9/14 but failed identifiers and has incompatible promotional-artwork terms. Selected MusicBrainz release groups plus Cover Art Archive for integration                   | Define the album-level data and provenance contract                    |
| 2026-09-12 | 3         | Defined, implemented, and deployed the album-level identity contract: catalogue rows now distinguish release groups from exact releases, provenance must match the declared entity and MBID, representative artwork is entity-scoped, and existing MusicBrainz rows are preserved as exact releases                                                          | Build provider-neutral album discovery                                 |
| 2026-09-12 | 3         | Built provider-neutral album discovery with broad token-wise MusicBrainz release-group search, identifier-to-album resolution, bounded pagination, stable MBID deduplication, normalized provenance, representative artwork references, shared caching/throttling/retries, typed lookup and failure states, and permanent manual recovery boundaries         | Replace pressing-heavy results with cover-first album cards            |
| 2026-09-12 | 3         | Replaced default pressing-heavy search with responsive, paginated cover-first album cards, explicit representative-artwork and pressing-not-selected guidance, clear collection/wishlist destinations, and server-validated album-level form prefills; verified component, desktop Chromium, and Android Chrome coverage                                     | Implement collection and wishlist album quick-add persistence          |
| 2026-09-12 | 3         | Implemented collection and wishlist album quick-add with server-reverified release-group identity, representative artwork, known original year, blank optional pressing/copy fields, entity-scoped owner reuse, and real Cover Art Archive response handling; verified database, component, desktop Chromium, and Android Chrome coverage                    | Retain exact-release selection as an optional specific-edition path    |
| 2026-09-12 | 3         | Restored exact MusicBrainz release selection as an optional album-scoped path with paginated vinyl editions, pressing clues, contextual release review, album-level fallbacks for no results and provider failure, responsive desktop/mobile coverage, and unchanged provenance persistence boundaries                                                       | Add optional artwork finding to manual collection and wishlist entry   |
| 2026-09-12 | 3         | Added optional manual-entry artwork finding for collection and wishlist forms with authenticated MusicBrainz album search, server-validated Cover Art Archive suggestions, explicit no-cover handling, source attribution, stale-selection clearing, and responsive automated coverage                                                                       | Verify provenance preservation across album and exact-release flows    |
| 2026-09-12 | 3         | Preserved shared release identity, entity-scoped MusicBrainz provenance, representative/exact Cover Art Archive references, known album metadata, and private defaults through album-level and exact-release wishlist conversion; added a non-blocking owned-copy warning that retains entered copy details and verified the flow on desktop and mobile      | Complete album-first resilience and accessibility coverage             |
| 2026-09-12 | 3         | Completed album-first resilience and accessibility coverage with WCAG A/AA browser gates, accessible ambiguous-album labels, broken-cover fallbacks, and verified failure/manual recovery across component, persistence, desktop, and mobile tests                                                                                                           | Update provider documentation and verify production end to end         |
| 2026-09-12 | 3         | Closed the album-first revision with updated usage/provider guidance, all 14 hosted migrations confirmed, application/database checks passing, the complete authenticated local journey verified on desktop and mobile, and a public production smoke check; the owner deferred the authenticated production run and no hosted catalogue data was changed    | Begin Milestone 4 with profile-level privacy controls                  |
| 2026-09-12 | 3         | Reopened Milestone 3 for a documented pre-Milestone 4 quality pass covering secondary-control alignment, a non-overlapping four-tab bottom navigation, catalogue loading-flash removal, optimized remote artwork delivery, and artwork selection during collection editing; implementation remains unchecked pending code and browser verification           | Standardize secondary controls and replace the floating Add action     |
| 2026-09-12 | 3         | Standardized link- and button-backed secondary pill controls with shared centering, wrapped-label geometry, phone-sized targets, and consistent hover, focus, active, disabled, and pending states; removed redundant alignment overrides and verified representative catalogue, form, wishlist, recovery, and confirmation actions on desktop and mobile    | Replace the floating Add action with equal bottom navigation           |
| 2026-09-12 | 3         | Replaced the floating Add control with four equal, labelled bottom-navigation destinations; added nested-route current states, a compact in-bar Add treatment, safe-area-aware content clearance, keyboard and touch coverage, and authenticated geometry/accessibility checks across desktop Chromium, Android Chrome, and iPhone Safari                    | Remove the decorative-disc flash during catalogue navigation           |
| 2026-09-12 | 3         | Replaced the catalogue route's shared decorative record-cover skeleton with a neutral, inert loading layout matching the final header, search form, and album cards; added an announced busy state, reduced-motion behavior, component coverage, and throttled authenticated transition checks on desktop and Android Chrome                                 | Optimize wishlist and collection artwork delivery                      |
| 2026-09-13 | 3         | Enabled the built-in Next.js optimizer for shared Cover Art Archive artwork with strict release and release-group allowlists, responsive source sets, lazy grid loading, detail-view preloads, fixed square geometry, resilient fallbacks, and a seven-day minimum cache; verified real miss-to-hit caching plus authenticated desktop and mobile journeys   | Add artwork replacement and removal to collection record editing       |
| 2026-09-13 | 3         | Added explicit keep, verified replacement, and removal states to collection editing; stored bounded artwork provenance separately from catalogue identity; preserved unrelated edits atomically; and verified validation, authorization, rollback, component, database, desktop Chromium, Android Chrome, and iPhone Safari coverage                         | Complete and document the pre-Milestone 4 polish verification          |
| 2026-09-13 | 3         | Closed the pre-Milestone 4 polish pass after correcting cross-browser geometry and keyboard-test assumptions; formatting, lint, type-check, 166 unit/component tests, production build, a clean 15-migration reset, 300 database assertions, generated-type parity, and the full authenticated five-project browser matrix all pass                          | Begin Milestone 4 with profile-level public/private control            |
| 2026-09-13 | 4         | Confirmed and completed profile-level privacy control already founded in Milestone 1: profiles remain private by default, only owners can change visibility, anonymous access is granted and revoked by RLS with the toggle, and the authenticated browser journey now verifies both enabling and disabling sharing                                          | Decide the default item visibility and implement item-level controls   |
| 2026-09-13 | 4         | Chose explicit per-item sharing with private defaults; completed collection visibility editing alongside the existing wishlist control through owner-scoped atomic persistence, rollback and cross-user protection, clear private-field guidance, generated types, and authenticated desktop/mobile verification                                             | Build the public collection and wishlist profile                       |
| 2026-09-13 | 4         | Built the signed-out public collection and wishlist profile with private/missing equivalence, no-index metadata, responsive loading/empty/error states, and narrow security-definer projections that exclude prices, sellers, notes, tags, conditions, and provenance; verified 318 database assertions plus accessible desktop/mobile browser journeys      | Add owner-facing public-preview mode                                   |
| 2026-09-13 | 4         | Added owner-only preview on the real public-profile route for private and live profiles, with exact opted-in projections, clear sharing status, settings navigation, and live-link copying; deployed all 17 migrations and verified 175 app tests, 324 database assertions, the production build, and responsive authenticated desktop/mobile behavior       | Implement CSV export                                                   |
| 2026-09-13 | 4         | Added authenticated collection and wishlist CSV downloads with private details, major-unit prices, stable UTF-8 formatting, no-store responses, and formula-injection protection; 190 app tests, 324 database assertions, the build, and accessible desktop/mobile downloads pass                                                                            | Implement full JSON export                                             |
| 2026-09-13 | 4         | Added an authenticated, versioned full JSON backup with every owner-scoped domain table, including private fields, stable relationships, and raw catalogue/artwork provenance; 194 app tests, 324 database assertions, generated-type parity, the build, and desktop/mobile downloads pass                                                                   | Implement account and image deletion flow                              |
| 2026-09-13 | 4         | Added typed-confirmation account deletion through a server-only Supabase Admin client, verified full-domain cascades and session cleanup, documented the current no-upload image lifecycle, and blocked anonymous protected-route rendering; application, database, build, and accessible desktop/mobile browser checks pass                                 | Finish installable PWA assets and behavior                             |
| 2026-09-13 | 4         | Finished PWA installability with stable identity, collection-first launch, shortcuts, full-bleed maskable and Apple icons, native-prompt integration, and accessible browser guidance; formatting, lint, type-check, 210 app tests, build, 331 database assertions, visual review, and 15 browser cases pass                                                 | Complete the accessibility review                                      |
| 2026-09-13 | 4         | Completed full WCAG 2.2 A/AA axe review across primary routes; fixed contrast, skip navigation, destructive-cancellation focus restoration, and decorative preview semantics; 210 app tests, 331 database assertions, build, visual review, and all supported browser projects pass                                                                          | Complete the performance review                                        |
| 2026-09-13 | 4         | Completed the performance review with bounded 24-record server pagination for private and shared lists, filter-preserving URLs, and a documented 13-request, 158 KB, zero-CLS production-build baseline; 215 app tests, 331 database assertions, the build, and authenticated desktop/mobile journeys pass                                                   | Complete the security and privacy review                               |

## 21. Hosted environment checklist

This is an operational follow-up to Milestone 1, not a blocker for collection
development. The exact commands, dashboard paths, and troubleshooting notes are in
the README under **Hosted Supabase and Vercel**.

- [x] Create the `cratebook` project in the owner's Supabase organization
- [x] Save its project reference, URL, publishable key, and database password securely
- [x] Authenticate and link the local Supabase CLI to the hosted project
- [x] Review `supabase db push --dry-run` and apply the committed migrations
- [x] Import `TurkiNizar/cratebook` into the owner's Vercel account
- [x] Configure hosted Supabase URL and publishable key for Preview and Production
- [x] Complete the first Vercel production deployment
- [x] Set the final production Site URL in Vercel and Supabase
- [x] Allow localhost, the exact production callback, and Vercel Preview redirects
- [x] Redeploy after environment-variable changes
- [x] Verify hosted sign-in, onboarding, collection access, and profile editing
- [ ] Verify a pull request receives a working Vercel Preview deployment

Do not mark this checklist complete until the hosted magic-link journey has been
tested. Do not store the database password or any secret/service-role key in Git or
in a browser-exposed `NEXT_PUBLIC_` variable.
