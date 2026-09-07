"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "../auth";
import {
  createOrder,
  deleteOrder,
  deleteProspect,
  enregistrerTarifs,
  getProspect,
  setOrderStatus,
  setProspectStatus,
} from "../data";
import { supabaseAdmin } from "../supabase";
import { envoyerEmailTest } from "../email";
import { orderRef } from "../format";
import { fraisLivraison } from "../livraison";
import { composer, type LigneDemandee } from "../panier";
import { WILAYAS } from "../wilayas";
import { messages, mot, tenter, type Retour } from "./_socle";
import { STATUTS_ACTIFS, type OrderStatus, type TarifLivraison } from "../types";

// ----------------------------------------------------------------- commandes

export async function changerStatutCommande(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };
  const id = mot(formData, "id");
  const status = mot(formData, "status");

  /*
    Le champ arrive d'un formulaire : ce que le navigateur envoie n'est pas ce
    que la page a écrit. Une valeur inconnue ferait remonter jusqu'à Postgres
    une erreur de type énuméré, illisible à l'écran ; on la refuse ici.
  */
  if (!STATUTS_ACTIFS.includes(status as (typeof STATUTS_ACTIFS)[number]))
    return { error: m.statutInconnu };

  return tenter(async () => {
    await setOrderStatus(id, status as OrderStatus);
    return m.statutEnregistre;
  });
}

// ---------------------------------------------------------------- livraison

/**
 * Enregistre la grille tarifaire et l'interrupteur général, d'un seul envoi.
 *
 * Cinquante-huit wilayas se règlent sur un écran : une action par ligne
 * ferait cinquante-huit allers-retours pour un geste unique. Les lignes vides
 * sont écrites quand même — un tarif à zéro se lit « livraison offerte », pas
 * « wilaya oubliée ».
 */
export async function enregistrerLivraison(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };

  return tenter(async () => {
    const db = supabaseAdmin();
    if (!db) throw new Error(m.baseNonConnectee);

    /*
      « Vide » et « zéro » ne veulent pas dire la même chose.

      Un tarif à zéro est une réponse : on livre là-bas sans frais. Un champ
      laissé vide n'en est pas une — c'est une wilaya qu'on n'a pas encore
      tarifée. Les deux se confondaient : `Number("")` vaut zéro, et la case
      « desservie » étant cochée par défaut, le premier enregistrement écrivait
      les cinquante-huit wilayas comme desservies à zéro dinar. Qui remplissait
      dix lignes et enregistrait offrait la livraison aux quarante-huit autres,
      en croyant avoir configuré sa grille.

      On garde donc la chaîne brute pour savoir si quelqu'un a écrit quelque
      chose, et une wilaya sans aucun prix saisi ne peut pas être desservie.
    */
    const saisi = (cle: string) => String(formData.get(cle) ?? "").trim();
    const nombre = (cle: string) => {
      const v = Number(saisi(cle).replace(",", "."));
      return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
    };

    const lignes: TarifLivraison[] = WILAYAS.map((w) => {
      const tarife = Boolean(saisi(`sd_${w.code}`) || saisi(`dom_${w.code}`));
      return {
        wilaya_code: w.code,
        wilaya_nom: w.fr,
        stopdesk: nombre(`sd_${w.code}`),
        domicile: nombre(`dom_${w.code}`),
        active: formData.get(`on_${w.code}`) === "on" && tarife,
      };
    });
    await enregistrerTarifs(lignes);

    const { error } = await db.from("site_settings").upsert({
      id: "settings",
      livraison_active: formData.get("livraison_active") === "on",
    });
    if (error) throw new Error(error.message);

    return m.livraisonEnregistree;
  });
}

export async function supprimerCommande(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };
  const id = mot(formData, "id");
  return tenter(async () => {
    await deleteOrder(id);
    return m.commandeSupprimee;
  });
}

// ------------------------------------------------------------ avis email

/**
 * Envoie un message d'essai et rend le résultat à l'écran.
 *
 * Sans ça, un avis qui ne part pas ne se voit nulle part : il faut ouvrir les
 * journaux de l'hébergeur, ce qui n'est pas un geste de tous les jours. Le
 * diagnostic nomme la variable en cause ou recopie le refus du service.
 */
export async function testerEmail(_prev: Retour, _formData: FormData): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };
  const { ok, detail } = await envoyerEmailTest();
  return ok ? { ok: detail } : { error: detail };
}

// -------------------------------------------------------- pistes de rappel

