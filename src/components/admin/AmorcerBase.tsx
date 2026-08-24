"use client";

import { useActionState } from "react";
import { amorcerBase, type Retour } from "@/lib/actions";

/** Recopie le catalogue de référence dans une base Supabase toute neuve. */
export function AmorcerBase({
  label,
  enCours,
  confirmer,
}: {
  label: string;
  enCours: string;
  confirmer: string;
}) {
  const [etat, action, pending] = useActionState<Retour>(
    async () => amorcerBase(),
    {},
  );

  return (
    <form action={action} className="text-end">
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm(confirmer)) e.preventDefault();
        }}
        className="btn btn-fantome !px-4 !py-2.5 !text-[length:var(--adm-t-xs)]"
      >
        {pending ? enCours : label}
      </button>
      {etat.error && (
        <p
          role="alert"
          className="mt-2 max-w-[28rem] text-[length:var(--adm-t-sm)]"
          style={{ color: "var(--adm-danger)" }}
        >
          {etat.error}
        </p>
      )}
      {etat.ok && (
        <p
          className="mt-2 max-w-[28rem] text-[length:var(--adm-t-sm)]"
          style={{ color: "var(--adm-ok)" }}
        >
          {etat.ok}
        </p>
      )}
    </form>
  );
}
