"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import styles from "./marketing-site.module.css";

export type MarketingNavItem = {
  label: string;
  href: string;
};

type MarketingHeaderProps = {
  navItems: readonly MarketingNavItem[];
  cta: MarketingNavItem;
};

export function MarketingHeader({ navItems, cta }: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="Trexiti home">
          <Image
            className={styles.brandIcon}
            src="/brand/trexiti_icon_transparent_1024.png"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span>Trexiti</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link
            className={`${styles.button} ${styles.headerCta}`}
            href={cta.href}
          >
            {cta.label}
          </Link>
        </nav>

        <button
          className={`${styles.navToggle}${open ? ` ${styles.navToggleOpen}` : ""}`}
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="marketing-mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
      </div>

      <nav
        className={`${styles.mobileNav}${open ? ` ${styles.mobileNavOpen}` : ""}`}
        id="marketing-mobile-navigation"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link
          className={`${styles.button} ${styles.headerCta}`}
          href={cta.href}
          onClick={() => setOpen(false)}
        >
          {cta.label}
        </Link>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <Link className={styles.brand} href="/" aria-label="Trexiti home">
          <Image
            className={styles.brandIcon}
            src="/brand/trexiti_icon_transparent_1024.png"
            alt=""
            width={34}
            height={34}
          />
          <span>Trexiti</span>
        </Link>
        <p>Digital systems for ambitious businesses.</p>
        <div className={styles.footerLinks}>
          <Link href="/start-a-project">Start a Project</Link>
          <Link href="/service-businesses">ServiceOS</Link>
          <Link href="/propertyos">PropertyOS</Link>
          <a href="mailto:hello@trexiti.com">hello@trexiti.com</a>
        </div>
      </div>
    </footer>
  );
}
