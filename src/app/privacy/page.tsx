/** Privacy (draft for review by Parshwanath Infra). Owner: pages-lead. */
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { privacyDoc } from "@/content/copy/legal";

export const metadata: Metadata = {
  title: privacyDoc.title,
  description: privacyDoc.metaDescription,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc={privacyDoc} />;
}
