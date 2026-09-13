import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteAccount } from "./delete-account";

describe("DeleteAccount", () => {
  it("explains image handling and requires deliberate confirmation", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<
        (
          previousState: { message: string },
          formData: FormData,
        ) => Promise<{ message: string }>
      >()
      .mockResolvedValue({ message: "" });
    render(<DeleteAccount action={action} />);

    expect(
      screen.getByText(/Cratebook stores no uploaded images in the MVP/),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(
      screen.getByRole("group", {
        name: "Delete your entire Cratebook account?",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("Type DELETE to confirm")).toBeRequired();

    await user.click(screen.getByRole("button", { name: "Keep my account" }));
    expect(
      screen.queryByRole("group", {
        name: "Delete your entire Cratebook account?",
      }),
    ).toBeNull();
    const deleteButton = screen.getByRole("button", {
      name: "Delete my account",
    });
    expect(deleteButton).toHaveFocus();
    expect(action).not.toHaveBeenCalled();
  });

  it("submits the exact confirmation through the provided action", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<
        (
          previousState: { message: string },
          formData: FormData,
        ) => Promise<{ message: string }>
      >()
      .mockResolvedValue({ message: "" });
    render(<DeleteAccount action={action} />);

    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.type(screen.getByLabelText("Type DELETE to confirm"), "DELETE");
    await user.click(
      screen.getByRole("button", { name: "Delete account permanently" }),
    );

    expect(action).toHaveBeenCalledOnce();
    expect(action.mock.calls[0][0]).toEqual({ message: "" });
    expect(action.mock.calls[0][1].get("confirmation")).toBe("DELETE");
  });
});
