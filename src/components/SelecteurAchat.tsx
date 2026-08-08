"use client";

import { useBoutique } from "./BoutiqueProvider";
import { da } from "@/lib/format";
import type { PurchaseType } from "@/lib/types";

/**
 * Le seuil. C'est ici que le site passe de la vitrine (encre et or) au
 * comptoir (porcelaine) : le choix du format ouvre la partie commerce.
 */
export function SelecteurAchat() {
  const { purchase, setPurchase, purchaseChosen, settings, products } =
    useBoutique();

  // Repère de prix : la brume 250 ml, la référence la plus vendue.
  const repere = products
    .flatMap((p) => p.variants)
    .find((v) => v.size_label === "250 ml" && v.price_demi_gros === 540);

  const options: {
    value: PurchaseType;
    nom: string;
    unite: string;
    minimum: string;
    detail: string;
    prix: number | undefined;
  }[] = [
    {
      value: "demi_gros",
      nom: "Demi-gros",
      unite: "à la pièce",
      minimum: `Dès ${settings.min_demi_gros_pieces} pièces`,
      detail:
        "Vous commandez à l'unité et mélangez librement les gammes. Le minimum porte sur l'ensemble de la commande.",
      prix: repere?.price_demi_gros,
    },
    {
      value: "gros",
      nom: "Gros",
      unite: "au carton",
      minimum: `Dès ${settings.min_gros_cartons} carton${
        settings.min_gros_cartons > 1 ? "s" : ""
      } par référence`,
      detail:
        "Vous commandez par carton complet. Le meilleur tarif, appliqué à chaque pièce du carton.",
      prix: repere?.price_gros,
    },
  ];

  return (
    <section id="format" className="saut-ancre etage-clair">
      {/* Fin de l'étage sombre : le bandeau porte le titre. */}
      <div className="etage-sombre border-t border-encre-bord pb-28 pt-20 sm:pb-32 sm:pt-24">
        <div className="shell max-w-[46rem]">
          <p className="eyebrow text-or">Votre format</p>
          <h2 className="display display-l mt-4">
            Vous achetez en gros ou en demi-gros ?
          </h2>
          <p className="lede mt-4 text-craie">
            Ce choix fixe les prix et l&apos;unité de quantité pour toute la
            boutique. Vous pouvez en changer à tout moment.
          </p>
        </div>
      </div>

      <div className="shell -mt-24 pb-16 sm:pb-20">
        <div
          className="grid gap-4 md:grid-cols-2"
          role="radiogroup"
          aria-label="Type d'achat"
        >
          {options.map((option) => {
            const on = purchase === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPurchase(option.value)}
                className="group rounded-[var(--radius-plaque)] border p-6 text-left transition-all duration-300 sm:p-8"
                style={{
                  background: on ? "#0b0b0c" : "#ffffff",
                  borderColor: on ? "rgba(203,165,60,0.55)" : "var(--color-trait)",
                  color: on ? "#f1f3f2" : "var(--color-graphite)",
                  boxShadow: on
                    ? "0 24px 60px -28px rgba(11,11,12,0.55)"
                    : "0 12px 32px -26px rgba(11,11,12,0.4)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="display display-m">{option.nom}</h3>
                    <p
                      className="eyebrow mt-2"
                      style={{ color: on ? "#cba53c" : "var(--color-graphite-doux)" }}
                    >
                      {option.minimum}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: on ? "#cba53c" : "#c8cecd",
                      background: on ? "#cba53c" : "transparent",
                    }}
                  >
                    {on && (
                      <span className="block h-2 w-2 rounded-full bg-encre" />
                    )}
                  </span>
                </div>

                <p
                  className="mt-5 text-[14.5px] leading-relaxed"
                  style={{ color: on ? "#8b8f8e" : "var(--color-graphite-doux)" }}
                >
                  {option.detail}
                </p>

                {option.prix !== undefined && (
                  <p
                    className="mt-6 flex items-baseline gap-2 border-t pt-4"
                    style={{
                      borderColor: on
                        ? "rgba(203,165,60,0.2)"
                        : "var(--color-trait)",
                    }}
                  >
                    <span
                      className="eyebrow"
                      style={{
                        color: on ? "#8b8f8e" : "var(--color-graphite-doux)",
                      }}
                    >
                      Brume 250 ml
                    </span>
                    <span className="data ml-auto text-[1.05rem]">
                      {da(option.prix)}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{
                        color: on ? "#8b8f8e" : "var(--color-graphite-doux)",
                      }}
                    >
                      /&nbsp;{option.unite}
                    </span>
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {!purchaseChosen && (
          <p className="mt-5 flex items-center gap-2 text-[13.5px] text-graphite-doux">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-or"
            />
            Les prix affichés sont ceux du demi-gros. Choisissez « Gros » pour
            voir les tarifs par carton.
          </p>
        )}
      </div>
    </section>
  );
}
