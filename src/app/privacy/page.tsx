import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How Cratebook handles account and record-collection data.",
};

export default function PrivacyPage() {
  return (
    <main className="public-info-page">
      <Link className="brand-link" href="/" aria-label="Cratebook home">
        <BrandMark />
      </Link>
      <article>
        <p className="eyebrow">Last updated September 14, 2026</p>
        <h1>Privacy notice</h1>
        <p>
          Cratebook is a personal vinyl collection and wishlist companion. It
          stores only the information needed to provide your account and the
          record details you choose to enter.
        </p>

        <h2>Information Cratebook stores</h2>
        <p>
          Account data includes your email address and sign-in identity. Profile
          data can include a username, display name, bio, and sharing setting.
          Collection and wishlist data can include release details, artwork
          references, condition, acquisition details, prices, notes, tags, and
          visibility choices.
        </p>

        <h2>How information is used</h2>
        <p>
          Your data is used to authenticate you, maintain your collection and
          wishlist, produce exports, and show only the profile and item details
          you explicitly make public. Profiles and items are private by default.
          Cratebook does not sell personal data and currently runs no
          application analytics or advertising trackers.
        </p>

        <h2>Services and catalogue data</h2>
        <p>
          Cratebook uses Supabase for authentication and database storage,
          Vercel for hosting, and Google when you choose Google sign-in.
          Catalogue searches use MusicBrainz and Cover Art Archive. Their
          systems may receive the technical information normally included in a
          web request, such as an IP address and user agent.
        </p>

        <h2>Your choices</h2>
        <p>
          You can keep your profile and every item private, change sharing at
          any time, export your collection and wishlist from Settings, or
          permanently delete your account and Cratebook data. Catalogue artwork
          is referenced from its provider; Cratebook does not currently accept
          personal image uploads.
        </p>
      </article>
      <nav aria-label="Legal and account links">
        <Link href="/terms">Terms of use</Link>
        <Link href="/sign-in">Sign in</Link>
      </nav>
    </main>
  );
}
