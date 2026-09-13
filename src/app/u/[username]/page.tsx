import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { BrandMark } from "@/components/brand-mark";
import { RecordPagination } from "@/components/record-pagination";
import {
  getPageHref,
  getPageRange,
  parsePageParam,
  takePage,
} from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

import { PublicCollectionCard, PublicWishlistCard } from "./public-record-card";
import { CopyProfileLink } from "./copy-profile-link";

const getPublicProfile = cache(async (username: string) => {
  const supabase = await createClient();
  return supabase.rpc("get_public_profile", { p_username: username });
});

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const { data, error } = await getPublicProfile(username);
  const profile = data?.[0];

  if (error || !profile) {
    return {
      title: "Profile not found",
      robots: { index: false, follow: false },
    };
  }

  const name = profile.display_name || `@${profile.username}`;
  return {
    title: `${name}'s record collection`,
    description:
      profile.bio ||
      `Browse the records ${name} has chosen to share on Cratebook.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const { username } = await params;
  const query = await searchParams;
  const collectionPage = parsePageParam(query.collectionPage);
  const wishlistPage = parsePageParam(query.wishlistPage);
  const collectionRange = getPageRange(collectionPage);
  const wishlistRange = getPageRange(wishlistPage);
  const supabasePromise = createClient();
  const profilePromise = getPublicProfile(username);
  const itemsPromise = supabasePromise.then((supabase) =>
    Promise.all([
      supabase
        .rpc("get_public_collection_items", { p_username: username })
        .range(collectionRange.from, collectionRange.to),
      supabase
        .rpc("get_public_wishlist_items", { p_username: username })
        .range(wishlistRange.from, wishlistRange.to),
    ]),
  );
  const [profileResult, [collectionResult, wishlistResult]] = await Promise.all(
    [profilePromise, itemsPromise],
  );

  if (profileResult.error) {
    console.error("Public profile query failed", {
      code: profileResult.error.code,
      message: profileResult.error.message,
    });
    throw new Error("Unable to load public profile");
  }

  const profile = profileResult.data?.[0];
  if (!profile) notFound();

  if (collectionResult.error || wishlistResult.error) {
    const error = collectionResult.error ?? wishlistResult.error;
    console.error("Public record query failed", {
      code: error?.code,
      message: error?.message,
    });
    throw new Error("Unable to load shared records");
  }

  if (collectionPage > 1 && collectionResult.data?.length === 0) {
    redirect(getPageHref(`/u/${profile.username}`, query, "collectionPage", 1));
  }
  if (wishlistPage > 1 && wishlistResult.data?.length === 0) {
    redirect(getPageHref(`/u/${profile.username}`, query, "wishlistPage", 1));
  }

  const collectionPageData = takePage(collectionResult.data ?? []);
  const wishlistPageData = takePage(wishlistResult.data ?? []);
  const collection = collectionPageData.items;
  const wishlist = wishlistPageData.items;
  const name = profile.display_name || `@${profile.username}`;

  return (
    <div className="public-profile-page">
      <header className="site-header public-profile-header content-width">
        <Link className="brand-link" href="/" aria-label="Cratebook home">
          <BrandMark />
        </Link>
        <nav aria-label="Account navigation">
          <Link className="text-link" href="/sign-in">
            Sign in
          </Link>
          <Link className="button button-small" href="/sign-in">
            Start your crate
          </Link>
        </nav>
      </header>

      <main className="public-profile-main content-width">
        {profile.is_owner ? (
          <aside
            className={`public-preview-banner ${profile.is_public ? "is-live" : ""}`}
            aria-labelledby="public-preview-title"
          >
            <div>
              <p className="eyebrow">
                {profile.is_public ? "Live public profile" : "Private preview"}
              </p>
              <h2 id="public-preview-title">
                {profile.is_public
                  ? "This is what visitors can see"
                  : "Only you can see this preview"}
              </h2>
              <p>
                {profile.is_public
                  ? "Only records you marked visible appear here. Private prices, sellers, notes, conditions, tags, and catalogue provenance stay hidden."
                  : "These are the records ready to share. Your profile stays unavailable to visitors until you turn on public sharing."}
              </p>
            </div>
            <div className="public-preview-actions">
              <Link className="secondary-button" href="/settings">
                Manage sharing
              </Link>
              {profile.is_public ? (
                <CopyProfileLink username={profile.username} />
              ) : null}
            </div>
          </aside>
        ) : null}

        <section
          className="public-profile-intro"
          aria-labelledby="profile-title"
        >
          <p className="eyebrow">Shared crate</p>
          <h1 id="profile-title">{name}</h1>
          <p className="public-profile-handle">@{profile.username}</p>
          {profile.bio ? (
            <p className="public-profile-bio">{profile.bio}</p>
          ) : null}
          <dl
            className="public-profile-counts"
            aria-label="Shared record counts"
          >
            <div>
              <dt>Collection</dt>
              <dd>{profile.collection_count}</dd>
            </div>
            <div>
              <dt>Wishlist</dt>
              <dd>{profile.wishlist_count}</dd>
            </div>
          </dl>
        </section>

        {collection.length === 0 && wishlist.length === 0 ? (
          <section className="empty-crate public-profile-empty">
            <div>
              <span className="empty-record" aria-hidden="true" />
              <h2>No records shared yet</h2>
              <p>
                {name} has a public profile, but their crate is still private.
              </p>
            </div>
          </section>
        ) : null}

        {collection.length > 0 ? (
          <section
            className="public-profile-section"
            aria-labelledby="shared-collection-title"
          >
            <div className="public-profile-section-heading">
              <div>
                <p className="app-kicker">On the shelf</p>
                <h2 id="shared-collection-title">Collection</h2>
              </div>
              <p>
                {collection.length}{" "}
                {collection.length === 1 ? "record" : "records"}
              </p>
            </div>
            <ul
              className="collection-grid"
              aria-label={`${name}'s shared collection`}
            >
              {collection.map((item) => (
                <li key={item.id}>
                  <PublicCollectionCard item={item} />
                </li>
              ))}
            </ul>
            <RecordPagination
              page={collectionPage}
              hasNextPage={collectionPageData.hasNextPage}
              previousHref={getPageHref(
                `/u/${profile.username}`,
                query,
                "collectionPage",
                collectionPage - 1,
              )}
              nextHref={getPageHref(
                `/u/${profile.username}`,
                query,
                "collectionPage",
                collectionPage + 1,
              )}
              label="Shared collection pages"
            />
          </section>
        ) : null}

        {wishlist.length > 0 ? (
          <section
            className="public-profile-section"
            aria-labelledby="shared-wishlist-title"
          >
            <div className="public-profile-section-heading">
              <div>
                <p className="app-kicker">Hoping to find</p>
                <h2 id="shared-wishlist-title">Wishlist</h2>
              </div>
              <p>
                {wishlist.length} {wishlist.length === 1 ? "record" : "records"}
              </p>
            </div>
            <ul
              className="collection-grid"
              aria-label={`${name}'s shared wishlist`}
            >
              {wishlist.map((item) => (
                <li key={item.id}>
                  <PublicWishlistCard item={item} />
                </li>
              ))}
            </ul>
            <RecordPagination
              page={wishlistPage}
              hasNextPage={wishlistPageData.hasNextPage}
              previousHref={getPageHref(
                `/u/${profile.username}`,
                query,
                "wishlistPage",
                wishlistPage - 1,
              )}
              nextHref={getPageHref(
                `/u/${profile.username}`,
                query,
                "wishlistPage",
                wishlistPage + 1,
              )}
              label="Shared wishlist pages"
            />
          </section>
        ) : null}
      </main>

      <footer className="public-profile-footer content-width">
        <p>Only records this collector chose to share are shown.</p>
        <Link className="text-link text-link-arrow" href="/sign-in">
          Make your own Cratebook <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </div>
  );
}
