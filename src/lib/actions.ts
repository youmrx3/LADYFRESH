"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authConfiguree, clientAuth, isAdmin, verdictAdmin } from "./auth";
import { limiteDepassee } from "./limite";
import {
  GAMMES,
  HERO_SLIDES,
  PRODUCTS,
  PRODUCT_TYPES,
  SETTINGS,
  VIDEOS,
} from "./catalog";
import {
  deleteOrder,
  deleteProspect,
  ETIQUETTE_CATALOGUE,
  setOrderStatus,
  setProspectStatus,
  writeLocalSettings,
} from "./data";
import { envoyerEmailTest } from "./email";
import { supabaseAdmin } from "./supabase";
import { isLocale, type Locale } from "@/i18n/config";
import type { OrderStatus } from "./types";

export type Retour = { ok?: string; error?: string };

/** Types acceptés au téléversement, et l'extension qu'on leur impose. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
const TYPES_AUTORISES = new Set(Object.keys(EXTENSIONS));

/** Champ facultatif : vide devient null, pour que le repli français joue. */
function texte(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v || null;
}

function mot(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Langue en cours d'édition ; le français porte les colonnes de base. */
function langue(formData: FormData): Locale {
  const v = formData.get("edit_lang");
  return isLocale(v) ? v : "fr";
}

/**
 * Nomme les colonnes selon la langue éditée et n'écrit que celles-là — passer
 * en arabe ne doit jamais effacer le français.
 */
function traduits(
  formData: FormData,
  bases: string[],
): Record<string, string | null> {
  const lang = langue(formData);
  const out: Record<string, string | null> = {};
  for (const base of bases) {
    const colonne = lang === "fr" ? base : `${base}_${lang}`;
    out[colonne] = lang === "fr" ? mot(formData, base) : texte(formData, base);
  }
  return out;
}

async function garde() {
  if (!(await isAdmin())) throw new Error("Session expirée.");
  const db = supabaseAdmin();
  if (!db) {
    throw new Error(
      "Base de données non connectée : renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return db;
}

function rafraichir() {
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
  if (/invalid api key|jw[st]|invalid.*token/i.test(brut)) {
    return "La base refuse la clé de service. Vérifiez SUPABASE_SERVICE_ROLE_KEY chez l'hébergeur — collée en entier, sans espace ni retour à la ligne — puis redéployez : une variable modifiée ne s'applique qu'au déploiement suivant.";
  }
  return brut;
}

async function tenter(action: () => Promise<string>): Promise<Retour> {
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

// ----------------------------------------------------------------- connexion

export async function seConnecter(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  if (!authConfiguree) {
    return {
      error:
        "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY chez l'hébergeur, puis redéployez.",
    };
  }

  const email = mot(formData, "email").toLowerCase();
  const password = mot(formData, "password");
  if (!email || !password) return { error: "Adresse et mot de passe requis." };

  /*
    Bridage global des échecs, pas par IP.

    `headers()` est inutilisable dans une action passée à useActionState, et le
    middleware ne peut pas intercepter les POST d'actions sans leur faire perdre
    leur portée de requête. Sans IP, on compte donc les échecs toutes origines
    confondues : un attaquant peut gêner la propriétaire un quart d'heure, mais
    ne peut plus parcourir un dictionnaire. Les réussites ne comptent pas.
  */
  if (limiteDepassee("login:echecs", 30, 15 * 60 * 1000)) {
    return { error: "Trop de tentatives récentes. Réessayez dans quelques minutes." };
  }

  const supabase = await clientAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    limiteDepassee("login:echecs", 30, 15 * 60 * 1000);
    /*
      Message volontairement identique pour un compte inconnu et un mot de
      passe faux : distinguer les deux dirait à un inconnu quelles adresses
      existent.
    */
    return { error: "Adresse ou mot de passe incorrect." };
  }

  /*
    Le compte existe, mais est-il gestionnaire ? Si les inscriptions publiques
    sont ouvertes sur le projet Supabase, n'importe qui a pu s'en créer un.
  */
  const verdict = await verdictAdmin(email);
  if (!verdict.autorisee) {
    await supabase.auth.signOut();
    const motifs = {
      "table-absente":
        "La table `admins` n'existe pas encore. Exécutez supabase/schema.sql dans Supabase, puis ajoutez-y cette adresse.",
      "pas-de-cle":
        "SUPABASE_SERVICE_ROLE_KEY est absente du déploiement : impossible de vérifier les droits. Renseignez-la chez l'hébergeur puis redéployez.",
      inconnue: `Le compte existe mais n'a pas accès à la gestion. Ajoutez ${email} dans la table \`admins\` de Supabase.`,
    } as const;
    return { error: motifs[verdict.raison] };
  }

  redirect("/admin");
}

export async function seDeconnecter() {
  const supabase = await clientAuth();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

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

// -------------------------------------------------------------------- packs

export async function enregistrerPack(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const lang = langue(formData);

    /*
      Le prix, la photo et le slug ne dépendent pas de la langue : ils ne
      s'écrivent que depuis le français, sinon une visite dans l'onglet arabe
      les remettrait à zéro.
    */
    const valeurs: Record<string, unknown> = traduits(formData, [
      "name",
      "tagline",
      "description",
    ]);

    if (lang === "fr") {
      const prix = Number(formData.get("price") ?? 0);
      const barre = Number(formData.get("prix_barre") ?? 0);
      if (!mot(formData, "slug")) throw new Error("Le slug est requis.");
      if (!(prix > 0)) throw new Error("Le prix du coffret doit être supérieur à zéro.");
      if (barre && barre <= prix)
        throw new Error("Le prix barré doit être supérieur au prix de vente.");
      Object.assign(valeurs, {
        slug: mot(formData, "slug"),
        image: mot(formData, "image"),
        price: prix,
        prix_barre: barre,
        sort_order: Number(formData.get("sort_order") ?? 0),
        active: formData.get("active") === "on",
      });
    }

    const { data, error } = id
      ? await db.from("packs").update(valeurs).eq("id", id).select("id").single()
      : await db.from("packs").insert(valeurs).select("id").single();
    if (error) throw new Error(error.message);

    /*
      La composition est réécrite en entier plutôt que rapprochée ligne à ligne :
      un coffret compte quatre ou cinq entrées, la comparaison coûterait plus
      cher en code qu'en base. Seulement depuis le français, comme le reste de
      ce qui ne se traduit pas.
    */
    if (lang === "fr") {
      const variantes = formData.getAll("item_variant").map(String);
      const quantites = formData.getAll("item_quantity").map((q) => Number(q) || 1);
      const libelles = formData.getAll("item_label").map(String);

      await db.from("pack_items").delete().eq("pack_id", data.id);

      const lignes = variantes
        .map((variant_id, i) => ({
          pack_id: data.id as string,
          variant_id: variant_id || null,
          label: (libelles[i] ?? "").trim(),
          quantity: Math.max(1, quantites[i] ?? 1),
          sort_order: i,
        }))
        .filter((l) => l.variant_id || l.label);

      if (lignes.length) {
        const { error: e2 } = await db.from("pack_items").insert(lignes);
        if (e2) throw new Error(e2.message);
      }
    }

    return id ? "Coffret enregistré." : "Coffret créé.";
  });
}

export async function supprimerPack(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    // `pack_items` porte un `on delete cascade` : la composition part avec.
    const { error } = await db.from("packs").delete().eq("id", mot(formData, "id"));
    if (error) throw new Error(error.message);
    return "Coffret supprimé.";
  });
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

// -------------------------------------------------------- types de produits

export async function enregistrerType(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const valeurs: Record<string, unknown> = traduits(formData, [
      "name",
      "short_name",
    ]);
    if (lang === "fr") {
      valeurs.slug = mot(formData, "slug");
      valeurs.sort_order = Number(formData.get("sort_order") ?? 0);
      valeurs.active = formData.get("active") === "on";
      if (!valeurs.slug) throw new Error("Le slug est requis.");
      if (!valeurs.name) throw new Error("Le nom est requis.");
    }

    const { error } = id
      ? await db.from("product_types").update(valeurs).eq("id", id)
      : await db.from("product_types").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? "Type enregistré." : "Type créé.";
  });
}

