import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnvironment } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnvironment();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
