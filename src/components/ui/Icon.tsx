/**
 * Small icon set: 24 px grid, 1.5 px strokes, round caps. Decorative by default (aria-hidden):
 * the control that holds an icon carries the accessible name.
 */
import type { SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "arrow-up-right"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "menu"
  | "sun"
  | "moon"
  | "check"
  | "pin"
  | "whatsapp";

const PATHS: Record<IconName, string> = {
  "arrow-right": "M4 12h15M13 6l6 6-6 6",
  "arrow-up-right": "M7 17L17 7M8 7h9v9",
  "chevron-left": "M14.5 5.5L8 12l6.5 6.5",
  "chevron-right": "M9.5 5.5L16 12l-6.5 6.5",
  close: "M6 6l12 12M18 6L6 18",
  menu: "M4 8.5h16M4 15.5h16",
  sun: "M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  pin: "M12 21s-6-5.6-6-10a6 6 0 1 1 12 0c0 4.4-6 10-6 10z",
  whatsapp: "M7.9 20A9 9 0 1 0 4 16.1L2 22z",
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
      {name === "sun" ? <circle cx="12" cy="12" r="3.75" /> : null}
      {name === "pin" ? <circle cx="12" cy="11" r="2.25" /> : null}
    </svg>
  );
}
