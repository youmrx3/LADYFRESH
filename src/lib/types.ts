export type PurchaseType = "gros" | "demi_gros";

/**
 * Les types de produits sont des données, pas une énumération figée : la
 * marque doit pouvoir en ajouter un sans toucher au code.
 */
export type ProductType = {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  /** Version courte, pour les filtres de la boutique. */
  short_name: string;
  short_name_ar?: string | null;
  short_name_en?: string | null;
  sort_order: number;
  active: boolean;
};

export type Gamme = {
  id: string;
  slug: string;
  /** Nom de marque : jamais traduit. */
  name: string;
  tagline: string;
  tagline_ar?: string | null;
  tagline_en?: string | null;
  description: string;
  description_ar?: string | null;
  description_en?: string | null;
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
  /** Chaque taille est photographiée à part, la photo vit donc sur le format. */
  image: string;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  type_id: string;
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
  eyebrow_ar?: string | null;
  eyebrow_en?: string | null;
  caption: string;
  caption_ar?: string | null;
  caption_en?: string | null;
  sort_order: number;
};

export type Video = {
  id: string;
  title: string;
  title_ar?: string | null;
  title_en?: string | null;
  note: string;
  note_ar?: string | null;
  note_en?: string | null;
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
  hero_eyebrow_ar?: string | null;
  hero_eyebrow_en?: string | null;
  hero_title: string;
  hero_title_ar?: string | null;
  hero_title_en?: string | null;
  hero_lede: string;
  hero_lede_ar?: string | null;
  hero_lede_en?: string | null;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
};

export type OrderStatus = "nouvelle" | "en_cours" | "traitee" | "livree";

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
