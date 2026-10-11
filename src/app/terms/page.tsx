/** Terms of use (draft for review by Parshwanath Infra). Owner: pages-lead. */
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata } from "@/components/seo/page-metadata";
import { termsDoc } from "@/content/copy/legal";

export const metadata: Metadata = pageMetadata({
  title: termsDoc.title,
  description: termsDoc.metaDescription,
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage doc={termsDoc} />;
}
