import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InstallApp } from "./install-app";

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
}

describe("InstallApp", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window.navigator, "standalone", {
      configurable: true,
      value: false,
    });
    setUserAgent("Mozilla/5.0 Chrome/140");
  });

  it("uses the browser install prompt when it becomes available", async () => {
    const user = userEvent.setup();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: typeof prompt;
      userChoice: Promise<{ outcome: "dismissed" }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "dismissed" });

    render(<InstallApp />);
    fireEvent(window, event);
    await user.click(screen.getByRole("button", { name: /install app/i }));

    expect(prompt).toHaveBeenCalledOnce();
    expect(
      await screen.findByText(/installation was cancelled/i),
    ).toBeVisible();
  });

  it("explains the Safari Home Screen flow when no native prompt exists", async () => {
    const user = userEvent.setup();
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");

    render(<InstallApp />);
    await user.click(screen.getByRole("button", { name: /install app/i }));

    const dialog = screen.getByRole("dialog", { name: /install cratebook/i });
    expect(dialog).toHaveTextContent(/share menu/i);
    expect(dialog).toHaveTextContent(/add to home screen/i);

    await user.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not offer installation in standalone mode", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    render(<InstallApp />);

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /install app/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("confirms installation when the browser completes it", async () => {
    render(<InstallApp />);
    fireEvent(window, new Event("appinstalled"));

    expect(
      await screen.findByText(/installed and ready to open/i),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /install app/i }),
    ).not.toBeInTheDocument();
  });
});
