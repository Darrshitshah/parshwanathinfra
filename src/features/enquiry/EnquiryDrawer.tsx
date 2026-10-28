"use client";

/**
 * The enquiry drawer: a right-hand panel (full width on a 360 px phone), role="dialog" and aria-modal, labelled by
 * its title, with a focus trap, Escape and scrim to close, and focus restored to the opener. Animated with Motion
 * (LazyMotion keeps it small); users who prefer reduced motion, and Tier C devices, get fades only.
 * Loaded lazily by EnquiryProvider. Owner: pages-lead.
 */
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { useDialog } from "@/components/ui/use-dialog";
import { en } from "@/content/i18n/en";
import { useDeviceTier } from "@/lib/device-tier-provider";
import { EnquiryForm } from "./EnquiryForm";
import type { FormValues } from "./form-state";
import type { EnquiryConfig, EnquiryPrefill } from "./types";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DRAWER_SCOPE = "enquiry-drawer";

export interface EnquiryDrawerProps {
  config: EnquiryConfig;
  open: boolean;
  prefill: EnquiryPrefill;
  openedAt: number;
  session: number;
  initialDraft: Partial<FormValues>;
  onClose: () => void;
  onDraftChange: (values: FormValues) => void;
  onSuccess: () => void;
}

interface PanelProps extends Omit<EnquiryDrawerProps, "open"> {
  fadesOnly: boolean;
}

function DrawerPanel({
  config,
  prefill,
  openedAt,
  initialDraft,
  onClose,
  onDraftChange,
  onSuccess,
  fadesOnly,
}: PanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  // Dialog behaviour ends the moment the exit animation starts, so focus is handed back at once.
  const present = useIsPresent();
  useDialog({ open: present, panelRef, onClose });

  const panelMotion = fadesOnly
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { duration: 0.5, ease: EASE_OUT },
      };

  const projectName = config.projects.find((project) => project.slug === (prefill.project ?? config.defaultProject))?.name;

  return (
    <div className="fixed inset-0 z-(--z-drawer)" data-enquiry-drawer="">
      <m.div
        aria-hidden="true"
        className="absolute inset-0 bg-(--scrim) backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <m.aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-lenis-prevent=""
        className="absolute inset-y-0 right-0 flex w-full max-w-[34rem] flex-col overflow-y-auto overscroll-contain bg-paper-raised outline-none sm:rounded-l-[2rem]"
        {...panelMotion}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-paper-raised px-5 py-3 sm:px-8">
          <p className="t-mono-sm m-0 truncate text-ink-muted">
            {en.enquiry.kicker}
            {projectName ? ` · ${projectName}` : ""}
          </p>
          <button type="button" className="btn-icon btn-icon--outlined shrink-0" onClick={onClose} aria-label={en.enquiry.closeDialog}>
            <Icon name="close" />
          </button>
        </div>
        <div className="px-5 pb-12 pt-8 sm:px-8">
          <h2 id={titleId} className="t-display-3 m-0 text-ink">
            {en.enquiry.title}
          </h2>
          <p className="mb-8 mt-3 max-w-[32rem] text-ink-muted">{en.enquiry.intro}</p>
          <EnquiryForm
            config={config}
            prefill={prefill}
            openedAt={openedAt}
            scope={DRAWER_SCOPE}
            initialDraft={initialDraft}
            onDraftChange={onDraftChange}
            onSuccess={onSuccess}
            onDone={onClose}
            onNavigate={onClose}
          />
        </div>
      </m.aside>
    </div>
  );
}

export function EnquiryDrawer({ open, session, ...rest }: EnquiryDrawerProps) {
  const { tier } = useDeviceTier();
  if (typeof document === "undefined") return null;
  return createPortal(
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>{open ? <DrawerPanel key={session} session={session} {...rest} fadesOnly={tier === "C"} /> : null}</AnimatePresence>
      </MotionConfig>
    </LazyMotion>,
    document.body,
  );
}
