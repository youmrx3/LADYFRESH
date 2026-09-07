import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "../auth";
import { ETIQUETTE_CATALOGUE } from "../data";
import { supabaseAdmin } from "../supabase";
import { isLocale, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { Dictionary } from "@/i18n";

/**
 * Le socle commun aux actions du back-office.
 *
 * Il vit hors des modules « use server » : ceux-ci ne peuvent exporter que des
 * fonctions asynchrones, alors qu'on a besoin ici d'un type et de quelques
 * aides synchrones. Les regrouper évite surtout de les voir redéfinies au fil
 * des fichiers, chacune avec sa petite variante.
 */

export type Retour = { ok?: string; error?: string };

/**
 * Une zone de saisie rend ses retours à la ligne en CRLF.
 *
 * C'est la spécification HTML, pas un caprice de navigateur. Le retour chariot
 * traversait ensuite toute la chaîne : il se retrouvait en base, ressortait au
 * milieu d'un titre, et surtout faussait toute comparaison — un texte recopié
 * du français n'était jamais reconnu comme tel, puisqu'il différait d'un seul
 * caractère invisible. C'est exactement ce qui a laissé passer un titre
 * français dans la colonne arabe alors que le garde-fou était déjà en place.
 *
 * On normalise à l'entrée, une fois pour toutes.
 */
function normaliser(v: unknown): string {
  return String(v ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

/** Champ facultatif : vide devient null, pour que le repli français joue. */
export function texte(formData: FormData, name: string): string | null {
  return normaliser(formData.get(name)) || null;
}

export function mot(formData: FormData, name: string): string {
  return normaliser(formData.get(name));
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
      valeur !== null && typeof fr === "string" && valeur === normaliser(fr)
        ? null
        : valeur;
  }
  return out;
}

/**
 * La ligne telle qu'elle est enregistrée, avant de la réécrire.
 *
 * Elle sert deux fois. D'abord au garde-fou de `traduits()`, qui ne peut
 * reconnaître un texte français recopié dans la colonne arabe qu'en ayant le
 * français sous les yeux. Ensuite au ménage du stockage, qui doit connaître
 * l'ancienne photo pour la retirer quand on en pose une autre.
 *
 * Une lecture de plus par enregistrement, sur une ligne désignée par sa clé
 * primaire — c'est peu payé pour les deux.
 */
export async function lireLigne(
  db: SupabaseClient,
  table: string,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  if (!id) return undefined;
  const { data } = await db.from(table).select("*").eq("id", id).maybeSingle();
  return (data as Record<string, unknown> | null) ?? undefined;
}

/**
 * Les messages que les actions rendent à l'écran, dans la langue du site.
 *
 * Ils étaient écrits en dur, en français, alors que tout le reste du
 * back-office est traduit : une gestionnaire travaillant en arabe lisait ses
 * menus, ses libellés et ses aides en arabe, puis « Coffret enregistré. » en
 * français à chaque geste. À moitié traduit est pire que pas traduit.
 *
 * La lecture ne coûte rien : `getSettings()` est mémorisée par requête, et une
 * action n'en est qu'une.
 */
export type Messages = Dictionary["admin"]["messages"];

export async function messages(): Promise<Messages> {
  return (await getT()).t.admin.messages;
}

export async function garde() {
  const m = await messages();
  if (!(await isAdmin())) throw new Error(m.sessionExpiree);
  const db = supabaseAdmin();
  if (!db) throw new Error(m.baseAbsente);
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
function messageLisible(brut: string, m: Messages) {
  /*
    Postgres refuse de supprimer une ligne encore référencée, et le dit dans sa
    langue : « violates foreign key constraint products_type_id_fkey ». Ça ne
    s'agit pas depuis un back-office. On nomme ce qui bloque.
  */
  if (/foreign key constraint/i.test(brut)) {
    if (/products_type_id_fkey/i.test(brut)) return m.typeUtilise;
    return m.encoreUtilise;
  }

  if (/invalid api key|jw[st]|invalid.*token/i.test(brut)) return m.cleRefusee;
  return brut;
}

export async function tenter(action: () => Promise<string>): Promise<Retour> {
  const m = await messages();
  try {
    const ok = await action();
    rafraichir();
    return { ok };
  } catch (error) {
    const brut = error instanceof Error ? error.message : m.echec;
    // Trace complète côté serveur ; message compréhensible côté écran.
    console.error("[admin] action refusée —", brut);
    return { error: messageLisible(brut, m) };
  }
}
