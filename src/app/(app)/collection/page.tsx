import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { CollectionCard } from "./collection-card";

export const metadata: Metadata = {
  title: "My collection",
};

type CollectionPageProps = {
  searchParams: Promise<{ added?: string; removed?: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CollectionPage({
  searchParams,
}: CollectionPageProps) {
  const { added, removed } = await searchParams;
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("collection_items")
    .select(
      "id, created_at, is_favorite, collection_item_tags(tags(name)), releases(artist_display, title, format, disc_count, original_year, release_year, label, catalog_number, country)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Collection query failed", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Unable to load collection");
  }

  const addedItem =
    added && UUID_PATTERN.test(added)
      ? items.find((item) => item.id === added)
      : undefined;
  const addedRelease = addedItem?.releases;

  return (
    <main className="app-content">
      <p className="app-kicker">Your shelves</p>
      <h1>My collection</h1>
      <p className="app-description">
        Every copy gets a place here, along with where it came from and why it
        matters.
      </p>
      {addedRelease ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>
            <strong>{addedRelease.title}</strong> by{" "}
            {addedRelease.artist_display}
            {" was added to your collection."}
          </p>
        </div>
      ) : null}
      {removed === "1" ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>The copy was removed from your collection.</p>
        </div>
      ) : null}
      {items.length === 0 ? (
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
      ) : (
        <>
          <div className="collection-toolbar">
            <p aria-live="polite">
              <strong>{items.length}</strong>{" "}
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
                    tags: item.collection_item_tags
                      .map(({ tags }) => tags.name)
                      .sort((left, right) => left.localeCompare(right)),
                    release: item.releases,
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
