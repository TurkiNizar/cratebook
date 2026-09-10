# Catalogue provider decision

Last reviewed: 2026-09-10

Cratebook will use the [MusicBrainz release API](https://musicbrainz.org/doc/MusicBrainz_API)
as its first external catalogue provider. Cover artwork will come from the associated
[Cover Art Archive API](https://musicbrainz.org/doc/Cover_Art_Archive/API). The provider
adapter must keep both services behind Cratebook's server boundary so manual entry and
the rest of the collection remain available when either service is slow or unavailable.

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

Only MusicBrainz core release data will be mapped into Cratebook's durable release
fields. Search score and other supplementary data may guide the current result order
but must not be persisted as release metadata.

For a selected result:

- `external_source` is `musicbrainz`.
- `external_id` is the release MBID, not a release-group MBID.
- `source_data` stores a bounded snapshot of the selected release payload needed to
  trace the import. It must not contain MusicBrainz user data, ratings, tags, or
  annotations.
- The UI links the selected result and saved catalogue provenance to
  `https://musicbrainz.org/release/{mbid}` and labels it as data from MusicBrainz.
- A later refresh may suggest changes, but it must not overwrite user edits silently.

MusicBrainz core metadata is CC0 and does not require attribution. Cratebook will
still display source attribution and an MBID link for transparency, correction, and
traceability.

## Artwork policy

Cratebook will reference Cover Art Archive thumbnail URLs remotely for the MVP. It
will not copy catalogue artwork into Supabase Storage. The adapter should request the
release's approved front image and prefer the 500-pixel thumbnail for cards and forms;
it may retain the original Cover Art Archive URL as provenance.

The [Cover Art Archive policy](https://musicbrainz.org/doc/Cover_Art_Archive) says the
archive is public but that image use remains at the user's risk and should respect the
rights of artists and labels. Therefore:

- Artwork is optional and failure to load it never blocks selection or manual entry.
- Catalogue artwork is labelled as coming from Cover Art Archive and links back to
  the MusicBrainz release.
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

The next implementation task should expose a provider-neutral server-only interface
with search input, normalized candidate results, a provider source identifier, and
typed success, no-result, invalid-query, rate-limited, unavailable, and malformed-
response outcomes. Provider payload validation must happen before values reach forms
or persistence code.

The adapter must not expose an unrestricted proxy or accept arbitrary upstream URLs.
Queries are length-limited and encoded as data. Search should request vinyl releases
when possible, while still showing ambiguous editions with enough label, catalogue,
country, date, barcode, format, and disc-count context for the collector to choose.

No provider account, API key, new environment variable, hosted-data mutation, or
external-service authorization is required for the MusicBrainz read-only MVP
integration.

## Re-review triggers

Review this decision and the linked policies before any of the following:

- commercial launch or paid catalogue features;
- sustained traffic that cannot honor MusicBrainz's public API limit;
- local mirroring, bulk ingestion, or use of a paid MetaBrainz feed;
- persistence of supplementary MusicBrainz data;
- copying or transforming catalogue artwork;
- adding Discogs or another provider;
- a material change to MusicBrainz or Cover Art Archive terms, APIs, or limits.
