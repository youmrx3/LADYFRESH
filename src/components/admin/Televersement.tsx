"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { televerser, type Retour } from "@/lib/actions";

type Labels = {
  champ: string;
  bouton: string;
  envoi: string;
  envoye: string;
  inactif: string;
};

/**
 * Envoie un fichier vers Supabase Storage et rend l'URL publique à coller
 * dans un champ image ou vidéo.
 */
export function Televersement({
  accept = "image/*,video/*",
  actif,
  labels,
}: {
  accept?: string;
  actif: boolean;
  labels: Labels;
}) {
  const [etat, action] = useActionState<Retour & { url?: string }, FormData>(
    televerser,
    {},
  );

  if (!actif) {
    return (
      <p className="rounded border border-dashed border-trait px-4 py-3 text-[13px] leading-relaxed text-graphite-doux">
        {labels.inactif}
      </p>
    );
  }

  return (
    <form action={action} className="rounded border border-trait p-4">
      <label className="block">
        <span className="etiquette">{labels.champ}</span>
        <input
          type="file"
          name="file"
          accept={accept}
          required
          className="champ !py-2 text-[13px] file:me-3 file:rounded file:border-0 file:px-3 file:py-1.5 file:text-[12px]"
          style={
            {
              ["--file-bg" as string]: "var(--comptoir-fg)",
            } as React.CSSProperties
          }
        />
      </label>
      <BoutonTeleverser labels={labels} />
      {etat.error && (
        <p
          role="alert"
          className="mt-2 text-[12.5px]"
          style={{ color: "var(--danger)" }}
        >
          {etat.error}
        </p>
      )}
      {etat.url && (
        <div className="mt-3">
          <p className="text-[12.5px]" style={{ color: "var(--succes)" }}>
            {labels.envoye}
          </p>
          <input
            readOnly
            dir="ltr"
            value={etat.url}
            onFocus={(e) => e.currentTarget.select()}
            className="champ data mt-1.5 !py-2 text-[12px]"
          />
        </div>
      )}
    </form>
  );
}

function BoutonTeleverser({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-encre mt-3 !px-4 !py-2.5 !text-[11px]"
    >
      {pending ? labels.envoi : labels.bouton}
    </button>
  );
}
