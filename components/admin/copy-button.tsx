"use client";

import { useState } from "react";

import styles from "@/components/admin/marketing.module.css";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className={styles.copyButton} onClick={copy} type="button">
      {copied ? "Copied" : label}
    </button>
  );
}
