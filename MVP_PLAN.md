# Cratebook MVP Plan

> Living product specification, technical reference, and development tracker.
>
> Last updated: 2026-09-10
> Overall status: **In development**
> Current milestone: **Milestone 2 — Collection**

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
- Photo of the user's copy

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

The collection foundation below is implemented in committed Supabase migrations.
Wishlist, tags, photos, and public projections remain provisional until their milestone
tasks are implemented.

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
- `is_public` — defaults according to an agreed safe policy
- `created_at`, `updated_at`

### `wishlist_items`

- `id`
- `user_id`
- `release_id`
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

### `collection_photos`

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
- [ ] Build collection grid/list and intentional empty state
- [ ] Build record detail and edit screens
- [ ] Add deletion with confirmation
- [ ] Add favorites, ratings, notes, acquisition data, and conditions
- [ ] Add user tags
- [ ] Add search, filters, and sorting
- [ ] Add non-blocking duplicate detection
- [ ] Add personal-copy photo upload
- [ ] Verify collection journeys on target phones and desktop browsers

Exit condition: users can reliably maintain and search a private collection using a phone.

### Milestone 3 — Wishlist and catalogue discovery

- [ ] Implement wishlist tables and RLS policies
- [ ] Build wishlist list, detail, add, edit, and remove flows
- [ ] Add priority, preferred edition, target price, and visibility
- [ ] Implement atomic wishlist-to-collection conversion
- [ ] Select and document the external catalogue provider
- [ ] Review provider terms, attribution, image policy, caching, and limits
- [ ] Build server-side provider adapter
- [ ] Build catalogue search and result selection
- [ ] Provide manual fallback for errors and missing results
- [ ] Store source identifiers and provenance
- [ ] Test ambiguous releases and external-service failure

Exit condition: users can create a wishlist, find catalogue metadata, and convert a
wanted record into an owned copy without re-entering its information.

### Milestone 4 — Sharing, portability, and MVP release

- [ ] Implement profile-level public/private control
- [ ] Implement item-level visibility controls
- [ ] Build public collection and wishlist profile
- [ ] Add public-preview mode
- [ ] Verify private-field exclusion at query/API level
- [ ] Implement CSV export
- [ ] Implement full JSON export
- [ ] Implement account and image deletion flow
- [ ] Finish installable PWA assets and behavior
- [ ] Complete accessibility review
- [ ] Complete performance review
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
- [ ] Decide the default item visibility for users who enable a public profile.
- [x] Use Goldmine-compatible condition grades; beginner-facing guidance remains a UI task.
- [ ] Select the first external catalogue provider after policy and API evaluation.
- [ ] Decide whether catalogue covers are referenced remotely or copied under permitted terms.
- [ ] Decide whether photos of a user's physical copy belong in the MVP or first follow-up.
- [x] Accept uppercase ISO 4217-style currency codes and whole acquisition dates.
- [ ] Decide whether public pages should be indexed by search engines by default.

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

| Date       | Decision                                                              | Reason                                                                                                      |
| ---------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-09-09 | Build a mobile-first web application and installable PWA first        | Most usage is on phones, while links and public profiles should work without installation                   |
| 2026-09-09 | Plan Capacitor as the route to native stores after validation         | Reuses the web codebase while allowing later access to native APIs                                          |
| 2026-09-09 | Use Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel           | One pragmatic stack covers UI, public pages, data, auth, storage, and deployment                            |
| 2026-09-09 | Keep manual record entry as a permanent capability                    | External catalogues cannot reliably contain or identify every physical release                              |
| 2026-09-09 | Model a release separately from a user's physical copy                | Supports copy-specific condition, provenance, privacy, and multiple pressings                               |
| 2026-09-09 | Keep social-network features outside the MVP                          | Sharing through a URL validates social value without feed and moderation complexity                         |
| 2026-09-09 | Use Cratebook and a warm analogue visual language provisionally       | Establishes a coherent foundation without making the branding irreversible                                  |
| 2026-09-09 | Use Next.js's webpack production builder initially                    | Turbopack cannot create its internal CSS worker process in the development environment                      |
| 2026-09-09 | Defer hosted preview deployment without blocking collection work      | Local integration was verified while hosted Supabase and Vercel required owner setup                        |
| 2026-09-09 | Use one hosted Supabase project for initial Vercel environments       | This keeps the MVP setup simple; isolated staging data or database branches can come later                  |
| 2026-09-10 | Use `https://cratebook.vercel.app` as the initial production URL      | Hosted Supabase, Vercel deployment, authentication, and primary foundation flows are live                   |
| 2026-09-10 | Use Goldmine condition grades and ISO-style currency codes            | Familiar record grading supports collectors, while three-letter codes avoid prematurely limiting currencies |
| 2026-09-10 | Keep release rows user-scoped and collection items private by default | Prevents private metadata leaks while allowing multiple copies and later wishlist reuse                     |

## 20. Progress log

Add concise entries after meaningful work sessions. Detailed technical history belongs
in version control; this log records product-level progress and changes.

| Date       | Milestone | Progress                                                                                                                                                                                                                                                              | Next step                                                              |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-09-09 | 0         | Created the initial product specification, architecture, scope, and tracker                                                                                                                                                                                           | Review scope and settle the first open design decisions                |
| 2026-09-09 | 1         | Built the responsive public experience, protected app shell, locally verified passwordless auth/onboarding, typed profile schema/RLS, PWA assets, and automated test foundation; 23 database tests pass                                                               | Connect a hosted Supabase project and complete profile settings and CI |
| 2026-09-09 | 1         | Closed Milestone 1 locally with profile/privacy editing and GitHub Actions gates for application, browser, and database checks                                                                                                                                        | Begin Milestone 2 with release and physical-copy tables                |
| 2026-09-09 | 1         | Documented the exact hosted Supabase migration, Vercel Git deployment, environment variables, authentication redirects, and hosted smoke test                                                                                                                         | Complete the external hosting checklist before inviting testers        |
| 2026-09-10 | 1         | Deployed hosted Supabase and Vercel production at `https://cratebook.vercel.app`; verified passwordless auth, onboarding, protected routes, collection access, profile editing, manifest, and PWA icons                                                               | Verify one pull-request Preview while Milestone 2 proceeds             |
| 2026-09-10 | 2         | Added typed release and physical-copy tables with validation, indexing, idempotency keys, private defaults, owner-only RLS, same-owner foreign keys, generated TypeScript types, and 44 collection database assertions                                                | Build manual record entry on the verified collection schema            |
| 2026-09-10 | 2         | Built phone-first manual entry with required artist/title, progressive edition fields, server validation, atomic idempotent persistence, saved-record confirmation, a real auth-to-entry browser journey, and deployed both Milestone 2 migrations to hosted Supabase | Build the collection grid/list and complete its empty and error states |

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
