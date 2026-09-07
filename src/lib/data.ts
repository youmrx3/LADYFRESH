import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { unstable_cache } from "next/cache";
import {
  GAMMES,
  HERO_SLIDES,
  PRODUCTS,
  PRODUCT_TYPES,
  SETTINGS,
  VIDEOS,
} from "./catalog";
import { supabaseAdmin, supabaseRead } from "./supabase";
import type {
  Gamme,
  HeroSlide,
  Order,
  OrderStatus,
  Pack,
  Product,
  ProductType,
  Prospect,
  ProspectStatus,
  TarifLivraison,
  SiteSettings,
  Variant,
  Video,
} from "./types";

/**
 * Chaque lecture retombe sur le catalogue de référence quand Supabase est
 * injoignable ou absent : la boutique ne rend jamais une page vide. Les échecs
 * sont journalisés, pas levés — une base en panne ne doit pas fermer le
 * magasin.
 */
function fallback<T>(label: string, seed: T, error?: unknown): T {
  if (error) console.warn(`[data] ${label} : repli sur le catalogue —`, error);
  return seed;
}

/**
 * Le catalogue change quelques fois par mois, mais il était relu à chaque
 * requête : six allers-retours Supabase pour afficher une page. On le met en
 * cache sous une étiquette unique, que les actions d'admin invalident après
 * chaque écriture — les changements restent donc immédiats.
 */
export const ETIQUETTE_CATALOGUE = "catalogue";

/*
  Le wrapper est construit à la première lecture, pas au chargement du module.
  Créé au niveau module, `unstable_cache` s'installait dès l'import de ce
  fichier — y compris depuis actions.ts — et l'action de connexion se
  retrouvait alors hors portée de requête : `cookies()` levait
  « called outside a request scope » et la page rendait une 500.
*/
const wrappers = new Map<string, (...args: never[]) => Promise<unknown>>();

function enCache<T>(cle: string, lire: () => Promise<T>): () => Promise<T> {
  return () => {
    let wrapper = wrappers.get(cle);
    if (!wrapper) {
      wrapper = unstable_cache(lire, ["catalogue", cle], {
        tags: [ETIQUETTE_CATALOGUE],
        revalidate: 300,
      }) as (...args: never[]) => Promise<unknown>;
      wrappers.set(cle, wrapper);
    }
    return wrapper() as Promise<T>;
  };
}

/*
  Vitrine et back-office ne lisent pas la même chose.

  La vitrine ne montre que ce qui est vendable : actif, et pourvu d'au moins un
  format. Le back-office doit tout voir, y compris ce qui ne l'est pas encore —
  sinon un produit créé sans format disparaît à la seconde où il est
  enregistré, ne peut plus être sélectionné pour recevoir un format, et reste
  bloqué là pour toujours. Même impasse pour tout ce qu'on décoche : masquer
  une gamme revenait à ne plus jamais pouvoir la réafficher.
*/
async function lireGammes(tout: boolean): Promise<Gamme[]> {
  const db = supabaseRead();
  if (!db) return GAMMES;
  let requete = db.from("gammes").select("*");
  if (!tout) requete = requete.eq("active", true);
  const { data, error } = await requete.order("sort_order");
  if (error || !data?.length) return fallback("gammes", GAMMES, error);
  return data as Gamme[];
}

async function getGammesBrut(): Promise<Gamme[]> {
  return lireGammes(false);
}

/** Lecture back-office : tout, y compris les gammes masquées. */
export async function getGammesAdmin(): Promise<Gamme[]> {
  return lireGammes(true);
}

async function getProductTypesBrut(): Promise<ProductType[]> {
  const db = supabaseRead();
  if (!db) return PRODUCT_TYPES;
  const { data, error } = await db
    .from("product_types")
    .select("*")
    .order("sort_order");
  if (error || !data?.length) return fallback("product_types", PRODUCT_TYPES, error);
  return data as ProductType[];
}

