import { NextResponse } from "next/server";
import { createOrder, getGammes, getProducts, getSettings, ordersArePersisted } from "@/lib/data";
import { da, lineTotal, orderRef, piecesFor, purchaseLabel, unitPrice } from "@/lib/format";
import { PRODUCT_TYPE_LABEL } from "@/lib/types";
import type { OrderItem, PurchaseType } from "@/lib/types";

type Requete = {
  channel: "whatsapp" | "formulaire";
  purchase: PurchaseType;
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
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const purchase: PurchaseType = body.purchase === "gros" ? "gros" : "demi_gros";
  const channel: "whatsapp" | "formulaire" =
    body.channel === "formulaire" ? "formulaire" : "whatsapp";

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: "Votre commande est vide." },
      { status: 400 },
    );
  }

  const [products, gammes, settings] = await Promise.all([
    getProducts(),
    getGammes(),
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
    if (!entree || !Number.isFinite(quantity) || quantity <= 0) continue;
    const { product, variant } = entree;
    items.push({
      id: "",
      order_id: "",
      variant_id: variant.id,
      product_name: `${PRODUCT_TYPE_LABEL[product.type]} ${
        gammes.find((g) => g.id === product.gamme_id)?.name ?? ""
      }`.trim(),
      gamme_name: gammes.find((g) => g.id === product.gamme_id)?.name ?? "",
      size_label: variant.size_label,
      unit_price: unitPrice(variant, purchase),
      quantity,
      units_per_carton: variant.units_per_carton,
      line_total: lineTotal(variant, purchase, quantity),
    });
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Aucune référence valide dans la commande." },
      { status: 400 },
    );
  }

  const pieces = items.reduce((sum, i) => {
    const variant = index.get(i.variant_id)!.variant;
    return sum + piecesFor(variant, purchase, i.quantity);
  }, 0);

  if (purchase === "demi_gros" && pieces < settings.min_demi_gros_pieces) {
    return NextResponse.json(
      {
        error: `Le demi-gros démarre à ${settings.min_demi_gros_pieces} pièces. Votre commande en compte ${pieces}.`,
      },
      { status: 422 },
    );
  }
  if (
    purchase === "gros" &&
    items.some((i) => i.quantity < settings.min_gros_cartons)
  ) {
    return NextResponse.json(
      {
        error: `Le gros démarre à ${settings.min_gros_cartons} carton par référence.`,
      },
      { status: 422 },
    );
  }

  const customer = body.customer ?? {};
  if (channel === "formulaire") {
    if (!customer.name?.trim() || !customer.phone?.trim()) {
      return NextResponse.json(
        { error: "Indiquez au moins votre nom et votre téléphone." },
        { status: 400 },
      );
    }
  }

  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  const ref = orderRef();

  const order = {
    ref,
    customer_name: (customer.name ?? "").trim(),
    phone: (customer.phone ?? "").trim(),
    wilaya: (customer.wilaya ?? "").trim(),
    address: (customer.address ?? "").trim(),
    note: (customer.note ?? "").trim(),
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
    return NextResponse.json(
      { error: "La commande n'a pas pu être enregistrée. Réessayez." },
      { status: 500 },
    );
  }

  const message = messageWhatsApp({
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
  ref,
  purchase,
  items,
  total,
  pieces,
  customer,
}: {
  ref: string;
  purchase: PurchaseType;
  items: OrderItem[];
  total: number;
  pieces: number;
  customer: Requete["customer"];
}) {
  const unite = purchase === "gros" ? "carton" : "pc";
  const lignes = items.map((i) => {
    const q = `${i.quantity} ${unite}${i.quantity > 1 ? "s" : ""}`;
    return `• ${i.product_name} ${i.size_label} — ${q} × ${da(
      i.unit_price,
    )} = ${da(i.line_total)}`;
  });

  const entete = [
    `Bonjour Lady Fresh, je souhaite passer commande.`,
    ``,
    `Réf. ${ref}`,
    `Format : ${purchaseLabel(purchase)}`,
    ``,
    ...lignes,
    ``,
    `Total : ${pieces} pièces — ${da(total)}`,
  ];

  if (customer?.name) entete.push(``, `Nom : ${customer.name}`);
  if (customer?.phone) entete.push(`Téléphone : ${customer.phone}`);
  if (customer?.wilaya) entete.push(`Wilaya : ${customer.wilaya}`);
  if (customer?.note) entete.push(`Note : ${customer.note}`);

  return entete.join("\n");
}
