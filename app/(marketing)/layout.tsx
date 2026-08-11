import type { ReactNode } from "react";

import { MotionProvider } from "@/components/marketing/motion-provider";
import { RouteTransition } from "@/components/marketing/motion-primitives";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import styles from "@/components/marketing/trexiti-site.module.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.publicSite}>
      <MotionProvider>
        <SiteHeader />
        <RouteTransition>{children}</RouteTransition>
        <SiteFooter />
      </MotionProvider>
    </div>
  );
}
