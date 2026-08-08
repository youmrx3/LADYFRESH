"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminPassword, cookieOptions, isAdmin, issueToken } from "./auth";
import { GAMMES, HERO_SLIDES, PRODUCTS, SETTINGS, VIDEOS } from "./catalog";
import { setOrderStatus } from "./data";
import { supabaseAdmin } from "./supabase";
import type { OrderStatus } from "./types";

export type Retour = { ok?: string; error?: string };

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
  const saisi = String(formData.get("password") ?? "");
  if (saisi !== attendu) return { error: "Mot de passe incorrect." };

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
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  return tenter(async () => {
    await setOrderStatus(id, status);
    return "Statut mis à jour.";
  });
}

// -------------------------------------------------------------------- gammes

export async function enregistrerGamme(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const id = String(formData.get("id") ?? "");
    const valeurs = {
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      tagline: String(formData.get("tagline") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      color_hex: String(formData.get("color_hex") ?? "#000000"),
      color_name: String(formData.get("color_name") ?? "").trim(),
      cover_image: String(formData.get("cover_image") ?? "").trim(),
      sort_order: Number(formData.get("sort_order") ?? 0),
      active: formData.get("active") === "on",
    };
    if (!valeurs.name || !valeurs.slug) throw new Error("Nom et slug requis.");

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
      .eq("id", String(formData.get("id")));
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
    const id = String(formData.get("id") ?? "");
    const valeurs = {
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      type: String(formData.get("type") ?? "brume"),
      gamme_id: String(formData.get("gamme_id") ?? "") || null,
      color_name: String(formData.get("color_name") ?? "").trim(),
      color_hex: String(formData.get("color_hex") ?? "#000000"),
      image: String(formData.get("image") ?? "").trim(),
      sort_order: Number(formData.get("sort_order") ?? 0),
      active: formData.get("active") === "on",
    };
    if (!valeurs.name || !valeurs.slug) throw new Error("Nom et slug requis.");

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
      .eq("id", String(formData.get("id")));
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
    const id = String(formData.get("id") ?? "");
    const valeurs = {
      product_id: String(formData.get("product_id") ?? ""),
      size_label: String(formData.get("size_label") ?? "").trim(),
      price_demi_gros: Number(formData.get("price_demi_gros") ?? 0),
      price_gros: Number(formData.get("price_gros") ?? 0),
      units_per_carton: Number(formData.get("units_per_carton") ?? 12),
      image: String(formData.get("image") ?? "").trim(),
      active: formData.get("active") === "on",
    };
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
      .eq("id", String(formData.get("id")));
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
    const valeurs = {
      whatsapp_number: String(formData.get("whatsapp_number") ?? "").replace(
        /\D/g,
        "",
      ),
      min_gros_cartons: Math.max(1, Number(formData.get("min_gros_cartons") ?? 1)),
      min_demi_gros_pieces: Math.max(
        1,
        Number(formData.get("min_demi_gros_pieces") ?? 5),
      ),
      hero_eyebrow: String(formData.get("hero_eyebrow") ?? ""),
      hero_title: String(formData.get("hero_title") ?? ""),
      hero_lede: String(formData.get("hero_lede") ?? ""),
      contact_email: String(formData.get("contact_email") ?? ""),
      contact_phone: String(formData.get("contact_phone") ?? ""),
      contact_address: String(formData.get("contact_address") ?? ""),
      instagram_url: String(formData.get("instagram_url") ?? ""),
      facebook_url: String(formData.get("facebook_url") ?? ""),
      tiktok_url: String(formData.get("tiktok_url") ?? ""),
    };
    if (!valeurs.whatsapp_number)
      throw new Error("Le numéro WhatsApp est requis.");

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
    const id = String(formData.get("id") ?? "");
    const valeurs = {
      image: String(formData.get("image") ?? "").trim(),
      gamme_id: String(formData.get("gamme_id") ?? "") || null,
      eyebrow: String(formData.get("eyebrow") ?? "").trim(),
      caption: String(formData.get("caption") ?? "").trim(),
      sort_order: Number(formData.get("sort_order") ?? 0),
    };
    if (!valeurs.image) throw new Error("Une image est requise.");

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
      .eq("id", String(formData.get("id")));
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
    const id = String(formData.get("id") ?? "");
    const valeurs = {
      title: String(formData.get("title") ?? "").trim(),
      note: String(formData.get("note") ?? "").trim(),
      src: String(formData.get("src") ?? "").trim(),
      poster: String(formData.get("poster") ?? "").trim() || null,
      sort_order: Number(formData.get("sort_order") ?? 0),
    };
    if (!valeurs.src) throw new Error("Le fichier vidéo est requis.");

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
      .eq("id", String(formData.get("id")));
    if (error) throw new Error(error.message);
    return "Vidéo supprimée.";
  });
}

// ----------------------------------------------------------------- téléversement

/** Envoie un fichier dans le bucket `media` et renvoie son URL publique. */
export async function televerser(
  _prev: Retour & { url?: string },
  formData: FormData,
): Promise<Retour & { url?: string }> {
  try {
    const db = await garde();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0)
      return { error: "Choisissez un fichier." };
    if (file.size > 60 * 1024 * 1024)
      return { error: "Fichier trop lourd (60 Mo maximum)." };

    const propre = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const chemin = `${Date.now()}-${propre}`;
    const { error } = await db.storage
      .from("media")
      .upload(chemin, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);

    const { data } = db.storage.from("media").getPublicUrl(chemin);
    return { ok: "Fichier téléversé.", url: data.publicUrl };
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

    const { data: gammes, error: e1 } = await db
      .from("gammes")
      .insert(GAMMES.map(({ id: _id, ...g }) => g))
      .select("id, slug");
    if (e1) throw new Error(e1.message);

    const parSlug = new Map(gammes.map((g) => [g.slug, g.id]));
    const slugDeGamme = new Map(GAMMES.map((g) => [g.id, g.slug]));

    const { data: produits, error: e2 } = await db
      .from("products")
      .insert(
        PRODUCTS.map((p) => ({
          slug: p.slug,
          name: p.name,
          type: p.type,
          gamme_id: parSlug.get(slugDeGamme.get(p.gamme_id) ?? "") ?? null,
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
        gamme_id: parSlug.get(slugDeGamme.get(s.gamme_id) ?? "") ?? null,
        eyebrow: s.eyebrow,
        caption: s.caption,
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

    return `Base amorcée : ${GAMMES.length} gammes, ${PRODUCTS.length} produits, ${variantes.length} formats.`;
  });
}
