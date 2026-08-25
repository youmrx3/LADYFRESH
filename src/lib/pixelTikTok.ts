/**
 * Amorce du pixel TikTok, posée dans le <head>.
 *
 * Même dessin que l'amorce Meta, et pour les mêmes raisons : `ttq` doit exister
 * avant que React ne monte quoi que ce soit, sinon l'achat émis au montage de
 * /merci part dans le vide. Le back-office est écarté par une garde sur le
 * chemin, lue dans le navigateur — une mise en page racine ne connaît pas
 * l'adresse demandée, le script si.
 */

/** Remplacé à la compilation ; absent, TikTok ne charge rien. */
export const TIKTOK_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";

/**
 * Le chargeur officiel de TikTok, réécrit à partir de sa forme d'origine.
 *
 * L'identifiant est filtré avant d'être inséré : il finit dans une chaîne de
 * script, et une valeur mal collée dans les variables d'environnement casserait
 * la page entière plutôt que le seul suivi.
 */
export function amorceTikTok(id: string) {
  const propre = id.replace(/[^A-Za-z0-9]/g, "");
  if (!propre) return "";

  return `if(location.pathname.indexOf("/admin")!==0){
!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";
ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
ttq._o=ttq._o||{};ttq._o[e]=n||{};
var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;
var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${propre}');
ttq.page();
}(window, document, 'ttq');
}`;
}
