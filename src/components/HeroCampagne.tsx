import Image from "next/image";
import { champ } from "@/i18n/contenu";
import { getT } from "@/i18n/server";
import { da } from "@/lib/format";
import type { Pack, SiteSettings } from "@/lib/types";

/**
 * L'ouverture de la page de campagne.
 *
 * Elle se juge au pouce, sur un écran de six pouces, dans les deux secondes
 * qui suivent un clic payé. Trois choses doivent donc être lues avant tout
 * défilement : ce qu'on vend, à partir de quel prix, et où appuyer.
 *
 * Ni carrousel ni vidéo de fond — les deux coûtent du réseau sur une 4G et
 * retardent exactement ce qu'on vient chercher. La mise en scène tient à trois
 * gestes : un cadre doré décalé derrière la photo, une seconde ligne de titre
 * en or, et un chiffre de prix assez gros pour se lire de loin.
 *
 * Tout le texte vient des réglages : une campagne s'ajuste entre deux
 * publicités, et une retouche qui exige un déploiement n'a jamais lieu.
 */
export async function HeroCampagne({
  settings,
  packs,
}: {
  settings: SiteSettings;
  packs: Pack[];
}) {
  const { t, locale } = await getT();

  const eyebrow = champ(settings, "camp_eyebrow", locale);
  const titre = champ(settings, "camp_titre", locale);
  const lede = champ(settings, "camp_lede", locale);
  const cta = champ(settings, "camp_cta", locale) || t.hero.ctaBoutique;
  const gages = champ(settings, "camp_gages", locale)
    .split("|")
    .map((g) => g.trim())
    .filter(Boolean);

  const [titreHaut, ...reste] = titre.split("\n");
  const titreBas = reste.join(" ");

  /* Photo choisie dans les réglages ; à défaut celle du premier coffret, pour
     qu'une campagne lancée sans image ne s'ouvre pas sur un trou. */
  const visuel =
    settings.camp_image || packs.find((p) => p.image)?.image || "";
  const depuis = packs.length ? Math.min(...packs.map((p) => p.price)) : 0;

  return (
    <section
      id="accueil"
      className="etage-vitrine relative overflow-hidden"
      style={{ background: "var(--vitrine-bg)" }}
    >
      {/* Halo doré : l'ambiance sans le poids d'une image de fond. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-32 -top-32 h-[26rem] w-[26rem] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--or-plein), transparent 68%)",
        }}
      />

      {/*
        Sans photo, pas de colonne : un cadre vide mangerait un écran entier de
        téléphone avant le premier mot. La grille retombe alors sur une seule
        colonne et le texte prend toute la largeur.
      */}
      <div
        className={`shell relative grid gap-10 py-12 sm:py-16 lg:items-center lg:gap-14 lg:py-20 ${
          visuel ? "lg:grid-cols-[1.05fr_1fr]" : ""
        }`}
      >
        {/* -------------------------------------------------------- visuel */}
        {visuel && (
        <div className="lever order-1 lg:order-2" style={{ animationDelay: "120ms" }}>
          <div className="relative">
            {/*
              Cadre décalé : deux traits d'or qui débordent de la photo. Le
              procédé coûte une div et donne à l'image une assise que le seul
              rectangle n'a pas.
            */}
            <div
              aria-hidden
              className="absolute -bottom-3 -end-3 h-full w-full rounded-[16px] border sm:-bottom-4 sm:-end-4"
              style={{ borderColor: "color-mix(in srgb, var(--or-plein) 55%, transparent)" }}
            />
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[16px] sm:aspect-[5/4] lg:aspect-[4/5]"
              style={{
                background: "color-mix(in srgb, var(--or-plein) 10%, transparent)",
              }}
            >
              <Image
                src={visuel}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover"
              />

              {depuis > 0 && (
                <span
                  className="absolute bottom-0 end-0 flex flex-col items-end px-4 py-3 text-end"
                  style={{
                    background:
                      "linear-gradient(to top left, rgba(11,11,12,0.9), transparent 85%)",
                  }}
                >
                  <span className="eyebrow text-[9.5px] text-craie">
                    {t.hero.aPartirDe}
                  </span>
                  <span
                    className="data text-[1.6rem] leading-none"
                    style={{ color: "var(--or-plein)" }}
                  >
                    {da(depuis, t.unites.devise)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        )}

        {/* --------------------------------------------------------- texte */}
        <div className="order-2 lg:order-1">
          <p className="eyebrow lever flex items-center gap-2.5 text-craie">
            <span
              aria-hidden
              className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
              style={{ background: "var(--or-plein)" }}
            />
            {eyebrow}
          </p>

          <h1
            className="display lever mt-4 text-[clamp(2.15rem,8.5vw,3.5rem)] leading-[1.05] tracking-[-0.022em]"
            style={{ animationDelay: "90ms" }}
          >
            {titreHaut}
            {titreBas && (
              <>
                <br />
                <span className="text-or">{titreBas}</span>
              </>
            )}
          </h1>

          <p
            className="lede lever mt-5 max-w-[40ch] text-craie"
            style={{ animationDelay: "170ms" }}
          >
            {lede}
          </p>

          <div className="lever mt-8" style={{ animationDelay: "250ms" }}>
            <a
              href="#boutique"
              className="btn btn-or w-full !whitespace-normal !py-4 !leading-snug sm:w-auto sm:!px-9"
            >
              {cta}
            </a>
          </div>

          {gages.length > 0 && (
            <ul
              className="lever mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap sm:gap-x-6"
              style={{ animationDelay: "330ms" }}
            >
              {gages.map((g) => (
                <li key={g} className="flex items-center gap-2 text-[13px] text-craie">
                  <span aria-hidden style={{ color: "var(--or-plein)" }}>
                    ✓
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Le bandeau d'annonce.
 *
 * Une bande fine tout en haut, allumée le temps d'une offre. Séparée du hero
 * parce qu'elle vit à un autre rythme : le titre d'une campagne tient des
 * semaines, « livraison offerte ce week-end » tient deux jours.
 */
export async function BandeauCampagne({ settings }: { settings: SiteSettings }) {
  const { locale } = await getT();
  if (!settings.camp_bandeau_actif) return null;

  const texte = champ(settings, "camp_bandeau", locale);
  if (!texte) return null;

  return (
    <p
      className="px-4 py-2 text-center text-[12.5px] font-medium"
      style={{ background: "var(--or-plein)", color: "var(--or-fg)" }}
    >
      {texte}
    </p>
  );
}
