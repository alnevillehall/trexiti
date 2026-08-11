"use client";

import Link from "next/link";
import { useEffect } from "react";

import styles from "./status-page.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="error-title">
        <p className={styles.eyebrow}>System interruption</p>
        <h1 id="error-title">Something did not complete as expected.</h1>
        <p className={styles.description}>
          No information has been submitted from this screen. Try the request
          again, or return to the public site.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={reset}>
            Try again
          </button>
          <Link href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
