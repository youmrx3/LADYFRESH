import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";
import { fr, type Dictionary } from "./dictionaries/fr";
import { DEFAULT_LOCALE, type Locale } from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Remplace les jetons `{clé}` d'une chaîne traduite. */
export function fill(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

export type { Dictionary };
export * from "./config";
