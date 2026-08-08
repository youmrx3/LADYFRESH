"use client";

import Image from "next/image";
import { useState } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import { da, unitPrice } from "@/lib/format";
import type { Gamme, Product } from "@/lib/types";

export function CarteProduit({
  product,
  gamme,
}: {
  product: Product;
  gamme: Gamme | undefined;
}) {
  const { purchase, quantityOf, setQuantity, minQuantity } = useBoutique();
  const { t } = useReglages();
  const [taille, setTaille] = useState(0);

  const variant = product.variants[taille] ?? product.variants[0];
  const quantite = quantityOf(variant.id);
  const prix = unitPrice(variant, purchase);
  const accent = gamme?.color_hex ?? "var(--or-plein)";
  const enCommande = quantite > 0;

  const pas = purchase === "gros" ? 1 : minQuantity;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-[10px] border transition-all duration-300"
      style={{
        background: "var(--comptoir-surface)",
        borderColor: enCommande ? accent : "var(--comptoir-line)",
        boxShadow: enCommande
          ? `0 0 0 1px ${accent}, var(--ombre-carte)`
          : "var(--ombre-carte)",
      }}
    >
      {/* ------------------------------------------------------------ visuel */}
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{
          background: `color-mix(in srgb, ${accent} 7%, var(--comptoir-surface))`,
        }}
      >
        <Image
          src={variant.image}
          alt={`${t.types[product.type]} ${gamme?.name ?? ""} ${variant.size_label}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span
          className="eyebrow absolute start-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] backdrop-blur-sm"
          style={{
            background: "color-mix(in srgb, var(--comptoir-surface) 85%, transparent)",
            color: "var(--comptoir-fg)",
          }}
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
          />
          {gamme?.name}
        </span>
      </div>

      {/* ------------------------------------------------------------- infos */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="display text-[1.0625rem] leading-tight">
          {t.types[product.type]}
        </h3>

        {/* Chaque format a son prix et sa photo. */}
        {product.variants.length > 1 ? (
          <div className="mt-3 flex gap-1.5" role="group" aria-label={t.boutique.formatAria}>
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setTaille(i)}
                aria-pressed={i === taille}
                className="data rounded border px-2.5 py-1 text-[12px] transition-colors"
                style={{
                  borderColor:
                    i === taille ? "var(--comptoir-fg)" : "var(--comptoir-line)",
                  background: i === taille ? "var(--comptoir-fg)" : "transparent",
                  color:
                    i === taille
                      ? "var(--comptoir-surface)"
                      : "var(--comptoir-muted)",
                }}
              >
                {v.size_label}
              </button>
            ))}
          </div>
        ) : (
          <p className="data mt-3 text-[12px] text-graphite-doux">
            {variant.size_label}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 border-t border-trait pt-3">
          <span className="data text-[1.25rem] leading-none">
            {da(prix, t.unites.devise)}
          </span>
          <span className="text-[12px] text-graphite-doux">
            {t.boutique.parPiece}
          </span>
        </div>

        {purchase === "gros" && (
          <p className="data mt-1.5 text-[11.5px] text-graphite-doux">
            {fill(t.boutique.cartonDe, {
              n: variant.units_per_carton,
              prix: da(prix * variant.units_per_carton, t.unites.devise),
            })}
          </p>
        )}

        {/* ------------------------------------------------------ quantité */}
        <div className="mt-auto pt-4">
          {enCommande ? (
            <div>
              {/*
                Le pas-à-pas occupe toute la largeur. L'échelle « N pc » vivait
                à côté et rétrécissait le champ à mesure que le nombre
                grandissait, jusqu'à écraser le chiffre : elle est passée
                dessous, et seulement quand elle apprend quelque chose.
              */}
              <div className="flex w-full items-stretch rounded border border-trait">
                <button
                  type="button"
                  onClick={() => setQuantity(variant.id, quantite - 1)}
                  aria-label={t.boutique.retirerUne}
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-[18px] text-graphite-doux transition-colors hover:text-graphite"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={quantite}
                  onChange={(e) =>
                    setQuantity(variant.id, Math.max(0, Number(e.target.value) || 0))
                  }
                  aria-label={fill(t.boutique.quantiteAria, {
                    unite:
                      purchase === "gros" ? t.unites.cartons : t.unites.pieces,
                  })}
                  className="data h-9 min-w-0 flex-1 border-x border-trait bg-transparent text-center text-[14px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(variant.id, quantite + 1)}
                  aria-label={t.boutique.ajouterUne}
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-[18px] text-graphite-doux transition-colors hover:text-graphite"
                >
                  +
                </button>
              </div>

              {purchase === "gros" && (
                <p className="data mt-1.5 text-center text-[11px] text-graphite-doux">
                  {fill(t.boutique.egale, {
                    n: quantite * variant.units_per_carton,
                  })}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setQuantity(variant.id, pas)}
              className="btn btn-encre w-full !px-3 !py-2.5 !text-[11.5px]"
            >
              {purchase === "gros"
                ? t.boutique.ajouterCarton
                : fill(t.boutique.ajouterPieces, { n: pas })}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
