import Link from "next/link";

import { formatPriceMinor } from "@/lib/record";
import { getWishlistPriorityLabel } from "@/lib/wishlist";
import type { Enums } from "@/types/database";

export type WishlistCardItem = {
  id: string;
  priority: Enums<"wishlist_priority">;
  preferredEdition: string | null;
  maxPriceMinor: number | null;
  priceCurrency: string | null;
  isPublic: boolean;
  release: { artist_display: string; title: string };
};

export function WishlistCard({ item }: { item: WishlistCardItem }) {
  const titleId = `wishlist-title-${item.id}`;

  return (
    <article
      className="collection-card wishlist-card"
      aria-labelledby={titleId}
    >
      <Link className="collection-card-link" href={`/wishlist/${item.id}`}>
        <div className="collection-cover wishlist-cover" aria-hidden="true">
          <span>{item.release.title.slice(0, 1).toUpperCase()}</span>
        </div>
        <span
          className={`wishlist-priority wishlist-priority-${item.priority}`}
        >
          {getWishlistPriorityLabel(item.priority)}
        </span>
        <div className="collection-card-copy">
          <h2 id={titleId}>{item.release.title}</h2>
          <p className="collection-artist">{item.release.artist_display}</p>
          {item.preferredEdition ? (
            <p className="collection-edition">{item.preferredEdition}</p>
          ) : null}
          <div className="wishlist-card-footer">
            <span>{item.isPublic ? "Visible" : "Private"}</span>
            {item.maxPriceMinor !== null && item.priceCurrency ? (
              <strong>
                Up to {formatPriceMinor(item.maxPriceMinor, item.priceCurrency)}
              </strong>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
