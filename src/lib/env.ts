type PublicEnvironment = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function getPublicEnvironment(): PublicEnvironment {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.example to .env.local and add your project values.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
