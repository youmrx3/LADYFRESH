"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/admin", label: "Commandes" },
  { href: "/admin/gammes", label: "Gammes" },
  { href: "/admin/produits", label: "Produits & prix" },
  { href: "/admin/contenu", label: "Contenu du site" },
];

export function LiensAdmin() {
  const path = usePathname();

  return (
    <nav className="border-y border-encre-bord lg:border-b-0">
      <ul className="flex overflow-x-auto lg:block">
        {LIENS.map((lien) => {
          const on =
            lien.href === "/admin" ? path === "/admin" : path.startsWith(lien.href);
          return (
            <li key={lien.href}>
              <Link
                href={lien.href}
                className="block whitespace-nowrap border-encre-bord px-5 py-3.5 text-[14px] transition-colors lg:border-b"
                style={{
                  color: on ? "#0b0b0c" : "#8b8f8e",
                  background: on ? "#cba53c" : "transparent",
                }}
              >
                {lien.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
