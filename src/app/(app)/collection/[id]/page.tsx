import type { Metadata } from "next";
import Link from "next/link";

import { ReleaseCover } from "@/components/release-cover";
import {
  getCatalogueAttribution,
  getCoverArtUrl,
} from "@/lib/catalogue/provenance";
import {
  formatCollectionDate,
  getCollectionCardDetails,
  getCopyDetailRows,
  getRecordDetailRows,
} from "@/lib/collection";

import { deleteRecord } from "./actions";
import { getCollectionRecord } from "./data";
import { DeleteRecord } from "./delete-record";

export const metadata: Metadata = { title: "Record details" };

type RecordDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ moved?: string; updated?: string }>;
};

export default async function RecordDetailPage({
  params,
  searchParams,
}: RecordDetailPageProps) {
  const [{ id }, { moved, updated }] = await Promise.all([
    params,
    searchParams,
  ]);
  const item = await getCollectionRecord(id);
  const release = item.releases;
  const details = getCollectionCardDetails(release);
  const detailRows = getRecordDetailRows(release);
  const copyRows = getCopyDetailRows(item);
  const attribution = getCatalogueAttribution(
    release.external_source,
    release.external_id,
  );
  const coverUrl = getCoverArtUrl(release.cover_url);
  const tags = item.collection_item_tags
    .map(({ tags }) => tags.name)
    .sort((left, right) => left.localeCompare(right));
  const deleteRecordWithId = deleteRecord.bind(null, item.id);

  return (
    <main className="app-content record-detail-page">
      <Link className="back-link" href="/collection">
        ← My collection
      </Link>

      {moved === "1" ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>The record moved from your wishlist into your collection.</p>
        </div>
      ) : updated === "1" ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>Your changes to this record were saved.</p>
        </div>
      ) : null}

      <article className="record-hero">
        <ReleaseCover
          className="record-detail-cover"
          coverUrl={coverUrl}
          title={release.title}
          sizes="(max-width: 720px) calc(100vw - 40px), 320px"
          meaningful
        />
        <div className="record-hero-copy">
          <div className="record-hero-kicker">
            <p className="app-kicker">In your crate</p>
            {item.is_favorite ? <span>★ Favorite</span> : null}
          </div>
          <h1>{release.title}</h1>
          <p className="record-detail-artist">{release.artist_display}</p>
          {details.length > 0 ? (
            <ul className="collection-meta" aria-label="Release summary">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
          <Link className="button" href={`/collection/${item.id}/edit`}>
            Edit record
          </Link>
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
          aria-labelledby="edition-heading"
        >
          <div className="record-detail-heading">
            <p className="app-kicker">Pressing notes</p>
            <h2 id="edition-heading">Edition details</h2>
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
              <Link href={`/collection/${item.id}/edit`}>
                Add what you know
              </Link>
            </div>
          )}
        </section>

        <aside
          className="record-detail-panel record-copy-panel"
          aria-labelledby="copy-heading"
        >
          <div className="record-detail-heading">
            <p className="app-kicker">This copy</p>
            <h2 id="copy-heading">Crate details</h2>
          </div>
          <dl className="record-detail-list">
            <div>
              <dt>Added</dt>
              <dd>{formatCollectionDate(item.created_at)}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>{item.is_public ? "Public" : "Private"}</dd>
            </div>
            {copyRows.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
          {tags.length > 0 ? (
            <div className="record-tags" aria-label="Tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </aside>

        {item.notes ? (
          <section
            className="record-detail-panel record-story-panel"
            aria-labelledby="story-heading"
          >
            <div className="record-detail-heading">
              <p className="app-kicker">Personal and private</p>
              <h2 id="story-heading">My notes</h2>
            </div>
            <p>{item.notes}</p>
          </section>
        ) : null}
      </div>

      <DeleteRecord action={deleteRecordWithId} title={release.title} />
    </main>
  );
}
