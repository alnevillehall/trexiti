import type { CSSProperties } from "react";

import styles from "./system-visuals.module.css";

export type SystemVisualTone = "paper" | "inverse" | "accent";

export type SystemNodeData = {
  detail?: string;
  emphasis?: boolean;
  label: string;
  meta?: string;
};

export type ProcessStepData = {
  detail?: string;
  label: string;
  meta?: string;
};

type SharedVisualProps = {
  ariaLabel?: string;
  caption?: string;
  className?: string;
  label: string;
  meta?: string;
  tone?: SystemVisualTone;
};

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function toneClass(tone: SystemVisualTone) {
  if (tone === "inverse") return styles.toneInverse;
  if (tone === "accent") return styles.toneAccent;
  return styles.tonePaper;
}

function indexed(index: number) {
  return String(index + 1).padStart(2, "0");
}

function normalizeNode(node: string | SystemNodeData): SystemNodeData {
  return typeof node === "string" ? { label: node } : node;
}

export function SystemNode({
  index,
  node,
  showSignal = false,
}: {
  index: number;
  node: string | SystemNodeData;
  showSignal?: boolean;
}) {
  const item = normalizeNode(node);
  const signalStyle = {
    "--system-signal-index": index,
  } as CSSProperties;

  return (
    <li
      className={styles.systemNode}
      data-emphasis={item.emphasis || undefined}
    >
      <div className={styles.nodeTopline}>
        <span>{indexed(index)}</span>
        {item.meta ? <span>{item.meta}</span> : null}
      </div>
      <strong>{item.label}</strong>
      {item.detail ? <p>{item.detail}</p> : null}
      {showSignal ? (
        <span
          aria-hidden="true"
          className={styles.nodeSignal}
          style={signalStyle}
        />
      ) : null}
    </li>
  );
}

export function SystemFlow({
  ariaLabel,
  caption,
  className,
  direction = "forward",
  label,
  layout = "horizontal",
  meta,
  nodes,
  tone = "paper",
}: SharedVisualProps & {
  direction?: "forward" | "bidirectional";
  layout?: "horizontal" | "vertical";
  nodes: readonly (string | SystemNodeData)[];
}) {
  const flowStyle = {
    "--system-node-count": nodes.length,
  } as CSSProperties;

  return (
    <figure
      aria-label={ariaLabel}
      className={classes(
        styles.visual,
        styles.systemFlow,
        toneClass(tone),
        layout === "vertical" && styles.flowVertical,
        direction === "bidirectional" && styles.flowBidirectional,
        className,
      )}
    >
      <figcaption className={styles.topRail}>
        <span>{label}</span>
        {meta ? <span>{meta}</span> : null}
      </figcaption>
      <ol className={styles.flowTrack} style={flowStyle}>
        {nodes.map((node, index) => (
          <SystemNode
            index={index}
            key={`${normalizeNode(node).label}-${index}`}
            node={node}
            showSignal={index < nodes.length - 1}
          />
        ))}
      </ol>
      {caption ? <p className={styles.visualCaption}>{caption}</p> : null}
    </figure>
  );
}

export function BusinessFunctionMap({
  ariaLabel,
  caption,
  className,
  functions,
  label = "Connected business system",
  meta = "Customer to insight",
  tone = "paper",
}: Omit<SharedVisualProps, "label"> & {
  functions: readonly (string | SystemNodeData)[];
  label?: string;
}) {
  return (
    <SystemFlow
      ariaLabel={ariaLabel}
      caption={caption}
      className={className}
      label={label}
      layout="vertical"
      meta={meta}
      nodes={functions}
      tone={tone}
    />
  );
}

export function ProcessStep({
  index,
  step,
  showSignal = false,
}: {
  index: number;
  showSignal?: boolean;
  step: ProcessStepData;
}) {
  const signalStyle = {
    "--system-signal-index": index,
  } as CSSProperties;

  return (
    <li className={styles.processStep}>
      <div className={styles.processIndex}>
        <span>{indexed(index)}</span>
        <i aria-hidden="true" />
      </div>
      <div className={styles.processContent}>
        {step.meta ? <span>{step.meta}</span> : null}
        <strong>{step.label}</strong>
        {step.detail ? <p>{step.detail}</p> : null}
      </div>
      {showSignal ? (
        <span
          aria-hidden="true"
          className={styles.processSignal}
          style={signalStyle}
        />
      ) : null}
    </li>
  );
}

