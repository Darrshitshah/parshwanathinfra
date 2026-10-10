// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/content/i18n/en";
import { EnquiryProvider } from "@/features/enquiry/EnquiryProvider";
import type { EnquiryConfig } from "@/features/enquiry/types";
import { SiteHeader } from "./SiteHeader";
import { ThemeToggle } from "./ThemeToggle";
import type { ShellLabels, ShellOffice } from "./shell-types";

vi.mock("next/navigation", () => ({ usePathname: () => "/projects/shiv-shiva" }));

const labels: ShellLabels = {
  wordmark: "Parshwanath Infra",
  homeLink: en.nav.homeLink,
  primary: en.nav.primaryLabel,
  menu: en.nav.menu,
  openMenu: en.nav.openMenu,
  closeMenu: en.nav.closeMenu,
  enquire: en.nav.enquire,
  themeToggle: en.nav.themeToggle,
  themeGroup: en.nav.themeGroup,
};

const office: ShellOffice = {
  heading: "Site office",
  address: "Opp. Haryana Hotel, Pipariya, Karamkhal, Vapi-Silvassa Road",
  mapUrl: "https://maps.app.goo.gl/example",
  mapLabel: "Open in Google Maps",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const config: EnquiryConfig = {
  projects: [{ slug: "shiv-shiva", name: "Shiv Shiva Township" }],
  defaultProject: "shiv-shiva",
  office: { name: "Site office", address: office.address, mapUrl: office.mapUrl },
  phones: [],
  whatsapp: null,
};

function stubMatchMedia(prefersDark = false) {
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        matches: prefersDark && query.includes("dark"),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  ) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  stubMatchMedia();
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("reflects the theme the page set before paint, and writes both the attribute and pi-theme", async () => {
    document.documentElement.dataset.theme = "light";
    const user = userEvent.setup();
    render(<ThemeToggle label={labels.themeToggle} />);
    const button = screen.getByRole("button", { name: en.nav.themeToggle });
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));

    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("pi-theme")).toBe("dark");
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));

    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("pi-theme")).toBe("light");
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));
  });

  it("follows the system preference when no theme was set", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    render(<ThemeToggle label={labels.themeToggle} />);
    const button = screen.getByRole("button", { name: en.nav.themeToggle });
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("still switches when storage is blocked", async () => {
    document.documentElement.dataset.theme = "light";
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const user = userEvent.setup();
    render(<ThemeToggle label={labels.themeToggle} />);
    await user.click(screen.getByRole("button", { name: en.nav.themeToggle }));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("SiteHeader", () => {
  function renderHeader() {
    return render(
      <EnquiryProvider config={config}>
        <div data-app-root="">
          <SiteHeader nav={nav} labels={labels} office={office} />
        </div>
      </EnquiryProvider>,
    );
  }

  it("marks the current section in the navigation and offers the filled Enquire button", () => {
    renderHeader();
    const primary = screen.getByRole("navigation", { name: en.nav.primaryLabel });
    expect(within(primary).getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(within(primary).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("button", { name: en.nav.enquire })[0]).toHaveClass("btn-enquire");
    expect(screen.getByRole("link", { name: en.nav.homeLink })).toHaveAttribute("href", "/");
  });

  it("opens the mobile menu as a modal dialog, traps focus, closes on Escape and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    renderHeader();
    const opener = screen.getByRole("button", { name: en.nav.openMenu });
    expect(opener).toHaveAttribute("aria-expanded", "false");

    await user.click(opener);
    const dialog = await screen.findByRole("dialog", { name: en.nav.menu }, { timeout: 5000 });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();
    expect(document.querySelector("[data-app-root]")).toHaveProperty("inert", true);
    for (const item of nav) expect(within(dialog).getByRole("link", { name: new RegExp(item.label) })).toHaveAttribute("href", item.href);
    expect(within(dialog).getByRole("button", { name: en.nav.closeMenu })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: en.nav.themeToggle })).toBeInTheDocument();
    expect(within(dialog).getByText(office.address, { exact: false })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: en.nav.menu })).not.toBeInTheDocument(), { timeout: 5000 });
    expect(document.querySelector("[data-app-root]")).toHaveProperty("inert", false);
    expect(opener).toHaveFocus();
    expect(opener).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the menu when a link in it is followed", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: en.nav.openMenu }));
    const dialog = await screen.findByRole("dialog", { name: en.nav.menu }, { timeout: 5000 });
    await user.click(within(dialog).getByRole("link", { name: /About/ }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: en.nav.menu })).not.toBeInTheDocument(), { timeout: 5000 });
  });

  it("opens the enquiry drawer from the menu and closes the menu behind it", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: en.nav.openMenu }));
    const menu = await screen.findByRole("dialog", { name: en.nav.menu }, { timeout: 5000 });
    await user.click(within(menu).getByRole("button", { name: en.nav.enquire }));

    const drawer = await screen.findByRole("dialog", { name: en.enquiry.title }, { timeout: 5000 });
    expect(drawer).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: en.nav.menu })).not.toBeInTheDocument(), { timeout: 5000 });
    // The page behind stays inert while the drawer is open.
    expect(document.querySelector("[data-app-root]")).toHaveProperty("inert", true);
    await act(async () => {
      await user.keyboard("{Escape}");
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 5000 });
    expect(document.querySelector("[data-app-root]")).toHaveProperty("inert", false);
  });
});
