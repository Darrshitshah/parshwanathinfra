import type { Metadata, Viewport } from "next";
import { Pinyon_Script, Zalando_Sans_Expanded } from "next/font/google";
import localFont from "next/font/local";
import { DeviceTierProvider } from "@/lib/device-tier-provider";
import { MotionRoot } from "@/motion/MotionRoot";
import { shapeFromPlan } from "@/motion/township";
import { plan } from "@/content/plan";
import { siteOrigin } from "@/components/seo/site-origin";
import { SiteShell } from "@/components/shell/SiteShell";
import "./globals.css";

// Owner: Director. Pages set their own metadata; this is the default and the template.

// Display: Playfair (Google Fonts, SIL OFL) cut once at its condensed width (wdth 87.5) and weight 500, optical size left
// variable so hairlines stay fine at wordmark sizes and sturdy in small headings. One 58 KB file instead of the 183 KB
// three-axis variable font. "block", not "swap": the wordmark is never the LCP element, and swapping it caused a layout shift.
const display = localFont({
  src: "./fonts/playfair-condensed-500.woff2",
  weight: "500",
  style: "normal",
  display: "block",
  variable: "--font-playfair",
});

// Script accent: one word per headline. "block" too, so the accent never reflows the line it sits on.
const script = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  display: "block",
  variable: "--font-pinyon",
});

// Text and tiny tracked labels: an extended grotesk. Two weights only (400 text, 600 labels and buttons).
const sans = Zalando_Sans_Expanded({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zalando",
});

// Computed on the server so the page curtain is cut from the real boundary without shipping plan.json.
const TOWNSHIP_SHAPE = shapeFromPlan(plan);

const SITE_ORIGIN = siteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Parshwanath Infra · Shiv Shiva Township, Vapi-Silvassa Road",
    template: "%s · Parshwanath Infra",
  },
  description:
    "Shiv Shiva Township by Parshwanath Infra: an integrated township of flats, row houses and shops on the Vapi-Silvassa Road.",
  applicationName: "Parshwanath Infra",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efe2" },
    { media: "(prefers-color-scheme: dark)", color: "#120e0a" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

// Runs before first paint: sets data-theme (stored choice, else system preference) and marks html with
// data-js="1" and, after the S1 loader has played once this session, data-loader="seen" so CSS hides it.
const THEME_SCRIPT = `(function(){var d=document.documentElement;d.dataset.js="1";try{var t=localStorage.getItem("pi-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t}catch(e){}try{if(sessionStorage.getItem("pi-loader-seen")==="1")d.dataset.loader="seen"}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${display.variable} ${script.variable} ${sans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <DeviceTierProvider>
          <MotionRoot shape={TOWNSHIP_SHAPE}>
            <SiteShell>{children}</SiteShell>
          </MotionRoot>
        </DeviceTierProvider>
      </body>
    </html>
  );
}
