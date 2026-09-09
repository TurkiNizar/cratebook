import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cratebook — Your records, remembered",
    short_name: "Cratebook",
    description:
      "Keep your vinyl collection, its stories, and your wishlist close at hand.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3ead7",
    theme_color: "#f3ead7",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
