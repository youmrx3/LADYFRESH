import { NextResponse } from "next/server";
import { enregistrerPiste, getSettings } from "@/lib/data";
import { composer, type LigneDemandee } from "@/lib/panier";
import { numeroNormalise } from "@/lib/piste";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import type { ProspectItem } from "@/lib/types";

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

const MAX_CORPS = 32 * 1024;
const MAX_TEXTE = 500;

function borne(valeur: unknown, max = MAX_TEXTE) {
  return typeof valeur === "string" ? valeur.trim().slice(0, max) : "";
}

type Requete = {
  pisteId?: string;
  locale?: string;
  source?: string;
  customer?: Record<string, unknown>;
  lignes?: LigneDemandee[];
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
    Le numéro doit être entier : chaque état intermédiaire de frappe deviendrait
    sinon une piste à part, et la liste se remplirait de brouillons impossibles
    à rappeler.
  */
  const phone = numeroNormalise(borne(body.customer?.phone, 40));
  if (!phone) return recu;

  /*
    La clé vient du navigateur, qui seul sait où commence et finit une session
    de comptoir. Elle doit contenir le numéro : sans ce contrôle, une requête
    forgée écraserait la piste de quelqu'un d'autre en devinant sa clé. À
    défaut, le numéro seul — une piste groupée vaut mieux qu'aucune.
  */
  const fournie = borne(body.pisteId, 80);
  const pisteId = fournie.endsWith(`:${phone}`) ? fournie : phone;

  if (!Array.isArray(body.lignes) || body.lignes.length === 0) return recu;

  const settings = await getSettings();
  // Le minimum ne filtre pas ici : une piste sous le minimum reste à rappeler.
  const { panier } = await composer(body.lignes, 1);
  if (panier.items.length === 0) return recu;

  const items: ProspectItem[] = panier.items.map((i) => ({
    variant_id: i.variant_id ?? "",
    product_name: i.product_name,
    size_label: i.size_label,
    quantity: i.quantity,
    unit_price: i.unit_price,
    line_total: i.line_total,
  }));

  await enregistrerPiste({
    piste_id: pisteId,
    customer_name: borne(body.customer?.name, 120),
    phone,
    wilaya: borne(body.customer?.wilaya, 80),
    address: borne(body.customer?.address, 300),
    note: borne(body.customer?.note),
    source: borne(body.source, 60),
    locale: isLocale(body.locale) ? body.locale : DEFAULT_LOCALE,
    /* Colonne héritée du temps du gros ; la vente est au détail. */
    purchase_type: "demi_gros",
    total: panier.total,
    pieces: panier.articles,
    items,
  });

  void settings;
  return recu;
}
