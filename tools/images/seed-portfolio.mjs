// One-off Director seed: portfolio web renders -> public/media + src/content/media.ts (data-lead upgrades later).
import sharp from "sharp";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , srcDir, projectDir] = process.argv;
const outDir = join(projectDir, "public", "media");
mkdirSync(outDir, { recursive: true });

const items = [
  ["masterplan-aerial", "Aerial view of Shiv Shiva Township with tower blocks, row houses and the entry roundabout", "Masterplan from the air", "SS-01 Masterplan Aerial"],
  ["masterplan-topdown", "Top-down view of the full Shiv Shiva Township layout", "The township from directly above", "SS-02 Masterplan Top-Down"],
  ["masterplan-full", "Wide aerial of Shiv Shiva Township in its green setting", "The township in its setting", "SS-33 Masterplan Aerial Full"],
  ["cover", "Shiv Shiva Township towers and landscaped grounds", "Shiv Shiva Township", "portfolio cover"],
  ["shop-street-night", "Shop street at dusk with lit shopfronts and residents walking", "Shop street at dusk", "SS-07 Shop Street at Dusk"],
  ["main-road", "Main road frontage of the township with shops facing the road", "Main road frontage", "SS-05/SS-06 Main Road"],
  ["roundabout", "Entry roundabout with a central sculpture and tree-lined road", "Entry roundabout", "SS-08 Roundabout Sculpture"],
  ["clubhouse-lawn", "Clubhouse lawn with gazebos and seating", "Clubhouse lawn and gazebos", "SS-22 Clubhouse Lawn and Gazebos"],
  ["towers-courtyard", "Residential towers around a parking court", "Towers and parking court", "SS-10 Towers Courtyard"],
  ["garden-island", "Central garden island with trees and walking paths", "Central garden island", "SS-14 Central Garden Island"],
  ["temple-court", "Temple courtyard with paved plaza and planting", "Temple courtyard", "SS-15 Temple Courtyard"],
  ["row-houses-dusk", "Row houses in the evening with warm window light", "Row houses, evening", "SS-25 Row Houses at Dusk"],
  ["garden-court", "Garden court between row houses", "Garden court", "SS-24 Row House Garden Court"],
  ["play-area", "Children's play area with play equipment and shade trees", "Children's play area", "SS-23 Childrens Play Area"],
  ["clubhouse-court", "Clubhouse beside a parking court", "Clubhouse and parking court", "SS-13 Clubhouse and Parking Court"],
  ["central-lawn", "Central lawn axis framed by residential buildings", "Central lawn axis", "SS-17 Central Lawn Axis"],
  ["courtyard-playground", "Courtyard playground seen from above", "Courtyard playground", "SS-12 Courtyard Playground Elevated"],
  ["clubhouse", "Clubhouse building and lawn", "Clubhouse and lawn", "SS-20/SS-21 Clubhouse"],
  ["row-house-wing", "Row house wing seen from above with lanes and landscaping", "Row house wing from above", "SS-03 Aerial Row House Wing"],
  ["row-house-street", "Row house street with two-storey homes and car porches", "Row house street", "SS-27..SS-32 Row House street"],
  ["row-houses-day", "Two-storey row houses by day with white portal frames, red brick pillars and planters", "Row houses, daytime", "SS-26 Row Houses by Day"],
  ["landscape", "Landscaped approach road with trees and planting", "Landscaped approach", "SS-16 Landscaped Approach"],
];

const out = [];
for (const [id, alt, caption, source] of items) {
  const src = join(srcDir, `${id}.webp`);
  const dest = join(outDir, `${id}.webp`);
  copyFileSync(src, dest);
  const meta = await sharp(src).metadata();
  const blur = await sharp(src).resize(16).webp({ quality: 40 }).toBuffer();
  out.push({
    id, kind: "render", src: `/media/${id}.webp`, width: meta.width, height: meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    alt, caption, artistImpression: true, source: `${source} (portfolio ${id}.webp)`,
  });
}
const logoSrc = join(srcDir, "logo.png");
const logoMeta = await sharp(logoSrc).metadata();
const logoDest = join(outDir, "shiv-shiva-logo.png");
copyFileSync(logoSrc, logoDest);
const logoBlur = await sharp(logoSrc).resize(16).png().toBuffer();
out.push({
  id: "shiv-shiva-logo", kind: "logo", src: "/media/shiv-shiva-logo.png", width: logoMeta.width, height: logoMeta.height,
  blurDataURL: `data:image/png;base64,${logoBlur.toString("base64")}`,
  alt: "Shiv Shiva Township logo", artistImpression: false, source: "portfolio logo.png",
});

const ts = `/**
 * Media library. Owner: data-lead (seeded by the Director from the portfolio's web renders; data-lead replaces
 * the files with the 4K photoreal masters under the same ids).
 */
import { mediaLibrarySchema, type Media } from "./schema";

export const media: readonly Media[] = mediaLibrarySchema.parse(${JSON.stringify(out, null, 2)});

const byId = new Map(media.map((item) => [item.id, item]));

export function getMedia(id: string): Media {
  const item = byId.get(id);
  if (!item) throw new Error(\`Unknown media id: \${id}\`);
  return item;
}
`;
writeFileSync(join(projectDir, "src", "content", "media.ts"), ts);
console.log(out.map((o) => `${o.id} ${o.width}x${o.height}`).join("\n"));
