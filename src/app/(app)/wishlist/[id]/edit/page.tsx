import type { Metadata } from "next";
import Link from "next/link";

import {
  WishlistForm,
  type WishlistFormValues,
} from "@/components/wishlist-form";
import { priceMinorToInput } from "@/lib/record";

import { getWishlistItem } from "../data";
import { updateWishlistItem } from "./actions";

export const metadata: Metadata = { title: "Edit wishlist item" };

export default async function EditWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getWishlistItem(id);
  const initialValues: WishlistFormValues = {
    artist: item.releases.artist_display,
    title: item.releases.title,
    priority: item.priority,
    preferredEdition: item.preferred_edition ?? "",
    maxPrice: priceMinorToInput(item.max_price_minor, item.price_currency),
    priceCurrency: item.price_currency ?? "",
    notes: item.notes ?? "",
    isPublic: item.is_public,
  };
  const updateWithId = updateWishlistItem.bind(null, item.id);

  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href={`/wishlist/${item.id}`}>
        ← {item.releases.title}
      </Link>
      <p className="app-kicker">Wishlist details</p>
      <h1>Edit wish</h1>
      <p className="app-description">
        Adjust your priority, preferred pressing, spending limit, or visibility
        as your search changes.
      </p>
      <WishlistForm
        action={updateWithId}
        cancelHref={`/wishlist/${item.id}`}
        initialValues={initialValues}
        variant="edit"
      />
    </main>
  );
}
