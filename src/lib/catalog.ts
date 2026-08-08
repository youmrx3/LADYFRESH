import type {
  Gamme,
  HeroSlide,
  Product,
  ProductType,
  SiteSettings,
  Variant,
  Video,
} from "./types";

/**
 * Reference catalogue. Supabase is the live source of truth once it is
 * configured (see supabase/schema.sql); this file seeds it and keeps the
 * site fully browsable before the database exists.
 */

/** Tariff from the brief, §3. Prices in DA. */
const TARIFF = {
  brume_250: { demi: 540, gros: 520, carton: 12 },
  brume_150: { demi: 440, gros: 425, carton: 24 },
  gel_intime: { demi: 410, gros: 395, carton: 12 },
  deodorant_intime: { demi: 330, gros: 315, carton: 24 },
  deodorant_femme: { demi: 205, gros: 195, carton: 12 },
} as const;

export const GAMMES: Gamme[] = [
  {
    id: "g-rouge-sensuel",
    slug: "rouge-sensuel",
    name: "Sensuel",
    tagline: "Rouge",
    description:
      "La rose rouge, en brume et en soin. Le parfum le plus affirmé de la maison.",
    color_hex: "#C4102B",
    color_name: "Rouge",
    cover_image: "/gammes/rouge-sensuel.png",
    sort_order: 1,
    active: true,
  },
  {
    id: "g-rose-douceur",
    slug: "rose-douceur",
    name: "Douceur",
    tagline: "Rose",
    description:
      "Floral, tendre, quotidien. La gamme qui tourne le plus vite en rayon.",
    color_hex: "#E8458B",
    color_name: "Rose",
    cover_image: "/gammes/rose-douceur.png",
    sort_order: 2,
    active: true,
  },
  {
    id: "g-princess",
    slug: "princess",
    name: "Princess",
    tagline: "Bordeaux",
    description:
      "Brume et déodorant seulement. Un duo profond, fruité, très demandé.",
    color_hex: "#A5123F",
    color_name: "Bordeaux",
    cover_image: "/gammes/princess.jpg",
    sort_order: 3,
    active: true,
  },
  {
    id: "g-ara",
    slug: "ara",
    name: "ARA",
    tagline: "Rose gold",
    description: "Poudré et lumineux. La signature la plus douce du catalogue.",
    color_hex: "#C98B85",
    color_name: "Rose gold",
    cover_image: "/gammes/ara.png",
    sort_order: 4,
    active: true,
  },
  {
    id: "g-move-confiant",
    slug: "move-confiant",
    name: "Confiant",
    tagline: "Violet",
    description:
      "Un violet franc, une tenue longue. Pensée pour les journées qui n'arrêtent pas.",
    color_hex: "#8E3A9E",
    color_name: "Violet",
    cover_image: "/gammes/move-confiant.png",
    sort_order: 5,
    active: true,
  },
  {
    id: "g-bleu-confort",
    slug: "bleu-confort",
    name: "Comfort",
    tagline: "Bleu",
    description: "Aquatique et net. La gamme fraîcheur au sens strict.",
    color_hex: "#2E9DAF",
    color_name: "Bleu",
    cover_image: "/gammes/bleu-confort.png",
    sort_order: 6,
    active: true,
  },
  {
    id: "g-shower",
    slug: "shower",
    name: "Shower",
    tagline: "Vert d'eau",
    description:
      "Hygiène intime pure : gel lavant et déodorant. Sans brume, sans détour.",
    color_hex: "#2FB4A0",
    color_name: "Vert d'eau",
    cover_image: "/gammes/shower.png",
    sort_order: 7,
    active: true,
  },
];

/** Filter order for the shop. Rouge comes first, per the brief §2.6. */
export const COLOR_ORDER = [
  "Rouge",
  "Rose",
  "Bordeaux",
  "Rose gold",
  "Violet",
  "Bleu",
  "Vert d'eau",
];

type Line = {
  gamme: string;
  type: ProductType;
  sizes: { label: string; tariff: keyof typeof TARIFF; image: string }[];
};

