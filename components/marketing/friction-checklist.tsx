"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";

import {
  frictionChecklistSections,
  frictionQuestionCount,
  frictionQuestionId,
  frictionScoreOptions,
  getChecklistResult,
  type FrictionAnswerMap,
  type FrictionScore,
  type FrictionSectionId,
} from "@/lib/content/friction-checklist";
import { trackMarketingEvent } from "@/lib/marketing/analytics";

import styles from "./friction-checklist.module.css";

type RelevantArticle = { href: string; title: string };

export function FrictionChecklist({
  relevantArticles,
}: {
  relevantArticles: Partial<Record<FrictionSectionId, RelevantArticle>>;
}) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<FrictionAnswerMap>({});
  const [validationError, setValidationError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const startedRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const currentSection = frictionChecklistSections[sectionIndex];
  const answeredCount = Object.keys(answers).length;
  const result = useMemo(() => getChecklistResult(answers), [answers]);

  function answerQuestion(questionId: string, score: FrictionScore) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackMarketingEvent(
        "friction_checklist_started",
        "/resources/business-systems-friction-checklist",
      );
    }
    setAnswers((current) => ({ ...current, [questionId]: score }));
    setValidationError("");
  }

  function moveToSection(nextIndex: number) {
    setSectionIndex(nextIndex);
    requestAnimationFrame(() => sectionRef.current?.focus());
  }

  function continueChecklist() {
    const missing = currentSection.questions.some(
      (_, index) =>
        answers[frictionQuestionId(currentSection.id, index)] === undefined,
    );

    if (missing) {
      setValidationError("Score every statement in this section before continuing.");
      requestAnimationFrame(() => sectionRef.current?.focus());
      return;
    }

    if (sectionIndex < frictionChecklistSections.length - 1) {
      moveToSection(sectionIndex + 1);
      return;
    }

    const completedResult = getChecklistResult(answers);
    trackMarketingEvent(
      "friction_checklist_completed",
      "/resources/business-systems-friction-checklist",
      { score_tier: completedResult.tier.label },
    );
    trackMarketingEvent(
      "friction_checklist_tier",
      "/resources/business-systems-friction-checklist",
      { tier: completedResult.tier.label },
    );
    setCompleted(true);
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function restart() {
    setAnswers({});
    setSectionIndex(0);
    setCompleted(false);
    setEmailError("");
    startedRef.current = false;
    requestAnimationFrame(() => sectionRef.current?.focus());
  }

  function openEmailDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("resultsEmail") ?? "").trim();
    const consent = formData.get("emailConsent") === "on";

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter the address that should receive the draft.");
      return;
    }
    if (!consent) {
      setEmailError("Confirm that you want to open the email draft.");
      return;
    }

    setEmailError("");
    trackMarketingEvent(
      "friction_checklist_email_requested",
      "/resources/business-systems-friction-checklist",
      { tier: result.tier.label },
    );

    const body = [
      `Business Systems Friction Checklist: ${result.score}/40`,
      `Result: ${result.tier.label}`,
      "",
      result.tier.explanation,
      "",
      `Highest-friction section: ${result.highestSection.title} (${result.highestSection.score}/${result.highestSection.maximum})`,
      "",
      "Three next actions:",
      ...result.highestSection.nextActions.map(
        (action, index) => `${index + 1}. ${action}`,
      ),
      "",
      "Systems Review: https://trexiti.com/systems-review",
    ].join("\n");

    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("My Business Systems Friction Checklist result")}&body=${encodeURIComponent(body)}`;
  }

  if (completed) {
    const article = relevantArticles[result.highestSection.id];
    return (
      <div className={styles.result} ref={resultRef} tabIndex={-1}>
        <div className={styles.resultHeader}>
          <div>
            <span>Business Systems Friction / Result</span>
            <strong>{String(result.score).padStart(2, "0")}</strong>
            <small>out of 40</small>
          </div>
          <div>
            <p>{result.tier.label}</p>
            <h2>Your score is only a starting point.</h2>
          </div>
        </div>

        <div className={styles.resultExplanation}>
          <p>{result.tier.explanation}</p>
          <dl>
            <div>
              <dt>Highest-friction section</dt>
              <dd>{result.highestSection.title}</dd>
            </div>
            <div>
              <dt>Section score</dt>
              <dd>
                {result.highestSection.score} / {result.highestSection.maximum}
              </dd>
            </div>
          </dl>
        </div>

        <section className={styles.nextActions} aria-labelledby="next-actions-title">
          <span>Three next actions</span>
          <h2 id="next-actions-title">Where does the business lose context?</h2>
          <ol>
            {result.highestSection.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </section>

        <div className={styles.resultLinks}>
          <div>
            <span>Relevant Trexiti field note</span>
            {article ? (
              <Link href={article.href}>{article.title} ↗</Link>
            ) : (
              <p>The relevant field note will appear here once it is published.</p>
            )}
          </div>
          <div>
            <span>Review one workflow or a connected operation</span>
            <Link href="/systems-review?utm_source=friction_checklist&utm_medium=resource&utm_campaign=checklist_result">
              Discuss a Systems Review ↗
            </Link>
          </div>
        </div>

        <form className={styles.emailResults} onSubmit={openEmailDraft}>
          <div>
            <span>Optional / Email my results</span>
            <h2>Keep a copy without giving Trexiti your answers.</h2>
            <p>
              Your address and answers stay in this browser. The button opens a
              draft in your email application; nothing is submitted to Trexiti.
            </p>
          </div>
          <div className={styles.emailFields}>
            <label>
              <span>Email address</span>
              <input
                aria-describedby={emailError ? "results-email-error" : undefined}
                aria-invalid={Boolean(emailError)}
                autoComplete="email"
                name="resultsEmail"
                required
                type="email"
              />
            </label>
            <label className={styles.emailConsent}>
              <input name="emailConsent" required type="checkbox" />
              <span aria-hidden="true">✓</span>
              <strong>Open a local email draft containing this result.</strong>
            </label>
            {emailError ? (
              <p id="results-email-error" role="alert">
                {emailError}
              </p>
            ) : null}
            <button type="submit">Open email draft ↗</button>
          </div>
        </form>

        <button className={styles.restartButton} onClick={restart} type="button">
          Retake the checklist
        </button>
      </div>
    );
  }

  const questionOffset = frictionChecklistSections
    .slice(0, sectionIndex)
    .reduce((total, section) => total + section.questions.length, 0);

  return (
    <div className={styles.checklist}>
      <div className={styles.progressHeader}>
        <div>
          <span>Progress</span>
          <strong>
            {String(answeredCount).padStart(2, "0")} / {frictionQuestionCount}
          </strong>
        </div>
        <div
          aria-label={`${answeredCount} of ${frictionQuestionCount} statements scored`}
          aria-valuemax={frictionQuestionCount}
          aria-valuemin={0}
          aria-valuenow={answeredCount}
          className={styles.progressTrack}
          role="progressbar"
        >
          <span style={{ width: `${(answeredCount / frictionQuestionCount) * 100}%` }} />
        </div>
        <ol aria-label="Checklist sections">
          {frictionChecklistSections.map((section, index) => (
            <li data-active={index === sectionIndex || undefined} key={section.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{section.title}</strong>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.sectionPanel} ref={sectionRef} tabIndex={-1}>
        <div className={styles.sectionHeading}>
          <span>Section {String(sectionIndex + 1).padStart(2, "0")}</span>
          <h2>{currentSection.title}</h2>
          <p>
            Score each statement based on what happens consistently—not only
            when the strongest person is available to compensate.
          </p>
        </div>

        <div className={styles.questions}>
          {currentSection.questions.map((question, index) => {
            const id = frictionQuestionId(currentSection.id, index);
            return (
              <fieldset key={id}>
                <legend>
                  <span>{String(questionOffset + index + 1).padStart(2, "0")}</span>
                  <strong>{question}</strong>
                </legend>
                <div>
                  {frictionScoreOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        checked={answers[id] === option.value}
                        name={id}
                        onChange={() => answerQuestion(id, option.value)}
                        type="radio"
                        value={option.value}
                      />
                      <span>{option.value}</span>
                      <strong>{option.label}</strong>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>

        {validationError ? (
          <p className={styles.validationError} role="alert">
            {validationError}
          </p>
        ) : null}

        <div className={styles.controls}>
          {sectionIndex > 0 ? (
            <button onClick={() => moveToSection(sectionIndex - 1)} type="button">
              ← Previous section
            </button>
          ) : (
            <span />
          )}
          <button className={styles.continueButton} onClick={continueChecklist} type="button">
            {sectionIndex === frictionChecklistSections.length - 1
              ? "Show my result"
              : "Next section"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
