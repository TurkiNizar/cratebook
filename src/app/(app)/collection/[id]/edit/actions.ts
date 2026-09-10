"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  isValidRecordId,
  type ManualRecordActionState,
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

  const validation = validateRecordDetails(formData);
  if (!validation.success) {
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: validation.errors,
    };
  }

  const { data: item, error: itemError } = await supabase
    .from("collection_items")
    .select("release_id")
    .eq("id", itemId)
    .maybeSingle();

  if (itemError || !item) {
    console.error("Record lookup for update failed", {
      code: itemError?.code,
      message: itemError?.message,
    });
    return {
      message: "We could not find that record in your collection.",
      fieldErrors: {},
    };
  }

  const input = validation.data;
  const { data: updatedRelease, error: updateError } = await supabase
    .from("releases")
    .update({
      artist_display: input.artist,
      title: input.title,
      format: input.format,
      disc_count: input.discCount,
      original_year: input.originalYear,
      release_year: input.releaseYear,
      label: input.label,
      catalog_number: input.catalogNumber,
      country: input.country,
      edition_description: input.editionDescription,
      is_reissue: input.isReissue,
      vinyl_color: input.vinylColor,
      barcode: input.barcode,
      matrix_runout: input.matrixRunout,
    })
    .eq("id", item.release_id)
    .eq("created_by", user.id)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRelease) {
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
