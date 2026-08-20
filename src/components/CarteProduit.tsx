"use client";

import Image from "next/image";
import { useState } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { Quantite } from "./Quantite";
import { useReglages } from "./Reglages";
import { nomType } from "@/i18n/contenu";
import { da, unitPrice } from "@/lib/format";
import { DEVISE_PIXEL, contenus, pixel } from "@/lib/pixel";
import type { Gamme, Product } from "@/lib/types";

/**
 * La carte d'un produit vendu à l'unité.
 *
 * Plus de sélecteur gros/demi-gros : un prix, une quantité. Quand un produit
 * existe en plusieurs formats, ils s'affichent en boutons — c'est le seul choix
 * qui subsiste, et il porte sur ce que la cliente reçoit, pas sur son statut
 * d'acheteuse.
 */
export function CarteProduit({
  product,
  gamme,
}: {
  product: Product;
  gamme: Gamme | undefined;
}) {
  const { quantiteDe, types } = useBoutique();
  const { t, locale } = useReglages();
  const [taille, setTaille] = useState(0);

  const variant = product.variants[taille] ?? product.variants[0];
  if (!variant) return null;

  const cle = variant.id;
  const dansLeBon = quantiteDe(cle) > 0;
  const prix = unitPrice(variant);
  const accent = gamme?.color_hex ?? "var(--or-plein)";
  const nom = nomType(product, types, locale);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[14px] border transition-all duration-300"
      style={{
        background: "var(--comptoir-surface)",
        borderColor: dansLeBon ? accent : "var(--comptoir-line)",
        boxShadow: dansLeBon
          ? `0 0 0 1px ${accent}, var(--ombre-carte)`
          : "var(--ombre-carte)",
      }}
    >
      <div
        className="relative aspect-square overflow-hidden"
        style={{ background: `color-mix(in srgb, ${accent} 7%, var(--comptoir-surface))` }}
      >
        <Image
          src={variant.image || product.image}
          alt={`${nom} ${gamme?.name ?? ""} ${variant.size_label}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3"
        />
        {gamme && (
          <span
            className="eyebrow absolute start-2.5 top-2.5 flex items-center gap-1.5 rounded-full px-2 py-1 text-[9.5px] backdrop-blur-sm"
            style={{
              background: "color-mix(in srgb, var(--comptoir-surface) 85%, transparent)",
              color: "var(--comptoir-fg)",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            {gamme.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="display text-[1rem] leading-tight">{nom}</h3>

        {product.variants.length > 1 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label={t.boutique.formatAria}>
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setTaille(i)}
                aria-pressed={i === taille}
                className="data rounded border px-2 py-1 text-[11.5px] transition-colors"
                style={{
                  borderColor: i === taille ? "var(--comptoir-fg)" : "var(--comptoir-line)",
                  background: i === taille ? "var(--comptoir-fg)" : "transparent",
                  color: i === taille ? "var(--comptoir-surface)" : "var(--comptoir-muted)",
                }}
              >
                {v.size_label}
              </button>
            ))}
          </div>
        ) : (
          <p className="data mt-2.5 text-[11.5px] text-graphite-doux">
            {variant.size_label}
          </p>
        )}

        <div className="mt-auto pt-3.5">
          <span className="data block text-[1.2rem] leading-none">
            {da(prix, t.unites.devise)}
          </span>
          <div
            className="mt-2.5"
            onClickCapture={() => {
              if (!dansLeBon)
                pixel("AddToCart", {
                  ...contenus([{ variantId: variant.id, quantity: 1 }]),
                  value: prix,
                  currency: DEVISE_PIXEL,
                });
            }}
          >
            <Quantite cle={cle} nom={`${nom} ${variant.size_label}`} />
          </div>
        </div>
      </div>
    </article>
  );
}
