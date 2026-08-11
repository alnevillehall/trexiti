import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  BrandDocumentView,
  TrackedAssetDownload,
} from "@/components/marketing/brand-document-actions";
import styles from "@/components/marketing/brand-documents.module.css";
import {
  companyDescriptions,
  mediaKitAssets,
  mediaKitCapabilities,
  mediaKitColors,
  mediaKitFounder,
  mediaKitTypography,
} from "@/lib/content/media-kit";
import { projects } from "@/lib/content/projects";
import { siteConfig } from "@/lib/content/site";
import { publicContactLinks } from "@/lib/marketing/contact";

const description =
  "Approved Trexiti company descriptions, brand guidance, contact information, logo-mark downloads and selected-work references.";

export const metadata: Metadata = {
  title: "Media & Brand Kit",
  description,
  alternates: { canonical: "/media-kit" },
  openGraph: {
    title: "Trexiti Media & Brand Kit",
    description,
    type: "website",
    siteName: "Trexiti",
    url: "/media-kit",
    images: ["/brand/trexiti_icon_transparent_1024.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trexiti Media & Brand Kit",
    description,
    images: ["/brand/trexiti_icon_transparent_1024.png"],
  },
};

const socialLinks = publicContactLinks.filter((link) => link.sameAs);

export default function MediaKitPage() {
  return (
    <div className={styles.documentPage}>
      <BrandDocumentView event="media_kit_view" route="/media-kit" />
      <div className={styles.documentInner}>
        <div className={styles.screenToolbar} aria-label="Media kit navigation">
          <div className={styles.toolbarMeta}>
            <strong>Trexiti Media & Brand Kit</strong>
            <span>Approved public references</span>
          </div>
          <div className={styles.toolbarActions}>
            <Link className={styles.secondaryAction} href="/capabilities/overview">Capability statement</Link>
            <Link className={styles.primaryAction} href="/start-a-project">Contact Trexiti</Link>
          </div>
        </div>

        <article className={styles.mediaSheet} aria-labelledby="media-kit-title">
          <header className={styles.mediaHero}>
            <div>
              <span className={styles.documentLabel}>Trexiti / Media & Brand Kit / 2026</span>
              <h1 id="media-kit-title">Clear references for writing about Trexiti.</h1>
              <div className={styles.heroCopy}>
                <p>{siteConfig.tagline}</p>
                <p>Use the approved descriptions and assets below without changing the company position or implying unsupported results.</p>
              </div>
            </div>
            <div className={styles.wordmarkDisplay} aria-label="Current Trexiti wordmark treatment">
              <div>
                <Image src="/brand/trexiti_logo_icon.svg" alt="" width={80} height={80} priority />
                <strong>Trexiti</strong>
              </div>
              <p>{siteConfig.tagline}</p>
            </div>
          </header>

          <section className={styles.documentSection} aria-labelledby="descriptions-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>01 / Descriptions</span>
              <h2 id="descriptions-title">Company descriptions</h2>
            </div>
            <div className={styles.descriptionGrid}>
              {companyDescriptions.map((descriptionItem) => (
                <article className={styles.descriptionCard} key={descriptionItem.label}>
                  <span>{descriptionItem.label}</span>
                  <p>{descriptionItem.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.documentSection} aria-labelledby="identity-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>02 / Identity</span>
              <h2 id="identity-title">Core references</h2>
            </div>
            <div className={styles.identityGrid}>
              <article className={styles.identityCard}>
                <span className={styles.identityLabel}>Founder</span>
                <h3>{mediaKitFounder.name}</h3>
                <p>{mediaKitFounder.title}</p>
              </article>
              <article className={styles.identityCard}>
                <span className={styles.identityLabel}>Descriptor</span>
                <h3>{siteConfig.tagline}</h3>
                <p>Keep this descriptor separate from the logo mark so it remains readable and current.</p>
              </article>
              <article className={styles.identityCard}>
                <span className={styles.identityLabel}>Capabilities</span>
                <ul className={styles.usageList}>{mediaKitCapabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
              </article>
              <article className={styles.identityCard}>
                <span className={styles.identityLabel}>Base</span>
                <h3>Jamaica</h3>
                <p>Jamaica-based. Working with ambitious businesses globally.</p>
              </article>
            </div>
          </section>

          <section className={styles.documentSection} aria-labelledby="assets-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>03 / Assets</span>
              <h2 id="assets-title">Approved logo-mark downloads</h2>
            </div>
            <div className={styles.assetGrid}>
              {mediaKitAssets.map((asset) => (
                <article className={styles.assetCard} key={asset.format}>
                  <div className={styles.assetPreview} data-background={asset.background}>
                    <Image src={asset.preview} alt={`${asset.name} preview`} width={240} height={240} />
                  </div>
                  <div className={styles.assetDetails}>
                    <div><strong>{asset.name}</strong><span className={styles.assetMeta}>{asset.format}</span></div>
                    <TrackedAssetDownload asset={`${asset.name} / ${asset.format}`} className={styles.downloadAction} download={asset.downloadName} href={asset.href}>Download {asset.format}</TrackedAssetDownload>
                  </div>
                </article>
              ))}
            </div>
            <p className={styles.pendingNote}>Only the standalone mark is included here. Legacy lockups and banners containing retired positioning are intentionally excluded.</p>
          </section>

          <section className={styles.documentSection} aria-labelledby="usage-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>04 / Usage</span>
              <h2 id="usage-title">Logo and copy usage</h2>
            </div>
            <div className={styles.usageLayout}>
              <ul className={styles.usageList}>
                <li>Preserve the logo mark’s proportions and surrounding clear space.</li>
                <li>Use a background with sufficient contrast; do not add effects or recolor the mark.</li>
                <li>Use “Digital systems for ambitious businesses.” as separate live text, not as an altered logo lockup.</li>
                <li>Do not use retired banners or lockups carrying previous AI-first or “Engineering Intelligent Systems” positioning.</li>
              </ul>
              <div>
                <span className={styles.identityLabel}>Editorial principle</span>
                <p className={styles.engagementPrinciple}>Describe the operating problem and business outcome before listing technology.</p>
              </div>
            </div>
          </section>

          <section className={styles.documentSection} aria-labelledby="system-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>05 / Brand system</span>
              <h2 id="system-title">Colors and typography</h2>
            </div>
            <div className={styles.brandSystemGrid}>
              <div className={styles.colorGrid}>
                {mediaKitColors.map((color) => (
                  <div className={styles.colorToken} key={color.value}>
                    <span className={styles.swatch} style={{ backgroundColor: color.value }} aria-label={`${color.name}: ${color.value}`} />
                    <div><strong>{color.name}</strong><span>{color.value}</span></div>
                  </div>
                ))}
              </div>
              <div>
                <ul className={styles.typeList}>
                  {mediaKitTypography.map((typeface) => <li key={typeface.name}><strong>{typeface.name}</strong><span>{typeface.role}</span></li>)}
                </ul>
                <p className={styles.pendingNote}>These families are loaded through the site’s licensed web-font pipeline. Font files are not distributed in this kit.</p>
              </div>
            </div>
          </section>

          <section className={styles.documentSection} aria-labelledby="contact-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>06 / Contact</span>
              <h2 id="contact-title">Contact and official links</h2>
            </div>
            <div className={styles.contactLayout}>
              <ul className={styles.contactList}>
                <li><strong>Email</strong><br /><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></li>
                <li><strong>Website</strong><br /><a href={siteConfig.url}>www.trexiti.com</a></li>
              </ul>
              <div>
                <ul className={styles.socialList}>
                  {socialLinks.map((link) => <li key={link.kind}><a href={link.href} rel="noreferrer" target="_blank">{link.label}<span className="sr-only"> (opens in a new tab)</span></a></li>)}
                </ul>
                {socialLinks.length < 3 ? <p className={styles.pendingNote}>LinkedIn company and founder profiles remain hidden until their official URLs are configured.</p> : null}
              </div>
            </div>
          </section>

          <section className={styles.documentSection} aria-labelledby="work-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>07 / Selected work</span>
              <h2 id="work-title">Selected system studies</h2>
            </div>
            <div className={styles.workGrid}>
              {projects.map((project) => (
                <article className={styles.workCard} key={project.slug}>
                  <div><span className={styles.workMeta}>{project.concept ? "Concept study" : project.year} / {project.category}</span><h3>{project.title}</h3><p>{project.summary}</p></div>
                  <Link href={`/work/${project.slug}`}>View {project.title}</Link>
                </article>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
