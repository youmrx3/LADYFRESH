"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminPassword, cookieOptions, isAdmin, issueToken } from "./auth";
import {
  GAMMES,
  HERO_SLIDES,
  PRODUCTS,
  PRODUCT_TYPES,
  SETTINGS,
  VIDEOS,
} from "./catalog";
import { setOrderStatus } from "./data";
import { supabaseAdmin } from "./supabase";
import { isLocale, type Locale } from "@/i18n/config";
import type { OrderStatus } from "./types";

export type Retour = { ok?: string; error?: string };

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
  revalidatePath("/", "layout");
}

async function tenter(action: () => Promise<string>): Promise<Retour> {
  try {
    const ok = await action();
    rafraichir();
    return { ok };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Échec." };
  }
}

// ----------------------------------------------------------------- connexion

export async function seConnecter(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const attendu = adminPassword();
  if (!attendu) {
    return {
      error:
        "ADMIN_PASSWORD n'est pas défini. Ajoutez-le dans .env.local puis relancez le serveur.",
    };
  }
  if (mot(formData, "password") !== attendu)
    return { error: "Mot de passe incorrect." };

  const store = await cookies();
  store.set(ADMIN_COOKIE, issueToken(), cookieOptions);
  redirect("/admin");
}

export async function seDeconnecter() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
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
    const db = await garde();
    const lang = langue(formData);

    const valeurs: Record<string, unknown> = traduits(formData, [
      "hero_eyebrow",
      "hero_title",
      "hero_lede",
    ]);
    if (lang === "fr") {
      const numero = mot(formData, "whatsapp_number").replace(/\D/g, "");
      if (!numero) throw new Error("Le numéro WhatsApp est requis.");
      Object.assign(valeurs, {
        whatsapp_number: numero,
        min_gros_cartons: Math.max(1, Number(formData.get("min_gros_cartons") ?? 1)),
        min_demi_gros_pieces: Math.max(
          1,
          Number(formData.get("min_demi_gros_pieces") ?? 5),
        ),
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

    const propre = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
    const chemin = `${Date.now()}-${propre}`;

    const db = supabaseAdmin();
    if (db) {
      const { error } = await db.storage
        .from("media")
        .upload(chemin, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      const { data } = db.storage.from("media").getPublicUrl(chemin);
      return { ok: "Fichier téléversé.", url: data.publicUrl };
    }

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
