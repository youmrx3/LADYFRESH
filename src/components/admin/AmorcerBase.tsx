"use client";

import { useActionState } from "react";
import { amorcerBase, type Retour } from "@/lib/actions";

/** Copies the reference catalogue into a freshly-created Supabase database. */
export function AmorcerBase() {
  const [etat, action, pending] = useActionState<Retour>(
    async () => amorcerBase(),
    {},
  );

  return (
    <form action={action} className="text-right">
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (
            !window.confirm(
              "Copier le catalogue de référence (7 gammes, 22 produits, 27 formats) dans Supabase ?",
            )
          )
            e.preventDefault();
        }}
        className="btn btn-fantome !px-4 !py-2.5 !text-[11px]"
      >
        {pending ? "Amorçage…" : "Amorcer la base"}
      </button>
      {etat.error && (
        <p role="alert" className="mt-2 max-w-[28rem] text-[12.5px] text-[#a30d23]">
          {etat.error}
        </p>
      )}
      {etat.ok && (
        <p className="mt-2 max-w-[28rem] text-[12.5px] text-[#0f6b3f]">{etat.ok}</p>
      )}
    </form>
  );
}
