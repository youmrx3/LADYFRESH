"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { lineTotal, piecesFor, unitPrice } from "@/lib/format";
import type {
  Gamme,
  Product,
  ProductType,
  PurchaseType,
  SiteSettings,
  Variant,
} from "@/lib/types";

export type DocketLine = {
  variantId: string;
  quantity: number;
  product: Product;
  variant: Variant;
  gamme: Gamme | undefined;
  /** Cartons or pieces, depending on the purchase type. */
  pieces: number;
  unit: number;
  total: number;
};

type Boutique = {
  products: Product[];
  gammes: Gamme[];
  types: ProductType[];
  settings: SiteSettings;
  purchase: PurchaseType;
  setPurchase: (value: PurchaseType) => void;
  /** null until the visitor has chosen; the shop stays locked meanwhile. */
  purchaseChosen: boolean;
  lines: DocketLine[];
  quantityOf: (variantId: string) => number;
  setQuantity: (variantId: string, quantity: number) => void;
  add: (variantId: string, quantity: number) => void;
  clear: () => void;
  pieceCount: number;
  /** Total en cartons ; n'a de sens qu'en gros. */
  cartonCount: number;
  total: number;
  /** Minimum quantity for one line, in the unit currently in play. */
  minQuantity: number;
  meetsMinimum: boolean;
  /** Les filtres vivent ici pour que la bande des gammes puisse les piloter. */
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  colorFilter: string;
  setColorFilter: (value: string) => void;
};

const Ctx = createContext<Boutique | null>(null);

const STORAGE_KEY = "ladyfresh.docket.v1";

export function BoutiqueProvider({
  products,
  gammes,
  types,
  settings,
  children,
}: {
  products: Product[];
  gammes: Gamme[];
  types: ProductType[];
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  const [purchase, setPurchaseState] = useState<PurchaseType>("demi_gros");
  const [purchaseChosen, setPurchaseChosen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("tous");
  const [colorFilter, setColorFilter] = useState("tous");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          purchase?: PurchaseType;
          chosen?: boolean;
          quantities?: Record<string, number>;
        };
        if (saved.purchase) setPurchaseState(saved.purchase);
        if (saved.chosen) setPurchaseChosen(true);
        if (saved.quantities) setQuantities(saved.quantities);
      }
    } catch {
      // A corrupt docket is not worth blocking the shop over.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ purchase, chosen: purchaseChosen, quantities }),
    );
  }, [purchase, purchaseChosen, quantities, hydrated]);

  const variantIndex = useMemo(() => {
    const map = new Map<string, { product: Product; variant: Variant }>();
    for (const product of products) {
      for (const variant of product.variants) {
        map.set(variant.id, { product, variant });
      }
    }
    return map;
  }, [products]);

  const gammeIndex = useMemo(
    () => new Map(gammes.map((g) => [g.id, g])),
    [gammes],
  );

  const minQuantity =
    purchase === "gros"
      ? Math.max(1, settings.min_gros_cartons)
      : Math.max(1, settings.min_demi_gros_pieces);

  /** Switching unit invalidates every quantity — cartons are not pieces. */
  const setPurchase = useCallback((value: PurchaseType) => {
    setPurchaseState((current) => {
      if (current !== value) setQuantities({});
      return value;
    });
    setPurchaseChosen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setQuantities((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[variantId];
      else next[variantId] = quantity;
      return next;
    });
  }, []);

  const add = useCallback((variantId: string, quantity: number) => {
    setQuantities((current) => ({
      ...current,
      [variantId]: (current[variantId] ?? 0) + quantity,
    }));
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const lines = useMemo<DocketLine[]>(() => {
    return Object.entries(quantities)
      .map(([variantId, quantity]) => {
        const entry = variantIndex.get(variantId);
        if (!entry) return null;
        const { product, variant } = entry;
        return {
          variantId,
          quantity,
          product,
          variant,
          gamme: gammeIndex.get(product.gamme_id),
          pieces: piecesFor(variant, purchase, quantity),
          unit: unitPrice(variant, purchase),
          total: lineTotal(variant, purchase, quantity),
        };
      })
      .filter((l): l is DocketLine => l !== null)
      .sort((a, b) => a.product.sort_order - b.product.sort_order);
  }, [quantities, variantIndex, gammeIndex, purchase]);

  const pieceCount = lines.reduce((sum, l) => sum + l.pieces, 0);
  // En gros, la quantité saisie est un nombre de cartons.
  const cartonCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + l.total, 0);

  /**
   * Le minimum porte sur chaque référence, dans les deux modes.
   *
   * Le demi-gros comptait auparavant sur l'ensemble de la commande : deux
   * pièces d'une gamme et trois d'une autre suffisaient. Le minimum s'applique
   * désormais ligne par ligne — cinq pièces d'un même produit — ce qui rend
   * aussi le pas-à-pas cohérent, une ligne ne pouvant plus descendre sous un
   * seuil qui n'existait qu'au niveau du total.
   */
  const meetsMinimum =
    lines.length > 0 && lines.every((l) => l.quantity >= minQuantity);

  const value: Boutique = {
    products,
    gammes,
    types,
    settings,
    purchase,
    setPurchase,
    purchaseChosen,
    lines,
    quantityOf: (variantId) => quantities[variantId] ?? 0,
    setQuantity,
    add,
    clear,
    pieceCount,
    cartonCount,
    total,
    minQuantity,
    meetsMinimum,
    typeFilter,
    setTypeFilter,
    colorFilter,
    setColorFilter,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBoutique() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBoutique must be used inside BoutiqueProvider");
  return ctx;
}
