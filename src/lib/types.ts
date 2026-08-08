export type PurchaseType = "gros" | "demi_gros";

export type ProductType =
  | "brume"
  | "gel_intime"
  | "deodorant_intime"
  | "deodorant_femme";

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "brume", label: "Brume" },
  { value: "gel_intime", label: "Gel intime" },
  { value: "deodorant_intime", label: "Déodorant intime" },
  { value: "deodorant_femme", label: "Déodorant femme" },
];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  brume: "Brume parfumée",
  gel_intime: "Gel lavant intime",
  deodorant_intime: "Déodorant intime",
  deodorant_femme: "Déodorant femme",
};

export type Gamme = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  color_hex: string;
  color_name: string;
  cover_image: string;
  sort_order: number;
  active: boolean;
};

export type Variant = {
  id: string;
  product_id: string;
  size_label: string;
  price_demi_gros: number;
  price_gros: number;
  units_per_carton: number;
  /** Each size is photographed separately, so the image lives on the variant. */
  image: string;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  gamme_id: string;
  color_name: string;
  color_hex: string;
  image: string;
  sort_order: number;
  active: boolean;
  variants: Variant[];
};

export type HeroSlide = {
  id: string;
  image: string;
  gamme_id: string;
  eyebrow: string;
  caption: string;
  sort_order: number;
};

export type Video = {
  id: string;
  title: string;
  note: string;
  src: string;
  poster: string | null;
  sort_order: number;
};

export type SiteSettings = {
  id: string;
  whatsapp_number: string;
  min_gros_cartons: number;
  min_demi_gros_pieces: number;
  hero_eyebrow: string;
  hero_title: string;
  hero_lede: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
};

export type OrderStatus = "nouvelle" | "en_cours" | "traitee" | "livree";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  traitee: "Traitée",
  livree: "Livrée",
};

export type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string;
  product_name: string;
  gamme_name: string;
  size_label: string;
  unit_price: number;
  quantity: number;
  units_per_carton: number;
  line_total: number;
};

export type Order = {
  id: string;
  ref: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  address: string;
  note: string;
  channel: "whatsapp" | "formulaire";
  purchase_type: PurchaseType;
  total: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
};

/** A line in the client-side order docket, before it becomes an Order. */
export type CartLine = {
  variantId: string;
  productId: string;
  quantity: number;
};
