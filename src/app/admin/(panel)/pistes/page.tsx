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
  perdue: "var(--adm-line)",
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
          className="rounded border px-5 py-4 text-[length:var(--adm-t-md)]"
          style={{
            borderColor: "var(--adm-danger)",
            color: "var(--adm-danger)",
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
                className={`adm-btn ${actif ? "adm-btn-principal" : "adm-btn-neutre"}`}
                style={{ borderRadius: "999px", textDecoration: "none" }}
              >
                {a.filtres[cle]} · {compte(cle)}
              </Link>
            );
          })}
        </div>
      )}

      {!tableManquante && visibles.length === 0 && (
        <p className="rounded border border-dashed border-[color:var(--adm-line)] px-5 py-10 text-center text-[length:var(--adm-t-md)] text-[color:var(--adm-muted)]">
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
    <li className="adm-carte p-4">
      {/*
        Le numéro passe en tête, seul sur sa ligne et à la taille d'une saisie :
        c'est la seule chose qu'on vient chercher ici, et on la touche au pouce.
        Il était auparavant coincé entre une pastille d'état et trois étiquettes.
      */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: TEINTE[piste.status] }}
        />
        <div className="min-w-0 flex-1">
          <a
            href={"tel:" + piste.phone.replace(/\s/g, "")}
            dir="ltr"
            className="data inline-flex items-center underline underline-offset-4"
            style={{ fontSize: "var(--adm-t-lg)", minHeight: "var(--adm-h)" }}
          >
            {piste.phone}
          </a>
          <p style={{ fontSize: "var(--adm-t-md)" }}>
            {piste.customer_name || a.sansNom}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {piste.wilaya && (
              <span className="adm-pastille adm-pastille-nue">{piste.wilaya}</span>
            )}
            {piste.source && (
              <span className="adm-pastille adm-pastille-nue">{piste.source}</span>
            )}
            <span
              className="data"
              style={{ fontSize: "var(--adm-t-xs)", color: "var(--adm-muted)" }}
            >
              {quand}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- le panier laissé */}
      <div
        className="mt-3 border-t pt-3"
        style={{ borderColor: "var(--adm-line)" }}
      >
        <ul className="space-y-1">
          {piste.items.map((i, n) => (
            <li
              key={n}
              className="flex justify-between gap-3"
              style={{ fontSize: "var(--adm-t-sm)" }}
            >
              <span style={{ color: "var(--adm-muted)" }}>
                {i.product_name} {i.size_label} &times; {i.quantity}
              </span>
              <span className="data shrink-0">{da(i.line_total, devise)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between gap-3">
          <span className="adm-etiquette mb-0">{a.total}</span>
          <span
            className="data"
            style={{ fontSize: "var(--adm-t-md)", fontWeight: 500 }}
          >
            {da(piste.total, devise)}
          </span>
        </p>
      </div>

      {(piste.address || piste.note) && (
        <div className="mt-2.5" style={{ fontSize: "var(--adm-t-sm)", color: "var(--adm-muted)" }}>
          {piste.address && <p>{piste.address}</p>}
          {piste.note && <p>&laquo;&nbsp;{piste.note}&nbsp;&raquo;</p>}
        </div>
      )}

      {/*
        Deux gestes distincts, et c'est voulu.

        « Rappelé » dit qu'on a téléphoné. « A commandé » dit que l'appel a donné
        une vente — une commande prise au téléphone n'entre pas par le site, donc
        rien ne peut la marquer automatiquement. Sans ce second bouton, une piste
        conclue restait indéfiniment dans la liste d'appels.

        La suppression est reléguée en bout de rangée, à l'écart des deux autres.
      */}
      <div
        className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
        style={{ borderColor: "var(--adm-line)" }}
      >
        {piste.status !== "convertie" && (
          <Statut
            id={piste.id}
            valeur={piste.status === "rappelee" ? "ouverte" : "rappelee"}
            libelle={
              piste.status === "rappelee" ? a.marquerNonRappelee : a.marquerRappelee
            }
          />
        )}
        {piste.status !== "convertie" ? (
          <Statut
            id={piste.id}
            valeur="convertie"
            libelle={a.marquerCommande}
            variante="principal"
          />
        ) : (
          <Statut id={piste.id} valeur="ouverte" libelle={a.annulerCommande} />
        )}

        <span className="ms-auto">
          <FormAction action={supprimerPiste}>
            <input type="hidden" name="id" value={piste.id} />
            <Envoyer variante="danger" confirmer={a.confirmSuppr}>
              {t.admin.commun.supprimer}
            </Envoyer>
          </FormAction>
        </span>
      </div>
    </li>
  );
}

function Statut({
  id,
  valeur,
  libelle,
  variante,
}: {
  id: string;
  valeur: ProspectStatus;
  libelle: string;
  variante?: "principal" | "neutre";
}) {
  return (
    <FormAction action={changerStatutPiste}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={valeur} />
      <Envoyer variante={variante}>{libelle}</Envoyer>
    </FormAction>
  );
}
