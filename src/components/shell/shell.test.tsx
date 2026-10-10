// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SHOW_RERA } from "@/content/copy/flags";
import { site } from "@/content/site";
import { SiteFooter } from "./SiteFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { LEGAL_ITEMS, NAV_ITEMS } from "./nav";
import { isCurrent } from "./is-current";

afterEach(cleanup);

describe("WhatsAppButton", () => {
  it("renders the confirmed number with the prefilled text", () => {
    expect(site.contact.whatsapp).toBe("7874305000");
    render(<WhatsAppButton />);
    const href = screen.getByRole("link", { name: /chat on whatsapp/i }).getAttribute("href") ?? "";
    expect(href).toMatch(/^https:\/\/wa\.me\/917874305000\?text=/);
    expect(decodeURIComponent(href)).toContain("Shiv Shiva Township");
  });

  it("renders nothing while the WhatsApp number is TBD", () => {
    const { container } = render(<WhatsAppButton number="TBD" />);
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
  it("does not mention RERA anywhere while SHOW_RERA is off", () => {
    expect(SHOW_RERA).toBe(false);
    const { container } = render(<SiteFooter />);
    expect(container.querySelector("[data-rera-line]")).toBeNull();
    expect(container.textContent).not.toMatch(/rera/i);
  });

  it("shows the confirmed legal name in the title block and the copyright line", () => {
    const { container } = render(<SiteFooter />);
    const cell = screen.getByText("Legal name").closest(".titleblock__cell");
    expect(cell).toHaveTextContent("Parshwanath Infra Pvt. Ltd.");
    expect(cell?.querySelector("[data-tbd]")).toBeNull();
    expect(container.textContent).toContain("Parshwanath Infra Pvt. Ltd. All rights reserved.");
  });

  it("lists both sales numbers as tel links", () => {
    const { container } = render(<SiteFooter />);
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href^='tel:']"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["tel:+917874305000", "tel:+917874306000"]);
    expect(links.map((link) => link.textContent)).toEqual(["+91 78743 05000", "+91 78743 06000"]);
  });

  it("carries the artist's impression and general disclaimers from the content layer", () => {
    render(<SiteFooter />);
    expect(screen.getByText(site.disclaimers.artistImpression)).toBeInTheDocument();
    expect(screen.getByText(site.disclaimers.general)).toBeInTheDocument();
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
