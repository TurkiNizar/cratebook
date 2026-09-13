import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { createAdminClient } from "./admin";

describe("createAdminClient", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "server-only-secret";
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }
    if (originalSecret === undefined) {
      delete process.env.SUPABASE_SECRET_KEY;
    } else {
      process.env.SUPABASE_SECRET_KEY = originalSecret;
    }
  });

  it("creates a non-persistent server client with the secret key", () => {
    const client = { auth: { admin: {} } };
    createClient.mockReturnValue(client);

    expect(createAdminClient()).toBe(client);
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "server-only-secret",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  });

  it("refuses to create an admin client without the server-only secret", () => {
    delete process.env.SUPABASE_SECRET_KEY;

    expect(() => createAdminClient()).toThrow(
      "Missing server-only Supabase environment variables",
    );
    expect(createClient).not.toHaveBeenCalled();
  });
});
