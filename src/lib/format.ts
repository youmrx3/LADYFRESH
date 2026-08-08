import type { PurchaseType, Variant } from "./types";

/** Prices are whole dinars; group thousands with a thin space. */
export function da(amount: number) {
  return `${Math.round(amount).toLocaleString("fr-DZ").replace(/ | /g, " ")} DA`;
}

export function unitPrice(variant: Variant, purchase: PurchaseType) {
  return purchase === "gros" ? variant.price_gros : variant.price_demi_gros;
}

/** Gros is priced and counted by carton; demi-gros by the piece. */
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

export function quantityUnit(purchase: PurchaseType, quantity: number) {
  if (purchase === "gros") return quantity > 1 ? "cartons" : "carton";
  return quantity > 1 ? "pièces" : "pièce";
}

export function purchaseLabel(purchase: PurchaseType) {
  return purchase === "gros" ? "Gros" : "Demi-gros";
}

/** LF-YYMMDD-XXXX — short enough to read out over the phone. */
export function orderRef(date = new Date()) {
  const stamp = date
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LF-${stamp}-${suffix}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
