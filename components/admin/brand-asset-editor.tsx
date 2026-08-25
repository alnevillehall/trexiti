"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  markBrandAssetExportedAction,
  saveBrandAssetDesignAction,
} from "@/app/(admin)/admin/marketing/actions";
import {
  brandAssetFormats,
  brandAssetTemplates,
  getBrandAssetFormat,
  getBrandAssetIssues,
  normalizeSlides,
  safeAssetFilename,
  type BrandAssetDraft,
  type BrandAssetFormatId,
  type BrandAssetTemplateId,
} from "@/lib/admin/brand-assets";
import { createZipBlob } from "@/lib/admin/brand-asset-zip";
import { canvasToBlob, renderBrandAsset, waitForBrandFonts } from "@/lib/admin/brand-asset-renderer";

import styles from "./brand-asset-editor.module.css";

type Option = { id: string; name: string };
type ContentOption = { id: string; title: string };

type BrandAssetEditorProps = {
  initialDraft: BrandAssetDraft;
  campaigns: Option[];
  content: ContentOption[];
  canManage: boolean;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BrandAssetEditor({ initialDraft, campaigns, content, canManage }: BrandAssetEditorProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [fontState, setFontState] = useState<"checking" | "ready" | "fallback">("checking");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const issues = useMemo(() => getBrandAssetIssues(draft), [draft]);
  const previewDraft = useDeferredValue(draft);
  const hasErrors = issues.some((issue) => issue.level === "error");
  const format = getBrandAssetFormat(draft.format);

  useEffect(() => {
    let active = true;
    void waitForBrandFonts().then((loaded) => {
      if (active) setFontState(loaded ? "ready" : "fallback");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const frame = requestAnimationFrame(() => {
      renderBrandAsset(canvas, previewDraft, { slideIndex, showSafeArea });
    });
    return () => cancelAnimationFrame(frame);
  }, [fontState, previewDraft, showSafeArea, slideIndex]);

  function update<K extends keyof BrandAssetDraft>(field: K, value: BrandAssetDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function chooseTemplate(template: BrandAssetTemplateId) {
    setDraft((current) => {
      const slideCount = template === "CAROUSEL" ? Math.max(2, current.slideCount) : 1;
      return {
        ...current,
        template,
        slideCount,
        slides: template === "CAROUSEL" ? normalizeSlides(current.slides, slideCount) : current.slides,
      };
    });
    setSlideIndex(0);
    setMessage(null);
  }

  function changeSlideCount(value: number) {
    const slideCount = Math.max(2, Math.min(12, Number.isFinite(value) ? Math.round(value) : 2));
    setDraft((current) => ({ ...current, slideCount, slides: normalizeSlides(current.slides, slideCount) }));
    setSlideIndex((current) => Math.min(current, slideCount - 1));
    setMessage(null);
  }

  function updateSlide(index: number, field: "title" | "body", value: string) {
    setDraft((current) => {
      const slides = normalizeSlides(current.slides, current.slideCount);
      slides[index] = { ...slides[index], [field]: value, copy: undefined };
      return { ...current, slides };
    });
    setMessage(null);
  }

  function handleSave() {
    if (!canManage || hasErrors) return;
    setMessage(null);
    startSaving(async () => {
      try {
        const result = await saveBrandAssetDesignAction(draft);
        setDraft((current) => ({ ...current, id: result.id }));
        setMessage({
          tone: "success",
          text: result.approvalRequested
            ? "Archive approval requested. The asset remains unchanged until founder approval executes."
            : "Asset configuration saved to the Marketing OS library.",
        });
        if (!draft.id) router.replace(`/admin/marketing/assets/${result.id}`);
        else router.refresh();
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "The asset could not be saved." });
      }
    });
  }

  async function markExported() {
    if (!draft.id || !canManage) return;
    try {
      await markBrandAssetExportedAction(draft.id);
    } catch {
      setMessage({ tone: "error", text: "The file downloaded, but the export timestamp could not be recorded." });
    }
  }

  async function exportCurrentPng() {
    if (hasErrors) return;
    setExporting(true);
    setMessage(null);
    try {
      const loaded = await waitForBrandFonts();
      setFontState(loaded ? "ready" : "fallback");
      if (!loaded) throw new Error("Trexiti brand fonts are not ready. Reload the page before exporting.");
      const canvas = document.createElement("canvas");
      renderBrandAsset(canvas, draft, { slideIndex, showSafeArea: false });
      const blob = await canvasToBlob(canvas);
      const slideSuffix = draft.template === "CAROUSEL" ? `-${String(slideIndex + 1).padStart(2, "0")}` : "";
      downloadBlob(blob, `${safeAssetFilename(draft.name)}${slideSuffix}-${format.width}x${format.height}.png`);
      await markExported();
      setMessage({ tone: "success", text: "High-resolution PNG exported without editor chrome or safe-area guides." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "PNG export failed in this browser." });
    } finally {
      setExporting(false);
    }
  }

  async function exportCarouselZip() {
    if (draft.template !== "CAROUSEL" || hasErrors) return;
    setExporting(true);
    setMessage(null);
    try {
      const loaded = await waitForBrandFonts();
      setFontState(loaded ? "ready" : "fallback");
      if (!loaded) throw new Error("Trexiti brand fonts are not ready. Reload the page before exporting.");
      const entries = [];
      for (let index = 0; index < draft.slideCount; index += 1) {
        const canvas = document.createElement("canvas");
        renderBrandAsset(canvas, draft, { slideIndex: index, showSafeArea: false });
        const blob = await canvasToBlob(canvas);
        entries.push({
          name: `${safeAssetFilename(draft.name)}-${String(index + 1).padStart(2, "0")}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
      }
      downloadBlob(createZipBlob(entries), `${safeAssetFilename(draft.name)}-${format.width}x${format.height}.zip`);
      await markExported();
      setMessage({ tone: "success", text: `${entries.length} individual PNG files exported in one ZIP archive.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Carousel export failed in this browser." });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={styles.editorShell}>
      <div className={styles.controls}>
        <section className={styles.section} aria-labelledby="template-title">
          <div className={styles.sectionHeader}>
            <div><h2 id="template-title">Template</h2><p>Bounded compositions, not free-form layers.</p></div>
          </div>
          <div className={styles.templateGrid}>
            {brandAssetTemplates.map((template) => (
              <label className={styles.templateOption} key={template.id}>
                <input
                  checked={draft.template === template.id}
                  disabled={!canManage}
                  name="template"
                  onChange={() => chooseTemplate(template.id)}
                  type="radio"
                  value={template.id}
                />
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="asset-settings-title">
          <div className={styles.sectionHeader}><h2 id="asset-settings-title">Asset settings</h2></div>
          <div className={styles.fieldGrid}>
            <label className={styles.fieldFull}>Library name
              <input disabled={!canManage} maxLength={220} onChange={(event) => update("name", event.target.value)} value={draft.name} />
            </label>
            <label className={styles.field}>Output size
              <select disabled={!canManage} onChange={(event) => update("format", event.target.value as BrandAssetFormatId)} value={draft.format}>
                {brandAssetFormats.map((option) => <option key={option.id} value={option.id}>{option.label} · {option.width} × {option.height}</option>)}
              </select>
            </label>
            <label className={styles.field}>Treatment
              <select disabled={!canManage} onChange={(event) => update("variant", event.target.value as BrandAssetDraft["variant"])} value={draft.variant}>
                <option value="LIGHT">Light / paper</option>
                <option value="DARK">Dark / ink</option>
              </select>
            </label>
            <label className={styles.field}>Status
              <select disabled={!canManage} onChange={(event) => update("status", event.target.value as BrandAssetDraft["status"])} value={draft.status}>
                <option value="REQUESTED">Requested</option><option value="IN_PRODUCTION">In production</option><option value="REVIEW">Review</option><option value="READY">Ready</option><option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className={styles.field}>Campaign
              <select disabled={!canManage} onChange={(event) => update("campaignId", event.target.value)} value={draft.campaignId}>
                <option value="">No campaign</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              </select>
            </label>
            <label className={styles.fieldFull}>Content record
              <select disabled={!canManage} onChange={(event) => update("contentId", event.target.value)} value={draft.contentId}>
                <option value="">No linked content</option>{content.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="copy-title">
          <div className={styles.sectionHeader}><h2 id="copy-title">Copy</h2><p>Characters are checked against the selected format.</p></div>
          <div className={styles.fieldGrid}>
            <label className={styles.fieldFull}>Eyebrow
              <input disabled={!canManage} maxLength={120} onChange={(event) => update("eyebrow", event.target.value)} value={draft.eyebrow} />
              <span className={styles.counter}>{draft.eyebrow.length}/120</span>
            </label>
            <label className={styles.fieldFull}>Title
              <textarea disabled={!canManage} maxLength={220} onChange={(event) => update("title", event.target.value)} value={draft.title} />
              <span className={styles.counter}>{draft.title.length}/220</span>
            </label>
            <label className={styles.fieldFull}>Body
              <textarea disabled={!canManage} maxLength={2000} onChange={(event) => update("body", event.target.value)} value={draft.body} />
              <span className={styles.counter}>{draft.body.length}/2000</span>
            </label>
            <label className={styles.fieldFull}>CTA
              <input disabled={!canManage} maxLength={160} onChange={(event) => update("cta", event.target.value)} value={draft.cta} />
              <span className={styles.counter}>{draft.cta.length}/160</span>
            </label>
          </div>
        </section>

        {draft.template === "CAROUSEL" ? (
          <section className={styles.section} aria-labelledby="slides-title">
            <div className={styles.sectionHeader}><h2 id="slides-title">Carousel slides</h2><p>2–12 slides · exported as numbered PNGs.</p></div>
            <label className={styles.field}>Slide count
              <input disabled={!canManage} max={12} min={2} onChange={(event) => changeSlideCount(event.target.valueAsNumber)} type="number" value={draft.slideCount} />
            </label>
            {normalizeSlides(draft.slides, draft.slideCount).map((slide, index) => (
              <details className={styles.slideEditor} key={index} open={index === slideIndex}>
                <summary onClick={() => setSlideIndex(index)}>Slide {index + 1} · {slide.title || "Untitled"}</summary>
                <div className={styles.slideFields}>
                  <label className={styles.fieldFull}>Title<input disabled={!canManage} maxLength={220} onChange={(event) => updateSlide(index, "title", event.target.value)} value={slide.title} /></label>
                  <label className={styles.fieldFull}>Body<textarea disabled={!canManage} maxLength={2000} onChange={(event) => updateSlide(index, "body", event.target.value)} value={slide.body} /></label>
                </div>
              </details>
            ))}
          </section>
        ) : null}

        {(draft.template === "SYSTEM_FLOW" || draft.template === "SYSTEMS_REVIEW") ? (
          <section className={styles.section} aria-labelledby="nodes-title">
            <div className={styles.sectionHeader}><h2 id="nodes-title">System nodes</h2><p>One named node per line · maximum 8.</p></div>
            <label className={styles.fieldFull}>Nodes
              <textarea
                disabled={!canManage}
                onChange={(event) => update("systemNodes", event.target.value.split("\n").map((node) => node.trim()).filter(Boolean).slice(0, 8))}
                value={draft.systemNodes.join("\n")}
              />
            </label>
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="access-title">
          <div className={styles.sectionHeader}><h2 id="access-title">Destination & accessibility</h2></div>
          <div className={styles.fieldGrid}>
            <label className={styles.fieldFull}>Destination URL
              <input disabled={!canManage} onChange={(event) => update("destinationUrl", event.target.value)} type="url" value={draft.destinationUrl} />
            </label>
            <label className={styles.fieldFull}>Alt text
              <textarea disabled={!canManage} maxLength={1000} onChange={(event) => update("altText", event.target.value)} value={draft.altText} />
              <span className={styles.counter}>{draft.altText.length}/1000 · required for READY</span>
            </label>
            <label className={styles.fieldFull}>Internal notes
              <textarea disabled={!canManage} maxLength={10000} onChange={(event) => update("notes", event.target.value)} value={draft.notes} />
            </label>
          </div>
          {issues.length ? <ul className={styles.issues}>{issues.map((issue, index) => <li className={styles.issue} data-level={issue.level} key={`${issue.field}-${index}`}>{issue.message}</li>)}</ul> : <p className={styles.notice} data-tone="success">Copy fits the current guardrails.</p>}
          {message ? <p className={styles.notice} data-tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p> : null}
          <div className={styles.actions}>
            <button className={styles.primary} disabled={!canManage || hasErrors || isSaving} onClick={handleSave} type="button">{isSaving ? "Saving…" : draft.id ? "Save changes" : "Save to asset library"}</button>
          </div>
          {!canManage ? <p className={styles.notice}>Your role has read-only Marketing OS access. An owner or admin can edit and export this design.</p> : null}
        </section>
      </div>

      <aside className={styles.previewPanel} aria-label="Asset preview and export">
        <div className={styles.previewToolbar}>
          <div><strong>Deterministic preview</strong><span>{format.label} · {format.width} × {format.height} · {fontState === "ready" ? "brand fonts ready" : fontState === "checking" ? "checking fonts" : "fallback font warning"}</span></div>
          <label className={styles.toggle}><input checked={showSafeArea} onChange={(event) => setShowSafeArea(event.target.checked)} type="checkbox" /> Safe area</label>
        </div>
        <div className={styles.canvasStage}>
          <canvas className={styles.canvas} ref={previewRef} role="img" aria-label={draft.altText || `Preview of ${draft.name}`}>Preview of {draft.name}</canvas>
        </div>
        {draft.template === "CAROUSEL" ? <div className={styles.slideNav} aria-label="Preview slide">{Array.from({ length: draft.slideCount }, (_, index) => <button aria-current={slideIndex === index} key={index} onClick={() => setSlideIndex(index)} type="button">{String(index + 1).padStart(2, "0")}</button>)}</div> : null}
        <div className={styles.exportBar}>
          <div>
            <strong className={styles.hint}>Browser export</strong>
            <p className={styles.notice}>PNG is rendered locally; no image or copy is sent to a third-party service.</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.secondary} disabled={!canManage || hasErrors || exporting} onClick={exportCurrentPng} type="button">{exporting ? "Rendering…" : draft.template === "CAROUSEL" ? "Export current PNG" : "Export PNG"}</button>
            {draft.template === "CAROUSEL" ? <button className={styles.primary} disabled={!canManage || hasErrors || exporting} onClick={exportCarouselZip} type="button">Export all · ZIP</button> : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
