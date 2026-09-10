import type { Metadata } from "next";
import Link from "next/link";

import {
  type CollectionSearchParams,
  parseCollectionControls,
} from "@/lib/collection";
import { createClient } from "@/lib/supabase/server";

import { CollectionCard } from "./collection-card";
import { CollectionControls } from "./collection-controls";

export const metadata: Metadata = {
  title: "My collection",
};

type CollectionPageProps = {
  searchParams: Promise<CollectionSearchParams>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CollectionPage({
  searchParams,
}: CollectionPageProps) {
  const params = await searchParams;
  const { added, removed } = params;
  const addedId = Array.isArray(added) ? added[0] : added;
  const removedValue = Array.isArray(removed) ? removed[0] : removed;
  const controls = parseCollectionControls(params);
  const supabase = await createClient();
  const { data: items, error } = await supabase.rpc("search_collection_items", {
    p_query: controls.query || undefined,
    p_favorite: controls.favorite ? true : undefined,
    p_purchase_state: controls.purchaseState || undefined,
    p_format: controls.format || undefined,
    p_condition: controls.condition || undefined,
    p_sort: controls.sort,
  });

  if (error) {
    console.error("Collection query failed", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Unable to load collection");
  }

  const addedItem =
    addedId && UUID_PATTERN.test(addedId)
      ? items.find((item) => item.id === addedId)
      : undefined;

  return (
    <main className="app-content">
      <p className="app-kicker">Your shelves</p>
      <h1>My collection</h1>
      <p className="app-description">
        Every copy gets a place here, along with where it came from and why it
        matters.
      </p>
      {addedItem ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>
            <strong>{addedItem.title}</strong> by {addedItem.artist_display}
            {" was added to your collection."}
          </p>
        </div>
      ) : null}
      {removedValue === "1" ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>The copy was removed from your collection.</p>
        </div>
      ) : null}
      {items.length > 0 || controls.isActive ? (
        <CollectionControls controls={controls} />
      ) : null}
      {items.length === 0 && !controls.isActive ? (
        <section className="empty-crate">
          <div>
            <span className="empty-record" aria-hidden="true" />
            <h2>Your crate is waiting</h2>
            <p>
              Add your first record with just an artist and title. Details can
              come later.
            </p>
            <Link className="button" href="/add/manual">
              Add your first record
            </Link>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="empty-crate collection-no-results">
          <div>
            <span className="empty-record" aria-hidden="true" />
            <h2>No records match</h2>
            <p>Try a broader search or clear the active filters.</p>
            <div className="collection-empty-actions">
              <Link className="button" href="/collection">
                Clear search and filters
              </Link>
              <Link className="secondary-button" href="/add/manual">
                Add a record
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="collection-toolbar">
            <p aria-live="polite">
              Showing <strong>{items.length}</strong>{" "}
              {items.length === 1 ? "record" : "records"}
            </p>
            <Link className="button button-small" href="/add/manual">
              Add a record
            </Link>
          </div>
          <ul
            className="collection-grid"
            aria-label="Records in your collection"
          >
            {items.map((item) => (
              <li key={item.id}>
                <CollectionCard
                  item={{
                    id: item.id,
                    isFavorite: item.is_favorite,
                    tags: item.tags,
                    release: {
                      artist_display: item.artist_display,
                      title: item.title,
                      format: item.format,
                      disc_count: item.disc_count,
                      original_year: item.original_year,
                      release_year: item.release_year,
                      label: item.label,
                      catalog_number: item.catalog_number,
                      country: item.country,
                    },
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
