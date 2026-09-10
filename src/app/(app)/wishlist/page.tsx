import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { WishlistCard } from "./wishlist-card";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; removed?: string }>;
}) {
  const { added, removed } = await searchParams;
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("wishlist_items")
    .select(
      "id, priority, preferred_edition, max_price_minor, price_currency, is_public, releases(artist_display, title)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Wishlist query failed", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Unable to load wishlist");
  }

  const addedId = Array.isArray(added) ? added[0] : added;
  const addedItem = items.find((item) => item.id === addedId);

  return (
    <main className="app-content">
      <p className="app-kicker">The next great find</p>
      <h1>My wishlist</h1>
      <p className="app-description">
        Keep the records you are hoping to find close at hand, from casual
        interests to the ones you cannot pass up.
      </p>
      {addedItem ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>
            <strong>{addedItem.releases.title}</strong> by{" "}
            {addedItem.releases.artist_display} was added to your wishlist.
          </p>
        </div>
      ) : null}
      {removed === "1" ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">✓</span>
          <p>The record was removed from your wishlist.</p>
        </div>
      ) : null}
      {items.length === 0 ? (
        <section className="empty-crate">
          <div>
            <span className="empty-record" aria-hidden="true" />
            <h2>Your want list is wide open</h2>
            <p>
              Add a record you hope to find. Artist and title are all you need.
            </p>
            <Link className="button" href="/wishlist/add">
              Add your first wish
            </Link>
          </div>
        </section>
      ) : (
        <>
          <div className="collection-toolbar">
            <p aria-live="polite">
              Showing <strong>{items.length}</strong>{" "}
              {items.length === 1 ? "record" : "records"}
            </p>
            <Link className="button button-small" href="/wishlist/add">
              Add a wish
            </Link>
          </div>
          <ul className="collection-grid" aria-label="Records on your wishlist">
            {items.map((item) => (
              <li key={item.id}>
                <WishlistCard
                  item={{
                    id: item.id,
                    priority: item.priority,
                    preferredEdition: item.preferred_edition,
                    maxPriceMinor: item.max_price_minor,
                    priceCurrency: item.price_currency,
                    isPublic: item.is_public,
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
