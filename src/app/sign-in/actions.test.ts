import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
    },
  }),
}));

import * as emailOtpActions from "./actions";
import { initialEmailOtpState } from "./email-otp-state";

const { requestEmailOtp, verifyEmailOtp } = emailOtpActions;

describe("email OTP actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("exports only async Server Actions from the use-server module", () => {
    expect(Object.values(emailOtpActions)).toEqual([
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it("requests an in-app code for a normalized email", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("email", " Collector@Example.com ");

    await expect(
      requestEmailOtp(initialEmailOtpState, formData),
    ).resolves.toEqual({
      email: "collector@example.com",
      message: "Enter the six-digit code sent to collector@example.com.",
      status: "code-sent",
    });
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "collector@example.com",
    });
  });

  it("validates the email before requesting a code", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");

    await expect(
      requestEmailOtp(initialEmailOtpState, formData),
    ).resolves.toMatchObject({
      message: "Enter a valid email address.",
      status: "error",
    });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("turns the hosted SMTP failure into actionable Google guidance", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: new Error("Error sending confirmation email"),
    });
    const formData = new FormData();
    formData.set("email", "new@example.com");

    await expect(
      requestEmailOtp(initialEmailOtpState, formData),
    ).resolves.toMatchObject({
      message:
        "Email sign-in is temporarily unavailable for this address. Continue with Google instead.",
      status: "error",
    });
  });

  it("verifies the email code and opens the authenticated app", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("email", "Collector@Example.com");
    formData.set("token", "123456");

    await expect(
      verifyEmailOtp(initialEmailOtpState, formData),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      email: "collector@example.com",
      token: "123456",
      type: "email",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/collection");
  });

  it("rejects malformed codes without calling Supabase", async () => {
    const formData = new FormData();
    formData.set("email", "collector@example.com");
    formData.set("token", "12345a");

    await expect(
      verifyEmailOtp(initialEmailOtpState, formData),
    ).resolves.toMatchObject({
      message: "Enter the six-digit code from your email.",
      status: "code-sent",
    });
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("keeps the code form available after an invalid or expired code", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: new Error("expired") });
    const formData = new FormData();
    formData.set("email", "collector@example.com");
    formData.set("token", "123456");

    await expect(
      verifyEmailOtp(initialEmailOtpState, formData),
    ).resolves.toMatchObject({
      message:
        "That code is invalid or expired. Request a new code and try again.",
      status: "code-sent",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
