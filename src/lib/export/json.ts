import type { Tables } from "@/types/database";

export const JSON_BACKUP_FORMAT = "cratebook-backup";
export const JSON_BACKUP_VERSION = 1;

export type JsonBackupData = {
  profile: Tables<"profiles">;
  releases: Tables<"releases">[];
  collection_items: Tables<"collection_items">[];
  wishlist_items: Tables<"wishlist_items">[];
  tags: Tables<"tags">[];
  collection_item_tags: Tables<"collection_item_tags">[];
};

export function createJsonBackup(
  data: JsonBackupData,
  exportedAt = new Date(),
) {
  return `${JSON.stringify(
    {
      format: JSON_BACKUP_FORMAT,
      version: JSON_BACKUP_VERSION,
      exported_at: exportedAt.toISOString(),
      data,
    },
    null,
    2,
  )}\n`;
}
