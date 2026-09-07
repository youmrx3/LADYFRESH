"use server";

import { fill } from "@/i18n";
import { oublierMedias, oublierRemplacee } from "../media";
import {
  garde,
  langue,
  lireLigne,
  messages,
  mot,
  tenter,
  traduits,
  type Retour,
} from "./_socle";

/*
  Deux gestes reviennent partout dans ce fichier, et tous deux demandent la
  ligne telle qu'elle est enregistrée.

  Le premier est le garde-fou de `traduits()` : un texte identique mot pour mot
  au français n'est pas une traduction, et l'enregistrer dans la colonne arabe
  éteint le repli pour toujours — la page arabe affiche alors du français sans
  que rien ne le dise. Le formulaire est bien corrigé, mais un onglet resté
  ouvert, un retour en arrière du navigateur ou un brouillon restauré renvoient
  encore l'ancien contenu. Le garde-fou existait ; il n'était branché que sur
  les réglages et la page de campagne.

  Le second est le ménage du stockage : remplacer une photo laissait l'ancienne
  dans le bucket pour toujours.
*/

// -------------------------------------------------------- types de produits

export async function enregistrerType(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const actuel = await lireLigne(db, "product_types", id);
    const valeurs: Record<string, unknown> = traduits(
      formData,
      ["name", "short_name"],
      actuel,
    );
    if (lang === "fr") {
      valeurs.slug = mot(formData, "slug");
      valeurs.sort_order = Number(formData.get("sort_order") ?? 0);
      valeurs.active = formData.get("active") === "on";
      if (!valeurs.slug) throw new Error(m.slugRequis);
      if (!valeurs.name) throw new Error(m.nomRequis);
    }

    const { error } = id
      ? await db.from("product_types").update(valeurs).eq("id", id)
      : await db.from("product_types").insert(valeurs);
    if (error) throw new Error(error.message);
    return id ? m.typeEnregistre : m.typeCree;
  });
}

export async function supprimerType(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");

    // Un type encore porté par des produits ne peut pas partir : on l'explique
    // plutôt que de laisser remonter une erreur de contrainte SQL.
    const { count } = await db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("type_id", id);
    if ((count ?? 0) > 0)
      throw new Error(fill(m.typeUtiliseN, { n: count ?? 0 }));

    const { error } = await db.from("product_types").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return m.typeSupprime;
  });
}

// -------------------------------------------------------------------- gammes

export async function enregistrerGamme(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const lang = langue(formData);

    const actuel = await lireLigne(db, "gammes", id);
    const valeurs: Record<string, unknown> = traduits(
      formData,
      ["tagline", "description"],
      actuel,
    );
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
      if (!valeurs.name || !valeurs.slug) throw new Error(m.nomEtSlugRequis);
    }

    const { error } = id
      ? await db.from("gammes").update(valeurs).eq("id", id)
      : await db.from("gammes").insert(valeurs);
    if (error) throw new Error(error.message);
    if (lang === "fr")
      await oublierRemplacee(db, actuel?.cover_image as string, valeurs.cover_image as string);
    return id ? m.gammeEnregistree : m.gammeCreee;
  });
}

export async function supprimerGamme(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");

    /*
      La suppression est en cascade : produits et formats partent avec la gamme,
      et leurs photos deviendraient orphelines. On les relève avant, tant que
      les lignes existent encore.
    */
    const { data: emportes } = await db
      .from("products")
      .select("image, variants:product_variants(image)")
      .eq("gamme_id", id);
    const actuelle = await lireLigne(db, "gammes", id);

    const { error } = await db.from("gammes").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await oublierMedias(db, [
      actuelle?.cover_image as string,
      ...((emportes ?? []) as { image: string; variants: { image: string }[] }[]).flatMap(
        (p) => [p.image, ...(p.variants ?? []).map((v) => v.image)],
      ),
    ]);
    return m.gammeSupprimee;
  });
}

// ------------------------------------------------------------------ produits

export async function enregistrerProduit(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
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
    if (!valeurs.slug) throw new Error(m.slugRequis);
    if (!valeurs.type_id) throw new Error(m.choisirType);
    if (!valeurs.gamme_id) throw new Error(m.choisirGamme);

    const actuel = await lireLigne(db, "products", id);
    const { error } = id
      ? await db.from("products").update(valeurs).eq("id", id)
      : await db.from("products").insert(valeurs);
    if (error) throw new Error(error.message);
    await oublierRemplacee(db, actuel?.image as string, valeurs.image);
    return id ? m.produitEnregistre : m.produitCree;
  });
}

