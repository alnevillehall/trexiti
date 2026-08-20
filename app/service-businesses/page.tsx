import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceBusinessesPage } from "@/components/marketing/service-businesses-page";
import { isServiceOsEnabled } from "@/lib/auth/config";
import { legacyMarketingFont } from "@/lib/legacy-marketing-font";

const title =
  "Trexiti ServiceOS | Job Management for Caribbean Service Businesses";
const description =
  "Organize customers, estimates, appointments, technicians, job updates and payments in one service-business operating system.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: "/service-businesses",
  },
  openGraph: {
    title,
    description,
    url: "/service-businesses",
    siteName: "Trexiti",
    images: [
      {
        url: "/serviceos-social-card.png",
        width: 1730,
        height: 909,
        alt: "ServiceOS by Trexiti for Caribbean service businesses",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/serviceos-social-card.png"],
  },
};

export default function ServiceBusinessesRoute() {
  if (!isServiceOsEnabled()) {
    notFound();
  }

  return (
    <div className={legacyMarketingFont.variable}>
      <ServiceBusinessesPage />
    </div>
  );
}
