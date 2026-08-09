import "server-only";

import { getSettings } from "@/lib/data";
import { getDictionary } from "./index";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * La langue est un réglage du site, pas une préférence de visiteur : elle se
 * choisit dans l'admin et vaut pour la vitrine comme pour le back-office.
 * C'est une marque algérienne qui s'adresse à un marché donné — laisser
 * chaque visiteur basculer n'apportait rien et dupliquait le réglage.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const settings = await getSettings();
    return isLocale(settings.locale) ? settings.locale : DEFAULT_LOCALE;
  } catch {
    // Un réglage illisible ne doit pas empêcher la page de s'afficher.
    return DEFAULT_LOCALE;
  }
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
