import "server-only";

import { headers } from "next/headers";
import { getSettings } from "@/lib/data";
import { getDictionary } from "./index";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * La langue est un réglage du site, pas une préférence de visiteur : elle se
 * choisit dans l'admin et vaut pour la vitrine comme pour le back-office.
 * C'est une marque algérienne qui s'adresse à un marché donné — laisser chaque
 * visiteur basculer n'apportait rien et dupliquait le réglage.
 *
 * La page de campagne fait exception. Le site de marque et la publicité ne
 * s'adressent pas au même monde : on peut vouloir la vitrine en français et
 * faire tourner une campagne en arabe, sans que l'un décide pour l'autre. Tant
 * que `locale_boutique` est vide, /boutique suit le site — c'est le
 * comportement d'avant, et celui qu'on veut par défaut.
 */

/** Nom de l'en-tête posé par le middleware ; voir `src/middleware.ts`. */
const EN_TETE_CHEMIN = "x-lf-chemin";

async function chemin(): Promise<string> {
  try {
    return (await headers()).get(EN_TETE_CHEMIN) ?? "";
  } catch {
    /*
      Rendu hors requête — une génération statique, un appel depuis un script.
      On retombe sur la langue du site plutôt que d'échouer : une page rendue
      dans la mauvaise langue vaut mieux qu'une page qui ne rend pas.
    */
    return "";
  }
}

async function getLocale(): Promise<Locale> {
  try {
    const reglages = await getSettings();
    const site = isLocale(reglages.locale) ? reglages.locale : DEFAULT_LOCALE;

    if ((await chemin()).startsWith("/boutique")) {
      const campagne = reglages.locale_boutique;
      if (isLocale(campagne)) return campagne;
    }
    return site;
  } catch {
    // Un réglage illisible ne doit pas empêcher la page de s'afficher.
    return DEFAULT_LOCALE;
  }
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
