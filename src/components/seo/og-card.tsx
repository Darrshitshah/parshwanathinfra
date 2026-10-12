/* eslint-disable @next/next/no-img-element -- next/og renders plain <img>; next/image does not exist inside ImageResponse. */
/**
 * Open Graph card, look A "Drafting table". Owner: pages-lead. Paper ground, the display serif wordmark, a mono
 * annotation line, and one visual: the masterplan render (labelled "Artist's impression") or the township boundary
 * drawn as a single ink line with the roundabout in brick. Used by `app/opengraph-image.tsx` (render) and
 * `app/projects/[slug]/opengraph-image.tsx` (plan outline); both are generated once at build time.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { seoCopy } from "@/content/copy/seo";
import { getMedia } from "@/content/media";
import { plan } from "@/content/plan";
import type { Project } from "@/content/schema";

export const OG_SIZE = { width: 1200, height: 630 } as const;
/** JPEG, not PNG: the card carries a photographic render, and a PNG of it was 639 KB (WhatsApp drops previews near 300 KB). */
export const OG_CONTENT_TYPE = "image/jpeg";
const OG_JPEG_QUALITY = 82;

// Look A tokens (src/styles/tokens.css, light theme). Satori has no CSS variables, so the values are repeated here.
const PAPER = "#f3efe7";
const PAPER_SUNK = "#e9e3d7";
const INK = "#1a1c1b";
const INK_MUTED = "#55595a";
const LINE = "rgba(26, 28, 27, 0.28)";
const BRICK = "#b5412f";

const PADDING = 56;
const TEXT_WIDTH = 560;
const GAP = 48;
const VISUAL_WIDTH = OG_SIZE.width - PADDING * 2 - TEXT_WIDTH - GAP;
const VISUAL_HEIGHT = OG_SIZE.height - PADDING * 2;
const TAG_HEIGHT = 34;
const PLAN_MARGIN = 28;
const PLAN_LABEL_SPACE = 64;

type OgFonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];

let fontsPromise: Promise<OgFonts> | undefined;

/** Instrument Serif (display) and JetBrains Mono (annotation), latin subsets converted to TTF for Satori. */
function loadFonts(): Promise<OgFonts> {
  fontsPromise ??= (async () => {
    const dir = join(process.cwd(), "src/components/seo/fonts");
    const [serif, mono] = await Promise.all([
      readFile(join(dir, "InstrumentSerif-Regular.ttf")),
      readFile(join(dir, "JetBrainsMono-Regular.ttf")),
    ]);
    return [
      { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
      { name: "JetBrains Mono", data: mono, style: "normal", weight: 400 },
    ];
  })();
  return fontsPromise;
}

/** Satori cannot decode WebP: crop the render to the frame and hand it over as a JPEG data URI. */
async function renderDataUri(mediaId: string): Promise<string> {
  const media = getMedia(mediaId);
  const file = await readFile(join(process.cwd(), "public", media.src));
  const jpeg = await sharp(file)
    .resize(VISUAL_WIDTH, VISUAL_HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

function RoundaboutMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={BRICK} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.75" fill={BRICK} />
    </svg>
  );
}

/**
 * The township boundary as one ink line, the entry roundabout in brick. Same geometry source as the 404 page.
 * Satori does not apply preserveAspectRatio and lays an <svg> out unreliably, so the SVG fills the whole frame and
 * the viewBox is computed with the frame's own aspect ratio, leaving the bottom strip free for the label.
 */
function PlanOutline() {
  const frameW = VISUAL_WIDTH - 2;
  const frameH = VISUAL_HEIGHT - 2;
  const xs = plan.boundary.map(([x]) => x);
  const ys = plan.boundary.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX;
  const height = Math.max(...ys) - minY;

  const areaH = frameH - PLAN_MARGIN - PLAN_LABEL_SPACE;
  const fit = Math.min((frameW - PLAN_MARGIN * 2) / width, areaH / height);
  const offsetX = (frameW - width * fit) / 2;
  const offsetY = PLAN_MARGIN + (areaH - height * fit) / 2;
  const viewBox = `${minX - offsetX / fit} ${minY - offsetY / fit} ${frameW / fit} ${frameH / fit}`;

  const path = `${plan.boundary.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ")} Z`;
  const stroke = 3 / fit;
  const [cx, cy] = plan.roundabout.center;
  const radius = plan.roundabout.radius;

  return (
    <svg width={frameW} height={frameH} viewBox={viewBox} style={{ position: "absolute", top: 0, left: 0 }}>
      <path d={path} fill={INK} fillOpacity={0.05} stroke="none" />
      <path d={path} fill="none" stroke={INK} strokeWidth={stroke} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={BRICK} strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={radius * 0.28} fill={BRICK} />
    </svg>
  );
}

/** Positioned with `top` and a fixed height: Satori resolves `bottom` unreliably next to an absolutely positioned SVG. */
function Tag({ children }: { children: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 14,
        top: VISUAL_HEIGHT - 2 - 14 - TAG_HEIGHT,
        height: TAG_HEIGHT,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        background: PAPER,
        color: INK,
        border: `1px solid ${LINE}`,
        fontFamily: "JetBrains Mono",
        fontSize: 17,
        letterSpacing: 0.4,
      }}
    >
      {children}
    </div>
  );
}

