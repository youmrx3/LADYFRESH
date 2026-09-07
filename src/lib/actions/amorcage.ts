"use server";

import {
  GAMMES,
  HERO_SLIDES,
  PRODUCTS,
  PRODUCT_TYPES,
  SETTINGS,
  VIDEOS,
} from "../catalog";
import { fill } from "@/i18n";
import { garde, messages, tenter, type Retour } from "./_socle";

// ------------------------------------------------------------------ amorçage

/** Recopie le catalogue de référence dans Supabase. À lancer une seule fois. */
export async function amorcerBase(): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();

    /*
      Le contrôle portait sur les gammes, alors que la première écriture porte
      sur les types : une base aux gammes vidées mais aux types intacts passait
      le contrôle, puis échouait sur un slug en double, avec un message Postgres
      brut — là où cette fonction sait par ailleurs expliquer ses refus.
    */
    for (const table of ["product_types", "gammes"] as const) {
      const { count } = await db.from(table).select("id", { count: "exact", head: true });
      if ((count ?? 0) > 0)
        throw new Error(m.baseDejaAmorcee);
    }

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

    return fill(m.baseAmorcee, {
      types: PRODUCT_TYPES.length,
      gammes: GAMMES.length,
      produits: PRODUCTS.length,
      formats: variantes.length,
    });
  });
}
