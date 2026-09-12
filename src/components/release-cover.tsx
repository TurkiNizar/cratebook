"use client";

import Image from "next/image";
import { useState } from "react";

import { getCoverArtUrl } from "@/lib/catalogue/provenance";

type ReleaseCoverProps = {
  coverUrl?: string | null;
  title: string;
  className?: string;
  sizes: string;
  meaningful?: boolean;
  preload?: boolean;
};

export function ReleaseCover({
  coverUrl,
  title,
  className = "",
  sizes,
  meaningful = false,
  preload = false,
}: ReleaseCoverProps) {
  const safeCoverUrl = getCoverArtUrl(coverUrl ?? null);
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const visibleCoverUrl =
    safeCoverUrl && failedCoverUrl !== safeCoverUrl ? safeCoverUrl : null;

  return (
    <div
      className={`collection-cover ${visibleCoverUrl ? "has-cover-art" : ""} ${className}`.trim()}
      aria-hidden={meaningful ? undefined : true}
      aria-label={
        meaningful && !visibleCoverUrl
          ? `${title} cover not available`
          : undefined
      }
      role={meaningful && !visibleCoverUrl ? "img" : undefined}
    >
      {visibleCoverUrl ? (
        <Image
          className="collection-cover-image"
          alt={meaningful ? `${title} cover` : ""}
          src={visibleCoverUrl}
          width={500}
          height={500}
          sizes={sizes}
          preload={preload}
          loading={preload ? undefined : "lazy"}
          onError={() => setFailedCoverUrl(visibleCoverUrl)}
        />
      ) : (
        <span aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
