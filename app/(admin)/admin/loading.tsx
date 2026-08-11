import styles from "@/components/admin/admin.module.css";

export default function AdminLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Loading operational data</p>
          <h1>Preparing workspace…</h1>
        </div>
      </div>
      <div className={styles.metricsGrid} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div className={styles.metric} key={index} />
        ))}
      </div>
    </div>
  );
}
