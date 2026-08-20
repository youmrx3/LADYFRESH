"use client";

import { useState } from "react";

type Ligne = { variantId: string; label: string; quantity: number };

/**
 * La composition d'un coffret.
 *
 * Chaque ligne pointe un format du catalogue et fige son libellé au moment du
 * choix. Ce double enregistrement n'est pas une redondance : le lien sert à
 * savoir ce qui est réellement vendu, le libellé sert à ce que la fiche reste
 * lisible si le format disparaît un jour du catalogue.
 *
 * La liste s'ajoute et se retire côté navigateur, puis part en entier avec le
 * formulaire — le serveur réécrit la composition d'un bloc plutôt que de
 * rapprocher ligne à ligne : quatre entrées ne valent pas une réconciliation.
 */
export function CompositionPack({
  options,
  lignes: initiales,
  labels,
}: {
  options: { value: string; label: string }[];
  lignes: Ligne[];
  labels: {
    titre: string;
    aide: string;
    ajouter: string;
    retirer: string;
    produit: string;
    quantite: string;
    choisir: string;
  };
}) {
  const [lignes, setLignes] = useState<Ligne[]>(
    initiales.length ? initiales : [{ variantId: "", label: "", quantity: 1 }],
  );

  const poser = (i: number, suite: Partial<Ligne>) =>
    setLignes((actuel) =>
      actuel.map((l, n) => (n === i ? { ...l, ...suite } : l)),
    );

  return (
    <div className="rounded-[10px] border border-trait p-3.5">
      <p className="etiquette">{labels.titre}</p>
      <p className="mb-3 text-[12.5px] text-graphite-doux">{labels.aide}</p>

      <ul className="space-y-2">
        {lignes.map((ligne, i) => (
          <li key={i} className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{labels.produit}</span>
              <select
                name="item_variant"
                value={ligne.variantId}
                onChange={(e) => {
                  const value = e.target.value;
                  /* Le libellé suit le choix : c'est lui qui sera montré à la
                     cliente, et qui survivra à la disparition du format. */
                  const trouve = options.find((o) => o.value === value);
                  poser(i, { variantId: value, label: trouve?.label ?? "" });
                }}
                className="champ !py-2 !text-[13px]"
              >
                <option value="">{labels.choisir}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Le libellé voyage caché : le `select` n'envoie que l'identifiant. */}
            <input type="hidden" name="item_label" value={ligne.label} />

            <label className="w-20 shrink-0">
              <span className="sr-only">{labels.quantite}</span>
              <input
                type="number"
                name="item_quantity"
                min={1}
                value={ligne.quantity}
                onChange={(e) =>
                  poser(i, { quantity: Math.max(1, Number(e.target.value) || 1) })
                }
                className="champ !py-2 !text-[13px]"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                setLignes((actuel) =>
                  actuel.length > 1 ? actuel.filter((_, n) => n !== i) : actuel,
                )
              }
              aria-label={labels.retirer}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-trait text-[16px] text-graphite-doux transition-colors hover:text-graphite"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          setLignes((actuel) => [...actuel, { variantId: "", label: "", quantity: 1 }])
        }
        className="btn btn-fantome mt-3 !px-3 !py-2 !text-[10.5px]"
      >
        {labels.ajouter}
      </button>
    </div>
  );
}
