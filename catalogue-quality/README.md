# Catalogue quality benchmark

This fixture gives Cratebook a stable, repeatable way to compare album-discovery
providers and query strategies. It contains 14 expected albums across famous artists,
common and less-common albums, punctuation and diacritics, partial titles, barcodes,
and catalogue numbers. Every category has at least two cases so one provider-specific
oddity cannot decide the result by itself.

A case counts as recalled when the expected normalized artist and full album title
appear in the first 12 results. Matching is case-insensitive, ignores punctuation and
diacritics, and supports explicit aliases, but does not treat a merely similar title
as a hit. This measures useful album recall; it does not assert that the returned
physical edition is the collector's exact pressing.

Run the current MusicBrainz release-search strategy with:

```bash
npm run catalogue:benchmark
```

The command uses the same query expression, vinyl filter, and result limit as the
current application. It sends requests sequentially with a conservative two-second
interval and bounded retries so MusicBrainz availability is not mistaken for a search
miss. It exits unsuccessfully if any case still has a request or response failure.
The command is intentionally not part of CI because it calls a rate-limited external
service and search indexes can change.

`baseline-musicbrainz-release.json` records the 2026-09-12 baseline. The expected album
was found for 4 of 14 cases (28.6%). Recall was 75% for the overlapping famous/common
album cases, 50% for punctuation/diacritics, and 0% for less-common albums, partial
titles, barcodes, and catalogue numbers. This is the comparison point for the next
Milestone 3 provider evaluation, not a permanently passing assertion.

MusicBrainz intermittently returned HTTP 503 during measurement. The committed
baseline combines only complete responses from bounded runs in the recorded
measurement window; transport failures were discarded, never scored as misses.

When comparing another provider or strategy, keep `fixture.json` unchanged, commit a
separate result file, and explain any unavoidable unsupported query category. Change
the fixture only when the product's representative search expectations change; bump
its version and retain older result files so comparisons remain auditable.
