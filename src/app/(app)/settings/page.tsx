import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import { signOut, updateProfile } from "../actions";

export const metadata: Metadata = { title: "Profile settings" };

type SettingsPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, is_public")
    .eq("id", user!.id)
    .single();

  return (
    <main className="app-content">
      <p className="app-kicker">Your account</p>
      <h1>Profile</h1>
      <p className="app-description">
        Choose how friends see your crate. Purchase details always stay private.
      </p>

      <section
        className="settings-card"
        aria-labelledby="profile-details-title"
      >
        <div className="settings-heading">
          <div>
            <h2 id="profile-details-title">Profile details</h2>
            <p>This is the identity attached to your shared collection.</p>
          </div>
          <span
            className={`visibility-badge ${profile?.is_public ? "is-public" : ""}`}
          >
            {profile?.is_public ? "Public" : "Private"}
          </span>
        </div>

        <form className="form-stack" action={updateProfile}>
          <div className="settings-form-grid">
            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                name="displayName"
                autoComplete="name"
                defaultValue={profile?.display_name ?? ""}
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
                defaultValue={profile?.username ?? ""}
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]"
                required
              />
              <p className="field-hint">
                cratebook.app/u/{profile?.username ?? "your-username"}
              </p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="bio">About your collection</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile?.bio ?? ""}
              maxLength={280}
              placeholder="Jazz discoveries, inherited classics, and everything found in between."
            />
            <p className="field-hint">Up to 280 characters.</p>
          </div>

          <label className="privacy-toggle">
            <span>
              <strong>Public profile</strong>
              <small>
                Let anyone with your profile link see records you mark as
                visible.
              </small>
            </span>
            <span className="toggle-control">
              <input
                name="isPublic"
                type="checkbox"
                defaultChecked={profile?.is_public ?? false}
              />
              <span aria-hidden="true" />
            </span>
          </label>

          {error && (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="form-message form-message-success" role="status">
              Your profile has been saved.
            </p>
          )}

          <div className="settings-actions">
            <button className="button" type="submit">
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section
        className="settings-card settings-card-quiet"
        aria-labelledby="session-title"
      >
        <div className="settings-heading">
          <div>
            <h2 id="session-title">Session</h2>
            <p>Signed in as {user?.email}</p>
          </div>
          <form action={signOut}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
