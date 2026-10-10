// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/content/i18n/en";
import { GalleryStrip } from "./GalleryStrip";
import type { GalleryItem, GalleryLabels } from "./gallery-types";
import { getMedia } from "@/content/media";

const labels: GalleryLabels = {
  strip: en.gallery.strip,
  open: en.gallery.open,
  dialog: en.gallery.dialog,
  counterOf: en.gallery.counter,
  previous: en.gallery.previous,
  next: en.gallery.next,
  close: en.gallery.close,
  artistsImpression: en.common.artistsImpression,
};

const ids = ["masterplan-full", "roundabout", "row-houses-day"];
const items: GalleryItem[] = ids.map((id) => {
  const media = getMedia(id);
  return {
    id,
    src: media.src,
    width: media.width,
    height: media.height,
    blurDataURL: media.blurDataURL,
    alt: media.alt,
    caption: media.caption,
    artistImpression: media.artistImpression,
  };
});

beforeEach(() => {
  window.matchMedia = vi.fn(
    (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList,
  ) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = "";
});

describe("GalleryStrip", () => {
  it("shows every frame with its number, fixed ratio and artist's impression label", () => {
    const { container } = render(
      <div data-app-root="">
        <GalleryStrip items={items} labels={labels} />
      </div>,
    );
    const frames = container.querySelectorAll<HTMLElement>("[data-gallery-item]");
    expect(frames).toHaveLength(3);
    expect(frames[0]?.style.aspectRatio.replace(/\s/g, "")).toBe(`${items[0]?.width}/${items[0]?.height}`);
    expect(frames[1]).toHaveTextContent("02 / 03");
    expect(container.querySelectorAll(".tag-impression")).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    // The strip is a focusable, named scroll region.
    expect(screen.getByRole("list", { name: en.gallery.strip })).toHaveAttribute("tabindex", "0");
  });

  it("opens a lightbox on the frame that was chosen and walks through the frames from the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <div data-app-root="">
        <GalleryStrip items={items} labels={labels} />
      </div>,
    );
    const second = screen.getByRole("button", { name: `${en.gallery.open}: ${items[1]?.caption}` });
    await user.click(second);

    const viewer = await screen.findByRole("dialog", { name: en.gallery.dialog }, { timeout: 5000 });
    expect(viewer).toHaveAttribute("aria-modal", "true");
    expect(within(viewer).getByText("02 of 03")).toBeInTheDocument();
    expect(within(viewer).getByText(items[1]?.caption ?? "")).toBeInTheDocument();
    expect(within(viewer).getByText(en.common.artistsImpression)).toBeInTheDocument();
    expect(within(viewer).getByRole("button", { name: en.gallery.close })).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe("hidden");

    await user.keyboard("{ArrowRight}");
    expect(within(viewer).getByText("03 of 03")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(within(viewer).getByText("01 of 03")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(within(viewer).getByText("03 of 03")).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(within(viewer).getByText("01 of 03")).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(within(viewer).getByText("03 of 03")).toBeInTheDocument();

    await user.click(within(viewer).getByRole("button", { name: en.gallery.previous }));
    expect(within(viewer).getByText("02 of 03")).toBeInTheDocument();
    await user.click(within(viewer).getByRole("button", { name: en.gallery.next }));
    expect(within(viewer).getByText("03 of 03")).toBeInTheDocument();
  });

  it("closes on Escape, unlocks the page and hands focus back to the frame that opened it", async () => {
    const user = userEvent.setup();
    render(
      <div data-app-root="">
        <GalleryStrip items={items} labels={labels} />
      </div>,
    );
    const first = screen.getByRole("button", { name: `${en.gallery.open}: ${items[0]?.caption}` });
    await user.click(first);
    await screen.findByRole("dialog", { name: en.gallery.dialog }, { timeout: 5000 });

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 5000 });
    expect(document.documentElement.style.overflow).toBe("");
    expect(first).toHaveFocus();
  });

  it("moves on a horizontal swipe", async () => {
    const user = userEvent.setup();
    render(
      <div data-app-root="">
        <GalleryStrip items={items} labels={labels} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: `${en.gallery.open}: ${items[0]?.caption}` }));
    const viewer = await screen.findByRole("dialog", { name: en.gallery.dialog }, { timeout: 5000 });
    const surface = within(viewer).getAllByRole("img")[0]?.parentElement as HTMLElement;

    fireEvent.pointerDown(surface, { clientX: 300, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 180, pointerId: 1 });
    expect(within(viewer).getByText("02 of 03")).toBeInTheDocument();

    // A short drag is not a swipe.
    fireEvent.pointerDown(surface, { clientX: 300, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 280, pointerId: 1 });
    expect(within(viewer).getByText("02 of 03")).toBeInTheDocument();

    fireEvent.pointerDown(surface, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 240, pointerId: 1 });
    expect(within(viewer).getByText("01 of 03")).toBeInTheDocument();
  });
});
