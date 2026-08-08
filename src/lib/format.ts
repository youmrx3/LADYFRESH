import type { PurchaseType, Variant } from "./types";

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

export function unitPrice(variant: Variant, purchase: PurchaseType) {
  return purchase === "gros" ? variant.price_gros : variant.price_demi_gros;
}

/** Le gros se compte en cartons, le demi-gros à la pièce. */
export function piecesFor(
  variant: Variant,
  purchase: PurchaseType,
  quantity: number,
) {
  return purchase === "gros" ? quantity * variant.units_per_carton : quantity;
}

export function lineTotal(
  variant: Variant,
  purchase: PurchaseType,
  quantity: number,
) {
  return unitPrice(variant, purchase) * piecesFor(variant, purchase, quantity);
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
