"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePageTransition } from "@/components/transition";
import { Chip, LabButton, LabSection, Row } from "./lab-ui";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface LinkCase {
  label: string;
  expected: "curtain" | "native";
  render: () => React.ReactNode;
}

const CASES: LinkCase[] = [
  {
    label: "Internal link, next/link",
    expected: "curtain",
    render: () => <Link href="/motion-lab/page-a">Page A</Link>,
  },
  {
    label: "With data-transition-title",
    expected: "curtain",
    render: () => (
      <Link href="/motion-lab/page-b" data-transition-title="A custom title">
        Page B
      </Link>
    ),
  },
  { label: "Home, a real route", expected: "curtain", render: () => <Link href="/">Home</Link> },
  {
    label: "data-transition-ignore",
    expected: "native",
    render: () => (
      <Link href="/motion-lab/page-a" data-transition-ignore="">
        Page A (opted out)
      </Link>
    ),
  },
  { label: "Same page, #fragment", expected: "native", render: () => <a href="#cursor">Jump to cursor</a> },
  {
    label: "target=_blank",
    expected: "native",
    render: () => (
      <a href="/motion-lab/page-a" target="_blank" rel="noreferrer">
        Page A (new tab)
      </a>
    ),
  },
  {
    label: "Download",
    expected: "native",
    render: () => (
      <a href="/media/cover.webp" download="">
        Download an image
      </a>
    ),
  },
  { label: "Same-origin file", expected: "native", render: () => <a href="/media/cover.webp">Open an image file</a> },
  { label: "mailto:", expected: "native", render: () => <a href="mailto:test@example.invalid">Email link</a> },
  {
    label: "External site",
    expected: "native",
    render: () => (
      <a href="https://example.com/" rel="noreferrer">
        example.com
      </a>
    ),
  },
];

export function TransitionSection() {
  const transition = usePageTransition();
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const roundTrip = async () => {
    setBusy(true);
    await transition.cover("Round trip");
    await wait(700);
    // Left the lab in the meantime (the route change already released the curtain): do nothing more.
    if (!mounted.current) return;
    await transition.reveal();
    if (mounted.current) setBusy(false);
  };

  return (
    <LabSection
      id="transition"
      title="Page transition · boundaryCurtain"
      note={
        <>
          Tier A cuts the curtain from the township boundary: the old page shrinks away through the outline, the next
          page&apos;s title slides through, and a new window grows onto the destination. Tier B uses a sliding panel; Tier C
          and reduced motion get no curtain at all. Force a tier with <code>?tier=A</code>, <code>?tier=B</code> or{" "}
          <code>?tier=C</code>. Back and Forward never get a curtain; modifier clicks never do either.
        </>
      }
    >
      <Row>
        <LabButton disabled={busy} onClick={() => void transition.cover("Cover test")}>
          Cover
        </LabButton>
        <LabButton disabled={busy} onClick={() => void transition.reveal()}>
          Reveal
        </LabButton>
        <LabButton disabled={busy} onClick={() => void roundTrip()}>
          Cover, hold, reveal
        </LabButton>
        <Chip>{transition.enabled ? "link clicks: curtain on" : "link clicks: curtain off (Tier C or not ready)"}</Chip>
      </Row>

      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {CASES.map((item) => (
          <li key={item.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-2 text-sm">
            <span className="text-ink-muted">{item.label}</span>
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-sm underline underline-offset-4">{item.render()}</span>
              <Chip tone={item.expected === "curtain" ? "yes" : "neutral"}>{item.expected}</Chip>
            </span>
          </li>
        ))}
      </ul>
    </LabSection>
  );
}
