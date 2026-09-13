import { createJsonBackup } from "@/lib/export/json";
import { createClient } from "@/lib/supabase/server";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "text/plain; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
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

  const [profile, releases, collectionItems, wishlistItems, tags, itemTags] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("releases")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("collection_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("collection_item_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .order("collection_item_id", { ascending: true })
        .order("tag_id", { ascending: true }),
    ]);

  const failedQuery = [
    profile,
    releases,
    collectionItems,
    wishlistItems,
    tags,
    itemTags,
  ].find((result) => result.error);

  if (
    failedQuery?.error ||
    !profile.data ||
    !releases.data ||
    !collectionItems.data ||
    !wishlistItems.data ||
    !tags.data ||
    !itemTags.data
  ) {
    console.error("JSON backup query failed", {
      code: failedQuery?.error?.code ?? "missing_data",
      message:
        failedQuery?.error?.message ?? "An export query returned no data",
    });
    return new Response("Unable to create export", {
      status: 500,
      headers: PRIVATE_HEADERS,
    });
  }

  return new Response(
    createJsonBackup({
      profile: profile.data,
      releases: releases.data,
      collection_items: collectionItems.data,
      wishlist_items: wishlistItems.data,
      tags: tags.data,
      collection_item_tags: itemTags.data,
    }),
    {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Disposition":
          'attachment; filename="cratebook-complete-backup.json"',
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
