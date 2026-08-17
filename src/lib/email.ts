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
 * Envoie, et dit précisément ce qui s'est passé.
 *
 * Un envoi qui échoue en silence est le pire des cas : la propriétaire attend
 * un email qui ne viendra pas, sans rien pour comprendre. Le détail remonte
 * donc jusqu'à l'écran de gestion, où il est lisible sans ouvrir les journaux
 * de l'hébergeur.
 */
export async function envoyer(
  sujet: string,
  texte: string,
  html: string,
): Promise<{ ok: boolean; detail: string }> {
  const cle = propre(process.env.RESEND_API_KEY);
  const vers = propre(process.env.ORDER_NOTIFICATION_EMAIL);

  const manque: string[] = [];
  if (!cle) manque.push("RESEND_API_KEY");
  if (!vers) manque.push("ORDER_NOTIFICATION_EMAIL");
  if (manque.length) {
    return {
      ok: false,
      detail: `${manque.join(" et ")} ${manque.length > 1 ? "sont absentes" : "est absente"} du déploiement en cours. Ajoutez-les chez l'hébergeur — environnement Production — puis redéployez : une variable ajoutée après coup ne s'applique qu'au déploiement suivant.`,
    };
  }

  const destinataires = vers.split(",").map((a) => a.trim()).filter(Boolean);
  const expediteur = propre(process.env.RESEND_FROM) || EXPEDITEUR_PAR_DEFAUT;

  try {
    const reponse = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: expediteur,
        to: destinataires,
        subject: ligneUnique(sujet),
        text: texte,
        html,
      }),
    });

    if (reponse.ok) {
      return {
        ok: true,
        detail: `Envoyé à ${destinataires.join(", ")} depuis ${expediteur}. Si rien n'arrive, regardez les indésirables.`,
      };
    }

    const brut = await reponse.text().catch(() => "");
    return { ok: false, detail: expliquer(reponse.status, brut, expediteur) };
  } catch (error) {
    return {
      ok: false,
      detail: `Le service d'envoi est injoignable — ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Traduit la réponse de Resend en quelque chose d'actionnable. */
function expliquer(statut: number, brut: string, expediteur: string) {
  const detail = brut.slice(0, 300);
  if (statut === 401 || statut === 403) {
    if (/domain|from/i.test(brut)) {
      return `Resend refuse l'expéditeur « ${expediteur} » : ce domaine n'est pas vérifié chez lui. Videz RESEND_FROM pour revenir à l'adresse d'essai, ou terminez la vérification du domaine. (${statut})`;
    }
    return `Resend refuse la clé. Elle est tronquée, entourée de guillemets, ou supprimée depuis. Recréez-en une et recollez-la sans guillemets. (${statut}) ${detail}`;
  }
  if (statut === 422) {
    return `Resend refuse le message : adresse destinataire invalide ? Vérifiez ORDER_NOTIFICATION_EMAIL. (422) ${detail}`;
  }
  if (statut === 429) {
    return `Quota Resend atteint pour l'instant. Réessayez plus tard. (429)`;
  }
  return `Resend a répondu ${statut} — ${detail}`;
}

/**
 * Prévient la boutique qu'une commande est arrivée.
 *
 * Ne lève jamais. Une commande est enregistrée avant qu'on arrive ici : la
 * perdre parce qu'un service d'emails répond mal serait absurde. En cas
 * d'échec, le journal garde la référence pour qu'on puisse la retrouver.
 */
export async function avertirCommande(order: Order, devise = "DA") {
  const base =
    propre(process.env.NEXT_PUBLIC_SITE_URL) || "https://ladyfresh.vercel.app";

  const { ok, detail } = await envoyer(
    // Le téléphone dans le sujet : de quoi rappeler sans ouvrir le message.
    `Commande ${order.ref} — ${order.total} ${devise} — ${propre(order.phone)}`,
    corpsTexte(order, devise, base),
    corpsHtml(order, devise, base),
  );

  if (!ok) console.error(`[email] avis non parti pour ${order.ref} — ${detail}`);
}

/** Message d'essai déclenché depuis l'écran de gestion. */
export async function envoyerEmailTest() {
  const base =
    propre(process.env.NEXT_PUBLIC_SITE_URL) || "https://ladyfresh.vercel.app";
  return envoyer(
    "Lady Fresh — essai d'envoi",
    `Si vous lisez ceci, les avis de commande fonctionnent.

Back-office : ${base}/admin`,
    `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#141719">
  <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b6b;margin:0 0 6px">Lady Fresh</p>
  <h1 style="font-size:19px;margin:0 0 10px">Essai d'envoi réussi</h1>
  <p style="margin:0">Si vous lisez ceci, les avis de commande fonctionnent : la prochaine commande arrivera ici.</p>
  <p style="margin:18px 0 0"><a href="${base}/admin" style="color:#c9a227">Ouvrir le back-office →</a></p>
</div>`,
  );
}
