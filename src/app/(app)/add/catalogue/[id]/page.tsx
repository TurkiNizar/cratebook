import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";
import { getReleaseFormatLabel } from "@/lib/collection";

export const metadata: Metadata = { title: "Review catalogue release" };

export default async function CatalogueReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lookup, cover] = await Promise.all([
    musicBrainzCatalogueProvider.lookup(id),
    musicBrainzCatalogueProvider.getCover(id),
  ]);

  if (lookup.status === "invalid_id" || lookup.status === "not_found") {
    notFound();
  }

  if (lookup.status !== "success") {
    return (
      <main className="app-content">
        <Link className="back-link" href="/add/catalogue">
          ← Catalogue search
        </Link>
        <section className="collection-error" role="alert">
          <div className="empty-record" aria-hidden="true" />
          <h1>We could not review this release</h1>
          <p>
            MusicBrainz may be temporarily unavailable. Search again or continue
            with manual entry.
          </p>
          <div className="collection-error-actions">
            <Link className="button" href={"/add/catalogue/" + id}>
              Try again
            </Link>
            <Link className="secondary-button" href="/add/manual">
              Add manually
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const candidate = lookup.candidate;
  const details = [
    ["Edition year", candidate.releaseYear?.toString() ?? null],
    ["Original year", candidate.originalYear?.toString() ?? null],
    [
      "Format",
      candidate.format ? getReleaseFormatLabel(candidate.format) : null,
    ],
    ["Disc count", candidate.discCount?.toString() ?? null],
    ["Country", candidate.country],
    ["Label", candidate.label],
    ["Catalogue number", candidate.catalogNumber],
    ["Barcode", candidate.barcode],
    ["Edition note", candidate.editionDescription],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <main className="app-content catalogue-review-page">
      <Link className="back-link" href="/add/catalogue">
        ← Catalogue results
      </Link>
      <div className="catalogue-review">
        <div className="catalogue-review-cover">
          {cover.status === "success" ? (
            <Image
              alt={candidate.title + " cover"}
              src={cover.coverUrl}
              width={500}
              height={500}
              sizes="(max-width: 720px) calc(100vw - 40px), 360px"
              unoptimized
            />
          ) : (
            <div className="collection-cover-placeholder" aria-hidden="true">
              <span>{candidate.title}</span>
            </div>
          )}
        </div>
        <div className="catalogue-review-copy">
          <p className="app-kicker">Review this edition</p>
          <h1>{candidate.title}</h1>
          <p className="record-detail-artist">{candidate.artist}</p>
          <p className="catalogue-attribution">
            Metadata from{" "}
            <a href={candidate.sourceUrl} rel="noreferrer" target="_blank">
              MusicBrainz
            </a>
            {cover.status === "success"
              ? ", artwork from Cover Art Archive"
              : ""}
            .
          </p>
          <div className="catalogue-selection-actions">
            <Link className="button" href={"/add/manual?catalogueId=" + id}>
              Add to collection
            </Link>
            <Link
              className="secondary-button"
              href={"/wishlist/add?catalogueId=" + id}
            >
              Add to wishlist
            </Link>
          </div>
        </div>
      </div>

      <section className="record-detail-panel catalogue-review-details">
        <div className="record-detail-heading">
          <p className="app-kicker">Pressing clues</p>
          <h2>Release details</h2>
        </div>
        {details.length > 0 ? (
          <dl className="record-detail-list">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="record-detail-empty">
            MusicBrainz has only the artist and title for this edition.
          </p>
        )}
      </section>
    </main>
  );
}
