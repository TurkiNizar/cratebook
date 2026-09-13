import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  deleteUser: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { deleteAccount } from "./delete-account-actions";

function confirmation(value = "DELETE") {
  const formData = new FormData();
  formData.set("confirmation", value);
  return formData;
}

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: { getUser: mocks.getUser, signOut: mocks.signOut },
    });
    mocks.createAdminClient.mockReturnValue({
      auth: { admin: { deleteUser: mocks.deleteUser } },
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-id" } },
      error: null,
    });
    mocks.deleteUser.mockResolvedValue({ data: {}, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("requires the exact destructive-action confirmation", async () => {
    await expect(
      deleteAccount({ message: "" }, confirmation("delete")),
    ).resolves.toEqual({
      message: "Type DELETE exactly to confirm account deletion.",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("rechecks authentication and never accepts a client-supplied user id", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      deleteAccount({ message: "" }, confirmation()),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in");
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("hard-deletes only the authenticated user and clears the local session", async () => {
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      deleteAccount({ message: "" }, confirmation()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.deleteUser).toHaveBeenCalledWith("owner-id");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?accountDeleted=1");
  });

  it("keeps the account intact and returns a generic error when deletion fails", async () => {
    mocks.deleteUser.mockResolvedValue({
      data: {},
      error: { code: "unexpected_failure", message: "private detail" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      deleteAccount({ message: "" }, confirmation()),
    ).resolves.toEqual({
      message:
        "We could not delete your account. Your data is still intact—please try again.",
    });
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("still completes after deletion when local session cleanup reports an error", async () => {
    mocks.signOut.mockRejectedValue(new Error("cookie cleanup failed"));
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      deleteAccount({ message: "" }, confirmation()),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.deleteUser).toHaveBeenCalledWith("owner-id");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?accountDeleted=1");
  });
});
