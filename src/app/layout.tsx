import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Jost, Noto_Kufi_Arabic } from "next/font/google";
import { PixelMeta } from "@/components/PixelMeta";
import { ReglagesProvider } from "@/components/Reglages";
import { PIXEL_ID, amorcePixel } from "@/lib/pixelAmorce";
import { DIRECTION, HTML_LANG } from "@/i18n/config";
import { getT } from "@/i18n/server";
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

/*
  Le kufi géométrique tient la même voix que Jost une fois passé en arabe.
  `preload: false` : sans lui, les visiteurs francophones et anglophones
  téléchargeaient une fonte arabe qu'aucun glyphe de leur page n'utilise. Le
  navigateur ne va la chercher que s'il rencontre de l'arabe à rendre.
*/
const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500"],
  variable: "--font-kufi",
  display: "swap",
  preload: false,
});

/*
  Jeton de vérification de domaine Meta.

  Il prouve que ce site nous appartient, ce qui débloque l'attribution des
  conversions et les publicités qui pointent vers ce domaine. Public par nature
  — il est destiné à être lu dans le HTML — donc pas de variable d'environnement
  à gérer pour lui.

  Il passe par `metadata` et non par une balise posée à la main : Meta refuse le
  jeton s'il arrive hors du `<head>` ou s'il est ajouté par du JavaScript. Next
  écrit celui-ci dans le HTML rendu côté serveur, ce qui satisfait les deux
  conditions.
*/
const META_DOMAINE = "k9vp5spgwc4626llyls8l51mfd201s";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    metadataBase: new URL("https://ladyfresh.dz"),
    title: { default: t.meta.title, template: "%s · Lady Fresh" },
    description: t.meta.description,
    verification: { other: { "facebook-domain-verification": META_DOMAINE } },
    openGraph: {
      type: "website",
      siteName: "Lady Fresh",
      title: t.meta.title,
      description: t.meta.description,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Applique le thème mémorisé avant le premier pixel, sinon la page clignote
 * en clair puis bascule en sombre.
 */
const SANS_CLIGNOTEMENT = `try{var t=localStorage.getItem("ladyfresh.theme");document.documentElement.dataset.theme=t==="sombre"?"sombre":"clair"}catch(e){document.documentElement.dataset.theme="clair"}`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getT();

  return (
    <html
      lang={HTML_LANG[locale]}
      dir={DIRECTION[locale]}
      data-theme="clair"
      data-locale={locale}
      className={`${jost.variable} ${instrument.variable} ${plexMono.variable} ${kufi.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SANS_CLIGNOTEMENT }} />
        {/* Meta Pixel — avant l'hydratation, voir `pixelAmorce`. */}
        {PIXEL_ID ? (
          <script dangerouslySetInnerHTML={{ __html: amorcePixel(PIXEL_ID) }} />
        ) : null}
      </head>
      <body>
        {/* Les blocs révélés au scroll partent à opacity 0 : sans JS, ils
            doivent rester lisibles. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <ReglagesProvider locale={locale}>{children}</ReglagesProvider>
        <PixelMeta />
      </body>
    </html>
  );
}
