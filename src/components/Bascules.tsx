"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReglages } from "./Reglages";
import { LOCALES, LOCALE_COOKIE, LOCALE_SHORT, LOCALE_LABEL } from "@/i18n/config";

export type Theme = "clair" | "sombre";
export const THEME_STORAGE = "ladyfresh.theme";

/**
 * Bascule clair / sombre. Le thème est écrit sur `html[data-theme]` par le
 * script inline du layout, donc il est déjà appliqué au premier pixel ; ce
 * bouton ne fait que le changer.
 */
export function BasculeTheme({ compact = false }: { compact?: boolean }) {
  const { t } = useReglages();
  const [theme, setTheme] = useState<Theme>("clair");

  useEffect(() => {
    const actuel = document.documentElement.dataset.theme;
    setTheme(actuel === "sombre" ? "sombre" : "clair");
  }, []);

  function basculer() {
    const suivant: Theme = theme === "clair" ? "sombre" : "clair";
    document.documentElement.dataset.theme = suivant;
    try {
      localStorage.setItem(THEME_STORAGE, suivant);
    } catch {
      // Mode privé : le thème ne survivra pas au rechargement, tant pis.
    }
    setTheme(suivant);
  }

  const cible = theme === "clair" ? t.nav.themeSombre : t.nav.themeClair;

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={`${t.nav.theme} : ${cible}`}
      title={`${t.nav.theme} : ${cible}`}
      className={`flex shrink-0 items-center justify-center rounded border transition-colors ${
        compact ? "h-9 w-9" : "h-11 w-11"
      }`}
      style={{
        borderColor: "color-mix(in srgb, currentColor 22%, transparent)",
      }}
    >
      {theme === "clair" ? <IconeLune /> : <IconeSoleil />}
    </button>
  );
}

function IconeLune() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 13.2A9 9 0 0 1 10.8 3a9 9 0 1 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeSoleil() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2.4M12 19.6V22M22 12h-2.4M4.4 12H2m15.1-7.1-1.7 1.7M8.6 15.4l-1.7 1.7m10.2 0-1.7-1.7M8.6 8.6 6.9 6.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Sélecteur de langue. Trois langues : autant les montrer toutes. */
export function BasculeLangue({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useReglages();
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  function choisir(cible: string) {
    if (cible === locale) return;
    setEnCours(true);
    // 1 an, accessible à tout le site.
    document.cookie = `${LOCALE_COOKIE}=${cible}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={t.nav.langue}
      className={`flex shrink-0 items-center overflow-hidden rounded border ${
        enCours ? "opacity-60" : ""
      }`}
      style={{ borderColor: "color-mix(in srgb, currentColor 22%, transparent)" }}
    >
      {LOCALES.map((code) => {
        const on = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => choisir(code)}
            aria-pressed={on}
            aria-label={LOCALE_LABEL[code]}
            title={LOCALE_LABEL[code]}
            className={`px-2 transition-colors ${
              compact ? "h-9 text-[11px]" : "h-11 text-[12px]"
            }`}
            style={{
              fontFamily: code === "ar" ? "inherit" : "var(--font-display)",
              letterSpacing: code === "ar" ? "0" : "0.1em",
              background: on ? "var(--or-plein)" : "transparent",
              color: on ? "var(--or-fg)" : "inherit",
              opacity: on ? 1 : 0.7,
            }}
          >
            {LOCALE_SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
