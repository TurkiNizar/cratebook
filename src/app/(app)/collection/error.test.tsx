import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CollectionError from "./error";

describe("CollectionError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers recovery without exposing the database error", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();

    render(
      <CollectionError
        error={new Error("sensitive database detail")}
        retry={retry}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "We couldn’t open your crate" }),
    ).toBeVisible();
    expect(screen.queryByText("sensitive database detail")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
