import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResQ — Disaster Response Operating Layer",
  description:
    "A map-first disaster response and community resilience console: alerts, safe actions, SOS, relief camps and verified reporting.",
  authors: [{ name: "ResQ" }],
  openGraph: {
    title: "ResQ — Disaster Response Operating Layer",
    description:
      "Warning to safe action in seconds. Incident map, SOS routing, relief coordination and verification in one console.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
