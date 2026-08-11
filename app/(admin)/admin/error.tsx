"use client";

import styles from "@/components/admin/admin.module.css";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className={styles.panel} role="alert">
      <div className={styles.narrative}>
        <h1>Admin data could not be loaded.</h1>
        <p>
          No changes were made. Check the authenticated session and database
          connection, then retry.
        </p>
        <button className={styles.primaryButton} type="button" onClick={reset}>
          Retry
        </button>
      </div>
    </section>
  );
}
