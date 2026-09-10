import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DeleteWishlistItem } from "./delete-wishlist-item";

describe("DeleteWishlistItem", () => {
  it("requires explicit confirmation and supports cancellation", async () => {
    const user = userEvent.setup();
    render(
      <DeleteWishlistItem
        action={async () => ({ message: "" })}
        title="Journey in Satchidananda"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Remove from wishlist" }),
    );
    expect(
      screen.getByRole("group", { name: "Remove Journey in Satchidananda?" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Keep wish" }));
    expect(
      screen.queryByRole("group", { name: "Remove Journey in Satchidananda?" }),
    ).toBeNull();
  });
});
