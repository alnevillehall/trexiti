import { Suspense, type ReactNode } from "react";

import { AnalyticsProvider } from "@/components/marketing/analytics-provider";
import { MotionProvider } from "@/components/marketing/motion-provider";
import { RouteTransition } from "@/components/marketing/motion-primitives";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import styles from "@/components/marketing/trexiti-site.module.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const analyticsEnabled =
    process.env.NEXT_PUBLIC_TREXITI_ANALYTICS_PROVIDER === "first-party";

  return (
    <div className={styles.publicSite}>
      <MotionProvider>
        <Suspense fallback={null}>
          <AnalyticsProvider enabled={analyticsEnabled} />
        </Suspense>
        <SiteHeader />
        <RouteTransition>{children}</RouteTransition>
        <SiteFooter analyticsEnabled={analyticsEnabled} />
      </MotionProvider>
    </div>
  );
}