export async function supprimerProduit(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");

    // Les formats partent en cascade : leurs photos aussi doivent partir.
    const { data: formats } = await db
      .from("product_variants")
      .select("image")
      .eq("product_id", id);
    const actuel = await lireLigne(db, "products", id);

    const { error } = await db.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await oublierMedias(db, [
      actuel?.image as string,
      ...((formats ?? []) as { image: string }[]).map((v) => v.image),
    ]);
    return m.produitSupprime;
  });
}

export async function enregistrerVariante(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    /* Arrondi à la saisie : le dinar ne se manipule pas en centimes au
       comptoir, et un prix à décimales faisait diverger l'affichage du total
       enregistré — voir `lineTotal`. */
    const prix = Math.round(Number(formData.get("price_demi_gros") ?? 0));
    const valeurs = {
      product_id: mot(formData, "product_id"),
      size_label: mot(formData, "size_label"),
      price_demi_gros: prix,
      /*
        `price_gros` est un vestige : la boutique ne vend plus qu'au détail, et
        le champ a disparu du formulaire. La colonne, elle, reste « not null »
        sans valeur par défaut — ne plus l'écrire faisait échouer toute création
        de format sur un refus de la base. On y recopie le prix de vente plutôt
        qu'un zéro : la colonne garde ainsi un sens si on la relit un jour.
      */
      price_gros: prix,
      image: mot(formData, "image"),
      active: formData.get("active") === "on",
    };
    if (!valeurs.product_id) throw new Error(m.choisirProduit);
    if (!valeurs.size_label) throw new Error(m.formatRequis);
    /*
      Un prix laissé vide vaut `Number("") === 0`, et la contrainte SQL
      (`price_demi_gros >= 0`) accepte zéro : le format partait alors en vitrine
      à 0 DA, et `composer()` reprenait fidèlement ce prix — c'est son rôle. La
      commande se réglait à zéro sans que rien ne l'ait signalé.

      Le chemin des coffrets fait ce contrôle depuis toujours ; il manquait ici.
    */
    if (!(prix > 0)) throw new Error(m.prixPositif);

    const actuel = await lireLigne(db, "product_variants", id);
    const { error } = id
      ? await db.from("product_variants").update(valeurs).eq("id", id)
      : await db.from("product_variants").insert(valeurs);
    if (error) throw new Error(error.message);
    await oublierRemplacee(db, actuel?.image as string, valeurs.image);
    return id ? m.formatEnregistre : m.formatAjoute;
  });
}

export async function supprimerVariante(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const actuel = await lireLigne(db, "product_variants", id);

    const { error } = await db.from("product_variants").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await oublierMedias(db, [actuel?.image as string]);
    return m.formatSupprime;
  });
}

// -------------------------------------------------------------------- packs

export async function enregistrerPack(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const lang = langue(formData);

    /*
      Le prix, la photo et le slug ne dépendent pas de la langue : ils ne
      s'écrivent que depuis le français, sinon une visite dans l'onglet arabe
      les remettrait à zéro.
    */
    const actuel = await lireLigne(db, "packs", id);
    const valeurs: Record<string, unknown> = traduits(
      formData,
      ["name", "tagline", "description"],
      actuel,
    );

    if (lang === "fr") {
      // Arrondis à la saisie, pour la même raison que les formats.
      const prix = Math.round(Number(formData.get("price") ?? 0));
      const barre = Math.round(Number(formData.get("prix_barre") ?? 0));
      if (!mot(formData, "slug")) throw new Error(m.slugRequis);
      if (!(prix > 0)) throw new Error(m.prixCoffretPositif);
      if (barre && barre <= prix)
        throw new Error(m.prixBarreSuperieur);
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

    if (lang === "fr")
      await oublierRemplacee(db, actuel?.image as string, valeurs.image as string);
    return id ? m.coffretEnregistre : m.coffretCree;
  });
}

export async function supprimerPack(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  return tenter(async () => {
    const db = await garde();
    const m = await messages();
    const id = mot(formData, "id");
    const actuel = await lireLigne(db, "packs", id);

    // `pack_items` porte un `on delete cascade` : la composition part avec.
    const { error } = await db.from("packs").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await oublierMedias(db, [actuel?.image as string]);
    return m.coffretSupprime;
  });
}
