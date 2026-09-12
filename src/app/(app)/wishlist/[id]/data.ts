import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isValidWishlistId } from "@/lib/wishlist";

export async function getWishlistItem(id: string) {
  if (!isValidWishlistId(id)) notFound();

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("wishlist_items")
    .select(
      "id, created_at, priority, preferred_edition, max_price_minor, price_currency, notes, is_public, releases(id, artist_display, title, cover_url, format, disc_count, original_year, release_year, label, catalog_number, country, edition_description, is_reissue, vinyl_color, barcode, matrix_runout, external_source, external_entity_type, external_id)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Wishlist item query failed", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Unable to load wishlist item");
  }
  if (!item) notFound();
  return item;
}
