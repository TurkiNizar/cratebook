import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppError from "./error";

describe("AppError", () => {
  it("offers recovery without exposing the underlying error", () => {
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<AppError error={new Error("private detail")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "We couldn’t open your crate." }),
    ).toBeVisible();
    expect(screen.queryByText("private detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
