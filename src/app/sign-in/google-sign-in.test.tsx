import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signInWithIdToken: vi.fn(),
}));

vi.mock("next/script", () => ({
  default: ({ onReady }: { onReady: () => void }) => {
    queueMicrotask(() => {
      onReady();
      onReady();
    });
    return null;
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({
    auth: { signInWithIdToken: mocks.signInWithIdToken },
  }),
}));

import { GoogleSignIn } from "./google-sign-in";

describe("GoogleSignIn", () => {
  let credentialCallback: (response: { credential?: string }) => void;
  const initialize = vi.fn(
    (options: { callback: typeof credentialCallback }) => {
      credentialCallback = options.callback;
    },
  );
  const renderButton = vi.fn((parent: HTMLElement) => {
    const button = document.createElement("button");
    button.textContent = "Continue with Google";
    parent.append(button);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 320,
    });
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: class {
        disconnect() {}
        observe() {}
      },
    });
    Object.defineProperty(globalThis.crypto, "subtle", {
      configurable: true,
      value: { digest: vi.fn(async () => new Uint8Array(32).buffer) },
    });
    Object.defineProperty(window, "google", {
      configurable: true,
      value: { accounts: { id: { initialize, renderButton } } },
    });
    mocks.signInWithIdToken.mockResolvedValue({ error: null });
  });

  it("renders the official button with a hashed nonce", async () => {
    render(<GoogleSignIn clientId="public-client-id" />);

    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    expect(initialize).toHaveBeenCalledOnce();
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "public-client-id",
        nonce: "0".repeat(64),
        ux_mode: "popup",
      }),
    );
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  it("exchanges the credential and enters the authenticated app", async () => {
    render(<GoogleSignIn clientId="public-client-id" />);
    await waitFor(() => expect(initialize).toHaveBeenCalled());

    await act(async () => credentialCallback({ credential: "google-jwt" }));

    expect(mocks.signInWithIdToken).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        token: "google-jwt",
        nonce: expect.any(String),
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/collection");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the user on the page when Supabase rejects the credential", async () => {
    mocks.signInWithIdToken.mockResolvedValue({ error: new Error("rejected") });
    render(<GoogleSignIn clientId="public-client-id" />);
    await waitFor(() => expect(initialize).toHaveBeenCalled());

    await act(async () => credentialCallback({ credential: "google-jwt" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /could not be completed/i,
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
