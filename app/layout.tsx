import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RASTAAK | Data Simplified Anywhere at Any Scale",
  description:
    "A unified global file platform for the most demanding enterprise workloads — across data centers, edge, and cloud. Move faster, scale further, work without limits.",
  applicationName: "RASTAAK",
  keywords: ["RASTAAK", "data platform", "file system", "enterprise storage", "AI"],
  openGraph: {
    title: "RASTAAK | Data Simplified Anywhere at Any Scale",
    description:
      "A unified global file platform for the most demanding enterprise workloads.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08081b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
