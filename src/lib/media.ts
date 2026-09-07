import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Le ménage du stockage.
 *
 * Rien ne supprimait jamais un fichier. Supprimer un coffret, un produit, un
 * visuel ou une vidéo retirait la ligne et laissait la photo dans le bucket ;
 * remplacer une image écrivait la nouvelle URL sans retirer l'ancienne. Le
 * bucket ne faisait donc que grossir, avec des fichiers que plus rien ne
 * référence et qui restent accessibles à qui connaît leur adresse.
 *
 * Le ménage est volontairement « au mieux » : il ne doit jamais faire échouer
 * la suppression d'une ligne. Un fichier resté en trop est un désagrément, une
 * suppression refusée est un écran bloqué.
 */

/** Segment qui précède le chemin d'un objet public dans une URL Supabase. */
const MARQUEUR = "/storage/v1/object/public/media/";

/**
 * Le chemin d'un objet dans le bucket, extrait de son URL publique.
 *
 * Rend `null` pour tout ce qui n'est pas un objet de ce bucket : une image
 * livrée avec le site (`/products/…`), un téléversement local de
 * développement (`/uploads/…`), un champ vide, ou une adresse externe. Aucune
 * de ces valeurs ne doit être transformée en tentative de suppression.
 */
export function cheminMedia(url: string | null | undefined): string | null {
  const v = (url ?? "").trim();
  if (!v) return null;
  const i = v.indexOf(MARQUEUR);
  if (i === -1) return null;
  const chemin = v.slice(i + MARQUEUR.length).split("?")[0];
  return decodeURIComponent(chemin) || null;
}

/**
 * Retire du stockage les fichiers dont on n'a plus l'usage.
 *
 * Les valeurs passées sont des URL telles qu'elles vivent en base ; celles qui
 * ne désignent pas un objet du bucket sont ignorées en silence. Les doublons
 * aussi : un produit et son format peuvent porter la même photo.
 */
export async function oublierMedias(
  db: SupabaseClient,
  urls: (string | null | undefined)[],
) {
  const chemins = [...new Set(urls.map(cheminMedia).filter((c): c is string => !!c))];
  if (chemins.length === 0) return;

  try {
    const { error } = await db.storage.from("media").remove(chemins);
    if (error) console.warn("[medias] fichiers non supprimés —", error.message);
  } catch (error) {
    console.warn("[medias] ménage impossible —", error);
  }
}

/**
 * Le ménage d'un remplacement : l'ancienne valeur ne part que si la nouvelle
 * est différente et non vide.
 *
 * Vider le champ sans donner de remplaçante n'est pas un remplacement — c'est
 * peut-être une erreur de saisie, et supprimer le fichier rendrait le retour en
 * arrière impossible.
 */
export async function oublierRemplacee(
  db: SupabaseClient,
  ancienne: string | null | undefined,
  nouvelle: string | null | undefined,
) {
  const av = (ancienne ?? "").trim();
  const ap = (nouvelle ?? "").trim();
  if (!av || !ap || av === ap) return;
  await oublierMedias(db, [av]);
}
