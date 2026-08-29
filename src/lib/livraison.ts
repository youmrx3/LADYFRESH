import "server-only";

import { getSettings, getTarifs } from "./data";
import type { ModeLivraison } from "./types";

/**
 * Les frais de livraison, calculés côté serveur.
 *
 * Le navigateur envoie un mode — « stopdesk » ou « domicile » — et rien
 * d'autre. Le prix vient de la grille, jamais du formulaire : accepter un
 * montant posté depuis la console reviendrait à laisser choisir ses propres
 * frais de port, exactement comme un total de panier.
 *
 * Tant que l'interrupteur général est éteint, la fonction rend zéro sans rien
 * exiger : le site vend alors port compris, et le formulaire ne montre même pas
 * le choix.
 */

const MODES: ModeLivraison[] = ["stopdesk", "domicile"];

export function estMode(v: unknown): v is ModeLivraison {
  return typeof v === "string" && MODES.includes(v as ModeLivraison);
}

/**
 * Le code d'une wilaya, extrait de ce que le formulaire enregistre.
 *
 * La valeur stockée est « 16 — Alger » : le code y est en tête, et c'est lui
 * qui sert de clé dans la grille. Comparer les noms marcherait jusqu'au jour
 * où quelqu'un corrige un accent.
 */
export function codeWilaya(valeur: string) {
  return (valeur.trim().match(/^\d{1,2}/)?.[0] ?? "").padStart(2, "0");
}

export type Frais =
  | { ok: true; mode: string; prix: number }
  | { ok: false; raison: "mode" | "wilaya" };

export async function fraisLivraison(
  wilaya: string,
  mode: unknown,
): Promise<Frais> {
  const reglages = await getSettings();
  if (!reglages.livraison_active) return { ok: true, mode: "", prix: 0 };

  if (!estMode(mode)) return { ok: false, raison: "mode" };

  const code = codeWilaya(wilaya);
  const tarif = (await getTarifs()).find((t) => t.wilaya_code === code);
  if (!tarif || !tarif.active) return { ok: false, raison: "wilaya" };

  /*
    Un tarif à zéro est une réponse valable — « on livre là-bas sans frais » —
    et pas une wilaya oubliée : c'est `active` qui dit si l'on dessert.
  */
  const prix = mode === "stopdesk" ? Number(tarif.stopdesk) : Number(tarif.domicile);
  return { ok: true, mode, prix: Math.max(0, Math.round(prix)) };
}
