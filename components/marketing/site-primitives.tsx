import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal as MotionReveal } from "./motion-primitives";
import styles from "./trexiti-site.module.css";

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
  size = "wide",
}: {
  children: ReactNode;
  className?: string;
  size?: "narrow" | "standard" | "wide" | "full";
}) {
  return (
    <div
      className={classes(
        styles.container,
        size === "narrow" && styles.containerNarrow,
        size === "standard" && styles.containerStandard,
        size === "wide" && styles.containerWide,
        size === "full" && styles.containerFull,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "primary",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "primary" | "secondary" | "inverse" | "accent";
}) {
  return (
    <section
      className={classes(
        styles.section,
        tone === "secondary" && styles.sectionSecondary,
        tone === "inverse" && styles.sectionInverse,
        tone === "accent" && styles.sectionAccent,
        className,
      )}
      id={id}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "inverse";
  className?: string;
}) {
  return (
    <Link
      className={classes(
        styles.buttonLink,
        variant === "primary" && styles.buttonLinkPrimary,
        variant === "secondary" && styles.buttonLinkSecondary,
        variant === "inverse" && styles.buttonLinkInverse,
        className,
      )}
      href={href}
    >
      <span>{children}</span>
      <span className={styles.actionArrow} aria-hidden="true">
        {"\u2197"}
      </span>
    </Link>
  );
}

export function TextLink({
  children,
  href,
  inverse = false,
  className,
}: {
  children: ReactNode;
  href: string;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      className={classes(
        styles.textAction,
        inverse && styles.textActionInverse,
        className,
      )}
      href={href}
    >
      <span>{children}</span>
      <span className={styles.actionArrow} aria-hidden="true">
        {"\u2197"}
      </span>
    </Link>
  );
}

export function ArrowLink({
  children,
  href,
  tone = "default",
  className,
}: {
  children: ReactNode;
  href: string;
  tone?: "default" | "light" | "solid";
  className?: string;
}) {
  if (tone === "solid") {
    return (
      <ButtonLink className={className} href={href}>
        {children}
      </ButtonLink>
    );
  }

  return (
    <TextLink className={className} href={href} inverse={tone === "light"}>
      {children}
    </TextLink>
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
  return (
    <MotionReveal className={className} delay={delay} distance={distance}>
      {children}
    </MotionReveal>
  );
}

export function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Section className={styles.pageIntro}>
      <Container>
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{title}</h1>
        </Reveal>
        <Reveal className={styles.pageIntroDescription} delay={90}>
          <p>{description}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
