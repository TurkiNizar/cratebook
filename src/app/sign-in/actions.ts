"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    redirect("/sign-in?error=Enter%20a%20valid%20email%20address");
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const message = /sending confirmation email/i.test(error.message)
      ? "Email sign-in is temporarily unavailable for this address. Continue with Google instead."
      : "We could not send a sign-in link. Please try again.";
    redirect(`/sign-in?error=${encodeURIComponent(message)}`);
  }

  redirect("/sign-in?sent=1");
}
