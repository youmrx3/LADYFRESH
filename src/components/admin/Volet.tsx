/**
 * Panneau dépliant bâti sur `<details>` : pas de state, pas de JS, et le
 * clavier fonctionne tout seul. Sert à deux choses dans l'admin — le
 * formulaire de création, posé en haut de page, et l'édition d'une ligne,
 * qui reste repliée tant qu'on ne la demande pas.
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
        className={`inline-flex cursor-pointer list-none items-center gap-2 rounded transition-colors ${
          principal
            ? "btn btn-or !px-4 !py-2.5 !text-[11.5px]"
            : "eyebrow px-2 py-1.5 text-graphite-doux hover:text-graphite"
        }`}
      >
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">
          {labelOuvert ?? label}
        </span>
      </summary>
      <div className="mt-4">{children}</div>
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
    <header className="mb-6 border-b border-trait pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-graphite-doux">{eyebrow}</p>
          <h1 className="display display-l mt-1.5">{titre}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {aide && (
        <p className="mt-3 max-w-[70ch] text-[13.5px] leading-relaxed text-graphite-doux">
          {aide}
        </p>
      )}
    </header>
  );
}

/** Ligne de liste : un résumé toujours visible, l'édition sur demande. */
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
    <li
      className="overflow-hidden rounded-[10px] border border-trait"
      style={{ background: "var(--comptoir-surface)" }}
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-3 transition-colors hover:bg-[color-mix(in_srgb,var(--comptoir-fg)_4%,transparent)] sm:gap-4 sm:p-4">
          {visuel}
          <div className="min-w-0 flex-1">
            <p className="display truncate text-[1rem] leading-tight">{titre}</p>
            {meta && (
              <p className="data mt-0.5 truncate text-[11.5px] text-graphite-doux">
                {meta}
              </p>
            )}
          </div>
          <span className="eyebrow shrink-0 whitespace-nowrap text-[10px] text-graphite-doux">
            <span className="group-open:hidden">{labelModifier}</span>
            <span className="hidden group-open:inline">{labelFermer}</span>
          </span>
        </summary>

        <div className="border-t border-trait p-4">{children}</div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 border-t border-trait bg-comptoir px-4 py-3">
            {actions}
          </div>
        )}
      </details>
    </li>
  );
}
