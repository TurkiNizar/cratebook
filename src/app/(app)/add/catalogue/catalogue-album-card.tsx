import Link from "next/link";

import { ReleaseCover } from "@/components/release-cover";
import type { CatalogueAlbumCandidate } from "@/lib/catalogue/types";

export function CatalogueAlbumCard({
  candidate,
}: {
  candidate: CatalogueAlbumCandidate;
}) {
  const albumParameter = `catalogueAlbumId=${encodeURIComponent(candidate.externalId)}`;

  return (
    <article className="catalogue-album-card" aria-label={candidate.title}>
      <ReleaseCover
        className="catalogue-album-cover"
        coverUrl={candidate.representativeCoverUrl}
        title={candidate.title}
        sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 1100px) 40vw, 280px"
        meaningful
      />
      <div className="catalogue-album-copy">
        <p className="catalogue-album-artist">{candidate.artist}</p>
        <h2>{candidate.title}</h2>
        <p className="catalogue-album-year">
          {candidate.originalYear
            ? `First released ${candidate.originalYear}`
            : "Original year unknown"}
        </p>
        <p className="catalogue-album-note">
          Album match · pressing not selected
        </p>
      </div>
      <div className="catalogue-album-actions">
        <Link className="button" href={`/add/manual?${albumParameter}`}>
          Add to collection
        </Link>
        <Link
          className="secondary-button"
          href={`/wishlist/add?${albumParameter}`}
        >
          Add to wishlist
        </Link>
        <Link
          className="secondary-button"
          href={`/add/catalogue/${candidate.externalId}/editions`}
        >
          Choose a specific edition
        </Link>
        <a href={candidate.sourceUrl} rel="noreferrer" target="_blank">
          View album source
          <span className="visually-hidden"> for {candidate.title}</span>
        </a>
      </div>
    </article>
  );
}
