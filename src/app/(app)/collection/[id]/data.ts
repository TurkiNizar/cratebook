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
      "id, created_at, is_public, releases(id, artist_display, title, format, disc_count, original_year, release_year, label, catalog_number, country, edition_description, is_reissue, vinyl_color, barcode, matrix_runout)",
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