const LINES: Line[] = [
  {
    gamme: "rouge-sensuel",
    type: "brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/rouge-sensuel-brume-150.png" },
      { label: "250 ml", tariff: "brume_250", image: "/products/rouge-sensuel-brume-250.png" },
    ],
  },
  {
    gamme: "rouge-sensuel",
    type: "gel_intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/rouge-sensuel-gel-intime.png" }],
  },
  {
    gamme: "rouge-sensuel",
    type: "deodorant_intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/rouge-sensuel-deo-intime.png" }],
  },
  {
    gamme: "rouge-sensuel",
    type: "deodorant_femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/rouge-sensuel-deo-femme.png" }],
  },

  {
    gamme: "rose-douceur",
    type: "brume",
    sizes: [{ label: "150 ml", tariff: "brume_150", image: "/products/rose-douceur-brume-150.png" }],
  },
  {
    gamme: "rose-douceur",
    type: "gel_intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/rose-douceur-gel-intime.png" }],
  },
  {
    gamme: "rose-douceur",
    type: "deodorant_intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/rose-douceur-deo-intime.png" }],
  },
  {
    gamme: "rose-douceur",
    type: "deodorant_femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/rose-douceur-deo-femme.png" }],
  },

  {
    gamme: "princess",
    type: "brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/princess-brume-150.png" },
      { label: "250 ml", tariff: "brume_250", image: "/products/princess-brume-250.png" },
    ],
  },
  {
    gamme: "princess",
    type: "deodorant_femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/princess-deo-femme.png" }],
  },

  {
    gamme: "ara",
    type: "brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/ara-brume-150.png" },
      { label: "250 ml", tariff: "brume_250", image: "/products/ara-brume-250.png" },
    ],
  },
  {
    gamme: "ara",
    type: "deodorant_femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/ara-deo-femme.png" }],
  },

  {
    gamme: "move-confiant",
    type: "brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/move-confiant-brume-150.png" },
      { label: "250 ml", tariff: "brume_250", image: "/products/move-confiant-brume-250.png" },
    ],
  },
  {
    gamme: "move-confiant",
    type: "gel_intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/move-confiant-gel-intime.png" }],
  },
  {
    gamme: "move-confiant",
    type: "deodorant_intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/move-confiant-deo-intime.png" }],
  },
  {
    gamme: "move-confiant",
    type: "deodorant_femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/move-confiant-deo-femme.png" }],
  },

  {
    gamme: "bleu-confort",
    type: "brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/bleu-confort-brume-150.png" },
      { label: "250 ml", tariff: "brume_250", image: "/products/bleu-confort-brume-250.png" },
    ],
  },
  {
    gamme: "bleu-confort",
    type: "gel_intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/bleu-confort-gel-intime.png" }],
  },
  {
    gamme: "bleu-confort",
    type: "deodorant_intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/bleu-confort-deo-intime.png" }],
  },
  {
    gamme: "bleu-confort",
    type: "deodorant_femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/bleu-confort-deo-femme.png" }],
  },

  {
    gamme: "shower",
    type: "gel_intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/shower-gel-intime.png" }],
  },
  {
    gamme: "shower",
    type: "deodorant_intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/shower-deo-intime.png" }],
  },
];

const TYPE_NAME: Record<ProductType, string> = {
  brume: "Brume parfumée",
  gel_intime: "Gel lavant intime",
  deodorant_intime: "Déodorant intime",
  deodorant_femme: "Déodorant femme",
};

export const PRODUCTS: Product[] = LINES.map((line, index) => {
  const gamme = GAMMES.find((g) => g.slug === line.gamme)!;
  const productId = `p-${line.gamme}-${line.type}`;
  const variants: Variant[] = line.sizes.map((size, i) => ({
    id: `v-${line.gamme}-${line.type}-${i}`,
    product_id: productId,
    size_label: size.label,
    price_demi_gros: TARIFF[size.tariff].demi,
    price_gros: TARIFF[size.tariff].gros,
    units_per_carton: TARIFF[size.tariff].carton,
    image: size.image,
    active: true,
  }));

  return {
    id: productId,
    slug: `${line.gamme}-${line.type}`,
    name: `${TYPE_NAME[line.type]} ${gamme.name}`,
    type: line.type,
    gamme_id: gamme.id,
    color_name: gamme.color_name,
    color_hex: gamme.color_hex,
    image: variants[0].image,
    sort_order: index + 1,
    active: true,
    variants,
  };
});

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "h-1",
    gamme_id: "g-rouge-sensuel",
    image: "/gammes/rouge-sensuel.png",
    eyebrow: "Brume parfumée",
    caption: "Sensuel — 150 & 250 ml",
    sort_order: 1,
  },
  {
    id: "h-2",
    gamme_id: "g-bleu-confort",
    image: "/gammes/bleu-confort.png",
    eyebrow: "Déodorant femme",
    caption: "Comfort — 200 ml",
    sort_order: 2,
  },
  {
    id: "h-3",
    gamme_id: "g-ara",
    image: "/gammes/ara.png",
    eyebrow: "Déodorant femme",
    caption: "ARA — 200 ml",
    sort_order: 3,
  },
  {
    id: "h-4",
    gamme_id: "g-move-confiant",
    image: "/gammes/move-confiant.png",
    eyebrow: "Déodorant intime",
    caption: "Confiant — 150 ml",
    sort_order: 4,
  },
  {
    id: "h-5",
    gamme_id: "g-shower",
    image: "/gammes/shower.png",
    eyebrow: "Hygiène intime",
    caption: "Shower — gel & déodorant",
    sort_order: 5,
  },
  {
    id: "h-6",
    gamme_id: "g-princess",
    image: "/gammes/princess.jpg",
    eyebrow: "Duo brume & déodorant",
    caption: "Princess — 150 & 200 ml",
    sort_order: 6,
  },
  {
    id: "h-7",
    gamme_id: "g-rose-douceur",
    image: "/gammes/rose-douceur.png",
    eyebrow: "Déodorant femme",
    caption: "Douceur — 200 ml",
    sort_order: 7,
  },
];

export const VIDEOS: Video[] = [
  {
    id: "vid-1",
    title: "Une journée entière",
    note: "Cours, travail, sorties — la fraîcheur tient.",
    src: "/videos/ladyfresh-fraicheur.mp4",
    poster: "/gammes/rose-douceur.png",
    sort_order: 1,
  },
];

export const SETTINGS: SiteSettings = {
  id: "settings",
  whatsapp_number: "213000000000",
  min_gros_cartons: 1,
  min_demi_gros_pieces: 5,
  hero_eyebrow: "Cosmétiques — Algérie",
  hero_title: "Sept gammes.\nUne même fraîcheur.",
  hero_lede:
    "Brumes parfumées, gels lavants intimes et déodorants Lady Fresh. Au détail, en demi-gros dès 5 pièces, ou en gros par carton.",
  contact_email: "contact@ladyfresh.dz",
  contact_phone: "+213 00 00 00 00",
  contact_address: "Alger, Algérie",
  instagram_url: "https://instagram.com/",
  facebook_url: "https://facebook.com/",
  tiktok_url: "https://tiktok.com/",
};
