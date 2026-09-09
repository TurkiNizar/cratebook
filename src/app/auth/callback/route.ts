import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/collection";
  const safeNextPath =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/collection";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      "/sign-in?error=The%20sign-in%20link%20is%20invalid%20or%20expired",
      requestUrl.origin,
    ),
  );
}
