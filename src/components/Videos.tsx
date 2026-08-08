"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import { champ } from "@/i18n/contenu";
import type { Video } from "@/lib/types";

export function Videos({ videos }: { videos: Video[] }) {
  const { t } = useReglages();
  if (videos.length === 0) return null;

  return (
    <section className="etage-vitrine border-t border-encre-bord py-20 sm:py-24">
      <div className="shell">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-or">{t.videos.eyebrow}</p>
            <h2 className="display display-l mt-4 max-w-[20ch]">
              {t.videos.titre}
            </h2>
          </div>
          <p className="max-w-[32ch] text-[15px] text-craie">{t.videos.intro}</p>
        </Reveal>

        <div
          className="mt-12 grid gap-4 sm:grid-cols-2"
          style={{
            gridTemplateColumns: videos.length === 1 ? "minmax(0,1fr)" : undefined,
          }}
        >
          {videos.map((video, i) => (
            <Reveal key={video.id} delay={i * 90}>
              <Lecteur video={video} solo={videos.length === 1} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Lecteur({ video, solo }: { video: Video; solo: boolean }) {
  const { t, locale } = useReglages();
  const ref = useRef<HTMLVideoElement>(null);
  const [lance, setLance] = useState(false);

  const titre = champ(video, "title", locale);
  const note = champ(video, "note", locale);

  function jouer() {
    setLance(true);
    // Le premier rendu monte l'élément ; on lance à la frame suivante.
    requestAnimationFrame(() => ref.current?.play());
  }

  return (
    <figure
      className="plaque group relative overflow-hidden bg-encre-haut"
      style={{ aspectRatio: solo ? "16 / 9" : "4 / 5" }}
    >
      {lance ? (
        <video
          ref={ref}
          src={video.src}
          poster={video.poster ?? undefined}
          controls
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={jouer}
          className="absolute inset-0 h-full w-full"
          aria-label={fill(t.videos.lire, { titre })}
        >
          {video.poster && (
            <Image
              src={video.poster}
              alt=""
              fill
              sizes="(max-width: 640px) 92vw, 46vw"
              className="object-cover opacity-55 transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(11,11,12,0.92) 6%, rgba(11,11,12,0.35) 60%, rgba(11,11,12,0.55))",
            }}
          />
          <span className="absolute start-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-or/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 rtl:translate-x-1/2">
            <span
              aria-hidden
              className="ms-1 block h-0 w-0 border-y-[9px] border-s-[14px] border-y-transparent"
              style={{ borderInlineStartColor: "var(--or-plein)" }}
            />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-5 text-start">
            <span className="display display-m block text-white">{titre}</span>
            {note && (
              <span className="mt-1 block text-[14px] text-white/70">{note}</span>
            )}
          </span>
        </button>
      )}
    </figure>
  );
}
