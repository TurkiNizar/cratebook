import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { getOptionalUser } from "@/lib/optional-user";

import { EmailOtpSignIn } from "./email-otp-sign-in";
import { GoogleSignIn } from "./google-sign-in";

export const metadata: Metadata = {
  title: "Sign in",
};

type SignInPageProps = {
  searchParams: Promise<{
    accountDeleted?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/collection");
  }

  const { accountDeleted, error } = await searchParams;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
            {googleClientId
              ? "Continue with Google to create or open your account in this window."
              : "We will email you a six-digit code. New here? The same code creates your account."}
          </p>
          {accountDeleted === "1" ? (
            <p className="form-message form-message-success" role="status">
              Your Cratebook account and personal data have been deleted.
            </p>
          ) : null}

          {googleClientId ? <GoogleSignIn clientId={googleClientId} /> : null}

          {googleClientId ? (
            <div className="auth-divider">
              <span>or use email</span>
            </div>
          ) : null}
          {error ? (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          ) : null}
          <EmailOtpSignIn />
          <p className="field-hint" style={{ marginTop: 18 }}>
            {googleClientId
              ? "Email delivery is temporarily limited to addresses that have used it before. New collectors should continue with Google. "
              : null}
            By continuing, you agree to our <Link href="/terms">terms</Link> and
            acknowledge our <Link href="/privacy">privacy notice</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
