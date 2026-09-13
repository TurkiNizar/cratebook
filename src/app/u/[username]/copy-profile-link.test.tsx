import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyProfileLink } from "./copy-profile-link";

describe("CopyProfileLink", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the visitor-facing profile URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CopyProfileLink username="local_collector" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Copy profile link" }),
    );

    expect(writeText).toHaveBeenCalledWith(
      "http://localhost:3000/u/local_collector",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Profile link copied.",
    );
  });

  it("announces when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    render(<CopyProfileLink username="local_collector" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Copy profile link" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Couldn’t copy the link.",
    );
  });
});
