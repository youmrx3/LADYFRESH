"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useReglages } from "./Reglages";
import { getDictionary } from "@/i18n";
import { DIRECTION, HTML_LANG, isLocale, type Locale } from "@/i18n/config";
import { pixelDesQuePret } from "@/lib/pixel";

/**
 * Page de remerciement.
 *
 * Deux raisons de la préférer à l'écran de confirmation rendu sur place :
 *
 * — Purchase part sur un chargement de page distinct : plus aucune course
 *   entre l'envoi de l'événement et la navigation.
 *
 * — Elle donne une adresse. Une conversion personnalisée se crée alors sur
 *   « l'URL contient /merci », sans l'outil de configuration de Meta et sans
 *   rien ouvrir dans les en-têtes de sécurité.
 *
 * La charge de l'événement passe par sessionStorage et non par l'adresse : un
 * montant dans l'URL se réécrit à la main depuis la barre du navigateur, et
 * Meta apprendrait sur des chiffres inventés.
 *
 * Une seule sortie, volontairement : repasser une commande. Tout ce qui
 * disperse ici éloigne de la seule action qui compte encore.
 */

/** Clé de la remise déposée par le bon de commande avant de venir ici. */
export const CLE_MERCI = "ladyfresh.merci";

export type ChargeMerci = {
  ref: string;
  /** Les paramètres du Purchase, calculés côté serveur. */
  achat: Record<string, unknown>;
  /**
   * La langue dans laquelle la cliente venait de remplir son bon.
   *
   * La page de campagne peut parler une autre langue que le site de marque —
   * c'est tout l'objet de `locale_boutique`. Or l'exception ne portait que sur
   * `/boutique`, et le tunnel se termine ici : on lisait sa publicité en arabe,
   * on remplissait son bon en arabe, et la confirmation — le dernier écran,
   * celui qui dit que la commande est bien passée — s'affichait en français.
   *
   * Elle voyage dans la charge plutôt que dans l'adresse : une langue en
   * paramètre d'URL ferait une seconde source de vérité, alors que le site n'en
   * a qu'une et s'en porte bien.
   */
  locale?: Locale;
};

export function Merci() {
  const reglages = useReglages();
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

  /*
    La langue de la charge gagne. Une charge d'avant ce changement n'en porte
    pas : on retombe alors sur celle du site, qui était le comportement
    précédent. `dir` et `lang` sont posés ici et non sur `<html>` — la mise en
    page racine ne connaît pas la commande qui vient d'être passée.
  */
  const locale: Locale = isLocale(charge.locale) ? charge.locale : reglages.locale;
  const t = getDictionary(locale);

  return (
    <main
      className="etage-comptoir saut-ancre py-20"
      lang={HTML_LANG[locale]}
      dir={DIRECTION[locale]}
    >
      <div className="shell max-w-[38rem] text-center">
        <p className="eyebrow text-graphite-doux">{t.commande.okEyebrow}</p>
        <h2 className="display display-l mt-4">
          {t.commande.okTitre}{" "}
          <span className="data text-[0.68em]">{charge.ref}</span>
        </h2>
        <p className="lede mt-4 text-graphite-doux">{t.commande.okForm}</p>

        <Link href="/boutique" className="btn btn-encre mt-8">
          {t.commande.okCta}
        </Link>
      </div>
    </main>
  );
}
