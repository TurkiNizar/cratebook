import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Cratebook — Your records, remembered",
    short_name: "Cratebook",
    description:
      "Keep your vinyl collection, its stories, and your wishlist close at hand.",
    start_url: "/collection",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#f3ead7",
    theme_color: "#f3ead7",
    categories: ["music", "lifestyle"],
    prefer_related_applications: false,
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
    shortcuts: [
      {
        name: "My collection",
        short_name: "Collection",
        description: "Browse and search your records.",
        url: "/collection",
      },
      {
        name: "My wishlist",
        short_name: "Wishlist",
        description: "See the records you are looking for.",
        url: "/wishlist",
      },
      {
        name: "Add a record",
        short_name: "Add",
        description: "Search the catalogue or add a record manually.",
        url: "/add",
      },
    ],
  };
}
