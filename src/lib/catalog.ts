import type {
  Gamme,
  HeroSlide,
  Product,
  ProductType,
  SiteSettings,
  Variant,
  Video,
} from "./types";

/** Les quatre types livrés d'origine. L'admin peut en ajouter d'autres. */
export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "t-brume",
    slug: "brume",
    name: "Brume parfumée",
    name_ar: "بخاخ معطر",
    name_en: "Fragrance mist",
    short_name: "Brume",
    short_name_ar: "بخاخ",
    short_name_en: "Mist",
    sort_order: 1,
    active: true,
  },
  {
    id: "t-gel-intime",
    slug: "gel-intime",
    name: "Gel lavant intime",
    name_ar: "جل منظف حميمي",
    name_en: "Intimate wash",
    short_name: "Gel intime",
    short_name_ar: "جل حميمي",
    short_name_en: "Intimate wash",
    sort_order: 2,
    active: true,
  },
  {
    id: "t-deodorant-intime",
    slug: "deodorant-intime",
    name: "Déodorant intime",
    name_ar: "مزيل روائح حميمي",
    name_en: "Intimate deodorant",
    short_name: "Déodorant intime",
    short_name_ar: "مزيل حميمي",
    short_name_en: "Intimate deo",
    sort_order: 3,
    active: true,
  },
  {
    id: "t-deodorant-femme",
    slug: "deodorant-femme",
    name: "Déodorant femme",
    name_ar: "مزيل روائح للجسم",
    name_en: "Body deodorant",
    short_name: "Déodorant femme",
    short_name_ar: "مزيل للجسم",
    short_name_en: "Body deo",
    sort_order: 4,
    active: true,
  },
];

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
    description_ar:
      "الوردة الحمراء، بخاخًا وعناية. أقوى عطر في المجموعة.",
    description_en:
      "The red rose, as a mist and as care. The house's boldest scent.",
    tagline_ar: "أحمر",
    tagline_en: "Red",
    color_hex: "#C4102B",
    color_name: "Rouge",
    cover_image: "/gammes/rouge-sensuel.webp",
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
    description_ar:
      "زهري، ناعم، يومي. المجموعة الأسرع دورانًا في الرفوف.",
    description_en:
      "Floral, soft, everyday. The range that moves fastest off the shelf.",
    tagline_ar: "وردي",
    tagline_en: "Pink",
    color_hex: "#E8458B",
    color_name: "Rose",
    cover_image: "/gammes/rose-douceur.webp",
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
    description_ar:
      "بخاخ ومزيل روائح فقط. ثنائي عميق وفاكهي، مطلوب بكثرة.",
    description_en:
      "Mist and deodorant only. A deep, fruity duo, much in demand.",
    tagline_ar: "عنابي",
    tagline_en: "Burgundy",
    color_hex: "#A5123F",
    color_name: "Bordeaux",
    cover_image: "/gammes/princess.webp",
    sort_order: 3,
    active: true,
  },
  {
    id: "g-ara",
    slug: "ara",
    name: "ARA",
    tagline: "Rose gold",
    description: "Poudré et lumineux. La signature la plus douce du catalogue.",
    description_ar:
      "بودري ومشرق. أنعم توقيع في الكتالوج.",
    description_en:
      "Powdery and luminous. The softest signature in the catalogue.",
    tagline_ar: "وردي ذهبي",
    tagline_en: "Rose gold",
    color_hex: "#C98B85",
    color_name: "Rose gold",
    cover_image: "/gammes/ara.webp",
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
    description_ar:
      "بنفسجي صريح وثبات طويل. مصمّمة للأيام التي لا تتوقّف.",
    description_en:
      "A frank purple, long wear. Built for days that don't stop.",
    tagline_ar: "بنفسجي",
    tagline_en: "Purple",
    color_hex: "#8E3A9E",
    color_name: "Violet",
    cover_image: "/gammes/move-confiant.webp",
    sort_order: 5,
    active: true,
  },
  {
    id: "g-bleu-confort",
    slug: "bleu-confort",
    name: "Comfort",
    tagline: "Bleu",
    description: "Aquatique et net. La gamme fraîcheur au sens strict.",
    description_ar:
      "مائي ونقي. مجموعة الانتعاش بالمعنى الحرفي.",
    description_en:
      "Aquatic and clean. The freshness range, literally.",
    tagline_ar: "أزرق",
    tagline_en: "Blue",
    color_hex: "#2E9DAF",
    color_name: "Bleu",
    cover_image: "/gammes/bleu-confort.webp",
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
    description_ar:
      "نظافة حميمية خالصة: جل منظف ومزيل روائح. بلا بخاخ، بلا لفّ.",
    description_en:
      "Pure intimate care: wash and deodorant. No mist, no detour.",
    tagline_ar: "أخضر مائي",
    tagline_en: "Aqua",
    color_hex: "#2FB4A0",
    color_name: "Vert d'eau",
    cover_image: "/gammes/shower.webp",
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
  type: string;
  sizes: { label: string; tariff: keyof typeof TARIFF; image: string }[];
};

