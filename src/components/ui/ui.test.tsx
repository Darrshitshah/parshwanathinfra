// @vitest-environment jsdom
import { cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnquiryProvider } from "@/features/enquiry/EnquiryProvider";
import type { EnquiryConfig } from "@/features/enquiry/types";
import { FilledButton, LineButton } from "./Button";
import { EnquireButton } from "./EnquireButton";
import { Eyebrow, Section } from "./Section";
import { ScrollerControls } from "./ScrollerControls";
import { TextLink } from "./TextLink";
import { cn } from "./cn";
import { directionsUrl, formatCoordinates } from "./map-links";
import { getFocusable, lockScroll, makeAppInert, useDialog } from "./use-dialog";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("style");
});

beforeEach(() => {
  window.matchMedia = vi.fn(
    (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList,
  ) as unknown as typeof window.matchMedia;
});

describe("cn", () => {
  it("joins class names and skips anything falsy", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });
});

describe("map links", () => {
  it("builds a keyless directions link and a readable coordinate pair", () => {
    expect(directionsUrl({ lat: 20.2934524, lng: 72.9932563 })).toBe("https://www.google.com/maps/dir/?api=1&destination=20.2934524,72.9932563");
    expect(formatCoordinates({ lat: 20.2934524, lng: 72.9932563 })).toBe("20.2935° N · 72.9933° E");
    expect(formatCoordinates({ lat: -1.5, lng: -2.25 })).toBe("1.5000° S · 2.2500° W");
  });
});

