"use server";

import { redirect } from "next/navigation";

import { searchAlbumArtwork } from "@/lib/catalogue/artwork";
import type { CatalogueArtworkSearchState } from "@/lib/catalogue/types";
import { createClient } from "@/lib/supabase/server";

export async function findAlbumArtwork(
  _previousState: CatalogueArtworkSearchState,
  formData: FormData,
): Promise<CatalogueArtworkSearchState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return searchAlbumArtwork(
    String(formData.get("artist") ?? ""),
    String(formData.get("title") ?? ""),
  );
}
