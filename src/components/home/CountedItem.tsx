"use client";

/**
 * One dimension row of the numbers section. The markup is rendered complete on the server (final value in
 * [data-dim-output]); on capable devices the line draws and the number counts up once as the row scrolls into view.
 * Reduced motion and Tier C: the motion gate leaves the markup as rendered. Owner: pages-lead.
 */
import { useRef, type ReactNode } from "react";
import { useDimensionCount } from "@/motion/hooks";

interface CountedItemProps {
  value: number;
  className?: string;
  children: ReactNode;
}

export function CountedItem({ value, className, children }: CountedItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  useDimensionCount(ref, value);
  return (
    <li ref={ref} data-dimension="" data-value={value} className={className}>
      {children}
    </li>
  );
}
