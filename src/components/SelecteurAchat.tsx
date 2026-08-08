"use client";

import { useBoutique } from "./BoutiqueProvider";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import { da } from "@/lib/format";
import type { PurchaseType } from "@/lib/types";

/**
 * Le seuil. C'est ici que le site passe de la vitrine au comptoir : le choix
 * du format ouvre la partie commerce.
 */
export function SelecteurAchat() {
  const { purchase, setPurchase, purchaseChosen, settings, products } =
    useBoutique();
  const { t } = useReglages();

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
      nom: t.achat.demi_gros,
      unite: t.format.alaPiece,
      minimum: fill(t.format.minDemi, { n: settings.min_demi_gros_pieces }),
      detail: t.format.detailDemi,
      prix: repere?.price_demi_gros,
    },
    {
      value: "gros",
      nom: t.achat.gros,
      unite: t.format.auCarton,
      minimum: fill(
        settings.min_gros_cartons > 1 ? t.format.minGrosPluriel : t.format.minGros,
        { n: settings.min_gros_cartons },
      ),
      detail: t.format.detailGros,
      prix: repere?.price_gros,
    },
  ];

  return (
    <section id="format" className="saut-ancre etage-comptoir">
      {/* Fin de l'étage vitrine : le bandeau porte le titre. */}
      <div className="etage-vitrine border-t border-encre-bord pb-28 pt-20 sm:pb-32 sm:pt-24">
        <div className="shell max-w-[46rem]">
          <p className="eyebrow text-or">{t.format.eyebrow}</p>
          <h2 className="display display-l mt-4">{t.format.titre}</h2>
          <p className="lede mt-4 text-craie">{t.format.lede}</p>
        </div>
      </div>

      <div className="shell -mt-24 pb-16 sm:pb-20">
        <div
          className="grid gap-4 md:grid-cols-2"
          role="radiogroup"
          aria-label={t.format.aria}
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
                className="rounded-[var(--radius-plaque)] border p-6 text-start transition-all duration-300 sm:p-8"
                style={{
                  background: on
                    ? "var(--vitrine-fg)"
                    : "var(--comptoir-surface)",
                  borderColor: on
                    ? "color-mix(in srgb, var(--or-plein) 55%, transparent)"
                    : "var(--comptoir-line)",
                  color: on ? "var(--vitrine-bg)" : "var(--comptoir-fg)",
                  boxShadow: on ? "var(--ombre-choix)" : "var(--ombre-carte)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="display display-m">{option.nom}</h3>
                    <p
                      className="eyebrow mt-2"
                      style={{
                        color: on ? "var(--or-plein)" : "var(--comptoir-muted)",
                      }}
                    >
                      {option.minimum}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: on
                        ? "var(--or-plein)"
                        : "var(--comptoir-line)",
                      background: on ? "var(--or-plein)" : "transparent",
                    }}
                  >
                    {on && (
                      <span
                        className="block h-2 w-2 rounded-full"
                        style={{ background: "var(--or-fg)" }}
                      />
                    )}
                  </span>
                </div>

                <p
                  className="mt-5 text-[14.5px] leading-relaxed"
                  style={{ opacity: on ? 0.72 : 1, color: "inherit" }}
                >
                  {option.detail}
                </p>

                {option.prix !== undefined && (
                  <p
                    className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t pt-4"
                    style={{
                      borderColor: on
                        ? "color-mix(in srgb, var(--or-plein) 24%, transparent)"
                        : "var(--comptoir-line)",
                    }}
                  >
                    <span className="eyebrow" style={{ opacity: 0.66 }}>
                      {t.format.repere}
                    </span>
                    <span className="data ms-auto text-[1.05rem]">
                      {da(option.prix, t.unites.devise)}
                    </span>
                    <span className="text-[12px]" style={{ opacity: 0.66 }}>
                      /&nbsp;{option.unite}
                    </span>
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {!purchaseChosen && (
          <p className="mt-5 flex items-start gap-2 text-[13.5px] text-graphite-doux">
            <span
              aria-hidden
              className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-or"
            />
            {t.format.indice}
          </p>
        )}
      </div>
    </section>
  );
}
