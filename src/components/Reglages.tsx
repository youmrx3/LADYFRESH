"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Dictionary } from "@/i18n";
import { DEFAULT_LOCALE, DIRECTION, type Locale } from "@/i18n/config";

type Reglages = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
};

const Ctx = createContext<Reglages>({
  locale: DEFAULT_LOCALE,
  dir: "ltr",
  t: getDictionary(DEFAULT_LOCALE),
});

/**
 * Porte la langue jusqu'aux composants client. Le thème, lui, vit sur
 * l'attribut `data-theme` de `html` : du CSS pur, donc pas de re-rendu.
 */
export function ReglagesProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider
      value={{ locale, dir: DIRECTION[locale], t: getDictionary(locale) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useReglages() {
  return useContext(Ctx);
}

/** Raccourci : `const t = useT()`. */
export function useT() {
  return useContext(Ctx).t;
}
