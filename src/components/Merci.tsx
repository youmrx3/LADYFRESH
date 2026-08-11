"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useReglages } from "./Reglages";
import { pixelDesQuePret } from "@/lib/pixel";
import type { SiteSettings } from "@/lib/types";

/**
 * Page de remerciement.
 *
 * Deux raisons de la préférer à l'écran de confirmation rendu sur place :
 *
 * — Purchase part sur un chargement de page distinct, et non dans les
 *   dernières millisecondes avant que l'onglet ne file sur WhatsApp. Plus
 *   aucune course entre l'envoi de l'événement et la navigation.
 *
 * — Elle donne une adresse. Une conversion personnalisée se crée alors sur
 *   « l'URL contient /merci », sans l'outil de configuration de Meta et sans
 *   rien ouvrir dans les en-têtes de sécurité.
 *
 * La charge de l'événement passe par sessionStorage et non par l'adresse : un
 * montant dans l'URL se réécrit à la main depuis la barre du navigateur, et
 * Meta apprendrait sur des chiffres inventés.
 */

/** Clé de la remise déposée par le bon de commande avant de venir ici. */
export const CLE_MERCI = "ladyfresh.merci";

export type ChargeMerci = {
  ref: string;
  canal: "whatsapp" | "formulaire";
  whatsappUrl?: string;
  /** Les paramètres du Purchase, calculés côté serveur. */
  achat: Record<string, unknown>;
};

export function Merci({ settings }: { settings: SiteSettings }) {
  const { t } = useReglages();
  const router = useRouter();
  const [charge, setCharge] = useState<ChargeMerci | null>(null);
  const [lu, setLu] = useState(false);

  useEffect(() => {
    let brut: string | null = null;
    try {
      brut = sessionStorage.getItem(CLE_MERCI);
      /*
        Retirée avant d'émettre, pas après : un rafraîchissement de la page
        compterait sinon une deuxième vente, et Meta optimiserait sur un
        chiffre d'affaires qui double à chaque F5.
      */
      sessionStorage.removeItem(CLE_MERCI);
    } catch {
      // Navigation privée : rien à reprendre, la page reste lisible.
    }

    if (brut) {
      try {
        const reprise = JSON.parse(brut) as ChargeMerci;
        setCharge(reprise);
        pixelDesQuePret("Purchase", reprise.achat);
      } catch {
        // Charge illisible : on n'invente pas un achat.
      }
    }
    setLu(true);
  }, []);

  /*
    Arrivée directe, sans commande derrière — un lien partagé, un signet, un
    retour arrière après coup. Rien à confirmer et surtout aucun Purchase à
    émettre : on renvoie à la boutique.
  */
  useEffect(() => {
    if (lu && !charge) router.replace("/boutique");
  }, [lu, charge, router]);

  if (!lu || !charge) return null;

  return (
    <>
      <main className="etage-comptoir saut-ancre py-20">
        <div className="shell max-w-[38rem] text-center">
          <p className="eyebrow text-graphite-doux">{t.commande.okEyebrow}</p>
          <h2 className="display display-l mt-4">
            {t.commande.okTitre}{" "}
            <span className="data text-[0.68em]">{charge.ref}</span>
          </h2>
          <p className="lede mt-4 text-graphite-doux">
            {charge.canal === "whatsapp"
              ? t.commande.okWhatsapp
              : t.commande.okForm}
          </p>

          {/*
            Filet pour l'onglet bloqué. La commande est déjà enregistrée et
            l'événement déjà parti : ce bouton ne sert qu'à retrouver la
            conversation WhatsApp, il ne rejoue rien.
          */}
          {charge.whatsappUrl && (
            <a
              href={charge.whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-or mt-8 inline-flex"
            >
              {t.commande.whatsapp}
            </a>
          )}

          <div className="mt-6">
            <Link href="/boutique" className="btn btn-encre">
              {t.commande.okCta}
            </Link>
          </div>
        </div>
      </main>

      <footer className="etage-vitrine border-t border-encre-bord py-10">
        <div className="shell flex flex-wrap items-center justify-between gap-4">
          <p className="data text-[12px] text-craie">
            © {new Date().getFullYear()} Lady Fresh — {t.footer.droits}
          </p>
          <a
            href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
            dir="ltr"
            className="data text-[13px] text-craie transition-colors hover:text-or"
          >
            {settings.contact_phone}
          </a>
        </div>
      </footer>
    </>
  );
}
