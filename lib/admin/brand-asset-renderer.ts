import {
  brandAssetTokens,
  getBrandAssetFormat,
  normalizeSlides,
  type BrandAssetDraft,
} from "@/lib/admin/brand-assets";

type BrandFonts = {
  display: string;
  body: string;
  mono: string;
};

const fallbackFonts: BrandFonts = {
  display: '"Arial", sans-serif',
  body: '"Arial", sans-serif',
  mono: '"Courier New", monospace',
};

export function resolveBrandFonts(): BrandFonts {
  if (typeof document === "undefined") return fallbackFonts;
  const styles = getComputedStyle(document.documentElement);
  return {
    display: styles.getPropertyValue("--font-space").trim() || fallbackFonts.display,
    body: styles.getPropertyValue("--font-geist-sans").trim() || fallbackFonts.body,
    mono: styles.getPropertyValue("--font-geist-mono").trim() || fallbackFonts.mono,
  };
}

export async function waitForBrandFonts() {
  if (typeof document === "undefined" || !document.fonts) return false;
  const fonts = resolveBrandFonts();
  await Promise.all([
    document.fonts.load(`600 16px ${fonts.display}`),
    document.fonts.load(`400 16px ${fonts.body}`),
    document.fonts.load(`600 16px ${fonts.mono}`),
  ]);
  await document.fonts.ready;
  return [fonts.display, fonts.body, fonts.mono].every((stack) => {
    const primaryFamily = stack.split(",")[0]?.trim();
    return Boolean(primaryFamily && document.fonts.check(`16px ${primaryFamily}`));
  });
}

function setFont(context: CanvasRenderingContext2D, family: string, size: number, weight = 500) {
  context.font = `${weight} ${Math.round(size)}px ${family}`;
}

function splitLongWord(context: CanvasRenderingContext2D, word: string, maxWidth: number) {
  const parts: string[] = [];
  let part = "";
  for (const character of word) {
    if (part && context.measureText(part + character).width > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part += character;
    }
  }
  if (part) parts.push(part);
  return parts;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const words = paragraph.trim().split(/\s+/).flatMap((word) => (
      context.measureText(word).width > maxWidth ? splitLongWord(context, word, maxWidth) : [word]
    ));
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 20,
) {
  const lines = wrapText(context, text, maxWidth);
  const visible = lines.slice(0, maxLines);
  visible.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return { bottom: y + visible.length * lineHeight, overflow: lines.length > maxLines };
}

function findTitleSize(
  context: CanvasRenderingContext2D,
  title: string,
  fonts: BrandFonts,
  maxWidth: number,
  maxLines: number,
  preferred: number,
  minimum: number,
) {
  let size = preferred;
  while (size > minimum) {
    setFont(context, fonts.display, size, 600);
    if (wrapText(context, title, maxWidth).length <= maxLines) break;
    size -= 2;
  }
  return size;
}

function drawWordmark(context: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, fonts: BrandFonts) {
  context.fillStyle = color;
  setFont(context, fonts.display, 21 * scale, 650);
  context.letterSpacing = `${4 * scale}px`;
  context.fillText("TREXITI", x, y);
  context.letterSpacing = "0px";
}

function drawEyebrow(context: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number, color: string, fonts: BrandFonts) {
  if (!text) return;
  context.fillStyle = color;
  setFont(context, fonts.mono, 13 * scale, 650);
  context.letterSpacing = `${1.8 * scale}px`;
  context.fillText(text.toUpperCase(), x, y);
  context.letterSpacing = "0px";
}

function drawFooter(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  x: number,
  baseline: number,
  width: number,
  scale: number,
  color: string,
  fonts: BrandFonts,
) {
  context.strokeStyle = color;
  context.globalAlpha = 0.35;
  context.beginPath();
  context.moveTo(x, baseline - 31 * scale);
  context.lineTo(x + width, baseline - 31 * scale);
  context.stroke();
  context.globalAlpha = 1;
  context.fillStyle = color;
  setFont(context, fonts.body, 15 * scale, 550);
  context.textAlign = "right";
  context.fillText(draft.cta || "Digital systems for ambitious businesses.", x + width, baseline);
  context.textAlign = "left";
}

