"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountActionState = {
  message: string;
};

export async function deleteAccount(
  previousState: DeleteAccountActionState,
  formData: FormData,
): Promise<DeleteAccountActionState> {
  void previousState;

  if (String(formData.get("confirmation") ?? "").trim() !== "DELETE") {
    return { message: "Type DELETE exactly to confirm account deletion." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Account deletion failed", {
        code: error.code,
        message: error.message,
      });
      return {
        message:
          "We could not delete your account. Your data is still intact—please try again.",
      };
    }
  } catch (error) {
    console.error("Account deletion failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      message:
        "We could not delete your account. Your data is still intact—please try again.",
    };
  }

  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.error("Deleted account session cleanup failed", {
        code: error.code,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Deleted account session cleanup failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
  redirect("/sign-in?accountDeleted=1");
}
