/** Serialisable props for the gallery strip and lightbox. Type-only. Owner: pages-lead. */

export interface GalleryItem {
  id: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
  caption?: string;
  artistImpression: boolean;
}

export interface GalleryLabels {
  strip: string;
  open: string;
  dialog: string;
  counterOf: string;
  previous: string;
  next: string;
  close: string;
  artistsImpression: string;
}
