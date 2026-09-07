"use server";

import { isAdmin } from "../auth";
import { getSettingsAdmin, writeLocalSettings } from "../data";
import { oublierMedias, oublierRemplacee } from "../media";
import { supabaseAdmin } from "../supabase";
import { isLocale } from "@/i18n/config";
import {
  garde,
  langue,
  lireLigne,
  messages,
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
    const m = await messages();

    const actuel = await getSettingsAdmin();
    const valeurs: Record<string, unknown> = traduits(
      formData,
      ["hero_eyebrow", "hero_title", "hero_lede"],
      actuel as unknown as Record<string, unknown>,
    );
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
    return m.reglagesEnregistres;
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
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };

  const cible = mot(formData, "locale");
  if (!isLocale(cible)) return { error: m.langueInconnue };

  return tenter(async () => {
    const db = supabaseAdmin();
    if (db) {
      const { error } = await db
        .from("site_settings")
        .upsert({ id: "settings", locale: cible });
      if (error) throw new Error(error.message);
    } else if (!writeLocalSettings({ locale: cible })) {
      throw new Error(m.langueNonEnregistree);
    }
    /*
      Le message est celui de la langue *quittée*, pas de la nouvelle : il est
      lu avant l'écriture, et c'est voulu — on le lit encore dans la langue où
      l'on vient de cliquer, avant que la page ne bascule.
    */
    return m.langueEnregistree;
  });
}

export async function enregistrerSlide(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const actuel = await lireLigne(db, "hero_slides", id);
    const valeurs: Record<string, unknown> = traduits(
      formData,
      ["eyebrow", "caption"],
      actuel,
    );
    if (lang === "fr") {
      Object.assign(valeurs, {
        image: mot(formData, "image"),
        gamme_id: mot(formData, "gamme_id") || null,
        sort_order: Number(formData.get("sort_order") ?? 0),
      });
      if (!valeurs.image) throw new Error(m.imageRequise);
    }

    const { error } = id
      ? await db.from("hero_slides").update(valeurs).eq("id", id)
      : await db.from("hero_slides").insert(valeurs);
    if (error) throw new Error(error.message);
    if (lang === "fr")
      await oublierRemplacee(db, actuel?.image as string, valeurs.image as string);
    return id ? m.visuelEnregistre : m.visuelAjoute;
  });
}

export async function supprimerSlide(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const actuel = await lireLigne(db, "hero_slides", id);

    const { error } = await db.from("hero_slides").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await oublierMedias(db, [actuel?.image as string]);
    return m.visuelSupprime;
  });
}

export async function enregistrerVideo(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const actuel = await lireLigne(db, "videos", id);
    const valeurs: Record<string, unknown> = traduits(
      formData,
      ["title", "note"],
      actuel,
    );
    if (lang === "fr") {
      Object.assign(valeurs, {
        src: mot(formData, "src"),
        poster: texte(formData, "poster"),
        sort_order: Number(formData.get("sort_order") ?? 0),
      });
      if (!valeurs.src) throw new Error(m.videoRequise);
    }

    const { error } = id
      ? await db.from("videos").update(valeurs).eq("id", id)
      : await db.from("videos").insert(valeurs);
    if (error) throw new Error(error.message);
    if (lang === "fr") {
      await oublierRemplacee(db, actuel?.src as string, valeurs.src as string);
      await oublierRemplacee(db, actuel?.poster as string, valeurs.poster as string);
    }
    return id ? m.videoEnregistree : m.videoAjoutee;
  });
}

export async function supprimerVideo(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const actuel = await lireLigne(db, "videos", id);

    const { error } = await db.from("videos").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await oublierMedias(db, [actuel?.src as string, actuel?.poster as string]);
    return m.videoSupprimee;
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
    const m = await messages();
    const lang = langue(formData);

    const actuel = await getSettingsAdmin();
    const valeurs: Record<string, unknown> = traduits(
      formData,
      [
        "camp_bandeau",
        "camp_eyebrow",
        "camp_titre",
        "camp_lede",
        "camp_cta",
        "camp_gages",
      ],
      actuel as unknown as Record<string, unknown>,
    );

    // Photo, interrupteur et langue ne se traduisent pas : édités du français.
    if (lang === "fr") {
      const cible = mot(formData, "locale_boutique");
      Object.assign(valeurs, {
        camp_image: mot(formData, "camp_image"),
        camp_bandeau_actif: formData.get("camp_bandeau_actif") === "on",
        /* Vide — ou valeur inconnue — veut dire « suivre la langue du site ». */
        locale_boutique: isLocale(cible) ? cible : "",
      });
    }

    const { error } = await db
      .from("site_settings")
      .upsert({ id: "settings", ...valeurs });
    if (error) throw new Error(error.message);
    return m.campagneEnregistree;
  });
}
