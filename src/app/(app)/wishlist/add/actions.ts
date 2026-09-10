"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  type WishlistActionState,
  validateManualWishlist,
} from "@/lib/wishlist";

export async function createWishlistItem(
  _previousState: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const validation = validateManualWishlist(formData);
  if (!validation.success) {
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: validation.errors,
    };
  }

  const input = validation.data;
  const { data: itemId, error } = await supabase.rpc(
    "create_manual_wishlist_item",
    {
      p_artist_display: input.artist,
      p_title: input.title,
      p_entry_key: input.entryKey,
      p_priority: input.priority,
      p_preferred_edition: input.preferredEdition ?? undefined,
      p_max_price_minor: input.maxPriceMinor ?? undefined,
      p_price_currency: input.priceCurrency ?? undefined,
      p_notes: input.notes ?? undefined,
      p_is_public: input.isPublic,
    },
  );

  if (error || !itemId) {
    console.error("Wishlist item creation failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      message:
        "We could not add this record. Your details are still here—please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/wishlist");
  redirect(`/wishlist?added=${itemId}`);
}