function drawStandardStatement(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, height } = layout;
  drawEyebrow(context, draft.eyebrow, x, y + 58 * scale, scale, colors.accent, fonts);
  const titleSize = findTitleSize(context, draft.title, fonts, innerWidth * 0.88, 4, 86 * scale, 38 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 580);
  const title = drawWrappedText(context, draft.title, x, y + 128 * scale, innerWidth * 0.88, titleSize * 0.98, 4);
  if (draft.body) {
    context.fillStyle = colors.secondary;
    setFont(context, fonts.body, 24 * scale, 430);
    drawWrappedText(context, draft.body, x, title.bottom + 36 * scale, innerWidth * 0.7, 34 * scale, 5);
  }
  context.fillStyle = colors.accent;
  context.fillRect(x, height - y - 89 * scale, 92 * scale, 7 * scale);
}

function drawInsight(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, width, height } = layout;
  context.fillStyle = colors.accentSoft;
  context.fillRect(width * 0.69, 0, width * 0.31, height);
  context.fillStyle = colors.accent;
  context.fillRect(x, y + 58 * scale, 8 * scale, height - (y * 2 + 122 * scale));
  drawEyebrow(context, draft.eyebrow || "TREXITI / INSIGHT", x + 38 * scale, y + 63 * scale, scale, colors.accent, fonts);
  const titleWidth = innerWidth * 0.66;
  const titleSize = findTitleSize(context, draft.title, fonts, titleWidth, 4, 70 * scale, 34 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 600);
  const title = drawWrappedText(context, draft.title, x + 38 * scale, y + 137 * scale, titleWidth, titleSize, 4);
  context.fillStyle = colors.secondary;
  setFont(context, fonts.mono, 15 * scale, 550);
  drawWrappedText(context, draft.body, x + 38 * scale, title.bottom + 38 * scale, titleWidth, 24 * scale, 3);
  context.save();
  context.translate(width - x - 18 * scale, height - y - 26 * scale);
  context.rotate(-Math.PI / 2);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, 24 * scale, 650);
  context.letterSpacing = `${4 * scale}px`;
  context.fillText("TREXITI INSIGHTS", 0, 0);
  context.restore();
  context.letterSpacing = "0px";
}

function drawSystemFlow(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, width, height } = layout;
  drawEyebrow(context, draft.eyebrow || "TREXITI / SYSTEM FLOW", x, y + 42 * scale, scale, colors.accent, fonts);
  const titleSize = findTitleSize(context, draft.title, fonts, innerWidth, 3, 52 * scale, 28 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 580);
  const title = drawWrappedText(context, draft.title, x, y + 95 * scale, innerWidth, titleSize, 3);
  const nodes = draft.systemNodes.slice(0, 8);
  const landscape = width / height > 1.35;
  if (landscape) {
    const gap = 18 * scale;
    const nodeWidth = (innerWidth - gap * (nodes.length - 1)) / nodes.length;
    const nodeY = Math.max(title.bottom + 52 * scale, height * 0.54);
    nodes.forEach((node, index) => {
      const nodeX = x + index * (nodeWidth + gap);
      context.strokeStyle = colors.text;
      context.lineWidth = 1.6 * scale;
      context.strokeRect(nodeX, nodeY, nodeWidth, 77 * scale);
      context.fillStyle = colors.text;
      setFont(context, fonts.mono, Math.min(14 * scale, nodeWidth / 10), 650);
      context.textAlign = "center";
      context.fillText(node, nodeX + nodeWidth / 2, nodeY + 46 * scale);
      if (index < nodes.length - 1) {
        context.beginPath();
        context.moveTo(nodeX + nodeWidth, nodeY + 38 * scale);
        context.lineTo(nodeX + nodeWidth + gap, nodeY + 38 * scale);
        context.stroke();
      }
    });
    context.textAlign = "left";
  } else {
    const available = height - title.bottom - y - 110 * scale;
    const rowHeight = Math.min(105 * scale, available / Math.max(nodes.length, 1));
    const nodeWidth = innerWidth * 0.72;
    let nodeY = title.bottom + 32 * scale;
    nodes.forEach((node, index) => {
      const nodeX = x + (index % 2 === 0 ? 0 : innerWidth - nodeWidth);
      context.strokeStyle = colors.text;
      context.lineWidth = 1.5 * scale;
      context.strokeRect(nodeX, nodeY, nodeWidth, rowHeight * 0.68);
      context.fillStyle = colors.text;
      setFont(context, fonts.mono, 16 * scale, 650);
      context.fillText(node, nodeX + 22 * scale, nodeY + rowHeight * 0.42);
      if (index < nodes.length - 1) {
        context.beginPath();
        context.moveTo(index % 2 === 0 ? nodeX + nodeWidth : nodeX, nodeY + rowHeight * 0.68);
        context.lineTo(index % 2 === 0 ? x + innerWidth : x, nodeY + rowHeight);
        context.stroke();
      }
      nodeY += rowHeight;
    });
  }
}

