import type { Metadata } from "next";

import { PropertyOSPage } from "@/components/marketing/propertyos-page";
import { legacyMarketingFont } from "@/lib/legacy-marketing-font";

const title =
  "PropertyOS by Trexiti | Real Estate Operations Platform";
const description =
  "PropertyOS gives property managers, landlords, developers and asset owners one connected system for maintenance, tenant requests, rent visibility, owner reporting and portfolio control.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/propertyos",
  },
  openGraph: {
    title,
    description,
    url: "/propertyos",
    siteName: "Trexiti",
    images: [
      {
        url: "/brand/trexiti_social_banner_1500x500.png",
        width: 1500,
        height: 500,
        alt: "PropertyOS by Trexiti",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default function PropertyOSRoute() {
  return (
    <div className={legacyMarketingFont.variable}>
      <PropertyOSPage />
    </div>
  );
}
