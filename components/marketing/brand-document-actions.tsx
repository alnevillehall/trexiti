"use client";

import { useEffect } from "react";

import { trackMarketingEvent } from "@/lib/marketing/analytics";

type ViewEvent = "capability_statement_view" | "media_kit_view";

export function BrandDocumentView({ event, route }: { event: ViewEvent; route: string }) {
  useEffect(() => {
    trackMarketingEvent(event, route);
  }, [event, route]);
  return null;
}

export function CapabilityPrintButton({ className }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={() => {
        trackMarketingEvent("capability_statement_print", "/capabilities/overview");
        trackMarketingEvent("capability_statement_download", "/capabilities/overview", {
          format: "browser_pdf",
          method: "print_dialog",
        });
        window.print();
      }}
      type="button"
    >
      Print / Save as PDF
    </button>
  );
}

export function TrackedAssetDownload({
  asset,
  children,
  className,
  download,
  href,
}: {
  asset: string;
  children: React.ReactNode;
  className?: string;
  download: string;
  href: string;
}) {
  return (
    <a
      className={className}
      download={download}
      href={href}
      onClick={() => {
        trackMarketingEvent("asset_download", "/media-kit", { asset });
      }}
    >
      {children}
    </a>
  );
}
