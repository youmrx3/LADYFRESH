"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useBoutique } from "./BoutiqueProvider";

const LIENS = [
  { href: "#accueil", label: "Accueil" },
  { href: "#commander", label: "Comment commander" },
  { href: "#gammes", label: "Nos gammes" },
  { href: "#boutique", label: "Boutique" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const { pieceCount, purchase } = useBoutique();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        background: scrolled || open ? "rgba(11,11,12,0.92)" : "transparent",
        backdropFilter: scrolled || open ? "saturate(140%) blur(14px)" : "none",
        borderBottom: `1px solid ${
          scrolled || open ? "rgba(203,165,60,0.22)" : "transparent"
        }`,
      }}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-6">
        <a href="#accueil" aria-label="Lady Fresh — accueil" className="shrink-0">
          <Image
            src="/brand/ladyfresh-wordmark-white.png"
            alt="Lady Fresh"
            width={520}
            height={110}
            priority
            className="h-[19px] w-auto sm:h-[22px]"
          />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Principale">
          {LIENS.map((lien) => (
            <a
              key={lien.href}
              href={lien.href}
              className="text-[13px] text-porcelaine/72 transition-colors hover:text-or"
            >
              {lien.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#commande" className="btn btn-or hidden !px-5 !py-3 sm:inline-flex">
            Commander
            {pieceCount > 0 && (
              <span className="data ml-1 rounded-full bg-encre/85 px-2 py-0.5 text-[11px] text-or">
                {pieceCount}
                {purchase === "gros" ? " ct" : " pc"}
              </span>
            )}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded border border-porcelaine/20 lg:hidden"
          >
            <span
              className="block h-px w-5 bg-porcelaine transition-transform duration-300"
              style={{ transform: open ? "translateY(3px) rotate(45deg)" : "none" }}
            />
            <span
              className="block h-px w-5 bg-porcelaine transition-transform duration-300"
              style={{ transform: open ? "translateY(-3px) rotate(-45deg)" : "none" }}
            />
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="fondu border-t border-or/20 bg-encre lg:hidden"
          aria-label="Menu mobile"
        >
          <ul className="shell flex flex-col py-2">
            {LIENS.map((lien) => (
              <li key={lien.href}>
                <a
                  href={lien.href}
                  onClick={() => setOpen(false)}
                  className="display display-m block border-b border-encre-bord py-4 text-porcelaine"
                >
                  {lien.label}
                </a>
              </li>
            ))}
            <li className="py-5">
              <a
                href="#commande"
                onClick={() => setOpen(false)}
                className="btn btn-or w-full"
              >
                Commander
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
