/** Privacy (draft for review by Parshwanath Infra). Owner: pages-lead. */
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata } from "@/components/seo/page-metadata";
import { privacyDoc } from "@/content/copy/legal";

export const metadata: Metadata = pageMetadata({
  title: privacyDoc.title,
  description: privacyDoc.metaDescription,
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage doc={privacyDoc} />;
}
