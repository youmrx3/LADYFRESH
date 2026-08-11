/**
 * Amorce du pixel Meta, posée dans le <head>.
 *
 * Elle y est plutôt qu'après l'hydratation pour une raison précise : `fbq`
 * existe alors avant que React ne monte quoi que ce soit. C'est exactement ce
 * qui manquait à /merci, où l'achat part au montage et se perdait faute de
 * `fbq` — seul le PageView de l'amorçage arrivait. Chargée ici, elle rend
 * aussi les premiers instants de la visite mesurables : un client qui repart
 * avant la fin de l'hydratation était jusque-là invisible.
 *
 * Le back-office reste exclu, mais le tri se fait dans le navigateur, pas au
 * rendu : une mise en page racine ne connaît pas l'adresse demandée, alors
 * que le script, lui, lit `location`. Suivre ses propres allées et venues
 * fausse les audiences et n'a aucune valeur publicitaire.
 */

/** Remplacé à la compilation ; absent, tout le suivi se tait. */
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

/**
 * Le code officiel de Meta, au caractère près, sous une garde de chemin.
 *
 * L'identifiant est réduit à ses chiffres avant d'être inséré : il finit dans
 * une chaîne de script, et une valeur mal saisie dans les variables
 * d'environnement casserait la page entière plutôt que le seul suivi.
 */
export function amorcePixel(id: string) {
  const propre = id.replace(/\D/g, "");
  if (!propre) return "";

  return `if(location.pathname.indexOf("/admin")!==0){
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${propre}');
fbq('track','PageView');
}`;
}
