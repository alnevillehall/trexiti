"use client";

import { useState } from "react";

import { investmentContextOptions } from "@/lib/content/project-qualification";
import { siteConfig } from "@/lib/content/site";

import styles from "./trexiti-site.module.css";

const projectTypes = [
  "Website or digital experience",
  "Custom software or application",
  "Internal business system",
  "Automation or integration",
  "Systems analysis and roadmap",
  "Not sure yet",
] as const;

export function ProjectInquiryForm() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const body = [
      "Trexiti project enquiry",
      "",
      `Name: ${data.get("name")}`,
      `Company: ${data.get("company")}`,
      `Email: ${data.get("email")}`,
      `Project type: ${data.get("projectType")}`,
      `Investment context: ${data.get("investmentContext")}`,
      `Timing: ${data.get("timing")}`,
      "",
      "Business challenge:",
      `${data.get("challenge")}`,
    ].join("\n");

    const mailto = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      `Project enquiry — ${data.get("company")}`,
    )}&body=${encodeURIComponent(body)}`;

    setStatus(
      "Your project brief is ready in your email app. Send the draft to complete your enquiry.",
    );
    window.location.assign(mailto);
  }

  return (
    <form className={styles.inquiryForm} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label>
          <span>Your name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>Company</span>
          <input name="company" autoComplete="organization" required />
        </label>
        <label>
          <span>Work email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>What are you looking to build?</span>
          <select name="projectType" defaultValue="" required>
            <option value="" disabled>
              Select a project type
            </option>
            {projectTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Investment context</span>
          <select name="investmentContext" defaultValue="" required>
            <option value="" disabled>
              Select the closest context
            </option>
            {investmentContextOptions.map((context) => (
              <option key={context}>{context}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Ideal timing</span>
          <input
            name="timing"
            placeholder="For example: Q4 or within 3 months"
            required
          />
        </label>
        <label className={styles.formWide}>
          <span>What is happening in the business?</span>
          <textarea
            name="challenge"
            rows={7}
            placeholder="Tell us what is slowing the operation down, what you want to change, and what a successful outcome would look like."
            required
          />
        </label>
      </div>

      <div className={styles.formSubmitRow}>
        <button type="submit">
          Prepare project enquiry
          <span aria-hidden="true">↗</span>
        </button>
        <p>
          This opens a pre-filled draft in your email app. Nothing is sent
          automatically.
        </p>
      </div>
      <p className={styles.formStatus} role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
