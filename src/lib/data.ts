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
  Product,
  ProductType,
  Prospect,
  ProspectStatus,
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

async function getSettingsBrut(): Promise<SiteSettings> {
  const db = supabaseRead();
  if (!db) return { ...SETTINGS, ...readLocalSettings() };
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .eq("id", "settings")
    .maybeSingle();
  if (error || !data) return fallback("settings", { ...SETTINGS, ...readLocalSettings() }, error);
  // A freshly-inserted settings row has empty copy; keep the seed wording.
  return { ...SETTINGS, ...stripEmpty(data as Record<string, unknown>) } as SiteSettings;
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

function stripEmpty(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).filter(([, v]) => v !== null && v !== undefined && v !== ""),
  );
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

export async function getOrders(): Promise<Order[]> {
  const db = supabaseAdmin();
  if (!db) return readLocalOrders();
  const { data, error } = await db
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return fallback("orders", readLocalOrders(), error);
  return data as Order[];
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
    .limit(300);
  if (error) return { pistes: [], tableManquante: tableAbsente(error) };
  return { pistes: (data ?? []) as Prospect[], tableManquante: false };
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const getGammes = enCache("getGammes", getGammesBrut);

export const getProductTypes = enCache("getProductTypes", getProductTypesBrut);

export const getProducts = enCache("getProducts", getProductsBrut);

export const getSettings = enCache("getSettings", getSettingsBrut);

export const getHeroSlides = enCache("getHeroSlides", getHeroSlidesBrut);

export const getVideos = enCache("getVideos", getVideosBrut);
