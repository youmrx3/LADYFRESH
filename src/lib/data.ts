import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
 * Every getter falls back to the seed catalogue when Supabase is unreachable
 * or unconfigured, so the storefront never renders empty. Failures are logged,
 * not thrown — a broken database must not take the shop down.
 */
function fallback<T>(label: string, seed: T, error?: unknown): T {
  if (error) console.warn(`[data] ${label}: falling back to seed catalogue —`, error);
  return seed;
}

export async function getGammes(): Promise<Gamme[]> {
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

export async function getProductTypes(): Promise<ProductType[]> {
  const db = supabaseRead();
  if (!db) return PRODUCT_TYPES;
  const { data, error } = await db
    .from("product_types")
    .select("*")
    .order("sort_order");
  if (error || !data?.length) return fallback("product_types", PRODUCT_TYPES, error);
  return data as ProductType[];
}

export async function getProducts(): Promise<Product[]> {
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

export async function getSettings(): Promise<SiteSettings> {
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

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const db = supabaseRead();
  if (!db) return HERO_SLIDES;
  const { data, error } = await db.from("hero_slides").select("*").order("sort_order");
  if (error || !data?.length) return fallback("hero_slides", HERO_SLIDES, error);
  return data as HeroSlide[];
}

export async function getVideos(): Promise<Video[]> {
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
 * This is a development fallback. It needs a writable filesystem and a single
 * instance, neither of which holds on serverless. Configure Supabase before
 * taking real orders.
 */
const LOCAL_ORDERS = join(process.cwd(), ".data", "orders.json");

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
    const local = { ...order, id: order.ref };
    writeLocalOrders([local, ...readLocalOrders()].slice(0, 500));
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
