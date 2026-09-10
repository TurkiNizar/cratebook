import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RecordError from "./error";

describe("RecordError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers safe recovery without showing the underlying error", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();

    render(
      <RecordError
        error={new Error("private database detail")}
        retry={retry}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "We couldn’t open this record" }),
    ).toBeVisible();
    expect(screen.queryByText("private database detail")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
