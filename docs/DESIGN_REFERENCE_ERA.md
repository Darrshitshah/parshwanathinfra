# Design reference: ERA Residence (era-residence.com), analysed 2026-10-13

Darshit's reference for the new Shiv Shiva look. Analysed in a real browser (computed styles, loaded fonts, network,
screenshots at 1440 and 390). We take its design LANGUAGE, never its assets, text, logo or exact layouts.

## What it is built with
Webflow + GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) + Lenis + Barba (page transitions) + Lottie; decorative
transparent WebM videos (bougainvillea flowers drifting over sections); 16 elements with backdrop-filter (subtle glass,
not the main language).

## Typography (the core of the luxury feel)
- Display: **Ambroise Francois** (Typekit, paid), a condensed, high-contrast didone-style serif, ALWAYS UPPERCASE,
  huge (h1 172 px at 1440 w, line-height 0.87, letter-spacing -2.4 %); section statements 36 to 57 px uppercase.
- Accent: **Sloop Script** (Typekit, paid), a flowing script used for ONE word next to the wordmark ("Estepona") and in
  a few headlines ("The coast you wanted *yours* this year"). It overlaps the serif.
- Text: **Maison Neue Extended** (paid), a wide/extended grotesk at small sizes: body 11.7 to 14.4 px; labels 9.9 px
  bold uppercase, +4.8 % tracking.
- Contrast is the trick: giant condensed uppercase serif vs tiny extended sans; generous air around both.

## Colour (colour-blocking, not lines)
Navy ink `#17233B` (text and dark sections) · ivory `#F3F3EC` (main background) · aubergine/plum `#340C24` (loader and
feature sections) · powder sky blue `#B5CEDB` (calm band) · white. Whole sections switch background colour as you
scroll; imagery is full-bleed; very few rules or borders.

## Layout motifs
Full-bleed hero photo with the centred uppercase wordmark; images inside **tall arches** (border-radius 50 % top only);
round **seal/badge** logo with rotating text; **circular CTA** buttons; oversized words cropped by the viewport edge
("ARCHITECTURE"); a hand-drawn route line with distances for location; quote blocks over images; very low text
density, lots of whitespace; small fixed nav top right ("Select an apartment", "Book a call", "Contact").

## Motion
Loader: full-screen plum, logo seal, wordmark, a thin progress line, then a wipe. Lenis smooth scroll; split-text line
reveals; parallax; sections wipe colour; floral video overlays drift.

## How it translates to Shiv Shiva (not a copy)
- A condensed high-contrast UPPERCASE serif for the wordmark and statements (free Google Fonts equivalent), a script
  accent for one word ("Township" or "Vapi"), a wide/extended clean sans for text and tiny tracked labels.
- An Indian, place-rooted palette in the same spirit: deep ink (forest/olive or navy) + ivory + a rich jewel tone for
  feature sections and the page curtain (deep maroon/aubergine pairs with the red curtain Darshit loves) + one soft
  calm band colour (sky or sand).
- Colour-blocked full-bleed sections, arch-framed renders (echoes Indian arches), a round Shiv Shiva seal, circular
  CTAs, oversized cropped words, glass only where it helps (nav, cards, drawer).
- Optional later: a drifting floral overlay (marigold or bougainvillea, generated, transparent) on 1 or 2 sections.