export type OgVisual = { kind: "render"; mediaId: string } | { kind: "plan" };

interface OgCardProps {
  project: Project;
  visual: OgVisual;
  renderSrc?: string;
}

function OgCard({ project, visual, renderSrc }: OgCardProps) {
  const { counts, location } = project;
  const og = seoCopy.og;
  const [first, ...rest] = project.name.split(" ");
  const lines = rest.length > 1 ? [`${first} ${rest[0]}`, rest.slice(1).join(" ")] : [first, rest.join(" ")];
  const countsLine = [
    `${counts.flats.toLocaleString("en-IN")} ${og.flats}`,
    `${counts.rowHouses.toLocaleString("en-IN")} ${og.rowHouses}`,
    `${counts.shops.toLocaleString("en-IN")} ${og.shops}`,
  ].join(" · ");

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, color: INK, padding: PADDING }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: TEXT_WIDTH }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <RoundaboutMark size={34} />
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 21, letterSpacing: 2.4, textTransform: "uppercase" }}>
            {og.eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Instrument Serif", fontSize: 128, lineHeight: 0.98, letterSpacing: -2 }}>
          {lines.map((line) => (
            <div key={line} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${LINE}`, paddingTop: 20, fontFamily: "JetBrains Mono", fontSize: 21 }}>
          <div style={{ display: "flex" }}>{countsLine}</div>
          <div style={{ display: "flex", color: INK_MUTED }}>{location.road}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          position: "relative",
          width: VISUAL_WIDTH,
          height: VISUAL_HEIGHT,
          marginLeft: GAP,
          border: `1px solid ${LINE}`,
          background: PAPER_SUNK,
          flexDirection: "column",
        }}
      >
        {visual.kind === "render" && renderSrc ? (
          <>
            <img src={renderSrc} width={VISUAL_WIDTH - 2} height={VISUAL_HEIGHT - 2} style={{ objectFit: "cover" }} alt="" />
            <Tag>{og.artistImpression}</Tag>
          </>
        ) : (
          <>
            <PlanOutline />
            <Tag>{og.planNote}</Tag>
          </>
        )}
      </div>
    </div>
  );
}

/** Builds the JPEG response. Static: it reads only local files and content, so Next renders it once at build time. */
export async function renderOgImage(project: Project, visual: OgVisual): Promise<Response> {
  const [fonts, renderSrc] = await Promise.all([
    loadFonts(),
    visual.kind === "render" ? renderDataUri(visual.mediaId) : Promise.resolve(undefined),
  ]);
  const card = new ImageResponse(<OgCard project={project} visual={visual} renderSrc={renderSrc} />, { ...OG_SIZE, fonts });
  const jpeg = await sharp(Buffer.from(await card.arrayBuffer()))
    .flatten({ background: PAPER })
    .jpeg({ quality: OG_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": OG_CONTENT_TYPE, "Cache-Control": "public, immutable, no-transform, max-age=31536000" },
  });
}
