# Build Prompt: Parshwanaath Infra Website

> Paste everything below the line into your coding agent (Claude Code or similar). Fill every `[[PLACEHOLDER]]` first, or tell the agent to keep them visible on the page as "TBD" so nothing invented ships.

---

## Role and goal

You are a senior creative frontend engineer. Build the marketing website for **Parshwanaath Infra**, a real estate developer. The site must feel premium and cinematic, with very high motion design, while still loading fast on mid-range Android phones over 4G, because that is where most buyers will open it.

The flagship project shown on the site is **[[FLAGSHIP PROJECT NAME — e.g. Shivshiva Township]]**, a plotted / township development. Its content structure should follow the "Shivshiva Township" project from my earlier portfolio: masterplan-led storytelling, plots, amenities, location, and an enquiry flow.

## Non-negotiable: never lose the work

My previous portfolio was lost because it was never committed. Do not repeat that.

1. The repo is **[[GITHUB REPO URL]]**. Clone it, or `git init` and add it as `origin`, before writing any code.
2. Commit and push after every meaningful step (scaffold, each section, each animation system, each fix). Small commits, clear messages. Never end a session with uncommitted work.
3. Connect the repo to Vercel as soon as the scaffold builds, so every push gets a preview URL.
4. Keep a `README.md` with how to run, build, deploy, and where content lives.

## Stack

- Next.js (App Router, latest stable) + TypeScript
- Tailwind CSS
- Motion: **GSAP + ScrollTrigger** for scroll-driven timelines and pinned sections; **Framer Motion** for component-level enter/exit, hover and page transitions; **Lenis** for smooth scrolling (synced with ScrollTrigger)
- Optional 3D: React Three Fiber, only for the masterplan hero, and only if it stays within the performance budget below
- `next/image` for all images, `next/font` for fonts
- Deploy on Vercel

Do not mix two libraries animating the same element. GSAP owns scroll; Framer Motion owns component state.

## Content model

Put all copy, numbers and image paths in `content/` as typed TS or JSON files, not hard-coded in components, so I can edit facts without touching animation code. Use these placeholders until I supply real data, and render missing values visibly as "TBD" rather than making anything up:

| Field | Value |
|---|---|
| Company legal name | [[PARSHWANAATH INFRA LEGAL NAME]] |
| Tagline | [[TAGLINE]] |
| Years in business / projects delivered / sq ft delivered | [[STATS]] |
| Flagship project location (village, taluka, city) | [[LOCATION]] |
| Total land area | [[ACRES]] |
| Plot sizes and count | [[PLOT SIZES, e.g. 1,000 / 1,500 / 2,400 sq ft]] |
| Price range | [[PRICE OR "On request"]] |
| Amenities list | [[AMENITIES]] |
| Nearby landmarks with distances | [[LANDMARKS]] |
| RERA registration no. | [[RERA NUMBER]] |
| Approvals (NA, TP, etc.) | [[APPROVALS]] |
| Phone / WhatsApp / email / office address | [[CONTACT]] |
| Ongoing and past projects | [[PROJECT LIST]] |
| Masterplan, renders, site photos, logo | `public/media/` — [[I WILL ADD THESE]] |

The RERA number must appear on the project page and in the footer; it is a legal requirement for advertising registered projects in India.

## Pages

1. **Home**
2. **Projects** (index) and **Project detail** (one dynamic route, flagship first)
3. **About** (story, leadership, values, timeline)
4. **Contact / Site visit**
5. **Legal**: privacy policy, RERA disclaimer

## Section-by-section motion spec

### Global
- Preloader: logo mark draws itself (SVG stroke), counter 0→100 tied to real asset loading, then splits open into the hero. Max 2 seconds; skip on repeat visits (sessionStorage).
- Smooth scroll with Lenis, custom cursor on desktop only (grows over interactive elements, shows "View" / "Drag" labels).
- Page transitions: curtain wipe in brand colour, with the next page's title sliding through it.
- Minimal buttons: text links with an underline that draws on hover, magnetic pull on primary CTAs. No heavy filled buttons except the enquiry CTA.
- Headline reveals: split text by line and word (GSAP SplitText or a lightweight equivalent), masked slide-up with stagger.

