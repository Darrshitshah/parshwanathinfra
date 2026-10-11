/** Disclaimer: artist's impression, indicative plans (draft for review by Parshwanath Infra). Owner: pages-lead. */
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata } from "@/components/seo/page-metadata";
import { disclaimerDoc } from "@/content/copy/legal";

export const metadata: Metadata = pageMetadata({
  title: disclaimerDoc.title,
  description: disclaimerDoc.metaDescription,
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return <LegalPage doc={disclaimerDoc} />;
}
