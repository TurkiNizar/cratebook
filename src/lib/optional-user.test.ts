import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { getOptionalUser } from "./optional-user";

describe("getOptionalUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
  });

  it("returns a validated user when a session is active", async () => {
    const user = { id: "user-1" };
    mocks.getUser.mockResolvedValue({ data: { user } });

    await expect(getOptionalUser()).resolves.toBe(user);
  });

  it("returns null when no session is active", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(getOptionalUser()).resolves.toBeNull();
  });

  it("keeps public pages available when auth cannot be checked", async () => {
    mocks.createClient.mockRejectedValue(new Error("Missing environment"));

    await expect(getOptionalUser()).resolves.toBeNull();
  });
});
