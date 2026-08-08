import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ladyfresh.dz"),
  title: {
    default: "Lady Fresh — Brumes, gels intimes et déodorants",
    template: "%s · Lady Fresh",
  },
  description:
    "Sept gammes de brumes parfumées, gels lavants intimes et déodorants. Vente au détail, en demi-gros dès 5 pièces et en gros par carton. Commande par WhatsApp.",
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "Lady Fresh",
    title: "Lady Fresh — Brumes, gels intimes et déodorants",
    description:
      "Sept gammes. Une même fraîcheur. Détail, demi-gros dès 5 pièces, gros par carton.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jost.variable} ${instrument.variable} ${plexMono.variable}`}>
      <body>
        {/* Les blocs révélés au scroll partent à opacity 0 : sans JS, ils
            doivent rester lisibles. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
