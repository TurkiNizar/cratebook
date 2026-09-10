"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ManualRecordActionState } from "@/lib/record";
import { createClient } from "@/lib/supabase/server";
import { isValidWishlistId, validateWishlistConversion } from "@/lib/wishlist";

export async function moveWishlistItemToCollection(
  wishlistItemId: string,
  _previousState: ManualRecordActionState,
  formData: FormData,
): Promise<ManualRecordActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");
  if (!isValidWishlistId(wishlistItemId)) {
    return {
      message: "We could not find that wishlist item.",
      fieldErrors: {},
    };
  }

  const validation = validateWishlistConversion(formData);
  if (!validation.success) {
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: validation.errors,
    };
  }

  const input = validation.data;
  const { data: collectionItemId, error } = await supabase.rpc(
    "convert_wishlist_item_to_collection",
    {
      p_wishlist_item_id: wishlistItemId,
      p_entry_key: input.entryKey,
      p_purchase_state: input.purchaseState,
      p_media_condition: input.mediaCondition ?? undefined,
      p_sleeve_condition: input.sleeveCondition ?? undefined,
      p_acquired_on: input.acquiredOn ?? undefined,
      p_acquired_from: input.acquiredFrom ?? undefined,
      p_price_paid_minor: input.pricePaidMinor ?? undefined,
      p_price_currency: input.priceCurrency ?? undefined,
      p_rating: input.rating ?? undefined,
      p_is_favorite: input.isFavorite,
      p_notes: input.notes ?? undefined,
      p_tags: input.tags,
    },
  );

  if (error || !collectionItemId) {
    console.error("Wishlist conversion failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      message:
        "We could not move this record. It is still on your wishlist—please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/wishlist");
  revalidatePath("/collection");
  redirect(`/collection/${collectionItemId}?moved=1`);
}
