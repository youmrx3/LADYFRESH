"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";

/**
 * Les messages reçus des clientes, en diaporama.
 *
 * Ce sont des captures de conversations : leur hauteur va du simple au
 * quintuple, d'une ligne de félicitations à un paragraphe entier. Les enfermer
 * dans un cadre unique obligerait soit à recadrer — donc à couper le texte, qui
 * est tout l'intérêt — soit à réduire la plus haute jusqu'à l'illisible.
 *
 * Le cadre suit donc la capture affichée : sa hauteur se déduit du format de
 * l'image et s'anime d'une vue à l'autre. Rien n'est rogné, et la page ne
 * sursaute pas toutes les cinq secondes.
 */

/*
  Les dimensions sont écrites ici plutôt que mesurées : elles sont connues à la
  compilation, et les lire dans le DOM demanderait un premier rendu à vide.
*/
const CAPTURES = [
  { src: "/avis/avis-1.jpeg", w: 1080, h: 232 },
  { src: "/avis/avis-2.jpeg", w: 1080, h: 423 },
  { src: "/avis/avis-3.jpeg", w: 1080, h: 465 },
  { src: "/avis/avis-4.jpeg", w: 1080, h: 472 },
  { src: "/avis/avis-5.jpeg", w: 1080, h: 531 },
  { src: "/avis/avis-6.jpeg", w: 1080, h: 746 },
  { src: "/avis/avis-7.jpeg", w: 1080, h: 985 },
  { src: "/avis/avis-8.jpeg", w: 1080, h: 193 },
];

const DELAI = 5000;

export function Avis() {
  const { t } = useReglages();
  const a = t.avis;

  const [index, setIndex] = useState(0);
  const [enPause, setEnPause] = useState(false);

  const suivant = useCallback(
    () => setIndex((i) => (i + 1) % CAPTURES.length),
    [],
  );
  const precedent = useCallback(
    () => setIndex((i) => (i - 1 + CAPTURES.length) % CAPTURES.length),
    [],
  );

  /*
    L'avance automatique s'arrête dès qu'on touche au diaporama : reprendre la
    main puis se faire déplacer une seconde plus tard est le meilleur moyen de
    ne jamais finir de lire un message.

    Elle s'arrête aussi si le système demande moins d'animation, et quand
    l'onglet passe en arrière-plan — sinon on revient sur une page qui a défilé
    toute seule pendant l'absence.
  */
  useEffect(() => {
    if (enPause) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const minuteur = setInterval(() => {
      if (!document.hidden) suivant();
    }, DELAI);
    return () => clearInterval(minuteur);
  }, [enPause, suivant]);

  const actuelle = CAPTURES[index];

  /*
    La hauteur vient d'un remplissage en pourcentage, pas d'une mesure.

    Un pourcentage de `padding-bottom` se calcule sur la largeur du bloc : le
    navigateur donne donc la bonne hauteur sans qu'on ait rien a mesurer, et
    l'anime tout seul d'une capture a l'autre. La version mesuree tombait a zero
    quand le premier rendu se faisait dans un conteneur encore sans largeur — le
    cadre restait plat et les images ne se chargeaient jamais.
  */
  const remplissage = `${((actuelle.h / actuelle.w) * 100).toFixed(3)}%`;

  /* Balayage au doigt : sur téléphone, on fait glisser avant de chercher une flèche. */
  const depart = useRef<number | null>(null);
  const finGeste = (x: number) => {
    if (depart.current === null) return;
    const ecart = x - depart.current;
    depart.current = null;
    if (Math.abs(ecart) < 40) return;
    if (ecart < 0) suivant();
    else precedent();
  };

  return (
    <section
      id="avis"
      className="etage-comptoir saut-ancre border-t border-trait py-14 sm:py-20"
    >
      <div className="shell max-w-[42rem]">
        <p className="eyebrow text-graphite-doux">{a.eyebrow}</p>
        <h2 className="display display-l mt-2.5">{a.titre}</h2>
        <p className="lede mt-3 text-graphite-doux">{a.lede}</p>

        <div
          className="mt-8"
          onMouseEnter={() => setEnPause(true)}
          onMouseLeave={() => setEnPause(false)}
          onFocusCapture={() => setEnPause(true)}
          onBlurCapture={() => setEnPause(false)}
          onTouchStart={(e) => {
            setEnPause(true);
            depart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => finGeste(e.changedTouches[0].clientX)}
        >
          <div
            aria-live="polite"
            className="relative overflow-hidden rounded-[14px] border border-trait"
            style={{
              height: 0,
              paddingBottom: remplissage,
              background: "var(--comptoir-surface)",
              boxShadow: "var(--ombre-carte)",
              transition: "padding-bottom 0.45s var(--ease-plaque)",
            }}
          >
            {CAPTURES.map((c, i) => (
              <Image
                key={c.src}
                src={c.src}
                alt={a.capture}
                width={c.w}
                height={c.h}
                sizes="(max-width: 720px) 100vw, 672px"
                priority={i === 0}
                /*
                  Toutes chargees d'emblee, pas au defilement.

                  Une capture qui arrive en differe laisse un cadre blanc le
                  temps qu'elle descende, et le diaporama avance toutes les cinq
                  secondes : le trou se verrait a chaque tour. Les huit pesent
                  moins de trois cents kilo-octets — le prix est derisoire
                  devant un temoignage qui ne s'affiche pas.
                */
                loading="eager"
                aria-hidden={i !== index}
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  opacity: i === index ? 1 : 0,
                  transition: "opacity 0.45s ease",
                  pointerEvents: "none",
                }}
              />
            ))}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
              <Fleche label={a.precedent} onClick={precedent} sens="start" />
              <Fleche label={a.suivant} onClick={suivant} sens="end" />
            </div>
          </div>

          {/*
            Les pastilles seules sur leur ligne, les fleches posees sur le
            cadre. Sur la meme rangee, huit pastilles et deux fleches ne
            tenaient pas dans 375 pixels : la ligne repassait a la ligne et les
            deux dernieres pastilles se retrouvaient sous les autres.
          */}
          <div className="mt-4 flex items-center justify-center">
            <ol className="flex items-center justify-center gap-1.5">
              {CAPTURES.map((c, i) => (
                <li key={c.src}>
                  <button
                    type="button"
                    aria-label={fill(a.aller, { n: i + 1 })}
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => setIndex(i)}
                    className="flex items-center justify-center"
                    /* La cible fait 28 px, le point 7 : on vise au pouce sans
                       alourdir la ligne de pastilles. */
                    style={{ width: 28, height: 28 }}
                  >
                    <span
                      className="block rounded-full transition-all duration-300"
                      style={{
                        width: i === index ? 22 : 7,
                        height: 7,
                        background:
                          i === index
                            ? "var(--or-plein)"
                            : "color-mix(in srgb, var(--comptoir-fg) 22%, transparent)",
                      }}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fleche({
  label,
  onClick,
  sens,
}: {
  label: string;
  onClick: () => void;
  sens: "start" | "end";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-trait backdrop-blur-sm transition-colors"
      style={{
        background: "color-mix(in srgb, var(--comptoir-surface) 82%, transparent)",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{ transform: sens === "start" ? "scaleX(1)" : "scaleX(-1)" }}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
