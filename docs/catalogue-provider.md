# Catalogue provider decision

Last reviewed: 2026-09-12

Cratebook will use the [MusicBrainz release API](https://musicbrainz.org/doc/MusicBrainz_API)
as its first external catalogue provider. Cover artwork will come from the associated
[Cover Art Archive API](https://musicbrainz.org/doc/Cover_Art_Archive/API). The provider
adapter must keep both services behind Cratebook's server boundary so manual entry and
the rest of the collection remain available when either service is slow or unavailable.

## Album-first provider evaluation

The 2026-09-12 album-first comparison uses the versioned fixture and recorded results
in `catalogue-quality/`. The current exact-release query recalled 4/14 expected albums
(28.6%). A token-wise [MusicBrainz release-group search](https://musicbrainz.org/doc/MusicBrainz_API/Search#Release_Group)
recalled 14/14 (100%), with the expected album at rank 1 in 12 cases, rank 2 in one,
and rank 5 in one. Barcodes and catalogue numbers were resolved through MusicBrainz
release search and then collapsed to their release-group identity. Cover Art Archive's
curated [release-group front endpoint](https://musicbrainz.org/doc/Cover_Art_Archive/API#Release_Group)
was available for all 14 matches.

Apple's unauthenticated [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html)
was evaluated as the broader commercial catalogue comparator using its US-store
`music` / `album` search. It recalled 9/14 (64.3%) and supplied artwork for every
recalled album, but missed one partial-title case plus every barcode and
catalogue-number case. Results are storefront-specific. Apple documents an approximate
limit of 20 calls per minute and recommends caching. The comparison treats non-success
responses and malformed payloads as provider failures rather than missed albums; an
integrated provider would still need bounded retries and the permanent manual fallback.

Apple is not selected for integration. Its [Search API terms](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html)
describe album artwork as promotional content: use must promote the Store content,
appear near an approved badge linking to the Store, not promote other goods or
services, and be removed on request. Those conditions do not fit durable artwork on a
user's personal collection record, and the public documentation is archived rather
than an actively versioned catalogue contract.

Cratebook will therefore use MusicBrainz release groups as the default album identity
and Cover Art Archive's release-group front image as optional representative artwork.
Core MusicBrainz metadata remains suitable for durable storage under CC0. Cover images
remain remote, optional, attributed, removable, and subject to the existing rights-risk
policy. Exact MusicBrainz releases remain available for identifier lookup and the
optional edition-selection path; an album-level match must never claim an exact
pressing. Re-review Cover Art Archive image use before commercial launch as already
required below.

## Why MusicBrainz

MusicBrainz models a release as a distinct real-world issuing rather than only an
abstract album. Its release search exposes the identifiers and fields Cratebook needs
to distinguish candidate editions: artist credit, title, date, country, label,
catalogue number, barcode, medium format, and MusicBrainz ID (MBID). The
[MusicBrainz database documentation](https://musicbrainz.org/doc/MusicBrainz_Database)
classifies these release fields as core data under CC0.

The read-only search and lookup endpoints do not require a user account or API key.
This avoids asking collectors to connect a third-party account and keeps catalogue
credentials out of the browser. MusicBrainz is not expected to contain every release,
so catalogue search remains assistance rather than a gate: manual collection and
wishlist entry stay permanent first-class paths.

Discogs was considered because its database is particularly strong for physical
pressings. It is not the first provider because its current
[API Terms of Use](https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use)
require data to remain no more than six hours behind Discogs, impose prominent and
per-item attribution with links, and classify images as restricted data. Those terms
do not fit Cratebook's durable, user-owned release records as cleanly as MusicBrainz's
CC0 core metadata. The provider interface should still make a later supplemental
provider possible.

## Data and provenance policy

Only MusicBrainz core release and release-group data will be mapped into Cratebook's
durable release fields. Search score and other supplementary data may guide the
current result order but must not be persisted as release metadata.

Every catalogue identity is the tuple `external_source`, `external_entity_type`, and
`external_id`. For MusicBrainz:

- `external_source` is `musicbrainz`.
- `external_entity_type` is `release_group` for an album-level quick add and `release`
  only when the collector selected a specific edition.
- `external_id` is the MBID for that declared entity type. Release and release-group
  UUIDs occupy separate identity namespaces and must never be treated as interchangeable.
- `source_data` stores a bounded snapshot of the selected release payload needed to
  trace the import. Its top-level `provider` and `entityType` values must match the
  columns, and either `release.id` or `releaseGroup.id` must match `external_id`. It
  must not contain MusicBrainz user data, ratings, tags, or annotations.
- The UI links saved provenance to the matching MusicBrainz release or release-group
  URL and labels it as data from MusicBrainz.
- A later refresh may suggest changes, but it must not overwrite user edits silently.

An album-level quick add may persist only artist credit, album title, known original
year, and optional representative Cover Art Archive artwork. Format, disc count,
edition year, country, label, catalogue number, barcode, reissue state, vinyl colour,
and matrix/runout stay unset because those facts describe a physical edition or copy.
The representative image is evidence about the album, not a claim that it depicts the
collector's pressing. Exact-release records created before the album-first revision
are migrated to `external_entity_type = release`; their identity and metadata remain
unchanged.

MusicBrainz core metadata is CC0 and does not require attribution. Cratebook will
still display source attribution and an MBID link for transparency, correction, and
traceability.

## Artwork policy

Cratebook will reference Cover Art Archive thumbnail URLs remotely for the MVP. It
will not copy catalogue artwork into Supabase Storage. The adapter should request the
selected entity's approved front image and prefer the 500-pixel thumbnail for cards
and forms; it may retain the original Cover Art Archive URL as provenance. Album-level
records use `/release-group/{mbid}/...` artwork and exact editions use
`/release/{mbid}/...`; carried artwork must match both the entity type and MBID.

The [Cover Art Archive policy](https://musicbrainz.org/doc/Cover_Art_Archive) says the
archive is public but that image use remains at the user's risk and should respect the
rights of artists and labels. Therefore:

- Artwork is optional and failure to load it never blocks selection or manual entry.
- Catalogue artwork is labelled as coming from Cover Art Archive and links back to
  the matching MusicBrainz release group or release.
- Cratebook does not imply that MusicBrainz, Internet Archive, an artist, or a label
  endorses the application.
- A removal request or provider takedown must be honored by removing the stored URL;
  no copied file needs deletion under this MVP policy.
- User-uploaded personal-copy images remain deferred and require a separate storage
  and deletion policy.

This is a product policy, not a legal determination that every archived cover can be
used in every jurisdiction. Re-review artwork handling before monetization, public
catalogue pages, bulk export of image URLs, or copying images to managed storage.

## Requests, caching, and limits

The adapter must follow the official
[MusicBrainz rate-limiting guidance](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting):

- Send a meaningful server-side `User-Agent` containing the application name,
  version, and `https://cratebook.vercel.app` contact URL.
- Keep aggregate MusicBrainz traffic at or below one request per second. Coalesce
  identical in-flight searches and cache successful normalized search responses so
  ordinary typing does not create one upstream request per keystroke.
- Treat HTTP 503 and 429 responses as temporary provider unavailability. Respect a
  `Retry-After` header when present, use bounded backoff, and do not retry indefinitely.
- Use conservative timeouts and return a typed unavailable result so the UI can keep
  the manual-entry fallback visible.

The Cover Art Archive documentation currently states that it has no fixed rate limit,
but it can return 503 and must still be used considerately. Cache its successful JSON
metadata, use thumbnail URLs rather than original-size images in search results, and
do not repeatedly probe releases known to have no cover.

Cache only public provider responses; never mix provider caches with authenticated
user or Supabase data. A 24-hour search-result cache and a seven-day cover-metadata
cache are the initial application policy. These are implementation defaults rather
than provider requirements and can be shortened if correction freshness becomes a
problem. Persisted user-selected release snapshots remain until the user edits or
deletes the release because they form part of the user's own collection record.

## Adapter boundary and failure behavior

The server-only provider adapter is implemented in
`src/lib/catalogue/musicbrainz.ts`, behind the provider-neutral types in
`src/lib/catalogue/types.ts`. It exposes normalized candidate results, a provider
source identifier, and typed success, no-result, invalid-query, rate-limited,
unavailable, and malformed-response outcomes. Provider payload validation happens
before values reach forms or persistence code.

MusicBrainz search requests use a 24-hour Next.js data-cache lifetime, coalesce
identical in-flight calls, and pass through a process-local queue that starts requests
at least one second apart. One bounded retry respects `Retry-After` up to five seconds.
Requests time out after six seconds. Cover Art Archive metadata is fetched separately
with a seven-day cache so callers can resolve artwork only for candidates that need it
instead of creating an upstream request for every search result.

The adapter does not expose an unrestricted proxy or accept arbitrary upstream URLs.
Queries are length-limited and encoded as data. Search requests vinyl releases while
showing ambiguous editions with enough label, catalogue, country, date, barcode,
format, and disc-count context for the collector to choose. Exact release lookup and
cover retrieval happen only after selection. The review screen then prefills known
release metadata into the existing collection or wishlist form without inferring
copy-specific condition, acquisition, price, rating, or notes.

When artwork is available on the exact-release review, its thumbnail and original
Cover Art Archive references are carried into the add form and then revalidated
against the selected MBID at the server boundary. This avoids depending on a second
artwork request during submission. Invalid or mismatched references are discarded and
the adapter may safely retry cover lookup; metadata selection and manual entry remain
available either way.

No provider account, API key, new environment variable, hosted-data mutation, or
external-service authorization is required for the MusicBrainz read-only MVP
integration. Catalogue search, result selection, review, attribution, optional cover
display, form prefilling, and manual failure paths are implemented. Catalogue-backed
collection and wishlist mutations re-resolve the selected MBID at the server boundary,
store the provider name and bounded source snapshot, and retain the optional remote
cover reference. An existing owner-scoped release with the same source identity is
reused without silently overwriting user edits. If that release has no cover, a later
verified selection may backfill its cover reference and matching cover provenance;
an existing cover and all other release fields remain unchanged.

Automated coverage keeps near-identical editions separately traceable through their
MBIDs and pressing clues. It also verifies timeouts, rate limits, malformed responses,
missing releases, failed exact-release review, and unavailable artwork while preserving
manual collection and wishlist paths. The catalogue-provenance migration is applied to
the production Supabase project.

## Re-review triggers

Review this decision and the linked policies before any of the following:

- commercial launch or paid catalogue features;
- sustained traffic that cannot honor MusicBrainz's public API limit;
- local mirroring, bulk ingestion, or use of a paid MetaBrainz feed;
- persistence of supplementary MusicBrainz data;
- copying or transforming catalogue artwork;
- adding Discogs or another provider;
- a material change to MusicBrainz or Cover Art Archive terms, APIs, or limits.
