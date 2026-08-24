"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useAvis } from "./Retours";
import { useFormStatus } from "react-dom";
import type { Retour } from "@/lib/actions";

/**
 * Les primitives de saisie du back-office.
 *
 * Toutes bâties sur la couche `.adm-*` : une seule échelle de texte, une seule
 * hauteur de contrôle, un seul anneau de focus. Avant, chaque écran rechoisissait
 * ses pixels — dix tailles de police pour huit pages, et des boutons à 36 px
 * qu'on rate au pouce.
 *
 * Chaque champ porte un identifiant propre et une étiquette qui lui est liée :
 * la moitié d'entre eux n'en avaient pas, ce qui rendait le formulaire muet aux
 * lecteurs d'écran et empêchait de cliquer le libellé pour poser le curseur.
 */

type Variante = "principal" | "neutre" | "discret" | "danger";

export function Envoyer({
  children,
  variante = "neutre",
  confirmer,
  pleineLargeur,
}: {
  children: React.ReactNode;
  variante?: Variante;
  confirmer?: string;
  pleineLargeur?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmer && !window.confirm(confirmer)) e.preventDefault();
      }}
      className={`adm-btn adm-btn-${variante}${pleineLargeur ? " w-full" : ""}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

/**
 * Enveloppe une action serveur.
 *
 * Une réussite s'annonce en bannière et referme la ligne : la modification
 * faite, on revient à la liste plutôt que de rester devant un formulaire ouvert
 * sans savoir si le clic a porté.
 *
 * Un échec reste sur place, sous le formulaire, là où l'on peut corriger — une
 * erreur qui s'efface d'elle-même est une erreur qu'on ne lira pas.
 */
export function FormAction({
  action,
  children,
  className = "",
  id,
  garderOuvert = false,
}: {
  action: (prev: Retour, formData: FormData) => Promise<Retour>;
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Pour les écrans d'un seul formulaire, qui n'ont rien à refermer. */
  garderOuvert?: boolean;
}) {
  const [etat, formAction] = useActionState(action, {});
  const annoncer = useAvis();
  const forme = useRef<HTMLFormElement>(null);
  const vu = useRef<string | undefined>(undefined);

  useEffect(() => {
    // `useActionState` conserve son état : sans ce garde, la bannière
    // reviendrait à chaque nouveau rendu du parent.
    if (!etat.ok || etat.ok === vu.current) return;
    vu.current = etat.ok;
    annoncer(etat.ok);
    if (!garderOuvert) forme.current?.closest("details")?.removeAttribute("open");
  }, [etat.ok, annoncer, garderOuvert]);

  return (
    <form ref={forme} action={formAction} className={className} id={id}>
      {children}
      {etat.error && (
        <p role="alert" className="adm-message adm-message-erreur mt-3">
          {etat.error}
        </p>
      )}
    </form>
  );
}

/** Étiquette + champ, liés par un identifiant, avec une aide facultative. */
function Enveloppe({
  label,
  htmlFor,
  aide,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  aide?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="adm-etiquette" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {aide && <p className="adm-aide mt-1.5">{aide}</p>}
    </div>
  );
}

export function Champ({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  min,
  dir,
  aide,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  dir?: "ltr" | "rtl";
  aide?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <Enveloppe label={label} htmlFor={id} aide={aide} className={className}>
      <input
        id={id}
        name={name}
        type={type}
        dir={dir}
        min={min}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="adm-champ"
      />
    </Enveloppe>
  );
}

export function Zone({
  label,
  name,
  defaultValue,
  rows = 3,
  dir,
  aide,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  dir?: "ltr" | "rtl";
  aide?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <Enveloppe label={label} htmlFor={id} aide={aide} className={className}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        dir={dir}
        defaultValue={defaultValue ?? ""}
        className="adm-champ"
      />
    </Enveloppe>
  );
}

export function Liste({
  label,
  name,
  options,
  defaultValue,
  placeholder,
  required,
  aide,
  className,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  aide?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <Enveloppe label={label} htmlFor={id} aide={aide} className={className}>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="adm-champ"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Enveloppe>
  );
}

/**
 * Interrupteur.
 *
 * Une vraie case à cocher, masquée mais présente : elle garde la sémantique du
 * formulaire, le clavier et les lecteurs d'écran. Le rail n'est que sa
 * représentation.
 */
export function Bascule({
  label,
  name,
  defaultChecked,
  aide,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  aide?: string;
}) {
  const id = useId();
  const [actif, setActif] = useState(defaultChecked ?? false);

  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3"
        style={{ minHeight: "var(--adm-h)" }}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:[box-shadow:var(--adm-anneau)]"
          style={{ background: actif ? "var(--adm-accent)" : "var(--adm-line)" }}
        >
          <span
            className="absolute top-1/2 h-4.5 w-4.5 -translate-y-1/2 rounded-full bg-white transition-all"
            style={{
              height: "1.125rem",
              width: "1.125rem",
              insetInlineStart: actif ? "calc(100% - 1.375rem)" : "0.25rem",
            }}
          />
        </span>
        <span style={{ fontSize: "var(--adm-t-md)" }}>{label}</span>
      </label>
      {aide && <p className="adm-aide">{aide}</p>}
    </div>
  );
}

/**
 * Couleur, avec aperçu.
 *
 * Le sélecteur natif et le code hexadécimal partagent la même valeur : on
 * choisit à l'œil ou on colle un code, selon qu'on a la teinte sous les yeux ou
 * dans un cahier des charges.
 */
export function ChampCouleur({
  label,
  name,
  defaultValue,
  apercu,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  apercu?: string;
}) {
  const id = useId();
  const [valeur, setValeur] = useState(defaultValue || "#c9a227");

  return (
    <Enveloppe label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={apercu ?? label}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="shrink-0 cursor-pointer rounded border p-0"
          style={{
            height: "var(--adm-h)",
            width: "var(--adm-h)",
            borderColor: "var(--adm-line)",
            background: "var(--adm-surface)",
          }}
        />
        <input
          id={id}
          name={name}
          dir="ltr"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="adm-champ"
          style={{ fontFamily: "var(--font-plex-mono), monospace" }}
        />
      </div>
    </Enveloppe>
  );
}
