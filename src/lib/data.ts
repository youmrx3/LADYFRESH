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

async function getGammesBrut(): Promise<Gamme[]> {
  const db = supabaseRead();
  if (!db) return GAMMES;
  const { data, error } = await db
    .from("gammes")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error || !data?.length) return fallback("gammes", GAMMES, error);
  return data as Gamme[];
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

async function getProductsBrut(): Promise<Product[]> {
  const db = supabaseRead();
  if (!db) return PRODUCTS;
  const { data, error } = await db
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("active", true)
    .order("sort_order");
  if (error || !data?.length) return fallback("products", PRODUCTS, error);

  return (data as Product[])
    .map((p) => ({
      ...p,
      variants: (p.variants ?? [])
        .filter((v: Variant) => v.active)
        .sort((a: Variant, b: Variant) => a.size_label.localeCompare(b.size_label)),
    }))
    .filter((p) => p.variants.length > 0);
}

async function getSettingsBrut(): Promise<SiteSettings> {
  const db = supabaseRead();
  if (!db) return SETTINGS;
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .eq("id", "settings")
    .maybeSingle();
  if (error || !data) return fallback("settings", SETTINGS, error);
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const getGammes = enCache("getGammes", getGammesBrut);

export const getProductTypes = enCache("getProductTypes", getProductTypesBrut);

export const getProducts = enCache("getProducts", getProductsBrut);

export const getSettings = enCache("getSettings", getSettingsBrut);

export const getHeroSlides = enCache("getHeroSlides", getHeroSlidesBrut);

export const getVideos = enCache("getVideos", getVideosBrut);
