"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  isValidWishlistId,
  type WishlistActionState,
  validateWishlist,
} from "@/lib/wishlist";

export async function updateWishlistItem(
  itemId: string,
  _previousState: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (!isValidWishlistId(itemId))
    return {
      message: "We could not find that wishlist item.",
      fieldErrors: {},
    };

  const validation = validateWishlist(formData);
  if (!validation.success)
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: validation.errors,
    };

  const input = validation.data;
  const { data: updated, error } = await supabase.rpc(
    "update_wishlist_item_details",
    {
      p_item_id: itemId,
      p_artist_display: input.artist,
      p_title: input.title,
      p_priority: input.priority,
      p_preferred_edition: input.preferredEdition ?? undefined,
      p_max_price_minor: input.maxPriceMinor ?? undefined,
      p_price_currency: input.priceCurrency ?? undefined,
      p_notes: input.notes ?? undefined,
      p_is_public: input.isPublic,
    },
  );
  if (error || !updated) {
    console.error("Wishlist item update failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      message:
        "We could not save these changes. Your details are still here—please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${itemId}`);
  redirect(`/wishlist/${itemId}?updated=1`);
}
