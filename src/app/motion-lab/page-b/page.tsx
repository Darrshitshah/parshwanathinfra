import Link from "next/link";
import type { Metadata } from "next";
import { assertDevOnly } from "../dev-only";

// Destination for the page-transition demo. Owner: motion-lead. Dev only.
export const metadata: Metadata = { title: "Motion lab, page B", robots: { index: false, follow: false } };

export default function PageB() {
  assertDevOnly();
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-(--gutter) py-16">
      <h1 className="font-display text-6xl text-ink">Page B</h1>
      <p className="max-w-(--measure) text-ink-muted">A second page, so the curtain has somewhere to go and come back from.</p>
      <p className="font-mono text-sm">
        <Link href="/motion-lab">Motion lab</Link> · <Link href="/motion-lab/page-a">Page A</Link>
      </p>
    </div>
  );
}
