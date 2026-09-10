import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { WishlistForm } from "@/components/wishlist-form";

import { createWishlistItem } from "./actions";

export const metadata: Metadata = { title: "Add to wishlist" };

export default function AddWishlistPage() {
  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href="/wishlist">
        ← My wishlist
      </Link>
      <p className="app-kicker">A future find</p>
      <h1>Add to wishlist</h1>
      <p className="app-description">
        Save what you are looking for now, then add pressing preferences or a
        spending limit if they matter.
      </p>
      <WishlistForm
        action={createWishlistItem}
        entryKey={randomUUID()}
        variant="create"
      />
    </main>
  );
}
