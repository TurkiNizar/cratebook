import type { Metadata } from "next";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <main className="app-content">
      <p className="app-kicker">What comes next</p>
      <h1>Wishlist</h1>
      <p className="app-description">
        Keep the records you are hoping to find close at hand. Wishlist tools
        arrive in Milestone 3.
      </p>
    </main>
  );
}