describe("TextLink", () => {
  it("uses a plain anchor for in-page, mail and phone links", () => {
    render(
      <>
        <TextLink href="#plan">Plan</TextLink>
        <TextLink href="mailto:team@example.com">Mail</TextLink>
        <TextLink href="tel:+919876543210">Call</TextLink>
      </>,
    );
    for (const name of ["Plan", "Mail", "Call"]) {
      const link = screen.getByRole("link", { name });
      expect(link).not.toHaveAttribute("target");
      expect(link).toHaveClass("link-draw");
    }
  });

  it("opens an external link in a new tab, safely, and says so to assistive technology", () => {
    render(<TextLink href="https://maps.app.goo.gl/example">Open in Google Maps</TextLink>);
    const link = screen.getByRole("link", { name: /Open in Google Maps/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it("keeps internal paths as ordinary links and can show a trailing arrow", () => {
    const { container } = render(
      <TextLink href="/projects" arrow="right">
        Projects
      </TextLink>,
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("calls onClick", async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const user = userEvent.setup();
    render(
      <TextLink href="/privacy" onClick={onClick}>
        Privacy
      </TextLink>,
    );
    await user.click(screen.getByRole("link", { name: "Privacy" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("buttons", () => {
  it("has exactly one filled style, and the outline style is never filled", () => {
    render(
      <>
        <FilledButton>Enquire</FilledButton>
        <LineButton>Secondary</LineButton>
      </>,
    );
    expect(screen.getByRole("button", { name: "Enquire" })).toHaveClass("btn-enquire");
    expect(screen.getByRole("button", { name: "Secondary" })).toHaveClass("btn-line");
    expect(screen.getByRole("button", { name: "Secondary" })).not.toHaveClass("btn-enquire");
  });

  it("is a button of type button unless told otherwise, and can be disabled", () => {
    render(<LineButton disabled>Brochure</LineButton>);
    expect(screen.getByRole("button", { name: "Brochure" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Brochure" })).toHaveAttribute("type", "button");
  });
});

describe("EnquireButton", () => {
  const config: EnquiryConfig = {
    projects: [{ slug: "shiv-shiva", name: "Shiv Shiva Township" }],
    defaultProject: "shiv-shiva",
    office: { name: "Site office", address: "Address", mapUrl: "https://maps.app.goo.gl/example" },
    phones: [],
    whatsapp: null,
  };

  it("opens the drawer with the pre-fill it was given, focuses itself first, and runs onBeforeOpen", async () => {
    const onBeforeOpen = vi.fn();
    const user = userEvent.setup();
    render(
      <EnquiryProvider config={config}>
        <div data-app-root="">
          <EnquireButton prefill={{ plot: 5 }} onBeforeOpen={onBeforeOpen}>
            Enquire about plot 5
          </EnquireButton>
        </div>
      </EnquiryProvider>,
    );
    const button = screen.getByRole("button", { name: "Enquire about plot 5" });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(button);
    expect(onBeforeOpen).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Enquiring about plot 5", {}, { timeout: 5000 })).toBeInTheDocument();
  });
});

describe("Section and Eyebrow", () => {
  it("labels a section by its heading and marks the slot a Phase 2 experience mounts into", () => {
    const { container } = render(
      <Section id="plan" slot="living-plan">
        <h2 id="plan-title">The plan</h2>
      </Section>,
    );
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", "plan");
    expect(section).toHaveAttribute("data-slot", "living-plan");
    expect(section).toHaveAttribute("aria-labelledby", "plan-title");
    expect(screen.getByRole("region", { name: "The plan" })).toBe(section);
  });

  it("shows a numbered marker (hidden from assistive technology), the label and an optional note", () => {
    const { container } = render(<Eyebrow index="03" note="Indicative">The plan</Eyebrow>);
    expect(container.querySelector(".eyebrow__marker")).toHaveAttribute("aria-hidden", "true");
    expect(container).toHaveTextContent("The plan");
    expect(container).toHaveTextContent("Indicative");
  });
});

describe("ScrollerControls", () => {
  it("scrolls the target by most of its width in either direction, instantly when reduced motion is set", async () => {
    const track = document.createElement("div");
    track.id = "track";
    Object.defineProperty(track, "clientWidth", { value: 1000 });
    const scrollBy = vi.fn();
    track.scrollBy = scrollBy as unknown as typeof track.scrollBy;
    document.body.append(track);

    const user = userEvent.setup();
    render(<ScrollerControls targetId="track" previousLabel="Back" nextLabel="Forward" />);
    await user.click(screen.getByRole("button", { name: "Forward" }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 800, behavior: "smooth" });
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -800, behavior: "smooth" });

    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;
    await user.click(screen.getByRole("button", { name: "Forward" }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 800, behavior: "auto" });
    track.remove();
  });

  it("does nothing when its target is missing", async () => {
    const user = userEvent.setup();
    render(<ScrollerControls targetId="missing" previousLabel="Back" nextLabel="Forward" />);
    await user.click(screen.getByRole("button", { name: "Forward" }));
    expect(screen.getByRole("button", { name: "Forward" })).toBeInTheDocument();
  });
});

describe("page locks used by dialogs", () => {
  it("locks scroll once for any number of dialogs and releases only when the last one closes", () => {
    const html = document.documentElement;
    html.style.overflow = "auto";
    const first = lockScroll();
    const second = lockScroll();
    expect(html.style.overflow).toBe("hidden");
    first();
    first();
    expect(html.style.overflow).toBe("hidden");
    second();
    expect(html.style.overflow).toBe("auto");
  });

  it("pads the page by the width of the scrollbar it hides, so nothing jumps sideways", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    Object.defineProperty(document.documentElement, "clientWidth", { value: 1009, configurable: true });
    const release = lockScroll();
    expect(document.documentElement.style.paddingRight).toBe("15px");
    release();
    expect(document.documentElement.style.paddingRight).toBe("");
  });

  it("makes the app chrome inert once for nested dialogs", () => {
    document.body.innerHTML = '<div data-app-root=""></div>';
    const root = document.querySelector<HTMLElement>("[data-app-root]") as HTMLElement;
    const first = makeAppInert();
    const second = makeAppInert();
    expect(root.inert).toBe(true);
    first();
    expect(root.inert).toBe(true);
    second();
    expect(root.inert).toBe(false);
    expect(makeAppInert()).toBeTypeOf("function");
  });

  it("lists only the elements a keyboard can reach", () => {
    document.body.innerHTML = `
      <div id="d">
        <button>One</button>
        <button disabled>Two</button>
        <a href="/x">Three</a>
        <input type="hidden" />
        <input tabindex="-1" />
        <div hidden><button>Four</button></div>
        <div aria-hidden="true"><button>Five</button></div>
        <button style="visibility: hidden">Six</button>
        <textarea></textarea>
      </div>`;
    const names = getFocusable(document.getElementById("d") as HTMLElement).map((element) => element.textContent?.trim() || element.tagName);
    expect(names).toEqual(["One", "Three", "TEXTAREA"]);
  });
});

describe("useDialog", () => {
  function Host({ open, onClose }: { open: boolean; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useDialog({ open, panelRef: ref, onClose });
    return open ? (
      <div ref={ref} role="dialog" tabIndex={-1}>
        <button>Inside</button>
      </div>
    ) : null;
  }

  it("does nothing while closed, and puts focus back where it was when it closes", async () => {
    const onClose = vi.fn();
    const outside = document.createElement("button");
    outside.textContent = "Outside";
    document.body.append(outside);
    outside.focus();

    const { rerender } = render(<Host open={false} onClose={onClose} />);
    expect(outside).toHaveFocus();
    rerender(<Host open onClose={onClose} />);
    expect(screen.getByRole("dialog")).toHaveFocus();
    rerender(<Host open={false} onClose={onClose} />);
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it("uses the latest onClose", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Host open onClose={first} />);
    rerender(<Host open onClose={second} />);
    await user.keyboard("{Escape}");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("is usable from a hook harness without a panel (nothing to trap)", () => {
    const { unmount } = renderHook(() => useDialog({ open: true, panelRef: { current: null }, onClose: () => undefined }));
    expect(() => unmount()).not.toThrow();
  });
});