export async function supprimerType(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");

    // Un type encore porté par des produits ne peut pas partir : on l'explique
    // plutôt que de laisser remonter une erreur de contrainte SQL.
    const { count } = await db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("type_id", id);
    if ((count ?? 0) > 0)
      throw new Error(
        `Ce type est encore utilisé par ${count} produit(s). Changez leur type avant de le supprimer.`,
      );

    const { error } = await db.from("product_types").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return "Type supprimé.";
  });
}

// -------------------------------------------------------------------- gammes

export async function enregistrerGamme(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const valeurs: Record<string, unknown> = traduits(formData, [
      "tagline",
      "description",
    ]);
    if (lang === "fr") {
      Object.assign(valeurs, {
        slug: mot(formData, "slug"),
        name: mot(formData, "name"),
        color_hex: mot(formData, "color_hex") || "#000000",
        color_name: mot(formData, "color_name"),
        cover_image: mot(formData, "cover_image"),
        sort_order: Number(formData.get("sort_order") ?? 0),
        active: formData.get("active") === "on",
      });
      if (!valeurs.name || !valeurs.slug) throw new Error("Nom et slug requis.");
    }

    const { error } = id
      ? await db.from("gammes").update(valeurs).eq("id", id)
      : await db.from("gammes").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? "Gamme enregistrée." : "Gamme créée.";
  });
}

