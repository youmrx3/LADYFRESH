"use client";

import { useRef, useState, useTransition } from "react";
import { televerser, urlDeTeleversement } from "@/lib/actions";

type Labels = {
  choisirFichier: string;
  televersement: string;
  retirer: string;
  aucune: string;
  ouCollerUrl: string;
};

/** Au-delà, la photo est réduite avant l'envoi : le site n'affiche pas plus. */
const LARGEUR_MAX = 1600;
const QUALITE = 0.85;

/**
 * Réduit une photo dans le navigateur avant l'envoi.
 *
 * Les visuels arrivent souvent d'un téléphone : 3 à 6 Mo pour une image que le
 * site n'affiche jamais au-delà de 1600 px. Compresser ici rend l'envoi
 * possible en 4G, allège le stockage, et évite d'approcher les limites de
 * taille. Si quoi que ce soit échoue — format exotique, canvas indisponible —
 * on renvoie le fichier d'origine plutôt que de bloquer.
 */
async function reduire(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const echelle = Math.min(1, LARGEUR_MAX / bitmap.width);
    if (echelle === 1 && file.size < 900_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITE),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

/**
 * Champ image : aperçu, envoi depuis l'ordinateur ou le téléphone, ou collage
 * d'une adresse. La valeur transmise au formulaire est toujours l'URL, dans un
 * input caché.
 *
 * Le fichier va directement du navigateur à Supabase, via une URL signée
 * obtenue du serveur. Il ne transite pas par l'action serveur, dont le corps
 * est plafonné à 1 Mo — c'est ce plafond qui coupait la connexion sur toute
 * photo un peu lourde.
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
    const brut = files?.[0];
    if (!brut) return;
    setErreur(null);

    demarrer(async () => {
      const f = await reduire(brut);

      if (f.size > 50 * 1024 * 1024) {
        setErreur("Fichier trop lourd (50 Mo maximum).");
        return;
      }

      const signe = await urlDeTeleversement(f.name, f.type);

      // Pas de Supabase : on retombe sur l'action serveur, qui écrit en local.
      if (signe.error === "supabase-absent") {
        const data = new FormData();
        data.set("file", f);
        const res = await televerser({}, data);
        if (res.url) setUrl(res.url);
        else setErreur(res.error ?? "Échec.");
        return;
      }

      if (!signe.url || !signe.publicUrl) {
        setErreur(signe.error ?? "Échec.");
        return;
      }

      const envoi = await fetch(signe.url, {
        method: "PUT",
        headers: { "Content-Type": f.type },
        body: f,
      });
      if (!envoi.ok) {
        setErreur(`Envoi refusé (${envoi.status}).`);
        return;
      }
      setUrl(signe.publicUrl);
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
            /* Pas de next/image : l'URL peut pointer n'importe où. */
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
            onChange={(e) => {
              choisir(e.target.files);
              // Permet de renvoyer deux fois le même fichier de suite.
              e.target.value = "";
            }}
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
            {url && !enCours && (
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