const LINES: Line[] = [
  {
    gamme: "rouge-sensuel",
    type: "t-brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/rouge-sensuel-brume-150.webp" },
      { label: "250 ml", tariff: "brume_250", image: "/products/rouge-sensuel-brume-250.webp" },
    ],
  },
  {
    gamme: "rouge-sensuel",
    type: "t-gel-intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/rouge-sensuel-gel-intime.webp" }],
  },
  {
    gamme: "rouge-sensuel",
    type: "t-deodorant-intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/rouge-sensuel-deo-intime.webp" }],
  },
  {
    gamme: "rouge-sensuel",
    type: "t-deodorant-femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/rouge-sensuel-deo-femme.webp" }],
  },

  {
    gamme: "rose-douceur",
    type: "t-brume",
    sizes: [{ label: "150 ml", tariff: "brume_150", image: "/products/rose-douceur-brume-150.webp" }],
  },
  {
    gamme: "rose-douceur",
    type: "t-gel-intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/rose-douceur-gel-intime.webp" }],
  },
  {
    gamme: "rose-douceur",
    type: "t-deodorant-intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/rose-douceur-deo-intime.webp" }],
  },
  {
    gamme: "rose-douceur",
    type: "t-deodorant-femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/rose-douceur-deo-femme.webp" }],
  },

  {
    gamme: "princess",
    type: "t-brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/princess-brume-150.webp" },
      { label: "250 ml", tariff: "brume_250", image: "/products/princess-brume-250.webp" },
    ],
  },
  {
    gamme: "princess",
    type: "t-deodorant-femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/princess-deo-femme.webp" }],
  },

  {
    gamme: "ara",
    type: "t-brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/ara-brume-150.webp" },
      { label: "250 ml", tariff: "brume_250", image: "/products/ara-brume-250.webp" },
    ],
  },
  {
    gamme: "ara",
    type: "t-deodorant-femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/ara-deo-femme.webp" }],
  },

  {
    gamme: "move-confiant",
    type: "t-brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/move-confiant-brume-150.webp" },
      { label: "250 ml", tariff: "brume_250", image: "/products/move-confiant-brume-250.webp" },
    ],
  },
  {
    gamme: "move-confiant",
    type: "t-gel-intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/move-confiant-gel-intime.webp" }],
  },
  {
    gamme: "move-confiant",
    type: "t-deodorant-intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/move-confiant-deo-intime.webp" }],
  },
  {
    gamme: "move-confiant",
    type: "t-deodorant-femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/move-confiant-deo-femme.webp" }],
  },

  {
    gamme: "bleu-confort",
    type: "t-brume",
    sizes: [
      { label: "150 ml", tariff: "brume_150", image: "/products/bleu-confort-brume-150.webp" },
      { label: "250 ml", tariff: "brume_250", image: "/products/bleu-confort-brume-250.webp" },
    ],
  },
  {
    gamme: "bleu-confort",
    type: "t-gel-intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/bleu-confort-gel-intime.webp" }],
  },
  {
    gamme: "bleu-confort",
    type: "t-deodorant-intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/bleu-confort-deo-intime.webp" }],
  },
  {
    gamme: "bleu-confort",
    type: "t-deodorant-femme",
    sizes: [{ label: "200 ml", tariff: "deodorant_femme", image: "/products/bleu-confort-deo-femme.webp" }],
  },

  {
    gamme: "shower",
    type: "t-gel-intime",
    sizes: [{ label: "250 ml", tariff: "gel_intime", image: "/products/shower-gel-intime.webp" }],
  },
  {
    gamme: "shower",
    type: "t-deodorant-intime",
    sizes: [{ label: "150 ml", tariff: "deodorant_intime", image: "/products/shower-deo-intime.webp" }],
  },
];

