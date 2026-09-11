"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveCatalogueSelection } from "@/lib/catalogue/persistence";
import {
  getDuplicateConfirmationValue,
  type ManualRecordActionState,
  validateManualRecord,
} from "@/lib/record";
import { createClient } from "@/lib/supabase/server";

export async function createManualRecord(
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

  const validation = validateManualRecord(formData);
  if (!validation.success) {
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: validation.errors,
    };
  }

  const input = validation.data;
  const catalogueId = String(formData.get("catalogueId") ?? "").trim();
  const confirmationValue = getDuplicateConfirmationValue(
    input.artist,
    input.title,
  );

  if (formData.get("duplicateConfirmation") !== confirmationValue) {
    const { data: duplicate, error: duplicateError } = await supabase
      .rpc("find_collection_duplicates", {
        p_artist_display: input.artist,
        p_title: input.title,
      })
      .maybeSingle();

    if (duplicateError) {
      console.error("Duplicate lookup failed", {
        code: duplicateError.code,
        message: duplicateError.message,
      });
    } else if (duplicate) {
      return {
        message: "",
        fieldErrors: {},
        duplicate: {
          collectionItemId: duplicate.collection_item_id,
          artist: duplicate.artist_display,
          title: duplicate.title,
          copyCount: duplicate.copy_count,
          confirmationValue,
        },
      };
    }
  }

  const catalogue = catalogueId
    ? await resolveCatalogueSelection(catalogueId)
    : null;
  if (catalogue?.status === "unavailable") {
    return {
      message:
        "We could not verify this catalogue release right now. Your details are still here—try again, or reopen manual entry to save without catalogue data.",
      fieldErrors: {},
    };
  }

  const release = catalogue?.status === "success" ? catalogue.release : null;
  const rpc = release
    ? supabase.rpc("create_catalogue_collection_item", {
        p_artist_display: input.artist,
        p_title: input.title,
        p_entry_key: input.entryKey,
        p_external_source: release.source,
        p_external_id: release.externalId,
        p_source_data: release.sourceData,
        p_cover_url: release.coverUrl ?? undefined,
        p_format: input.format ?? undefined,
        p_disc_count: input.discCount ?? undefined,
        p_original_year: input.originalYear ?? undefined,
        p_release_year: input.releaseYear ?? undefined,
        p_label: input.label ?? undefined,
        p_catalog_number: input.catalogNumber ?? undefined,
        p_country: input.country ?? undefined,
        p_edition_description: input.editionDescription ?? undefined,
        p_is_reissue: input.isReissue,
        p_vinyl_color: input.vinylColor ?? undefined,
        p_barcode: input.barcode ?? undefined,
        p_matrix_runout: input.matrixRunout ?? undefined,
      })
    : supabase.rpc("create_manual_collection_item", {
        p_artist_display: input.artist,
        p_title: input.title,
        p_entry_key: input.entryKey,
        p_format: input.format ?? undefined,
        p_disc_count: input.discCount ?? undefined,
        p_original_year: input.originalYear ?? undefined,
        p_release_year: input.releaseYear ?? undefined,
        p_label: input.label ?? undefined,
        p_catalog_number: input.catalogNumber ?? undefined,
        p_country: input.country ?? undefined,
        p_edition_description: input.editionDescription ?? undefined,
        p_is_reissue: input.isReissue,
        p_vinyl_color: input.vinylColor ?? undefined,
        p_barcode: input.barcode ?? undefined,
        p_matrix_runout: input.matrixRunout ?? undefined,
      });
  const { data: collectionItemId, error } = await rpc;

  if (error || !collectionItemId) {
    console.error("Manual record creation failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      message:
        "We could not add this record. Your details are still here—please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/collection");
  redirect(`/collection?added=${collectionItemId}`);
}
