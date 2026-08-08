import type { Locale } from "./config";
import type { Gamme, Product, ProductType } from "@/lib/types";

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

/** Nom du colonne d'une langue donnée : `description` ou `description_ar`. */
export function colonne(base: string, locale: Locale) {
  return locale === "fr" ? base : `${base}_${locale}`;
}

export function typeOf(product: Product, types: ProductType[]) {
  return types.find((t) => t.id === product.type_id);
}

/** Libellé long d'un type, dans la langue courante. */
export function nomType(
  product: Product,
  types: ProductType[],
  locale: Locale,
) {
  return champ(typeOf(product, types), "name", locale);
}

/** Libellé court, pour les filtres et les listes serrées. */
export function nomTypeCourt(type: ProductType | undefined, locale: Locale) {
  return champ(type, "short_name", locale) || champ(type, "name", locale);
}

/** Nom complet d'une référence : « Brume parfumée Sensuel ». */
export function nomProduit(
  product: Product,
  types: ProductType[],
  gammes: Gamme[],
  locale: Locale,
) {
  const gamme = gammes.find((g) => g.id === product.gamme_id);
  return `${nomType(product, types, locale)} ${gamme?.name ?? ""}`.trim();
}
