import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My collection",
};

type CollectionPageProps = {
  searchParams: Promise<{ added?: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CollectionPage({
  searchParams,
}: CollectionPageProps) {
  const { added } = await searchParams;
  const supabase = await createClient();
  const countRequest = supabase
    .from("collection_items")
    .select("id", { count: "exact", head: true });
  const addedRequest =
    added && UUID_PATTERN.test(added)
      ? supabase
          .from("collection_items")
          .select("id, releases(artist_display, title)")
          .eq("id", added)
          .maybeSingle()
      : Promise.resolve({ data: null });
  const [{ count }, { data: addedItem }] = await Promise.all([
    countRequest,
    addedRequest,
  ]);
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
      {count === 0 ? (
        <section className="empty-crate">
          <div>
            <span className="empty-record" aria-hidden="true" />
            <h2>Your crate is waiting</h2>
            <p>
              Add your first record with just an artist and title. Details can
              come later.
            </p>
            <Link className="button" href="/add">
              Add your first record
            </Link>
          </div>
        </section>
      ) : (
        <section className="collection-summary">
          <p className="app-kicker">Safely tucked away</p>
          <h2>
            {count} {count === 1 ? "record" : "records"} in your crate
          </h2>
          <p>
            Your records are saved and private. Add another now, or come back
            whenever your crate grows.
          </p>
          <Link className="button" href="/add/manual">
            Add another record
          </Link>
        </section>
      )}
    </main>
  );
}
