import Image from "next/image";
import { champ } from "@/i18n/contenu";
import { getT } from "@/i18n/server";
import type { Pack, SiteSettings } from "@/lib/types";

/**
 * L'ouverture.
 *
 * Une page de campagne se juge au pouce, sur un écran de six pouces, dans les
 * deux secondes qui suivent un clic depuis Instagram. Elle doit donc tenir
 * trois promesses avant tout défilement : ce qu'on vend, à quel prix on
 * commence, et où appuyer.
 *
 * Pas de carrousel, pas de vidéo de fond. Les deux coûtent du réseau sur une
 * 4G algérienne et retardent précisément ce qu'on vient chercher. Une photo,
 * un titre, un bouton.
 */
export async function Hero({
  settings,
  packs,
}: {
  settings: SiteSettings;
  packs: Pack[];
}) {
  const { t, locale } = await getT();

  const eyebrow = champ(settings, "hero_eyebrow", locale) || settings.hero_eyebrow;
  const titre = champ(settings, "hero_title", locale) || settings.hero_title;
  const lede = champ(settings, "hero_lede", locale) || settings.hero_lede;

  /* La photo d'ouverture est celle du premier coffret : celui qu'on met en
     avant est aussi celui qu'on montre, sans image à gérer en double. */
  const visuel = packs.find((p) => p.image)?.image ?? "";
  const depuis = packs.length
    ? Math.min(...packs.map((p) => p.price))
    : 0;

  return (
    <section
      id="accueil"
      className="etage-vitrine relative overflow-hidden"
      style={{ background: "var(--vitrine-bg)" }}
    >
      {/* Halo doré, purement décoratif : il pose l'ambiance sans peser. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-24 h-[22rem] w-[22rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--or-plein), transparent 68%)" }}
      />

      <div className="shell relative grid gap-9 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="order-2 lg:order-1">
          <p className="eyebrow text-or">{eyebrow}</p>

          <h1 className="display mt-4 text-[clamp(2.1rem,9vw,3.6rem)] leading-[1.04] tracking-[-0.02em]">
            {titre}
          </h1>

          <p className="lede mt-4 max-w-[42ch] text-craie">{lede}</p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <a href="#boutique" className="btn btn-or !py-4 sm:!px-8">
              {t.hero.ctaBoutique}
            </a>
            {depuis > 0 && (
              <p className="data text-[13px] text-craie sm:ms-4">
                {t.hero.aPartirDe}{" "}
                <span className="text-[16px]" style={{ color: "var(--or-plein)" }}>
                  {depuis} {t.unites.devise}
                </span>
              </p>
            )}
          </div>

          {/* Trois garanties, la friction qu'on lève avant qu'elle ne se pose. */}
          <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5">
            {[t.hero.gageLivraison, t.hero.gagePaiement, t.hero.gageRappel].map(
              (g) => (
                <li
                  key={g}
                  className="flex items-center gap-1.5 text-[12.5px] text-craie"
                >
                  <span aria-hidden style={{ color: "var(--or-plein)" }}>
                    ✓
                  </span>
                  {g}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="order-1 lg:order-2">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-[16px] sm:aspect-[5/4]"
            style={{ background: "color-mix(in srgb, var(--or-plein) 10%, transparent)" }}
          >
            {visuel && (
              <Image
                src={visuel}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
