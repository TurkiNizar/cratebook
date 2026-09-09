"use server";

import { redirect } from "next/navigation";

import { getUsernameError, normalizeUsername } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const rawUsername = String(formData.get("username") ?? "");
  const username = normalizeUsername(rawUsername);
  const usernameError = getUsernameError(username);

  if (usernameError) {
    redirect(`/onboarding?error=${encodeURIComponent(usernameError)}`);
  }

  if (displayName.length > 80) {
    redirect(
      "/onboarding?error=Display%20name%20must%20be%2080%20characters%20or%20fewer",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null, username })
    .eq("id", user.id);

  if (error) {
    const message =
      error.code === "23505"
        ? "That username is already taken."
        : error.message;
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect("/collection");
}
