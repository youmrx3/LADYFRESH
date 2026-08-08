"use client";

import { Reveal } from "./Reveal";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import type { Gamme, SiteSettings } from "@/lib/types";

/**
 * L'appel final. La bande défilante reprend les sept gammes en lettres
 * creuses : c'est le même index que le rail, réduit à sa signature.
 */
export function AppelFinal({
  gammes,
  settings,
}: {
  gammes: Gamme[];
  settings: SiteSettings;
}) {
  const { t } = useReglages();
  const noms = [...gammes, ...gammes];

  return (
    <section className="etage-vitrine relative overflow-hidden border-t border-encre-bord py-20 sm:py-24">
      <div aria-hidden className="pointer-events-none select-none">
        <div className="marquee flex w-max gap-10">
          {noms.map((g, i) => (
            <span
              key={`${g.id}-${i}`}
              className="display whitespace-nowrap text-[clamp(3rem,9vw,7rem)] leading-none"
              style={{
                color: "transparent",
                WebkitTextStroke: `1px ${g.color_hex}55`,
              }}
            >
              {g.name}
            </span>
          ))}
        </div>
      </div>

      <div className="shell relative mt-14 text-center">
        <Reveal>
          <h2 className="display display-l mx-auto max-w-[20ch]">
            {t.appel.titre}
          </h2>
          <p className="lede mx-auto mt-4 max-w-[46ch] text-craie">
            {fill(t.appel.lede, { min: settings.min_demi_gros_pieces })}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#boutique" className="btn btn-or">
              {t.appel.cta}
            </a>
            <a
              href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-fantome"
            >
              {t.appel.ctaWhatsapp}
            </a>
          </div>
        </Reveal>
      </div>

      <style>{`
        .marquee { animation: defiler 42s linear infinite; }
        @keyframes defiler {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) { .marquee { animation: none; } }
      `}</style>
    </section>
  );
}
