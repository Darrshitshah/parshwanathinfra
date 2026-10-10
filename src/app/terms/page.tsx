/** Terms of use (draft for review by Parshwanath Infra). Owner: pages-lead. */
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { termsDoc } from "@/content/copy/legal";

export const metadata: Metadata = {
  title: termsDoc.title,
  description: termsDoc.metaDescription,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc={termsDoc} />;
}
