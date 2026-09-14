import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  redirect: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithOtp: mocks.signInWithOtp },
  }),
}));

import { requestMagicLink } from "./actions";

describe("requestMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({ origin: "https://cratebook.example" }),
    );
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("requests a callback link and confirms that it was sent", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("email", " Collector@Example.com ");

    await expect(requestMagicLink(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "collector@example.com",
      options: {
        emailRedirectTo: "https://cratebook.example/auth/callback",
      },
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?sent=1");
  });

  it("turns the hosted SMTP failure into actionable Google guidance", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: new Error("Error sending confirmation email"),
    });
    const formData = new FormData();
    formData.set("email", "new@example.com");

    await expect(requestMagicLink(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sign-in?error=Email%20sign-in%20is%20temporarily%20unavailable%20for%20this%20address.%20Continue%20with%20Google%20instead.",
    );
  });
});
