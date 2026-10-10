/**
 * Brand statement: one large paragraph of type. Words fill with colour as you scroll in Phase 2 (hook:
 * [data-reveal="words"] on the paragraph); statically it is simply the text, fully readable. Owner: pages-lead.
 */
import { homeCopy } from "@/content/copy/home";
import { Eyebrow } from "@/components/ui/Section";
import { rich } from "@/components/ui/with-tbd";

export function BrandStatement() {
  return (
    <section id="idea" aria-labelledby="idea-title" className="section-pad">
      <div className="wrap">
        <Eyebrow index="01">{homeCopy.idea.eyebrow}</Eyebrow>
        <h2
          id="idea-title"
          data-reveal="words"
          className="mt-10 max-w-[24ch] font-display text-[clamp(2.25rem,1.2rem+4.6vw,5.5rem)] font-normal leading-[1.02] tracking-[-0.02em] text-ink md:mt-14"
        >
          {rich(homeCopy.idea.text)}
        </h2>
      </div>
    </section>
  );
}
