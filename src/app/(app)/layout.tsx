import Link from "next/link";
import { redirect } from "next/navigation";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile gate query failed", {
      code: profileError.code,
      message: profileError.message,
    });
    throw new Error("Unable to load profile");
  }

  if (!profile?.username) {
    redirect("/onboarding");
  }

  return (
    <div className="app-page">
      <a className="skip-link" href="#app-content">
        Skip to main content
      </a>
      <header className="app-header">
        <Link
          className="brand-link"
          href="/collection"
          aria-label="Cratebook collection"
        >
          <BrandMark />
        </Link>
        <span className="avatar-placeholder" aria-hidden="true">
          {profile.username.slice(0, 2).toUpperCase()}
        </span>
      </header>
      <div id="app-content" tabIndex={-1}>
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}
