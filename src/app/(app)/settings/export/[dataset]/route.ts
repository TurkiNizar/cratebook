import { createCollectionCsv, createWishlistCsv } from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";

const RELEASE_COLUMNS =
  "artist_display, title, cover_url, format, disc_count, original_year, release_year, label, catalog_number, country, edition_description, is_reissue, vinyl_color, barcode, matrix_runout, external_source, external_entity_type, external_id";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "text/plain; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;
  if (dataset !== "collection.csv" && dataset !== "wishlist.csv") {
    return new Response("Export not found", {
      status: 404,
      headers: PRIVATE_HEADERS,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Authentication required", {
      status: 401,
      headers: PRIVATE_HEADERS,
    });
  }

  if (dataset === "collection.csv") {
    const { data, error } = await supabase
      .from("collection_items")
      .select(
        `id, created_at, updated_at, purchase_state, media_condition, sleeve_condition, acquired_on, acquired_from, price_paid_minor, price_currency, rating, is_favorite, notes, is_public, collection_item_tags(tags(name)), releases(${RELEASE_COLUMNS})`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Collection CSV export query failed", {
        code: error.code,
        message: error.message,
      });
      return new Response("Unable to create export", {
        status: 500,
        headers: PRIVATE_HEADERS,
      });
    }

    return csvResponse(createCollectionCsv(data), "cratebook-collection.csv");
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      `id, created_at, updated_at, priority, preferred_edition, max_price_minor, price_currency, notes, is_public, releases(${RELEASE_COLUMNS})`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Wishlist CSV export query failed", {
      code: error.code,
      message: error.message,
    });
    return new Response("Unable to create export", {
      status: 500,
      headers: PRIVATE_HEADERS,
    });
  }

  return csvResponse(createWishlistCsv(data), "cratebook-wishlist.csv");
}
