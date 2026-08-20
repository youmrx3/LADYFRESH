"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { BasculeTheme } from "./Bascules";
import { useBoutique } from "./BoutiqueProvider";
import { useReglages } from "./Reglages";

/**
 * En-tête de la page campagne. Volontairement plus maigre que la barre du
 * site : pas d'ancres vers des sections qui n'existent pas ici, juste la
 * marque, le total en cours et le bouton de commande.
 */
export function EnteteBoutique({ campagne }: { campagne: string }) {
  const { nombreArticles } = useBoutique();
  const { t } = useReglages();

  /*
    L'étiquette de campagne est rangée pour la durée de la visite. Le client
    arrive par une publicité, il peut passer par la vitrine avant de commander
    — l'attribution doit tenir jusqu'à l'envoi.
  */
  useEffect(() => {
    if (!campagne) return;
    try {
      sessionStorage.setItem("ladyfresh.campagne", campagne);
    } catch {
      // Mode privé : on perd l'attribution, pas la commande.
    }
  }, [campagne]);


  return (
    <header
      className="etage-vitrine sticky top-0 z-40 border-b"
      style={{ borderColor: "var(--nav-line)" }}
    >
      <div className="shell flex h-[64px] items-center gap-3">
        <Link href="/" aria-label={t.nav.accueilAria} className="shrink-0">
          <Image
            src="/brand/ladyfresh-wordmark-black.webp"
            alt="Lady Fresh"
            width={520}
            height={110}
            priority
            className="dark-hidden h-[18px] w-auto sm:h-[20px]"
          />
          <Image
            src="/brand/ladyfresh-wordmark-white.webp"
            alt="Lady Fresh"
            width={520}
            height={110}
            priority
            className="clair-hidden h-[18px] w-auto sm:h-[20px]"
          />
        </Link>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <BasculeTheme compact />
          <a href="#commande" className="btn btn-or !px-4 !py-2.5 !text-[11.5px]">
            {t.nav.cta}
            {nombreArticles > 0 && (
              <span
                className="data rounded-full px-1.5 py-0.5 text-[10.5px]"
                style={{ background: "var(--or-fg)", color: "var(--or-plein)" }}
              >
                {nombreArticles}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
}
