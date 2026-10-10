"use client";

/**
 * Light / dark toggle. layout.tsx sets html[data-theme] before paint from localStorage["pi-theme"] or the system
 * preference; this writes the same key and the same attribute. The pressed state is read from the document through
 * useSyncExternalStore, so server and client render identically until hydration. Owner: pages-lead.
 */
import { useSyncExternalStore } from "react";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/Icon";

type Theme = "light" | "dark";

const STORAGE_KEY = "pi-theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function readTheme(): Theme {
  const attribute = document.documentElement.dataset.theme;
  if (attribute === "dark" || attribute === "light") return attribute;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readServerTheme(): Theme | null {
  return null;
}

export function ThemeToggle({ label, className }: { label: string; className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, readServerTheme);

  function toggle() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice still applies for this page view.
    }
  }

  return (
    <button
      type="button"
      className={cn("btn-icon", className)}
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === null ? undefined : theme === "dark"}
      data-theme-toggle=""
    >
      <Icon name="moon" className="theme-moon" />
      <Icon name="sun" className="theme-sun" />
    </button>
  );
}
