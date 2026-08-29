"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * La navigation du back-office.
 *
 * Elle a grossi sans qu'on la redessine : partie de six sections, elle en
 * compte neuf, et la barre du bas était restée sur six colonnes. Les trois
 * dernières retombaient à la ligne, chaque cible faisait quarante pixels de
 * large, et les légendes tenaient en 9,5 px. Autant dire qu'on visait au juger.
 *
 * Deux réponses, une par écran.
 *
 * Sur ordinateur, la colonne se regroupe : vendre, tenir le catalogue, écrire
 * le site. Neuf entrées d'affilée ne se lisent pas ; trois familles de trois se
 * parcourent d'un coup d'œil.
 *
 * Sur téléphone, une bande d'onglets qui défile sous le titre. Rien n'est caché
 * derrière un menu, chaque pastille atteint la hauteur minimale au pouce, et la
 * place gagnée en bas revient au contenu. La section active se ramène dans le
 * champ de vision au montage — sans quoi, arrivé sur la neuvième, on ne saurait
 * pas où l'on se trouve.
 */

export type Groupe = "vente" | "catalogue" | "site";

export type LienAdmin = {
  href: string;
  label: string;
  /** Version courte, pour la bande d'onglets. */
  court: string;
  icone: Icone;
  groupe: Groupe;
};

type Icone =
  | "commandes"
  | "pistes"
  | "stats"
  | "livraison"
  | "packs"
  | "campagne"
  | "types"
  | "gammes"
  | "produits"
  | "formats"
  | "contenu";

function estActif(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path.startsWith(href);
}

const GROUPES: Groupe[] = ["vente", "catalogue", "site"];

/** Colonne de gauche, à partir de `lg`. */
export function LiensAdmin({
  liens,
  titres,
}: {
  liens: LienAdmin[];
  titres: Record<Groupe, string>;
}) {
  const path = usePathname();

  return (
    <nav className="hidden lg:block">
      {GROUPES.map((groupe) => {
        const dedans = liens.filter((l) => l.groupe === groupe);
        if (!dedans.length) return null;

        return (
          <div key={groupe} className="mb-5">
            <p className="adm-etiquette px-5">{titres[groupe]}</p>
            <ul>
              {dedans.map((lien) => {
                const on = estActif(path, lien.href);
                return (
                  <li key={lien.href}>
                    <Link
                      href={lien.href}
                      aria-current={on ? "page" : undefined}
                      className="flex items-center gap-3 px-5 transition-colors"
                      style={{
                        minHeight: "var(--adm-h)",
                        fontSize: "var(--adm-t-md)",
                        color: on ? "var(--or-plein)" : "var(--vitrine-muted)",
                        borderInlineStart: `2px solid ${
                          on ? "var(--or-plein)" : "transparent"
                        }`,
                        background: on
                          ? "color-mix(in srgb, var(--or-plein) 10%, transparent)"
                          : "transparent",
                      }}
                    >
                      <Glyphe nom={lien.icone} />
                      {lien.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Bande d'onglets défilante, sur téléphone et tablette. */
export function BarreOngletsMobile({ liens }: { liens: LienAdmin[] }) {
  const path = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-7 sm:px-7 lg:hidden"
    >
      <ul className="flex w-max gap-1.5 pb-1">
        {liens.map((lien) => {
          const on = estActif(path, lien.href);
          return (
            <li key={lien.href}>
              <Link
                href={lien.href}
                aria-current={on ? "page" : undefined}
                ref={
                  on
                    ? (el) =>
                        el?.scrollIntoView({
                          block: "nearest",
                          inline: "center",
                        })
                    : undefined
                }
                className="flex items-center gap-2 rounded-full border px-3.5 transition-colors"
                style={{
                  minHeight: "var(--adm-h)",
                  fontSize: "var(--adm-t-sm)",
                  fontWeight: on ? 500 : 400,
                  color: on ? "var(--or-fg)" : "var(--vitrine-muted)",
                  background: on ? "var(--or-plein)" : "transparent",
                  borderColor: on ? "var(--or-plein)" : "var(--vitrine-line)",
                }}
              >
                <Glyphe nom={lien.icone} />
                {lien.court}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Glyphe({ nom }: { nom: Icone }) {
  const commun = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "shrink-0",
  };

  switch (nom) {
    case "commandes":
      return (
        <svg {...commun}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case "pistes":
      // Un combiné : ces lignes-là se rappellent au téléphone.
      return (
        <svg {...commun}>
          <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" />
        </svg>
      );
    case "stats":
      // Trois barres : ce que la période a donné.
      return (
        <svg {...commun}>
          <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
        </svg>
      );
    case "livraison":
      // Un fourgon : ce qui part chez la cliente.
      return (
        <svg {...commun}>
          <path d="M3 7h10v9H3zM13 11h4l3 3v2h-7zM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
        </svg>
      );
    case "packs":
      // Un coffret : une boîte refermée.
      return (
        <svg {...commun}>
          <path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 8l2-4h14l2 4M12 4v16" />
        </svg>
      );
    case "campagne":
      // Un porte-voix : ce que la publicité fait entendre.
      return (
        <svg {...commun}>
          <path d="M4 10v4a1 1 0 0 0 1 1h3l5 4V5L8 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6" />
        </svg>
      );
    case "types":
      return (
        <svg {...commun}>
          <path d="M4 7h6v6H4zM14 7h6v6h-6zM9 17h6" />
        </svg>
      );
    case "gammes":
      return (
        <svg {...commun}>
          <path d="M4 5h4v14H4zM10 5h4v14h-4zM16 5h4v14h-4z" />
        </svg>
      );
    case "produits":
      return (
        <svg {...commun}>
          <path d="M9 3h6l1 4H8zM8 7h8l1 14H7zM10 12h4" />
        </svg>
      );
    case "formats":
      return (
        <svg {...commun}>
          <path d="M4 8h16M4 16h16M8 4v16M16 4v16" />
        </svg>
      );
    case "contenu":
      return (
        <svg {...commun}>
          <path d="M4 5h16v14H4zM4 10h16M9 10v9" />
        </svg>
      );
  }
}
