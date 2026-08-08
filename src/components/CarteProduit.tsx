"use client";

import Image from "next/image";
import { useState } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { da, unitPrice } from "@/lib/format";
import { PRODUCT_TYPE_LABEL } from "@/lib/types";
import type { Gamme, Product } from "@/lib/types";

export function CarteProduit({
  product,
  gamme,
}: {
  product: Product;
  gamme: Gamme | undefined;
}) {
  const { purchase, quantityOf, setQuantity, minQuantity } = useBoutique();
  const [taille, setTaille] = useState(0);

  const variant = product.variants[taille] ?? product.variants[0];
  const quantite = quantityOf(variant.id);
  const prix = unitPrice(variant, purchase);
  const accent = gamme?.color_hex ?? "#cba53c";
  const enCommande = quantite > 0;

  const pas = purchase === "gros" ? 1 : minQuantity;

  function ajuster(delta: number) {
    const suivant = quantite + delta;
    setQuantity(variant.id, suivant <= 0 ? 0 : suivant);
  }

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-[10px] border bg-porcelaine-haut transition-all duration-300"
      style={{
        borderColor: enCommande ? accent : "var(--color-trait)",
        boxShadow: enCommande
          ? `0 0 0 1px ${accent}, 0 18px 40px -30px rgba(11,11,12,0.5)`
          : "0 10px 30px -28px rgba(11,11,12,0.45)",
      }}
    >
      {/* ------------------------------------------------------------ visuel */}
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ background: `color-mix(in srgb, ${accent} 7%, #ffffff)` }}
      >
        <Image
          src={variant.image}
          alt={`${product.name} ${variant.size_label}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span
          className="eyebrow absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] text-graphite backdrop-blur-sm"
          style={{ letterSpacing: "0.18em" }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: accent }}
          />
          {gamme?.name}
        </span>
      </div>

      {/* ------------------------------------------------------------- infos */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="display text-[1.0625rem] leading-tight">
          {PRODUCT_TYPE_LABEL[product.type]}
        </h3>

        {/* Tailles : chaque format a son prix et sa photo. */}
        {product.variants.length > 1 ? (
          <div className="mt-3 flex gap-1.5" role="group" aria-label="Format">
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setTaille(i)}
                aria-pressed={i === taille}
                className="data rounded border px-2.5 py-1 text-[12px] transition-colors"
                style={{
                  borderColor: i === taille ? "var(--color-graphite)" : "var(--color-trait)",
                  background: i === taille ? "var(--color-graphite)" : "transparent",
                  color: i === taille ? "#fff" : "var(--color-graphite-doux)",
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

        <div className="mt-4 flex items-baseline gap-1.5 border-t border-trait pt-3">
          <span className="data text-[1.25rem] leading-none">{da(prix)}</span>
          <span className="text-[12px] text-graphite-doux">/ pièce</span>
        </div>

        {purchase === "gros" && (
          <p className="data mt-1.5 text-[11.5px] text-graphite-doux">
            Carton de {variant.units_per_carton} ={" "}
            {da(prix * variant.units_per_carton)}
          </p>
        )}

        {/* ------------------------------------------------------ quantité */}
        <div className="mt-auto pt-4">
          {enCommande ? (
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
              <div className="flex flex-1 items-center rounded border border-trait">
                <button
                  type="button"
                  onClick={() => ajuster(-1)}
                  aria-label="Retirer une unité"
                  className="flex h-9 w-8 shrink-0 items-center justify-center text-[18px] text-graphite-doux transition-colors hover:text-graphite sm:w-9"
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
                  aria-label={`Quantité en ${
                    purchase === "gros" ? "cartons" : "pièces"
                  }`}
                  className="data h-9 w-full min-w-0 border-x border-trait bg-transparent text-center text-[14px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => ajuster(1)}
                  aria-label="Ajouter une unité"
                  className="flex h-9 w-8 shrink-0 items-center justify-center text-[18px] text-graphite-doux transition-colors hover:text-graphite sm:w-9"
                >
                  +
                </button>
              </div>
              <span className="data shrink-0 text-right text-[11.5px] text-graphite-doux">
                {purchase === "gros"
                  ? `${quantite * variant.units_per_carton} pc`
                  : `${quantite} pc`}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setQuantity(variant.id, pas)}
              className="btn btn-encre w-full !px-3 !py-2.5 !text-[11.5px]"
            >
              {purchase === "gros" ? "+ 1 carton" : `+ ${pas} pièces`}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