export function Workflow({
  ariaLabel,
  caption,
  className,
  label,
  layout = "horizontal",
  meta,
  steps,
  tone = "paper",
}: SharedVisualProps & {
  layout?: "horizontal" | "vertical" | "grid";
  steps: readonly ProcessStepData[];
}) {
  const workflowStyle = {
    "--system-step-count": steps.length,
  } as CSSProperties;

  return (
    <figure
      aria-label={ariaLabel}
      className={classes(
        styles.visual,
        styles.workflow,
        toneClass(tone),
        layout === "vertical" && styles.workflowVertical,
        layout === "grid" && styles.workflowGrid,
        className,
      )}
    >
      <figcaption className={styles.topRail}>
        <span>{label}</span>
        {meta ? <span>{meta}</span> : null}
      </figcaption>
      <ol className={styles.workflowTrack} style={workflowStyle}>
        {steps.map((step, index) => (
          <ProcessStep
            index={index}
            key={`${step.label}-${index}`}
            showSignal={index < steps.length - 1}
            step={step}
          />
        ))}
      </ol>
      {caption ? <p className={styles.visualCaption}>{caption}</p> : null}
    </figure>
  );
}

export function IntegrationMap({
  ariaLabel,
  caption,
  className,
  coreDetail,
  coreLabel,
  integrations,
  label,
  meta,
  tone = "paper",
}: SharedVisualProps & {
  coreDetail: string;
  coreLabel: string;
  integrations: readonly string[];
}) {
  return (
    <figure
      aria-label={ariaLabel}
      className={classes(
        styles.visual,
        styles.integrationMap,
        toneClass(tone),
        className,
      )}
    >
      <figcaption className={styles.topRail}>
        <span>{label}</span>
        {meta ? <span>{meta}</span> : null}
      </figcaption>
      <div className={styles.integrationBody}>
        <div className={styles.integrationCore}>
          <span>Central system / 01</span>
          <strong>{coreLabel}</strong>
          <p>{coreDetail}</p>
          <i aria-hidden="true" />
        </div>
        <ul className={styles.integrationNodes}>
          {integrations.map((integration, index) => (
            <li key={integration}>
              <span>{indexed(index)}</span>
              <i aria-hidden="true" />
              <strong>{integration}</strong>
            </li>
          ))}
        </ul>
      </div>
      {caption ? <p className={styles.visualCaption}>{caption}</p> : null}
    </figure>
  );
}

export type ArchitectureRail = {
  items: readonly string[];
  label: string;
};

export function ArchitectureDiagram({
  ariaLabel,
  caption,
  className,
  foundation,
  label,
  layers,
  leftRail,
  meta,
  rightRail,
  tone = "paper",
}: SharedVisualProps & {
  foundation: string;
  layers: readonly SystemNodeData[];
  leftRail?: ArchitectureRail;
  rightRail?: ArchitectureRail;
}) {
  const hasRails = Boolean(leftRail || rightRail);

  return (
    <figure
      aria-label={ariaLabel}
      className={classes(
        styles.visual,
        styles.architecture,
        toneClass(tone),
        className,
      )}
    >
      <figcaption className={styles.topRail}>
        <span>{label}</span>
        {meta ? <span>{meta}</span> : null}
      </figcaption>
      <div
        className={classes(
          styles.architectureBody,
          !hasRails && styles.architectureBodySolo,
        )}
      >
        {leftRail ? <ArchitectureEdge rail={leftRail} /> : null}
        <ol className={styles.architectureLayers}>
          {layers.map((layer, index) => (
            <li data-emphasis={layer.emphasis || undefined} key={layer.label}>
              <span>{indexed(index)}</span>
              <div>
                {layer.meta ? <small>{layer.meta}</small> : null}
                <strong>{layer.label}</strong>
                {layer.detail ? <p>{layer.detail}</p> : null}
              </div>
              {index < layers.length - 1 ? <i aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
        {rightRail ? <ArchitectureEdge rail={rightRail} /> : null}
      </div>
      <div className={styles.architectureFoundation}>
        <span>Operational foundation</span>
        <strong>{foundation}</strong>
      </div>
      {caption ? <p className={styles.visualCaption}>{caption}</p> : null}
    </figure>
  );
}

function ArchitectureEdge({ rail }: { rail: ArchitectureRail }) {
  return (
    <aside className={styles.architectureEdge} aria-label={rail.label}>
      <span>{rail.label}</span>
      <ul>
        {rail.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
