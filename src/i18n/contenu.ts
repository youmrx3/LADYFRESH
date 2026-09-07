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

/**
 * La traduction seule, sans repli — pour les formulaires du back-office.
 *
 * `champ()` retombe sur le français quand la traduction manque, ce qui est
 * juste sur la vitrine et faux dans un formulaire : l'onglet « Arabe » arrivait
 * prérempli de français, on ne pouvait plus distinguer « pas encore traduit »
 * de « traduit », et le moindre enregistrement recopiait le français dans la
 * colonne arabe. Une fois cela fait, le repli ne joue plus jamais : la page en
 * arabe affiche du français pour toujours, et rien ne le signale.
 *
 * Ici, vide veut dire vide. Le texte français se met en indication de saisie,
 * là où il renseigne sans jamais s'enregistrer.
 */
export function traduction<T extends Record<string, unknown>>(
  row: T | undefined | null,
  base: Extract<keyof T, string>,
  locale: Locale,
): string {
  if (!row) return "";
  const cle = (locale === "fr" ? base : `${base}_${locale}`) as keyof T;
  const v = row[cle];
  return typeof v === "string" ? v : "";
}

/** Nom du colonne d'une langue donnée : `description` ou `description_ar`. */
export function colonne(base: string, locale: Locale) {
  return locale === "fr" ? base : `${base}_${locale}`;
}

function typeOf(product: Product, types: ProductType[]) {
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


/**
 * Le contenu d'un coffret, dit dans la langue de la page.
 *
 * Les lignes d'un coffret portent un libellé figé au moment où on l'a composé,
 * en français : « Brume Brume parfumée ARA — 150 ml ». Sur une page arabe,
 * c'était le dernier bloc à rester en français — et sur la page qui vend.
 *
 * Il se reconstruit pourtant sans rien ajouter en base. Le nom d'un produit
 * est « <type français> <gamme> », et le type est traduit : en retirant le
 * type du nom, il reste la gamme — « ARA », « Sensuel » — un nom propre qui
 * s'écrit pareil dans les trois langues. Au passage, la redondance disparaît
 * aussi en français.
 *
 * Un format supprimé du catalogue n'a plus rien à reconstruire : son libellé
 * figé reste, ce qui vaut mieux qu'une ligne vide.
 */
export function libellePackItem(
  item: { variant_id: string | null; label: string },
  produits: Product[],
  types: ProductType[],
  locale: Locale,
): string {
  if (!item.variant_id) return item.label;

  const produit = produits.find((p) =>
    p.variants.some((v) => v.id === item.variant_id),
  );
  if (!produit) return item.label;

  const type = types.find((t) => t.id === produit.type_id);
  const variante = produit.variants.find((v) => v.id === item.variant_id);

  const typeFr = champ(type, "name", "fr");
  const gamme = (typeFr ? produit.name.replace(typeFr, "") : produit.name).trim();
  const court = nomTypeCourt(type, locale);

  return [court, gamme || produit.name, variante?.size_label && `— ${variante.size_label}`]
    .filter(Boolean)
    .join(" ");
}
