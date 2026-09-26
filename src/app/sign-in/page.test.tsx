import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/optional-user", () => ({
  getOptionalUser: mocks.getOptionalUser,
}));
vi.mock("./email-otp-sign-in", () => ({
  EmailOtpSignIn: () => <button>Email me a sign-in code</button>,
}));
vi.mock("./google-sign-in", () => ({ GoogleSignIn: () => null }));

import SignInPage from "./page";

describe("SignInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOptionalUser.mockResolvedValue(null);
  });

  it("renders sign-in controls for signed-out visitors", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("button", { name: /email me a sign-in code/i }),
    ).toBeVisible();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns visitors with a valid session to their collection", async () => {
    mocks.getOptionalUser.mockResolvedValue({ id: "user-1" });
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      SignInPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/collection");
  });
});
