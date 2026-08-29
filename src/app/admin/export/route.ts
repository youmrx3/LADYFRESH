import { isAdmin } from "@/lib/auth";
import { getCommandesExport } from "@/lib/data";

/**
 * L'export des commandes confirmées, au format attendu par le transporteur.
 *
 * Sept colonnes, dans cet ordre exact — c'est la feuille que la société de
 * livraison importe telle quelle. Changer l'ordre ou le libellé d'une colonne
 * casse leur import en silence : les adresses partent dans la case téléphone
 * et personne ne s'en aperçoit avant les retours.
 *
 * Point-virgule et BOM : Excel en français découpe sur le point-virgule et
 * ouvre l'UTF-8 seulement si le BOM est là — sans lui, « Béjaïa » arrive en
 * « BÃ©jaÃ¯a ». Google Sheets reconnaît les deux.
 */
export const dynamic = "force-dynamic";

const COLONNES = [
  "NUMERO DE COMMANDE",
  "NOM",
  "TELEPHONE",
  "WILAYA",
  "ADRESSE DE LIVRAISON",
  "date",
  "price",
];

/*
  Une cellule qui commence par =, +, - ou @ est lue comme une formule par Excel
  et par Sheets. Un nom saisi sur le site est du texte : on le préfixe d'une
  apostrophe pour qu'il le reste, sinon un champ malveillant devient une
  formule exécutée sur le poste de quelqu'un d'autre.
*/
function cellule(valeur: unknown) {
  let s = String(valeur ?? "").replace(/\r?\n/g, " ").trim();
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin()))
    return new Response("Non autorisé.", { status: 401 });

  let commandes;
  try {
    commandes = await getCommandesExport();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Échec.";
    return new Response(`Export impossible : ${detail}`, { status: 500 });
  }

  const lignes = [COLONNES.map(cellule).join(";")];
  for (const c of commandes) {
    lignes.push(
      [
        c.ref,
        c.customer_name,
        // Un numéro reste un numéro : le préfixe évite qu'Excel mange le zéro
        // initial ou le transforme en notation scientifique.
        c.phone ? `'${c.phone}` : "",
        c.wilaya,
        c.address,
        c.created_at?.slice(0, 10) ?? "",
        // Le total tel qu'il sera encaissé, livraison comprise : c'est ce
        // montant-là que le livreur récupère à la porte.
        Math.round(Number(c.total ?? 0)),
      ]
        .map(cellule)
        .join(";"),
    );
  }

  const jour = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lignes.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${jour}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
