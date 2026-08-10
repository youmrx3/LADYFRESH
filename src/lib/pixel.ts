/**
 * Événements Meta.
 *
 * Le pixel ne comptait que les pages vues. Une campagne a besoin d'autre
 * chose : sans événement de conversion, Meta ne sait pas distinguer une visite
 * qui finit en commande d'une visite qui repart, et l'optimisation n'a rien à
 * optimiser — on paie pour du trafic, pas pour des clients.
 *
 * Trois jalons, dans l'ordre de l'entonnoir : AddToCart quand un article entre
 * au bon de commande, InitiateCheckout quand l'envoi démarre, Lead quand la
 * commande est enregistrée.
 *
 * Lead et non Purchase : rien n'est payé sur le site. La commande part sur
 * WhatsApp et se confirme à la main, parfois pas du tout. Déclarer un achat
 * ici gonflerait le chiffre d'affaires vu par Meta d'un montant qui n'a pas
 * été encaissé, et l'optimisation viserait un objectif imaginaire. La valeur
 * accompagne quand même l'événement : Meta sait optimiser un Lead à la valeur.
 */

/** Le dinar algérien. Meta refuse un montant sans devise. */
export const DEVISE_PIXEL = "DZD";

type Params = Record<string, unknown>;

/**
 * Envoie un événement standard, sans jamais gêner le parcours.
 *
 * Le pixel peut être absent — variable non renseignée, bloqueur de publicité,
 * script encore en vol. Une commande ne doit pas échouer pour cette raison :
 * en cas de doute on ne fait rien.
 */
export function pixel(nom: string, params?: Params) {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", nom, params);
  } catch {
    // Le suivi est accessoire ; la commande ne l'est pas.
  }
}

/** Met en forme les lignes du bon pour les événements catalogue. */
export function contenus(
  lignes: { variantId: string; quantity: number }[],
): Params {
  return {
    content_type: "product",
    content_ids: lignes.map((l) => l.variantId),
    contents: lignes.map((l) => ({ id: l.variantId, quantity: l.quantity })),
  };
}
