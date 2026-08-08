"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { televerser, type Retour } from "@/lib/actions";

/**
 * Uploads a file to Supabase Storage and hands back the public URL to paste
 * into an image or video field.
 */
export function Televersement({
  accept = "image/*,video/*",
  actif,
}: {
  accept?: string;
  actif: boolean;
}) {
  const [etat, action] = useActionState<Retour & { url?: string }, FormData>(
    televerser,
    {},
  );

  if (!actif) {
    return (
      <p className="rounded border border-dashed border-trait px-4 py-3 text-[13px] leading-relaxed text-graphite-doux">
        Le téléversement demande Supabase. En attendant, déposez vos fichiers
        dans <code className="data">public/videos</code> ou{" "}
        <code className="data">public/gammes</code> et indiquez le chemin, par
        exemple <code className="data">/videos/ma-video.mp4</code>.
      </p>
    );
  }

  return (
    <form action={action} className="rounded border border-trait p-4">
      <label className="block">
        <span className="etiquette">Téléverser un fichier</span>
        <input
          type="file"
          name="file"
          accept={accept}
          required
          className="champ !py-2 text-[13px] file:mr-3 file:rounded file:border-0 file:bg-graphite file:px-3 file:py-1.5 file:text-[12px] file:text-white"
        />
      </label>
      <BoutonTeleverser />
      {etat.error && (
        <p role="alert" className="mt-2 text-[12.5px] text-[#a30d23]">
          {etat.error}
        </p>
      )}
      {etat.url && (
        <div className="mt-3">
          <p className="text-[12.5px] text-[#0f6b3f]">
            Envoyé. Copiez cette adresse dans le champ voulu :
          </p>
          <input
            readOnly
            value={etat.url}
            onFocus={(e) => e.currentTarget.select()}
            className="champ data mt-1.5 !py-2 text-[12px]"
          />
        </div>
      )}
    </form>
  );
}

function BoutonTeleverser() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-encre mt-3 !px-4 !py-2.5 !text-[11px]"
    >
      {pending ? "Envoi…" : "Téléverser"}
    </button>
  );
}
