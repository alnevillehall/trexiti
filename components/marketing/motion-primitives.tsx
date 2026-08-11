"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { AriaRole, ReactNode } from "react";

import styles from "./trexiti-site.module.css";

const revealEase = [0.22, 1, 0.36, 1] as const;

function classes(...values: Array<string | undefined | false | null>) {
  return values.filter(Boolean).join(" ");
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="wait">
      <m.main
        className={styles.routeFrame}
        id="main-content"
        key={pathname}
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0 : 0.36, ease: revealEase }}
      >
        {children}
      </m.main>
    </AnimatePresence>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16, margin: "0px 0px -8% 0px" }}
      transition={{
        delay: reduceMotion ? 0 : delay / 1000,
        duration: reduceMotion ? 0.01 : 0.72,
        ease: revealEase,
      }}
    >
      {children}
    </m.div>
  );
}

export function Stagger({
  children,
  className,
  delay = 0,
  role,
  step = 0.075,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  role?: AriaRole;
  step?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      role={role}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: reduceMotion ? 0 : delay / 1000,
            staggerChildren: reduceMotion ? 0 : step,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className,
  role,
}: {
  children: ReactNode;
  className?: string;
  role?: AriaRole;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      role={role}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: reduceMotion ? 0.01 : 0.62,
            ease: revealEase,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}

export function WordReveal({
  text,
  accentFrom,
  mode = "view",
}: {
  text: string;
  accentFrom?: number;
  mode?: "load" | "view";
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");
  const variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: reduceMotion ? 0 : 0.08,
        staggerChildren: reduceMotion ? 0 : 0.045,
      },
    },
  };

  return (
    <m.span
      className={styles.wordReveal}
      initial="hidden"
      animate={mode === "load" ? "visible" : undefined}
      whileInView={mode === "view" ? "visible" : undefined}
      viewport={{ once: true, amount: 0.4 }}
      variants={variants}
    >
      <span className={styles.visuallyHidden}>{text}</span>
      {words.map((word, index) => (
        <m.span
          className={classes(
            styles.wordRevealWord,
            accentFrom !== undefined && index >= accentFrom
              ? styles.wordRevealAccent
              : undefined,
          )}
          aria-hidden="true"
          key={`${word}-${index}`}
          variants={{
            hidden: {
              opacity: 0,
              y: reduceMotion ? "0%" : "105%",
              rotate: reduceMotion ? 0 : 1.5,
            },
            visible: {
              opacity: 1,
              y: "0%",
              rotate: 0,
              transition: {
                duration: reduceMotion ? 0.01 : 0.78,
                ease: revealEase,
              },
            },
          }}
        >
          {word}
        </m.span>
      ))}
    </m.span>
  );
}

export function MediaReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={classes(styles.mediaReveal, className)}
      initial="hidden"
      whileInView="visible"
      whileHover={reduceMotion ? undefined : "hover"}
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            delay: reduceMotion ? 0 : delay / 1000,
            duration: reduceMotion ? 0.01 : 0.78,
            ease: revealEase,
          },
        },
        hover: { y: -5 },
      }}
    >
      <m.div
        className={styles.mediaRevealInner}
        variants={{
          hidden: { scale: reduceMotion ? 1 : 1.035 },
          visible: {
            scale: 1,
            transition: {
              delay: reduceMotion ? 0 : delay / 1000,
              duration: reduceMotion ? 0.01 : 1.05,
              ease: revealEase,
            },
          },
          hover: { scale: 1.012 },
        }}
      >
        {children}
      </m.div>
    </m.div>
  );
}
