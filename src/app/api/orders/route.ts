import { NextResponse } from "next/server";
import { createOrder, getSettings, ordersArePersisted, pisteConvertie } from "@/lib/data";
import { orderRef } from "@/lib/format";
import { avertirCommande } from "@/lib/email";
import { composer, type LigneDemandee } from "@/lib/panier";
import { fill, getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/**
 * Bornes d'entrée. Sans elles, une requête forgée peut pousser des chaînes de
 * plusieurs mégaoctets dans les colonnes texte.
 */
const MAX_TEXTE = 500;
const MAX_CORPS = 64 * 1024;

function borne(valeur: unknown, max = MAX_TEXTE) {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : "";
}

type Requete = {
  /** Clé de la piste ouverte pendant la saisie, s'il y en a une. */
  pisteId?: string;
  locale?: string;
  /** Étiquette de campagne, transmise par ?c=… */
  source?: string;
  customer?: Record<string, unknown>;
  lignes?: LigneDemandee[];
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

  if (!Array.isArray(body.lignes) || body.lignes.length === 0) {
    return NextResponse.json({ error: t.api.vide }, { status: 400 });
  }

  const settings = await getSettings();
  const minProduit = Math.max(1, settings.min_produit || 1);
  const { panier, sousMinimum } = await composer(body.lignes, minProduit);

  if (panier.items.length === 0) {
    return NextResponse.json({ error: t.api.aucuneRef }, { status: 400 });
  }
  if (sousMinimum) {
    return NextResponse.json(
      { error: fill(t.api.minProduit, { min: minProduit }) },
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
  const nom = borne(customer.name, 120);
  const tel = borne(customer.phone, 40);
  const wilaya = borne(customer.wilaya, 80);
  if (!nom || !tel || !wilaya) {
    return NextResponse.json({ error: t.api.nomTel }, { status: 400 });
  }

  const ref = orderRef();
  const order = {
    ref,
    customer_name: nom,
    phone: tel,
    wilaya,
    address: borne(customer.address, 300),
    note: borne(customer.note),
    source: borne(body.source, 60),
    /* La colonne est un enum hérité de l'époque WhatsApp. Tout entre désormais
       par le site ; on écrit la seule valeur qui reste. */
    channel: "formulaire" as const,
    /* Idem : la vente est au détail, la colonne garde sa valeur historique. */
    purchase_type: "demi_gros" as const,
    total: panier.total,
    status: "nouvelle" as const,
    created_at: new Date().toISOString(),
    items: panier.items,
  };

  let enregistree;
  try {
    enregistree = await createOrder(order);
  } catch (error) {
    /*
      Le client ne voit qu'un message neutre — une erreur de configuration ne se
      raconte pas à un visiteur. Le journal, lui, doit nommer la cause.
    */
    const brut = error instanceof Error ? error.message : String(error);
    if (/invalid api key|jw[st]|invalid.*token/i.test(brut)) {
      console.error(
        "[orders] SUPABASE_SERVICE_ROLE_KEY refusée par Supabase — commande",
        ref,
        "PERDUE. Vérifier la variable chez l'hébergeur puis redéployer.",
      );
    } else {
      console.error("[orders] enregistrement impossible —", ref, brut);
    }
    return NextResponse.json({ error: t.api.echec }, { status: 500 });
  }

  // La piste ouverte pendant la saisie n'a plus à être rappelée.
  const clePiste = borne(body.pisteId, 80);
  if (clePiste) void pisteConvertie(clePiste);

  /*
    L'avis est attendu plutôt que renvoyé après la réponse : un envoi qui échoue
    hors du fil de la requête ne laisse rien d'exploitable. La vente est déjà
    enregistrée au-dessus, un échec ici ne coûte donc jamais une commande.
  */
  await avertirCommande(enregistree, t.unites.devise);

  return NextResponse.json({
    ref,
    total: panier.total,
    persisted: ordersArePersisted(),
  });
}
