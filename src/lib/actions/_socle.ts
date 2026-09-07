import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { isAdmin } from "../auth";
import { ETIQUETTE_CATALOGUE } from "../data";
import { supabaseAdmin } from "../supabase";
import { isLocale, type Locale } from "@/i18n/config";

/**
 * Le socle commun aux actions du back-office.
 *
 * Il vit hors des modules « use server » : ceux-ci ne peuvent exporter que des
 * fonctions asynchrones, alors qu'on a besoin ici d'un type et de quelques
 * aides synchrones. Les regrouper évite surtout de les voir redéfinies au fil
 * des fichiers, chacune avec sa petite variante.
 */

export type Retour = { ok?: string; error?: string };

/** Champ facultatif : vide devient null, pour que le repli français joue. */
export function texte(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v || null;
}

export function mot(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Langue en cours d'édition ; le français porte les colonnes de base. */
export function langue(formData: FormData): Locale {
  const v = formData.get("edit_lang");
  return isLocale(v) ? v : "fr";
}

/**
 * Nomme les colonnes selon la langue éditée et n'écrit que celles-là — passer
 * en arabe ne doit jamais effacer le français.
 */
export function traduits(
  formData: FormData,
  bases: string[],
  /** La ligne enregistrée, pour reconnaître une traduction qui n'en est pas une. */
  actuel?: Record<string, unknown>,
): Record<string, string | null> {
  const lang = langue(formData);
  const out: Record<string, string | null> = {};
  for (const base of bases) {
    if (lang === "fr") {
      out[base] = mot(formData, base);
      continue;
    }

    const valeur = texte(formData, base);

    /*
      Un garde-fou, appris à la dure.

      Les onglets de langue arrivaient préremplis du texte français ; un
      enregistrement suffisait à le graver dans la colonne arabe, et le repli
      ne jouait plus jamais — la page restait en français sans que rien ne le
      dise. Le formulaire est corrigé, mais une page laissée ouverte dans un
      onglet, un retour en arrière du navigateur, un brouillon restauré, et le
      même envoi repart.

      Un texte identique mot pour mot au français n'est pas une traduction :
      on l'enregistre comme absent, ce qui remet le repli en marche.
    */
    const fr = actuel?.[base];
    out[`${base}_${lang}`] =
      valeur !== null && typeof fr === "string" && valeur === fr.trim()
        ? null
        : valeur;
  }
  return out;
}

export async function garde() {
  if (!(await isAdmin())) throw new Error("Session expirée.");
  const db = supabaseAdmin();
  if (!db) {
    throw new Error(
      "Base de données non connectée : renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return db;
}

export function rafraichir() {
  // L'étiquette vide le cache du catalogue, le chemin vide le rendu des pages.
  revalidateTag(ETIQUETTE_CATALOGUE);
  revalidatePath("/", "layout");
}

/*
  « Invalid API key » remonté tel quel n'apprend rien : la phrase vient de
  Supabase, ne nomme aucune variable, et laisse croire à une panne du site
  alors que la vitrine s'affiche très bien — elle lit avec la clé publique,
  seule l'écriture emploie la clé de service. On traduit donc le message en
  quelque chose d'actionnable.
*/
function messageLisible(brut: string) {
  /*
    Postgres refuse de supprimer une ligne encore référencée, et le dit dans sa
    langue : « violates foreign key constraint products_type_id_fkey ». Ça ne
    s'agit pas depuis un back-office. On nomme ce qui bloque.
  */
  if (/foreign key constraint/i.test(brut)) {
    if (/products_type_id_fkey/i.test(brut)) {
      return "Ce type est encore utilisé par des produits. Changez leur type, ou supprimez ces produits d'abord.";
    }
    return "Cet élément est encore utilisé ailleurs. Détachez-le d'abord de ce qui s'y rapporte.";
  }

  if (/invalid api key|jw[st]|invalid.*token/i.test(brut)) {
    return "La base refuse la clé de service. Vérifiez SUPABASE_SERVICE_ROLE_KEY chez l'hébergeur — collée en entier, sans espace ni retour à la ligne — puis redéployez : une variable modifiée ne s'applique qu'au déploiement suivant.";
  }
  return brut;
}

export async function tenter(action: () => Promise<string>): Promise<Retour> {
  try {
    const ok = await action();
    rafraichir();
    return { ok };
  } catch (error) {
    const brut = error instanceof Error ? error.message : "Échec.";
    // Trace complète côté serveur ; message compréhensible côté écran.
    console.error("[admin] action refusée —", brut);
    return { error: messageLisible(brut) };
  }
}