export async function supprimerGamme(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const { error } = await db
      .from("gammes")
      .delete()
      .eq("id", mot(formData, "id"));
    if (error) throw new Error(error.message);
    return "Gamme supprimée.";
  });
}

// ------------------------------------------------------------------ produits

export async function enregistrerProduit(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const valeurs = {
      slug: mot(formData, "slug"),
      name: mot(formData, "name"),
      type_id: mot(formData, "type_id") || null,
      gamme_id: mot(formData, "gamme_id") || null,
      color_name: mot(formData, "color_name"),
      color_hex: mot(formData, "color_hex") || "#000000",
      image: mot(formData, "image"),
      sort_order: Number(formData.get("sort_order") ?? 0),
      active: formData.get("active") === "on",
    };
    if (!valeurs.slug) throw new Error("Le slug est requis.");
    if (!valeurs.type_id) throw new Error("Choisissez un type de produit.");
    if (!valeurs.gamme_id) throw new Error("Choisissez une gamme.");

    const { error } = id
      ? await db.from("products").update(valeurs).eq("id", id)
      : await db.from("products").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? "Produit enregistré." : "Produit créé.";
  });
}

export async function supprimerProduit(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const { error } = await db
      .from("products")
      .delete()
      .eq("id", mot(formData, "id"));
    if (error) throw new Error(error.message);
    return "Produit supprimé.";
  });
}

export async function enregistrerVariante(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const valeurs = {
      product_id: mot(formData, "product_id"),
      size_label: mot(formData, "size_label"),
      price_demi_gros: Number(formData.get("price_demi_gros") ?? 0),
      price_gros: Number(formData.get("price_gros") ?? 0),
      units_per_carton: Number(formData.get("units_per_carton") ?? 12),
      image: mot(formData, "image"),
      active: formData.get("active") === "on",
    };
    if (!valeurs.product_id) throw new Error("Choisissez un produit.");
    if (!valeurs.size_label) throw new Error("Le format est requis.");
    if (valeurs.units_per_carton < 1)
      throw new Error("Le carton doit contenir au moins 1 pièce.");

    const { error } = id
      ? await db.from("product_variants").update(valeurs).eq("id", id)
      : await db.from("product_variants").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? "Format enregistré." : "Format ajouté.";
  });
}

