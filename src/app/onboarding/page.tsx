import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";

import { completeOnboarding } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your profile" };

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="auth-page">
      <section className="auth-art" aria-hidden="true">
        <div className="auth-art-copy">
          <p>Your collection has a new home. Make it yours.</p>
        </div>
      </section>
      <section className="auth-panel">
        <span className="brand-link">
          <BrandMark />
        </span>
        <div>
          <p className="eyebrow">One last detail</p>
          <h1>Name your crate.</h1>
          <p className="auth-lead">
            Your username becomes part of your shareable collection link. Your
            profile stays private until you decide otherwise.
          </p>
          <form className="form-stack" action={completeOnboarding}>
            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                name="displayName"
                autoComplete="name"
                maxLength={80}
                placeholder="Alex Morgan"
              />
            </div>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                autoCapitalize="none"
                autoComplete="username"
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]"
                placeholder="alexs_crate"
                required
              />
              <p className="field-hint">cratebook.app/u/your-username</p>
            </div>
            {error && (
              <p className="form-message form-message-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" type="submit">
              Open my crate
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