async function lireProduits(tout: boolean): Promise<Product[]> {
  const db = supabaseRead();
  if (!db) return PRODUCTS;
  let requete = db.from("products").select("*, variants:product_variants(*)");
  if (!tout) requete = requete.eq("active", true);
  const { data, error } = await requete.order("sort_order");
  if (error || !data?.length) return fallback("products", PRODUCTS, error);

  const produits = (data as Product[]).map((p) => ({
    ...p,
    variants: (p.variants ?? [])
      .filter((v: Variant) => tout || v.active)
      .sort((a: Variant, b: Variant) => a.size_label.localeCompare(b.size_label)),
  }));

  // Un produit sans format n'a pas de prix : invendable, donc absent de la
  // vitrine — mais bien présent dans le back-office, qui doit pouvoir lui en
  // ajouter un.
  return tout ? produits : produits.filter((p) => p.variants.length > 0);
}

async function getProductsBrut(): Promise<Product[]> {
  return lireProduits(false);
}

/** Lecture back-office : tout, formats manquants et éléments masqués compris. */
export async function getProductsAdmin(): Promise<Product[]> {
  return lireProduits(true);
}

/**
 * Le jeu de secours recouvrait la ligne enregistrée, traductions comprises.
 *
 * C'est ce qui rendait la boutique impossible à modifier en arabe. `SETTINGS`
 * embarque dix-huit traductions figées dans le code — l'arabe du texte
 * d'origine. Une colonne `_ar` vide était donc remplacée par cet arabe-là :
 * on changeait le titre français, on repassait le site en arabe, et l'ancien
 * titre revenait. Deux champs traduits en base, trois retombés sur le code, et
 * la page mélangeait les deux époques.
 *
 * La règle est maintenant celle-ci. Une traduction enregistrée gagne toujours.
 * Absente, le texte de secours ne sert que si le français n'a pas bougé depuis
 * — sinon il traduirait une phrase qui n'existe plus, et mieux vaut alors
 * afficher le français, que `champ()` reprend tout seul. Un site fraîchement
 * installé garde ainsi ses trois langues ; un site modifié dit la vérité.
 */
function fusionnerReglages(row: Record<string, unknown>): SiteSettings {
  const seed = SETTINGS as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...seed };
  const rempli = (v: unknown) => v !== null && v !== undefined && v !== "";
  const nu = (v: unknown) => (typeof v === "string" ? v.trim() : v);

  for (const [cle, valeur] of Object.entries(row)) {
    const traduction = /_(ar|en)$/.test(cle);

    if (!traduction) {
      // Vider un texte de base rend le libellé d'origine : une vitrine sans
      // titre serait pire que le titre par défaut.
      if (rempli(valeur)) out[cle] = valeur;
      continue;
    }

    if (rempli(valeur)) {
      out[cle] = valeur;
      continue;
    }
    const base = cle.replace(/_(ar|en)$/, "");
    out[cle] = nu(row[base]) === nu(seed[base]) ? seed[cle] : null;
  }

  return out as SiteSettings;
}

async function getSettingsBrut(): Promise<SiteSettings> {
  const db = supabaseRead();
  if (!db) return { ...SETTINGS, ...readLocalSettings() };
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .eq("id", "settings")
    .maybeSingle();
  if (error || !data) return fallback("settings", { ...SETTINGS, ...readLocalSettings() }, error);
  return fusionnerReglages(data as Record<string, unknown>);
}

/**
 * Les réglages tels qu'ils sont réellement enregistrés.
 *
 * `getSettings()` recouvre la ligne d'un jeu de textes de secours, pour qu'un
 * site tout neuf ne s'ouvre pas sur des blancs. C'est juste en vitrine et
 * trompeur dans un formulaire : une traduction arabe absente y apparaissait
 * remplie du texte de secours, indiscernable d'une traduction écrite à la
 * main — et le premier enregistrement la gravait en base.
 *
 * Ici, vide reste vide. Le back-office montre ce qui est écrit, pas ce que la
 * vitrine affichera faute de mieux.
 */
export async function getSettingsAdmin(): Promise<SiteSettings> {
  const db = supabaseAdmin();
  if (!db) return { ...SETTINGS, ...readLocalSettings() };
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .eq("id", "settings")
    .maybeSingle();
  if (error || !data) return { ...SETTINGS, ...readLocalSettings() };
  /* Pas de `stripEmpty` : une colonne vide doit rester vide à l'écran. Le jeu
     de secours ne sert qu'aux colonnes que la base ne connaît pas encore. */
  return { ...SETTINGS, ...(data as Record<string, unknown>) } as SiteSettings;
}

