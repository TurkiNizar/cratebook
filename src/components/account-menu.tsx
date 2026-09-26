"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type AccountMenuProps = {
  username: string;
  email?: string;
  signOutAction: () => Promise<void>;
};

export function AccountMenu({
  username,
  email,
  signOutAction,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);
  const initials = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    firstActionRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        className="account-menu-trigger"
        type="button"
        aria-label={`Open account menu for ${username}`}
        aria-expanded={isOpen}
        aria-controls="account-menu-panel"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={openWithKeyboard}
      >
        <span className="avatar-placeholder" aria-hidden="true">
          {initials}
        </span>
      </button>

      {isOpen ? (
        <div className="account-menu-panel" id="account-menu-panel">
          <div className="account-menu-identity">
            <strong>@{username}</strong>
            {email ? <span>{email}</span> : null}
          </div>
          <nav className="account-menu-links" aria-label="Account">
            <Link
              ref={firstActionRef}
              href="/settings"
              onClick={() => setIsOpen(false)}
            >
              Profile settings
            </Link>
            <Link href={`/u/${username}`} onClick={() => setIsOpen(false)}>
              Preview public profile
            </Link>
          </nav>
          <form action={signOutAction} className="account-menu-sign-out-form">
            <button className="account-menu-sign-out" type="submit">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
