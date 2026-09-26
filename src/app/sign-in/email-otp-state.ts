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
