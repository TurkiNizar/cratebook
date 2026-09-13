import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/bottom-navigation", () => ({
  BottomNavigation: () => <nav aria-label="Primary navigation" />,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mocks.maybeSingle })),
      })),
    })),
  })),
}));

import AppLayout from "./layout";

describe("AppLayout profile gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-id" } },
      error: null,
    });
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`NEXT_REDIRECT:${destination}`);
    });
  });

  it("renders the app for an authenticated user with a profile", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { username: "listener" },
      error: null,
    });

    render(await AppLayout({ children: <p>Private collection</p> }));

    expect(screen.getByText("Private collection")).toBeVisible();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects only a genuinely missing profile to onboarding", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      AppLayout({ children: <p>Private collection</p> }),
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding");
  });

  it("surfaces a transient profile failure instead of restarting onboarding", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "temporary_failure", message: "database unavailable" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      AppLayout({ children: <p>Private collection</p> }),
    ).rejects.toThrow("Unable to load profile");
    expect(mocks.redirect).not.toHaveBeenCalledWith("/onboarding");
  });
});
