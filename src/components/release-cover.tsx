import Image from "next/image";

import { getCoverArtUrl } from "@/lib/catalogue/provenance";

type ReleaseCoverProps = {
  coverUrl?: string | null;
  title: string;
  className?: string;
  sizes: string;
  meaningful?: boolean;
};

export function ReleaseCover({
  coverUrl,
  title,
  className = "",
  sizes,
  meaningful = false,
}: ReleaseCoverProps) {
  const safeCoverUrl = getCoverArtUrl(coverUrl ?? null);

  return (
    <div
      className={`collection-cover ${safeCoverUrl ? "has-cover-art" : ""} ${className}`.trim()}
      aria-hidden={meaningful ? undefined : true}
    >
      {safeCoverUrl ? (
        <Image
          className="collection-cover-image"
          alt={meaningful ? `${title} cover` : ""}
          src={safeCoverUrl}
          width={500}
          height={500}
          sizes={sizes}
          unoptimized
        />
      ) : (
        <span>{title.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
