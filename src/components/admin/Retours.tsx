"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Les retours d'action du back-office.
 *
 * Une action réussie ne disait rien, ou glissait un message sous un formulaire
 * resté ouvert : on ne savait pas si le clic avait porté, et la ligne modifiée
 * restait dépliée au milieu de la liste. Deux gestes manquaient — le dire, et
 * refermer.
 *
 * L'annonce passe par une bannière en bas d'écran, hors du flux : elle ne
 * déplace rien et se lit d'où qu'on soit dans une longue page. `aria-live`
 * la fait aussi entendre.
 *
 * Un échec, lui, ne part pas en bannière : il reste sous le formulaire, à
 * l'endroit où l'on peut corriger. Une erreur qui s'efface toute seule au bout
 * de quatre secondes est une erreur qu'on ne lira pas.
 */

type Avis = { id: number; texte: string };

const Ctx = createContext<(texte: string) => void>(() => {});

export function useAvis() {
  return useContext(Ctx);
}

export function Avis({ children }: { children: React.ReactNode }) {
  const [liste, setListe] = useState<Avis[]>([]);

  const annoncer = useCallback((texte: string) => {
    const id = Date.now() + Math.random();
    setListe((l) => [...l, { id, texte }]);
  }, []);

  const retirer = useCallback((id: number) => {
    setListe((l) => l.filter((a) => a.id !== id));
  }, []);

  return (
    <Ctx.Provider value={annoncer}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-5"
      >
        {liste.map((a) => (
          <Banniere key={a.id} texte={a.texte} fermer={() => retirer(a.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function Banniere({ texte, fermer }: { texte: string; fermer: () => void }) {
  useEffect(() => {
    // Assez pour lire une phrase, pas assez pour encombrer l'écran.
    const t = setTimeout(fermer, 4000);
    return () => clearTimeout(t);
  }, [fermer]);

  return (
    <div
      role="status"
      className="adm-avis pointer-events-auto flex w-full max-w-[26rem] items-start gap-2.5"
    >
      <span aria-hidden style={{ color: "var(--adm-ok)", lineHeight: 1.4 }}>
        ✓
      </span>
      <span className="flex-1">{texte}</span>
      <button
        type="button"
        onClick={fermer}
        aria-label="Fermer"
        className="shrink-0 leading-none"
        style={{ color: "var(--adm-muted)" }}
      >
        ×
      </button>
    </div>
  );
}