/*
  Les pistes ne touchent pas au catalogue : pas de `rafraichir()` ici, seulement
  le chemin de la page. Vider l'étiquette du catalogue à chaque appel passé
  ferait relire les produits pour rien.
*/
export async function changerStatutPiste(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };
  const id = mot(formData, "id");
  const statut = mot(formData, "status");
  const permis = ["ouverte", "rappelee", "convertie"] as const;
  if (!permis.includes(statut as (typeof permis)[number]))
    return { error: m.statutInconnu };

  try {
    await setProspectStatus(id, statut as (typeof permis)[number]);
    revalidatePath("/admin/pistes");
    return { ok: m.statutEnregistre };
  } catch (error) {
    return { error: error instanceof Error ? error.message : m.echec };
  }
}

/**
 * Une piste devient une commande.
 *
 * L'appel a abouti : la cliente a dit oui, éventuellement pour autre chose que
 * ce qu'elle avait mis au panier. Le formulaire permet donc de corriger les
 * coordonnées et de recomposer le panier avant de valider.
 *
 * Le résultat entre directement en « confirmée » : quelqu'un vient d'avoir la
 * cliente au téléphone, la repasser par « nouvelle » demanderait de confirmer
 * une seconde fois ce qui vient de l'être. La piste, elle, disparaît de la
 * liste d'appels — c'est tout l'objet du geste.
 */
export async function commanderDepuisPiste(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };

  return tenter(async () => {
    const id = mot(formData, "id");
    const piste = await getProspect(id);
    if (!piste) throw new Error(m.pisteIntrouvable);

    /*
      Les quantités arrivent sous `qte_<nature>_<identifiant>` : le formulaire
      liste le catalogue, pas le panier d'origine. Recomposer depuis la base est
      la seule façon d'avoir des prix à jour — ceux figés dans la piste datent
      du jour où elle a été abandonnée.

      La nature était autrefois supposée : tout partait en « coffret ». En mode
      « produits » la boutique ne vend pourtant que des formats, et la
      conversion d'une piste échouait alors systématiquement. Le formulaire la
      dit maintenant, et on la lit plutôt que de la deviner.
    */
    const lignes: LigneDemandee[] = [];
    for (const [cle, valeur] of formData.entries()) {
      const nature = cle.startsWith("qte_pack_")
        ? "pack"
        : cle.startsWith("qte_produit_")
          ? "produit"
          : null;
      if (!nature) continue;
      const quantity = Math.floor(Number(valeur));
      if (!Number.isFinite(quantity) || quantity <= 0) continue;
      lignes.push({
        kind: nature,
        id: cle.slice(nature === "pack" ? "qte_pack_".length : "qte_produit_".length),
        quantity,
      });
    }
    if (lignes.length === 0) throw new Error(m.panierVide);

    const nom = mot(formData, "customer_name");
    const tel = mot(formData, "phone") || piste.phone;
    const wilaya = mot(formData, "wilaya") || piste.wilaya;
    if (!nom || !tel || !wilaya)
      throw new Error(m.coordonneesRequises);

    const { panier } = await composer(lignes, 1);
    if (panier.items.length === 0) throw new Error(m.panierVide);

    const frais = await fraisLivraison(wilaya, mot(formData, "livraison_mode"));
    if (!frais.ok)
      throw new Error(
        frais.raison === "mode" ? m.choisirLivraison : m.wilayaSansTarif,
      );

    await createOrder({
      ref: orderRef(),
      customer_name: nom,
      phone: tel,
      wilaya,
      address: mot(formData, "address"),
      note: mot(formData, "note"),
      // D'où vient la vente : un rappel, pas le site. On garde l'étiquette de
      // campagne d'origine pour ne pas perdre l'attribution.
      source: piste.source ? `rappel:${piste.source}` : "rappel",
      channel: "formulaire",
      purchase_type: "demi_gros",
      livraison_mode: frais.mode,
      livraison_prix: frais.prix,
      total: panier.total + frais.prix,
      status: "confirmee",
      created_at: new Date().toISOString(),
      items: panier.items,
    });

    await setProspectStatus(id, "convertie");
    revalidatePath("/admin");
    revalidatePath("/admin/pistes");
    return m.commandeCreee;
  });
}

export async function supprimerPiste(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };
  try {
    await deleteProspect(mot(formData, "id"));
    revalidatePath("/admin/pistes");
    return { ok: m.pisteSupprimee };
  } catch (error) {
    return { error: error instanceof Error ? error.message : m.echec };
  }
}
