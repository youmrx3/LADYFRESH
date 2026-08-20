"use client";

import { useMemo } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { CartePack } from "./CartePack";
import { CarteProduit } from "./CarteProduit";
import { useReglages } from "./Reglages";
import { nomTypeCourt } from "@/i18n/contenu";

/**
 * La section d'achat.
 *
 * Ce qu'elle montre dépend du réglage `mode_boutique` : les coffrets, ou le
 * catalogue à l'unité. Un seul réglage, décidé au back-office, plutôt qu'un
 * choix posé au visiteur — la campagne sait ce qu'elle vend, la cliente n'a pas
 * à trancher avant de voir un prix.
 *
 * Les filtres n'apparaissent qu'en mode produits, et seulement s'il y a
 * réellement de quoi filtrer : six coffrets n'ont pas besoin d'un filtre, et
 * une rangée de boutons inutiles pousse la marchandise hors de l'écran.
 */
export function Boutique() {
  const {
    mode,
    packs,
    products,
    gammes,
    types,
    filtreType,
    setFiltreType,
    filtreCouleur,
    setFiltreCouleur,
  } = useBoutique();
  const { t, locale } = useReglages();

  const indexGammes = useMemo(
    () => new Map(gammes.map((g) => [g.id, g])),
    [gammes],
  );

  const visibles = useMemo(() => {
    return products.filter((p) => {
      if (filtreType !== "tous" && p.type_id !== filtreType) return false;
      if (filtreCouleur !== "tous" && p.gamme_id !== filtreCouleur) return false;
      return true;
    });
  }, [products, filtreType, filtreCouleur]);

  if (mode === "packs") {
    return (
      <section id="boutique" className="etage-comptoir saut-ancre py-14 sm:py-20">
        <div className="shell">
          <p className="eyebrow text-graphite-doux">{t.packs.eyebrow}</p>
          <h2 className="display display-l mt-2.5">{t.packs.titre}</h2>
          <p className="lede mt-3 max-w-[46ch] text-graphite-doux">
            {t.packs.lede}
          </p>

          {packs.length === 0 ? (
            <p className="mt-8 rounded border border-dashed border-trait px-5 py-12 text-center text-[14px] text-graphite-doux">
              {t.packs.vide}
            </p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packs.map((pack) => (
                <CartePack key={pack.id} pack={pack} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="boutique" className="etage-comptoir saut-ancre py-14 sm:py-20">
      <div className="shell">
        <p className="eyebrow text-graphite-doux">{t.boutique.eyebrow}</p>
        <h2 className="display display-l mt-2.5">{t.boutique.titre}</h2>

        {(types.length > 1 || gammes.length > 1) && (
          <div className="mt-6 flex flex-col gap-2.5">
            {types.length > 1 && (
              <Filtres
                label={t.boutique.filtreProduit}
                valeur={filtreType}
                poser={setFiltreType}
                tout={t.boutique.tous}
                options={types.map((x) => ({
                  id: x.id,
                  nom: nomTypeCourt(x, locale),
                }))}
              />
            )}
            {gammes.length > 1 && (
              <Filtres
                label={t.boutique.filtreCouleur}
                valeur={filtreCouleur}
                poser={setFiltreCouleur}
                tout={t.boutique.toutes}
                options={gammes.map((g) => ({
                  id: g.id,
                  nom: g.name,
                  teinte: g.color_hex,
                }))}
              />
            )}
          </div>
        )}

        {visibles.length === 0 ? (
          <div className="mt-8 rounded border border-dashed border-trait px-5 py-12 text-center">
            <p className="text-[15px]">{t.boutique.videTitre}</p>
            <button
              type="button"
              onClick={() => {
                setFiltreType("tous");
                setFiltreCouleur("tous");
              }}
              className="eyebrow mt-4 text-or underline underline-offset-4"
            >
              {t.boutique.toutAfficher}
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {visibles.map((product) => (
              <CarteProduit
                key={product.id}
                product={product}
                gamme={indexGammes.get(product.gamme_id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Filtres({
  label,
  valeur,
  poser,
  tout,
  options,
}: {
  label: string;
  valeur: string;
  poser: (v: string) => void;
  tout: string;
  options: { id: string; nom: string; teinte?: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="eyebrow me-1 text-[9.5px] text-graphite-doux">{label}</span>
      <Puce actif={valeur === "tous"} onClick={() => poser("tous")}>
        {tout}
      </Puce>
      {options.map((o) => (
        <Puce key={o.id} actif={valeur === o.id} onClick={() => poser(o.id)}>
          {o.teinte && (
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: o.teinte }}
            />
          )}
          {o.nom}
        </Puce>
      ))}
    </div>
  );
}

function Puce({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className="eyebrow inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9.5px] transition-colors"
      style={{
        borderColor: actif ? "var(--comptoir-fg)" : "var(--comptoir-line)",
        background: actif ? "var(--comptoir-fg)" : "transparent",
        color: actif ? "var(--comptoir-surface)" : "var(--comptoir-muted)",
      }}
    >
      {children}
    </button>
  );
}
