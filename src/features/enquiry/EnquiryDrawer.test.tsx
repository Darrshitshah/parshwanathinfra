// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/content/i18n/en";
import { EnquiryDrawer, type EnquiryDrawerProps } from "./EnquiryDrawer";
import { EnquiryProvider, useEnquiry } from "./EnquiryProvider";
import type { EnquiryConfig } from "./types";

const config: EnquiryConfig = {
  projects: [{ slug: "shiv-shiva", name: "Shiv Shiva Township" }],
  defaultProject: "shiv-shiva",
  office: { name: "Site office", address: "Opp. Haryana Hotel, Pipariya, Karamkhal", mapUrl: "https://maps.app.goo.gl/example" },
  phones: [],
  whatsapp: null,
};

function matchMediaStub(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList;
}

function props(overrides: Partial<EnquiryDrawerProps> = {}): EnquiryDrawerProps {
  return {
    config,
    open: true,
    prefill: {},
    openedAt: Date.now() - 20_000,
    session: 1,
    initialDraft: {},
    onClose: vi.fn(),
    onDraftChange: vi.fn(),
    onSuccess: vi.fn(),
    ...overrides,
  };
}

/** The page chrome the drawer makes inert: SiteShell renders exactly this wrapper. */
function Page({ children }: { children?: ReactNode }) {
  return (
    <>
      <div data-app-root="">
        <button type="button">Opener</button>
        <a href="/elsewhere">Elsewhere</a>
      </div>
      {children}
    </>
  );
}

beforeEach(() => {
  window.matchMedia = vi.fn(matchMediaStub) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
});

describe("EnquiryDrawer", () => {
  it("is a labelled, modal dialog with the enquiry form inside", () => {
    render(
      <Page>
        <EnquiryDrawer {...props()} />
      </Page>,
    );
    const dialog = screen.getByRole("dialog", { name: en.enquiry.title });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("button", { name: en.enquiry.closeDialog })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(en.enquiry.fields.name)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: en.enquiry.submit })).toBeInTheDocument();
  });

  it("holds focus, hides and locks the page behind it, then gives everything back", async () => {
    const view = render(
      <Page>
        <EnquiryDrawer {...props()} />
      </Page>,
    );
    const opener = screen.getByRole("button", { name: "Opener", hidden: true });
    const root = document.querySelector<HTMLElement>("[data-app-root]");

    expect(screen.getByRole("dialog")).toHaveFocus();
    expect(root?.inert).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");

    view.rerender(
      <Page>
        <EnquiryDrawer {...props({ open: false })} />
      </Page>,
    );
    await waitFor(() => expect(root?.inert).toBe(false));
    expect(document.documentElement.style.overflow).toBe("");
    // Focus goes back to whatever had it before the drawer opened (here the body, since nothing was focused).
    expect(opener).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes on Escape, on the close button and on the scrim", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Page>
        <EnquiryDrawer {...props({ onClose })} />
      </Page>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: en.enquiry.closeDialog }));
    expect(onClose).toHaveBeenCalledTimes(2);

    const scrim = document.querySelector("[data-enquiry-drawer] > [aria-hidden='true']");
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim as Element);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("keeps Tab inside the dialog from both ends", async () => {
    const user = userEvent.setup();
    render(
      <Page>
        <EnquiryDrawer {...props()} />
      </Page>,
    );
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", { name: en.enquiry.closeDialog });
    const privacy = within(dialog).getByRole("link", { name: en.enquiry.privacyLink });
    const submit = within(dialog).getByRole("button", { name: en.enquiry.submit });
    expect(submit).toBeInTheDocument();

    // Shift+Tab from the dialog itself wraps to the last focusable element.
    await user.tab({ shift: true });
    expect(privacy).toHaveFocus();
    // Tab from the last element wraps to the first.
    await user.tab();
    expect(close).toHaveFocus();
    // Shift+Tab from the first element wraps to the last.
    await user.tab({ shift: true });
    expect(privacy).toHaveFocus();
  });

  it("closes itself when the privacy link inside it is followed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Page>
        <EnquiryDrawer {...props({ onClose })} />
      </Page>,
    );
    await user.click(screen.getByRole("link", { name: en.enquiry.privacyLink }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows what it was opened about", () => {
    render(
      <Page>
        <EnquiryDrawer {...props({ prefill: { plot: 17, interest: "3bhk-rowhouse" } })} />
      </Page>,
    );
    expect(screen.getByText(`${en.enquiry.aboutPlot} 17`)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "3 BHK row house" })).toBeChecked();
  });
});

describe("EnquiryProvider", () => {
  function OpenButtons() {
    const { open, isOpen } = useEnquiry();
    return (
      <>
        <button type="button" onClick={() => open()}>
          Open enquiry
        </button>
        <button type="button" onClick={() => open({ plot: 9 })}>
          Open for plot
        </button>
        <span data-testid="state">{isOpen ? "open" : "closed"}</span>
      </>
    );
  }

  it("opens the lazily loaded drawer from anywhere, pre-filled, and closes it again", async () => {
    const user = userEvent.setup();
    render(
      <EnquiryProvider config={config}>
        <div data-app-root="">
          <OpenButtons />
        </div>
      </EnquiryProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "Open for plot" }));
    const dialog = await screen.findByRole("dialog", { name: en.enquiry.title }, { timeout: 5000 });
    expect(screen.getByTestId("state")).toHaveTextContent("open");
    expect(within(dialog).getByText(`${en.enquiry.aboutPlot} 9`)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 5000 });
    // Focus is back on the button that opened it.
    expect(screen.getByRole("button", { name: "Open for plot" })).toHaveFocus();
  });

  it("does nothing, and does not fail, when used without a provider", async () => {
    const user = userEvent.setup();
    render(<OpenButtons />);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Open enquiry" }));
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
