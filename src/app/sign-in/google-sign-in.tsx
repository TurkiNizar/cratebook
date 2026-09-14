"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/browser";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize(options: {
        callback: (response: GoogleCredentialResponse) => void;
        client_id: string;
        nonce: string;
        ux_mode: "popup";
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          shape: "pill";
          size: "large";
          text: "continue_with";
          theme: "outline";
          width: number;
        },
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

type GoogleSignInProps = {
  clientId: string;
};

function base64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export async function createGoogleNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = base64Url(bytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce),
  );

  return {
    nonce,
    hashedNonce: Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join(""),
  };
}

export function GoogleSignIn({ clientId }: GoogleSignInProps) {
  const router = useRouter();
  const buttonContainer = useRef<HTMLDivElement>(null);
  const initializationStarted = useRef(false);
  const resizeObserver = useRef<ResizeObserver>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const initializeGoogle = useCallback(async () => {
    const google = window.google;
    const container = buttonContainer.current;

    if (!google || !container || initializationStarted.current) return;
    initializationStarted.current = true;

    try {
      const { nonce, hashedNonce } = await createGoogleNonce();
      google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        ux_mode: "popup",
        callback: async ({ credential }) => {
          if (!credential) {
            setError("Google did not return a sign-in credential. Try again.");
            return;
          }

          setError("");
          setIsSigningIn(true);
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: credential,
            nonce,
          });

          if (signInError) {
            setError(
              "Google sign-in could not be completed. Please try again.",
            );
            setIsSigningIn(false);
            return;
          }

          router.replace("/collection");
          router.refresh();
        },
      });

      const renderButton = () => {
        if (!buttonContainer.current) return;
        buttonContainer.current.replaceChildren();
        google.accounts.id.renderButton(buttonContainer.current, {
          shape: "pill",
          size: "large",
          text: "continue_with",
          theme: "outline",
          width: Math.min(
            Math.max(buttonContainer.current.clientWidth, 240),
            400,
          ),
        });
        setIsLoading(false);
      };

      renderButton();
      resizeObserver.current?.disconnect();
      resizeObserver.current = new ResizeObserver(renderButton);
      resizeObserver.current.observe(container);
    } catch {
      initializationStarted.current = false;
      setError(
        "Google sign-in could not be loaded. Please refresh and try again.",
      );
      setIsLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => () => resizeObserver.current?.disconnect(), []);

  return (
    <div className="google-sign-in">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => void initializeGoogle()}
        onError={() => {
          setError(
            "Google sign-in could not be loaded. Please refresh and try again.",
          );
          setIsLoading(false);
        }}
      />
      <div
        ref={buttonContainer}
        className="google-sign-in-button"
        aria-busy={isLoading || isSigningIn}
      />
      {isLoading ? (
        <p className="field-hint" role="status">
          Loading Google sign-in…
        </p>
      ) : null}
      {isSigningIn ? (
        <p className="field-hint" role="status">
          Opening your crate…
        </p>
      ) : null}
      {error ? (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