async function getHeroSlidesBrut(): Promise<HeroSlide[]> {
  const db = supabaseRead();
  if (!db) return HERO_SLIDES;
  const { data, error } = await db.from("hero_slides").select("*").order("sort_order");
  if (error || !data?.length) return fallback("hero_slides", HERO_SLIDES, error);
  return data as HeroSlide[];
}

async function getVideosBrut(): Promise<Video[]> {
  const db = supabaseRead();
  if (!db) return VIDEOS;
  const { data, error } = await db.from("videos").select("*").order("sort_order");
  if (error || !data?.length) return fallback("videos", VIDEOS, error);
  return data as Video[];
}

// --------------------------------------------------------------------- orders

/**
 * Orders placed while Supabase is unconfigured land in a local JSON file, so
 * the whole flow — shop, checkout, admin — is testable before the database
 * exists. Next.js bundles the API route and the pages separately, so an
 * in-memory array would not be shared between them; the file is.
 *
 * C'est un filet de développement. Il exige un disque inscriptible et une
 * seule instance : sur Vercel, ni l'un ni l'autre. Le repli échoue donc
 * bruyamment plutôt que de rendre une référence de commande pour une commande
 * qui n'existe nulle part.
 */
const LOCAL_ORDERS = join(process.cwd(), ".data", "orders.json");