function drawComparison(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, height } = layout;
  drawEyebrow(context, draft.eyebrow || "TREXITI / OPERATING MODEL", x, y + 46 * scale, scale, colors.accent, fonts);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, 48 * scale, 600);
  drawWrappedText(context, draft.title, x, y + 103 * scale, innerWidth, 51 * scale, 2);
  const gap = 22 * scale;
  const cardWidth = (innerWidth - gap) / 2;
  const cardY = y + 214 * scale;
  const cardHeight = height - cardY - y - 40 * scale;
  const columns = [
    { label: "FRAGMENTED", body: draft.body || "Information lives everywhere. People carry the context.", fill: colors.panel },
    { label: "CONNECTED", body: "One record. Clear ownership. Reliable handoffs.", fill: colors.accentSoft },
  ];
  columns.forEach((column, index) => {
    const cardX = x + index * (cardWidth + gap);
    context.fillStyle = column.fill;
    context.fillRect(cardX, cardY, cardWidth, cardHeight);
    drawEyebrow(context, column.label, cardX + 24 * scale, cardY + 42 * scale, scale, colors.text, fonts);
    context.fillStyle = colors.text;
    setFont(context, fonts.body, 22 * scale, 470);
    drawWrappedText(context, column.body, cardX + 24 * scale, cardY + 94 * scale, cardWidth - 48 * scale, 32 * scale, 8);
  });
}

function drawCarousel(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  slideIndex: number,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, width, height } = layout;
  const slides = normalizeSlides(draft.slides, draft.slideCount);
  const slide = slides[Math.min(slideIndex, slides.length - 1)] ?? { title: draft.title, body: draft.body };
  drawEyebrow(context, draft.eyebrow || "TREXITI / CAROUSEL", x, y + 52 * scale, scale, colors.accent, fonts);
  context.fillStyle = colors.text;
  setFont(context, fonts.mono, 16 * scale, 650);
  context.textAlign = "right";
  context.fillText(`${String(slideIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`, width - x, y + 52 * scale);
  context.textAlign = "left";
  const titleSize = findTitleSize(context, slide.title, fonts, innerWidth * 0.92, 5, 70 * scale, 34 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 600);
  const title = drawWrappedText(context, slide.title, x, y + 144 * scale, innerWidth * 0.92, titleSize * 1.02, 5);
  if (slide.body) {
    context.fillStyle = colors.secondary;
    setFont(context, fonts.body, 24 * scale, 430);
    drawWrappedText(context, slide.body, x, title.bottom + 45 * scale, innerWidth * 0.78, 35 * scale, 9);
  }
  context.fillStyle = colors.accent;
  const progressWidth = innerWidth * ((slideIndex + 1) / slides.length);
  context.fillRect(x, height - y - 62 * scale, progressWidth, 7 * scale);
}

