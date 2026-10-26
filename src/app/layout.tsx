import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { PREF_COOKIE } from "@/lib/display-prefs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "harystyles — letters, not posts", template: "%s · harystyles" },
  description:
    "A quiet, patron-supported place for long-form letters. Five letters an evening, found by mood, read by lamplight.",
  applicationName: "harystyles",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16141f" },
    { media: "(prefers-color-scheme: light)", color: "#f6f1e9" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies display preferences from the `hs_pref` cookie before first paint (docs/02 §2.11: no theme
 * flash). The cookie holds display settings only — never identity. Values are whitelisted.
 * Also records the browser time zone (`hs_tz`) so anonymous Tonight uses local evening (BR-RA-10).
 */
const noFlash = `(function(){try{var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;if(tz&&document.cookie.indexOf("hs_tz="+tz)<0)document.cookie="hs_tz="+tz+";path=/;max-age=31536000;samesite=lax";}catch(e){}try{var m=document.cookie.match(/(?:^|; )${PREF_COOKIE}=([^;]*)/);if(!m)return;var p=JSON.parse(decodeURIComponent(m[1]));var d=document.documentElement;var ok={theme:["system","ink","dusk","paper"],typePair:["serif_sans","serif_mono","all_serif"],readingSize:["s","m","l"]};if(ok.theme.indexOf(p.theme)>-1)d.setAttribute("data-theme",p.theme);if(ok.typePair.indexOf(p.typePair)>-1)d.setAttribute("data-type-pair",p.typePair);if(ok.readingSize.indexOf(p.readingSize)>-1)d.setAttribute("data-reading-size",p.readingSize);if(p.dyslexia===true)d.setAttribute("data-dyslexia","true");}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="ink" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-bg-elevated focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
