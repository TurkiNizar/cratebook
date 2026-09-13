"use client";

import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true
  );
}

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function InstallApp() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [appleMobile, setAppleMobile] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active && isStandalone()) {
        setInstalled(true);
      }
      if (active && isAppleMobile()) {
        setAppleMobile(true);
      }
    });

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setGuidanceOpen(false);
      setInstalled(true);
      setMessage("Cratebook is installed and ready to open from your device.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      active = false;
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (guidanceOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!guidanceOpen && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [guidanceOpen]);

  const handleInstall = async () => {
    setMessage("");

    if (!installPrompt) {
      setGuidanceOpen(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "dismissed") {
      setMessage("Installation was cancelled. You can try again later.");
    }
  };

  if (installed) {
    return message ? (
      <p className="install-message" role="status">
        {message}
      </p>
    ) : null;
  }

  return (
    <>
      <button className="install-trigger" type="button" onClick={handleInstall}>
        Install app <span aria-hidden="true">↗</span>
      </button>
      {message ? (
        <p className="install-message" role="status">
          {message}
        </p>
      ) : null}
      <dialog
        ref={dialogRef}
        className="install-dialog"
        aria-labelledby="install-dialog-title"
        onCancel={() => setGuidanceOpen(false)}
      >
        <p className="eyebrow">Keep Cratebook close</p>
        <h2 id="install-dialog-title">Install Cratebook</h2>
        <p>
          {appleMobile
            ? "In Safari, open the Share menu, choose Add to Home Screen, then confirm Add."
            : "Open your browser menu and choose Install Cratebook or Add to Home Screen. If that option is unavailable, you can keep using Cratebook in the browser."}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setGuidanceOpen(false)}
        >
          Got it
        </button>
      </dialog>
    </>
  );
}