function drawCaseStudy(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, width, height } = layout;
  context.fillStyle = colors.accent;
  context.fillRect(0, 0, width * 0.09, height);
  drawEyebrow(context, draft.eyebrow || "TREXITI / CASE STUDY", x, y + 48 * scale, scale, colors.accent, fonts);
  const titleSize = findTitleSize(context, draft.title, fonts, innerWidth * 0.84, 4, 74 * scale, 34 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 600);
  const title = drawWrappedText(context, draft.title, x, y + 126 * scale, innerWidth * 0.84, titleSize, 4);
  context.fillStyle = colors.secondary;
  setFont(context, fonts.body, 23 * scale, 440);
  drawWrappedText(context, draft.body, x, title.bottom + 42 * scale, innerWidth * 0.68, 34 * scale, 7);
  context.strokeStyle = colors.text;
  context.strokeRect(width - x - 155 * scale, height - y - 155 * scale, 155 * scale, 155 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.mono, 12 * scale, 650);
  context.fillText("RESULT / SYSTEM", width - x - 133 * scale, height - y - 78 * scale);
}

function drawFocusedBuild(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, height } = layout;
  drawEyebrow(context, draft.eyebrow || "TREXITI / FOCUSED BUILD", x, y + 46 * scale, scale, colors.accent, fonts);
  context.strokeStyle = colors.accent;
  context.lineWidth = 3 * scale;
  context.strokeRect(x, y + 104 * scale, innerWidth, height - y * 2 - 190 * scale);
  const inset = x + 48 * scale;
  const titleSize = findTitleSize(context, draft.title, fonts, innerWidth - 96 * scale, 4, 65 * scale, 32 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 600);
  const title = drawWrappedText(context, draft.title, inset, y + 170 * scale, innerWidth - 96 * scale, titleSize, 4);
  context.fillStyle = colors.secondary;
  setFont(context, fonts.body, 22 * scale, 440);
  drawWrappedText(context, draft.body, inset, title.bottom + 36 * scale, innerWidth - 96 * scale, 33 * scale, 6);
}

function drawSystemsReview(
  context: CanvasRenderingContext2D,
  draft: BrandAssetDraft,
  layout: Layout,
  colors: Colors,
  fonts: BrandFonts,
) {
  const { x, y, innerWidth, scale, height } = layout;
  drawEyebrow(context, draft.eyebrow || "TREXITI / SYSTEMS REVIEW", x, y + 50 * scale, scale, colors.accent, fonts);
  const titleSize = findTitleSize(context, draft.title, fonts, innerWidth * 0.88, 4, 72 * scale, 34 * scale);
  context.fillStyle = colors.text;
  setFont(context, fonts.display, titleSize, 600);
  const title = drawWrappedText(context, draft.title, x, y + 124 * scale, innerWidth * 0.88, titleSize, 4);
  context.fillStyle = colors.secondary;
  setFont(context, fonts.body, 21 * scale, 430);
  drawWrappedText(context, draft.body, x, title.bottom + 34 * scale, innerWidth * 0.72, 31 * scale, 5);
  const labels = draft.systemNodes.length >= 2 ? draft.systemNodes.slice(0, 4) : ["SIMPLIFY", "CONNECT", "AUTOMATE", "BUILD"];
  const gap = 10 * scale;
  const chipWidth = (innerWidth - gap * (labels.length - 1)) / labels.length;
  labels.forEach((label, index) => {
    const chipX = x + index * (chipWidth + gap);
    const chipY = height - y - 116 * scale;
    context.fillStyle = index === 0 ? colors.accent : colors.panel;
    context.fillRect(chipX, chipY, chipWidth, 56 * scale);
    context.fillStyle = index === 0 ? colors.background : colors.text;
    setFont(context, fonts.mono, Math.min(12 * scale, chipWidth / 10), 650);
    context.textAlign = "center";
    context.fillText(label, chipX + chipWidth / 2, chipY + 35 * scale);
  });
  context.textAlign = "left";
}