export async function supprimerVariante(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const { error } = await db
      .from("product_variants")
      .delete()
      .eq("id", mot(formData, "id"));
    if (error) throw new Error(error.message);
    return "Format supprimé.";
  });
}

// ------------------------------------------------------------------- contenu

export async function enregistrerReglages(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const lang = langue(formData);
    const db = await garde();

    const valeurs: Record<string, unknown> = traduits(formData, [
      "hero_eyebrow",
      "hero_title",
      "hero_lede",
    ]);
    if (lang === "fr") {
      const numero = mot(formData, "whatsapp_number").replace(/\D/g, "");
      if (!numero) throw new Error("Le téléphone de contact est requis.");
      Object.assign(valeurs, {
        locale: isLocale(mot(formData, "locale")) ? mot(formData, "locale") : "fr",
        whatsapp_number: numero,
        mode_boutique:
          mot(formData, "mode_boutique") === "produits" ? "produits" : "packs",
        min_produit: Math.max(1, Number(formData.get("min_produit") ?? 1)),
        contact_email: mot(formData, "contact_email"),
        contact_phone: mot(formData, "contact_phone"),
        contact_address: mot(formData, "contact_address"),
        instagram_url: mot(formData, "instagram_url"),
        facebook_url: mot(formData, "facebook_url"),
        tiktok_url: mot(formData, "tiktok_url"),
      });
    }

    const { error } = await db
      .from("site_settings")
      .upsert({ id: "settings", ...valeurs });
    if (error) throw new Error(error.message);
    return "Réglages enregistrés.";
  });
}

/**
 * La langue du site vit à part des autres réglages : on doit pouvoir la
 * changer avant même que Supabase soit branché, sinon impossible de
 * prévisualiser l'arabe ou l'anglais. Elle s'écrit donc en base quand elle
 * existe, et dans le repli local sinon.
 */
export async function changerLangueSite(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  if (!(await isAdmin())) return { error: "Session expirée." };

  const cible = mot(formData, "locale");
  if (!isLocale(cible)) return { error: "Langue inconnue." };

  return tenter(async () => {
    const db = supabaseAdmin();
    if (db) {
      const { error } = await db
        .from("site_settings")
        .upsert({ id: "settings", locale: cible });
      if (error) throw new Error(error.message);
    } else if (!writeLocalSettings({ locale: cible })) {
      throw new Error(
        "Langue non enregistrée : base absente et disque en lecture seule.",
      );
    }
    return "Langue du site mise à jour.";
  });
}

export async function enregistrerSlide(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const valeurs: Record<string, unknown> = traduits(formData, [
      "eyebrow",
      "caption",
    ]);
    if (lang === "fr") {
      Object.assign(valeurs, {
        image: mot(formData, "image"),
        gamme_id: mot(formData, "gamme_id") || null,
        sort_order: Number(formData.get("sort_order") ?? 0),
      });
      if (!valeurs.image) throw new Error("Une image est requise.");
    }

    const { error } = id
      ? await db.from("hero_slides").update(valeurs).eq("id", id)
      : await db.from("hero_slides").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? "Visuel enregistré." : "Visuel ajouté.";
  });
}

export async function supprimerSlide(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const { error } = await db
      .from("hero_slides")
      .delete()
      .eq("id", mot(formData, "id"));
    if (error) throw new Error(error.message);
    return "Visuel supprimé.";
  });
}

export async function enregistrerVideo(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const valeurs: Record<string, unknown> = traduits(formData, ["title", "note"]);
    if (lang === "fr") {
      Object.assign(valeurs, {
        src: mot(formData, "src"),
        poster: texte(formData, "poster"),
        sort_order: Number(formData.get("sort_order") ?? 0),
      });
      if (!valeurs.src) throw new Error("Le fichier vidéo est requis.");
    }

    const { error } = id
      ? await db.from("videos").update(valeurs).eq("id", id)
      : await db.from("videos").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? "Vidéo enregistrée." : "Vidéo ajoutée.";
  });
}

