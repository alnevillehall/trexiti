"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

import styles from "./page.module.css";

const links = [
  ["Expertise", "#expertise"],
  ["Results", "#results"],
  ["Resources", "#resources"],
  ["Counsel", "#counsel"],
] as const;

export function MobileMenu() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    const menu = menuRef.current;
    const summary = menu?.querySelector("summary");

    menu?.removeAttribute("open");
    summary?.focus({ preventScroll: true });
  }

  return (
    <details className={styles.mobileMenu} ref={menuRef}>
      <summary aria-label="Open page navigation">
        <Menu size={19} aria-hidden="true" />
        <span>Menu</span>
      </summary>
      <div className={styles.mobileMenuPanel}>
        <p>Navigate</p>
        {links.map(([label, href]) => (
          <Link href={href} key={href} onClick={closeMenu}>
            <span>{label}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </details>
  );
}
