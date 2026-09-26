"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type EmailOtpState = {
  email: string;
  message: string;
  status: "idle" | "error" | "code-sent";
};

export const initialEmailOtpState: EmailOtpState = {
  email: "",
  message: "",
  status: "idle",
};

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function requestEmailOtp(
  _previousState: EmailOtpState,
  formData: FormData,
): Promise<EmailOtpState> {
  const email = normalizeEmail(formData.get("email"));

  if (!isValidEmail(email)) {
    return {
      email,
      message: "Enter a valid email address.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    return {
      email,
      message: /sending confirmation email/i.test(error.message)
        ? "Email sign-in is temporarily unavailable for this address. Continue with Google instead."
        : "We could not send a sign-in code. Please wait a moment and try again.",
      status: "error",
    };
  }

  return {
    email,
    message: `Enter the six-digit code sent to ${email}.`,
    status: "code-sent",
  };
}

export async function verifyEmailOtp(
  _previousState: EmailOtpState,
  formData: FormData,
): Promise<EmailOtpState> {
  const email = normalizeEmail(formData.get("email"));
  const token = String(formData.get("token") ?? "").trim();

  if (!isValidEmail(email)) {
    return {
      email: "",
      message: "Request a new sign-in code.",
      status: "error",
    };
  }

  if (!/^\d{6}$/.test(token)) {
    return {
      email,
      message: "Enter the six-digit code from your email.",
      status: "code-sent",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return {
      email,
      message:
        "That code is invalid or expired. Request a new code and try again.",
      status: "code-sent",
    };
  }

  redirect("/collection");
}
