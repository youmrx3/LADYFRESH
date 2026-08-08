"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Retour } from "@/lib/actions";

export function Envoyer({
  children,
  variante = "encre",
  confirmer,
}: {
  children: React.ReactNode;
  variante?: "encre" | "or" | "fantome" | "danger";
  confirmer?: string;
}) {
  const { pending } = useFormStatus();
  const classe =
    variante === "or"
      ? "btn-or"
      : variante === "fantome"
        ? "btn-fantome"
        : variante === "danger"
          ? "btn-fantome btn-danger"
          : "btn-encre";

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmer && !window.confirm(confirmer)) e.preventDefault();
      }}
      className={`btn ${classe} !px-4 !py-2.5 !text-[11px]`}
    >
      {pending ? "…" : children}
    </button>
  );
}

/** Enveloppe une action serveur et affiche son message sous le formulaire. */
export function FormAction({
  action,
  children,
  className = "",
  id,
}: {
  action: (prev: Retour, formData: FormData) => Promise<Retour>;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [etat, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className} id={id}>
      {children}
      {etat.error && (
        <p
          role="alert"
          className="mt-2 text-[12.5px]"
          style={{ color: "var(--danger)" }}
        >
          {etat.error}
        </p>
      )}
      {etat.ok && (
        <p className="mt-2 text-[12.5px]" style={{ color: "var(--succes)" }}>
          {etat.ok}
        </p>
      )}
    </form>
  );
}

export function Champ({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  step,
  min,
  dir,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null | undefined;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: number;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="etiquette">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        dir={dir}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="champ"
      />
    </label>
  );
}

/**
 * Teinte : la pastille montre en direct la couleur choisie, et le code hexa
 * reste modifiable au clavier — on colle souvent une valeur venue d'ailleurs.
 */
export function ChampCouleur({
  label,
  name,
  defaultValue = "#c4102b",
  apercu,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  apercu: string;
}) {
  const [valeur, setValeur] = useState(defaultValue || "#c4102b");
  const valide = /^#[0-9a-f]{6}$/i.test(valeur);

  return (
    <div className="block">
      <span className="etiquette">{label}</span>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          title={apercu}
          className="h-[42px] w-[42px] shrink-0 rounded border border-trait"
          style={{ background: valide ? valeur : "transparent" }}
        />
        <input
          type="color"
          value={valide ? valeur : "#c4102b"}
          onChange={(e) => setValeur(e.target.value)}
          aria-label={label}
          className="h-[42px] w-[52px] shrink-0 cursor-pointer rounded border border-trait bg-transparent p-1"
        />
        <input
          name={name}
          type="text"
          dir="ltr"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          aria-label={apercu}
          className="champ data !py-2 !text-[12.5px]"
          style={{ borderColor: valide ? undefined : "var(--danger)" }}
        />
      </div>
    </div>
  );
}

export function Zone({
  label,
  name,
  defaultValue,
  rows = 3,
  dir,
}: {
  label: string;
  name: string;
  defaultValue?: string | null | undefined;
  rows?: number;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="etiquette">{label}</span>
      <textarea
        name={name}
        rows={rows}
        dir={dir}
        defaultValue={defaultValue ?? ""}
        className="champ resize-y"
      />
    </label>
  );
}

/**
 * Menu déroulant natif, mais habillé : sur téléphone le sélecteur système
 * reste de loin le plus pratique, on ne le remplace pas par une liste maison.
 */
export function Liste({
  label,
  name,
  options,
  defaultValue,
  placeholder,
  required,
  className = "",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null | undefined;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="etiquette">{label}</span>
      <div className="liste">
        <select
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          className="champ"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          className="liste-fleche"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}

export function Bascule({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 py-2 text-[13px]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4"
        style={{ accentColor: "var(--comptoir-fg)" }}
      />
      {label}
    </label>
  );
}
