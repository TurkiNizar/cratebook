import type { Metadata } from "next";
import Link from "next/link";

import { ReleaseCover } from "@/components/release-cover";
import {
  getCatalogueAttribution,
  getCoverArtUrl,
} from "@/lib/catalogue/provenance";
import { formatCollectionDate, getRecordDetailRows } from "@/lib/collection";
import { formatPriceMinor } from "@/lib/record";
import { getWishlistPriorityLabel } from "@/lib/wishlist";

import { deleteWishlistItem } from "./actions";
import { getWishlistItem } from "./data";
import { DeleteWishlistItem } from "./delete-wishlist-item";

export const metadata: Metadata = { title: "Wishlist details" };

export default async function WishlistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const [{ id }, { updated }] = await Promise.all([params, searchParams]);
  const item = await getWishlistItem(id);
  const release = item.releases;
  const detailRows = getRecordDetailRows(release);
  const attribution = getCatalogueAttribution(
    release.external_source,
    release.external_entity_type,
    release.external_id,
  );
  const coverUrl = getCoverArtUrl(release.cover_url);
  const deleteWithId = deleteWishlistItem.bind(null, item.id);

  return (
    <main className="app-content record-detail-page">
      <Link className="back-link" href="/wishlist">
        ← My wishlist
      </Link>
      {updated === "1" ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>Your wishlist changes were saved.</p>
        </div>
      ) : null}
      <article className="record-hero">
        <ReleaseCover
          className="record-detail-cover wishlist-cover"
          coverUrl={coverUrl}
          title={release.title}
          sizes="(max-width: 720px) calc(100vw - 40px), 320px"
          meaningful
        />
        <div className="record-hero-copy">
          <div className="record-hero-kicker">
            <p className="app-kicker">On your wishlist</p>
            <span>{getWishlistPriorityLabel(item.priority)}</span>
          </div>
          <h1>{release.title}</h1>
          <p className="record-detail-artist">{release.artist_display}</p>
          <div className="record-form-buttons">
            <Link className="button" href={`/wishlist/${item.id}/move`}>
              Move to collection
            </Link>
            <Link
              className="secondary-button"
              href={`/wishlist/${item.id}/edit`}
            >
              Edit wish
            </Link>
          </div>
          {attribution ? (
            <p className="catalogue-attribution saved-catalogue-attribution">
              Catalogue metadata from{" "}
              <a href={attribution.url} rel="noreferrer" target="_blank">
                {attribution.label}
              </a>
              {coverUrl ? ", artwork from Cover Art Archive" : ""}.
            </p>
          ) : null}
        </div>
      </article>

      <div className="record-detail-grid">
        <section
          className="record-detail-panel"
          aria-labelledby="wishlist-preferences-detail-heading"
        >
          <div className="record-detail-heading">
            <p className="app-kicker">What you want</p>
            <h2 id="wishlist-preferences-detail-heading">
              Wishlist preferences
            </h2>
          </div>
          <dl className="record-detail-list">
            <div>
              <dt>Priority</dt>
              <dd>{getWishlistPriorityLabel(item.priority)}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>
                {item.is_public ? "Visible on a public profile" : "Private"}
              </dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{formatCollectionDate(item.created_at)}</dd>
            </div>
            {item.preferred_edition ? (
              <div>
                <dt>Preferred edition</dt>
                <dd>{item.preferred_edition}</dd>
              </div>
            ) : null}
            {item.max_price_minor !== null && item.price_currency ? (
              <div>
                <dt>Maximum price</dt>
                <dd>
                  {formatPriceMinor(item.max_price_minor, item.price_currency)}{" "}
                  <small>private</small>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <aside
          className="record-detail-panel record-copy-panel"
          aria-labelledby="wishlist-edition-heading"
        >
          <div className="record-detail-heading">
            <p className="app-kicker">Release metadata</p>
            <h2 id="wishlist-edition-heading">Edition details</h2>
          </div>
          {detailRows.length > 0 ? (
            <dl className="record-detail-list">
              {detailRows.map((detail) => (
                <div key={detail.label}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="record-detail-empty">
              <p>No edition details yet.</p>
              <p>Catalogue search will be able to add them later.</p>
            </div>
          )}
        </aside>

        {item.notes ? (
          <section
            className="record-detail-panel record-story-panel"
            aria-labelledby="wishlist-notes-heading"
          >
            <div className="record-detail-heading">
              <p className="app-kicker">Personal and private</p>
              <h2 id="wishlist-notes-heading">My notes</h2>
            </div>
            <p>{item.notes}</p>
          </section>
        ) : null}
      </div>
      <DeleteWishlistItem action={deleteWithId} title={release.title} />
    </main>
  );
}
