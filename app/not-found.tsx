import type { Metadata } from "next";
import Link from "next/link";

import styles from "./status-page.module.css";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <p className={styles.eyebrow}>404 / Not found</p>
        <h1 id="not-found-title">This route does not lead anywhere.</h1>
        <p className={styles.description}>
          The page may have moved, or the address may be incomplete. Return to
          Trexiti or continue with the current project conversation.
        </p>
        <div className={styles.actions}>
          <Link href="/">Return home</Link>
          <Link href="/start-a-project">Start a Project</Link>
        </div>
      </section>
    </main>
  );
}
