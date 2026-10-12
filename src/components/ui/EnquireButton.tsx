"use client";

/**
 * The filled enquiry call to action. Opens the enquiry drawer (optionally pre-filled) and warms the drawer chunk
 * on hover and focus. The label is passed in by the server component that renders it, so this client chunk stays
 * free of the string tables. Owner: pages-lead.
 */
import type { MouseEvent, ReactNode } from "react";
import { useEnquiry } from "@/features/enquiry/EnquiryProvider";
import type { EnquiryPrefill } from "@/features/enquiry/types";
import { FilledButton } from "./Button";

interface EnquireButtonProps {
  children: ReactNode;
  prefill?: EnquiryPrefill;
  size?: "md" | "lg" | "wide";
  arrow?: boolean;
  className?: string;
  /** Runs before the drawer opens (the mobile menu uses it to close itself). */
  onBeforeOpen?: () => void;
}

export function EnquireButton({ children, prefill, size, arrow, className, onBeforeOpen }: EnquireButtonProps) {
  const { open, prefetch } = useEnquiry();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Safari does not focus a button on click: focus it so the drawer can hand focus back when it closes.
    event.currentTarget.focus();
    onBeforeOpen?.();
    open(prefill);
  }

  return (
    <FilledButton
      size={size}
      arrow={arrow}
      className={className}
      onClick={handleClick}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      aria-haspopup="dialog"
      data-enquire=""
    >
      {children}
    </FilledButton>
  );
}
