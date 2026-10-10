/** Disclaimer: artist's impression, indicative plans (draft for review by Parshwanath Infra). Owner: pages-lead. */
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { disclaimerDoc } from "@/content/copy/legal";

export const metadata: Metadata = {
  title: disclaimerDoc.title,
  description: disclaimerDoc.metaDescription,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return <LegalPage doc={disclaimerDoc} />;
}
