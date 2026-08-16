import Link from "next/link";
import { Envoyer, FormAction } from "@/components/admin/Champs";
import { EnTetePage } from "@/components/admin/Volet";
import { changerStatutPiste, supprimerPiste } from "@/lib/actions";
import { getProspects } from "@/lib/data";
import { da } from "@/lib/format";
import { getT } from "@/i18n/server";
import type { Prospect, ProspectStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TEINTE: Record<ProspectStatus, string> = {
  ouverte: "var(--or-plein)",
  rappelee: "var(--accent)",
  convertie: "#2f9e63",
  perdue: "var(--comptoir-line)",
};

/**
 * Les paniers laissés en route.
 *
 * Le pixel disait qu'une part des visiteurs remplissait le bon puis repartait.
 * Ces gens-là avaient donné de quoi être joints : ils manquaient seulement
 * d'un coup de fil. Cette page les rassemble, du plus récent au plus ancien.
 *
 * Par défaut, seules celles qui restent à rappeler. Les autres se retrouvent
 * par les filtres : on vient ici pour travailler une liste d'appels, pas pour
 * relire l'historique.
 */
type Filtre = "tous" | "ouverte" | "rappelee" | "convertie";
const FILTRES: Filtre[] = ["tous", "ouverte", "rappelee", "convertie"];

export default async function Pistes({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { t, locale } = await getT();
  const { f } = await searchParams;
  const filtre: Filtre = FILTRES.includes(f as Filtre) ? (f as Filtre) : "ouverte";

  const { pistes, tableManquante } = await getProspects();
  const a = t.admin.pistes;
  const devise = t.unites.devise;

  const compte = (cle: Filtre) =>
    cle === "tous" ? pistes.length : pistes.filter((p) => p.status === cle).length;
  const visibles =
    filtre === "tous" ? pistes : pistes.filter((p) => p.status === filtre);

  return (
    <div>
      <EnTetePage eyebrow={a.eyebrow} titre={a.titre} aide={a.aide} />

      {tableManquante && (
        <p
          className="rounded border px-5 py-4 text-[13.5px]"
          style={{
            borderColor: "var(--danger)",
            color: "var(--danger)",
            background: "color-mix(in srgb, var(--danger) 7%, transparent)",
          }}
        >
          {a.tableManquante}
        </p>
      )}

      {/*
        Filtrer plutôt qu'empiler. Les rappelées et les converties restent
        consultables mais ne s'intercalent plus dans la liste de travail : on
        vient ici pour savoir qui reste à appeler.
      */}
      {!tableManquante && pistes.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTRES.map((cle) => {
            const actif = cle === filtre;
            return (
              <Link
                key={cle}
                href={cle === "ouverte" ? "/admin/pistes" : `/admin/pistes?f=${cle}`}
                aria-current={actif ? "page" : undefined}
                className="eyebrow rounded-full border px-3 py-1.5 text-[10px] transition-colors"
                style={{
                  borderColor: actif ? "var(--comptoir-fg)" : "var(--comptoir-line)",
                  background: actif ? "var(--comptoir-fg)" : "transparent",
                  color: actif ? "var(--comptoir-surface)" : "var(--comptoir-muted)",
                }}
              >
                {a.filtres[cle]} · {compte(cle)}
              </Link>
            );
          })}
        </div>
      )}

      {!tableManquante && visibles.length === 0 && (
        <p className="rounded border border-dashed border-trait px-5 py-10 text-center text-[14px] text-graphite-doux">
          {pistes.length === 0 ? a.vide : a.videFiltre}
        </p>
      )}

      {visibles.length > 0 && (
        <ul className="space-y-2.5">
          {visibles.map((p) => (
            <LignePiste key={p.id} piste={p} t={t} devise={devise} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LignePiste({
  piste,
  t,
  devise,
  locale,
}: {
  piste: Prospect;
  t: Awaited<ReturnType<typeof getT>>["t"];
  devise: string;
  locale: string;
}) {
  const a = t.admin.pistes;
  const quand = new Date(piste.updated_at).toLocaleString(
    locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-DZ",
    { dateStyle: "short", timeStyle: "short" },
  );

  return (
    <li
      className="rounded-[10px] border border-trait p-4"
      style={{ background: "var(--comptoir-surface)" }}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: TEINTE[piste.status] }}
        />
        {/*
          Le numéro d'abord, en gros et cliquable : c'est la seule chose qu'on
          vient chercher sur cette page.
        */}
        <a
          href={`tel:${piste.phone.replace(/\s/g, "")}`}
          dir="ltr"
          className="data text-[16px] underline underline-offset-4"
        >
          {piste.phone}
        </a>
        <span className="text-[14px]">{piste.customer_name || a.sansNom}</span>
        {piste.wilaya && (
          <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
            {piste.wilaya}
          </span>
        )}
        <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
          {t.achat[piste.purchase_type]}
        </span>
        {piste.source && (
          <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
            {piste.source}
          </span>
        )}
        <span className="data ms-auto text-[13px] text-graphite-doux">{quand}</span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-trait pt-3">
        {piste.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3 text-[13px]">
            <span className="text-graphite-doux">
              {i.product_name} {i.size_label} × {i.quantity}
            </span>
            <span className="data shrink-0">{da(i.line_total, devise)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 border-t border-trait pt-1.5 text-[13.5px]">
          <span className="eyebrow text-graphite-doux">{a.total}</span>
          <span className="data">{da(piste.total, devise)}</span>
        </li>
      </ul>

      {piste.address && (
        <p className="mt-2 text-[12.5px] text-graphite-doux">{piste.address}</p>
      )}
      {piste.note && (
        <p className="mt-1 text-[12.5px] text-graphite-doux">« {piste.note} »</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/*
          Un seul interrupteur : appelée, ou pas encore. Une piste convertie a
          commandé — plus rien à cocher, la question ne se pose plus.
        */}
        {piste.status !== "convertie" && (
          <Statut
            id={piste.id}
            valeur={piste.status === "rappelee" ? "ouverte" : "rappelee"}
            libelle={
              piste.status === "rappelee" ? a.marquerNonRappelee : a.marquerRappelee
            }
          />
        )}
        <FormAction action={supprimerPiste}>
          <input type="hidden" name="id" value={piste.id} />
          <Envoyer variante="danger" confirmer={a.confirmSuppr}>
            {t.admin.commun.supprimer}
          </Envoyer>
        </FormAction>
      </div>
    </li>
  );
}

function Statut({
  id,
  valeur,
  libelle,
}: {
  id: string;
  valeur: ProspectStatus;
  libelle: string;
}) {
  return (
    <FormAction action={changerStatutPiste}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={valeur} />
      <Envoyer>{libelle}</Envoyer>
    </FormAction>
  );
}
