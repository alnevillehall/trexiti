"use client";

import { useState } from "react";

import {
  createWhatsAppUrl,
  TREXITI_CONTACT_EMAIL,
} from "@/lib/marketing/contact";

import styles from "./marketing-site.module.css";

const serviceTypes = [
  "Plumbing",
  "Electrical services",
  "Air conditioning and refrigeration",
  "Cleaning services",
  "General contracting",
  "Repairs and field services",
  "Other service business",
] as const;

const serviceWhatsAppUrl = createWhatsAppUrl(
  "Hello Trexiti, I would like to request a 15-minute ServiceOS workflow review.",
);

export function ServiceLeadForm() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const body = [
      "Trexiti ServiceOS Workflow Review Request",
      "",
      `Name: ${data.get("name")}`,
      `Business name: ${data.get("businessName")}`,
      `WhatsApp number: ${data.get("whatsapp")}`,
      `Type of service business: ${data.get("serviceType")}`,
      `Biggest operational problem: ${data.get("problem")}`,
    ].join("\n");

    const mailto = `mailto:${TREXITI_CONTACT_EMAIL}?subject=${encodeURIComponent(
      "ServiceOS Workflow Review Request",
    )}&body=${encodeURIComponent(body)}`;

    setStatus(
      "Your request is ready in your email app. Please send the message to complete your request.",
    );
    window.location.assign(mailto);
  }

  return (
    <div className={styles.formShell}>
      <div className={styles.formIntro}>
        <p className={styles.eyebrow}>15-minute workflow review</p>
        <h2>Show us where the work gets stuck.</h2>
        <p>
          We will review your current enquiry-to-payment process and identify
          the clearest place for ServiceOS to help.
        </p>
        <ul className={styles.checkList}>
          <li>No long sales presentation</li>
          <li>A focused review of one real workflow</li>
          <li>Clear setup scope and next steps</li>
        </ul>
        {serviceWhatsAppUrl ? (
          <a
            className={styles.textLink}
            href={serviceWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            Prefer WhatsApp? Message Trexiti directly
          </a>
        ) : null}
      </div>

      <form className={styles.leadForm} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <label>
            <span>Name</span>
            <input
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              required
            />
          </label>
          <label>
            <span>Business name</span>
            <input
              name="businessName"
              type="text"
              autoComplete="organization"
              placeholder="Your business"
              required
            />
          </label>
          <label>
            <span>WhatsApp number</span>
            <input
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+1 876 000 0000"
              required
            />
          </label>
          <label>
            <span>Type of service business</span>
            <select name="serviceType" defaultValue="" required>
              <option value="" disabled>
                Select your service
              </option>
              {serviceTypes.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </label>
          <label className={styles.formWide}>
            <span>Biggest operational problem</span>
            <textarea
              name="problem"
              rows={5}
              placeholder="What gets missed, delayed or difficult to track?"
              required
            />
          </label>
        </div>
        <button
          className={`${styles.button} ${styles.primaryButton} ${styles.formButton}`}
          type="submit"
        >
          Request My 15-Minute Workflow Review
        </button>
        <p className={styles.formNote}>
          Submitting opens your email app with the details above. Your request
          is sent only when you send that email.
        </p>
        <p className={styles.formStatus} role="status" aria-live="polite">
          {status}
        </p>
      </form>
    </div>
  );
}
