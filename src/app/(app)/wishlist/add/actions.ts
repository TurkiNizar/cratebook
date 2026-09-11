"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveCatalogueSelection } from "@/lib/catalogue/persistence";
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
  const catalogueId = String(formData.get("catalogueId") ?? "").trim();
  const catalogueCoverUrl = String(
    formData.get("catalogueCoverUrl") ?? "",
  ).trim();
  const catalogueCoverOriginalUrl = String(
    formData.get("catalogueCoverOriginalUrl") ?? "",
  ).trim();
  const catalogue = catalogueId
    ? await resolveCatalogueSelection(catalogueId, {
        selectedCover:
          catalogueCoverUrl && catalogueCoverOriginalUrl
            ? {
                coverUrl: catalogueCoverUrl,
                originalUrl: catalogueCoverOriginalUrl,
              }
            : undefined,
      })
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
    ? supabase.rpc("create_catalogue_wishlist_item", {
        p_artist_display: input.artist,
        p_title: input.title,
        p_entry_key: input.entryKey,
        p_external_source: release.source,
        p_external_id: release.externalId,
        p_source_data: release.sourceData,
        p_cover_url: release.coverUrl ?? undefined,
        p_format: release.format ?? undefined,
        p_disc_count: release.discCount ?? undefined,
        p_original_year: release.originalYear ?? undefined,
        p_release_year: release.releaseYear ?? undefined,
        p_label: release.label ?? undefined,
        p_catalog_number: release.catalogNumber ?? undefined,
        p_country: release.country ?? undefined,
        p_edition_description: release.editionDescription ?? undefined,
        p_barcode: release.barcode ?? undefined,
        p_priority: input.priority,
        p_preferred_edition: input.preferredEdition ?? undefined,
        p_max_price_minor: input.maxPriceMinor ?? undefined,
        p_price_currency: input.priceCurrency ?? undefined,
        p_notes: input.notes ?? undefined,
        p_is_public: input.isPublic,
      })
    : supabase.rpc("create_manual_wishlist_item", {
        p_artist_display: input.artist,
        p_title: input.title,
        p_entry_key: input.entryKey,
        p_priority: input.priority,
        p_preferred_edition: input.preferredEdition ?? undefined,
        p_max_price_minor: input.maxPriceMinor ?? undefined,
        p_price_currency: input.priceCurrency ?? undefined,
        p_notes: input.notes ?? undefined,
        p_is_public: input.isPublic,
      });
  const { data: itemId, error } = await rpc;

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
