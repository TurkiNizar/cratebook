import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

import { requestMagicLink } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, sent } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-art" aria-hidden="true">
        <div className="auth-art-copy">
          <p>Every crate starts with a record worth remembering.</p>
        </div>
      </section>
      <section className="auth-panel">
        <Link className="brand-link" href="/" aria-label="Cratebook home">
          <BrandMark />
        </Link>
        <div>
          <p className="eyebrow">Welcome to your crate</p>
          <h1>Sign in without a password.</h1>
          <p className="auth-lead">
            We will email you a secure link. New here? The same link creates
            your account.
          </p>

          <form className="form-stack" action={requestMagicLink}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            {error && (
              <p className="form-message form-message-error" role="alert">
                {error}
              </p>
            )}
            {sent && (
              <p className="form-message form-message-success" role="status">
                Check your inbox. Your Cratebook sign-in link is on its way.
              </p>
            )}
            <button className="button" type="submit">
              Email me a sign-in link
            </button>
          </form>
          <p className="field-hint" style={{ marginTop: 18 }}>
            By continuing, you agree to keep excellent records. The musical
            kind.
          </p>
        </div>
      </section>
    </main>
  );
}
