import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/add/:path*",
    "/auth/callback",
    "/collection/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/wishlist/:path*",
  ],
};
