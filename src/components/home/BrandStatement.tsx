/**
 * Brand statement: one large statement of type on ivory. Words fill with colour as you scroll in Phase 2 (hook:
 * [data-reveal="words"] on the heading); statically it is simply the text, fully readable. Owner: pages-lead.
 */
import { homeCopy } from "@/content/copy/home";
import { Eyebrow } from "@/components/ui/Section";
import { rich } from "@/components/ui/with-tbd";

export function BrandStatement() {
  return (
    <section id="idea" aria-labelledby="idea-title" className="tone-paper sheet">
      <div className="wrap flex flex-col items-center text-center">
        <Eyebrow index="01" className="justify-center">
          {homeCopy.idea.eyebrow}
        </Eyebrow>
        <h2
          id="idea-title"
          data-reveal="words"
          className="t-display-3 mt-10 max-w-[26ch] text-[clamp(2rem,1.1rem+3.7vw,4.5rem)] leading-[1.06] text-ink md:mt-14"
        >
          {rich(homeCopy.idea.text, { keepPhrases: false })}
        </h2>
      </div>
    </section>
  );
}
