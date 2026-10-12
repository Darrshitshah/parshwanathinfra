import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { DeviceTierProvider } from "@/lib/device-tier-provider";
import { MotionRoot } from "@/motion/MotionRoot";
import { shapeFromPlan } from "@/motion/township";
import { plan } from "@/content/plan";
import { siteOrigin } from "@/components/seo/site-origin";
import { SiteShell } from "@/components/shell/SiteShell";
import "./globals.css";

// Owner: Director. Pages set their own metadata; this is the default and the template.

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  preload: false,
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
    { media: "(prefers-color-scheme: light)", color: "#f3efe7" },
    { media: "(prefers-color-scheme: dark)", color: "#121413" },
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
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
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
