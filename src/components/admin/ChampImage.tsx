"use client";

import { useRef, useState, useTransition } from "react";
import { televerser } from "@/lib/actions";

type Labels = {
  choisirFichier: string;
  televersement: string;
  retirer: string;
  aucune: string;
  ouCollerUrl: string;
};

/**
 * Champ image : aperçu, téléversement depuis l'ordinateur ou le téléphone
 * (`accept` déclenche l'appareil photo sur mobile), ou collage d'une adresse.
 * La valeur envoyée au formulaire est toujours l'URL, dans un input caché.
 */
export function ChampImage({
  label,
  name,
  defaultValue,
  labels,
  accept = "image/*",
  required,
  ratio = "1 / 1",
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  labels: Labels;
  accept?: string;
  required?: boolean;
  ratio?: string;
  className?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const fichier = useRef<HTMLInputElement>(null);

  function choisir(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setErreur(null);
    const data = new FormData();
    data.set("file", f);
    demarrer(async () => {
      const res = await televerser({}, data);
      if (res.url) setUrl(res.url);
      else setErreur(res.error ?? "Échec.");
    });
  }

  return (
    <div className={className}>
      <span className="etiquette">{label}</span>

      <div className="flex items-start gap-3">
        <div
          className="relative w-[68px] shrink-0 overflow-hidden rounded border border-trait bg-comptoir"
          style={{ aspectRatio: ratio }}
        >
          {url ? (
            /* Pas de next/image : l'URL peut pointer n'importe où, y compris
               un domaine qui n'est pas dans remotePatterns. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[9.5px] leading-tight text-graphite-doux">
              {labels.aucune}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input type="hidden" name={name} value={url} required={required} />

          <input
            ref={fichier}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => choisir(e.target.files)}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={enCours}
              onClick={() => fichier.current?.click()}
              className="btn btn-encre !px-3 !py-2 !text-[10.5px]"
            >
              {enCours ? labels.televersement : labels.choisirFichier}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="btn btn-fantome !px-3 !py-2 !text-[10.5px]"
              >
                {labels.retirer}
              </button>
            )}
          </div>

          <input
            type="text"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={labels.ouCollerUrl}
            aria-label={labels.ouCollerUrl}
            className="champ data mt-2 !py-1.5 !text-[11.5px]"
          />

          {erreur && (
            <p role="alert" className="mt-1 text-[12px]" style={{ color: "var(--danger)" }}>
              {erreur}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