type Layout = ReturnType<typeof createLayout>;
type Colors = ReturnType<typeof createColors>;

function createLayout(width: number, height: number) {
  const wide = width / height > 2.4;
  const scale = wide ? height / 630 : Math.min(width / 1200, height / 1200);
  const x = wide ? height * 0.18 : Math.min(width, height) * 0.075;
  const y = wide ? height * 0.07 : Math.min(width, height) * 0.065;
  return { width, height, x, y, innerWidth: width - x * 2, scale };
}

function createColors(variant: BrandAssetDraft["variant"]) {
  const dark = variant === "DARK";
  return {
    background: dark ? brandAssetTokens.ink : brandAssetTokens.paper,
    text: dark ? brandAssetTokens.inverse : brandAssetTokens.ink,
    secondary: dark ? "rgba(247,245,239,0.72)" : brandAssetTokens.inkSecondary,
    accent: dark ? brandAssetTokens.oliveSoft : brandAssetTokens.olive,
    accentSoft: dark ? "#30332c" : brandAssetTokens.oliveSoft,
    panel: dark ? "#242620" : brandAssetTokens.paperSecondary,
  };
}

function drawSafeArea(context: CanvasRenderingContext2D, layout: Layout) {
  const insetX = Math.max(layout.x * 0.72, layout.width * 0.04);
  const insetY = Math.max(layout.y * 0.72, layout.height * 0.04);
  context.save();
  context.strokeStyle = "#bd4b3e";
  context.lineWidth = Math.max(2, layout.scale * 2);
  context.setLineDash([12 * layout.scale, 8 * layout.scale]);
  context.strokeRect(insetX, insetY, layout.width - insetX * 2, layout.height - insetY * 2);
  context.restore();
}

export function renderBrandAsset(
  canvas: HTMLCanvasElement,
  draft: BrandAssetDraft,
  options: { slideIndex?: number; showSafeArea?: boolean } = {},
) {
  const format = getBrandAssetFormat(draft.format);
  canvas.width = format.width;
  canvas.height = format.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  const layout = createLayout(format.width, format.height);
  const colors = createColors(draft.variant);
  const fonts = resolveBrandFonts();
  context.fillStyle = colors.background;
  context.fillRect(0, 0, format.width, format.height);
  context.textBaseline = "top";
  context.lineJoin = "miter";

  switch (draft.template) {
    case "SYSTEM_FLOW": drawSystemFlow(context, draft, layout, colors, fonts); break;
    case "FRAGMENTED_CONNECTED": drawComparison(context, draft, layout, colors, fonts); break;
    case "INSIGHT_ARTICLE": drawInsight(context, draft, layout, colors, fonts); break;
    case "CAROUSEL": drawCarousel(context, draft, options.slideIndex ?? 0, layout, colors, fonts); break;
    case "CASE_STUDY": drawCaseStudy(context, draft, layout, colors, fonts); break;
    case "FOCUSED_BUILD": drawFocusedBuild(context, draft, layout, colors, fonts); break;
    case "SYSTEMS_REVIEW": drawSystemsReview(context, draft, layout, colors, fonts); break;
    default: drawStandardStatement(context, draft, layout, colors, fonts);
  }

  drawWordmark(context, layout.x, format.height - layout.y - 28 * layout.scale, layout.scale, colors.text, fonts);
  if (draft.template !== "CAROUSEL" && draft.template !== "SYSTEMS_REVIEW") {
    drawFooter(context, draft, layout.x, format.height - layout.y - 25 * layout.scale, layout.innerWidth, layout.scale, colors.text, fonts);
  }
  if (options.showSafeArea) drawSafeArea(context, layout);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg" = "image/png", quality = 0.94) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode this asset.")), type, quality);
  });
}
