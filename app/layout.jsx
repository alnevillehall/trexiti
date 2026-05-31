import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://trexiti.com"),
  title: "Trexiti | AI Systems for Real Estate and Enterprise Operations",
  description:
    "Trexiti builds AI-powered operating systems, PropertyOS, automation, dashboards, and custom software for real estate portfolios, brokerages, developers, and corporate teams.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Trexiti | AI Systems for Real Estate and Enterprise Operations",
    description:
      "AI-powered operational systems, PropertyOS, automation, dashboards, and custom software for real estate and corporate teams.",
    images: [
      {
        url: "/brand/trexiti_social_banner_1500x500.png",
        width: 1500,
        height: 500,
        alt: "Trexiti - Engineering Intelligent Systems",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trexiti | AI Systems for Real Estate and Enterprise Operations",
    description:
      "AI-powered operational systems for real estate portfolios, brokerages, developers, and corporate teams.",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
