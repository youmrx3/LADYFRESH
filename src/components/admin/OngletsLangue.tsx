import Link from "next/link";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";

/**
 * On édite une langue à la fois. Empiler les trois versions d'un même champ
 * rendait les formulaires illisibles ; ici on choisit la langue, et le
 * formulaire ne montre que celle-là. Les colonnes des autres langues ne sont
 * pas touchées à l'enregistrement.
 */
export function OngletsLangue({
  actif,
  base,
  label,
}: {
  actif: Locale;
  /** Chemin de la page, sans le paramètre de langue. */
  base: string;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow text-graphite-doux">{label}</span>
      <div
        className="flex overflow-hidden rounded border"
        style={{ borderColor: "var(--comptoir-line)" }}
      >
        {LOCALES.map((code) => {
          const on = code === actif;
          return (
            <Link
              key={code}
              href={code === "fr" ? base : `${base}?edit=${code}`}
              aria-current={on ? "true" : undefined}
              className="px-3 py-1.5 text-[12.5px] transition-colors"
              style={{
                background: on ? "var(--comptoir-fg)" : "transparent",
                color: on ? "var(--comptoir-surface)" : "var(--comptoir-muted)",
              }}
            >
              {LOCALE_LABEL[code]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Suffixe des colonnes pour la langue éditée : `description` en français,
 * `description_ar` sinon.
 */
export function champLangue(base: string, edit: Locale) {
  return edit === "fr" ? base : `${base}_${edit}`;
}

/** Le français porte le texte de repli, il est donc toujours obligatoire. */
export function estLangueBase(edit: Locale) {
  return edit === "fr";
}
