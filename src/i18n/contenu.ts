import type { Locale } from "./config";

/**
 * Les textes du catalogue vivent en base avec une colonne par langue :
 * `description`, `description_ar`, `description_en`. Quand la traduction
 * manque, on retombe sur le français — mieux vaut du texte dans la mauvaise
 * langue qu'un trou dans la page.
 */
export function champ<T extends Record<string, unknown>>(
  row: T | undefined | null,
  base: Extract<keyof T, string>,
  locale: Locale,
): string {
  if (!row) return "";
  if (locale !== "fr") {
    const traduit = row[`${base}_${locale}` as keyof T];
    if (typeof traduit === "string" && traduit.trim()) return traduit;
  }
  const fr = row[base];
  return typeof fr === "string" ? fr : "";
}