export const PRODUCTS: Product[] = LINES.map((line, index) => {
  const gamme = GAMMES.find((g) => g.slug === line.gamme)!;
  const type = PRODUCT_TYPES.find((t) => t.id === line.type)!;
  const productId = `p-${line.gamme}-${type.slug}`;
  const variants: Variant[] = line.sizes.map((size, i) => ({
    id: `v-${line.gamme}-${type.slug}-${i}`,
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
    slug: `${line.gamme}-${type.slug}`,
    name: `${type.name} ${gamme.name}`,
    type_id: type.id,
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
    image: "/gammes/rouge-sensuel.webp",
    eyebrow: "Brume parfumée",
    caption: "Sensuel — 150 & 250 ml",
    eyebrow_ar: "بخاخ معطر",
    eyebrow_en: "Fragrance mist",
    caption_ar: "Sensuel — 150 & 250 مل",
    caption_en: "Sensuel — 150 & 250 ml",
    sort_order: 1,
  },
  {
    id: "h-2",
    gamme_id: "g-bleu-confort",
    image: "/gammes/bleu-confort.webp",
    eyebrow: "Déodorant femme",
    caption: "Comfort — 200 ml",
    eyebrow_ar: "مزيل روائح للجسم",
    eyebrow_en: "Body deodorant",
    caption_ar: "Comfort — 200 مل",
    caption_en: "Comfort — 200 ml",
    sort_order: 2,
  },
  {
    id: "h-3",
    gamme_id: "g-ara",
    image: "/gammes/ara.webp",
    eyebrow: "Déodorant femme",
    caption: "ARA — 200 ml",
    eyebrow_ar: "مزيل روائح للجسم",
    eyebrow_en: "Body deodorant",
    caption_ar: "ARA — 200 مل",
    caption_en: "ARA — 200 ml",
    sort_order: 3,
  },
  {
    id: "h-4",
    gamme_id: "g-move-confiant",
    image: "/gammes/move-confiant.webp",
    eyebrow: "Déodorant intime",
    caption: "Confiant — 150 ml",
    eyebrow_ar: "مزيل روائح حميمي",
    eyebrow_en: "Intimate deodorant",
    caption_ar: "Confiant — 150 مل",
    caption_en: "Confiant — 150 ml",
    sort_order: 4,
  },
  {
    id: "h-5",
    gamme_id: "g-shower",
    image: "/gammes/shower.webp",
    eyebrow: "Hygiène intime",
    caption: "Shower — gel & déodorant",
    eyebrow_ar: "نظافة حميمية",
    eyebrow_en: "Intimate care",
    caption_ar: "Shower — جل ومزيل",
    caption_en: "Shower — wash & deodorant",
    sort_order: 5,
  },
  {
    id: "h-6",
    gamme_id: "g-princess",
    image: "/gammes/princess.webp",
    eyebrow: "Duo brume & déodorant",
    caption: "Princess — 150 & 200 ml",
    eyebrow_ar: "ثنائي بخاخ ومزيل",
    eyebrow_en: "Mist & deodorant duo",
    caption_ar: "Princess — 150 & 200 مل",
    caption_en: "Princess — 150 & 200 ml",
    sort_order: 6,
  },
  {
    id: "h-7",
    gamme_id: "g-rose-douceur",
    image: "/gammes/rose-douceur.webp",
    eyebrow: "Déodorant femme",
    caption: "Douceur — 200 ml",
    eyebrow_ar: "مزيل روائح للجسم",
    eyebrow_en: "Body deodorant",
    caption_ar: "Douceur — 200 مل",
    caption_en: "Douceur — 200 ml",
    sort_order: 7,
  },
];

export const VIDEOS: Video[] = [
  {
    id: "vid-1",
    title: "Une journée entière",
    title_ar: "يوم كامل",
    title_en: "A whole day",
    note: "Cours, travail, sorties — la fraîcheur tient.",
    note_ar: "دراسة، عمل، خرجات — الانتعاش يدوم.",
    note_en: "Class, work, going out — the freshness holds.",
    src: "/videos/ladyfresh-fraicheur.mp4",
    poster: "/gammes/rose-douceur.webp",
    sort_order: 1,
  },
];

export const SETTINGS: SiteSettings = {
  id: "settings",
  locale: "fr",
  whatsapp_number: "213000000000",
  min_gros_cartons: 1,
  min_demi_gros_pieces: 5,
  mode_boutique: "packs" as const,
  min_produit: 1,
  hero_eyebrow: "Cosmétiques — Algérie",
  hero_eyebrow_ar: "مستحضرات تجميل — الجزائر",
  hero_eyebrow_en: "Cosmetics — Algeria",
  hero_title: "Sept gammes.\nUne même fraîcheur.",
  hero_title_ar: "سبع مجموعات.\nانتعاش واحد.",
  hero_title_en: "Seven ranges.\nOne freshness.",
  hero_lede:
    "Brumes parfumées, gels lavants intimes et déodorants. Livrés partout en Algérie, payés à la réception.",
  hero_lede_ar:
    "بخاخات معطرة، جل منظف حميمي ومزيلات روائح ليدي فريش. بالتجزئة، بنصف الجملة ابتداءً من 5 قطع، أو بالجملة بالكرتون.",
  hero_lede_en:
    "Lady Fresh fragrance mists, intimate washes and deodorants. Retail, half-wholesale from 5 pieces, or wholesale by the carton.",
  contact_email: "contact@ladyfresh.dz",
  contact_phone: "+213 00 00 00 00",
  contact_address: "Alger, Algérie",
  instagram_url: "https://instagram.com/",
  facebook_url: "https://facebook.com/",
  tiktok_url: "https://tiktok.com/",
};
