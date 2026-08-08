"use client";

import { useMemo } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { CarteProduit } from "./CarteProduit";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import { COLOR_ORDER } from "@/lib/catalog";
import { da } from "@/lib/format";
import { nomTypeCourt } from "@/i18n/contenu";

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
    types,
  } = useBoutique();
  const { t, locale } = useReglages();

  const couleurs = useMemo(() => {
    const present = new Set(products.map((p) => p.color_name));
    return COLOR_ORDER.filter((c) => present.has(c));
  }, [products]);

  const visibles = useMemo(
    () =>
      products.filter(
        (p) =>
          (typeFilter === "tous" || p.type_id === typeFilter) &&
          (colorFilter === "tous" || p.color_name === colorFilter),
      ),
    [products, typeFilter, colorFilter],
  );

  const filtre = typeFilter !== "tous" || colorFilter !== "tous";

  function toutAfficher() {
    setTypeFilter("tous");
    setColorFilter("tous");
  }

  const nomCouleur = (c: string) =>
    (t.couleurs as Record<string, string>)[c] ?? c;

  return (
    <section
      id="boutique"
      className="etage-comptoir saut-ancre border-t border-trait pb-20 pt-16 sm:pt-20"
    >
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="eyebrow text-graphite-doux">{t.boutique.eyebrow}</p>
            <h2 className="display display-l mt-3">{t.boutique.titre}</h2>
          </div>
          <p className="data text-[13px] text-graphite-doux">
            {fill(t.boutique.tarifs, { format: t.achat[purchase] })} ·{" "}
            {visibles.length}{" "}
            {visibles.length > 1 ? t.boutique.references : t.boutique.reference}
          </p>
        </div>

        {/* ----------------------------------------------------- filtres */}
        <div className="mt-8 space-y-4 border-y border-trait py-5">
          <FiltreRangee
            titre={t.boutique.filtreProduit}
            valeurs={[
              { value: "tous", label: t.boutique.tous },
              ...types
                .filter((type) => type.active)
                .map((type) => ({
                  value: type.id,
                  label: nomTypeCourt(type, locale),
                })),
            ]}
            actif={typeFilter}
            onChange={setTypeFilter}
          />
          <FiltreRangee
            titre={t.boutique.filtreCouleur}
            valeurs={[
              { value: "tous", label: t.boutique.toutes },
              ...couleurs.map((c) => ({
                value: c,
                label: nomCouleur(c),
                puce: gammes.find((g) => g.color_name === c)?.color_hex,
              })),
            ]}
            actif={colorFilter}
            onChange={setColorFilter}
          />
          {filtre && (
            <button
              type="button"
              onClick={toutAfficher}
              className="eyebrow text-graphite-doux underline underline-offset-4 transition-colors hover:text-graphite"
            >
              {t.boutique.toutAfficher}
            </button>
          )}
        </div>

        {/* ------------------------------------------------------ grille */}
        {visibles.length === 0 ? (
          <div className="mt-14 rounded-[var(--radius-plaque)] border border-dashed border-trait py-16 text-center">
            <p className="display display-m">{t.boutique.videTitre}</p>
            <p className="mt-2 text-[15px] text-graphite-doux">
              {t.boutique.videTexte}
            </p>
            <button type="button" onClick={toutAfficher} className="btn btn-encre mt-6">
              {t.boutique.toutAfficher}
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
        <div
          className="sticky bottom-0 z-30 mt-10 border-t backdrop-blur-md"
          style={{
            borderColor: "var(--nav-line)",
            background: "var(--nav-bg)",
            color: "var(--vitrine-fg)",
          }}
        >
          <div className="shell flex items-center justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="eyebrow truncate text-craie">
                {lines.length}{" "}
                {lines.length > 1 ? t.boutique.references : t.boutique.reference}{" "}
                · {pieceCount} {t.unites.pieces}
              </p>
              <p className="data mt-0.5 truncate text-[1.15rem]">
                {da(total, t.unites.devise)}
              </p>
            </div>
            <a href="#commande" className="btn btn-or shrink-0 !px-5 !py-3">
              {t.boutique.barreCommander}
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
      <span className="eyebrow w-[5rem] shrink-0 text-graphite-doux">
        {titre}
      </span>
      <div className="flex flex-wrap gap-1.5">
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
                borderColor: on ? "var(--comptoir-fg)" : "var(--comptoir-line)",
                background: on ? "var(--comptoir-fg)" : "transparent",
                color: on ? "var(--comptoir-surface)" : "var(--comptoir-muted)",
              }}
            >
              {v.puce && (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
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
