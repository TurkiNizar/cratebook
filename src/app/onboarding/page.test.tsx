import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
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
vi.mock("./actions", () => ({ completeOnboarding: vi.fn() }));

import OnboardingPage from "./page";

describe("OnboardingPage", () => {
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

  it("shows setup only when the authenticated user has no profile", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    render(await OnboardingPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "Name your crate." }),
    ).toBeVisible();
  });

  it("returns an already-onboarded user to the collection", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { username: "listener" },
      error: null,
    });

    await expect(
      OnboardingPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/collection");
  });

  it("does not mistake a profile query failure for missing onboarding", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "temporary_failure", message: "database unavailable" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      OnboardingPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("Unable to load profile");
    expect(mocks.redirect).not.toHaveBeenCalledWith("/onboarding");
  });
});
