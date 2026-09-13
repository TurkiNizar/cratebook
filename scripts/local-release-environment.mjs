const LOCAL_SUPABASE_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function createLocalReleaseEnvironment(
  statusOutput,
  inheritedEnvironment = process.env,
) {
  let status;

  try {
    status = JSON.parse(statusOutput);
  } catch {
    throw new Error("Supabase status did not return valid JSON.");
  }

  const supabaseUrl = status.API_URL;
  const publishableKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
  const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !publishableKey || !secretKey) {
    throw new Error(
      "Supabase status is missing the local API URL or required API keys.",
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error("Supabase status returned an invalid local API URL.");
  }

  if (!LOCAL_SUPABASE_HOSTS.has(parsedUrl.hostname)) {
    throw new Error(
      "Refusing to run release browser tests against a non-local Supabase project.",
    );
  }

  return {
    ...inheritedEnvironment,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_TELEMETRY_DISABLED: "1",
    PLAYWRIGHT_USE_PRODUCTION: "1",
    RUN_LOCAL_AUTH_E2E: "1",
    SUPABASE_SECRET_KEY: secretKey,
    SUPABASE_TELEMETRY_DISABLED: "1",
  };
}
