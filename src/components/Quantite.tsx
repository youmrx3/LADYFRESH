"use client";

import { useBoutique, type CleLigne } from "./BoutiqueProvider";
import { useReglages } from "./Reglages";

/**
 * Le pas-à-pas de quantité, partagé par les coffrets et les produits.
 *
 * Au seuil, « − » retire la ligne au lieu de la faire descendre en dessous :
 * une quantité sous le minimum produit un bon impossible à envoyer, sans que
 * rien ne l'explique. Le signe passe à « × » pour que le geste ne surprenne
 * pas.
 *
 * Les cibles font 44 px de côté : c'est le minimum tenable au pouce, et cette
 * page est d'abord regardée sur un téléphone.
 */
export function Quantite({ cle, nom }: { cle: CleLigne; nom: string }) {
  const { quantiteDe, poser, minimumDe } = useBoutique();
  const { t } = useReglages();
  const quantite = quantiteDe(cle);
  const pas = minimumDe(cle);

  if (quantite === 0) {
    return (
      <button
        type="button"
        onClick={() => poser(cle, pas)}
        className="btn btn-encre w-full !whitespace-normal !px-3 !py-3 !text-[11.5px]"
      >
        {t.boutique.ajouter}
      </button>
    );
  }

  return (
    <div className="flex w-full items-stretch rounded border border-trait">
      <button
        type="button"
        onClick={() => poser(cle, quantite <= pas ? 0 : quantite - 1)}
        aria-label={quantite <= pas ? t.boutique.retirerLigne : t.boutique.retirerUne}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-[18px] text-graphite-doux transition-colors hover:text-graphite"
      >
        {quantite <= pas ? "×" : "−"}
      </button>
      <input
        type="number"
        min={0}
        value={quantite}
        onChange={(e) => poser(cle, Math.max(0, Number(e.target.value) || 0))}
        /* Recadrage à la sortie du champ : corriger à la frappe empêcherait
           de taper « 12 », dont le premier caractère est un 1. */
        onBlur={(e) => {
          const n = Math.max(0, Number(e.target.value) || 0);
          if (n > 0 && n < pas) poser(cle, pas);
        }}
        aria-label={`${t.boutique.quantiteLigne} — ${nom}`}
        className="data h-11 min-w-0 flex-1 border-x border-trait bg-transparent text-center text-[15px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => poser(cle, quantite + 1)}
        aria-label={t.boutique.ajouterUne}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-[18px] text-graphite-doux transition-colors hover:text-graphite"
      >
        +
      </button>
    </div>
  );
}
