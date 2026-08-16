import { NextResponse } from "next/server";
import { enregistrerPiste, getProducts } from "@/lib/data";
import { lineTotal, piecesFor, unitPrice } from "@/lib/format";
import { numeroNormalise } from "@/lib/piste";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import type { ProspectItem, PurchaseType } from "@/lib/types";

/**
 * Les paniers laissés en route.
 *
 * Le pixel montrait beaucoup d'arrivées et peu d'envois. Cette route recueille
 * ce qui a été saisi avant l'abandon, pour qu'un rappel soit possible.
 *
 * Elle ne répond jamais autre chose que « reçu ». Un visiteur n'a pas à savoir
 * qu'on garde une trace de sa saisie, et surtout : rien ici ne doit gêner le
 * parcours. Une piste ratée n'est qu'une piste ratée, une commande bloquée par
 * un incident de suivi serait une vente perdue.
 */

const MAX_LIGNES = 100;
const MAX_CORPS = 32 * 1024;
const MAX_TEXTE = 500;

function borne(valeur: unknown, max = MAX_TEXTE) {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : "";
}

type Requete = {
  purchase?: PurchaseType;
  locale?: string;
  source?: string;
  customer?: Record<string, unknown>;
  items?: { variantId: string; quantity: number }[];
};

export async function POST(request: Request) {
  const recu = NextResponse.json({ ok: true });

  let body: Requete;
  try {
    const brut = await request.text();
    if (brut.length > MAX_CORPS) return recu;
    body = JSON.parse(brut);
  } catch {
    return recu;
  }

  /*
    Le numéro fait la clé. Refusé s'il est incomplet : chaque état intermédiaire
    de frappe deviendrait sinon une piste à part, et la liste se remplirait de
    brouillons impossibles à rappeler.
  */
  const phone = numeroNormalise(borne(body.customer?.phone, 40));
  if (!phone) return recu;

  if (!Array.isArray(body.items) || body.items.length === 0) return recu;
  if (body.items.length > MAX_LIGNES) return recu;

  const purchase: PurchaseType =
    body.purchase === "gros" ? "gros" : "demi_gros";
  const locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;

  const products = await getProducts();

  const index = new Map(
    products.flatMap((p) =>
      p.variants.map((v) => [v.id, { product: p, variant: v }] as const),
    ),
  );

  // Mêmes règles que pour une commande : le prix vient de la base, jamais du
  // navigateur. Une piste avec un total inventé fausserait la relance.
  const items: ProspectItem[] = [];
  let pieces = 0;
  for (const ligne of body.items) {
    const entree = index.get(ligne.variantId);
    const quantity = Math.floor(Number(ligne.quantity));
    if (!entree || !Number.isFinite(quantity) || quantity <= 0) continue;
    const { product, variant } = entree;
    items.push({
      variant_id: variant.id,
      product_name: `${product.name || product.slug}`.trim(),
      size_label: variant.size_label,
      quantity,
      unit_price: unitPrice(variant, purchase),
      line_total: lineTotal(variant, purchase, quantity),
    });
    pieces += piecesFor(variant, purchase, quantity);
  }
  if (items.length === 0) return recu;

  await enregistrerPiste({
    piste_id: phone,
    customer_name: borne(body.customer?.name, 120),
    phone,
    wilaya: borne(body.customer?.wilaya, 80),
    address: borne(body.customer?.address, 300),
    note: borne(body.customer?.note),
    source: borne(body.source, 60),
    locale,
    purchase_type: purchase,
    total: items.reduce((s, i) => s + i.line_total, 0),
    pieces,
    items,
  });

  return recu;
}
