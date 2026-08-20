"use client";

import Image from "next/image";
import { clePack, useBoutique } from "./BoutiqueProvider";
import { Quantite } from "./Quantite";
import { useReglages } from "./Reglages";
import { champ } from "@/i18n/contenu";
import { da } from "@/lib/format";
import { DEVISE_PIXEL, contenus, pixel } from "@/lib/pixel";
import type { Pack } from "@/lib/types";

/**
 * La carte d'un coffret.
 *
 * Elle porte tout ce qui décide d'un achat : la photo en grand, ce qu'il y a
 * dedans, et le prix. La composition n'est pas un détail à replier — c'est
 * l'argument même du coffret, et la replier obligerait à un geste de plus sur
 * un écran de téléphone.
 */
export function CartePack({ pack }: { pack: Pack }) {
  const { quantiteDe } = useBoutique();
  const { t, locale } = useReglages();
  const cle = clePack(pack.id);
  const dansLeBon = quantiteDe(cle) > 0;

  const nom = champ(pack, "name", locale) || pack.name;
  const accroche = champ(pack, "tagline", locale);
  const remise =
    pack.prix_barre > pack.price
      ? Math.round(100 - (pack.price / pack.prix_barre) * 100)
      : 0;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[14px] border transition-all duration-300"
      style={{
        background: "var(--comptoir-surface)",
        borderColor: dansLeBon ? "var(--or-plein)" : "var(--comptoir-line)",
        boxShadow: dansLeBon
          ? "0 0 0 1px var(--or-plein), var(--ombre-carte)"
          : "var(--ombre-carte)",
      }}
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: "color-mix(in srgb, var(--or-plein) 8%, var(--comptoir-surface))" }}
      >
        {pack.image && (
          <Image
            src={pack.image}
            alt={nom}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        )}
        {remise > 0 && (
          <span
            className="eyebrow absolute end-3 top-3 rounded-full px-2.5 py-1 text-[10px]"
            style={{ background: "var(--or-plein)", color: "var(--or-fg)" }}
          >
            −{remise}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="display text-[1.15rem] leading-tight">{nom}</h3>
        {accroche && (
          <p className="mt-1.5 text-[13.5px] leading-snug text-graphite-doux">
            {accroche}
          </p>
        )}

        {pack.items.length > 0 && (
          <ul className="mt-3.5 space-y-1.5 border-t border-trait pt-3.5">
            {pack.items.map((i) => (
              <li key={i.id} className="flex gap-2 text-[13px] text-graphite-doux">
                <span aria-hidden style={{ color: "var(--or-plein)" }}>
                  ✓
                </span>
                <span>
                  {i.label}
                  {i.quantity > 1 && ` × ${i.quantity}`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="data text-[1.45rem] leading-none">
              {da(pack.price, t.unites.devise)}
            </span>
            {remise > 0 && (
              <span className="data text-[13px] text-graphite-doux line-through">
                {da(pack.prix_barre, t.unites.devise)}
              </span>
            )}
          </div>

          <div
            className="mt-3"
            onClickCapture={() => {
              /*
                Émis à la capture, avant que le pas-à-pas ne change l'état :
                seule l'entrée au bon compte, un « + » de plus n'est pas une
                nouvelle intention d'achat.
              */
              if (!dansLeBon)
                pixel("AddToCart", {
                  ...contenus([{ variantId: pack.id, quantity: 1 }]),
                  value: pack.price,
                  currency: DEVISE_PIXEL,
                });
            }}
          >
            <Quantite cle={cle} nom={nom} />
          </div>
        </div>
      </div>
    </article>
  );
}
