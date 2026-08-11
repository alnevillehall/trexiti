import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getInsightSocialVisual } from "@/lib/content/insight-social-visuals";
import { getPublishedInsightBySlug } from "@/lib/content/insights";

export const alt = "Trexiti Insight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const nodeStyle = {
  display: "flex",
  minHeight: 48,
  padding: "10px 14px",
  border: "2px solid #151613",
  alignItems: "center",
  justifyContent: "center",
  background: "#faf9f5",
  fontSize: 14,
  letterSpacing: "0.08em",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
};

function SocialDiagram({ slug }: { slug: string }) {
  const visual = getInsightSocialVisual(slug);

  if (!visual) return null;

  if (visual.variant === "human-layer") {
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div
          style={{ display: "flex", width: 240, flexDirection: "column", gap: 8 }}
        >
          {visual.sources.map((source) => (
            <div key={source} style={nodeStyle}>
              {source}
            </div>
          ))}
        </div>
        <span style={{ display: "flex", color: "#62645d", fontSize: 32 }}>→</span>
        <div
          style={{
            display: "flex",
            width: 300,
            minHeight: 160,
            padding: 22,
            border: "2px solid #151613",
            alignItems: "center",
            justifyContent: "center",
            background: "#626a50",
            color: "#faf9f5",
            flexDirection: "column",
            gap: 9,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          <strong style={{ fontSize: 30, letterSpacing: "0.06em" }}>
            {visual.layer[0]}
          </strong>
          <span style={{ fontSize: 14, letterSpacing: "0.1em" }}>
            {visual.layer[1]}
          </span>
        </div>
        <span style={{ display: "flex", color: "#62645d", fontSize: 32 }}>→</span>
        <div
          style={{ display: "flex", width: 240, flexDirection: "column", gap: 8 }}
        >
          {visual.outcomes.map((outcome) => (
            <div key={outcome} style={nodeStyle}>
              {outcome}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.variant === "decision") {
    return (
      <div style={{ display: "flex", width: "100%", gap: 12 }}>
        {visual.choices.map((choice, index) => (
          <div
            key={choice.label}
            style={{
              display: "flex",
              minHeight: 148,
              padding: "22px 24px",
              border: "2px solid #151613",
              background: index === 1 ? "#626a50" : "#faf9f5",
              color: index === 1 ? "#faf9f5" : "#151613",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 15, letterSpacing: "0.12em" }}>
              0{index + 1}
            </span>
            <strong style={{ fontSize: 36, textTransform: "uppercase" }}>
              {choice.label}
            </strong>
            <span style={{ fontSize: 16, letterSpacing: "0.06em" }}>
              {choice.detail}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      {visual.stages.map((stage, index) => (
        <div
          key={stage}
          style={{ display: "flex", flex: 1, alignItems: "center" }}
        >
          <div
            style={{
              ...nodeStyle,
              width: "100%",
              minHeight: 114,
              background: index === 1 ? "#626a50" : "#faf9f5",
              color: index === 1 ? "#faf9f5" : "#151613",
              fontSize: 17,
              fontWeight: 600,
            }}
          >
            {stage}
          </div>
          {index < visual.stages.length - 1 ? (
            <span
              style={{
                display: "flex",
                width: 34,
                justifyContent: "center",
                color: "#62645d",
                fontSize: 23,
              }}
            >
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default async function InsightOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getPublishedInsightBySlug(slug);

  if (!article) notFound();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "44px 50px",
        color: "#151613",
        background: "#f1f0eb",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 18,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span>Trexiti / Insights</span>
        <span style={{ color: "#626a50" }}>{article.category}</span>
      </div>

      <div
        style={{
          display: "flex",
          maxWidth: 1060,
          fontSize: 55,
          fontWeight: 650,
          letterSpacing: "-0.045em",
          lineHeight: 0.95,
          textTransform: "uppercase",
        }}
      >
        {article.title}
      </div>

      <SocialDiagram slug={article.slug} />

      <div
        style={{
          display: "flex",
          paddingTop: 14,
          borderTop: "2px solid #151613",
          justifyContent: "space-between",
          color: "#62645d",
          fontSize: 15,
        }}
      >
        <span>Digital systems for ambitious businesses.</span>
        <span>{article.readingTime} min read</span>
      </div>
    </div>,
    size,
  );
}
