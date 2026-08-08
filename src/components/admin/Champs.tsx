"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Retour } from "@/lib/actions";

export function Envoyer({
  children = "Enregistrer",
  variante = "encre",
  confirmer,
}: {
  children?: React.ReactNode;
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
          ? "btn-fantome !border-[#c4102b]/40 !text-[#a30d23]"
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

/** Wraps a server action and renders its ok/error message underneath. */
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
        <p role="alert" className="mt-2 text-[12.5px] text-[#a30d23]">
          {etat.error}
        </p>
      )}
      {etat.ok && (
        <p className="mt-2 text-[12.5px] text-[#0f6b3f]">{etat.ok}</p>
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
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: number;
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
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="champ"
      />
    </label>
  );
}

export function Zone({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="etiquette">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="champ resize-y"
      />
    </label>
  );
}

export function Liste({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <label className="block">
      <span className="etiquette">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="champ">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
    <label className="flex items-center gap-2 pt-5 text-[13px]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#0b0b0c]"
      />
      {label}
    </label>
  );
}
