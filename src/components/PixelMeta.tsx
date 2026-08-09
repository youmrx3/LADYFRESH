"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Pixel Meta.
 *
 * Deux détails qui ne vont pas de soi :
 *
 * — Le back-office est exclu. Suivre ses propres allées et venues fausse les
 *   audiences et envoie à Meta le rythme de travail de la maison ; ça n'a
 *   aucune valeur publicitaire.
 *
 * — Le site est une application à navigation interne : le script ne se charge
 *   qu'une fois et `PageView` ne partirait qu'au premier écran. On le renvoie
 *   donc à chaque changement d'adresse, sinon un passage de la vitrine vers
 *   /boutique ne compterait pas.
 */
export function PixelMeta() {
  /*
    L'identifiant est lu ici plutôt que passé en propriété : Next remplace les
    variables NEXT_PUBLIC_ à la compilation, donc rien ne transite par la
    charge serveur — l'admin ne reçoit même pas la chaîne.
  */
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
  const pathname = usePathname();
  const premierRendu = useRef(true);

  const suivi = Boolean(id) && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!suivi) return;
    // Le PageView initial part avec le script d'amorçage ; on ne double pas.
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname, suivi]);

  if (!suivi) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');
fbq('track','PageView');`}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
