import { Atkinson_Hyperlegible, Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";

// Families from tokens.css. Fraunces is loaded as a variable font with the opsz and SOFT axes the
// design uses ("opsz" 144 / "SOFT" 30–100), which the source's Google Fonts URL omitted.
export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--nf-fraunces",
  display: "swap",
});

export const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--nf-inter-tight",
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--nf-jetbrains",
  display: "swap",
});

// Reading-comfort option for the `dyslexia_font` preference (BR-PR-03). Not preloaded.
export const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--nf-atkinson",
  display: "swap",
  preload: false,
});

export const fontVariables = [fraunces.variable, interTight.variable, jetbrains.variable, atkinson.variable].join(" ");
