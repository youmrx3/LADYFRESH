import { NextResponse } from "next/server";
import {
  createOrder,
  getGammes,
  getProductTypes,
  getProducts,
  getSettings,
  ordersArePersisted,
} from "@/lib/data";
import {
  da,
  lineTotal,
  orderRef,
  piecesFor,
  unitPrice,
} from "@/lib/format";
import { fill, getDictionary, type Dictionary } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { nomType } from "@/i18n/contenu";
import type { OrderItem, PurchaseType } from "@/lib/types";

/**
 * Bornes d'entrée. Sans elles, une requête forgée peut demander un milliard de
 * pièces (débordement du total, ligne absurde en base) ou pousser des chaînes
 * de plusieurs mégaoctets dans les colonnes texte.
 */
const MAX_LIGNES = 100;
const MAX_QUANTITE = 100_000;
const MAX_TEXTE = 500;
const MAX_CORPS = 64 * 1024;

function borne(valeur: string | undefined, max = MAX_TEXTE) {
  return (valeur ?? "").trim().slice(0, max);
}

type Requete = {
  channel: "whatsapp" | "formulaire";
  purchase: PurchaseType;
  locale?: string;
  /** Étiquette de campagne, transmise par /boutique?c=… */
  source?: string;
  customer?: {
    name?: string;
    phone?: string;
    wilaya?: string;
    address?: string;
    note?: string;
  };
  items: { variantId: string; quantity: number }[];
};

export async function POST(request: Request) {
  let body: Requete;
  try {
    const brut = await request.text();
    if (brut.length > MAX_CORPS)
      return NextResponse.json(
        { error: getDictionary(DEFAULT_LOCALE).api.illisible },
        { status: 413 },
      );
    body = JSON.parse(brut);
  } catch {
    const t = getDictionary(DEFAULT_LOCALE);
    return NextResponse.json({ error: t.api.illisible }, { status: 400 });
  }

  const locale: Locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;
  const t = getDictionary(locale);

  const purchase: PurchaseType = body.purchase === "gros" ? "gros" : "demi_gros";
  const channel: "whatsapp" | "formulaire" =
    body.channel === "formulaire" ? "formulaire" : "whatsapp";

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: t.api.vide }, { status: 400 });
  }
  if (body.items.length > MAX_LIGNES) {
    return NextResponse.json({ error: t.api.aucuneRef }, { status: 400 });
  }

  const [products, gammes, types, settings] = await Promise.all([
    getProducts(),
    getGammes(),
    getProductTypes(),
    getSettings(),
  ]);

  // Les prix sont recalculés côté serveur : le client n'envoie que des
  // identifiants et des quantités.
  const index = new Map(
    products.flatMap((p) =>
      p.variants.map((v) => [v.id, { product: p, variant: v }] as const),
    ),
  );

  const items: OrderItem[] = [];
  for (const ligne of body.items) {
    const entree = index.get(ligne.variantId);
    const quantity = Math.floor(Number(ligne.quantity));
    if (!entree || !Number.isFinite(quantity)) continue;
    if (quantity <= 0 || quantity > MAX_QUANTITE) continue;
    const { product, variant } = entree;
    const gamme = gammes.find((g) => g.id === product.gamme_id);
    items.push({
      id: "",
      order_id: "",
      variant_id: variant.id,
      // Le libellé est figé dans la langue du client : c'est ce qu'il a lu.
      product_name: `${nomType(product, types, locale)} ${gamme?.name ?? ""}`.trim(),
      gamme_name: gamme?.name ?? "",
      size_label: variant.size_label,
      unit_price: unitPrice(variant, purchase),
      quantity,
      units_per_carton: variant.units_per_carton,
      line_total: lineTotal(variant, purchase, quantity),
    });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: t.api.aucuneRef }, { status: 400 });
  }

  const pieces = items.reduce((sum, i) => {
    const variant = index.get(i.variant_id)!.variant;
    return sum + piecesFor(variant, purchase, i.quantity);
  }, 0);

  if (purchase === "demi_gros" && pieces < settings.min_demi_gros_pieces) {
    return NextResponse.json(
      {
        error: fill(t.api.minDemi, {
          min: settings.min_demi_gros_pieces,
          n: pieces,
        }),
      },
      { status: 422 },
    );
  }
  if (
    purchase === "gros" &&
    items.some((i) => i.quantity < settings.min_gros_cartons)
  ) {
    return NextResponse.json(
      { error: fill(t.api.minGros, { min: settings.min_gros_cartons }) },
      { status: 422 },
    );
  }

  const customer = body.customer ?? {};
  if (channel === "formulaire") {
    if (!customer.name?.trim() || !customer.phone?.trim()) {
      return NextResponse.json({ error: t.api.nomTel }, { status: 400 });
    }
  }

  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  const ref = orderRef();

  const order = {
    ref,
    customer_name: borne(customer.name, 120),
    phone: borne(customer.phone, 40),
    wilaya: borne(customer.wilaya, 80),
    address: borne(customer.address, 300),
    note: borne(customer.note),
    source: borne(body.source, 60),
    channel,
    purchase_type: purchase,
    total,
    status: "nouvelle" as const,
    created_at: new Date().toISOString(),
    items,
  };

  try {
    await createOrder(order);
  } catch (error) {
    console.error("[orders] enregistrement impossible", error);
    return NextResponse.json({ error: t.api.echec }, { status: 500 });
  }

  const message = messageWhatsApp({
    t,
    ref,
    purchase,
    items,
    total,
    pieces,
    customer,
  });

  return NextResponse.json({
    ref,
    total,
    persisted: ordersArePersisted(),
    whatsappUrl: `https://wa.me/${settings.whatsapp_number.replace(
      /\D/g,
      "",
    )}?text=${encodeURIComponent(message)}`,
  });
}

function messageWhatsApp({
  t,
  ref,
  purchase,
  items,
  total,
  pieces,
  customer,
}: {
  t: Dictionary;
  ref: string;
  purchase: PurchaseType;
  items: OrderItem[];
  total: number;
  pieces: number;
  customer: Requete["customer"];
}) {
  const devise = t.unites.devise;
  const unite = purchase === "gros" ? t.unites.cartons : t.unites.pieces;

  const lignes = items.map(
    (i) =>
      `• ${i.product_name} ${i.size_label} — ${i.quantity} ${unite} × ${da(
        i.unit_price,
        devise,
      )} = ${da(i.line_total, devise)}`,
  );

  const corps = [
    t.api.bonjour,
    ``,
    `${t.api.ref} ${ref}`,
    `${t.api.format}${t.api.sep}${t.achat[purchase]}`,
    ``,
    ...lignes,
    ``,
    `${t.api.total}${t.api.sep}${pieces} ${t.unites.pieces} — ${da(total, devise)}`,
  ];

  if (customer?.name) corps.push(``, `${t.api.nom}${t.api.sep}${customer.name}`);
  if (customer?.phone) corps.push(`${t.api.telephone}${t.api.sep}${customer.phone}`);
  if (customer?.wilaya) corps.push(`${t.api.wilaya}${t.api.sep}${customer.wilaya}`);
  if (customer?.note) corps.push(`${t.api.note}${t.api.sep}${customer.note}`);

  return corps.join("\n");
}
