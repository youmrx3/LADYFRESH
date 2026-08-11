"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PIXEL_ID } from "@/lib/pixelAmorce";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Ce qui reste du pixel côté client, l'amorçage étant passé dans le <head>
 * (voir `pixelAmorce`) : le suivi des changements d'adresse, et le repli sans
 * JavaScript.
 *
 * Le site est une application à navigation interne. Le script ne se charge
 * qu'une fois et son `PageView` ne couvrirait que le premier écran : sans ce
 * renvoi, un passage de la vitrine vers /boutique ne compterait pas.
 *
 * Le back-office est exclu ici comme il l'est dans l'amorce.
 */
export function PixelMeta() {
  const pathname = usePathname();
  const premierRendu = useRef(true);

  const suivi = Boolean(PIXEL_ID) && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!suivi) return;
    // Le PageView initial part avec l'amorce du <head> ; on ne double pas.
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname, suivi]);

  if (!suivi) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
