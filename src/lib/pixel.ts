/**
 * Événements Meta.
 *
 * Le pixel ne comptait que les pages vues. Une campagne a besoin d'autre
 * chose : sans événement de conversion, Meta ne sait pas distinguer une visite
 * qui finit en commande d'une visite qui repart, et l'optimisation n'a rien à
 * optimiser — on paie pour du trafic, pas pour des clients.
 *
 * Trois jalons, dans l'ordre de l'entonnoir : AddToCart quand un article entre
 * au bon de commande, InitiateCheckout quand l'envoi démarre, Purchase quand la
 * commande est enregistrée.
 *
 * Purchase et non Lead, alors que rien n'est payé sur le site : c'est le choix
 * courant en paiement à la livraison, et il se défend — les campagnes Ventes et
 * Advantage+ optimisent sur Purchase, et l'apprentissage y est bien plus rapide
 * que sur Lead. Le prix à payer est réel et il faut le savoir : le chiffre
 * d'affaires et le ROAS affichés par Meta comptent des commandes qui ne seront
 * pas toutes confirmées. Un taux de confirmation de 60 % veut dire un ROAS
 * affiché ~1,7 fois trop haut. Ces chiffres servent à comparer des campagnes
 * entre elles, pas à mesurer la recette réelle : celle-ci se lit en base.
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

/**
 * Émet dès que le pixel est là, plutôt que d'abandonner s'il ne l'est pas.
 *
 * Sur une page de confirmation, l'événement part au montage du composant —
 * c'est-à-dire peut-être avant que le script d'amorçage, chargé
 * `afterInteractive`, n'ait défini `fbq`. `pixel()` ne fait alors strictement
 * rien et la vente n'est comptée nulle part : constaté en essai local, où
 * seul le PageView de l'amorçage partait. Sur un geste du client la question
 * ne se pose pas, le script est chargé depuis longtemps ; au chargement d'une
 * page, si.
 *
 * On n'annule pas cette attente au démontage : elle s'arrête d'elle-même, et
 * une annulation ferait perdre l'événement au double montage de StrictMode.
 */
export function pixelDesQuePret(nom: string, params?: Params, delaiMax = 10_000) {
  if (typeof window === "undefined") return;
  if (window.fbq) {
    pixel(nom, params);
    return;
  }
  const debut = Date.now();
  const minuteur = setInterval(() => {
    if (window.fbq) {
      clearInterval(minuteur);
      pixel(nom, params);
    } else if (Date.now() - debut > delaiMax) {
      // Bloqueur de publicité, script en échec : cesser d'attendre.
      clearInterval(minuteur);
    }
  }, 100);
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
