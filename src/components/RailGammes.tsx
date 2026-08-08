"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { Reveal } from "./Reveal";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import { champ, nomType } from "@/i18n/contenu";
import type { Gamme, Product, ProductType } from "@/lib/types";

/**
 * Le bloc signature : les 7 gammes en une seule bande horizontale. La colonne
 * regardée s'ouvre, les autres se réduisent à leur couleur. La bande occupe
 * toujours la largeur exacte de l'écran, donc l'alignement est acquis par
 * construction — pas de grille à recaler.
 */
export function RailGammes({
  gammes,
  products,
  types,
}: {
  gammes: Gamme[];
  products: Product[];
  types: ProductType[];
}) {
  const [active, setActive] = useState(0);
  const { setColorFilter, setTypeFilter } = useBoutique();
  const { t, locale } = useReglages();

  const contenu = useMemo(() => {
    const map = new Map<string, { label: string; sizes: string[] }[]>();
    for (const gamme of gammes) {
      map.set(
        gamme.id,
        products
          .filter((p) => p.gamme_id === gamme.id)
          .map((p) => ({
            label: nomType(p, types, locale),
            sizes: p.variants.map((v) => v.size_label),
          })),
      );
    }
    return map;
  }, [gammes, products, types, locale]);

  function versLaBoutique(gamme: Gamme) {
    setTypeFilter("tous");
    setColorFilter(gamme.color_name);
    document.getElementById("boutique")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="gammes"
      className="etage-vitrine saut-ancre border-t border-encre-bord py-20 sm:py-24"
    >
      <div className="shell">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-or">{t.gammes.eyebrow}</p>
            <h2 className="display display-l mt-4 max-w-[18ch]">
              {t.gammes.titre}
            </h2>
          </div>
          <p className="max-w-[34ch] text-[15px] text-craie">
            {t.gammes.intro}
          </p>
        </Reveal>
      </div>

      {/* -------------------------------------------------- bande — desktop */}
      <Reveal className="mt-12 hidden px-[var(--gutter)] lg:block">
        <div className="flex h-[30rem] w-full overflow-hidden rounded-[var(--radius-plaque)] border border-or/25">
          {gammes.map((gamme, i) => {
            const on = i === active;
            const lignes = contenu.get(gamme.id) ?? [];
            return (
              <button
                key={gamme.id}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => versLaBoutique(gamme)}
                aria-label={fill(t.gammes.aria, { nom: gamme.name })}
                className="group relative isolate min-w-0 overflow-hidden border-s border-black/25 text-start transition-[flex-grow] duration-[650ms] first:border-s-0"
                style={{
                  flexGrow: on ? 5.2 : 1,
                  flexBasis: 0,
                  background: gamme.color_hex,
                }}
              >
                {/* La photo de campagne n'apparaît que sur la colonne ouverte. */}
                <Image
                  src={gamme.cover_image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 0px, 46vw"
                  className="object-cover transition-opacity duration-[750ms]"
                  style={{ opacity: on ? 1 : 0 }}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 transition-opacity duration-[750ms]"
                  style={{
                    opacity: on ? 1 : 0,
                    background:
                      "linear-gradient(to top, rgba(11,11,12,0.92) 8%, rgba(11,11,12,0.25) 55%, transparent)",
                  }}
                />

                {/* État réduit : le nom à la verticale, comme une tranche. */}
                <span
                  className="absolute inset-x-0 bottom-0 flex justify-center pb-6 transition-opacity duration-300"
                  style={{ opacity: on ? 0 : 1 }}
                >
                  <span
                    className="display whitespace-nowrap text-[1.05rem] text-white/95"
                    style={{ writingMode: "vertical-rl", rotate: "180deg" }}
                  >
                    {gamme.name}
                  </span>
                </span>

                {/* État ouvert : la fiche. */}
                <span
                  className="pointer-events-none absolute inset-0 flex flex-col justify-end p-7 transition-opacity duration-500"
                  style={{ opacity: on ? 1 : 0 }}
                >
                  <span className="eyebrow flex items-center gap-2 text-white/70">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-white/50"
                      style={{ background: gamme.color_hex }}
                    />
                    {champ(gamme, "tagline", locale)}
                  </span>
                  <span className="display display-l mt-2 block text-white">
                    {gamme.name}
                  </span>
                  <span className="mt-2 block max-w-[36ch] text-[14px] leading-snug text-white/72">
                    {champ(gamme, "description", locale)}
                  </span>

                  <span className="mt-5 block border-t border-white/20 pt-4">
                    <span className="grid gap-1.5">
                      {lignes.map((ligne) => (
                        <span
                          key={ligne.label}
                          className="flex items-baseline justify-between gap-4 whitespace-nowrap"
                        >
                          <span className="text-[13.5px] text-white/88">
                            {ligne.label}
                          </span>
                          <span className="data text-[12px] text-white/58">
                            {ligne.sizes.join(" · ")}
                          </span>
                        </span>
                      ))}
                    </span>
                  </span>

                  <span className="eyebrow mt-5 flex items-center gap-2 text-or-clair">
                    {t.gammes.voirBoutique}
                    <span aria-hidden>→</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* --------------------------------------------------- bande — mobile */}
      <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-2 lg:hidden">
        {gammes.map((gamme) => {
          const lignes = contenu.get(gamme.id) ?? [];
          return (
            <article
              key={gamme.id}
              className="relative w-[78vw] max-w-[22rem] shrink-0 snap-center overflow-hidden rounded-[var(--radius-plaque)] border border-or/25"
              style={{ background: gamme.color_hex }}
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={gamme.cover_image}
                  alt={gamme.name}
                  fill
                  sizes="78vw"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(11,11,12,0.94) 12%, rgba(11,11,12,0.2) 60%, transparent)",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="eyebrow text-white/70">
                    {champ(gamme, "tagline", locale)}
                  </p>
                  <h3 className="display display-m mt-1 text-white">
                    {gamme.name}
                  </h3>
                  <ul className="mt-4 space-y-1 border-t border-white/20 pt-3">
                    {lignes.map((ligne) => (
                      <li
                        key={ligne.label}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="text-[13px] text-white/88">
                          {ligne.label}
                        </span>
                        <span className="data text-[11px] text-white/58">
                          {ligne.sizes.join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => versLaBoutique(gamme)}
                    className="eyebrow mt-4 flex items-center gap-2 text-or-clair"
                  >
                    {t.gammes.voirBoutique} <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