export async function supprimerVideo(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const { error } = await db
      .from("videos")
      .delete()
      .eq("id", mot(formData, "id"));
    if (error) throw new Error(error.message);
    return "Vidéo supprimée.";
  });
}

// ------------------------------------------------------------ téléversement

/**
 * Autorise un téléversement direct navigateur → Supabase.
 *
 * Le fichier ne traverse plus le serveur Next. C'est ce qui règle l'échec
 * observé : une action serveur refuse tout corps au-delà de 1 Mo par défaut et
 * la connexion se coupe (ERR_CONNECTION_RESET) — donc n'importe quelle vraie
 * photo produit. Relever la limite n'aurait déplacé le mur que jusqu'à 4,5 Mo,
 * plafond des fonctions Vercel qu'on ne peut pas lever : ça aurait marché en
 * local et cassé en production.
 *
 * Le serveur ne rend qu'une URL signée, courte et à usage unique. La clé
 * service-role ne quitte jamais le serveur, et seul un admin connecté peut en
 * obtenir une.
 */
export async function urlDeTeleversement(
  nom: string,
  type: string,
): Promise<{ url?: string; publicUrl?: string; error?: string }> {
  if (!(await isAdmin())) return { error: "Session expirée." };

  if (!TYPES_AUTORISES.has(type))
    return {
      error:
        "Format refusé. Images JPEG, PNG, WebP, AVIF ou vidéos MP4, WebM uniquement.",
    };

  const db = supabaseAdmin();
  if (!db) return { error: "supabase-absent" };

  const chemin = `${Date.now()}-${nomPropre(nom, type)}`;
  const { data, error } = await db.storage
    .from("media")
    .createSignedUploadUrl(chemin);
  if (error) return { error: error.message };

  const { data: pub } = db.storage.from("media").getPublicUrl(chemin);
  return { url: data.signedUrl, publicUrl: pub.publicUrl };
}

/** Nom de fichier assaini ; l'extension vient du type MIME validé. */
function nomPropre(nom: string, type: string) {
  const base = nom
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `${base || "fichier"}.${EXTENSIONS[type]}`;
}

/**
 * Envoie un fichier et renvoie son URL publique.
 *
 * Avec Supabase, le fichier part dans le bucket `media`. Sans Supabase, il
 * atterrit dans `public/uploads/` : ça marche en local et sur un serveur
 * classique, pas sur du serverless en lecture seule. C'est ce qui permet de
 * téléverser des images avant même d'avoir branché la base.
 */
