import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));
vi.mock("@/lib/env", () => ({
  getPublicEnvironment: () => ({
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "publishable-key",
  }),
}));

import { updateSession } from "./proxy";

describe("updateSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createServerClient.mockReturnValue({
      auth: { getUser: mocks.getUser },
    });
  });

  it("redirects an unauthenticated protected request before rendering", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await updateSession(
      new NextRequest("http://localhost/collection?sort=artist"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/sign-in");
  });

  it("allows an authenticated protected request", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-id" } },
      error: null,
    });

    const response = await updateSession(
      new NextRequest("http://localhost/settings"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows the authentication callback without an existing session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await updateSession(
      new NextRequest("http://localhost/auth/callback?code=example"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
