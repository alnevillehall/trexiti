import Image from "next/image";
import Link from "next/link";

import { footerNavigation, siteConfig } from "@/lib/content/site";

import styles from "./trexiti-site.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Link className={styles.wordmark} href="/" aria-label="Trexiti home">
            <Image
              src="/brand/trexiti_logo_icon.svg"
              alt=""
              width={26}
              height={26}
            />
            <span>Trexiti</span>
          </Link>
          <p>{siteConfig.tagline}</p>
        </div>

        <FooterColumn title="Work" links={footerNavigation.work} />
        <FooterColumn
          title="Capabilities"
          links={footerNavigation.capabilities}
        />
        <FooterColumn title="Company" links={footerNavigation.company} />

        <div className={styles.footerColumn}>
          <p>Contact</p>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <span className={styles.footerPlaceholder}>
            {siteConfig.linkedInLabel}
          </span>
          <span className={styles.footerServiceArea}>
            {siteConfig.serviceArea}
          </span>
        </div>
      </div>

      <div className={styles.footerClosing}>
        <span>Websites.</span>
        <span>Software.</span>
        <span>Systems.</span>
        <strong>Built around how your business actually works.</strong>
      </div>

      <div className={styles.footerMeta}>
        <p>© {new Date().getFullYear()} Trexiti. All rights reserved.</p>
        <p>Strategy · Design · Engineering · Improvement</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  const labelId = `footer-${title.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <nav className={styles.footerColumn} aria-labelledby={labelId}>
      <p id={labelId}>{title}</p>
      {links.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
