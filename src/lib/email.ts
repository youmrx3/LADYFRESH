import "server-only";

import type { Order } from "./types";

/**
 * L'avis de commande.
 *
 * Les commandes n'existaient que dans le back-office : il fallait penser à
 * l'ouvrir pour savoir qu'on avait vendu. Une commande passée à 23 h et vue le
 * lendemain midi, c'est une cliente qui a eu le temps de changer d'avis.
 *
 * Envoyé par Resend, en HTTP : aucun paquet à installer, rien à configurer
 * côté SMTP, et ça marche depuis une fonction serverless. Deux variables
 * suffisent — sans elles, on ne tente rien et on le dit dans le journal.
 */

const API = "https://api.resend.com/emails";

/*
  Adresse d'expédition par défaut : celle que Resend autorise sans domaine
  vérifié. Elle permet de démarrer le jour même. Une fois ladyfresh.dz vérifié
  chez Resend, poser RESEND_FROM sur commandes@ladyfresh.dz — les avis
  cesseront alors d'atterrir dans les indésirables.
*/
const EXPEDITEUR_PAR_DEFAUT = "Lady Fresh <onboarding@resend.dev>";

function propre(v: string | undefined) {
  return (v ?? "").trim();
}

/**
 * Neutralise le HTML avant de l'insérer dans le corps du message.
 *
 * Le nom, l'adresse et la note viennent du formulaire public. Sans échappement,
 * une note contenant du balisage s'exécuterait dans le client mail de la
 * destinataire — c'est du contenu d'inconnu, il se traite comme tel.
 */
function echappe(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Retire les retours à la ligne d'une valeur destinée à un en-tête.
 *
 * Un `\n` dans un sujet permet d'injecter d'autres en-têtes — un `Bcc:` par
 * exemple, qui enverrait vos commandes ailleurs à votre insu.
 */
function ligneUnique(v: string) {
  return v.replace(/[\r\n]+/g, " ").slice(0, 200);
}

function corpsTexte(order: Order, devise: string, base: string) {
  const lignes = order.items.map(
    (i) =>
      `- ${i.product_name} ${i.size_label} x${i.quantity} = ${i.line_total} ${devise}`,
  );
  return [
    `Nouvelle commande ${order.ref}`,
    ``,
    `Client   : ${propre(order.customer_name) || "—"}`,
    `Telephone: ${propre(order.phone) || "—"}`,
    `Wilaya   : ${propre(order.wilaya) || "—"}`,
    `Adresse  : ${propre(order.address) || "—"}`,
    `Note     : ${propre(order.note) || "—"}`,
    `Origine  : ${propre(order.source) || "direct"}`,
    `Type     : ${order.purchase_type === "gros" ? "Gros" : "Demi-gros"}`,
    ``,
    ...lignes,
    ``,
    `TOTAL : ${order.total} ${devise}`,
    ``,
    `Back-office : ${base}/admin`,
  ].join("\n");
}

function corpsHtml(order: Order, devise: string, base: string) {
  const champ = (label: string, valeur: string) =>
    `<tr><td style="padding:2px 12px 2px 0;color:#6b6b6b">${label}</td><td style="padding:2px 0"><strong>${echappe(valeur || "—")}</strong></td></tr>`;

  const lignes = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 12px 4px 0;border-top:1px solid #eee">${echappe(
          `${i.product_name} ${i.size_label}`,
        )} × ${i.quantity}</td><td style="padding:4px 0;border-top:1px solid #eee;text-align:right;white-space:nowrap">${i.line_total} ${devise}</td></tr>`,
    )
    .join("");

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#141719;max-width:560px">
  <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b6b;margin:0 0 4px">Lady Fresh</p>
  <h1 style="font-size:20px;margin:0 0 4px">Nouvelle commande</h1>
  <p style="margin:0 0 18px;font-family:ui-monospace,monospace">${echappe(order.ref)}</p>
  <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px">
    ${champ("Client", propre(order.customer_name))}
    ${champ("Téléphone", propre(order.phone))}
    ${champ("Wilaya", propre(order.wilaya))}
    ${champ("Adresse", propre(order.address))}
    ${champ("Note", propre(order.note))}
    ${champ("Origine", propre(order.source) || "direct")}
    ${champ("Type", order.purchase_type === "gros" ? "Gros" : "Demi-gros")}
  </table>
  <table style="border-collapse:collapse;width:100%;font-size:14px">
    ${lignes}
    <tr><td style="padding:8px 12px 0 0;border-top:2px solid #141719"><strong>Total</strong></td>
        <td style="padding:8px 0 0;border-top:2px solid #141719;text-align:right"><strong>${order.total} ${devise}</strong></td></tr>
  </table>
  <p style="margin:22px 0 0"><a href="${base}/admin" style="color:#c9a227">Ouvrir le back-office →</a></p>
</div>`;
}

/**
 * Prévient la boutique qu'une commande est arrivée.
 *
 * Ne lève jamais. Une commande est enregistrée avant qu'on arrive ici : la
 * perdre parce qu'un service d'emails répond mal serait absurde. En cas
 * d'échec, le journal garde la référence pour qu'on puisse la retrouver.
 */
export async function avertirCommande(order: Order, devise = "DA") {
  const cle = propre(process.env.RESEND_API_KEY);
  const vers = propre(process.env.ORDER_NOTIFICATION_EMAIL);

  if (!cle || !vers) {
    console.warn(
      `[email] avis non envoyé pour ${order.ref} — RESEND_API_KEY et ORDER_NOTIFICATION_EMAIL doivent être renseignés chez l'hébergeur.`,
    );
    return;
  }

  const base = propre(process.env.NEXT_PUBLIC_SITE_URL) || "https://ladyfresh.vercel.app";

  try {
    const reponse = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: propre(process.env.RESEND_FROM) || EXPEDITEUR_PAR_DEFAUT,
        // Plusieurs destinataires possibles : « a@x.dz, b@x.dz ».
        to: vers.split(",").map((a) => a.trim()).filter(Boolean),
        // Le téléphone dans le sujet : de quoi rappeler sans ouvrir le message.
        subject: ligneUnique(
          `Commande ${order.ref} — ${order.total} ${devise} — ${propre(order.phone)}`,
        ),
        text: corpsTexte(order, devise, base),
        html: corpsHtml(order, devise, base),
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text().catch(() => "");
      console.error(
        `[email] Resend a refusé l'avis pour ${order.ref} — ${reponse.status} ${detail.slice(0, 300)}`,
      );
    }
  } catch (error) {
    console.error(`[email] envoi impossible pour ${order.ref} —`, error);
  }
}
