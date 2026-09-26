import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

vi.mock("./actions", () => ({
  initialEmailOtpState: { email: "", message: "", status: "idle" },
  requestEmailOtp: mocks.requestEmailOtp,
  verifyEmailOtp: mocks.verifyEmailOtp,
}));

import { EmailOtpSignIn } from "./email-otp-sign-in";

describe("EmailOtpSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestEmailOtp.mockResolvedValue({
      email: "collector@example.com",
      message: "Enter the six-digit code sent to collector@example.com.",
      status: "code-sent",
    });
  });

  it("moves from email entry to an accessible one-time-code form", async () => {
    const user = userEvent.setup();
    render(<EmailOtpSignIn />);

    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "collector@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Email me a sign-in code" }),
    );

    expect(
      await screen.findByRole("textbox", { name: "Sign-in code" }),
    ).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByRole("status")).toHaveTextContent(
      "collector@example.com",
    );
    expect(screen.getByRole("button", { name: "Verify code" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Send a new code" }),
    ).toBeVisible();
  });

  it("returns to email entry without exposing the address in a URL", async () => {
    const user = userEvent.setup();
    render(<EmailOtpSignIn />);

    await user.type(
      screen.getByLabelText("Email address"),
      "first@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Email me a sign-in code" }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Use a different email address",
      }),
    );

    expect(screen.getByLabelText("Email address")).toHaveValue(
      "collector@example.com",
    );
  });
});
