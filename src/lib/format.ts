import type { Variant } from "./types";

/**
 * Prix en dinars entiers, milliers séparés par une espace fine insécable.
 * Les chiffres restent latins dans les trois langues : c'est ce qui se lit
 * sur les factures algériennes.
 */
export function da(amount: number, devise = "DA") {
  const n = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n} ${devise}`;
}

/**
 * Le prix de vente d'un format.
 *
 * La boutique ne vend plus qu'au détail. La colonne s'appelle encore
 * `price_demi_gros` pour une raison prosaïque : la renommer imposerait une
 * migration et un remplissage, avec le risque qu'un oubli affiche des produits
 * à zéro dinar. Le nom vit en base, jamais à l'écran — le back-office parle
 * simplement de « prix ».
 */
export function unitPrice(variant: Variant) {
  return variant.price_demi_gros;
}

export function lineTotal(variant: Variant, quantity: number) {
  return unitPrice(variant) * quantity;
}

/** LF-YYMMDD-XXXX — assez court pour se dicter au téléphone. */
export function orderRef(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LF-${stamp}-${suffix}`;
}

export function formatDate(iso: string, locale = "fr-DZ") {
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
  });
}
