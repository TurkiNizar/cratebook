import { ReleaseCover } from "@/components/release-cover";
import {
  getCollectionCardDetails,
  getCollectionCardEdition,
} from "@/lib/collection";
import { getWishlistPriorityLabel } from "@/lib/wishlist";
import type { Enums } from "@/types/database";

export type PublicCollectionItem = {
  id: string;
  artist_display: string;
  title: string;
  cover_url: string | null;
  format: Enums<"release_format"> | null;
  disc_count: number | null;
  original_year: number | null;
  release_year: number | null;
  label: string | null;
  catalog_number: string | null;
  country: string | null;
  is_favorite: boolean;
};

export type PublicWishlistItem = {
  id: string;
  artist_display: string;
  title: string;
  cover_url: string | null;
  priority: Enums<"wishlist_priority">;
  preferred_edition: string | null;
};

export function PublicCollectionCard({ item }: { item: PublicCollectionItem }) {
  const titleId = `public-collection-title-${item.id}`;
  const details = getCollectionCardDetails(item);
  const edition = getCollectionCardEdition(item);

  return (
    <article
      className="collection-card public-record-card"
      aria-labelledby={titleId}
    >
      <ReleaseCover
        coverUrl={item.cover_url}
        title={item.title}
        sizes="(max-width: 720px) calc(50vw - 30px), 240px"
      />
      {item.is_favorite ? (
        <span className="collection-favorite" aria-label="Favorite">
          ★
        </span>
      ) : null}
      <div className="collection-card-copy">
        <h3 id={titleId}>{item.title}</h3>
        <p className="collection-artist">{item.artist_display}</p>
        {details.length > 0 ? (
          <ul className="collection-meta" aria-label="Release details">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
        {edition ? <p className="collection-edition">{edition}</p> : null}
      </div>
    </article>
  );
}

export function PublicWishlistCard({ item }: { item: PublicWishlistItem }) {
  const titleId = `public-wishlist-title-${item.id}`;

  return (
    <article
      className="collection-card public-record-card wishlist-card"
      aria-labelledby={titleId}
    >
      <ReleaseCover
        className="wishlist-cover"
        coverUrl={item.cover_url}
        title={item.title}
        sizes="(max-width: 720px) calc(50vw - 30px), 240px"
      />
      <span className={`wishlist-priority wishlist-priority-${item.priority}`}>
        {getWishlistPriorityLabel(item.priority)}
      </span>
      <div className="collection-card-copy">
        <h3 id={titleId}>{item.title}</h3>
        <p className="collection-artist">{item.artist_display}</p>
        {item.preferred_edition ? (
          <p className="collection-edition">{item.preferred_edition}</p>
        ) : null}
      </div>
    </article>
  );
}
