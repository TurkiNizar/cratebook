"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  isValidRecordId,
  type ManualRecordActionState,
  validateCopyDetails,
  validateRecordDetails,
} from "@/lib/record";
import { createClient } from "@/lib/supabase/server";

export async function updateRecord(
  itemId: string,
  _previousState: ManualRecordActionState,
  formData: FormData,
): Promise<ManualRecordActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!isValidRecordId(itemId)) {
    return {
      message: "We could not find that record in your collection.",
      fieldErrors: {},
    };
  }

  const recordValidation = validateRecordDetails(formData);
  const copyValidation = validateCopyDetails(formData);
  if (!recordValidation.success || !copyValidation.success) {
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: {
        ...(recordValidation.success ? {} : recordValidation.errors),
        ...(copyValidation.success ? {} : copyValidation.errors),
      },
    };
  }

  const record = recordValidation.data;
  const copy = copyValidation.data;
  const { data: updated, error: updateError } = await supabase.rpc(
    "update_collection_item_details",
    {
      p_item_id: itemId,
      p_artist_display: record.artist,
      p_title: record.title,
      p_format: record.format ?? undefined,
      p_disc_count: record.discCount ?? undefined,
      p_original_year: record.originalYear ?? undefined,
      p_release_year: record.releaseYear ?? undefined,
      p_label: record.label ?? undefined,
      p_catalog_number: record.catalogNumber ?? undefined,
      p_country: record.country ?? undefined,
      p_edition_description: record.editionDescription ?? undefined,
      p_is_reissue: record.isReissue,
      p_vinyl_color: record.vinylColor ?? undefined,
      p_barcode: record.barcode ?? undefined,
      p_matrix_runout: record.matrixRunout ?? undefined,
      p_purchase_state: copy.purchaseState,
      p_media_condition: copy.mediaCondition ?? undefined,
      p_sleeve_condition: copy.sleeveCondition ?? undefined,
      p_acquired_on: copy.acquiredOn ?? undefined,
      p_acquired_from: copy.acquiredFrom ?? undefined,
      p_price_paid_minor: copy.pricePaidMinor ?? undefined,
      p_price_currency: copy.priceCurrency ?? undefined,
      p_rating: copy.rating ?? undefined,
      p_is_favorite: copy.isFavorite,
      p_notes: copy.notes ?? undefined,
    },
  );

  if (updateError || !updated) {
    console.error("Record update failed", {
      code: updateError?.code,
      message: updateError?.message,
    });
    return {
      message:
        "We could not save these changes. Your details are still here—please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/collection");
  revalidatePath(`/collection/${itemId}`);
  redirect(`/collection/${itemId}?updated=1`);
}
