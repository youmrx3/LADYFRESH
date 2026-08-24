"use server";

import { isAdmin } from "../auth";
import { writeLocalSettings } from "../data";
import { supabaseAdmin } from "../supabase";
import { isLocale } from "@/i18n/config";
import {
  garde,
  langue,
  mot,
  tenter,
  texte,
  traduits,
  type Retour,
} from "./_socle";

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
      Object.assign(valeurs, {
        locale: isLocale(mot(formData, "locale")) ? mot(formData, "locale") : "fr",
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

// ------------------------------------------------------------ page campagne

/**
 * Les réglages de /boutique.
 *
 * Séparés de ceux du site : une campagne se retouche entre deux publicités,
 * et mêler ces champs aux coordonnées de la maison obligerait à traverser un
 * formulaire de quinze entrées pour changer un titre.
 */
export async function enregistrerCampagne(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const lang = langue(formData);

    const valeurs: Record<string, unknown> = traduits(formData, [
      "camp_bandeau",
      "camp_eyebrow",
      "camp_titre",
      "camp_lede",
      "camp_cta",
      "camp_gages",
    ]);

    // Photo et interrupteur ne se traduisent pas : édités depuis le français.
    if (lang === "fr") {
      Object.assign(valeurs, {
        camp_image: mot(formData, "camp_image"),
        camp_bandeau_actif: formData.get("camp_bandeau_actif") === "on",
      });
    }

    const { error } = await db
      .from("site_settings")
      .upsert({ id: "settings", ...valeurs });
    if (error) throw new Error(error.message);
    return "Page de campagne enregistrée.";
  });
}
