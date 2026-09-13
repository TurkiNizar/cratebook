import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  }),
}));

import { GET } from "./route";

describe("authentication callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("exchanges a valid code and keeps a safe internal destination", async () => {
    const response = await GET(
      new Request(
        "https://cratebook.example/auth/callback?code=valid&next=%2Fwishlist%3Fpage%3D2",
      ),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(response.headers.get("location")).toBe(
      "https://cratebook.example/wishlist?page=2",
    );
  });

  it("falls back to the collection for a backslash-based external path", async () => {
    const response = await GET(
      new Request(
        "https://cratebook.example/auth/callback?code=valid&next=%2F%5Cattacker.example%2Fsteal",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://cratebook.example/collection",
    );
  });

  it("returns to sign-in when the code exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error("expired"),
    });

    const response = await GET(
      new Request("https://cratebook.example/auth/callback?code=expired"),
    );

    expect(response.headers.get("location")).toBe(
      "https://cratebook.example/sign-in?error=The%20sign-in%20link%20is%20invalid%20or%20expired",
    );
  });
});
