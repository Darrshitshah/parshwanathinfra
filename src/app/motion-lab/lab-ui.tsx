"use client";

import { createContext, useContext, type ButtonHTMLAttributes, type ReactNode } from "react";

/** Shared by every lab section: whether to preview the reduced-motion path of the primitives. */
export const LabContext = createContext({ reduced: false });

export function useLab() {
  return useContext(LabContext);
}

interface LabSectionProps {
  id: string;
  title: string;
  /** What to look for. Plain sentences. */
  note?: ReactNode;
  children: ReactNode;
}

export function LabSection({ id, title, note, children }: LabSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5 border-t border-line pt-10">
      <header className="space-y-2">
        <h2 className="font-mono text-sm tracking-widest text-ink uppercase">{title}</h2>
        {note ? <p className="max-w-(--measure) text-sm text-ink-muted">{note}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function LabButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[
        "rounded-xs border border-line-strong px-3 py-1.5 font-mono text-xs tracking-widest uppercase",
        "transition-colors hover:bg-paper-sunk",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "yes" | "no" }) {
  const color = tone === "yes" ? "text-forest" : tone === "no" ? "text-brick" : "text-ink-muted";
  return <span className={`font-mono text-[0.6875rem] tracking-widest uppercase ${color}`}>{children}</span>;
}