/** Vercel et consorts exposent un disque en lecture seule hors /tmp. */
const SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function readLocalOrders(): Order[] {
  try {
    return JSON.parse(readFileSync(LOCAL_ORDERS, "utf8")) as Order[];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: Order[]) {
  try {
    mkdirSync(dirname(LOCAL_ORDERS), { recursive: true });
    writeFileSync(LOCAL_ORDERS, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.warn("[data] commande non persistée (fichier illisible) —", error);
    return false;
  }
}

/**
 * Réglages en repli local, même principe et mêmes limites que les commandes :
 * utile pour régler la langue et prévisualiser avant Supabase, inutilisable
 * en production.
 */
const LOCAL_SETTINGS = join(process.cwd(), ".data", "settings.json");

function readLocalSettings(): Partial<SiteSettings> {
  try {
    return JSON.parse(readFileSync(LOCAL_SETTINGS, "utf8")) as Partial<SiteSettings>;
  } catch {
    return {};
  }
}

export function writeLocalSettings(patch: Partial<SiteSettings>) {
  if (SERVERLESS) return false;
  try {
    mkdirSync(dirname(LOCAL_SETTINGS), { recursive: true });
    writeFileSync(
      LOCAL_SETTINGS,
      JSON.stringify({ ...readLocalSettings(), ...patch }, null, 2),
    );
    return true;
  } catch (error) {
    console.warn("[data] réglages non enregistrés localement —", error);
    return false;
  }
}

export function ordersArePersisted() {
  return Boolean(supabaseAdmin());
}

export async function createOrder(order: Omit<Order, "id">): Promise<Order> {
  const db = supabaseAdmin();
  if (!db) {
    // Rendre une référence pour une commande qu'on n'a pas su écrire, c'est
    // perdre un client sans le savoir. On échoue, l'API renvoie une erreur.
    if (SERVERLESS)
      throw new Error(
        "Aucune base configurée et disque en lecture seule : la commande ne peut pas être enregistrée.",
      );
    const local = { ...order, id: order.ref };
    if (!writeLocalOrders([local, ...readLocalOrders()].slice(0, 500)))
      throw new Error("La commande n'a pas pu être écrite sur le disque local.");
    return local;
  }

  const { data, error } = await db
    .from("orders")
    .insert({
      ref: order.ref,
      customer_name: order.customer_name,
      phone: order.phone,
      wilaya: order.wilaya,
      address: order.address,
      note: order.note,
      channel: order.channel,
      source: order.source,
      purchase_type: order.purchase_type,
      /* Recopiés et non recalculés : une grille modifiée la semaine suivante
         ne doit pas réécrire ce qu'une cliente a accepté de payer. */
      livraison_mode: order.livraison_mode,
      livraison_prix: order.livraison_prix,
      total: order.total,
      status: order.status,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const items = order.items.map((i) => ({
    order_id: data.id,
    variant_id: isUuid(i.variant_id) ? i.variant_id : null,
    product_name: i.product_name,
    gamme_name: i.gamme_name,
    size_label: i.size_label,
    unit_price: i.unit_price,
    quantity: i.quantity,
    units_per_carton: i.units_per_carton,
    line_total: i.line_total,
  }));
  const { error: itemsError } = await db.from("order_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  return { ...order, id: data.id };
}

/*
  Le plafond était de trois cents lignes, sans pagination ni avertissement :
  passé ce seuil, les commandes les plus anciennes disparaissaient de l'écran
  comme si elles n'existaient pas. Mille commandes en trois jours rendaient la
  chose certaine. On lit désormais par tranches, et l'appelant sait s'il en
  reste.
*/
export const PAR_PAGE = 50;

export async function getOrders(
  { page = 0, statut }: { page?: number; statut?: OrderStatus } = {},
): Promise<{ orders: Order[]; total: number }> {
  const db = supabaseAdmin();
  if (!db) {
    const tout = readLocalOrders();
    return { orders: tout.slice(page * PAR_PAGE, (page + 1) * PAR_PAGE), total: tout.length };
  }

  let requete = db
    .from("orders")
    .select("*, items:order_items(*)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (statut) requete = requete.eq("status", statut);

  const { data, error, count } = await requete.range(
    page * PAR_PAGE,
    page * PAR_PAGE + PAR_PAGE - 1,
  );
  if (error) return { orders: fallback("orders", readLocalOrders(), error), total: 0 };
  return { orders: (data ?? []) as Order[], total: count ?? 0 };
}

/**
 * Les compteurs par état, sans rapatrier les lignes.
 *
 * Compter à partir des commandes chargées ne compterait que la page affichée.
 */
export async function compterCommandes(): Promise<Record<string, number>> {
  const db = supabaseAdmin();
  if (!db) {
    const tout = readLocalOrders();
    return tout.reduce<Record<string, number>>(
      (acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      { tous: tout.length },
    );
  }
  const out: Record<string, number> = {};
  for (const s of ["nouvelle", "confirmee", "retour"] as const) {
    const { count } = await db
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", s);
    out[s] = count ?? 0;
  }

  /*
    Le total ne se déduit pas de la somme des trois : d'anciennes commandes
    peuvent encore porter un état d'avant la migration, et l'onglet « Toutes »
    doit les compter — sinon elles n'apparaîtraient nulle part.
  */
  const { count } = await db
    .from("orders")
    .select("*", { count: "exact", head: true });
  out.tous = count ?? 0;

  return out;
}

/**
 * Supprime une commande. Les lignes partent avec elle : `order_items` porte
 * un `on delete cascade` vers `orders`.
 */
export async function deleteOrder(id: string) {
  const db = supabaseAdmin();
  if (!db) {
    const restantes = readLocalOrders().filter((o) => o.id !== id);
    if (!writeLocalOrders(restantes))
      throw new Error("Fichier local en lecture seule : commande non supprimée.");
    return;
  }
  const { error } = await db.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  const db = supabaseAdmin();
  if (!db) {
    const orders = readLocalOrders();
    const found = orders.find((o) => o.id === id);
    if (!found) throw new Error("Commande introuvable.");
    found.status = status;
    if (!writeLocalOrders(orders))
      throw new Error("Fichier local en lecture seule : statut non enregistré.");
    return;
  }
  const { error } = await db.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------- pistes

/*
  Les pistes n'ont pas de repli sur fichier local, contrairement aux commandes.

  Une commande perdue est un client perdu : il fallait un filet. Une piste est
  déjà, par nature, une commande qui n'a pas eu lieu — la perdre parce que la
  base n'est pas branchée ne coûte rien de plus, et un fichier de numéros de
  téléphone traînant sur le disque en coûterait, lui, beaucoup.
*/

/** Vrai si la table `prospects` existe : le SQL a-t-il été passé ? */
function tableAbsente(error: { message?: string; code?: string } | null) {
  const m = error?.message ?? "";
  return error?.code === "42P01" || /could not find the table|does not exist/i.test(m);
}

export async function enregistrerPiste(
  piste: Omit<Prospect, "id" | "created_at" | "updated_at" | "status">,
): Promise<{ ok: boolean; tableManquante?: boolean }> {
  const db = supabaseAdmin();
  if (!db) return { ok: false };

  /*
    Reprise sur `piste_id` : la même visite met à jour sa ligne au lieu d'en
    créer une par frappe. Le statut n'est pas touché — une piste déjà rappelée
    ne doit pas repasser « ouverte » parce que la personne revient regarder.
  */
  const { error } = await db
    .from("prospects")
    .upsert(
      { ...piste, updated_at: new Date().toISOString() },
      { onConflict: "piste_id" },
    );

  if (error) {
    if (tableAbsente(error)) {
      console.error(
        "[pistes] table `prospects` absente — exécutez supabase/schema.sql. Piste non enregistrée.",
      );
      return { ok: false, tableManquante: true };
    }
    console.error("[pistes] enregistrement impossible —", error.message);
    return { ok: false };
  }

  /*
    Une cliente qui a déjà commandé reste « convertie » pour toujours, et son
    nouveau panier abandonné n'apparaissait donc jamais dans la liste d'appels :
    la meilleure cliente était précisément celle qu'on ne rappelait plus.

    Un nouveau panier de sa part rouvre la piste. Seules les converties sont
    concernées : une piste marquée « rappelée » ne se rouvre pas toute seule
    pendant que la propriétaire est encore au téléphone.
  */
  await db
    .from("prospects")
    .update({ status: "ouverte" })
    .eq("piste_id", piste.piste_id)
    .eq("status", "convertie");

  return { ok: true };
}

/** Le client a fini par commander : la piste n'est plus à rappeler. */
export async function pisteConvertie(pisteId: string) {
  const db = supabaseAdmin();
  if (!db || !pisteId) return;
  const { error } = await db
    .from("prospects")
    .update({ status: "convertie", updated_at: new Date().toISOString() })
    .eq("piste_id", pisteId);
  // Best-effort : une piste non marquée ne doit jamais faire échouer une vente.
  if (error && !tableAbsente(error))
    console.error("[pistes] marquage converti impossible —", error.message);
}

export async function getProspects(): Promise<{
  pistes: Prospect[];
  tableManquante: boolean;
}> {
  const db = supabaseAdmin();
  if (!db) return { pistes: [], tableManquante: false };
  const { data, error } = await db
    .from("prospects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) return { pistes: [], tableManquante: tableAbsente(error) };
  return { pistes: (data ?? []) as Prospect[], tableManquante: false };
}

/**
 * La liste d'appels : ce qui reste à rappeler, et rien d'autre.
 *
 * Une piste convertie n'a plus rien à faire ici — la vente est faite, elle vit
 * dans les commandes. Elle était consultable par un filtre, ce qui revenait à
 * garder ouverte, en permanence, une liste dont chaque ligne est du travail
 * terminé. Le compte des converties sert encore aux statistiques ; l'écran, lui,
 * ne montre que ce qui appelle un geste.
 */
export async function getPistesActives(): Promise<{
  pistes: Prospect[];
  tableManquante: boolean;
}> {
  const db = supabaseAdmin();
  if (!db) return { pistes: [], tableManquante: false };
  const { data, error } = await db
    .from("prospects")
    .select("*")
    .in("status", ["ouverte", "rappelee"])
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) return { pistes: [], tableManquante: tableAbsente(error) };
  return { pistes: (data ?? []) as Prospect[], tableManquante: false };
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data as Prospect) ?? null;
}

export async function setProspectStatus(id: string, status: ProspectStatus) {
  const db = supabaseAdmin();
  if (!db) throw new Error("Base non connectée.");
  const { error } = await db
    .from("prospects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProspect(id: string) {
  const db = supabaseAdmin();
  if (!db) throw new Error("Base non connectée.");
  const { error } = await db.from("prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// -------------------------------------------------------------------- packs

/*
  Un coffret sans composition reste vendable : le prix et la photo suffisent à
  l'acheter. C'est la différence avec un produit, qui n'a pas de prix tant qu'il
  n'a pas de format — d'où l'absence ici du filtre qui masque les produits nus.
*/
async function lirePacks(tout: boolean): Promise<Pack[]> {
  const db = supabaseRead();
  if (!db) return [];
  let requete = db.from("packs").select("*, items:pack_items(*)");
  if (!tout) requete = requete.eq("active", true);
  const { data, error } = await requete.order("sort_order");
  if (error) return fallback("packs", [] as Pack[], error);

  return (data as Pack[]).map((p) => ({
    ...p,
    items: (p.items ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order,
    ),
  }));
}

async function getPacksBrut(): Promise<Pack[]> {
  return lirePacks(false);
}

/** Lecture back-office : coffrets masqués compris. */
export async function getPacksAdmin(): Promise<Pack[]> {
  return lirePacks(true);
}

// ---------------------------------------------------------------- livraison

async function getTarifsBrut(): Promise<TarifLivraison[]> {
  const db = supabaseRead();
  if (!db) return [];
  const { data, error } = await db
    .from("livraison_tarifs")
    .select("*")
    .order("wilaya_code");
  if (error) return fallback("livraison_tarifs", [] as TarifLivraison[], error);
  return (data ?? []) as TarifLivraison[];
}

/** Lecture back-office : wilayas désactivées comprises. */
export async function getTarifsAdmin(): Promise<TarifLivraison[]> {
  return getTarifsBrut();
}

/**
 * Enregistre la grille d'un coup.
 *
 * Cinquante-huit lignes se règlent sur un seul écran : les envoyer une par une
 * ferait cinquante-huit allers-retours pour un geste unique.
 */
export async function enregistrerTarifs(lignes: TarifLivraison[]) {
  const db = supabaseAdmin();
  if (!db) throw new Error("Base non connectée.");
  const { error } = await db.from("livraison_tarifs").upsert(
    lignes.map((l) => ({ ...l, updated_at: new Date().toISOString() })),
    { onConflict: "wilaya_code" },
  );
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------- statistiques

export type Statistiques = {
  ca: number;
  confirmees: number;
  nouvelles: number;
  retours: number;
  panier: number;
  parJour: { jour: string; commandes: number; ca: number }[];
  topPacks: { nom: string; n: number }[];
  wilayas: { nom: string; n: number }[];
  pistesOuvertes: number;
  pistesConverties: number;
};

const VIDE: Statistiques = {
  ca: 0, confirmees: 0, nouvelles: 0, retours: 0, panier: 0,
  parJour: [], topPacks: [], wilayas: [],
  pistesOuvertes: 0, pistesConverties: 0,
};

/**
 * Les chiffres d'une période.
 *
 * Le chiffre d'affaires ne compte que les commandes confirmées : une commande
 * nouvelle n'est pas encore une vente, et une commande revenue n'en est plus
 * une. Les frais de livraison en sont retirés — ils passent au transporteur,
 * pas dans la caisse.
 *
 * L'agrégation se fait ici plutôt qu'en SQL parce qu'elle tient en mémoire :
 * même à mille commandes en trois jours, un mois pèse quelques milliers de
 * lignes. Le plafond est explicite pour que le jour où il sera atteint, ce soit
 * une décision et non une surprise.
 */
export async function getStatistiques(jours: number): Promise<Statistiques> {
  const db = supabaseAdmin();
  if (!db) return VIDE;

  const depuis =
    jours > 0
      ? new Date(Date.now() - jours * 24 * 60 * 60 * 1000).toISOString()
      : null;

  let requete = db
    .from("orders")
    .select(
      "id, created_at, total, status, wilaya, livraison_prix, items:order_items(product_name, quantity, line_total)",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (depuis) requete = requete.gte("created_at", depuis);

  const { data, error } = await requete;
  if (error) return fallback("statistiques", VIDE, error);

  type Ligne = {
    created_at: string;
    total: number;
    status: string;
    wilaya: string | null;
    livraison_prix: number | null;
    items: { product_name: string; quantity: number }[] | null;
  };
  const lignes = (data ?? []) as unknown as Ligne[];

  const out: Statistiques = { ...VIDE, parJour: [], topPacks: [], wilayas: [] };
  const jour = new Map<string, { commandes: number; ca: number }>();
  const packs = new Map<string, number>();
  const wilayas = new Map<string, number>();

  for (const l of lignes) {
    if (l.status === "nouvelle") out.nouvelles += 1;
    if (l.status === "retour") out.retours += 1;
    if (l.status !== "confirmee") continue;

    const net = Number(l.total ?? 0) - Number(l.livraison_prix ?? 0);
    out.confirmees += 1;
    out.ca += net;

    const j = l.created_at.slice(0, 10);
    const acc = jour.get(j) ?? { commandes: 0, ca: 0 };
    jour.set(j, { commandes: acc.commandes + 1, ca: acc.ca + net });

    if (l.wilaya) wilayas.set(l.wilaya, (wilayas.get(l.wilaya) ?? 0) + 1);
    for (const it of l.items ?? [])
      packs.set(it.product_name, (packs.get(it.product_name) ?? 0) + it.quantity);
  }

  out.panier = out.confirmees ? Math.round(out.ca / out.confirmees) : 0;
  out.parJour = [...jour.entries()]
    .map(([j, v]) => ({ jour: j, ...v }))
    .sort((a, b) => a.jour.localeCompare(b.jour));
  const dessus = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([nom, n]) => ({ nom, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6);
  out.topPacks = dessus(packs);
  out.wilayas = dessus(wilayas);

  /*
    Le taux de transformation demande les deux bouts : les paniers restés en
    plan et ceux qui ont fini en commande. Deux comptages, pas de lignes.
  */
  for (const [statut, cle] of [
    ["ouverte", "pistesOuvertes"],
    ["convertie", "pistesConverties"],
  ] as const) {
    const { count } = await db
      .from("prospects")
      .select("*", { count: "exact", head: true })
      .eq("status", statut);
    out[cle] = count ?? 0;
  }

  return out;
}

/**
 * Ce qui part chez le transporteur : les commandes confirmées, rien d'autre.
 *
 * Exporter les nouvelles enverrait à l'expédition des commandes que personne
 * n'a encore eues au téléphone.
 */
export async function getCommandesExport(): Promise<Order[]> {
  const db = supabaseAdmin();
  if (!db) return readLocalOrders().filter((o) => o.status === "confirmee");
  const { data, error } = await db
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("status", "confirmee")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const getGammes = enCache("getGammes", getGammesBrut);

export const getProductTypes = enCache("getProductTypes", getProductTypesBrut);

export const getProducts = enCache("getProducts", getProductsBrut);

export const getPacks = enCache("getPacks", getPacksBrut);

export const getTarifs = enCache("getTarifs", getTarifsBrut);

/*
  Les réglages ne passent pas par le cache, contrairement au catalogue.

  Ils étaient gardés cinq minutes comme le reste. Or c'est ici que vit la
  langue du site : on la basculait en arabe, la page restait en français, et
  rien n'expliquait pourquoi — au bout de quelques essais on concluait que le
  réglage ne marchait pas. La même attente frappait le mode de la boutique, le
  minimum par référence et l'interrupteur de livraison.

  L'invalidation par étiquette existe et fonctionne, mais elle ne couvre pas
  tout : une modification faite hors du back-office — un correctif en base, une
  restauration — laissait le site sur l'ancienne valeur sans qu'aucun geste ne
  la réveille.

  Le catalogue, lui, reste en cache : ce sont six lectures avec leurs jointures.
  Les réglages sont une seule ligne lue par sa clé primaire ; la garder coûtait
  plus en confusion qu'elle ne rapportait en millisecondes.
*/
export const getSettings = getSettingsBrut;

export const getHeroSlides = enCache("getHeroSlides", getHeroSlidesBrut);

export const getVideos = enCache("getVideos", getVideosBrut);
