"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BasculeLangue, BasculeTheme } from "./Bascules";
import { useBoutique } from "./BoutiqueProvider";
import { useReglages } from "./Reglages";

export function Navbar() {
  const { pieceCount, purchase } = useBoutique();
  const { t } = useReglages();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const liens = [
    { href: "#accueil", label: t.nav.accueil },
    { href: "#commander", label: t.nav.commander },
    { href: "#gammes", label: t.nav.gammes },
    { href: "#boutique", label: t.nav.boutique },
    { href: "#contact", label: t.nav.contact },
  ];

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

  const pose = scrolled || open;

  /* Au-delà de 99, le compteur ferait grossir le bouton jusqu'à écraser le
     logo. Le chiffre exact reste dans le récapitulatif. */
  const compteur = pieceCount > 99 ? "99+" : String(pieceCount);
  const unite = purchase === "gros" ? t.unites.cartonCourt : t.unites.pieceCourt;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        background: pose ? "var(--nav-bg)" : "transparent",
        backdropFilter: pose ? "saturate(140%) blur(14px)" : "none",
        borderBottom: `1px solid ${pose ? "var(--nav-line)" : "transparent"}`,
      }}
    >
      <div className="shell flex h-[72px] items-center gap-3 sm:gap-5">
        <a
          href="#accueil"
          aria-label={t.nav.accueilAria}
          className="shrink-0"
        >
          <Logo />
        </a>

        <nav
          className="hidden items-center gap-7 xl:flex"
          aria-label={t.nav.principale}
        >
          {liens.map((lien) => (
            <a
              key={lien.href}
              href={lien.href}
              className="whitespace-nowrap text-[13px] text-porcelaine/72 transition-colors hover:text-or"
            >
              {lien.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <BasculeLangue compact />
            <BasculeTheme compact />
          </div>

          <a
            href="#commande"
            className="btn btn-or hidden !px-4 !py-2.5 !text-[11.5px] lg:inline-flex"
          >
            {t.nav.cta}
            {pieceCount > 0 && (
              <span
                className="data rounded-full px-1.5 py-0.5 text-[10.5px]"
                style={{ background: "var(--or-fg)", color: "var(--or-plein)" }}
              >
                {compteur} {unite}
              </span>
            )}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t.nav.fermerMenu : t.nav.ouvrirMenu}
            className="relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded border border-porcelaine/25 xl:hidden"
          >
            <span
              className="block h-px w-[18px] bg-porcelaine transition-transform duration-300"
              style={{ transform: open ? "translateY(3px) rotate(45deg)" : "none" }}
            />
            <span
              className="block h-px w-[18px] bg-porcelaine transition-transform duration-300"
              style={{ transform: open ? "translateY(-3px) rotate(-45deg)" : "none" }}
            />
            {pieceCount > 0 && !open && (
              <span
                className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--or-plein)" }}
              />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="fondu border-t border-or/20 bg-encre xl:hidden"
          style={{ background: "var(--vitrine-bg)" }}
          aria-label={t.nav.menuMobile}
        >
          <ul className="shell flex flex-col py-2">
            {liens.map((lien) => (
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
            <li className="flex items-center justify-between gap-3 py-5">
              <BasculeLangue />
              <BasculeTheme />
            </li>
            <li className="pb-6">
              <a
                href="#commande"
                onClick={() => setOpen(false)}
                className="btn btn-or w-full"
              >
                {t.nav.cta}
                {pieceCount > 0 && (
                  <span
                    className="data rounded-full px-1.5 py-0.5 text-[10.5px]"
                    style={{ background: "var(--or-fg)", color: "var(--or-plein)" }}
                  >
                    {compteur} {unite}
                  </span>
                )}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

/**
 * Le logo existe en noir et en blanc. On affiche les deux et on laisse le CSS
 * choisir : pas de state, donc pas de clignotement à l'hydratation.
 */
function Logo() {
  return (
    <>
      <Image
        src="/brand/ladyfresh-wordmark-black.png"
        alt="Lady Fresh"
        width={520}
        height={110}
        priority
        className="h-[18px] w-auto sm:h-[21px] dark-hidden"
      />
      <Image
        src="/brand/ladyfresh-wordmark-white.png"
        alt="Lady Fresh"
        width={520}
        height={110}
        priority
        className="clair-hidden h-[18px] w-auto sm:h-[21px]"
      />
    </>
  );
}
