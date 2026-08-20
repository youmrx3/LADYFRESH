"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { lineTotal, unitPrice } from "@/lib/format";
import type {
  Gamme,
  ModeBoutique,
  Pack,
  Product,
  ProductType,
  SiteSettings,
  Variant,
} from "@/lib/types";

/**
 * Le bon de commande.
 *
 * Il porte deux natures d'article — un format de produit, ou un coffret — et
 * les traite pareil une fois dans le bon : un nom, une photo, un prix unitaire,
 * une quantité. C'est ce qui permet au récapitulatif et à l'email de n'avoir
 * qu'un seul rendu, et à la commande de n'avoir qu'un seul format d'envoi.
 *
 * La vente est au détail : plus de gros ni de demi-gros, plus de sélecteur
 * avant de voir un prix. Le minimum par référence reste réglable — un pour de
 * la vente ordinaire, davantage pour décourager la commande isolée.
 */

/** Clé d'une ligne : l'identifiant du format, ou `pack:<id>` pour un coffret. */
export type CleLigne = string;

export type LigneBon = {
  cle: CleLigne;
  kind: "produit" | "pack";
  /** Identifiant côté serveur : format ou coffret. */
  id: string;
  quantity: number;
  nom: string;
  /** Le format pour un produit, l'accroche pour un coffret. */
  detail: string;
  image: string;
  couleur: string;
  unit: number;
  total: number;
};

type Boutique = {
  mode: ModeBoutique;
  packs: Pack[];
  products: Product[];
  gammes: Gamme[];
  types: ProductType[];
  settings: SiteSettings;
  lignes: LigneBon[];
  quantiteDe: (cle: CleLigne) => number;
  poser: (cle: CleLigne, quantity: number) => void;
  vider: () => void;
  /** Minimum d'une ligne : réglable pour un produit, toujours 1 pour un coffret. */
  minimumDe: (cle: CleLigne) => number;
  nombreArticles: number;
  total: number;
  /** Les filtres vivent ici : la grille et les puces de gamme les partagent. */
  filtreType: string;
  setFiltreType: (v: string) => void;
  filtreCouleur: string;
  setFiltreCouleur: (v: string) => void;
};

const Ctx = createContext<Boutique | null>(null);

const STOCKAGE = "ladyfresh.bon.v2";

export const clePack = (id: string) => `pack:${id}`;
export const estPack = (cle: CleLigne) => cle.startsWith("pack:");

export function BoutiqueProvider({
  mode,
  packs,
  products,
  gammes,
  types,
  settings,
  children,
}: {
  mode: ModeBoutique;
  packs: Pack[];
  products: Product[];
  gammes: Gamme[];
  types: ProductType[];
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  const [hydrate, setHydrate] = useState(false);
  const [filtreType, setFiltreType] = useState("tous");
  const [filtreCouleur, setFiltreCouleur] = useState("tous");

  useEffect(() => {
    try {
      const brut = localStorage.getItem(STOCKAGE);
      if (brut) setQuantites(JSON.parse(brut) as Record<string, number>);
    } catch {
      // Un bon illisible ne vaut pas de fermer la boutique.
    }
    setHydrate(true);
  }, []);

  useEffect(() => {
    if (!hydrate) return;
    try {
      localStorage.setItem(STOCKAGE, JSON.stringify(quantites));
    } catch {
      // Navigation privée : le bon vit le temps de la visite.
    }
  }, [quantites, hydrate]);

  const indexVariantes = useMemo(() => {
    const map = new Map<string, { product: Product; variant: Variant }>();
    for (const product of products)
      for (const variant of product.variants)
        map.set(variant.id, { product, variant });
    return map;
  }, [products]);

  const indexPacks = useMemo(
    () => new Map(packs.map((p) => [p.id, p])),
    [packs],
  );

  const indexGammes = useMemo(
    () => new Map(gammes.map((g) => [g.id, g])),
    [gammes],
  );

  const minProduit = Math.max(1, settings.min_produit || 1);

  const minimumDe = useCallback(
    (cle: CleLigne) => (estPack(cle) ? 1 : minProduit),
    [minProduit],
  );

  const poser = useCallback((cle: CleLigne, quantity: number) => {
    setQuantites((actuel) => {
      const suite = { ...actuel };
      if (quantity <= 0) delete suite[cle];
      else suite[cle] = quantity;
      return suite;
    });
  }, []);

  const vider = useCallback(() => setQuantites({}), []);

  const lignes = useMemo<LigneBon[]>(() => {
    return Object.entries(quantites)
      .map(([cle, quantity]) => {
        if (estPack(cle)) {
          const pack = indexPacks.get(cle.slice(5));
          if (!pack) return null;
          return {
            cle,
            kind: "pack" as const,
            id: pack.id,
            quantity,
            nom: pack.name,
            detail: pack.tagline,
            image: pack.image,
            couleur: "var(--or-plein)",
            unit: pack.price,
            total: pack.price * quantity,
          };
        }

        const entree = indexVariantes.get(cle);
        if (!entree) return null;
        const { product, variant } = entree;
        return {
          cle,
          kind: "produit" as const,
          id: variant.id,
          quantity,
          nom: product.name || product.slug,
          detail: variant.size_label,
          image: variant.image || product.image,
          couleur: indexGammes.get(product.gamme_id)?.color_hex ?? "var(--or-plein)",
          unit: unitPrice(variant),
          total: lineTotal(variant, quantity),
        };
      })
      .filter((l): l is LigneBon => l !== null);
  }, [quantites, indexVariantes, indexPacks, indexGammes]);

  const nombreArticles = lignes.reduce((s, l) => s + l.quantity, 0);
  const total = lignes.reduce((s, l) => s + l.total, 0);

  const value: Boutique = {
    mode,
    packs,
    products,
    gammes,
    types,
    settings,
    lignes,
    quantiteDe: (cle) => quantites[cle] ?? 0,
    poser,
    vider,
    minimumDe,
    nombreArticles,
    total,
    filtreType,
    setFiltreType,
    filtreCouleur,
    setFiltreCouleur,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBoutique() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBoutique doit être utilisé dans BoutiqueProvider");
  return ctx;
}
