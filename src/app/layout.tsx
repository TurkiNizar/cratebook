import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cratebook.example"),
  title: {
    default: "Cratebook — Your records, remembered",
    template: "%s · Cratebook",
  },
  description:
    "Keep your vinyl collection, its stories, and your wishlist close at hand.",
  applicationName: "Cratebook",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cratebook",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f3ead7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
