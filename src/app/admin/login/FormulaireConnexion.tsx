"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { seConnecter } from "@/lib/actions";

export function FormulaireConnexion() {
  const [etat, action] = useActionState(seConnecter, {});

  return (
    <form action={action} className="mt-8">
      <label className="block">
        <span className="etiquette !text-craie">Mot de passe</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="champ !border-encre-bord !bg-encre-haut !text-porcelaine"
        />
      </label>

      <Bouton />

      {etat.error && (
        <p role="alert" className="mt-3 text-[13px] text-[#e06a7d]">
          {etat.error}
        </p>
      )}
    </form>
  );
}

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-or mt-4 w-full">
      {pending ? "Vérification…" : "Entrer"}
    </button>
  );
}
