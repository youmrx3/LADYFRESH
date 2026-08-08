"use client";

import { Reveal } from "./Reveal";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import type { SiteSettings } from "@/lib/types";

export function CommentCommander({ settings }: { settings: SiteSettings }) {
  const { t } = useReglages();

  return (
    <section
      id="commander"
      className="etage-vitrine saut-ancre border-t border-encre-bord py-20 sm:py-24"
    >
      <div className="shell">
        <Reveal>
          <p className="eyebrow text-or">{t.commander.eyebrow}</p>
          <h2 className="display display-l mt-4 max-w-[22ch]">
            {t.commander.titre}
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-px bg-encre-bord sm:mt-16 md:grid-cols-3">
          {t.commander.etapes.map((etape, i) => (
            <Reveal as="li" key={etape.titre} delay={i * 110}>
              <div className="h-full bg-encre p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="data text-[13px] text-or">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-or/25" />
                </div>
                <h3 className="display display-m mt-6">{etape.titre}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-craie">
                  {fill(etape.texte, { min: settings.min_demi_gros_pieces })}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
