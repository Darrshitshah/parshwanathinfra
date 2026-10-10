"use client";

/**
 * Site header: wordmark, primary navigation, theme toggle, the filled Enquire call to action and, below the md
 * breakpoint, a menu button that opens the mobile menu (a lazily loaded dialog). Plain next/link everywhere:
 * the page transitions intercept internal link clicks at document level. Strings arrive as props from the server
 * shell so this chunk carries no string tables. Owner: pages-lead.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { Icon } from "@/components/ui/Icon";
import { isCurrent } from "./is-current";
import type { ShellLabels, ShellNavItem, ShellOffice } from "./shell-types";
import { ThemeToggle } from "./ThemeToggle";

const MobileMenu = dynamic(() => import("./MobileMenu").then((module) => module.MobileMenu), { ssr: false });

interface SiteHeaderProps {
  nav: readonly ShellNavItem[];
  labels: ShellLabels;
  office: ShellOffice;
}

/** The roundabout from the plan, as a small ring and dot: the site's one brand device. */
function RoundaboutMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className="shrink-0 text-brick">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.75" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader({ nav, labels, office }: SiteHeaderProps) {
  const pathname = usePathname() ?? "";
  const [menu, setMenu] = useState({ open: false, loaded: false });

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    // Safari does not focus a button on click: focus it so the menu can hand focus back when it closes.
    event.currentTarget.focus();
    setMenu({ open: true, loaded: true });
  }

  function closeMenu() {
    setMenu((previous) => ({ ...previous, open: false }));
  }

  return (
    <header className="sticky top-0 z-(--z-header) border-b border-line bg-paper" data-site-header="">
      <div className="wrap flex h-(--header-h) items-center justify-between gap-3">
        <Link href="/" aria-label={labels.homeLink} className="flex min-h-11 items-center gap-2.5 whitespace-nowrap">
          <RoundaboutMark />
          <span className="font-display text-[1.5rem] leading-none tracking-[-0.01em] text-ink">{labels.wordmark}</span>
        </Link>

        <nav aria-label={labels.primary} className="hidden md:block">
          <ul className="m-0 flex list-none items-center gap-9 p-0">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-draw link-draw--quiet inline-flex min-h-11 items-center text-[0.9375rem] text-ink"
                  aria-current={isCurrent(item.href, pathname) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle label={labels.themeToggle} className="hidden md:inline-grid" />
          <EnquireButton arrow={false}>{labels.enquire}</EnquireButton>
          <button
            type="button"
            className="btn-icon btn-icon--outlined md:hidden"
            onClick={openMenu}
            aria-label={labels.openMenu}
            aria-haspopup="dialog"
            aria-expanded={menu.open}
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {menu.loaded ? (
        <MobileMenu
          open={menu.open}
          onClose={closeMenu}
          pathname={pathname}
          nav={nav}
          labels={labels}
          office={office}
        />
      ) : null}
    </header>
  );
}
