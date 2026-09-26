import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

function renderAccountMenu() {
  const signOutAction = vi.fn(async () => undefined);

  render(
    <>
      <AccountMenu
        username="listener"
        email="listener@example.com"
        signOutAction={signOutAction}
      />
      <button type="button">Outside</button>
    </>,
  );

  return { signOutAction };
}

describe("AccountMenu", () => {
  it("reveals account shortcuts and moves focus to the first action", async () => {
    const user = userEvent.setup();
    renderAccountMenu();

    const trigger = screen.getByRole("button", {
      name: "Open account menu for listener",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Account" })).toBeNull();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("@listener")).toBeVisible();
    expect(screen.getByText("listener@example.com")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Profile settings" }),
    ).toHaveAttribute("href", "/settings");
    expect(
      screen.getByRole("link", { name: "Preview public profile" }),
    ).toHaveAttribute("href", "/u/listener");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Profile settings" }),
    ).toHaveFocus();
  });

  it("opens with ArrowDown and restores focus when Escape closes it", async () => {
    const user = userEvent.setup();
    renderAccountMenu();

    const trigger = screen.getByRole("button", {
      name: "Open account menu for listener",
    });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("link", { name: "Profile settings" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Account" })).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes when the user interacts outside the menu", async () => {
    const user = userEvent.setup();
    renderAccountMenu();

    await user.click(
      screen.getByRole("button", { name: "Open account menu for listener" }),
    );
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("navigation", { name: "Account" })).toBeNull();
  });
});
