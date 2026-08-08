"use client";

import { useMemo } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { CarteProduit } from "./CarteProduit";
import { COLOR_ORDER } from "@/lib/catalog";
import { da, purchaseLabel } from "@/lib/format";
import { PRODUCT_TYPES } from "@/lib/types";

export function Boutique() {
  const {
    products,
    gammes,
    purchase,
    typeFilter,
    setTypeFilter,
    colorFilter,
    setColorFilter,
    lines,
    total,
    pieceCount,
  } = useBoutique();

  const couleurs = useMemo(() => {
    const present = new Set(products.map((p) => p.color_name));
    return COLOR_ORDER.filter((c) => present.has(c));
  }, [products]);

  const visibles = useMemo(
    () =>
      products.filter(
        (p) =>
          (typeFilter === "tous" || p.type === typeFilter) &&
          (colorFilter === "tous" || p.color_name === colorFilter),
      ),
    [products, typeFilter, colorFilter],
  );

  const filtre = typeFilter !== "tous" || colorFilter !== "tous";

  return (
    <section id="boutique" className="etage-clair saut-ancre border-t border-trait pb-20 pt-16 sm:pt-20">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="eyebrow text-graphite-doux">Boutique</p>
            <h2 className="display display-l mt-3">Le catalogue complet.</h2>
          </div>
          <p className="data text-[13px] text-graphite-doux">
            Tarifs {purchaseLabel(purchase).toLowerCase()} · {visibles.length}{" "}
            référence{visibles.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ----------------------------------------------------- filtres */}
        <div className="mt-8 space-y-4 border-y border-trait py-5">
          <FiltreRangee
            titre="Produit"
            valeurs={[
              { value: "tous", label: "Tous" },
              ...PRODUCT_TYPES.map((t) => ({ value: t.value, label: t.label })),
            ]}
            actif={typeFilter}
            onChange={(v) => setTypeFilter(v as typeof typeFilter)}
          />
          <FiltreRangee
            titre="Couleur"
            valeurs={[
              { value: "tous", label: "Toutes" },
              ...couleurs.map((c) => ({
                value: c,
                label: c,
                puce: gammes.find((g) => g.color_name === c)?.color_hex,
              })),
            ]}
            actif={colorFilter}
            onChange={setColorFilter}
          />
          {filtre && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("tous");
                setColorFilter("tous");
              }}
              className="eyebrow text-graphite-doux underline underline-offset-4 transition-colors hover:text-graphite"
            >
              Tout afficher
            </button>
          )}
        </div>

        {/* ------------------------------------------------------ grille */}
        {visibles.length === 0 ? (
          <div className="mt-14 rounded-[var(--radius-plaque)] border border-dashed border-trait py-16 text-center">
            <p className="display display-m">Aucune référence dans ce filtre.</p>
            <p className="mt-2 text-[15px] text-graphite-doux">
              Essayez une autre couleur, ou affichez tout le catalogue.
            </p>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("tous");
                setColorFilter("tous");
              }}
              className="btn btn-encre mt-6"
            >
              Tout afficher
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {visibles.map((product) => (
              <CarteProduit
                key={product.id}
                product={product}
                gamme={gammes.find((g) => g.id === product.gamme_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------ barre récap collante */}
      {lines.length > 0 && (
        <div className="sticky bottom-0 z-30 mt-10 border-t border-or/30 bg-encre/95 backdrop-blur-md">
          <div className="shell flex items-center justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="eyebrow text-craie">
                {lines.length} référence{lines.length > 1 ? "s" : ""} ·{" "}
                {pieceCount} pièces
              </p>
              <p className="data mt-0.5 truncate text-[1.15rem] text-porcelaine">
                {da(total)}
              </p>
            </div>
            <a href="#commande" className="btn btn-or shrink-0 !px-5 !py-3">
              Commander
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

function FiltreRangee({
  titre,
  valeurs,
  actif,
  onChange,
}: {
  titre: string;
  valeurs: { value: string; label: string; puce?: string }[];
  actif: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="eyebrow w-[4.5rem] shrink-0 text-graphite-doux">
        {titre}
      </span>
      <div className="no-scrollbar flex flex-wrap gap-1.5">
        {valeurs.map((v) => {
          const on = actif === v.value;
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => onChange(v.value)}
              aria-pressed={on}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors"
              style={{
                borderColor: on ? "var(--color-graphite)" : "var(--color-trait)",
                background: on ? "var(--color-graphite)" : "transparent",
                color: on ? "#fff" : "var(--color-graphite-doux)",
              }}
            >
              {v.puce && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: v.puce }}
                />
              )}
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
