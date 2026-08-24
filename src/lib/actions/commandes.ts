"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "../auth";
import {
  deleteOrder,
  deleteProspect,
  setOrderStatus,
  setProspectStatus,
} from "../data";
import { envoyerEmailTest } from "../email";
import { mot, tenter, type Retour } from "./_socle";
import type { OrderStatus } from "../types";

// ----------------------------------------------------------------- commandes

export async function changerStatutCommande(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  if (!(await isAdmin())) return { error: "Session expirée." };
  const id = mot(formData, "id");
  const status = mot(formData, "status") as OrderStatus;
  return tenter(async () => {
    await setOrderStatus(id, status);
    return "Statut mis à jour.";
  });
}

export async function supprimerCommande(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  if (!(await isAdmin())) return { error: "Session expirée." };
  const id = mot(formData, "id");
  return tenter(async () => {
    await deleteOrder(id);
    return "Commande supprimée.";
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
  if (!(await isAdmin())) return { error: "Session expirée." };
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
  if (!(await isAdmin())) return { error: "Session expirée." };
  const id = mot(formData, "id");
  const statut = mot(formData, "status");
  const permis = ["ouverte", "rappelee", "convertie"] as const;
  if (!permis.includes(statut as (typeof permis)[number]))
    return { error: "Statut inconnu." };

  try {
    await setProspectStatus(id, statut as (typeof permis)[number]);
    revalidatePath("/admin/pistes");
    return { ok: "Statut enregistré." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Échec." };
  }
}

export async function supprimerPiste(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  if (!(await isAdmin())) return { error: "Session expirée." };
  try {
    await deleteProspect(mot(formData, "id"));
    revalidatePath("/admin/pistes");
    return { ok: "Piste supprimée." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Échec." };
  }
}
