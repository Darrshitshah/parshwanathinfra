/**
 * Gallery reel section (data-slot="gallery"): the project's gallery images as a horizontal strip with a lightbox.
 * The images come from the project content (galleryIds); the strip and lightbox are the client island.
 * Used on Home and on the project page (id="gallery"). Owner: pages-lead.
 */
import { Eyebrow } from "@/components/ui/Section";
import { homeCopy } from "@/content/copy/home";
import { en } from "@/content/i18n/en";
import { getMedia } from "@/content/media";
import { shivShiva } from "@/content/projects";
import { Reveal } from "@/motion/Reveal";
import { GalleryStrip } from "./GalleryStrip";
import type { GalleryItem, GalleryLabels } from "./gallery-types";

const LABELS: GalleryLabels = {
  strip: en.gallery.strip,
  open: en.gallery.open,
  dialog: en.gallery.dialog,
  counterOf: en.gallery.counter,
  previous: en.gallery.previous,
  next: en.gallery.next,
  close: en.gallery.close,
  artistsImpression: en.common.artistsImpression,
};

interface GalleryReelProps {
  id?: string;
  index?: string;
}

export function GalleryReel({ id = "gallery", index = "08" }: GalleryReelProps) {
  const items: GalleryItem[] = shivShiva.galleryIds.map((mediaId) => {
    const media = getMedia(mediaId);
    return {
      id: media.id,
      src: media.src,
      width: media.width,
      height: media.height,
      blurDataURL: media.blurDataURL,
      alt: media.alt,
      caption: media.caption,
      artistImpression: media.artistImpression,
    };
  });

  return (
    <section id={id} data-slot="gallery" aria-labelledby={`${id}-title`} className="section-pad overflow-x-clip">
      <div className="wrap">
        <Eyebrow index={index}>{homeCopy.gallery.eyebrow}</Eyebrow>
        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-x-(--gutter)">
          <Reveal kind="split" as="h2" id={`${id}-title`} className="t-display-2 text-ink lg:col-span-6">
            {homeCopy.gallery.heading}
          </Reveal>
          <p className="t-lead m-0 text-ink-muted lg:col-span-4 lg:col-start-9">{homeCopy.gallery.body(items.length)}</p>
        </div>
      </div>
      <Reveal kind="blinds">
        <GalleryStrip items={items} labels={LABELS} />
      </Reveal>
    </section>
  );
}