### Home
1. **Hero**: full-bleed aerial video or image sequence of the township, slow Ken Burns zoom, headline reveal, a scroll cue. On scroll the hero scales down into a framed card (pinned).
2. **Brand statement**: large type where words fill with colour as you scroll (scrub).
3. **Numbers**: stats count up when they enter the viewport.
4. **Flagship masterplan (signature moment)**: pinned section. The masterplan image starts zoomed out, then the camera pans and zooms into zones as the user scrolls (entrance gate → roads → plots → clubhouse → green areas), with labelled hotspots fading in. Plot zones are SVG overlays that highlight on hover/tap, showing size and status (available / booked / TBD). Build this so I can drop in the real masterplan and redraw the SVG zones.
5. **Amenities**: horizontal scroll gallery driven by vertical scroll, each card with an icon that animates in and a parallax image.
6. **Location**: stylised map (SVG, not a live map embed in this section) with route lines drawing from the site to each landmark, distances counting up.
7. **Projects reel**: cards with clip-path reveal and image parallax inside the card; hover shows a quick-view.
8. **Testimonials**: slow auto-advancing marquee, pauses on hover.
9. **Enquiry CTA**: big statement, magnetic button, opens the enquiry drawer.

### Project detail
Hero with project name reveal, sticky sub-nav (Overview, Masterplan, Plots, Amenities, Location, Gallery, Brochure, Enquire) with an animated active indicator, interactive masterplan, plot table with filters, gallery lightbox with drag/swipe, brochure download gated by the enquiry form.

### About
Scroll-scrubbed timeline of milestones, leadership cards with image hover distortion (WebGL or CSS fallback), values in a stacking-cards section.

### Contact
Split layout: form on one side, office map embed (lazy-loaded on interaction) on the other. Floating WhatsApp button on every page.

## Enquiry flow

- Fields: name, phone (Indian format validation), email optional, project, budget range, preferred site-visit date.
- Submit to a Next.js route handler that sends an email via [[EMAIL SERVICE, e.g. Resend]] and/or appends to [[GOOGLE SHEET / CRM]]. Keep secrets in Vercel env vars, never in the repo.
- Success state is animated (checkmark draw) and offers "Chat on WhatsApp" as the next step.
- Basic spam protection (honeypot + rate limit).

## Performance and accessibility budget (these override motion when they conflict)

- Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
- LCP < 2.5s on simulated 4G; CLS < 0.1; no layout shift from animations (animate `transform` and `opacity` only).
- Hero video: compressed MP4/WebM under 3 MB with a poster image; serve a still image on slow connections (`navigator.connection.saveData` / effectiveType).
- Lazy-load and code-split heavy pieces (3D, lightbox, map). Kill ScrollTriggers and Lenis on route change to avoid leaks.
- **Respect `prefers-reduced-motion`**: disable smooth scroll, pinning and parallax, and fall back to simple fades. Every piece of content must be reachable without animation.
- Keyboard navigable, visible focus states, alt text on every image, colour contrast AA.
- Test at 360px width first, then tablet, then desktop. Pinned horizontal sections must become simple vertical stacks on small screens if they jank.

## SEO

Per-page metadata and Open Graph images, `RealEstateAgent` / `Residence` JSON-LD, sitemap and robots, semantic headings. Copy in English; structure i18n so [[HINDI / GUJARATI]] can be added later.

## Visual direction

- Mood: [[e.g. earthy luxury — warm sand, deep forest green, off-white, one gold accent]]. Define colours as CSS variables / Tailwind tokens.
- Type: a refined serif for display headlines, a clean sans for body.
- Generous whitespace, large imagery, restrained UI. Motion should feel slow and weighted (custom easing like `power3.out` / `expo.out`), never bouncy.
- Reference feel: [[ADD 2–3 REFERENCE SITES YOU LIKE]].

## Working order

1. Scaffold, push, connect Vercel.
2. Design tokens, fonts, layout shell, nav, footer, page transitions. Push.
3. Home sections one at a time, static first, then motion. Push after each.
4. Masterplan interaction. Push.
5. Project detail, About, Contact, enquiry API. Push after each.
6. Reduced-motion pass, mobile pass, Lighthouse pass, fix to budget. Push.
7. Final README and a short list of every `[[PLACEHOLDER]]` still unfilled.

Before each step, tell me what you are about to build; after each step, give me the Vercel preview link.
