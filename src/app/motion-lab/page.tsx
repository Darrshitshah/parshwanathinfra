import type { Metadata } from "next";
import { assertDevOnly } from "./dev-only";

// Dev-only review page for the motion system. Owner: motion-lead. 404 in production, never indexed.
export const metadata: Metadata = {
  title: "Motion lab",
  robots: { index: false, follow: false },
};

export default async function MotionLabPage() {
  assertDevOnly();
  const { MotionLab } = await import("./MotionLab");
  return <MotionLab />;
}
