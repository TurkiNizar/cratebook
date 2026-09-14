import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Plain-language terms for using the Cratebook preview.",
};

export default function TermsPage() {
  return (
    <main className="public-info-page">
      <Link className="brand-link" href="/" aria-label="Cratebook home">
        <BrandMark />
      </Link>
      <article>
        <p className="eyebrow">Last updated September 14, 2026</p>
        <h1>Terms of use</h1>
        <p>
          Cratebook is an early, free preview for keeping a personal vinyl
          collection and wishlist. By using it, you agree to use the service
          lawfully and only with information you are entitled to store and
          share.
        </p>

        <h2>Your account and content</h2>
        <p>
          You are responsible for access to your sign-in account and for the
          text and visibility choices you add to Cratebook. You keep ownership
          of your content. You allow Cratebook to store and display it only as
          needed to operate the service and honor the sharing settings you
          select.
        </p>

        <h2>Catalogue information</h2>
        <p>
          Music metadata and artwork references can come from third-party
          catalogue providers. They may be incomplete or inaccurate, so review
          important release details before relying on them. Provider names and
          attribution remain attached where required.
        </p>

        <h2>Preview availability</h2>
        <p>
          The preview is provided as available and may change, pause, or contain
          errors. Keep an export of information you cannot afford to lose.
          Cratebook may restrict abusive or unlawful use that threatens the
          service or other people.
        </p>

        <h2>Leaving Cratebook</h2>
        <p>
          You can export your data or delete your account from Settings at any
          time. Account deletion permanently removes the Cratebook data linked
          to that account.
        </p>
      </article>
      <nav aria-label="Legal and account links">
        <Link href="/privacy">Privacy notice</Link>
        <Link href="/sign-in">Sign in</Link>
      </nav>
    </main>
  );
}
