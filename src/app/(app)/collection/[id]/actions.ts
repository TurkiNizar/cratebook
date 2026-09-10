"use server";

import { redirect } from "next/navigation";

import { isValidRecordId } from "@/lib/record";
import { createClient } from "@/lib/supabase/server";

export type DeleteRecordActionState = {
  message: string;
};

export async function deleteRecord(
  itemId: string,
  previousState: DeleteRecordActionState,
  formData: FormData,
): Promise<DeleteRecordActionState> {
  void previousState;
  void formData;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!isValidRecordId(itemId)) {
    return { message: "We could not find that copy in your collection." };
  }

  const { data: deletedItem, error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !deletedItem) {
    console.error("Collection copy deletion failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      message:
        "We could not remove this copy. It is still in your collection—please try again.",
    };
  }

  redirect("/collection?removed=1");
}
