import { describe, expect, it } from "vitest";

import { createLocalReleaseEnvironment } from "./local-release-environment.mjs";

const localStatus = JSON.stringify({
  API_URL: "http://127.0.0.1:54321",
  PUBLISHABLE_KEY: "local-publishable-key",
  SECRET_KEY: "local-secret-key",
});

describe("local release environment", () => {
  it("uses local Supabase values without exposing them through a command line", () => {
    expect(
      createLocalReleaseEnvironment(localStatus, { PATH: "/bin" }),
    ).toEqual({
      PATH: "/bin",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-publishable-key",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_TELEMETRY_DISABLED: "1",
      PLAYWRIGHT_USE_PRODUCTION: "1",
      RUN_LOCAL_AUTH_E2E: "1",
      SUPABASE_SECRET_KEY: "local-secret-key",
      SUPABASE_TELEMETRY_DISABLED: "1",
    });
  });

  it("supports the legacy local anon and service-role field names", () => {
    const environment = createLocalReleaseEnvironment(
      JSON.stringify({
        API_URL: "http://localhost:54321",
        ANON_KEY: "local-anon-key",
        SERVICE_ROLE_KEY: "local-service-role-key",
      }),
      {},
    );

    expect(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
      "local-anon-key",
    );
    expect(environment.SUPABASE_SECRET_KEY).toBe("local-service-role-key");
  });

  it("refuses hosted projects and incomplete status output", () => {
    expect(() =>
      createLocalReleaseEnvironment(
        JSON.stringify({
          API_URL: "https://project.supabase.co",
          PUBLISHABLE_KEY: "publishable-key",
          SECRET_KEY: "secret-key",
        }),
      ),
    ).toThrow("non-local Supabase project");
    expect(() => createLocalReleaseEnvironment("{}", {})).toThrow(
      "missing the local API URL",
    );
    expect(() => createLocalReleaseEnvironment("not-json", {})).toThrow(
      "valid JSON",
    );
  });
});
