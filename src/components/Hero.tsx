"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReglages } from "./Reglages";
import { champ } from "@/i18n/contenu";
import type { Gamme, HeroSlide, SiteSettings } from "@/lib/types";

const DUREE = 5200;

export function Hero({
  slides,
  gammes,
  settings,
  referenceCount,
}: {
  slides: HeroSlide[];
  gammes: Gamme[];
  settings: SiteSettings;
  referenceCount: number;
}) {
  const { t, locale } = useReglages();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const gammeOf = (slide: HeroSlide) =>
    gammes.find((g) => g.id === slide.gamme_id);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      DUREE,
    );
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const active = slides[index];
  const gamme = active ? gammeOf(active) : undefined;
  const accent = gamme?.color_hex ?? "var(--or-plein)";

  const titre = champ(settings, "hero_title", locale);
  const [titreHaut, titreBas] = titre.split("\n");

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      id="accueil"
      className="etage-vitrine relative overflow-hidden pt-[72px]"
      style={{ ["--accent" as string]: accent }}
    >
      {/* Le halo prend la couleur de la gamme affichée. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[10%] -end-[18%] h-[70vh] w-[70vh] rounded-full opacity-[0.16] blur-[120px] transition-colors duration-1000"
        style={{ background: accent }}
      />

      <div className="shell relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)_auto] lg:gap-12 lg:py-24 xl:gap-16">
        {/* ------------------------------------------------ texte, premier bord */}
        <div className="max-w-[34rem]">
          <p
            className="eyebrow lever flex items-center gap-3 text-craie"
            style={{ animationDelay: "80ms" }}
          >
            <span
              className="inline-block h-[6px] w-[6px] shrink-0 rounded-full transition-colors duration-700"
              style={{ background: accent }}
            />
            {champ(settings, "hero_eyebrow", locale)}
          </p>

          <h1
            className="display display-xl lever mt-5"
            style={{ animationDelay: "160ms" }}
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
            className="lede lever mt-6 max-w-[32rem] text-craie"
            style={{ animationDelay: "260ms" }}
          >
            {champ(settings, "hero_lede", locale)}
          </p>

          <div
            className="lever mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "340ms" }}
          >
            <a href="#boutique" className="btn btn-or">
              {t.hero.ctaBoutique}
            </a>
            <a href="#commander" className="btn btn-fantome">
              {t.hero.ctaCommander}
            </a>
          </div>

          <dl
            className="lever mt-11 grid max-w-[20rem] grid-cols-2 gap-px overflow-hidden border-y border-encre-bord bg-encre-bord"
            style={{ animationDelay: "420ms" }}
          >
            {[
              { k: t.hero.statGammes, v: pad(gammes.length) },
              { k: t.hero.statReferences, v: pad(referenceCount) },
            ].map((stat) => (
              <div key={stat.k} className="bg-encre px-3 py-4">
                <dt className="eyebrow text-craie">{stat.k}</dt>
                <dd className="data mt-1.5 text-[1.35rem] text-porcelaine">
                  {stat.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ------------------------------------------------ slideshow centre */}
        <div
          className="lever relative"
          style={{ animationDelay: "220ms" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            className="plaque tracer relative aspect-[3/4] w-full overflow-hidden bg-encre-haut"
            style={{ animationDelay: "300ms" }}
          >
            {slides.map((slide, i) => (
              <Image
                key={slide.id}
                src={slide.image}
                alt={champ(slide, "caption", locale)}
                fill
                sizes="(max-width: 1024px) 92vw, 400px"
                priority={i === 0}
                className="object-cover transition-opacity duration-[900ms]"
                style={{ opacity: i === index ? 1 : 0 }}
              />
            ))}

            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/3"
              style={{
                background:
                  "linear-gradient(to top, rgba(11,11,12,0.85), transparent)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div key={active?.id} className="fondu">
                <p className="eyebrow" style={{ color: accent }}>
                  {champ(active, "eyebrow", locale)}
                </p>
                <p className="display display-m mt-1 text-white">
                  {champ(active, "caption", locale)}
                </p>
              </div>
            </div>

            {/* Progression du slideshow */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-white/15">
              <div
                key={`${index}-${paused}`}
                className="h-full w-full origin-inline-start"
                style={{
                  background: accent,
                  animation: paused
                    ? "none"
                    : `progression ${DUREE}ms linear forwards`,
                }}
              />
            </div>
          </div>

          <style>{`@keyframes progression{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
        </div>

        {/* -------------------------------------------- index des gammes */}
        <div
          className="lever no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:w-[160px] lg:flex-col lg:gap-0 lg:px-0"
          style={{ animationDelay: "380ms" }}
          role="tablist"
          aria-label={t.hero.vitrineAria}
        >
          <p className="eyebrow mb-3 hidden text-craie lg:block">
            {t.hero.index}
          </p>
          {slides.map((slide, i) => {
            const g = gammeOf(slide);
            const on = i === index;
            return (
              <button
                key={slide.id}
                role="tab"
                aria-selected={on}
                onClick={() => setIndex(i)}
                className="group flex shrink-0 items-center gap-2.5 border-encre-bord py-2.5 text-start transition-colors lg:border-t lg:first-of-type:border-t-0"
              >
                <span
                  className="w-[3px] shrink-0 transition-all duration-500"
                  style={{
                    background: on ? g?.color_hex : "var(--vitrine-line)",
                    height: on ? 24 : 12,
                  }}
                />
                <span
                  className="display whitespace-nowrap text-[15px] transition-colors duration-300"
                  style={{
                    color: on ? "var(--vitrine-fg)" : "var(--vitrine-muted)",
                  }}
                >
                  {g?.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
