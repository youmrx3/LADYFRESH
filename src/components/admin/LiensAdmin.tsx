"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LiensAdmin({
  liens,
}: {
  liens: { href: string; label: string }[];
}) {
  const path = usePathname();

  return (
    <nav className="border-y border-encre-bord lg:border-b-0">
      <ul className="no-scrollbar flex overflow-x-auto lg:block">
        {liens.map((lien) => {
          const on =
            lien.href === "/admin"
              ? path === "/admin"
              : path.startsWith(lien.href);
          return (
            <li key={lien.href}>
              <Link
                href={lien.href}
                aria-current={on ? "page" : undefined}
                className="block whitespace-nowrap border-encre-bord px-5 py-3.5 text-[14px] transition-colors lg:border-b"
                style={{
                  color: on ? "var(--or-fg)" : "var(--vitrine-muted)",
                  background: on ? "var(--or-plein)" : "transparent",
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