export async function televerser(
  _prev: Retour & { url?: string },
  formData: FormData,
): Promise<Retour & { url?: string }> {
  try {
    if (!(await isAdmin())) return { error: "Session expirée." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0)
      return { error: "Choisissez un fichier." };
    if (file.size > 60 * 1024 * 1024)
      return { error: "Fichier trop lourd (60 Mo maximum)." };

    /*
      Liste blanche stricte. Le bucket est public : un SVG ou un HTML servi
      depuis le même domaine exécuterait son script dans le contexte du site.
      On refuse donc tout ce qui n'est pas une image matricielle ou une vidéo,
      SVG compris.
    */
    if (!TYPES_AUTORISES.has(file.type))
      return {
        error:
          "Format refusé. Images JPEG, PNG, WebP, AVIF ou vidéos MP4, WebM uniquement.",
      };

    const chemin = `${Date.now()}-${nomPropre(file.name, file.type)}`;

    const db = supabaseAdmin();
    if (db) {
      const { error } = await db.storage.from("media").upload(chemin, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "31536000",
      });
      if (error) throw new Error(error.message);
      const { data } = db.storage.from("media").getPublicUrl(chemin);
      return { ok: "Fichier téléversé.", url: data.publicUrl };
    }

    // Repli local : impossible sur un disque en lecture seule, on le dit.
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
      return {
        error:
          "Le téléversement local ne fonctionne pas en production. Configurez Supabase Storage.",
      };
    const dossier = join(process.cwd(), "public", "uploads");
    await mkdir(dossier, { recursive: true });
    await writeFile(join(dossier, chemin), Buffer.from(await file.arrayBuffer()));
    return { ok: "Fichier enregistré.", url: `/uploads/${chemin}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Échec." };
  }
}

// ------------------------------------------------------------------ amorçage

/** Recopie le catalogue de référence dans Supabase. À lancer une seule fois. */
export async function amorcerBase(): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();

    const { count } = await db
      .from("gammes")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0)
      throw new Error(
        "La base contient déjà des gammes. Videz-les avant de réamorcer.",
      );

    const { data: types, error: e0 } = await db
      .from("product_types")
      .insert(PRODUCT_TYPES.map(({ id: _id, ...t }) => t))
      .select("id, slug");
    if (e0) throw new Error(e0.message);
    const typeParSlug = new Map(types.map((t) => [t.slug, t.id]));
    const slugDeType = new Map(PRODUCT_TYPES.map((t) => [t.id, t.slug]));

    const { data: gammes, error: e1 } = await db
      .from("gammes")
      .insert(GAMMES.map(({ id: _id, ...g }) => g))
      .select("id, slug");
    if (e1) throw new Error(e1.message);
    const gammeParSlug = new Map(gammes.map((g) => [g.slug, g.id]));
    const slugDeGamme = new Map(GAMMES.map((g) => [g.id, g.slug]));

    const { data: produits, error: e2 } = await db
      .from("products")
      .insert(
        PRODUCTS.map((p) => ({
          slug: p.slug,
          name: p.name,
          type_id: typeParSlug.get(slugDeType.get(p.type_id) ?? "") ?? null,
          gamme_id: gammeParSlug.get(slugDeGamme.get(p.gamme_id) ?? "") ?? null,
          color_name: p.color_name,
          color_hex: p.color_hex,
          image: p.image,
          sort_order: p.sort_order,
          active: true,
        })),
      )
      .select("id, slug");
    if (e2) throw new Error(e2.message);

    const produitParSlug = new Map(produits.map((p) => [p.slug, p.id]));
    const variantes = PRODUCTS.flatMap((p) =>
      p.variants.map((v, i) => ({
        product_id: produitParSlug.get(p.slug)!,
        size_label: v.size_label,
        price_demi_gros: v.price_demi_gros,
        price_gros: v.price_gros,
        units_per_carton: v.units_per_carton,
        image: v.image,
        sort_order: i,
        active: true,
      })),
    );
    const { error: e3 } = await db.from("product_variants").insert(variantes);
    if (e3) throw new Error(e3.message);

    const { error: e4 } = await db.from("hero_slides").insert(
      HERO_SLIDES.map((s) => ({
        image: s.image,
        gamme_id: gammeParSlug.get(slugDeGamme.get(s.gamme_id) ?? "") ?? null,
        eyebrow: s.eyebrow,
        eyebrow_ar: s.eyebrow_ar,
        eyebrow_en: s.eyebrow_en,
        caption: s.caption,
        caption_ar: s.caption_ar,
        caption_en: s.caption_en,
        sort_order: s.sort_order,
      })),
    );
    if (e4) throw new Error(e4.message);

    const { error: e5 } = await db
      .from("videos")
      .insert(VIDEOS.map(({ id: _id, ...v }) => v));
    if (e5) throw new Error(e5.message);

    const { id: _sid, ...reglages } = SETTINGS;
    const { error: e6 } = await db
      .from("site_settings")
      .upsert({ id: "settings", ...reglages });
    if (e6) throw new Error(e6.message);

    return `Base amorcée : ${PRODUCT_TYPES.length} types, ${GAMMES.length} gammes, ${PRODUCTS.length} produits, ${variantes.length} formats.`;
  });
}
