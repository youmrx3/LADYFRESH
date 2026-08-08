"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type LienAdmin = {
  href: string;
  label: string;
  /** Version courte : la barre du bas ne donne que ~60 px par onglet. */
  court: string;
  icone: Icone;
};
type Icone = "commandes" | "types" | "gammes" | "produits" | "formats" | "contenu";

function estActif(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path.startsWith(href);
}

/** Barre latérale, à partir de `lg`. */
export function LiensAdmin({ liens }: { liens: LienAdmin[] }) {
  const path = usePathname();

  return (
    <nav className="hidden lg:block">
      <ul>
        {liens.map((lien) => {
          const on = estActif(path, lien.href);
          return (
            <li key={lien.href}>
              <Link
                href={lien.href}
                aria-current={on ? "page" : undefined}
                className="flex items-center gap-2.5 border-b border-encre-bord px-5 py-3 text-[14px] transition-colors"
                style={{
                  color: on ? "var(--or-fg)" : "var(--vitrine-muted)",
                  background: on ? "var(--or-plein)" : "transparent",
                }}
              >
                <Glyphe nom={lien.icone} />
                {lien.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Sur téléphone, la navigation descend en bas de l'écran : c'est là que le
 * pouce arrive, et ça libère le haut de la page pour le contenu. Les six
 * sections tiennent en une rangée d'icônes légendées.
 */
export function BarreOngletsMobile({ liens }: { liens: LienAdmin[] }) {
  const path = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      style={{
        background: "var(--vitrine-bg)",
        borderColor: "var(--vitrine-line)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="grid grid-cols-6">
        {liens.map((lien) => {
          const on = estActif(path, lien.href);
          return (
            <li key={lien.href}>
              <Link
                href={lien.href}
                aria-current={on ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-0.5 py-2.5 transition-colors"
                style={{
                  color: on ? "var(--or-trait)" : "var(--vitrine-muted)",
                }}
              >
                <Glyphe nom={lien.icone} />
                <span className="w-full truncate text-center text-[9.5px] leading-tight">
                  {lien.court}
                </span>
                <span
                  aria-hidden
                  className="h-[2px] w-5 rounded-full transition-colors"
                  style={{ background: on ? "var(--or-plein)" : "transparent" }}
                />
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
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (nom) {
    case "commandes":
      return (
        <svg {...commun}>
          <path d="M4 6h16M4 12h16M4 18h10" />
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
          <path d="M10 3h4v3h-4zM8 6h8l1 15H7z" />
        </svg>
      );
    case "formats":
      return (
        <svg {...commun}>
          <path d="M3 7h18M3 12h18M3 17h18M8 4v16" />
        </svg>
      );
    case "contenu":
      return (
        <svg {...commun}>
          <path d="M4 5h16v14H4z" />
          <path d="m4 15 5-4 4 3 3-2 4 3" />
        </svg>
      );
  }
}
