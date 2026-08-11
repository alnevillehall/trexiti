"use client";

import { useMemo, useState } from "react";

import { saveMarketingUtmPresetAction } from "@/app/(admin)/admin/marketing/actions";
import adminStyles from "@/components/admin/admin.module.css";
import { CopyButton } from "@/components/admin/copy-button";
import styles from "@/components/admin/marketing.module.css";
import { buildTaggedUrl } from "@/lib/admin/marketing";

type Preset = {
  id: string;
  name: string;
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  content: string | null;
  term: string | null;
};

const empty = {
  destination: "https://www.trexiti.com/",
  source: "linkedin",
  medium: "founder-organic",
  campaign: "",
  content: "",
  term: "",
};

export function UtmBuilder({ presets, canManage }: { presets: Preset[]; canManage: boolean }) {
  const [values, setValues] = useState(() => {
    const first = presets[0];
    return first
      ? { destination: first.destination, source: first.source, medium: first.medium, campaign: first.campaign, content: first.content ?? "", term: first.term ?? "" }
      : empty;
  });
  const result = useMemo(() => {
    try {
      return { url: buildTaggedUrl(values), error: "" };
    } catch (error) {
      return { url: "", error: error instanceof Error ? error.message : "Review the URL fields." };
    }
  }, [values]);

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function loadPreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setValues({ destination: preset.destination, source: preset.source, medium: preset.medium, campaign: preset.campaign, content: preset.content ?? "", term: preset.term ?? "" });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}><h2>Tagged URL builder</h2><p>Lowercase · hyphenated · consistent</p></div>
      <div className={styles.utmBuilder}>
        <label className={`${styles.inlineField} ${adminStyles.fieldFull}`}>Saved preset<select defaultValue={presets[0]?.id ?? ""} onChange={(event) => loadPreset(event.target.value)}><option value="">Start without a preset</option>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
        <label className={`${styles.inlineField} ${adminStyles.fieldFull}`}>Destination<input onChange={(event) => update("destination", event.target.value)} type="url" value={values.destination} /></label>
        <label className={styles.inlineField}>Source<input onChange={(event) => update("source", event.target.value)} value={values.source} /></label>
        <label className={styles.inlineField}>Medium<input onChange={(event) => update("medium", event.target.value)} value={values.medium} /></label>
        <label className={styles.inlineField}>Campaign<input onChange={(event) => update("campaign", event.target.value)} value={values.campaign} /></label>
        <label className={styles.inlineField}>Content<input onChange={(event) => update("content", event.target.value)} value={values.content} /></label>
        <label className={styles.inlineField}>Term · optional<input onChange={(event) => update("term", event.target.value)} value={values.term} /></label>
        <div className={styles.utmResult} aria-live="polite">{result.error || result.url}</div>
        {result.url ? <CopyButton label="Copy tagged URL" value={result.url} /> : null}
      </div>
      {canManage ? (
        <form action={saveMarketingUtmPresetAction} className={styles.actionForm}>
          <input name="id" type="hidden" value="" />
          {Object.entries(values).map(([name, value]) => <input key={name} name={name} type="hidden" value={value} />)}
          <label className={styles.inlineField}>Save current values as<input name="name" placeholder="Preset name" required /></label>
          <button className={adminStyles.secondaryButton} disabled={Boolean(result.error)} type="submit">Save preset</button>
        </form>
      ) : null}
    </div>
  );
}
