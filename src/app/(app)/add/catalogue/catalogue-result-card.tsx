import Link from "next/link";

import type { CatalogueReleaseCandidate } from "@/lib/catalogue/types";
import { getReleaseFormatLabel } from "@/lib/collection";

export function CatalogueResultCard({
  candidate,
}: {
  candidate: CatalogueReleaseCandidate;
}) {
  const metadata = [
    candidate.releaseYear?.toString(),
    candidate.country,
    candidate.format ? getReleaseFormatLabel(candidate.format) : null,
    candidate.discCount
      ? candidate.discCount +
        " " +
        (candidate.discCount === 1 ? "disc" : "discs")
      : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <article className="catalogue-result">
      <div className="catalogue-result-heading">
        <div>
          <p>{candidate.artist}</p>
          <h2>{candidate.title}</h2>
        </div>
        <span>MusicBrainz</span>
      </div>

      {metadata.length > 0 ? (
        <ul className="collection-meta" aria-label="Release summary">
          {metadata.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : null}

      <dl className="catalogue-result-identifiers">
        {candidate.label ? (
          <div>
            <dt>Label</dt>
            <dd>{candidate.label}</dd>
          </div>
        ) : null}
        {candidate.catalogNumber ? (
          <div>
            <dt>Catalogue no.</dt>
            <dd>{candidate.catalogNumber}</dd>
          </div>
        ) : null}
        {candidate.barcode ? (
          <div>
            <dt>Barcode</dt>
            <dd>{candidate.barcode}</dd>
          </div>
        ) : null}
      </dl>

      {candidate.editionDescription ? (
        <p className="catalogue-result-note">{candidate.editionDescription}</p>
      ) : null}

      <div className="catalogue-result-actions">
        <a href={candidate.sourceUrl} rel="noreferrer" target="_blank">
          View source{" "}
          <span className="visually-hidden">for {candidate.title}</span>
        </a>
        <Link
          className="button"
          href={"/add/catalogue/" + candidate.externalId}
        >
          Review release
        </Link>
      </div>
    </article>
  );
}
