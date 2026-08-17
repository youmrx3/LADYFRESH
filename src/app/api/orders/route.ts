import { NextResponse } from "next/server";
import {
  createOrder,
  pisteConvertie,
  getGammes,
  getProductTypes,
  getProducts,
  getSettings,
  ordersArePersisted,
} from "@/lib/data";
import {
  lineTotal,
  orderRef,
  piecesFor,
  unitPrice,
} from "@/lib/format";
import { fill, getDictionary } from "@/i18n";
import { avertirCommande } from "@/lib/email";
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
  /** Clé de la piste ouverte pendant la saisie, s'il y en a une. */
  pisteId?: string;
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

  /*
    Le minimum porte sur chaque référence, plus sur le total : cinq pièces d'un
    même produit. Un total de cinq obtenu en mélangeant — deux d'un côté, trois
    de l'autre — n'est plus accepté.
  */
  if (
    purchase === "demi_gros" &&
    items.some((i) => i.quantity < settings.min_demi_gros_pieces)
  ) {
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

  /*
    Sans numéro ni wilaya, une commande ne peut ni se rappeler ni se livrer :
    elle occupe une ligne du back-office sans pouvoir être honorée.

    Contrôle refait ici bien qu'il existe à l'écran : cette route est publique,
    et une requête forgée n'ouvre jamais le formulaire.
  */
  const customer = body.customer ?? {};
  if (
    !customer.name?.trim() ||
    !customer.phone?.trim() ||
    !customer.wilaya?.trim()
  ) {
    return NextResponse.json({ error: t.api.nomTel }, { status: 400 });
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
    channel: "formulaire" as const,
    purchase_type: purchase,
    total,
    status: "nouvelle" as const,
    created_at: new Date().toISOString(),
    items,
  };

  let enregistree;
  try {
    enregistree = await createOrder(order);
  } catch (error) {
    /*
      Le client ne voit qu'un message neutre — une erreur de configuration ne
      se raconte pas à un visiteur. Le journal, lui, doit nommer la cause :
      « Invalid API key » sur cette route signifie que la clé de service est
      refusée, et la commande est perdue à chaque tentative pendant ce temps.
    */
    const brut = error instanceof Error ? error.message : String(error);
    if (/invalid api key|jw[st]|invalid.*token/i.test(brut)) {
      console.error(
        "[orders] SUPABASE_SERVICE_ROLE_KEY refusée par Supabase — commande",
        ref,
        "PERDUE. Vérifier la variable chez l'hébergeur (collage entier, sans espace ni retour à la ligne) puis redéployer.",
      );
    } else {
      console.error("[orders] enregistrement impossible —", ref, brut);
    }
    return NextResponse.json({ error: t.api.echec }, { status: 500 });
  }

  /*
    La piste ouverte pendant la saisie n'a plus à être rappelée : c'est le même
    numéro qui vient de commander. Marqué ici et non depuis le navigateur —
    c'est le seul endroit qui sait avec certitude que la commande est écrite.
    Sans attente : un incident de suivi ne doit pas retarder la confirmation.
  */
  const clePiste = borne(body.pisteId, 80);
  if (clePiste) void pisteConvertie(clePiste);

  /*
    L'avis est attendu, et non renvoyé à après la réponse.

    Il partait auparavant dans `after()`, pour ne pas ajouter la latence de
    Resend au temps d'attente de la cliente. Sauf qu'un envoi qui ne part pas
    dans ce cadre ne laisse aucune trace exploitable : pas d'email, et un
    journal qu'il faut aller chercher. Trois cents millisecondes de plus sur la
    confirmation coûtent moins cher qu'une commande dont personne n'est
    prévenu. L'échec reste sans conséquence sur la vente : elle est déjà
    enregistrée au-dessus.
  */
  await avertirCommande(enregistree, t.unites.devise);

  return NextResponse.json({
    ref,
    total,
    persisted: ordersArePersisted(),
  });
}
