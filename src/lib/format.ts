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

/**
 * Le total d'une ligne, en dinars entiers.
 *
 * `da()` arrondit chaque montant qu'elle affiche, indépendamment. Les colonnes
 * étant `numeric(10,2)`, un prix à centimes faisait diverger l'écran de
 * lui-même : deux coffrets à 1 250,50 s'affichaient « 1 251 » l'unité et
 * « 2 501 » la ligne, et deux fois 1 251 ne font pas 2 501. Le récapitulatif se
 * contredisait, puis la commande, l'email et l'export du transporteur
 * annonçaient trois montants légèrement différents.
 *
 * On arrondit donc au même endroit que l'affichage, et une seule fois. Les prix
 * sont par ailleurs arrondis à la saisie : le dinar ne se manipule pas en
 * centimes au comptoir.
 */
export function lineTotal(variant: Variant, quantity: number) {
  return Math.round(unitPrice(variant) * quantity);
}

/**
 * LF-YYMMDD-XXXXXX — assez court pour se dicter au téléphone.
 *
 * Le suffixe faisait quatre caractères, soit 1 679 616 valeurs, tirées à
 * nouveau chaque jour puisque la date en fait partie. Par le paradoxe des
 * anniversaires, à trois cents commandes par jour une collision survenait dans
 * la journée environ une fois sur trente-sept — et `ref` étant `unique`,
 * l'insertion était rejetée, la commande perdue sur un message d'échec
 * générique.
 *
 * Six caractières portent l'espace à 2,18 milliards : le risque est divisé par
 * environ treize cents. `createOrder` réessaie par-dessus, ce qui referme le
 * cas résiduel.
 */
export function orderRef(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "");
  // `toString(36)` peut rendre une chaîne courte quand le tirage est petit :
  // on complète, pour que la référence ait toujours la même forme.
  const suffix = (Math.random().toString(36).slice(2) + "000000")
    .slice(0, 6)
    .toUpperCase();
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
