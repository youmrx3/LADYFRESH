"use server";

import { garde, langue, mot, tenter, traduits, type Retour } from "./_socle";

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
      image: mot(formData, "image"),
      active: formData.get("active") === "on",
    };
    if (!valeurs.product_id) throw new Error("Choisissez un produit.");
    if (!valeurs.size_label) throw new Error("Le format est requis.");

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
