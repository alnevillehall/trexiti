"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, LockKeyhole } from "lucide-react";

import styles from "./page.module.css";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const returnFocusToForm = useRef(false);

  useEffect(() => {
    if (submitted) {
      successRef.current?.focus();
      return;
    }

    if (returnFocusToForm.current) {
      returnFocusToForm.current = false;
      nameRef.current?.focus();
    }
  }, [submitted]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className={styles.formSuccess}
        role="status"
        aria-live="polite"
        ref={successRef}
        tabIndex={-1}
      >
        <span className={styles.successIcon} aria-hidden="true">
          <Check size={22} strokeWidth={1.8} />
        </span>
        <p className={styles.successEyebrow}>Sample completed</p>
        <h3>Your demonstration is complete.</h3>
        <p>
          This is a demonstration form, so no information was sent. On a live
          website, the firm would follow up within one business day.
        </p>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => {
            returnFocusToForm.current = true;
            setSubmitted(false);
          }}
        >
          Return to the sample form
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <div>
          <p className={styles.formKicker}>Sample consultation request</p>
          <h3>Tell us how we can help.</h3>
        </div>
        <LockKeyhole size={22} strokeWidth={1.5} aria-hidden="true" />
      </div>

      <p className={styles.formDemoNote}>
        Demonstration only — this form does not send or store information.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="amanda-name">Full name</label>
          <input
            id="amanda-name"
            name="name"
            ref={nameRef}
            type="text"
            autoComplete="name"
            placeholder="Your name"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="amanda-email">Email address</label>
          <input
            id="amanda-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="amanda-phone">Phone number</label>
          <input
            id="amanda-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(876) 555-0148"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="amanda-matter">How can we assist?</label>
          <select id="amanda-matter" name="matter" defaultValue="" required>
            <option value="" disabled>
              Select a practice area
            </option>
            <option>Family &amp; matrimonial law</option>
            <option>Estate &amp; legacy planning</option>
            <option>Business &amp; contract counsel</option>
            <option>Civil dispute resolution</option>
            <option>Something else</option>
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor="amanda-message">A brief note about your matter</label>
          <textarea
            id="amanda-message"
            name="message"
            rows={5}
            placeholder="Please share a brief, non-confidential overview."
            required
          />
        </div>
      </div>

      <p className={styles.formPrivacy}>
        Please do not include confidential or time-sensitive information. Sending
        this form does not create an attorney-client relationship.
      </p>

      <button type="submit" className={styles.submitButton}>
        Request consultation
        <ArrowUpRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
