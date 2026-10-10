// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { site } from "@/content/site";
import { SiteFooter } from "./SiteFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { LEGAL_ITEMS, NAV_ITEMS } from "./nav";
import { isCurrent } from "./is-current";

afterEach(cleanup);

describe("WhatsAppButton", () => {
  it("renders nothing while the WhatsApp number is TBD", () => {
    expect(site.contact.whatsapp).toBe("TBD");
    const { container } = render(<WhatsAppButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a wa.me link with the India country code once a number is confirmed", () => {
    render(<WhatsAppButton number="9876543210" />);
    const link = screen.getByRole("link", { name: /chat on whatsapp/i });
    expect(link).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\/919876543210\?text=/));
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});

describe("SiteFooter", () => {
  it("shows the RERA line as TBD, never a made-up number", () => {
    const { container } = render(<SiteFooter />);
    const line = container.querySelector("[data-rera-line]");
    expect(line).not.toBeNull();
    expect(line?.textContent).toMatch(/RERA registration:/i);
    expect(line?.querySelectorAll("[data-tbd]").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the legal name as a TBD chip while it is unconfirmed", () => {
    render(<SiteFooter />);
    const label = screen.getByText("Legal name");
    const cell = label.closest(".titleblock__cell");
    expect(cell?.querySelector("[data-tbd]")).not.toBeNull();
  });

  it("carries the three disclaimers from the content layer", () => {
    render(<SiteFooter />);
    expect(screen.getByText(site.disclaimers.artistImpression)).toBeInTheDocument();
    expect(screen.getByText(site.disclaimers.general)).toBeInTheDocument();
    expect(screen.getByText(site.disclaimers.rera)).toBeInTheDocument();
  });

  it("links the site office to Google Maps and lists the navigation and legal links", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /open in google maps/i })).toHaveAttribute("href", site.contact.office.mapUrl);
    const explore = screen.getByRole("navigation", { name: "Explore" });
    for (const item of NAV_ITEMS) expect(within(explore).getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    const legal = screen.getByRole("navigation", { name: "Legal" });
    for (const item of LEGAL_ITEMS) expect(within(legal).getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
  });
});

describe("isCurrent", () => {
  it("matches the home page only on the root", () => {
    expect(isCurrent("/", "/")).toBe(true);
    expect(isCurrent("/", "/about")).toBe(false);
  });

  it("matches a section on its own path and beneath it", () => {
    expect(isCurrent("/projects", "/projects")).toBe(true);
    expect(isCurrent("/projects", "/projects/shiv-shiva")).toBe(true);
    expect(isCurrent("/projects", "/projectsx")).toBe(false);
    expect(isCurrent("/about", "/contact")).toBe(false);
  });
});
