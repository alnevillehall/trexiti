import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Space_Grotesk,
} from "next/font/google";

import { siteConfig } from "@/lib/content/site";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: "Trexiti — Digital systems for ambitious businesses",
    template: "%s | Trexiti",
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  category: "technology",
  keywords: [
    "digital systems",
    "custom software",
    "business systems",
    "workflow automation",
    "digital experiences",
    "systems analysis",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Trexiti — Digital systems for ambitious businesses",
    description:
      "We understand how your business works, identify what is slowing it down, and build the systems it needs to operate better.",
    url: "/",
    siteName: siteConfig.name,
    images: [
      {
        url: "/brand/trexiti_social_banner_1500x500.png",
        width: 1500,
        height: 500,
        alt: "Trexiti — digital systems for ambitious businesses",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trexiti — Digital systems for ambitious businesses",
    description:
      "We understand how your business works, identify what is slowing it down, and build the systems it needs to operate better.",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
