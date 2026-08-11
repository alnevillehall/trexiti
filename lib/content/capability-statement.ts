import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type CapabilityArea = {
  title: string;
  description: string;
};

export type CapabilityProcessStep = {
  title: string;
  description: string;
};

export type CapabilityStatement = {
  source: string;
  descriptor: string;
  introduction: readonly string[];
  capabilities: readonly CapabilityArea[];
  fitSignals: readonly string[];
  process: readonly CapabilityProcessStep[];
  engagementShapes: readonly CapabilityArea[];
  engagementPrinciple: string;
  cta: string;
  contact: readonly string[];
};

const source = readFileSync(
  join(process.cwd(), "materials", "capability_statement.md"),
  "utf8",
).replace(/\r\n/g, "\n");

function getSection(title: string) {
  const marker = `## ${title}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Missing capability statement section: ${title}`);

  const bodyStart = markerIndex + marker.length;
  const remaining = source.slice(bodyStart);
  const sectionEndCandidates = [remaining.indexOf("\n---"), remaining.indexOf("\n## ")]
    .filter((index) => index >= 0);
  const sectionEnd = sectionEndCandidates.length > 0
    ? Math.min(...sectionEndCandidates)
    : remaining.length;

  return remaining.slice(0, sectionEnd).trim();
}

function parseTitledBlocks(section: string) {
  const headings = Array.from(section.matchAll(/^### (.+)$/gm));

  return headings.map((heading, index) => {
    const blockStart = (heading.index ?? 0) + heading[0].length;
    const blockEnd = headings[index + 1]?.index ?? section.length;

    return {
      title: heading[1].trim(),
      description: section.slice(blockStart, blockEnd).trim(),
    };
  });
}

function parseCapabilityStatement(): CapabilityStatement {
  const opening = source.match(
    /^### (Digital systems for ambitious businesses\.)\s*\n+([\s\S]*?)(?=\n---)/m,
  );
  if (!opening) throw new Error("Missing approved capability statement opening.");

  const process = getSection("How we work")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.match(/^\*\*(.+?)\*\*\s+\u2014\s+(.+)$/u))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ title: match[1].trim(), description: match[2].trim() }));
  const engagementSection = getSection("Engagement shapes");
  const engagementPrinciple = "The right engagement is shaped by the problem—not the size or prestige of the company.";

  return {
    source,
    descriptor: opening[1],
    introduction: opening[2].trim().split(/\n\s*\n/),
    capabilities: parseTitledBlocks(getSection("What we build")),
    fitSignals: Array.from(getSection("When Trexiti makes sense").matchAll(/^- (.+)$/gm), (match) => match[1].trim()),
    process,
    engagementShapes: parseTitledBlocks(engagementSection.replace(engagementPrinciple, "").trim()),
    engagementPrinciple,
    cta: getSection("Start with one question").match(/^### (.+)$/m)?.[1].trim() ?? "",
    contact: getSection("Start with one question")
      .replace(/^### .+$/m, "")
      .trim()
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

export const capabilityStatement = parseCapabilityStatement();
