"use client";

import { useActionState, useState } from "react";

import { requestEmailOtp, verifyEmailOtp } from "./actions";
import { initialEmailOtpState } from "./email-otp-state";

export function EmailOtpSignIn() {
  const [requestState, requestAction, requestPending] = useActionState(
    requestEmailOtp,
    initialEmailOtpState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailOtp,
    initialEmailOtpState,
  );
  const [changeEmail, setChangeEmail] = useState(false);
  const codeRequested = requestState.status === "code-sent" && !changeEmail;
  const emailRequestAction = (formData: FormData) => {
    setChangeEmail(false);
    requestAction(formData);
  };

  if (codeRequested) {
    return (
      <div className="form-stack">
        <p className="form-message form-message-success" role="status">
          {requestState.message}
        </p>
        <form className="form-stack" action={verifyAction}>
          <input type="hidden" name="email" value={requestState.email} />
          <div className="field">
            <label htmlFor="token">Sign-in code</label>
            <input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              placeholder="123456"
              aria-describedby="code-hint"
              required
              autoFocus
            />
            <p id="code-hint" className="field-hint">
              Codes expire after 10 minutes and can only be used once.
            </p>
          </div>
          {verifyState.message ? (
            <p className="form-message form-message-error" role="alert">
              {verifyState.message}
            </p>
          ) : null}
          <button className="button" type="submit" disabled={verifyPending}>
            {verifyPending ? "Checking code…" : "Verify code"}
          </button>
        </form>
        <form action={emailRequestAction}>
          <input type="hidden" name="email" value={requestState.email} />
          <button
            className="secondary-button auth-secondary-action"
            type="submit"
            disabled={requestPending}
          >
            {requestPending ? "Sending…" : "Send a new code"}
          </button>
        </form>
        <button
          className="auth-change-email"
          type="button"
          onClick={() => setChangeEmail(true)}
        >
          Use a different email address
        </button>
      </div>
    );
  }

  return (
    <form className="form-stack" action={emailRequestAction}>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={requestState.email}
          placeholder="you@example.com"
          required
        />
      </div>
      {requestState.status === "error" ? (
        <p className="form-message form-message-error" role="alert">
          {requestState.message}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={requestPending}>
        {requestPending ? "Sending code…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
