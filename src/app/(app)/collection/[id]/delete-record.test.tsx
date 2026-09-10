import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DeleteRecord } from "./delete-record";

describe("DeleteRecord", () => {
  it("requires explicit confirmation and allows cancellation", async () => {
    const user = userEvent.setup();
    render(
      <DeleteRecord
        action={async () => ({ message: "" })}
        title="Pastel Blues"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Remove from collection" }),
    );
    expect(
      screen.getByRole("group", { name: "Remove Pastel Blues?" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Yes, remove this copy" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Keep record" }));
    expect(
      screen.queryByRole("group", { name: "Remove Pastel Blues?" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove from collection" }),
    ).toBeVisible();
  });
});
