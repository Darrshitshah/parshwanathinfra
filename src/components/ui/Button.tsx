/**
 * The two button styles on the site.
 *  - FilledButton: the single filled style, reserved for the enquiry call to action (a pill; size "lg" is a disc).
 *  - LineButton: an outlined style for secondary and disabled states (for example "Brochure: TBD"). Never filled.
 * Both are plain presentational buttons; EnquireButton (client) wires FilledButton to the enquiry drawer.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Icon } from "./Icon";

interface FilledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "md" | "lg" | "wide";
  /** Trailing arrow that slides on hover. */
  arrow?: boolean;
  children: ReactNode;
}

export function FilledButton({ size = "md", arrow = true, className, children, type = "button", ...rest }: FilledButtonProps) {
  return (
    <button type={type} className={cn("btn-enquire", size === "lg" && "btn-enquire--lg", size === "wide" && "btn-enquire--wide", className)} {...rest}>
      <span>{children}</span>
      {arrow ? <Icon name="arrow-right" size={16} className="btn-enquire__arrow" /> : null}
    </button>
  );
}

interface LineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function LineButton({ className, children, type = "button", ...rest }: LineButtonProps) {
  return (
    <button type={type} className={cn("btn-line", className)} {...rest}>
      {children}
    </button>
  );
}
