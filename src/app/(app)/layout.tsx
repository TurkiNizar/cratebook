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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.username) {
    redirect("/onboarding");
  }

  return (
    <div className="app-page">
      <header className="app-header">
        <Link
          className="brand-link"
          href="/collection"
          aria-label="Cratebook collection"
        >
          <BrandMark />
        </Link>
        <span className="avatar-placeholder">
          {profile.username.slice(0, 2).toUpperCase()}
        </span>
      </header>
      {children}
      <BottomNavigation />
    </div>
  );
}
