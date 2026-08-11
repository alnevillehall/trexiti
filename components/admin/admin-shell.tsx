import type { AdminSession } from "@/lib/admin/auth";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import styles from "@/components/admin/admin.module.css";

type AdminShellProps = {
  children: React.ReactNode;
  session: AdminSession;
};

export function AdminShell({ children, session }: AdminShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#admin-content">
        Skip to admin content
      </a>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.brandMark}>T</span>
          <span>
            <strong>Trexiti</strong>
            <small>Operating system</small>
          </span>
        </div>
        <AdminNavigation />
        <div className={styles.identityBlock}>
          <span className={styles.avatar} aria-hidden="true">
            {session.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span>
            <strong>{session.name}</strong>
            <small>{session.role.toLowerCase()} · authenticated</small>
          </span>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.topbarLabel}>Internal · Restricted</span>
            <strong>Commercial &amp; marketing operations</strong>
          </div>
          <div className={styles.topbarMeta}>
            <span>USD</span>
            <span>Live pipeline</span>
          </div>
        </header>
        <main id="admin-content" tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
