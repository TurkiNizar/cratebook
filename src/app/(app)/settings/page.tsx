import type { Metadata } from "next";

import { signOut } from "../actions";

export const metadata: Metadata = { title: "Profile settings" };

export default function SettingsPage() {
  return (
    <main className="app-content">
      <p className="app-kicker">Your account</p>
      <h1>Profile</h1>
      <p className="app-description">
        Public profile and privacy controls will be completed before the MVP
        release.
      </p>
      <form action={signOut} style={{ marginTop: 32, maxWidth: 240 }}>
        <button className="button" type="submit">
          Sign out
        </button>
      </form>
    </main>
  );
}
