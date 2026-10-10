"use client";

/**
 * Sticky sub-navigation for the project page: Overview, Plan, Homes, Row houses, Amenities, Location, Gallery,
 * Brochure, Enquire. An IntersectionObserver marks the section crossing a thin band near the top of the viewport and
 * a brick underline slides to it (transform only). Without JavaScript it is a plain list of anchor links. On phones
 * the row scrolls sideways and keeps the current item in view. Owner: pages-lead.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";

interface SubNavItem {
  id: string;
  label: string;
}

export function SubNav({ items, label }: { items: readonly SubNavItem[]; label: string }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Current section: the last one whose top has passed a line at 35 percent of the viewport height. An
  // IntersectionObserver only triggers the recomputation when a section crosses a thin band around that line.
  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;
    const last = items[items.length - 1]?.id ?? "";
    const first = items[0]?.id ?? "";
    const footer = document.querySelector<HTMLElement>("[data-site-footer]");

    const compute = () => {
      const line = window.innerHeight * 0.35;
      let current = first;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) current = target.id;
      }
      // The footer sits below the last section: reaching it means the last item is current.
      if (footer && footer.getBoundingClientRect().top <= line) current = last;
      setActive(current);
    };

    const observer = new IntersectionObserver(compute, { rootMargin: "-30% 0px -65% 0px", threshold: 0 });
    targets.forEach((target) => observer.observe(target));
    if (footer) observer.observe(footer);
    compute();
    return () => observer.disconnect();
  }, [items]);

  // Slide the underline under the current item and keep that item in view inside the scroller.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const bar = indicatorRef.current;
    if (!scroller || !bar) return;
    const link = scroller.querySelector<HTMLElement>(`[data-subnav-id="${CSS.escape(active)}"]`);
    if (!link) return;

    const place = () => {
      bar.style.transform = `translateX(${link.offsetLeft}px) scaleX(${link.offsetWidth})`;
      bar.style.opacity = "1";
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const target = link.offsetLeft - (scroller.clientWidth - link.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, target), behavior: reduced ? "auto" : "smooth" });
    };
    place();
    // Switch the slide transition on after the first placement, so the bar does not fly in from the left.
    const frame = window.requestAnimationFrame(() => bar.setAttribute("data-ready", ""));

    const resize = new ResizeObserver(place);
    resize.observe(scroller);
    return () => {
      window.cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [active]);

  return (
    <nav
      aria-label={label}
      data-project-subnav=""
      className="sticky top-[calc(var(--header-h)+1px)] z-[39] border-b border-line bg-paper"
    >
      <div className="wrap">
        <div ref={scrollerRef} className="relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="m-0 flex w-max min-w-full list-none gap-7 p-0 md:gap-9">
            {items.map((item) => {
              const current = item.id === active;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    data-subnav-id={item.id}
                    aria-current={current ? "location" : undefined}
                    className={cn(
                      "inline-flex min-h-12 items-center whitespace-nowrap text-[0.9375rem] transition-colors duration-300",
                      current ? "text-ink" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 block h-0.5 w-px origin-left bg-brick opacity-0 will-change-transform data-ready:transition-transform data-ready:duration-500 data-ready:ease-draft"
          />
        </div>
      </div>
    </nav>
  );
}
