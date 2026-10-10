/**
 * Amenities (data-slot="amenities"): every amenity in the project content, each labelled with its evidence ("As per
 * plan", "As per plan and renders" or "As shown in renders"). A horizontal scroller with scroll-snap from the md
 * breakpoint, a vertical stack on phones. Cards are deliberately not a uniform grid: the images alternate between
 * tall and wide and step down the page. Amenities with no render get a schematic drawn from the plan.
 * Hooks for motion: [data-amenities-track] and [data-amenity]. Owner: pages-lead.
 */
import { Figure } from "@/components/media/Figure";
import { Eyebrow } from "@/components/ui/Section";
import { cn } from "@/components/ui/cn";
import { ScrollerControls } from "@/components/ui/ScrollerControls";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { shivShiva } from "@/content/projects";
import { rich } from "@/components/ui/with-tbd";

type ProjectAmenity = (typeof shivShiva.amenities)[number];

/** A linear garden between two lanes with a water feature: the plan-only amenity, drawn as a schematic. */
function LinearGardenSchematic() {
  const trees = [58, 100, 142, 258, 300, 342];
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="Schematic of a linear garden between two lanes with a water feature at its centre" className="absolute inset-0 size-full">
      <defs>
        <pattern id="amenity-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="var(--type-amenity)" strokeWidth="1" opacity="0.45" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="var(--paper-sunk)" />
      <g stroke="var(--line-strong)" strokeWidth="1" fill="none">
        <line x1="0" y1="70" x2="400" y2="70" />
        <line x1="0" y1="92" x2="400" y2="92" />
        <line x1="0" y1="208" x2="400" y2="208" />
        <line x1="0" y1="230" x2="400" y2="230" />
      </g>
      <rect x="0" y="92" width="400" height="116" fill="url(#amenity-hatch)" />
      <g stroke="var(--type-amenity)" strokeWidth="1.5" fill="none">
        <rect x="24" y="108" width="352" height="84" />
        <circle cx="200" cy="150" r="27" />
        <circle cx="200" cy="150" r="14" />
        <circle cx="200" cy="150" r="3" fill="var(--type-amenity)" />
        {trees.map((x) => (
          <g key={x}>
            <circle cx={x} cy="124" r="6" />
            <circle cx={x} cy="176" r="6" />
          </g>
        ))}
      </g>
      <g stroke="var(--ink)" strokeWidth="1" fill="none">
        <line x1="24" y1="262" x2="376" y2="262" />
        <line x1="24" y1="256" x2="24" y2="268" />
        <line x1="376" y1="256" x2="376" y2="268" />
        <line x1="19" y1="267" x2="29" y2="257" />
        <line x1="371" y1="267" x2="381" y2="257" />
      </g>
    </svg>
  );
}

function AmenityCard({ amenity, index, total }: { amenity: ProjectAmenity; index: number; total: number }) {
  const tall = index % 2 === 0;
  const media = amenity.mediaId ? getMedia(amenity.mediaId) : null;
  const evidence = en.evidence[amenity.evidence];
  const number = String(index + 1).padStart(2, "0");
  const frame = cn(tall ? "aspect-[4/3] md:aspect-[4/5]" : "aspect-[4/3]");

  return (
    <li
      data-amenity={amenity.id}
      className={cn("md:w-[min(25rem,78vw)] md:shrink-0 md:snap-start", !tall && "md:mt-20")}
    >
      <article>
        {media ? (
          <Figure media={media} sizes="(min-width: 768px) 400px, calc(100vw - 2rem)" aspect={null} frameClassName={frame} />
        ) : (
          <div className={cn("relative overflow-hidden", frame)}>
            <LinearGardenSchematic />
            <span className="tag-impression">{homeCopy.amenities.schematicLabel}</span>
          </div>
        )}
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <span className="t-mono-sm text-ink-muted">
            {number} / {String(total).padStart(2, "0")}
          </span>
          <span className="chip">{evidence}</span>
        </div>
        <h3 className="t-display-4 m-0 mt-3 max-w-[18ch] text-ink">{amenity.name}</h3>
        {!media ? <p className="t-small mb-0 mt-2 text-ink-muted">{homeCopy.amenities.schematicNote}</p> : null}
      </article>
    </li>
  );
}

interface AmenitiesProps {
  id?: string;
  index?: string;
}

export function Amenities({ id = "amenities", index = "05" }: AmenitiesProps) {
  const items = shivShiva.amenities;
  const trackId = `${id}-track`;

  return (
    <section id={id} data-slot="amenities" aria-labelledby={`${id}-title`} className="section-pad overflow-x-clip">
      <div className="wrap">
        <Eyebrow index={index}>{homeCopy.amenities.eyebrow}</Eyebrow>
        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-x-(--gutter)">
          <h2 id={`${id}-title`} className="t-display-2 text-ink lg:col-span-6">
            {homeCopy.amenities.heading}
          </h2>
          <div className="flex items-end justify-between gap-8 lg:col-span-5 lg:col-start-8">
            <p className="t-lead m-0 max-w-[26rem] text-ink-muted">{rich(homeCopy.amenities.body)}</p>
            <ScrollerControls
              targetId={trackId}
              previousLabel={en.scroller.previous}
              nextLabel={en.scroller.next}
              className="hidden shrink-0 gap-2 md:flex"
            />
          </div>
        </div>
      </div>

      <ul
        id={trackId}
        data-amenities-track=""
        data-cursor-label="Drag"
        aria-label={homeCopy.amenities.scrollerLabel}
        tabIndex={0}
        className="m-0 mt-12 flex list-none flex-col gap-12 p-0 px-[max(var(--gutter),calc((100vw-var(--content-max))/2+var(--gutter)))] md:scroller md:scroll-px-[max(var(--gutter),calc((100vw-var(--content-max))/2+var(--gutter)))] md:snap-x md:snap-mandatory md:flex-row md:gap-8 md:pb-10"
      >
        {items.map((amenity, position) => (
          <AmenityCard key={amenity.id} amenity={amenity} index={position} total={items.length} />
        ))}
      </ul>
    </section>
  );
}
