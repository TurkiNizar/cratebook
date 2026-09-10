"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isValidWishlistId } from "@/lib/wishlist";

export type DeleteWishlistActionState = { message: string };

export async function deleteWishlistItem(
  itemId: string,
  _previousState: DeleteWishlistActionState,
  _formData: FormData,
): Promise<DeleteWishlistActionState> {
  void _previousState;
  void _formData;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (!isValidWishlistId(itemId))
    return { message: "We could not find that wishlist item." };

  const { data: deleted, error } = await supabase.rpc("delete_wishlist_item", {
    p_item_id: itemId,
  });
  if (error || !deleted) {
    console.error("Wishlist item deletion failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      message:
        "We could not remove this record. It is still on your wishlist—please try again.",
    };
  }

  revalidatePath("/wishlist");
  redirect("/wishlist?removed=1");
}
