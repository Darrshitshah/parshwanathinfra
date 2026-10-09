import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { DeviceTierProvider } from "@/lib/device-tier-provider";
import { MotionRoot } from "@/motion/MotionRoot";
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

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
};

// Sets data-theme before first paint so there is no flash. Reads a stored choice, else the system preference.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("pi-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;

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
          <MotionRoot>
            <SiteShell>{children}</SiteShell>
          </MotionRoot>
        </DeviceTierProvider>
      </body>
    </html>
  );
}
