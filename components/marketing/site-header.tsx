"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { primaryNavigation, siteConfig } from "@/lib/content/site";

import styles from "./trexiti-site.module.css";

function isCurrentPath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const desktopWordmarkRef = useRef<HTMLAnchorElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 56rem)");
    const closeWhenDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches && open) {
        setOpen(false);
        requestAnimationFrame(() => desktopWordmarkRef.current?.focus());
      }
    };

    mobileViewport.addEventListener("change", closeWhenDesktop);
    return () => mobileViewport.removeEventListener("change", closeWhenDesktop);
  }, [open]);

  function closeNavigationAndRestoreFocus() {
    setOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  function handleMobileNavigationKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeNavigationAndRestoreFocus();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      mobileNavigationRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    const first = focusable.at(0);
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <>
      <a
        className={styles.skipLink}
        href="#main-content"
        onClick={(event) => {
          const main = document.getElementById("main-content");

          if (!main) {
            return;
          }

          event.preventDefault();
          window.history.replaceState(null, "", "#main-content");
          main.focus();
          main.scrollIntoView({ block: "start" });
        }}
      >
        Skip to content
      </a>
      <header
        aria-hidden={open ? true : undefined}
        className={`${styles.siteHeader} ${open ? styles.siteHeaderOpen : ""}`}
        inert={open ? true : undefined}
      >
        <div className={styles.headerInner}>
          <Link
            className={styles.wordmark}
            href="/"
            aria-label="Trexiti home"
            onClick={() => setOpen(false)}
            ref={desktopWordmarkRef}
          >
            <Image
              src="/brand/trexiti_logo_icon.svg"
              alt=""
              width={26}
              height={26}
              priority
            />
            <span>Trexiti</span>
          </Link>

          <nav className={styles.desktopNavigation} aria-label="Primary">
            {primaryNavigation.map((item) => {
              const current = isCurrentPath(pathname, item.href);

              return (
                <Link
                  className={current ? styles.navigationItemActive : undefined}
                  aria-current={
                    current
                      ? pathname === item.href
                        ? "page"
                        : "location"
                      : undefined
                  }
                  key={item.href}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link className={styles.headerAction} href="/start-a-project">
            Start a Project
            <span aria-hidden="true">↗</span>
          </Link>

          <button
            className={`${styles.menuButton} ${open ? styles.menuButtonOpen : ""}`}
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-controls="site-mobile-navigation"
            aria-expanded={open}
            onClick={() => {
              if (open) {
                closeNavigationAndRestoreFocus();
                return;
              }

              setOpen(true);
            }}
            ref={menuButtonRef}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            className={styles.mobileNavigation}
            id="site-mobile-navigation"
            aria-label="Site navigation"
            aria-modal="true"
            onKeyDown={handleMobileNavigationKeyDown}
            ref={mobileNavigationRef}
            role="dialog"
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, clipPath: "inset(0 0 100% 0)" }
            }
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, clipPath: "inset(0 0 100% 0)" }
            }
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.mobileNavigationTop}>
              <Link
                className={styles.wordmark}
                href="/"
                aria-label="Trexiti home"
                onClick={() => setOpen(false)}
              >
                <Image
                  src="/brand/trexiti_logo_icon.svg"
                  alt=""
                  width={26}
                  height={26}
                />
                <span>Trexiti</span>
              </Link>
              <button
                className={`${styles.menuButton} ${styles.menuButtonOpen}`}
                type="button"
                aria-label="Close navigation"
                onClick={closeNavigationAndRestoreFocus}
              >
                <span />
                <span />
              </button>
            </div>
            <nav
              className={styles.mobileNavigationInner}
              aria-label="Mobile"
            >
              <div className={styles.mobileNavigationLinks}>
                {primaryNavigation.map((item, index) => {
                  const current = isCurrentPath(pathname, item.href);

                  return (
                    <Link
                      aria-current={
                        current
                          ? pathname === item.href
                            ? "page"
                            : "location"
                          : undefined
                      }
                      className={current ? styles.mobileNavigationActive : undefined}
                      href={item.href}
                      key={item.href}
                      onClick={() => setOpen(false)}
                      ref={index === 0 ? firstLinkRef : undefined}
                    >
                      <span>0{index + 1}</span>
                      <strong>{item.label}</strong>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  );
                })}
                <Link href="/start-a-project" onClick={() => setOpen(false)}>
                  <span>05</span>
                  <strong>Start a Project</strong>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>

              <div className={styles.mobileNavigationMeta}>
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                <p>{siteConfig.serviceArea}</p>
              </div>
            </nav>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
