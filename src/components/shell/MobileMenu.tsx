"use client";

/**
 * Mobile menu: a full-screen dialog opened from the header (below the md breakpoint). Focus is trapped inside,
 * Escape closes, and focus returns to the menu button. Motion handles the state animation (LazyMotion keeps it
 * small); reduced motion and Tier C get fades only. Loaded lazily by SiteHeader. Owner: pages-lead.
 */
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import Link from "next/link";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { EnquireButton } from "@/components/ui/EnquireButton";
import { Icon } from "@/components/ui/Icon";
import { keepTogether } from "@/components/ui/nowrap";
import { TextLink } from "@/components/ui/TextLink";
import { useDialog } from "@/components/ui/use-dialog";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { isCurrent } from "./is-current";
import type { ShellLabels, ShellNavItem, ShellOffice } from "./shell-types";
import { ThemeToggle } from "./ThemeToggle";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  nav: readonly ShellNavItem[];
  labels: ShellLabels;
  office: ShellOffice;
}

interface PanelProps extends Omit<MobileMenuProps, "open"> {
  fadesOnly: boolean;
}

function MenuPanel({ onClose, pathname, nav, labels, office, fadesOnly }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Dialog behaviour ends the moment the exit animation starts, so focus is handed back at once.
  const present = useIsPresent();
  useDialog({ open: present, panelRef, onClose });

  const rise = fadesOnly ? {} : { y: 14 };

  return (
    <m.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.menu}
      tabIndex={-1}
      data-lenis-prevent=""
      data-mobile-menu=""
      className="fixed inset-0 z-(--z-drawer) flex flex-col overflow-y-auto bg-paper outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="wrap flex h-(--header-h) shrink-0 items-center justify-between border-b border-line">
        <span className="font-display text-[1.5rem] leading-none tracking-[-0.01em] text-ink">{labels.wordmark}</span>
        <button type="button" className="btn-icon btn-icon--outlined" onClick={onClose} aria-label={labels.closeMenu}>
          <Icon name="close" />
        </button>
      </div>

      <nav aria-label={labels.primary} className="wrap pt-8">
        <ul className="m-0 grid list-none p-0">
          {nav.map((item, index) => (
            <m.li
              key={item.href}
              className="border-b border-line"
              initial={{ opacity: 0, ...rise }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.06 + index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={isCurrent(item.href, pathname) ? "page" : undefined}
                className="flex min-h-16 items-baseline gap-4 py-3 text-ink"
              >
                <span className="t-mono-sm w-6 text-ink-muted" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="t-display-3">{item.label}</span>
              </Link>
            </m.li>
          ))}
        </ul>
      </nav>

      <div className="wrap mt-auto grid gap-7 pb-10 pt-10">
        <div className="flex items-center justify-between gap-4">
          <EnquireButton size="lg" onBeforeOpen={onClose}>
            {labels.enquire}
          </EnquireButton>
          <div role="group" aria-label={labels.themeGroup}>
            <ThemeToggle label={labels.themeToggle} className="btn-icon--outlined" />
          </div>
        </div>
        <div className="grid gap-1.5 border-t border-line pt-5">
          <p className="t-mono-sm m-0 text-ink-muted">{office.heading}</p>
          <address className="t-small not-italic text-ink">{keepTogether(office.address)}</address>
          <TextLink href={office.mapUrl} className="t-small">
            {office.mapLabel}
          </TextLink>
        </div>
      </div>
    </m.div>
  );
}

export function MobileMenu({ open, ...rest }: MobileMenuProps) {
  const { tier } = useDeviceTier();
  if (typeof document === "undefined") return null;
  return createPortal(
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>{open ? <MenuPanel key="menu" {...rest} fadesOnly={tier === "C"} /> : null}</AnimatePresence>
      </MotionConfig>
    </LazyMotion>,
    document.body,
  );
}
