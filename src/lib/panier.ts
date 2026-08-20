import "server-only";

import { getPacks, getProducts } from "./data";
import { lineTotal, unitPrice } from "./format";
import type { OrderItem } from "./types";

/**
 * Le bon de commande, recalculé côté serveur.
 *
 * Le navigateur n'envoie que des identifiants et des quantités. Les prix, les
 * libellés et les totaux sont repris de la base : c'est la seule façon qu'une
 * commande vaille ce qu'elle prétend valoir. Un total posté depuis la console
 * n'a aucun effet ici.
 *
 * Partagé entre la commande et la piste de rappel, pour que les deux racontent
 * exactement la même chose — une liste d'appels bâtie sur d'autres prix que la
 * boutique serait pire qu'aucune liste.
 */

export const MAX_LIGNES = 60;
export const MAX_QUANTITE = 10_000;

export type LigneDemandee = { kind?: string; id?: string; quantity?: number };

export type Panier = {
  items: OrderItem[];
  total: number;
  /** Nombre d'articles, coffrets et pièces confondus. */
  articles: number;
};

/**
 * Traduit les lignes demandées en lignes de commande.
 *
 * Une ligne inconnue est ignorée plutôt que refusée : un coffret retiré du
 * catalogue pendant qu'une cliente remplissait son bon ne doit pas faire échouer
 * le reste de sa commande. Un panier entièrement inconnu, lui, ressort vide et
 * l'appelant tranche.
 */
export async function composer(
  demandees: LigneDemandee[],
  minProduit: number,
): Promise<{ panier: Panier; sousMinimum: boolean }> {
  const [products, packs] = await Promise.all([getProducts(), getPacks()]);

  const variantes = new Map(
    products.flatMap((p) =>
      p.variants.map((v) => [v.id, { produit: p, variante: v }] as const),
    ),
  );
  const coffrets = new Map(packs.map((p) => [p.id, p]));

  const items: OrderItem[] = [];
  let sousMinimum = false;

  for (const ligne of demandees.slice(0, MAX_LIGNES)) {
    const quantity = Math.floor(Number(ligne.quantity));
    const id = typeof ligne.id === "string" ? ligne.id : "";
    if (!id || !Number.isFinite(quantity)) continue;
    if (quantity <= 0 || quantity > MAX_QUANTITE) continue;

    if (ligne.kind === "pack") {
      const pack = coffrets.get(id);
      if (!pack) continue;
      items.push({
        id: "",
        order_id: "",
        /* Un coffret n'est pas un format. La colonne attend une chaîne ; la
           conversion en NULL se fait à l'écriture, où l'identifiant est validé. */
        variant_id: "",
        product_name: pack.name,
        gamme_name: "",
        size_label: pack.tagline || "Coffret",
        unit_price: pack.price,
        quantity,
        units_per_carton: 1,
        line_total: pack.price * quantity,
      });
      continue;
    }

    const entree = variantes.get(id);
    if (!entree) continue;
    const { produit, variante } = entree;
    // Le minimum ne vaut que pour l'unité : un coffret s'achète par un.
    if (quantity < minProduit) sousMinimum = true;
    items.push({
      id: "",
      order_id: "",
      variant_id: variante.id,
      product_name: produit.name || produit.slug,
      gamme_name: "",
      size_label: variante.size_label,
      unit_price: unitPrice(variante),
      quantity,
      units_per_carton: variante.units_per_carton,
      line_total: lineTotal(variante, quantity),
    });
  }

  return {
    panier: {
      items,
      total: items.reduce((s, i) => s + i.line_total, 0),
      articles: items.reduce((s, i) => s + i.quantity, 0),
    },
    sousMinimum,
  };
}
