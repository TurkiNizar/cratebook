"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getProfileUpdateError, normalizeUsername } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const isPublic = formData.get("isPublic") === "on";
  const validationError = getProfileUpdateError({ username, displayName, bio });

  if (validationError) {
    redirect(`/settings?error=${encodeURIComponent(validationError)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio: bio || null,
      is_public: isPublic,
    })
    .eq("id", user.id);

  if (error) {
    const message =
      error.code === "23505"
        ? "That username is already taken."
        : "We could not save your profile. Please try again.";
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${username}`);
  if (existingProfile?.username && existingProfile.username !== username) {
    revalidatePath(`/u/${existingProfile.username}`);
  }
  redirect("/settings?saved=1");
}
