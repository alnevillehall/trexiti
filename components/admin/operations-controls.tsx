"use client";

import { useActionState, useState } from "react";
import { Sparkles, WandSparkles } from "lucide-react";

import {
  askTrexitiAction,
  runSafeOperationsAction,
  type OperationsActionState,
} from "@/app/(admin)/admin/coo-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import styles from "@/components/admin/admin.module.css";

const initialState: OperationsActionState = { status: "idle" };

export function OperationsControls() {
  const [runIdempotencyKey] = useState(() => `admin:run-operations:${crypto.randomUUID()}`);
  const [runState, runAction, runPending] = useActionState(runSafeOperationsAction, initialState);
  const [askState, askAction, askPending] = useActionState(askTrexitiAction, initialState);

  return (
    <div className={styles.operationsControls}>
      <section className={styles.controlCard} aria-labelledby="run-operations-title">
        <div className={styles.controlCardHeading}>
          <WandSparkles aria-hidden="true" />
          <div>
            <h2 id="run-operations-title">Run Operations</h2>
            <p>Plan and queue a homogeneous allow-listed batch through Trexiti’s durable guarded workflow.</p>
          </div>
        </div>
        <form action={runAction}>
          <input type="hidden" name="idempotencyKey" value={runState.nextIdempotencyKey ?? runIdempotencyKey} />
          <Textarea
            aria-label="Operational instruction"
            name="instruction"
            minLength={8}
            maxLength={1000}
            placeholder="Example: create follow-up tasks for every overdue qualified opportunity, due tomorrow at 09:00 Jamaica time."
            required
          />
          <div className={styles.controlActionRow}>
            <span>Up to 25 homogeneous safe actions · idempotent · no external communication</span>
            <Button disabled={runPending} type="submit">
              {runPending ? "Running…" : "Run safely"}
            </Button>
          </div>
        </form>
        {runState.message ? (
          <p className={styles.actionFeedback} data-status={runState.status} role={runState.status === "error" ? "alert" : "status"}>
            {runState.message}
          </p>
        ) : null}
      </section>

      <section className={styles.controlCard} aria-labelledby="ask-trexiti-title">
        <div className={styles.controlCardHeading}>
          <Sparkles aria-hidden="true" />
          <div>
            <h2 id="ask-trexiti-title">Ask Trexiti</h2>
            <p>Ask against the same records and policies used by the COO connection.</p>
          </div>
        </div>
        <form action={askAction}>
          <Textarea
            aria-label="Question for Trexiti"
            name="question"
            minLength={4}
            maxLength={1000}
            placeholder="What needs my attention today, and why?"
            required
          />
          <div className={styles.controlActionRow}>
            <span>Answers cite records and preserve the data timestamp.</span>
            <Button disabled={askPending} type="submit">
              {askPending ? "Thinking…" : "Ask"}
            </Button>
          </div>
        </form>
        {askState.message ? (
          <div className={styles.askAnswer} data-status={askState.status} role={askState.status === "error" ? "alert" : "status"}>
            <p>{askState.message}</p>
            {askState.links?.length ? (
              <ul>
                {askState.links.map((link) => <li key={`${link.href}-${link.label}`}><a href={link.href}>{link.label}</a></li>)}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
