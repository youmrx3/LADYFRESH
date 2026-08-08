export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Le français d'abord : c'est la langue de la marque et du marché. */
export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "lf_locale";

export const DIRECTION: Record<Locale, "ltr" | "rtl"> = {
  fr: "ltr",
  ar: "rtl",
  en: "ltr",
};

/** Étiquettes du sélecteur, chacune dans sa propre langue. */
export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  fr: "FR",
  ar: "ع",
  en: "EN",
};

/** Balise `lang` de l'élément html. */
export const HTML_LANG: Record<Locale, string> = {
  fr: "fr-DZ",
  ar: "ar-DZ",
  en: "en",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
