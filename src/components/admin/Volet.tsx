/**
 * Les blocs de mise en page du back-office.
 *
 * Bâtis sur `<details>` : pas d'état, pas de JavaScript, et le clavier
 * fonctionne tout seul. Les zones cliquables descendaient à 36 pixels et les
 * tailles de texte étaient choisies au cas par cas ; tout passe désormais par
 * la couche `.adm-*`, avec 44 pixels comme plancher.
 */

/**
 * Panneau dépliant.
 *
 * Deux emplois : le formulaire de création, en haut de page, et l'édition d'une
 * ligne, repliée tant qu'on ne la demande pas.
 */
export function Volet({
  label,
  labelOuvert,
  children,
  ton = "discret",
  ouvert = false,
  id,
}: {
  label: string;
  labelOuvert?: string;
  children: React.ReactNode;
  ton?: "principal" | "discret";
  ouvert?: boolean;
  id?: string;
}) {
  const principal = ton === "principal";

  return (
    <details id={id} open={ouvert} className="group">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-2 ${
          principal ? "adm-btn adm-btn-principal" : "adm-btn adm-btn-discret"
        }`}
      >
        <span
          aria-hidden
          className="inline-block text-[1.1em] leading-none transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">{labelOuvert ?? label}</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/** En-tête de page : le titre, et l'action principale juste à côté. */
export function EnTetePage({
  eyebrow,
  titre,
  aide,
  action,
}: {
  eyebrow: string;
  titre: string;
  aide?: string;
  action?: React.ReactNode;
}) {
  return (
    <header
      className="mb-6 border-b pb-5"
      style={{ borderColor: "var(--adm-line)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="adm-etiquette mb-1">{eyebrow}</p>
          <h1
            className="display leading-tight"
            style={{ fontSize: "var(--adm-t-xl)" }}
          >
            {titre}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {aide && <p className="adm-aide mt-3 max-w-[70ch]">{aide}</p>}
    </header>
  );
}

/**
 * Ligne de liste : un résumé toujours visible, l'édition sur demande.
 *
 * Le résumé est la zone cliquable, et elle fait toute la largeur : sur un
 * téléphone, viser un petit « modifier » au bout de la ligne est un exercice.
 */
export function Ligne({
  visuel,
  titre,
  meta,
  actions,
  children,
  labelModifier,
  labelFermer,
}: {
  visuel?: React.ReactNode;
  titre: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  labelModifier: string;
  labelFermer: string;
}) {
  return (
    <li className="adm-carte overflow-hidden">
      <details className="group">
        <summary
          className="flex cursor-pointer list-none items-center gap-3 p-3 transition-colors sm:p-4"
          style={{ minHeight: "var(--adm-h-lg)" }}
        >
          {visuel}
          <div className="min-w-0 flex-1">
            <p
              className="truncate leading-snug"
              style={{ fontSize: "var(--adm-t-md)", fontWeight: 500 }}
            >
              {titre}
            </p>
            {meta && (
              <p
                className="mt-0.5 truncate"
                style={{
                  fontSize: "var(--adm-t-sm)",
                  color: "var(--adm-muted)",
                }}
              >
                {meta}
              </p>
            )}
          </div>
          <span
            aria-hidden
            className="shrink-0 transition-transform duration-200 group-open:rotate-180"
            style={{ color: "var(--adm-muted)" }}
          >
            ▾
          </span>
          <span className="sr-only">
            <span className="group-open:hidden">{labelModifier}</span>
            <span className="hidden group-open:inline">{labelFermer}</span>
          </span>
        </summary>

        <div className="border-t p-4" style={{ borderColor: "var(--adm-line)" }}>
          {children}
        </div>

        {actions && (
          <div
            className="flex flex-wrap items-center gap-2 border-t px-4 py-3"
            style={{
              borderColor: "var(--adm-line)",
              background: "var(--adm-surface-2)",
            }}
          >
            {actions}
          </div>
        )}
      </details>
    </li>
  );
}

/**
 * Pied de formulaire.
 *
 * Le bouton d'enregistrement flottait au bas de champs empilés, sans rien qui
 * le sépare d'eux : on ne voyait pas où le formulaire finissait. Un trait et un
 * fond léger suffisent à le poser, et la barre reste collante sur téléphone —
 * un formulaire de coffret fait deux écrans de haut, et remonter chercher le
 * bouton après l'avoir rempli n'a aucun intérêt.
 */
export function PiedFormulaire({
  children,
  aide,
}: {
  children: React.ReactNode;
  aide?: string;
}) {
  return (
    <div
      className="sticky bottom-0 -mx-4 -mb-4 mt-4 flex flex-wrap items-center gap-3 border-t px-4 py-3 backdrop-blur"
      style={{
        borderColor: "var(--adm-line)",
        background: "color-mix(in srgb, var(--adm-surface) 92%, transparent)",
      }}
    >
      {children}
      {aide && <span className="adm-aide">{aide}</span>}
    </div>
  );
}

/**
 * Section de page, en carte.
 *
 * Les écrans longs empilaient des `<h2>` suivis d'un cadre : rien ne disait où
 * une section finissait et où la suivante commençait, et les réglages du site
 * se lisaient comme une seule liste de quinze champs. Une carte par sujet, avec
 * son en-tête et son aide, rend la page parcourable au lieu d'être lue en
 * entier.
 */
export function CarteSection({
  eyebrow,
  titre,
  aide,
  action,
  children,
}: {
  eyebrow?: string;
  titre: string;
  aide?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="adm-carte overflow-hidden">
      <header
        className="flex flex-wrap items-start justify-between gap-3 border-b p-4"
        style={{
          borderColor: "var(--adm-line)",
          background: "var(--adm-surface-2)",
        }}
      >
        <div className="min-w-0">
          {eyebrow && <p className="adm-etiquette mb-1">{eyebrow}</p>}
          <h2
            className="leading-tight"
            style={{ fontSize: "var(--adm-t-lg)", fontWeight: 600 }}
          >
            {titre}
          </h2>
          {aide && <p className="adm-aide mt-1.5 max-w-[62ch]">{aide}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/**
 * Groupe de champs apparentés, sous un intitulé.
 *
 * Dix champs dans une même grille ne forment pas un formulaire, ils forment un
 * mur. Les regrouper par sujet — la boutique, le contact, les réseaux — donne
 * des repères pour retrouver celui qu'on cherche.
 */
export function Groupe({
  titre,
  children,
  colonnes = 2,
}: {
  titre?: string;
  children: React.ReactNode;
  colonnes?: 1 | 2 | 3;
}) {
  const grille =
    colonnes === 1
      ? ""
      : colonnes === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <div className="[&+&]:mt-5">
      {titre && (
        <p
          className="adm-etiquette mb-2 border-b pb-1.5"
          style={{ borderColor: "var(--adm-line)" }}
        >
          {titre}
        </p>
      )}
      <div className={`grid gap-3 ${grille}`}>{children}</div>
    </div>
  );
}
