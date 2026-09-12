import { notFound } from "next/navigation";

import { isValidRecordId } from "@/lib/record";
import { createClient } from "@/lib/supabase/server";

export async function getCollectionRecord(id: string) {
  if (!isValidRecordId(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("collection_items")
    .select(
      "id, created_at, is_public, purchase_state, media_condition, sleeve_condition, acquired_on, acquired_from, price_paid_minor, price_currency, rating, is_favorite, notes, collection_item_tags(tags(name)), releases(id, artist_display, title, cover_url, format, disc_count, original_year, release_year, label, catalog_number, country, edition_description, is_reissue, vinyl_color, barcode, matrix_runout, external_source, external_entity_type, external_id)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Collection record query failed", {
      code: error.code,
      message: error.message,
    });
    throw new Error("Unable to load record");
  }

  if (!item) {
    notFound();
  }

  return item;
}
