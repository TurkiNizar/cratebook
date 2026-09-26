import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getOptionalUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    // Public entry pages must remain available when auth is not configured or
    // temporarily unavailable. Protected routes keep their strict auth gate.
    return null;
  }
}
