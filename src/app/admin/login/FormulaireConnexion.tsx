"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { seConnecter } from "@/lib/actions";

type Labels = {
  email: string;
  motDePasse: string;
  entrer: string;
  verification: string;
};

export function FormulaireConnexion({ labels }: { labels: Labels }) {
  const [etat, action] = useActionState(seConnecter, {});

  return (
    <form action={action} className="mt-8">
      <label className="block">
        <span className="etiquette" style={{ color: "var(--vitrine-muted)" }}>
          {labels.email}
        </span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          dir="ltr"
          autoComplete="username"
          className="champ"
        />
      </label>

      <label className="mt-3 block">
        <span className="etiquette" style={{ color: "var(--vitrine-muted)" }}>
          {labels.motDePasse}
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="champ"
        />
      </label>

      <Bouton labels={labels} />

      {etat.error && (
        <p
          role="alert"
          className="mt-3 text-[13px]"
          style={{ color: "var(--danger)" }}
        >
          {etat.error}
        </p>
      )}
    </form>
  );
}

function Bouton({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-or mt-4 w-full">
      {pending ? labels.verification : labels.entrer}
    </button>
  );
}
