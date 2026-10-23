"use client";

/**
 * Site header: a floating glass pill with the logo (the mark, plus the name from sm up), the primary navigation, the theme toggle, the
 * Enquire call to action and, below the md breakpoint, a menu button that opens the mobile menu (a lazily loaded dialog). Plain next/link everywhere:
 * the page transitions intercept internal link clicks at document level. Strings arrive as props from the server
 * shell so this chunk carries no string tables. Owner: pages-lead.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { isCurrent } from "./is-current";
import type { ShellLabels, ShellNavItem, ShellOffice } from "./shell-types";
import { ThemeToggle } from "./ThemeToggle";

const MobileMenu = dynamic(() => import("./MobileMenu").then((module) => module.MobileMenu), { ssr: false });

interface SiteHeaderProps {
  nav: readonly ShellNavItem[];
  labels: ShellLabels;
  office: ShellOffice;
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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-(--z-header)" data-site-header="">
      <div className="mx-auto w-full max-w-(--content-max) px-3 pt-3 sm:px-(--gutter)">
        <div className="glass pointer-events-auto flex h-14 items-center justify-between gap-3 rounded-full pl-2 pr-2 md:h-16 md:pl-3 md:pr-3">
          <Link href="/" aria-label={labels.homeLink} className="flex min-h-11 items-center whitespace-nowrap pl-2 text-ink md:pl-1">
            <Logo wordmark="sm" className="[--logo-h:2.25rem] md:[--logo-h:2.5rem]" />
          </Link>

          <nav aria-label={labels.primary} className="hidden md:block">
            <ul className="m-0 flex list-none items-center gap-8 p-0 lg:gap-11">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="nav-link link-draw link-draw--quiet"
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
